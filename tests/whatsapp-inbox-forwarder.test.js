import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { createInboxForwarder } from "../whatsapp-inbox-forwarder.js";

const quiet = { error() {} };
const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), "inbox-fwd-"));
const sign = (body) => "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
function server(handler) {
  return new Promise((resolve) => {
    const received = [];
    const s = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => { const body = Buffer.concat(chunks); received.push({ body, sig: req.headers["x-hub-signature-256"] }); handler(res, received.length); });
    }).listen(0, () => resolve({ s, received, url: `http://127.0.0.1:${s.address().port}/api/webhook` }));
  });
}

test("delivers exact bytes and original signature, then clears the queue", async () => {
  const { s, received, url } = await server((res) => res.end("ok"));
  const dir = await tmp();
  const f = createInboxForwarder({ url, queueDir: dir, log: quiet });
  const body = Buffer.from('{"entry":[],"emoji":"🎉 مرحبا"}');
  assert.equal(await f.enqueue(body, sign(body)), true);
  await f.drain();
  assert.equal(received.length, 1);
  assert.deepEqual(received[0].body, body);
  assert.equal(received[0].sig, sign(body));
  assert.equal(await f.pending(), 0);
  s.closeAllConnections(); s.close();
});

test("keeps the webhook when the Inbox is down and delivers it after restart, in order", async () => {
  const dir = await tmp();
  const down = createInboxForwarder({ url: "http://127.0.0.1:1/api/webhook", queueDir: dir, log: quiet, timeoutMs: 500 });
  const a = Buffer.from('{"n":1}'), b = Buffer.from('{"n":2}');
  await down.enqueue(a, sign(a));
  await down.enqueue(b, sign(b));
  await down.drain();
  assert.equal(await down.pending(), 2);
  const { s, received, url } = await server((res) => res.end("ok"));
  const up = createInboxForwarder({ url, queueDir: dir, log: quiet }); // fresh instance = restart
  await up.drain();
  assert.deepEqual(received.map((r) => r.body.toString()), ['{"n":1}', '{"n":2}']);
  assert.equal(await up.pending(), 0);
  s.closeAllConnections(); s.close();
});

test("5xx is retried, 4xx is dropped", async () => {
  const dir = await tmp();
  const { s, received, url } = await server((res, n) => { res.statusCode = n === 1 ? 503 : n === 2 ? 403 : 200; res.end(); });
  const f = createInboxForwarder({ url, queueDir: dir, log: quiet, maxBackoffMs: 1 });
  const body = Buffer.from("{}");
  await f.enqueue(body, sign(body));
  await f.drain();
  assert.equal(await f.pending(), 1); // 503 kept
  await new Promise((r) => setTimeout(r, 20));
  await f.drain();
  await f.drain();
  assert.equal(await f.pending(), 0); // 403 dropped
  assert.ok(received.length >= 2);
  s.closeAllConnections(); s.close();
});

test("queue is capped and old entries expire", async () => {
  const dir = await tmp();
  const f = createInboxForwarder({ url: "http://127.0.0.1:1/x", queueDir: dir, log: quiet, maxFiles: 3, timeoutMs: 200 });
  for (let i = 0; i < 6; i++) await f.enqueue(Buffer.from(`{"i":${i}}`), "sha256=x");
  assert.equal(await f.pending(), 3);
  const old = createInboxForwarder({ url: "http://127.0.0.1:1/x", queueDir: dir, log: quiet, maxAgeMs: -1 });
  await old.drain();
  assert.equal(await old.pending(), 0);
});

test("disabled forwarder does nothing and a storage failure never throws", async () => {
  const off = createInboxForwarder({ url: "", log: quiet });
  assert.equal(off.enabled, false);
  assert.equal(await off.enqueue(Buffer.from("{}"), "x"), true);
  const file = path.join(await tmp(), "afile");
  await fs.writeFile(file, "x");
  const broken = createInboxForwarder({ url: "http://x/y", queueDir: path.join(file, "sub"), log: quiet });
  assert.equal(await broken.enqueue(Buffer.from("{}"), "x"), false);
});
