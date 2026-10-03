// AI Bridal Studio: "try on an existing dress" with fal.ai's virtual
// try-on, for signed-in eInvite.me clients (and the admin).
//
// - Every request goes through this server; the browser never talks to fal
//   and never sees FAL_KEY (see ./fal.js).
// - The bride's photo and the dress photo are only passed to fal for the
//   one preview; this server doesn't keep them. The preview is kept in a
//   PRIVATE storage bucket, only its owner can open it, and it's deleted
//   after the retention period or when she deletes it.
// - Attempts are limited per person per day and per month, plus a daily
//   cap for everyone together, and every attempt is logged with its cost
//   in this feature's own usage record.
// - Dress shops and their catalogs are managed by the admin. A dress link
//   is only read from shops the admin marked as allowing it, and only
//   through ./safe-fetch.js.
//
// This is NOT a dress designer: the try-on model only dresses a person in
// a dress from a photo. "Design a new dress" is a separate, future feature.

import express from "express";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { runTryOn, downloadResult, falConfigured, FalError, TRY_ON_MODEL } from "./fal.js";
import { safeGet, safeGetImage, imageType, extractProduct, checkLink, FetchRefused } from "./safe-fetch.js";

const SHOPS_KEY = "einvite:bridal-shops";
const USAGE_KEY = "einvite:bridal-usage";
const resultsKey = (owner) => `einvite:bridal-results-${owner}`;
const BUCKET = "bridal-studio";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const num = (v, d) => (Number.isFinite(Number(v)) && String(v).trim() !== "" ? Number(v) : d);
export function bridalSettings(env = process.env) {
  return {
    dailyLimit: num(env.BRIDAL_DAILY_LIMIT, 5),
    monthlyLimit: num(env.BRIDAL_MONTHLY_LIMIT, 30),
    globalDailyLimit: num(env.BRIDAL_GLOBAL_DAILY_LIMIT, 200),
    priceUsd: num(env.BRIDAL_PRICE_USD, 0.04), // fal's listed price per try-on image
    retentionDays: num(env.BRIDAL_RETENTION_DAYS, 30),
  };
}

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const month = (t = Date.now()) => new Date(t).toISOString().slice(0, 7);
const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const shortId = () => randomUUID().replace(/-/g, "").slice(0, 12);

class UserError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Decodes a data: URI the browser sent and checks it's really an image.
function decodeImage(dataUri, what) {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUri || ""));
  if (!m) throw new UserError(`Please choose ${what} as a JPEG, PNG or WebP photo.`);
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_UPLOAD_BYTES) throw new UserError(`${what[0].toUpperCase()}${what.slice(1)} is too large (10 MB at most).`);
  const type = imageType(buf);
  if (!type) throw new UserError(`${what[0].toUpperCase()}${what.slice(1)} isn't a JPEG, PNG or WebP image.`);
  return { buf, type };
}
const toDataUri = ({ buf, type }) => `data:${type};base64,${buf.toString("base64")}`;

// One write at a time per key, so counters and lists don't lose updates.
function makeLocks() {
  const chains = new Map();
  return (key, fn) => {
    const run = (chains.get(key) || Promise.resolve()).then(fn, fn);
    chains.set(key, run.catch(() => {}));
    return run;
  };
}

// Normalises a dress coming from the admin form now, or later from a
// shop's CSV, product feed or API (`source`, `externalId`).
// https links, or this site's own uploaded photos.
const okLink = (url, own) => /^https:\/\/[^\s]+$/.test(url) || (!!own && url.startsWith(own) && !/\s/.test(url));

export function normalizeDress(d, prev = {}, own = "") {
  const imageUrl = clean(d.imageUrl ?? prev.imageUrl, 1000);
  const productUrl = clean(d.productUrl ?? prev.productUrl, 1000);
  for (const [label, url] of [["image", imageUrl], ["product page", productUrl]]) {
    if (url && !okLink(url, own)) throw new UserError(`The ${label} link must start with https://`);
  }
  if (!imageUrl) throw new UserError("A dress needs a photo.");
  const priceRaw = d.price ?? prev.price;
  const price = priceRaw === "" || priceRaw === null || priceRaw === undefined ? null : Number(priceRaw);
  if (price !== null && !(price >= 0 && price < 1e7)) throw new UserError("The price must be a number.");
  return {
    id: prev.id || shortId(),
    name: clean(d.name ?? prev.name, 120) || "Dress",
    imageUrl, productUrl: productUrl || null, price,
    currency: clean(d.currency ?? prev.currency ?? "USD", 8).toUpperCase() || "USD",
    active: d.active === undefined ? prev.active !== false : !!d.active,
    source: clean(d.source ?? prev.source ?? "manual", 20),
    externalId: clean(d.externalId ?? prev.externalId ?? "", 120) || null,
    updatedAt: Date.now(),
  };
}

export function normalizeShop(s, prev = {}, own = "") {
  const website = clean(s.website ?? prev.website, 500);
  const logoUrl = clean(s.logoUrl ?? prev.logoUrl, 1000);
  if (website && !/^https:\/\/[^\s]+$/.test(website)) throw new UserError("The website must start with https://");
  if (logoUrl && !okLink(logoUrl, own)) throw new UserError("The logo link must start with https://");
  // Sites a dress link may be read from: only when the shop allowed using
  // its product photos. The website's own domain is included.
  const rawDomains = s.linkDomains ?? prev.linkDomains ?? [];
  const domains = [...new Set((Array.isArray(rawDomains) ? rawDomains : String(rawDomains).split(/[\s,]+/))
    .map((x) => String(x || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, ""))
    .filter((x) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x)))].slice(0, 10);
  if (website) { try { const h = new URL(website).hostname.toLowerCase().replace(/^www\./, ""); if (!domains.includes(h)) domains.unshift(h); } catch {} }
  const name = clean(s.name ?? prev.name, 100);
  if (!name) throw new UserError("A shop needs a name.");
  return {
    id: prev.id || shortId(),
    name, website: website || null, logoUrl: logoUrl || null,
    active: s.active === undefined ? prev.active !== false : !!s.active,
    linkImport: s.linkImport === undefined ? !!prev.linkImport : !!s.linkImport,
    linkDomains: domains,
    // Where a future automatic import would read from; nothing reads it yet.
    importSource: s.importSource === undefined ? prev.importSource || null : (s.importSource && ["csv", "feed", "api"].includes(s.importSource.type) ? { type: s.importSource.type, url: clean(s.importSource.url, 1000) || null } : null),
    dresses: prev.dresses || [],
    updatedAt: Date.now(),
  };
}

const publicShop = (s) => ({
  id: s.id, name: s.name, website: s.website, logoUrl: s.logoUrl, linkImport: !!s.linkImport, linkDomains: s.linkImport ? s.linkDomains : [],
  dresses: (s.dresses || []).filter((d) => d.active !== false).map((d) => ({ id: d.id, name: d.name, imageUrl: d.imageUrl, productUrl: d.productUrl, price: d.price, currency: d.currency })),
});

export function createBridalStudio(deps) {
  const { requestRole, findUser, kvRead, kvWrite, kvListKeys, storage, uploadPublicImage, secret, log = console, ownImagePrefix = "" } = deps;
  // Photos already stored on this site are read directly; anything else
  // only through the guarded fetch. (Both can be swapped in tests.)
  const fetchPage = deps.safeGet || safeGet;
  const fetchImage = async (url) => (deps.readOwnImage && (await deps.readOwnImage(url))) || (deps.safeGetImage || safeGetImage)(url);
  const settings = () => bridalSettings();
  const lock = makeLocks();
  const tokenKey = createHmac("sha256", secret).update("einvite-bridal-link").digest();
  const sign = (body) => createHmac("sha256", tokenKey).update(body).digest("base64url");
  const readJson = async (key, fallback) => { const raw = await kvRead(key); try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };

  // --- who ----------------------------------------------------------------
  // The admin, or a signed-in client whose account is active.
  async function whoIs(req) {
    const who = requestRole(req);
    if (who.role === "admin") return { owner: "admin", isAdmin: true, name: "Admin" };
    if (who.role !== "client") return null;
    const user = await findUser(who.userId);
    if (!user || user.status !== "active") return null;
    return { owner: who.userId, isAdmin: false, name: user.name || "" };
  }
  const needUser = async (req) => {
    const me = await whoIs(req);
    if (!me) throw new UserError("Please log in to your eInvite.me account to use AI Bridal Studio.", 401);
    return me;
  };
  const needAdmin = (req) => { if (requestRole(req).role !== "admin") throw new UserError("Admins only.", 403); };

  // --- usage, limits and cost ----------------------------------------------
  const emptyUsage = () => ({ model: TRY_ON_MODEL, months: {}, days: {}, recent: [] });
  async function usage() { return { ...emptyUsage(), ...(await readJson(USAGE_KEY, emptyUsage())) }; }
  function countsFor(u, owner, t = Date.now()) {
    return {
      today: u.days?.[day(t)]?.byUser?.[owner] || 0,
      month: u.months?.[month(t)]?.byUser?.[owner]?.attempts || 0,
      everyoneToday: u.days?.[day(t)]?.total || 0,
    };
  }
  // Reserves one attempt (or says why not). Refunded if fal didn't bill it.
  function reserve(me) {
    return lock(USAGE_KEY, async () => {
      const u = await usage();
      const s = settings();
      const c = countsFor(u, me.owner);
      if (c.everyoneToday >= s.globalDailyLimit) throw new UserError("AI Bridal Studio has reached today's limit. Please try again tomorrow.", 429);
      if (!me.isAdmin && c.today >= s.dailyLimit) throw new UserError(`You've used today's ${s.dailyLimit} previews. You can try again tomorrow.`, 429);
      if (!me.isAdmin && c.month >= s.monthlyLimit) throw new UserError(`You've used this month's ${s.monthlyLimit} previews.`, 429);
      const d = day(), m = month();
      u.days[d] = u.days[d] || { total: 0, byUser: {} };
      u.days[d].total++; u.days[d].byUser[me.owner] = (u.days[d].byUser[me.owner] || 0) + 1;
      u.months[m] = u.months[m] || { attempts: 0, succeeded: 0, failed: 0, costUsd: 0, byUser: {} };
      const mu = (u.months[m].byUser[me.owner] = u.months[m].byUser[me.owner] || { attempts: 0, succeeded: 0, costUsd: 0 });
      u.months[m].attempts++; mu.attempts++;
      // keep the per-day counters for 40 days
      for (const k of Object.keys(u.days)) if (k < day(Date.now() - 40 * 86400000)) delete u.days[k];
      await kvWrite(USAGE_KEY, JSON.stringify(u));
    });
  }
  function settle(me, entry) {
    return lock(USAGE_KEY, async () => {
      const u = await usage();
      const d = day(), m = month();
      const mm = (u.months[m] = u.months[m] || { attempts: 0, succeeded: 0, failed: 0, costUsd: 0, byUser: {} });
      const mu = (mm.byUser[me.owner] = mm.byUser[me.owner] || { attempts: 0, succeeded: 0, costUsd: 0 });
      if (entry.ok) { mm.succeeded++; mu.succeeded++; } else mm.failed++;
      mm.costUsd = Math.round((mm.costUsd + entry.costUsd) * 10000) / 10000;
      mu.costUsd = Math.round((mu.costUsd + entry.costUsd) * 10000) / 10000;
      if (!entry.ok && !entry.billable) {
        // not billed by fal: give the attempt back
        if (u.days[d]?.byUser?.[me.owner]) { u.days[d].byUser[me.owner]--; u.days[d].total = Math.max(0, u.days[d].total - 1); }
        mu.attempts = Math.max(0, mu.attempts - 1);
      }
      u.recent = [{ at: Date.now(), owner: me.owner, ...entry }, ...(u.recent || [])].slice(0, 300);
      await kvWrite(USAGE_KEY, JSON.stringify(u));
    });
  }

  // --- results (private) ----------------------------------------------------
  async function myResults(owner) {
    const list = await readJson(resultsKey(owner), []);
    return Array.isArray(list) ? list.filter((r) => r.expiresAt > Date.now()) : [];
  }
  const publicResult = (r) => ({ id: r.id, createdAt: r.createdAt, expiresAt: r.expiresAt, imageUrl: `/api/bridal/results/${r.id}/image`, downloadUrl: `/api/bridal/results/${r.id}/image?download=1`, dress: r.dress });
  async function deleteResults(owner, ids) {
    return lock(resultsKey(owner), async () => {
      const list = await readJson(resultsKey(owner), []);
      const gone = list.filter((r) => !ids || ids.includes(r.id));
      for (const r of gone) await storage.remove(r.path).catch((e) => log.error("bridal: delete failed", e.message));
      await kvWrite(resultsKey(owner), JSON.stringify(list.filter((r) => !gone.includes(r))));
      return gone.length;
    });
  }
  // Deletes every preview past its retention, for everyone.
  async function sweepExpired() {
    for (const key of await kvListKeys("einvite:bridal-results-")) {
      const owner = key.slice("einvite:bridal-results-".length);
      const list = await readJson(key, []);
      const expired = list.filter((r) => !(r.expiresAt > Date.now())).map((r) => r.id);
      if (expired.length) await deleteResults(owner, expired);
    }
  }

  // --- shops ------------------------------------------------------------------
  const readShops = async () => { const d = await readJson(SHOPS_KEY, { shops: [] }); return Array.isArray(d.shops) ? d.shops : []; };
  const writeShops = (fn) => lock(SHOPS_KEY, async () => { const next = await fn(await readShops()); await kvWrite(SHOPS_KEY, JSON.stringify({ shops: next })); return next; });

  // --- dress links ------------------------------------------------------------
  // Which active shop allows reading links from this host, if any.
  function shopForHost(shops, host) {
    const h = host.toLowerCase().replace(/^www\./, "");
    return shops.find((s) => s.active !== false && s.linkImport && (s.linkDomains || []).some((d) => h === d || h.endsWith(`.${d}`)));
  }
  async function resolveLink(rawUrl) {
    let u;
    try { u = checkLink(rawUrl); } catch (e) { throw new UserError(e.message); }
    const shops = await readShops();
    const shop = shopForHost(shops, u.hostname);
    const unsupported = "This site isn't supported for links yet. You can upload a photo of the dress instead.";
    if (!shop) return { supported: false, message: unsupported, supportedShops: shops.filter((s) => s.active !== false && s.linkImport).map((s) => ({ name: s.name, domains: s.linkDomains })) };
    // A dress that's already in the shop's catalog: no need to fetch.
    const norm = (x) => { try { const v = new URL(x); return `${v.hostname.toLowerCase().replace(/^www\./, "")}${v.pathname.replace(/\/+$/, "").toLowerCase()}`; } catch { return null; } };
    const known = (shop.dresses || []).find((d) => d.active !== false && d.productUrl && norm(d.productUrl) === norm(u.toString()));
    if (known) return { supported: true, shop: { id: shop.id, name: shop.name }, dress: { source: "catalog", shopId: shop.id, dressId: known.id, name: known.name, imageUrl: known.imageUrl, productUrl: known.productUrl } };
    // Otherwise read the product page of that shop for its product photo.
    const page = await fetchPage(u.toString(), { allowHost: (h) => !!shopForHost([shop], h), maxBytes: 3 * 1024 * 1024, accept: "text/html,application/xhtml+xml" });
    if (!/html/.test(page.contentType)) throw new UserError("That link isn't a product page.");
    const found = extractProduct(page.body.toString("utf8"), page.url);
    if (!found.images.length) throw new UserError("Couldn't find the dress photo on that page. You can upload a photo of the dress instead.");
    // The image must really be an image; it may sit on the shop's CDN.
    const img = await fetchImage(found.images[0]);
    const body = Buffer.from(JSON.stringify({ i: found.images[0], s: shop.id, p: u.toString(), t: found.title, e: Date.now() + 30 * 60000 })).toString("base64url");
    return {
      supported: true, shop: { id: shop.id, name: shop.name },
      dress: { source: "link", token: `${body}.${sign(body)}`, name: found.title || "Dress", productUrl: u.toString(), preview: `data:${img.type};base64,${img.body.toString("base64")}` },
    };
  }
  function openLinkToken(token) {
    const [body, sig] = String(token || "").split(".");
    const a = Buffer.from(String(sig || "")), b = Buffer.from(sign(body || ""));
    if (!body || a.length !== b.length || !timingSafeEqual(a, b)) throw new UserError("Please choose the dress again.");
    const d = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!(d.e > Date.now())) throw new UserError("That dress link expired. Please paste it again.");
    return d;
  }

  // --- jobs -------------------------------------------------------------------
  const jobs = new Map(); // id -> { owner, status, startedAt, result?, error? }
  const MAX_RUNNING = 4;
  setInterval(() => { for (const [id, j] of jobs) if (Date.now() - j.startedAt > 3600000) jobs.delete(id); }, 600000).unref();
  setInterval(() => sweepExpired().catch((e) => log.error("bridal: sweep failed", e.message)), 6 * 3600000).unref();

  async function dressImage(dress) {
    if (dress?.type === "upload") return { image: decodeImage(dress.image, "the dress photo"), meta: { source: "upload", name: clean(dress.name, 120) || "Your dress" } };
    if (dress?.type === "catalog") {
      const shop = (await readShops()).find((s) => s.id === dress.shopId && s.active !== false);
      const d = shop?.dresses?.find((x) => x.id === dress.dressId && x.active !== false);
      if (!d) throw new UserError("That dress isn't available any more. Please choose another one.");
      const img = await fetchImage(d.imageUrl).catch(() => { throw new UserError("Couldn't load that dress photo. Please choose another dress."); });
      return { image: { buf: img.body, type: img.type }, meta: { source: "catalog", shopId: shop.id, shopName: shop.name, shopWebsite: shop.website, dressId: d.id, name: d.name, productUrl: d.productUrl, price: d.price, currency: d.currency } };
    }
    if (dress?.type === "link") {
      const t = openLinkToken(dress.token);
      const shop = (await readShops()).find((s) => s.id === t.s && s.active !== false && s.linkImport);
      if (!shop) throw new UserError("That shop isn't available any more. You can upload a photo of the dress instead.");
      const img = await fetchImage(t.i).catch(() => { throw new UserError("Couldn't load that dress photo. You can upload it instead."); });
      return { image: { buf: img.body, type: img.type }, meta: { source: "link", shopId: shop.id, shopName: shop.name, shopWebsite: shop.website, name: clean(t.t, 120) || "Dress", productUrl: t.p } };
    }
    throw new UserError("Please choose a dress.");
  }

  async function runJob(job, me, person, dress) {
    const started = Date.now();
    let fal = null;
    try {
      const d = await dressImage(dress);
      fal = await runTryOn({ personImage: toDataUri(person), dressImage: toDataUri(d.image) });
      const buf = await downloadResult(fal.imageUrl);
      const type = imageType(buf);
      if (!type) throw new FalError("result isn't an image", { billable: true });
      const id = shortId();
      const path = `${me.owner}/${id}.${type.split("/")[1]}`;
      await storage.put(path, buf, type);
      const record = { id, path, type, createdAt: Date.now(), expiresAt: Date.now() + settings().retentionDays * 86400000, dress: d.meta };
      await lock(resultsKey(me.owner), async () => {
        const list = await readJson(resultsKey(me.owner), []);
        await kvWrite(resultsKey(me.owner), JSON.stringify([record, ...list].slice(0, 100)));
      });
      job.status = "done";
      job.result = publicResult(record);
      await settle(me, { ok: true, billable: true, costUsd: settings().priceUsd, requestId: fal.requestId, seconds: Math.round((Date.now() - started) / 100) / 10, inferenceSeconds: fal.inferenceSeconds, dress: d.meta.source });
    } catch (e) {
      // A result fal produced is billed even if saving it here failed.
      const billable = !!fal || (e instanceof FalError && e.billable);
      job.status = "failed";
      job.error = e instanceof UserError ? e.message : e instanceof FalError ? e.userMessage : "The preview couldn't be made right now. Please try again in a moment.";
      log.error("bridal: try-on failed:", e instanceof FalError ? `fal ${e.status} ${e.message}` : e.message);
      await settle(me, { ok: false, billable, costUsd: billable ? settings().priceUsd : 0, requestId: fal?.requestId || null, seconds: Math.round((Date.now() - started) / 100) / 10, error: String(e.message || "").slice(0, 120), dress: dress?.type || null }).catch(() => {});
    }
  }

  // --- routes -----------------------------------------------------------------
  const r = express.Router();
  const h = (fn) => async (req, res) => {
    res.set("cache-control", "no-store");
    try { await fn(req, res); } catch (e) {
      if (e instanceof UserError || e instanceof FetchRefused) return res.status(e.status || 400).json({ error: e.message });
      log.error("bridal: request failed:", e.message);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };

  r.get("/api/bridal/config", h(async (req, res) => {
    const me = await whoIs(req);
    const s = settings();
    const out = { enabled: true, ready: falConfigured(), signedIn: !!me, name: me?.name || "", isAdmin: !!me?.isAdmin, limits: { daily: s.dailyLimit, monthly: s.monthlyLimit }, retentionDays: s.retentionDays };
    if (me) { const c = countsFor(await usage(), me.owner); out.used = { today: c.today, month: c.month }; }
    res.json(out);
  }));
  r.get("/api/bridal/shops", h(async (_req, res) => {
    res.json({ shops: (await readShops()).filter((s) => s.active !== false).map(publicShop) });
  }));
  r.post("/api/bridal/resolve-link", express.json({ limit: "4kb" }), h(async (req, res) => {
    await needUser(req);
    res.json(await resolveLink(req.body?.url));
  }));
  r.post("/api/bridal/try-on", express.json({ limit: "30mb" }), h(async (req, res) => {
    const me = await needUser(req);
    if (!falConfigured()) throw new UserError("AI Bridal Studio isn't set up yet.", 503);
    if (req.body?.consent !== true) throw new UserError("Please confirm you agree to your photos being sent to fal.ai to make the preview.");
    const person = decodeImage(req.body?.personImage, "your photo");
    const dress = req.body?.dress || {};
    if (dress.type === "upload") decodeImage(dress.image, "the dress photo");
    if (dress.type === "link") openLinkToken(dress.token);
    if (![...jobs.values()].every((j) => !(j.owner === me.owner && j.status === "running"))) throw new UserError("Your previous preview is still being made. Please wait for it.", 429);
    if ([...jobs.values()].filter((j) => j.status === "running").length >= MAX_RUNNING) throw new UserError("Lots of brides are trying dresses right now. Please try again in a minute.", 429);
    await reserve(me);
    const id = randomBytes(12).toString("base64url");
    const job = { owner: me.owner, status: "running", startedAt: Date.now() };
    jobs.set(id, job);
    runJob(job, me, person, dress);
    res.status(202).json({ jobId: id });
  }));
  r.get("/api/bridal/jobs/:id", h(async (req, res) => {
    const me = await needUser(req);
    const job = jobs.get(req.params.id);
    if (!job || job.owner !== me.owner) throw new UserError("Not found.", 404);
    res.json({ status: job.status, result: job.result || null, error: job.error || null });
  }));
  r.get("/api/bridal/results", h(async (req, res) => {
    const me = await needUser(req);
    res.json({ results: (await myResults(me.owner)).map(publicResult) });
  }));
  r.get("/api/bridal/results/:id/image", h(async (req, res) => {
    const me = await needUser(req);
    const rec = (await myResults(me.owner)).find((x) => x.id === req.params.id);
    if (!rec) throw new UserError("Not found.", 404);
    const buf = await storage.get(rec.path);
    res.set({ "content-type": rec.type, "cache-control": "private, no-store", "x-content-type-options": "nosniff" });
    if (req.query.download) res.set("content-disposition", `attachment; filename="einvite-bridal-preview-${rec.id}.${rec.type.split("/")[1]}"`);
    res.send(buf);
  }));
  r.delete("/api/bridal/results/:id", h(async (req, res) => {
    const me = await needUser(req);
    const n = await deleteResults(me.owner, [req.params.id]);
    if (!n) throw new UserError("Not found.", 404);
    res.json({ deleted: n });
  }));
  r.delete("/api/bridal/results", h(async (req, res) => {
    const me = await needUser(req);
    res.json({ deleted: await deleteResults(me.owner, null) });
  }));

  // admin: shops, dresses, usage
  r.get("/api/bridal/admin/shops", h(async (req, res) => { needAdmin(req); res.json({ shops: await readShops() }); }));
  r.post("/api/bridal/admin/shops", express.json({ limit: "32kb" }), h(async (req, res) => {
    needAdmin(req);
    let created;
    await writeShops((shops) => { created = normalizeShop(req.body || {}, {}, ownImagePrefix); return [...shops, created]; });
    res.status(201).json({ shop: created });
  }));
  r.patch("/api/bridal/admin/shops/:id", express.json({ limit: "32kb" }), h(async (req, res) => {
    needAdmin(req);
    let updated;
    await writeShops((shops) => shops.map((s) => (s.id === req.params.id ? (updated = normalizeShop(req.body || {}, s, ownImagePrefix)) : s)));
    if (!updated) throw new UserError("Shop not found.", 404);
    res.json({ shop: updated });
  }));
  r.delete("/api/bridal/admin/shops/:id", h(async (req, res) => {
    needAdmin(req);
    let found = false;
    await writeShops((shops) => shops.filter((s) => (s.id === req.params.id ? ((found = true), false) : true)));
    if (!found) throw new UserError("Shop not found.", 404);
    res.json({ ok: true });
  }));
  r.post("/api/bridal/admin/shops/:id/dresses", express.json({ limit: "32kb" }), h(async (req, res) => {
    needAdmin(req);
    let dress;
    await writeShops((shops) => shops.map((s) => (s.id === req.params.id ? { ...s, dresses: [...(s.dresses || []), (dress = normalizeDress(req.body || {}, {}, ownImagePrefix))].slice(0, 2000) } : s)));
    if (!dress) throw new UserError("Shop not found.", 404);
    res.status(201).json({ dress });
  }));
  r.patch("/api/bridal/admin/shops/:id/dresses/:dressId", express.json({ limit: "32kb" }), h(async (req, res) => {
    needAdmin(req);
    let dress;
    await writeShops((shops) => shops.map((s) => (s.id === req.params.id ? { ...s, dresses: (s.dresses || []).map((d) => (d.id === req.params.dressId ? (dress = normalizeDress(req.body || {}, d, ownImagePrefix)) : d)) } : s)));
    if (!dress) throw new UserError("Dress not found.", 404);
    res.json({ dress });
  }));
  r.delete("/api/bridal/admin/shops/:id/dresses/:dressId", h(async (req, res) => {
    needAdmin(req);
    let found = false;
    await writeShops((shops) => shops.map((s) => (s.id === req.params.id ? { ...s, dresses: (s.dresses || []).filter((d) => (d.id === req.params.dressId ? ((found = true), false) : true)) } : s)));
    if (!found) throw new UserError("Dress not found.", 404);
    res.json({ ok: true });
  }));
  // Logos and catalog photos are the shops' public product images, so they
  // go to the public photo bucket (unlike the brides' previews).
  r.post("/api/bridal/admin/upload", express.json({ limit: "15mb" }), h(async (req, res) => {
    needAdmin(req);
    const img = decodeImage(req.body?.image, "the image");
    res.json({ url: await uploadPublicImage(`bridal-${shortId()}.${img.type.split("/")[1]}`, img.type, img.buf) });
  }));
  r.get("/api/bridal/admin/usage", h(async (req, res) => {
    needAdmin(req);
    const u = await usage();
    res.json({ ...u, settings: settings(), ready: falConfigured() });
  }));

  return { router: r, sweepExpired, _jobs: jobs };
}
