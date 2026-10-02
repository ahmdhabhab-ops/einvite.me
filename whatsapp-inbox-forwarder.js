// Sends a copy of every verified Meta WhatsApp webhook to the eInvite Inbox.
//
// The copy is stored on disk first (one file per webhook, written atomically)
// and delivered in order by a background loop that retries with backoff, so a
// restart or an Inbox outage never loses messages. The raw bytes and the
// original X-Hub-Signature-256 are passed on untouched, so the Inbox verifies
// Meta's own signature with the same app secret.
//
// This module never throws into the caller: the invitation flow in
// server.js (RSVP, QR, delivery ticks, Supabase forwarding) must not depend
// on the Inbox being healthy.
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DAY = 86400000;

export function createInboxForwarder({
  url = "",
  queueDir = "/data/whatsapp-inbox-outbox",
  intervalMs = 5000,
  maxAgeMs = 3 * DAY,   // older entries are dropped (Meta's own retries stop after ~7 days anyway)
  maxFiles = 2000,      // hard cap so a long outage can't fill the disk
  maxBackoffMs = 5 * 60000,
  timeoutMs = 10000,
  fetchImpl = fetch,
  log = console,
} = {}) {
  const target = String(url || "").trim();
  const enabled = !!target && target !== "off";
  const retryAt = new Map(); // file -> next attempt time (memory only; a restart retries immediately)
  const attempts = new Map();
  let timer = null;
  let running = null;
  let ready = null;

  const ensureDir = () => (ready ||= fs.mkdir(queueDir, { recursive: true }).catch((err) => { ready = null; throw err; }));

  async function list() {
    const names = (await fs.readdir(queueDir)).filter((n) => n.endsWith(".json"));
    return names.sort(); // names start with a zero-padded timestamp, so this is oldest first
  }

  // Resolves true once the webhook is safely on disk, false if it could not be stored.
  async function enqueue(body, signature) {
    if (!enabled) return true;
    try {
      await ensureDir();
      const now = Date.now();
      const name = `${String(now).padStart(15, "0")}-${randomBytes(4).toString("hex")}.json`;
      const entry = JSON.stringify({ at: now, signature: signature || "", body: Buffer.from(body).toString("base64") });
      const tmp = path.join(queueDir, `.${name}.tmp`);
      await fs.writeFile(tmp, entry, { mode: 0o600 });
      await fs.rename(tmp, path.join(queueDir, name));
      const names = await list();
      for (const old of names.slice(0, Math.max(0, names.length - maxFiles))) {
        log.error?.("inbox forwarder: queue full, dropping oldest webhook", old);
        await fs.unlink(path.join(queueDir, old)).catch(() => {});
      }
      kick();
      return true;
    } catch (err) {
      log.error?.("inbox forwarder: could not store webhook:", err.message);
      return false;
    }
  }

  async function deliver(name) {
    const file = path.join(queueDir, name);
    let entry;
    try { entry = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (err) {
      if (err.code === "ENOENT") return "gone";
      log.error?.("inbox forwarder: unreadable entry dropped", name);
      await fs.unlink(file).catch(() => {});
      return "gone";
    }
    if (Date.now() - entry.at > maxAgeMs) {
      log.error?.("inbox forwarder: entry too old, dropped", name);
      await fs.unlink(file).catch(() => {});
      return "gone";
    }
    if (!entry.signature) { // the Inbox would reject it; nothing to retry
      await fs.unlink(file).catch(() => {});
      return "gone";
    }
    try {
      const r = await fetchImpl(target, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Hub-Signature-256": entry.signature },
        body: Buffer.from(entry.body, "base64"),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (r.ok) { await fs.unlink(file).catch(() => {}); return "sent"; }
      // A 4xx (other than timeout / rate limit) will not get better by retrying.
      if (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429) {
        log.error?.(`inbox forwarder: Inbox refused webhook with ${r.status}, dropped`, name);
        await fs.unlink(file).catch(() => {});
        return "gone";
      }
      throw new Error(`Inbox answered ${r.status}`);
    } catch (err) {
      const n = (attempts.get(name) || 0) + 1;
      attempts.set(name, n);
      retryAt.set(name, Date.now() + Math.min(maxBackoffMs, 2000 * 2 ** Math.min(n, 10)));
      if (n === 1 || n % 10 === 0) log.error?.(`inbox forwarder: delivery failed (attempt ${n}):`, err.message);
      return "retry";
    }
  }

  // One pass over the queue, oldest first. Stops at the first entry that must
  // wait so webhooks reach the Inbox in the order Meta sent them.
  function drain() {
    if (!enabled) return Promise.resolve();
    return (running ||= (async () => {
      try {
        await ensureDir();
        for (const name of await list()) {
          if ((retryAt.get(name) || 0) > Date.now()) break;
          const result = await deliver(name);
          if (result === "retry") break;
          retryAt.delete(name);
          attempts.delete(name);
        }
      } catch (err) {
        log.error?.("inbox forwarder: drain error:", err.message);
      } finally { running = null; }
    })());
  }
  const kick = () => { void drain(); };

  function start() {
    if (!enabled || timer) return;
    timer = setInterval(kick, intervalMs);
    timer.unref?.();
    kick(); // pick up whatever a previous run left behind
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  async function pending() { try { await ensureDir(); return (await list()).length; } catch { return -1; } }

  return { enabled, enqueue, drain, start, stop, pending };
}
