// AI Bridal Studio (bridal/): try-on jobs against a fake fal.ai, private
// previews, limits, usage/cost, the shop catalog, dress links and the
// guarded fetch. The real FAL_KEY is never needed.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import dns from "node:dns";
import express from "express";

const FAKE_KEY = "fal-test-SECRET-123456";
process.env.FAL_KEY = FAKE_KEY;
process.env.NODE_ENV = "test";
process.env.BRIDAL_DAILY_LIMIT = "3";
process.env.BRIDAL_MONTHLY_LIMIT = "10";
process.env.BRIDAL_GLOBAL_DAILY_LIMIT = "50";
process.env.BRIDAL_PRICE_USD = "0.04";

const { createBridalStudio, normalizeShop } = await import("../bridal/studio.js");
const { checkLink, isPrivateAddress, imageType, extractProduct, safeGet, FetchRefused } = await import("../bridal/safe-fetch.js");

// Tiny valid images (real headers).
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 2)]);
const dataUri = (buf, type = "image/png") => `data:${type};base64,${buf.toString("base64")}`;

// --- fake fal ----------------------------------------------------------------
const fal = { authHeaders: [], inputs: [], mode: "ok" };
let falServer, falBase;
function startFakeFal() {
  return new Promise((resolve) => {
    falServer = http.createServer((req, res) => {
      fal.authHeaders.push([req.url, req.headers.authorization]);
      let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => {
        const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
        if (req.method === "POST" && req.url === "/fal-ai/image-apps-v2/virtual-try-on") {
          const input = JSON.parse(body);
          fal.inputs.push(input);
          if (fal.mode === "reject") return send(422, { detail: [{ msg: `bad image; you sent Key ${FAKE_KEY}` }] });
          return send(200, { request_id: "req-1", status_url: `${falBase}/fal-ai/image-apps-v2/requests/req-1/status`, response_url: `${falBase}/fal-ai/image-apps-v2/requests/req-1` });
        }
        if (req.url.endsWith("/status")) return send(200, { status: "COMPLETED", metrics: { inference_time: 7.5 } });
        if (req.url === "/fal-ai/image-apps-v2/requests/req-1") return send(200, { images: [{ url: `${falBase}/files/out.jpg` }] });
        if (req.url === "/files/out.jpg") { res.writeHead(200, { "content-type": "image/jpeg" }); return res.end(JPG); }
        send(404, {});
      });
    }).listen(0, "127.0.0.1", () => { falBase = `http://127.0.0.1:${falServer.address().port}`; process.env.FAL_QUEUE_BASE_URL = falBase; resolve(); });
  });
}

// --- the app with in-memory store, storage and people ---------------------------
const kv = new Map();
const files = new Map();
const logs = [];
const people = { "alice-cookie": { role: "client", userId: "alice" }, "bob-cookie": { role: "client", userId: "bob" }, "nora-cookie": { role: "client", userId: "nora" }, "admin-cookie": { role: "admin" } };
const users = { alice: { id: "alice", name: "Alice", status: "active" }, bob: { id: "bob", name: "Bob", status: "active" }, nora: { id: "nora", name: "Nora", status: "pending" } };
let server, base, studio;
const OWN = "https://cores.example/storage/v1/object/public/invitation-photos/";
const pages = new Map(); // fake shop pages for the link reader

before(async () => {
  await startFakeFal();
  studio = createBridalStudio({
    requestRole: (req) => people[req.headers["x-test-user"]] || { role: "anon" },
    findUser: async (id) => users[id] || null,
    kvRead: async (k) => kv.get(k) ?? null,
    kvWrite: async (k, v) => { kv.set(k, v); },
    kvListKeys: async (prefix) => [...kv.keys()].filter((k) => k.startsWith(prefix)),
    storage: { put: async (p, b) => { files.set(p, b); }, get: async (p) => { if (!files.has(p)) throw new Error("missing"); return files.get(p); }, remove: async (p) => { files.delete(p); } },
    uploadPublicImage: async (name) => `${OWN}${name}`,
    readOwnImage: async (url) => (url.startsWith(OWN) ? { body: PNG, type: "image/png" } : null),
    safeGet: async (url, opts) => {
      const host = new URL(url).hostname;
      if (!opts.allowHost(host)) throw new FetchRefused("That site isn't supported.");
      if (!pages.has(url)) throw new FetchRefused("The site answered 404.");
      return { body: Buffer.from(pages.get(url)), contentType: "text/html; charset=utf-8", url };
    },
    safeGetImage: async (url) => { if (url.includes("not-image")) throw new FetchRefused("That link isn't a JPEG, PNG or WebP image."); return { body: JPG, type: "image/jpeg", url }; },
    secret: "test-secret",
    log: { error: (...a) => logs.push(a.join(" ")) },
  });
  const app = express();
  app.use(studio.router);
  await new Promise((r) => { server = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); falServer.close(); });

const api = async (who, method, path, body) => {
  const r = await fetch(`${base}${path}`, { method, headers: { "x-test-user": who || "", ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, headers: r.headers, body: ct.includes("json") ? await r.json() : Buffer.from(await r.arrayBuffer()) };
};
async function tryOn(who, dress, extra = {}) {
  const r = await api(who, "POST", "/api/bridal/try-on", { consent: true, personImage: dataUri(PNG), dress, ...extra });
  if (r.status !== 202) return r;
  for (let i = 0; i < 100; i++) {
    const j = await api(who, "GET", `/api/bridal/jobs/${r.body.jobId}`);
    if (j.body.status !== "running") return j;
    await new Promise((x) => setTimeout(x, 100));
  }
  throw new Error("job never finished");
}

// --- tests ---------------------------------------------------------------------
test("only signed-in, active accounts can use it", async () => {
  assert.equal((await api(null, "POST", "/api/bridal/try-on", { consent: true })).status, 401);
  assert.equal((await api("nora-cookie", "POST", "/api/bridal/try-on", { consent: true })).status, 401);
  const cfg = await api(null, "GET", "/api/bridal/config");
  assert.equal(cfg.body.signedIn, false);
  assert.equal(cfg.body.ready, true);
});

test("asks for consent and real images", async () => {
  const noConsent = await api("alice-cookie", "POST", "/api/bridal/try-on", { personImage: dataUri(PNG), dress: { type: "upload", image: dataUri(PNG) } });
  assert.equal(noConsent.status, 400);
  assert.match(noConsent.body.error, /fal\.ai/);
  const fake = await api("alice-cookie", "POST", "/api/bridal/try-on", { consent: true, personImage: `data:image/png;base64,${Buffer.from("<html>hi</html>").toString("base64")}`, dress: { type: "upload", image: dataUri(PNG) } });
  assert.equal(fake.status, 400);
  assert.match(fake.body.error, /isn't a JPEG, PNG or WebP/);
});

test("try on an uploaded dress: private preview, key only sent to fal", async () => {
  const done = await tryOn("alice-cookie", { type: "upload", image: dataUri(PNG), name: "My dress" });
  assert.equal(done.body.status, "done", JSON.stringify(done.body));
  const res = done.body.result;
  assert.match(res.imageUrl, /^\/api\/bridal\/results\/[a-z0-9]+\/image$/);
  // fal got both images as data URIs and the key in its header
  const input = fal.inputs.at(-1);
  assert.match(input.person_image_url, /^data:image\/png;base64,/);
  assert.match(input.clothing_image_url, /^data:image\/png;base64,/);
  const submit = fal.authHeaders.filter(([u]) => u === "/fal-ai/image-apps-v2/virtual-try-on").at(-1);
  assert.equal(submit[1], `Key ${FAKE_KEY}`);
  assert.equal(fal.authHeaders.filter(([u]) => u === "/files/out.jpg").at(-1)[1], undefined, "the key isn't sent when downloading the result");
  // only Alice can open it
  const mine = await api("alice-cookie", "GET", res.imageUrl);
  assert.equal(mine.status, 200);
  assert.deepEqual(mine.body, JPG);
  assert.match(mine.headers.get("cache-control"), /private/);
  assert.match((await api("alice-cookie", "GET", res.downloadUrl)).headers.get("content-disposition"), /attachment/);
  assert.equal((await api("bob-cookie", "GET", res.imageUrl)).status, 404);
  assert.equal((await api(null, "GET", res.imageUrl)).status, 401);
  assert.equal((await api("bob-cookie", "GET", "/api/bridal/results")).body.results.length, 0);
  assert.equal((await api("alice-cookie", "GET", "/api/bridal/results")).body.results.length, 1);
  // nothing the browser gets contains the key
  for (const path of ["/api/bridal/config", "/api/bridal/results", "/api/bridal/shops"]) assert.ok(!JSON.stringify((await api("alice-cookie", "GET", path)).body).includes(FAKE_KEY));
});

test("fal errors are explained without leaking the key, and not counted", async () => {
  fal.mode = "reject";
  const before = (await api("bob-cookie", "GET", "/api/bridal/config")).body.used.today;
  const r = await tryOn("bob-cookie", { type: "upload", image: dataUri(PNG) });
  fal.mode = "ok";
  assert.equal(r.body.status, "failed");
  assert.match(r.body.error, /couldn't be used/);
  assert.ok(!r.body.error.includes(FAKE_KEY));
  assert.ok(logs.length && logs.every((l) => !l.includes(FAKE_KEY)), "logs never contain the key");
  assert.equal((await api("bob-cookie", "GET", "/api/bridal/config")).body.used.today, before, "a failed, unbilled try is given back");
});

test("daily limit per person, admin not limited", async () => {
  // Alice already used 1 of 3 today
  assert.equal((await tryOn("alice-cookie", { type: "upload", image: dataUri(PNG) })).body.status, "done");
  assert.equal((await tryOn("alice-cookie", { type: "upload", image: dataUri(PNG) })).body.status, "done");
  const over = await tryOn("alice-cookie", { type: "upload", image: dataUri(PNG) });
  assert.equal(over.status, 429);
  assert.match(over.body.error, /today's 3 previews/);
  for (let i = 0; i < 4; i++) assert.equal((await tryOn("admin-cookie", { type: "upload", image: dataUri(PNG) })).body.status, "done");
});

test("usage and cost are tracked separately for this feature", async () => {
  assert.equal((await api("alice-cookie", "GET", "/api/bridal/admin/usage")).status, 403);
  const u = (await api("admin-cookie", "GET", "/api/bridal/admin/usage")).body;
  const m = Object.values(u.months)[0];
  assert.equal(m.succeeded, 7);
  assert.equal(m.failed, 1);
  assert.equal(m.costUsd, 0.28);
  assert.equal(m.byUser.alice.costUsd, 0.12);
  assert.equal(u.recent[0].requestId, "req-1");
  assert.equal(u.recent[0].inferenceSeconds, 7.5);
  assert.ok(!JSON.stringify(u).includes(FAKE_KEY));
});

test("admin manages shops and dresses; brides see only active ones", async () => {
  assert.equal((await api("alice-cookie", "POST", "/api/bridal/admin/shops", { name: "X" })).status, 403);
  const shop = (await api("admin-cookie", "POST", "/api/bridal/admin/shops", { name: "Maison Blanche", website: "https://www.maisonblanche.example", logoUrl: `${OWN}logo.png`, linkImport: true, linkDomains: "cdn.maisonblanche.example" })).body.shop;
  assert.deepEqual(shop.linkDomains, ["maisonblanche.example", "cdn.maisonblanche.example"]);
  assert.equal((await api("admin-cookie", "POST", `/api/bridal/admin/shops/${shop.id}/dresses`, { name: "No photo" })).status, 400);
  assert.equal((await api("admin-cookie", "POST", `/api/bridal/admin/shops/${shop.id}/dresses`, { name: "Bad", imageUrl: "http://insecure.example/a.jpg" })).status, 400);
  const dress = (await api("admin-cookie", "POST", `/api/bridal/admin/shops/${shop.id}/dresses`, { name: "Aurora", imageUrl: `${OWN}aurora.png`, productUrl: "https://www.maisonblanche.example/dresses/aurora", price: "2400", currency: "usd" })).body.dress;
  assert.equal(dress.price, 2400);
  assert.equal(dress.currency, "USD");
  assert.equal(dress.source, "manual");
  const hidden = (await api("admin-cookie", "POST", `/api/bridal/admin/shops/${shop.id}/dresses`, { name: "Old", imageUrl: `${OWN}old.png`, active: false })).body.dress;
  const off = (await api("admin-cookie", "POST", "/api/bridal/admin/shops", { name: "Closed shop", active: false })).body.shop;
  const pub = (await api(null, "GET", "/api/bridal/shops")).body.shops;
  assert.deepEqual(pub.map((s) => s.name), ["Maison Blanche"]);
  assert.deepEqual(pub[0].dresses.map((d) => d.name), ["Aurora"]);
  assert.ok(hidden && off);

  // try on a catalog dress: shop name and product link come back with it
  const r = await tryOn("bob-cookie", { type: "catalog", shopId: shop.id, dressId: dress.id });
  assert.equal(r.body.status, "done", JSON.stringify(r.body));
  assert.equal(r.body.result.dress.shopName, "Maison Blanche");
  assert.equal(r.body.result.dress.productUrl, "https://www.maisonblanche.example/dresses/aurora");
  assert.equal((await tryOn("bob-cookie", { type: "catalog", shopId: shop.id, dressId: hidden.id })).body.status, "failed");
});

test("dress links: only from shops that allow it, image confirmed first", async () => {
  const shop = (await api(null, "GET", "/api/bridal/shops")).body.shops[0];
  const unsupported = await api("bob-cookie", "POST", "/api/bridal/resolve-link", { url: "https://random-boutique.example/dress/1" });
  assert.equal(unsupported.body.supported, false);
  assert.match(unsupported.body.message, /upload a photo/);
  assert.equal((await api("bob-cookie", "POST", "/api/bridal/resolve-link", { url: "http://www.maisonblanche.example/x" })).status, 400);
  assert.equal((await api(null, "POST", "/api/bridal/resolve-link", { url: "https://www.maisonblanche.example/x" })).status, 401);

  // a link to a dress already in the catalog: no fetch needed
  const known = await api("bob-cookie", "POST", "/api/bridal/resolve-link", { url: "https://maisonblanche.example/dresses/aurora/?utm=1" });
  assert.equal(known.body.dress.source, "catalog");
  assert.equal(known.body.dress.dressId, shop.dresses[0].id);

  // a new product page of that shop: its photo is found and shown first
  pages.set("https://www.maisonblanche.example/dresses/luna", `<html><head><meta property="og:title" content="Luna Gown &amp; Veil"><meta property="og:image" content="https://cdn.maisonblanche.example/luna.jpg"></head></html>`);
  const found = await api("bob-cookie", "POST", "/api/bridal/resolve-link", { url: "https://www.maisonblanche.example/dresses/luna" });
  assert.equal(found.body.supported, true);
  assert.equal(found.body.dress.name, "Luna Gown & Veil");
  assert.match(found.body.dress.preview, /^data:image\/jpeg;base64,/);
  const r = await tryOn("bob-cookie", { type: "link", token: found.body.dress.token });
  assert.equal(r.body.status, "done", JSON.stringify(r.body));
  assert.equal(r.body.result.dress.shopName, "Maison Blanche");
  const forged = await api("bob-cookie", "POST", "/api/bridal/try-on", { consent: true, personImage: dataUri(PNG), dress: { type: "link", token: found.body.dress.token.replace(/.$/, (c) => (c === "a" ? "b" : "a")) } });
  assert.equal(forged.status, 400);

  pages.set("https://www.maisonblanche.example/dresses/broken", `<html><meta property="og:image" content="https://cdn.maisonblanche.example/not-image.html"></html>`);
  const bad = await api("bob-cookie", "POST", "/api/bridal/resolve-link", { url: "https://www.maisonblanche.example/dresses/broken" });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /isn't a JPEG/);
});

test("delete one, delete all, and expiry", async () => {
  const list = (await api("alice-cookie", "GET", "/api/bridal/results")).body.results;
  assert.equal(list.length, 3);
  const filesBefore = files.size;
  assert.equal((await api("bob-cookie", "DELETE", `/api/bridal/results/${list[0].id}`)).status, 404, "can't delete someone else's");
  assert.equal((await api("alice-cookie", "DELETE", `/api/bridal/results/${list[0].id}`)).body.deleted, 1);
  assert.equal(files.size, filesBefore - 1, "file removed from storage");
  assert.equal((await api("alice-cookie", "DELETE", "/api/bridal/results")).body.deleted, 2);
  assert.equal((await api("alice-cookie", "GET", "/api/bridal/results")).body.results.length, 0);
  // expiry
  const key = "einvite:bridal-results-admin";
  const recs = JSON.parse(kv.get(key));
  kv.set(key, JSON.stringify(recs.map((r, i) => (i === 0 ? { ...r, expiresAt: Date.now() - 1 } : r))));
  await studio.sweepExpired();
  assert.equal(JSON.parse(kv.get(key)).length, recs.length - 1);
  assert.ok(!files.has(recs[0].path));
});

test("guarded fetch refuses internal addresses and non-images", async () => {
  for (const bad of ["http://example.com/a.jpg", "https://127.0.0.1/a", "https://localhost/a", "https://[::1]/a", "https://example.com:8443/a", "https://user:pw@example.com/a", "https://printer.local/a", "file:///etc/passwd"]) {
    assert.throws(() => checkLink(bad), FetchRefused, bad);
  }
  for (const ip of ["10.0.0.5", "172.16.3.1", "192.168.1.1", "169.254.169.254", "127.0.0.1", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) assert.equal(isPrivateAddress(ip), true, ip);
  for (const ip of ["8.8.8.8", "151.101.1.69", "2606:4700::1111"]) assert.equal(isPrivateAddress(ip), false, ip);
  // a public-looking name that resolves to a private address is refused at connect time
  const orig = dns.lookup;
  dns.lookup = (host, opts, cb) => cb(null, [{ address: "169.254.169.254", family: 4 }]);
  try {
    await assert.rejects(() => safeGet("https://metadata.example.com/latest"), /isn't allowed|Couldn't reach/);
  } finally { dns.lookup = orig; }
  assert.equal(imageType(Buffer.from("<html><body>not an image</body></html>")), null);
  assert.equal(imageType(PNG), "image/png");
  assert.equal(imageType(JPG), "image/jpeg");
});

test("product page reading", () => {
  const p = extractProduct(`<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Stella","image":["/img/stella.webp"]}</script><title>Stella | Shop</title>`, "https://shop.example/p/stella");
  assert.deepEqual(p.images, ["https://shop.example/img/stella.webp"]);
  assert.equal(p.title, "Stella | Shop");
  assert.deepEqual(extractProduct(`<meta property="og:image" content="http://insecure.example/a.jpg">`, "https://shop.example/").images, []);
  assert.throws(() => normalizeShop({ name: "" }), /needs a name/);
});
