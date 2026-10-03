// fal.ai, for AI Bridal Studio only. This is the one place in the app that
// reads FAL_KEY; nothing else may import it. The key goes only to fal's own
// hosts in the Authorization header, is never sent to the browser, and is
// never written to the logs (errors are reduced to a status and a short,
// key-free message).

const FAL_HOST_RE = /^([a-z0-9-]+\.)*fal\.(run|ai|media)$/i;
export const TRY_ON_MODEL = "fal-ai/image-apps-v2/virtual-try-on";

// The key, read forgivingly: FAL_KEY (or FAL_API_KEY / FAL_AI_KEY), even
// with spaces around the name or quotes around the value, as Dokploy's
// Environment box keeps whatever was typed.
const FAL_KEY_NAMES = ["FAL_KEY", "FAL_API_KEY", "FAL_AI_KEY", "FALAI_KEY"];
function falKeyName() {
  return Object.keys(process.env).find((k) => FAL_KEY_NAMES.includes(k.trim().toUpperCase()) && falKeyValue(k)) || null;
}
function falKeyValue(name) {
  return String(process.env[name] || "").trim().replace(/^["']|["']$/g, "").trim();
}
const falKey = () => { const n = falKeyName(); return n ? falKeyValue(n) : ""; };

export function falConfigured() {
  return !!falKey();
}
// For the admin panel: which setting the key came from (never the key).
export function falKeySource() {
  const n = falKeyName();
  return n ? n.trim() : null;
}

function falHost(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && FAL_HOST_RE.test(u.hostname);
  } catch { return false; }
}

function redact(s) {
  let out = String(s || "").replace(/Key\s+[^\s"']+/gi, "Key [hidden]");
  const key = falKey();
  if (key) out = out.split(key).join("[hidden]");
  return out.slice(0, 300);
}

export class FalError extends Error {
  constructor(message, { status = 0, billable = false, userMessage } = {}) {
    super(redact(message));
    this.status = status;
    this.billable = billable;
    this.userMessage = userMessage || "The preview couldn't be made right now. Please try again in a moment.";
  }
}

// Tests point this at a fake fal. Ignored in production, so the key can
// only ever go to fal's own hosts there.
const testBase = () => (process.env.NODE_ENV !== "production" && process.env.FAL_QUEUE_BASE_URL ? process.env.FAL_QUEUE_BASE_URL.replace(/\/+$/, "") : "");
const QUEUE_BASE = () => testBase() || "https://queue.fal.run";
const allowedBase = (url) => falHost(url) || (!!testBase() && url.startsWith(testBase()));

async function falFetch(url, init = {}) {
  if (!allowedBase(url)) throw new FalError(`refused to send the key to ${new URL(url).host}`);
  const key = falKey();
  if (!key) throw new FalError("FAL_KEY is not set", { userMessage: "AI Bridal Studio isn't set up yet." });
  const res = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Key ${key}`, accept: "application/json" }, signal: init.signal || AbortSignal.timeout(30000) });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch {}
  return { res, body, text };
}

function userMessageFor(status, body) {
  const detail = JSON.stringify(body?.detail || body || "").toLowerCase();
  if (status === 401 || status === 403) return "AI Bridal Studio isn't set up correctly. Please tell eInvite.me.";
  if (status === 429) return "Lots of brides are trying dresses right now. Please try again in a minute.";
  if (status === 422 || /image|person|cloth|detect/.test(detail)) return "The photos couldn't be used. Try a clearer, full-length photo of you and a photo that shows the whole dress.";
  return undefined;
}

// Runs one virtual try-on: queues it, waits for it, returns the result
// image URL (on fal's CDN) and what fal reports about it.
export async function runTryOn({ personImage, dressImage, timeoutMs = 180000, pollMs = 1500 }) {
  const submitUrl = `${QUEUE_BASE()}/${TRY_ON_MODEL}`;
  const input = { person_image_url: personImage, clothing_image_url: dressImage, preserve_pose: true };
  const sub = await falFetch(submitUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(60000) });
  if (!sub.res.ok || !sub.body?.request_id) {
    throw new FalError(`submit failed (${sub.res.status}) ${sub.text.slice(0, 200)}`, { status: sub.res.status, userMessage: userMessageFor(sub.res.status, sub.body) });
  }
  const requestId = String(sub.body.request_id);
  const statusUrl = sub.body.status_url && allowedBase(sub.body.status_url) ? sub.body.status_url : `${QUEUE_BASE()}/fal-ai/image-apps-v2/requests/${encodeURIComponent(requestId)}/status`;
  const responseUrl = sub.body.response_url && allowedBase(sub.body.response_url) ? sub.body.response_url : `${QUEUE_BASE()}/fal-ai/image-apps-v2/requests/${encodeURIComponent(requestId)}`;

  const started = Date.now();
  let status = null;
  while (Date.now() - started < timeoutMs) {
    await new Promise((r) => setTimeout(r, pollMs));
    const s = await falFetch(statusUrl, { method: "GET" });
    if (!s.res.ok && s.res.status !== 202) throw new FalError(`status failed (${s.res.status})`, { status: s.res.status });
    status = s.body;
    if (status?.status === "COMPLETED") break;
  }
  if (status?.status !== "COMPLETED") {
    // Ask fal to drop it so it isn't run (and billed) after we gave up.
    falFetch(`${responseUrl}/cancel`, { method: "PUT" }).catch(() => {});
    throw new FalError("timed out", { userMessage: "This is taking longer than usual. Please try again." });
  }
  const out = await falFetch(responseUrl, { method: "GET" });
  if (!out.res.ok) throw new FalError(`result failed (${out.res.status}) ${out.text.slice(0, 200)}`, { status: out.res.status, billable: false, userMessage: userMessageFor(out.res.status, out.body) });
  const imageUrl = out.body?.images?.[0]?.url;
  if (!imageUrl) throw new FalError("no image in the result", { userMessage: "The photos couldn't be used. Try a clearer, full-length photo of you and a photo that shows the whole dress." });
  return { requestId, imageUrl, inferenceSeconds: Number(status?.metrics?.inference_time) || null, seconds: (Date.now() - started) / 1000 };
}

// Downloads the finished image from fal's CDN (and nowhere else).
export async function downloadResult(url) {
  const ok = allowedBase(url);
  if (!ok) throw new FalError("result not on fal's CDN");
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new FalError(`download failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 25 * 1024 * 1024) throw new FalError("result too large");
  return buf;
}
