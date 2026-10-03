// Fetching a page or an image from a shop's site for AI Bridal Studio,
// without letting a link reach this server or the private network.
//
// - https only, standard port, no user:password in the link;
// - every address a host name resolves to is checked, and the connection
//   is made to that checked address (so a name can't switch to a private
//   address between the check and the request);
// - redirects are followed by hand (at most 3), each one checked again;
// - size and time limits, and for images the bytes must really be a
//   JPEG, PNG or WebP.

import https from "node:https";
import net from "node:net";
import dns from "node:dns";

export function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v6 = String(ip).toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || /^(fc|fd|fe[89ab]|ff)/.test(v6) || v6.startsWith("64:ff9b:") || v6.startsWith("2001:db8");
}

export class FetchRefused extends Error {}

export function checkLink(raw) {
  let u;
  try { u = new URL(String(raw || "").trim()); } catch { throw new FetchRefused("That isn't a valid link."); }
  if (u.protocol !== "https:") throw new FetchRefused("Only https links are supported.");
  if (u.username || u.password || (u.port && u.port !== "443")) throw new FetchRefused("That link isn't supported.");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || net.isIP(host) || host === "localhost" || !host.includes(".") || /\.(localhost|local|internal|lan|home|corp)$/.test(host)) throw new FetchRefused("That link isn't supported.");
  u.hash = "";
  return u;
}

// dns.lookup that refuses private addresses; used as the connection's own
// lookup, so the address checked is the address connected to.
function guardedLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: options.family || 4 }];
    if (!list.length || list.some((a) => isPrivateAddress(a.address))) return callback(new FetchRefused("That address isn't allowed."));
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

function getOnce(u, { maxBytes, timeoutMs, accept }) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, { lookup: guardedLookup, timeout: timeoutMs, headers: { accept, "user-agent": "eInvite-BridalStudio/1.0 (+https://einvite.me)", "accept-encoding": "identity" } }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        return resolve({ redirect: new URL(res.headers.location, u).toString() });
      }
      if (status !== 200) { res.resume(); return reject(new FetchRefused(`The site answered ${status}.`)); }
      const declared = Number(res.headers["content-length"] || 0);
      if (declared > maxBytes) { res.destroy(); return reject(new FetchRefused("The file is too large.")); }
      const chunks = []; let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > maxBytes) { res.destroy(); reject(new FetchRefused("The file is too large.")); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve({ body: Buffer.concat(chunks), contentType: String(res.headers["content-type"] || "").toLowerCase(), url: u.toString() }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new FetchRefused("The site took too long to answer.")));
    req.on("error", (e) => reject(e instanceof FetchRefused ? e : new FetchRefused("Couldn't reach that site.")));
  });
}

// `allowHost(hostname)` decides which sites may be fetched at all (checked
// for the first link and for every redirect).
export async function safeGet(raw, { allowHost = () => true, maxBytes = 2 * 1024 * 1024, timeoutMs = 10000, accept = "*/*" } = {}) {
  let u = checkLink(raw);
  for (let hop = 0; hop <= 3; hop++) {
    if (!allowHost(u.hostname.toLowerCase())) throw new FetchRefused("That site isn't supported.");
    const r = await getOnce(u, { maxBytes, timeoutMs, accept });
    if (!r.redirect) return r;
    u = checkLink(r.redirect);
  }
  throw new FetchRefused("Too many redirects.");
}

// What kind of image these bytes are (by their first bytes, not by what
// the site says), or null.
export function imageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.slice(0, 4).toString("latin1") === "RIFF" && buf.slice(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

export async function safeGetImage(raw, opts = {}) {
  const r = await safeGet(raw, { maxBytes: 12 * 1024 * 1024, accept: "image/jpeg,image/png,image/webp,image/*;q=0.8", ...opts });
  const type = imageType(r.body);
  if (!type) throw new FetchRefused("That link isn't a JPEG, PNG or WebP image.");
  return { ...r, type };
}

// The product photo and name from a product page: its og:image (or a
// Product's image in JSON-LD), and og:title. Returns absolute https links.
export function extractProduct(html, pageUrl) {
  const text = String(html || "").slice(0, 1_500_000);
  const meta = (prop) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, "i");
    const tag = re.exec(text)?.[0];
    return tag ? /content=["']([^"']+)["']/i.exec(tag)?.[1] : null;
  };
  const decode = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
  const images = [];
  for (const p of ["og:image:secure_url", "og:image", "twitter:image"]) { const v = meta(p); if (v) images.push(decode(v)); }
  for (const m of text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (!n || typeof n !== "object") return;
        if (Array.isArray(n)) return n.forEach(walk);
        const t = [].concat(n["@type"] || []);
        if (t.includes("Product") && n.image) [].concat(n.image).forEach((i) => images.push(typeof i === "string" ? i : i?.url));
        if (n["@graph"]) walk(n["@graph"]);
      };
      walk(JSON.parse(m[1]));
    } catch {}
  }
  const title = decode(meta("og:title") || /<title[^>]*>([^<]{1,200})<\/title>/i.exec(text)?.[1] || "");
  const abs = [...new Set(images.filter(Boolean).map((i) => { try { return new URL(i, pageUrl).toString(); } catch { return null; } }).filter((i) => i && i.startsWith("https://")))];
  return { title: title.slice(0, 160), images: abs.slice(0, 5) };
}
