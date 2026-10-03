// "Edit text in image" (imagetext/routes.js): who can use it, reading the
// text with a fake OpenAI, the paid AI erase with a fake Stability, limits
// and the usage record. No real keys are needed.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";

const OPENAI_KEY = "sk-test-OPENAI-SECRET";
const STABILITY_KEY = "sk-test-STABILITY-SECRET";
process.env.OPENAI_API_KEY = OPENAI_KEY;
process.env.OPENAI_BASE_URL = "https://openai.test/v1";
delete process.env.STABILITY_API_KEY;
delete process.env.IMAGE_TEXT_AI_ERASE;

const { createImageTextRoutes } = await import("../imagetext/routes.js");

const PNG = `data:image/png;base64,${Buffer.from("fake-png-bytes").toString("base64")}`;
const people = { "alice-cookie": { role: "client", userId: "alice" }, "bob-cookie": { role: "client", userId: "bob" }, "admin-cookie": { role: "admin" } };
const kv = new Map();
const calls = [];
let ocrReply = { text: "Join us for\n  the wedding of ", notEnglish: false, color: "#C9A44C", weight: "bold", italic: false, align: "center", style: "script" };
let stabilityStatus = 200;

const fakeFetch = async (url, init) => {
  calls.push({ url, init });
  if (url === "https://openai.test/v1/chat/completions") {
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(ocrReply) } }] }), { status: 200 });
  }
  if (url.startsWith("https://api.stability.ai/")) {
    if (stabilityStatus !== 200) return new Response(JSON.stringify({ name: "bad_request", errors: ["mask too small"] }), { status: stabilityStatus });
    return new Response(JSON.stringify({ image: Buffer.from("clean").toString("base64"), finish_reason: "SUCCESS" }), { status: 200 });
  }
  throw new Error(`unexpected fetch ${url}`);
};

let server, base;
before(async () => {
  const app = express();
  app.use("/api/image-text", createImageTextRoutes({
    requestRole: (req) => people[(req.headers.cookie || "").replace("s=", "")] || { role: "anon" },
    kvRead: async (k) => kv.get(k) ?? null,
    kvWrite: async (k, v) => { kv.set(k, v); },
    fetchImpl: fakeFetch,
  }));
  await new Promise((r) => { server = app.listen(0, "127.0.0.1", r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = (path, { who, body } = {}) => fetch(`${base}/api/image-text${path}`, {
  method: body ? "POST" : "GET",
  headers: { ...(who ? { cookie: `s=${who}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

test("off by default: config says disabled and the endpoints refuse", async () => {
  delete process.env.IMAGE_TEXT_EDIT_ENABLED;
  assert.deepEqual(await (await call("/config", { who: "admin-cookie" })).json(), { enabled: false });
  assert.equal((await call("/ocr", { who: "alice-cookie", body: { image: PNG } })).status, 404);
  assert.equal((await call("/ocr", { who: "admin-cookie", body: { image: PNG } })).status, 404);
  assert.equal(calls.length, 0);
});

test("admin-only mode: the admin can use it, clients can't, guests must log in", async () => {
  process.env.IMAGE_TEXT_EDIT_ENABLED = "admin";
  assert.equal((await (await call("/config", { who: "alice-cookie" })).json()).enabled, false);
  const cfg = await (await call("/config", { who: "admin-cookie" })).json();
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.mode, "admin");
  assert.equal(cfg.aiErase, false);
  assert.equal((await call("/ocr", { who: "alice-cookie", body: { image: PNG } })).status, 404);
  assert.equal((await call("/ocr", { body: { image: PNG } })).status, 401);
  assert.equal((await call("/ocr", { who: "admin-cookie", body: { image: PNG } })).status, 200);
});

test("reading the text: cleaned lines and style hints, key only sent to OpenAI", async () => {
  process.env.IMAGE_TEXT_EDIT_ENABLED = "1";
  calls.length = 0;
  const res = await call("/ocr", { who: "alice-cookie", body: { image: PNG } });
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.deepEqual(out, { text: "Join us for\nthe wedding of", notEnglish: false, color: "#c9a44c", weight: "bold", italic: false, align: "center", style: "script" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${OPENAI_KEY}`);
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.messages[1].content[1].image_url.url, PNG);
  assert.ok(!JSON.stringify(out).includes("SECRET"));
});

test("not English: empty text with notEnglish, odd hints fall back to defaults", async () => {
  ocrReply = { text: "", notEnglish: true, color: "gold", align: "justify", style: "weird" };
  const out = await (await call("/ocr", { who: "alice-cookie", body: { image: PNG } })).json();
  assert.deepEqual(out, { text: "", notEnglish: true, color: null, weight: "normal", italic: false, align: "center", style: "serif" });
});

test("only JPG/PNG/WebP data URIs are accepted", async () => {
  for (const image of ["", "https://evil.example/x.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,@@@"]) {
    assert.equal((await call("/ocr", { who: "alice-cookie", body: { image } })).status, 400, image);
  }
});

test("AI erase is off until IMAGE_TEXT_AI_ERASE=1 and the key are both set", async () => {
  calls.length = 0;
  let res = await call("/erase", { who: "alice-cookie", body: { image: PNG, mask: PNG } });
  assert.equal(res.status, 503);
  process.env.IMAGE_TEXT_AI_ERASE = "1";
  res = await call("/erase", { who: "alice-cookie", body: { image: PNG, mask: PNG } });
  assert.equal(res.status, 503, "still off without the key");
  process.env.STABILITY_API_KEY = STABILITY_KEY;
  assert.equal(calls.length, 0);
  const cfg = await (await call("/config", { who: "alice-cookie" })).json();
  assert.deepEqual(cfg, { enabled: true, ocr: true, aiErase: true, aiEraseCostUsd: 0.05 });
});

test("AI erase: sends image + mask to Stability with the key, returns a PNG, no key leaks", async () => {
  calls.length = 0;
  const res = await call("/erase", { who: "alice-cookie", body: { image: PNG, mask: PNG } });
  assert.equal(res.status, 200);
  const out = await res.json();
  assert.equal(out.image, `data:image/png;base64,${Buffer.from("clean").toString("base64")}`);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.stability.ai/v2beta/stable-image/edit/erase");
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${STABILITY_KEY}`);
  const form = calls[0].init.body;
  assert.ok(form instanceof FormData);
  assert.ok(form.get("image") && form.get("mask"));
  assert.equal(form.get("output_format"), "png");

  stabilityStatus = 400;
  const bad = await call("/erase", { who: "alice-cookie", body: { image: PNG, mask: PNG } });
  assert.equal(bad.status, 502);
  assert.ok(!(await bad.text()).includes("SECRET"));
  stabilityStatus = 200;
});

test("AI erase is limited per client per hour; the admin isn't", async () => {
  let last;
  for (let i = 0; i < 25; i++) last = await call("/erase", { who: "bob-cookie", body: { image: PNG, mask: PNG } });
  assert.equal(last.status, 429);
  assert.equal((await call("/erase", { who: "admin-cookie", body: { image: PNG, mask: PNG } })).status, 200);
});

test("usage is counted per month with an estimated cost, visible to the admin only", async () => {
  const cfg = await (await call("/config", { who: "admin-cookie" })).json();
  const month = new Date().toISOString().slice(0, 7);
  const m = cfg.usage[month];
  assert.ok(m.ocr >= 3 && m.erase >= 20);
  assert.ok(m.costUsd > 1);
  assert.equal(m.byUser.bob.erase, 20);
  const alice = await (await call("/config", { who: "alice-cookie" })).json();
  assert.equal(alice.usage, undefined);
});
