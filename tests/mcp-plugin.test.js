// End-to-end test of the ChatGPT plugin (mcp/): the OAuth sign-in and the
// four MCP tools, against an in-memory store with test accounts. Checks in
// particular that one account can never see or change another's invitation.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createOAuth } from "../mcp/oauth.js";
import { createMcpHandler, rsvpSummary } from "../mcp/tools.js";

const REDIRECT = "http://localhost:9/callback";
const kv = new Map();
const DRAFT_KEY = "einvite:draft-core";
const users = [
  { id: "alice001", name: "Alice", email: "alice@test.dev", role: "normal", status: "active", invitationSlug: null, packageTier: null },
  { id: "bob00001", name: "Bob", email: "bob@test.dev", role: "couple", status: "active", invitationSlug: "bob-lina", packageTier: null },
  { id: "carol001", name: "Carol", email: "carol@test.dev", role: "normal", status: "pending", invitationSlug: null },
  { id: "dave0001", name: "Dave", email: "dave@test.dev", role: "normal", status: "inactive", invitationSlug: "dave-x" },
  { id: "erin0001", name: "Erin", email: "erin@test.dev", role: "designer", status: "active", invitationSlug: "erin-design" },
  { id: "fred0001", name: "Fred", email: "fred@test.dev", role: "couple", status: "active", invitationSlug: "fred-maya", packageTier: "premium" },
];
const passwords = { "alice@test.dev": "alice-pw", "bob@test.dev": "bob-pw", "carol@test.dev": "carol-pw", "dave@test.dev": "dave-pw", "erin@test.dev": "erin-pw", "fred@test.dev": "fred-pw" };
kv.set(DRAFT_KEY, JSON.stringify({ users, invitationIds: ["bob00001"], content: { secret: "admin working copy" } }));
const bobGuests = [
  { id: "g1", lastName: "Haddad", members: [{ id: "m1", name: "Sami", status: "yes" }, { id: "m2", name: "Rana", status: "yes" }], additionalGuests: 1, phone: "+96170000001" },
  { id: "g2", lastName: "Khoury", members: [{ id: "m3", name: "Joe", status: "no" }], phone: "+96170000002" },
  { id: "g3", lastName: "Nasr", members: [{ id: "m4", name: "Maya", status: "pending" }, { id: "m5", name: "Tony", status: "pending" }], phone: "+96170000003" },
  { id: "g4", lastName: "Aoun", members: [{ id: "m6", name: "Lea", status: "yes" }, { id: "m7", name: "Karl", status: "no" }], additionalGuests: 0, phone: "+96170000004" },
];
kv.set("einvite:invitation-bob00001", JSON.stringify({ content: { en: { cover: { name1: "Bob", name2: "Lina" } } }, defaultLang: "en", enabledLanguages: ["en"], rsvpSchedule: { date: "2027-05-01", time: "18:00" }, locations: [], guestGroups: bobGuests }));
kv.set("einvite:invitation-fred0001", JSON.stringify({ content: { en: { cover: { name1: "Fred", name2: "Maya" } } }, defaultLang: "en", enabledLanguages: ["en"], rsvpSchedule: { date: "2027-01-01" }, guestGroups: [] }));

let base, server, sessionCookieUser = null;
const getDraft = () => JSON.parse(kv.get(DRAFT_KEY));
const findUser = async (id) => getDraft().users.find((u) => u.id === id) || null;
const userAllowed = (u) => (!u ? "Account not found." : u.role === "designer" ? "Designer accounts can't use the ChatGPT plugin." : u.status !== "active" ? (u.status === "pending" ? "This account is still waiting for approval." : "This account is frozen.") : true);
const failures = new Map();

before(async () => {
  const app = express();
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  const oauth = createOAuth({
    baseUrl: base, secret: "test-secret", extraRedirects: [REDIRECT],
    checkPassword: async (email, pw) => (passwords[email] === pw ? getDraft().users.find((u) => u.email === email) : null),
    sessionUserId: () => sessionCookieUser,
    findUser, userAllowed,
    loginBlocked: (keys) => keys.some((k) => (failures.get(k) || 0) >= 10),
    noteLoginFailure: (keys) => keys.forEach((k) => failures.set(k, (failures.get(k) || 0) + 1)),
    clientIp: () => "127.0.0.1",
    kvRead: async (k) => kv.get(k) ?? null, kvWrite: async (k, v) => { kv.set(k, v); },
    escapeHtml: (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`),
  });
  app.use(oauth.router);
  app.use(createMcpHandler({
    siteUrl: base, verifyAccessToken: oauth.verifyAccessToken, wwwAuthenticate: oauth.wwwAuthenticate, findUser, userAllowed,
    readUsersDraft: async () => { const draft = getDraft(); return { draft, users: draft.users }; },
    writeUsersDraft: async (d) => { kv.set(DRAFT_KEY, JSON.stringify(d)); },
    kvRead: async (k) => kv.get(k) ?? null, kvWrite: async (k, v) => { kv.set(k, v); },
    uniqueSlug: (list, b, ex) => { const clean = String(b).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invitation"; const taken = new Set(list.filter((u) => u.id !== ex).map((u) => u.invitationSlug)); let c = clean; for (let n = 2; taken.has(c); n++) c = `${clean}-${n}`; return c; },
  }));
});
after(() => server.close());

// --- helpers -------------------------------------------------------------
async function register(redirectUris = [REDIRECT]) {
  const r = await fetch(`${base}/oauth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_name: "Test client", redirect_uris: redirectUris }) });
  return { status: r.status, body: await r.json() };
}
function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}
const authorizeUrl = (clientId, challenge, extra = {}) => `${base}/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256", state: "st123", scope: "invitations:read invitations:write", resource: `${base}/mcp`, ...extra })}`;
async function formReq(url) {
  const html = await (await fetch(url)).text();
  return /name="req" value="([^"]+)"/.exec(html)?.[1];
}
async function postAuthorize(fields) {
  const r = await fetch(`${base}/oauth/authorize`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) });
  return { status: r.status, location: r.headers.get("location"), html: r.status >= 300 && r.status < 400 ? "" : await r.text() };
}
async function token(fields) {
  const r = await fetch(`${base}/oauth/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) });
  return { status: r.status, body: await r.json() };
}
async function signIn(email, password, scope) {
  const { body: client } = await register();
  const { verifier, challenge } = pkce();
  const req = await formReq(authorizeUrl(client.client_id, challenge, scope ? { scope } : {}));
  const res = await postAuthorize({ req, action: "login", email, password });
  assert.equal(res.status, 302, `login for ${email} should redirect`);
  const loc = new URL(res.location);
  assert.equal(loc.searchParams.get("state"), "st123");
  assert.equal(loc.searchParams.get("iss"), base);
  const code = loc.searchParams.get("code");
  const t = await token({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: verifier, resource: `${base}/mcp` });
  assert.equal(t.status, 200, JSON.stringify(t.body));
  return { ...t.body, clientId: client.client_id };
}
async function mcp(accessToken) {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { authorization: `Bearer ${accessToken}` } } }));
  return client;
}
const call = async (client, name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { error: !!r.isError, text: r.content?.[0]?.text || "", data: r.structuredContent };
};

// --- tests ---------------------------------------------------------------
test("discovery metadata", async () => {
  const prm = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json();
  assert.equal(prm.resource, `${base}/mcp`);
  assert.deepEqual(prm.authorization_servers, [base]);
  const as = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json();
  assert.equal(as.issuer, base);
  assert.deepEqual(as.code_challenge_methods_supported, ["S256"]);
  assert.equal(as.authorization_response_iss_parameter_supported, true);
  assert.equal(as.client_id_metadata_document_supported, true);
});

test("MCP without a token is refused with where to sign in", async () => {
  const r = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
  assert.equal(r.status, 401);
  assert.match(r.headers.get("www-authenticate"), /resource_metadata="[^"]+\/\.well-known\/oauth-protected-resource\/mcp"/);
  const bad = await fetch(`${base}/mcp`, { method: "POST", headers: { authorization: "Bearer eiv1.abc.def", "content-type": "application/json" }, body: "{}" });
  assert.equal(bad.status, 401);
});

test("registration only accepts allowed redirect URIs", async () => {
  assert.equal((await register(["https://evil.example/cb"])).status, 400);
  assert.equal((await register(["https://chatgpt.com/connector_platform_oauth_redirect"])).status, 201);
  assert.equal((await register([REDIRECT])).status, 201);
});

test("authorize rejects bad requests", async () => {
  const { body: client } = await register();
  const { challenge } = pkce();
  const wrongRedirect = await fetch(authorizeUrl(client.client_id, challenge, { redirect_uri: "https://evil.example/cb" }), { redirect: "manual" });
  assert.equal(wrongRedirect.status, 400); // shown on the page, never sent to the unknown address
  const forged = await fetch(authorizeUrl(client.client_id.replace(/.$/, (c) => (c === "A" ? "B" : "A")), challenge), { redirect: "manual" });
  assert.equal(forged.status, 400);
  const noPkce = await fetch(authorizeUrl(client.client_id, "short"), { redirect: "manual" });
  assert.equal(noPkce.status, 302);
  assert.equal(new URL(noPkce.headers.get("location")).searchParams.get("error"), "invalid_request");
  const wrongResource = await fetch(authorizeUrl(client.client_id, challenge, { resource: "https://other.example/mcp" }), { redirect: "manual" });
  assert.equal(new URL(wrongResource.headers.get("location")).searchParams.get("error"), "invalid_target");
});

test("only active client accounts with the right password can sign in", async () => {
  const { body: client } = await register();
  const { challenge } = pkce();
  const req = await formReq(authorizeUrl(client.client_id, challenge));
  for (const [email, password, msg] of [["alice@test.dev", "wrong", /Incorrect email or password/], ["carol@test.dev", "carol-pw", /waiting for approval/], ["dave@test.dev", "dave-pw", /frozen/], ["erin@test.dev", "erin-pw", /Designer accounts/]]) {
    const r = await postAuthorize({ req, action: "login", email, password });
    assert.equal(r.status, 200, email);
    assert.match(r.html, msg, email);
  }
  const tampered = await postAuthorize({ req: req.replace(/^./, (c) => (c === "e" ? "f" : "e")), action: "login", email: "alice@test.dev", password: "alice-pw" });
  assert.match(tampered.html, /expired/);
  const deny = await postAuthorize({ req, action: "deny" });
  assert.equal(new URL(deny.location).searchParams.get("error"), "access_denied");
});

test("an existing site session can approve without the password", async () => {
  const { body: client } = await register();
  const { verifier, challenge } = pkce();
  sessionCookieUser = "bob00001";
  const html = await (await fetch(authorizeUrl(client.client_id, challenge))).text();
  assert.match(html, /Signed in as <b>Bob<\/b>/);
  const req = /name="req" value="([^"]+)"/.exec(html)[1];
  const r = await postAuthorize({ req, action: "session" });
  sessionCookieUser = null;
  const code = new URL(r.location).searchParams.get("code");
  const t = await token({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: verifier, resource: `${base}/mcp` });
  assert.equal(t.status, 200);
});

test("codes are single-use and need the right PKCE verifier", async () => {
  const { body: client } = await register();
  const { verifier, challenge } = pkce();
  const req = await formReq(authorizeUrl(client.client_id, challenge));
  const code1 = new URL((await postAuthorize({ req, action: "login", email: "alice@test.dev", password: "alice-pw" })).location).searchParams.get("code");
  const wrong = await token({ grant_type: "authorization_code", code: code1, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: pkce().verifier });
  assert.equal(wrong.status, 400);
  // the failed try used the code up
  const after = await token({ grant_type: "authorization_code", code: code1, redirect_uri: REDIRECT, client_id: client.client_id, code_verifier: verifier });
  assert.equal(after.status, 400);
  const code2 = new URL((await postAuthorize({ req, action: "login", email: "alice@test.dev", password: "alice-pw" })).location).searchParams.get("code");
  const otherClient = (await register()).body.client_id;
  assert.equal((await token({ grant_type: "authorization_code", code: code2, redirect_uri: REDIRECT, client_id: otherClient, code_verifier: verifier })).status, 400);
});

test("refresh tokens rotate and can't be reused", async () => {
  const t = await signIn("alice@test.dev", "alice-pw");
  const r1 = await token({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.clientId });
  assert.equal(r1.status, 200);
  assert.ok(r1.body.access_token && r1.body.refresh_token !== t.refresh_token);
  const reuse = await token({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.clientId });
  assert.equal(reuse.status, 400);
  const widen = await token({ grant_type: "refresh_token", refresh_token: r1.body.refresh_token, client_id: t.clientId, scope: "invitations:read admin" });
  assert.equal(widen.status, 200); // unknown scopes are dropped, not granted
  assert.equal(widen.body.scope, "invitations:read");
});

test("tools are listed with the review annotations", async () => {
  const t = await signIn("alice@test.dev", "alice-pw");
  const client = await mcp(t.access_token);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((x) => x.name).sort(), ["create_invitation_draft", "get_rsvp_summary", "list_invitations", "update_invitation_draft"]);
  for (const tool of tools) {
    for (const k of ["readOnlyHint", "destructiveHint", "openWorldHint"]) assert.equal(typeof tool.annotations[k], "boolean", `${tool.name}.${k}`);
  }
  const by = Object.fromEntries(tools.map((x) => [x.name, x.annotations]));
  assert.equal(by.list_invitations.readOnlyHint, true);
  assert.equal(by.get_rsvp_summary.readOnlyHint, true);
  assert.equal(by.create_invitation_draft.readOnlyHint, false);
  assert.equal(by.update_invitation_draft.destructiveHint, true);
  await client.close();
});

test("create a draft, list it, update it", async () => {
  const t = await signIn("alice@test.dev", "alice-pw");
  const client = await mcp(t.access_token);
  assert.deepEqual((await call(client, "list_invitations")).data.invitations, []);

  const bad = await call(client, "create_invitation_draft", { partner1_name: "Alice", event_date: "2027-02-30", locations: [{ title: "Ceremony" }] });
  assert.ok(bad.error);
  const created = await call(client, "create_invitation_draft", { partner1_name: "Alice", partner2_name: "Omar", event_date: "2027-09-18", event_time: "17:30", language: "ar", locations: [{ title: "الإكليل", address: "Saint Elie, Beirut", time: "5:30 PM" }, { title: "السهرة", address: "Le Royal, Dbayeh", time: "8:00 PM" }] });
  assert.ok(!created.error, created.text);
  const inv = created.data.invitation;
  assert.equal(inv.invitation_id, "alice-omar");
  assert.equal(inv.status, "draft");
  assert.equal(inv.preview_url, `${base}/e/alice-omar`);
  assert.deepEqual(inv.languages, ["ar"]);

  const saved = JSON.parse(kv.get("einvite:invitation-alice001"));
  assert.equal(saved.content.ar.cover.name1, "Alice");
  assert.equal(saved.rsvpSchedule.date, "2027-09-18");
  assert.equal(saved.defaultLang, "ar");
  assert.equal(saved.enabledSteps.registry, false);
  assert.deepEqual(saved.guestGroups, []);
  assert.ok(saved.layouts && saved.pageBackgrounds && saved.intro && saved.integrations, "full invitation shape");
  const draft = getDraft();
  assert.equal(draft.users.find((u) => u.id === "alice001").invitationSlug, "alice-omar");
  assert.equal(draft.users.find((u) => u.id === "alice001").packageTier, null, "not published or paid");
  assert.ok(draft.invitationIds.includes("alice001"));
  assert.equal(draft.content.secret, "admin working copy", "the rest of the draft is untouched");

  const again = await call(client, "create_invitation_draft", { partner1_name: "X", event_date: "2027-09-18", locations: [{ title: "Y" }] });
  assert.ok(again.error);
  assert.match(again.text, /already has an invitation/);

  const listed = (await call(client, "list_invitations")).data.invitations;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].title, "Alice & Omar");

  const upd = await call(client, "update_invitation_draft", { invitation_id: "alice-omar", event_date: "2027-10-02", partner2_name: "Omar K." });
  assert.ok(!upd.error, upd.text);
  const after = JSON.parse(kv.get("einvite:invitation-alice001"));
  assert.equal(after.rsvpSchedule.date, "2027-10-02");
  assert.equal(after.rsvpSchedule.time, "17:30");
  assert.equal(after.content.ar.cover.name2, "Omar K.");
  assert.equal(after.locations.length, 2, "places untouched when not passed");
  const wrongLang = await call(client, "update_invitation_draft", { invitation_id: "alice-omar", language: "fr", partner1_name: "A" });
  assert.match(wrongLang.text, /isn't in French/);
  assert.ok((await call(client, "update_invitation_draft", { invitation_id: "alice-omar" })).error);
  await client.close();
});

test("RSVP summary counts families and people, without phone numbers", async () => {
  const t = await signIn("bob@test.dev", "bob-pw");
  const client = await mcp(t.access_token);
  const r = await call(client, "get_rsvp_summary");
  assert.ok(!r.error, r.text);
  assert.deepEqual(r.data.families, { total: 4, attending: 2, declined: 1, no_reply: 1 });
  assert.deepEqual(r.data.people, { attending: 4, declined: 2, no_reply: 2 });
  assert.deepEqual(r.data.attending_families.map((f) => f.name), ["Haddad", "Aoun"]);
  assert.ok(!JSON.stringify(r.data).includes("+9617"), "no phone numbers");
  await client.close();
});

test("one account can never reach another account's invitation", async () => {
  const alice = await mcp((await signIn("alice@test.dev", "alice-pw")).access_token);
  const bob = await mcp((await signIn("bob@test.dev", "bob-pw")).access_token);
  const before = kv.get("einvite:invitation-bob00001");

  const peek = await call(alice, "get_rsvp_summary", { invitation_id: "bob-lina" });
  assert.ok(peek.error);
  assert.match(peek.text, /No invitation with that id/);
  assert.ok(!peek.text.includes("Haddad"));
  const edit = await call(alice, "update_invitation_draft", { invitation_id: "bob-lina", partner1_name: "Hacked" });
  assert.ok(edit.error);
  assert.equal(kv.get("einvite:invitation-bob00001"), before, "Bob's invitation unchanged");
  const aliceList = (await call(alice, "list_invitations")).data.invitations;
  assert.ok(aliceList.every((i) => i.invitation_id !== "bob-lina"));

  const bobPeek = await call(bob, "get_rsvp_summary", { invitation_id: "alice-omar" });
  assert.ok(bobPeek.error);
  const bobEdit = await call(bob, "update_invitation_draft", { invitation_id: "alice-omar", event_date: "2030-01-01" });
  assert.ok(bobEdit.error);
  assert.equal(JSON.parse(kv.get("einvite:invitation-alice001")).rsvpSchedule.date, "2027-10-02");
  await alice.close(); await bob.close();
});

test("a read-only grant can't write", async () => {
  const t = await signIn("bob@test.dev", "bob-pw", "invitations:read");
  const client = await mcp(t.access_token);
  assert.ok(!(await call(client, "list_invitations")).error);
  const w = await call(client, "update_invitation_draft", { invitation_id: "bob-lina", partner1_name: "Robert" });
  assert.ok(w.error);
  assert.match(w.text, /permission/);
  await client.close();
});

test("published invitations can't be changed from ChatGPT", async () => {
  const client = await mcp((await signIn("fred@test.dev", "fred-pw")).access_token);
  const listed = (await call(client, "list_invitations")).data.invitations;
  assert.equal(listed[0].status, "published");
  const w = await call(client, "update_invitation_draft", { invitation_id: "fred-maya", partner1_name: "F" });
  assert.match(w.text, /published/);
  await client.close();
});

test("tampered, foreign or frozen-account tokens stop working", async () => {
  const t = await signIn("bob@test.dev", "bob-pw");
  const [h, p, s] = t.access_token.split(".");
  const payload = JSON.parse(Buffer.from(p, "base64url").toString());
  const forged = `${h}.${Buffer.from(JSON.stringify({ ...payload, sub: "alice001" })).toString("base64url")}.${s}`;
  const r = await fetch(`${base}/mcp`, { method: "POST", headers: { authorization: `Bearer ${forged}`, "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
  assert.equal(r.status, 401);

  // freeze Bob after the token was issued
  const d = getDraft();
  kv.set(DRAFT_KEY, JSON.stringify({ ...d, users: d.users.map((u) => (u.id === "bob00001" ? { ...u, status: "inactive" } : u)) }));
  const client = await mcp(t.access_token);
  const res = await call(client, "list_invitations");
  assert.ok(res.error);
  assert.match(res.text, /can't be used/);
  await client.close();
  kv.set(DRAFT_KEY, JSON.stringify(d));
});

test("rsvpSummary handles empty and odd data", () => {
  assert.deepEqual(rsvpSummary({}).families, { total: 0, attending: 0, declined: 0, no_reply: 0 });
  assert.equal(rsvpSummary({ guestGroups: [{ members: [] }] }).families.no_reply, 1);
});
