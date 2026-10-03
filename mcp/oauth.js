// OAuth 2.1 sign-in for the eInvite.me ChatGPT plugin.
//
// eInvite.me is its own authorization server here: a person signs in with
// their eInvite.me email and password (or continues with the session they
// already have on the site), agrees once, and ChatGPT gets a short-lived
// access token for the MCP server at <base>/mcp that only ever acts as that
// one account.
//
// What ChatGPT needs (per OpenAI's plugin auth docs and the MCP
// authorization spec):
//   - protected resource metadata (RFC 9728) on the MCP server,
//   - authorization server metadata (RFC 8414) with RFC 9207 issuer
//     identification, so ChatGPT can use its stable redirect URI,
//   - authorization code + PKCE (S256 only),
//   - client registration by Client ID Metadata Document (an https
//     client_id) or dynamic client registration (RFC 7591),
//   - the `resource` value carried through and checked as the token
//     audience.
//
// Access tokens are signed (HMAC) and last an hour. Refresh tokens are
// random, stored hashed, and replaced on every use. Authorization codes
// live in memory for 5 minutes (one server instance).

import { createHash, createHmac, createPublicKey, randomBytes, timingSafeEqual, verify as cryptoVerify, constants as cryptoConstants } from "node:crypto";
import express from "express";

export const SCOPES = {
  "invitations:read": "See your invitations and their RSVP summary",
  "invitations:write": "Create a draft invitation and edit your drafts",
};
const ACCESS_TTL_S = 3600;
const REFRESH_TTL_MS = 30 * 24 * 3600 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TTL_MS = 15 * 60 * 1000;

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sha256 = (s) => createHash("sha256").update(s).digest();
const sameString = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// Redirect URIs a client may use. ChatGPT's stable one, its per-connection
// ones, plus any extra exact URIs or "prefix*" patterns from the
// environment (for testing with the MCP Inspector or a local client).
function redirectAllowed(uri, extra) {
  let u;
  try { u = new URL(uri); } catch { return false; }
  if (u.hash) return false;
  if (uri === "https://chatgpt.com/connector_platform_oauth_redirect") return true;
  if (/^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(uri)) return true;
  return extra.some((p) => (p.endsWith("*") ? uri.startsWith(p.slice(0, -1)) : uri === p));
}

export function createOAuth(opts) {
  const {
    baseUrl, // e.g. https://cores.einvite.me (no trailing slash)
    secret, // Buffer/string used to sign tokens and requests
    extraRedirects = [], // from MCP_EXTRA_REDIRECT_URIS
    cimdHosts = ["chatgpt.com", "openai.com"], // hosts (and their subdomains) whose client metadata documents we fetch
    checkPassword, // async (email, password) => user | null
    sessionUserId, // (req) => userId | null — the site's own login cookie
    findUser, // async (userId) => user | null
    userAllowed, // (user) => true | "reason"
    loginBlocked, noteLoginFailure, clientIp,
    kvRead, kvWrite,
    escapeHtml,
    fetchImpl = fetch,
  } = opts;
  const resource = `${baseUrl}/mcp`;
  const key = (label) => createHmac("sha256", secret).update(`einvite-mcp-${label}`).digest();
  const tokenKey = key("access-token");
  const requestKey = key("authorize-request");
  const clientKey = key("dcr-client");
  const sign = (k, data) => b64url(createHmac("sha256", k).update(data).digest());

  // --- metadata ---------------------------------------------------------
  const protectedResourceMetadata = () => ({
    resource,
    authorization_servers: [baseUrl],
    scopes_supported: Object.keys(SCOPES),
    bearer_methods_supported: ["header"],
    resource_name: "eInvite.me",
    resource_documentation: `${baseUrl}/`,
  });
  const authorizationServerMetadata = () => ({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    scopes_supported: Object.keys(SCOPES),
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    // ChatGPT's client metadata document may use either (OpenAI's plugin
    // auth guide): a public client, or a signed client assertion.
    token_endpoint_auth_methods_supported: ["none", "private_key_jwt"],
    token_endpoint_auth_signing_alg_values_supported: ["RS256", "PS256", "ES256", "EdDSA"],
    revocation_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    service_documentation: `${baseUrl}/`,
  });
  // Bearer challenge (RFC 6750 / RFC 9728): where to sign in, and which
  // scopes are needed. Accepts an error code, or { error, description, scope }.
  const quote = (v) => String(v).replace(/[\\"]/g, "").replace(/[\r\n]/g, " ");
  const wwwAuthenticate = (opt) => {
    const o = typeof opt === "string" || !opt ? { error: opt } : opt;
    const parts = [`resource_metadata="${baseUrl}/.well-known/oauth-protected-resource/mcp"`];
    if (o.error) parts.push(`error="${quote(o.error)}"`);
    if (o.description) parts.push(`error_description="${quote(o.description)}"`);
    parts.push(`scope="${quote(o.scope || Object.keys(SCOPES).join(" "))}"`);
    return `Bearer ${parts.join(", ")}`;
  };

  // --- clients ----------------------------------------------------------
  // Dynamic registration keeps nothing on the server: the client id itself
  // carries its redirect URIs and name, signed, so registrations can't fill
  // up the database.
  function registerClient(meta) {
    const uris = Array.isArray(meta?.redirect_uris) ? meta.redirect_uris.map(String) : [];
    if (!uris.length || uris.length > 10) return { error: "invalid_redirect_uri", error_description: "redirect_uris is required (1-10 URIs)." };
    const bad = uris.find((u) => !redirectAllowed(u, extraRedirects));
    if (bad) return { error: "invalid_redirect_uri", error_description: `Redirect URI not allowed: ${bad}` };
    const method = meta.token_endpoint_auth_method || "none";
    if (method !== "none") return { error: "invalid_client_metadata", error_description: "Only public clients (token_endpoint_auth_method \"none\") are supported." };
    const name = String(meta.client_name || "").slice(0, 80);
    const body = b64url(JSON.stringify({ r: uris, n: name, t: Math.floor(Date.now() / 1000), j: b64url(randomBytes(6)) }));
    const clientId = `dcr.${body}.${sign(clientKey, body)}`;
    return {
      client_id: clientId, client_id_issued_at: Math.floor(Date.now() / 1000), client_name: name, redirect_uris: uris,
      token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"],
    };
  }

  const cimdCache = new Map(); // url -> { at, doc }
  async function resolveClient(clientId) {
    clientId = String(clientId || "");
    if (clientId.startsWith("dcr.")) {
      const [, body, sig] = clientId.split(".");
      if (!body || !sig || !sameString(sig, sign(clientKey, body))) return null;
      try {
        const d = JSON.parse(Buffer.from(body, "base64url").toString());
        return { id: clientId, name: d.n || "AI assistant", redirectUris: d.r || [] };
      } catch { return null; }
    }
    if (clientId.startsWith("https://")) {
      let u;
      try { u = new URL(clientId); } catch { return null; }
      const host = u.hostname.toLowerCase();
      if (!cimdHosts.some((h) => host === h || host.endsWith(`.${h}`)) || u.port || u.hash || u.username || u.pathname.length < 2) return null;
      const hit = cimdCache.get(clientId);
      if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.doc;
      try {
        const r = await fetchImpl(clientId, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
        const text = r.ok ? await r.text() : "";
        if (!text || text.length > 65536) return null;
        const d = JSON.parse(text);
        if (d.client_id !== clientId || !Array.isArray(d.redirect_uris)) return null;
        const method = d.token_endpoint_auth_method || "none";
        if (!["none", "private_key_jwt"].includes(method)) return null;
        if (method === "private_key_jwt" && !d.jwks?.keys && !String(d.jwks_uri || "").startsWith("https://")) return null;
        const doc = { id: clientId, name: String(d.client_name || host).slice(0, 80), redirectUris: d.redirect_uris.map(String), authMethod: method, jwks: d.jwks?.keys ? d.jwks : null, jwksUri: d.jwks_uri || null };
        cimdCache.set(clientId, { at: Date.now(), doc });
        return doc;
      } catch { return null; }
    }
    return null;
  }

  // --- client authentication (private_key_jwt, RFC 7523) -----------------
  const ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  const usedJtis = new Map(); // jti -> expiry
  const jwksCache = new Map(); // uri -> { at, keys }
  async function clientKeys(client) {
    if (client.jwks?.keys) return client.jwks.keys;
    const uri = String(client.jwksUri || "");
    let u;
    try { u = new URL(uri); } catch { return []; }
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.port || !cimdHosts.some((h) => host === h || host.endsWith(`.${h}`))) return [];
    const hit = jwksCache.get(uri);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.keys;
    try {
      const r = await fetchImpl(uri, { redirect: "error", signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
      const text = r.ok ? await r.text() : "";
      const keys = text && text.length < 65536 ? JSON.parse(text).keys || [] : [];
      jwksCache.set(uri, { at: Date.now(), keys });
      return keys;
    } catch { return []; }
  }
  function verifySignature(alg, jwk, data, sig) {
    const key = createPublicKey({ key: jwk, format: "jwk" });
    if (alg === "RS256") return cryptoVerify("sha256", data, { key, padding: cryptoConstants.RSA_PKCS1_PADDING }, sig);
    if (alg === "PS256") return cryptoVerify("sha256", data, { key, padding: cryptoConstants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, sig);
    if (alg === "ES256") return cryptoVerify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, sig);
    if (alg === "EdDSA") return cryptoVerify(null, data, key, sig);
    return false;
  }
  // The client id from a valid client assertion of this client, or null.
  async function verifyClientAssertion(assertion, client) {
    const parts = String(assertion || "").split(".");
    if (parts.length !== 3) return null;
    let header, claims;
    try { header = JSON.parse(Buffer.from(parts[0], "base64url").toString()); claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()); } catch { return null; }
    if (!["RS256", "PS256", "ES256", "EdDSA"].includes(header.alg)) return null;
    const now = Math.floor(Date.now() / 1000);
    const aud = [].concat(claims.aud || []);
    if (claims.iss !== client.id || claims.sub !== client.id) return null;
    if (!aud.some((a) => a === `${baseUrl}/oauth/token` || a === baseUrl)) return null;
    if (!(claims.exp > now) || claims.exp > now + 600 || (claims.nbf && claims.nbf > now + 60)) return null;
    if (!claims.jti || usedJtis.has(`${client.id} ${claims.jti}`)) return null;
    const keys = (await clientKeys(client)).filter((k) => !header.kid || k.kid === header.kid);
    const data = Buffer.from(`${parts[0]}.${parts[1]}`);
    const sig = Buffer.from(parts[2], "base64url");
    const ok = keys.some((k) => { try { return verifySignature(header.alg, k, data, sig); } catch { return false; } });
    if (!ok) return null;
    usedJtis.set(`${client.id} ${claims.jti}`, claims.exp * 1000);
    for (const [j, exp] of usedJtis) if (exp < Date.now()) usedJtis.delete(j);
    return client.id;
  }
  // Which client is calling the token endpoint, checked the way it registered.
  async function authenticateClient(b) {
    const assertion = b.client_assertion_type === ASSERTION_TYPE ? String(b.client_assertion || "") : "";
    let clientId = String(b.client_id || "");
    if (!clientId && assertion) {
      try { clientId = JSON.parse(Buffer.from(assertion.split(".")[1] || "", "base64url").toString()).iss || ""; } catch {}
    }
    const client = await resolveClient(clientId);
    if (!client) return null;
    if (client.authMethod === "private_key_jwt") return (await verifyClientAssertion(assertion, client)) ? client : null;
    return client;
  }

  // --- tokens -----------------------------------------------------------
  function issueAccessToken(userId, clientId, scopes) {
    const now = Math.floor(Date.now() / 1000);
    const payload = b64url(JSON.stringify({ iss: baseUrl, aud: resource, sub: userId, cid: clientId.slice(0, 300), scp: scopes, iat: now, exp: now + ACCESS_TTL_S, jti: b64url(randomBytes(9)) }));
    return `eiv1.${payload}.${sign(tokenKey, `eiv1.${payload}`)}`;
  }
  function verifyAccessToken(token) {
    const parts = String(token || "").split(".");
    if (parts.length !== 3 || parts[0] !== "eiv1") return null;
    if (!sameString(parts[2], sign(tokenKey, `eiv1.${parts[1]}`))) return null;
    let p;
    try { p = JSON.parse(Buffer.from(parts[1], "base64url").toString()); } catch { return null; }
    if (p.iss !== baseUrl || p.aud !== resource || !(p.exp > Date.now() / 1000) || !p.sub) return null;
    return { userId: p.sub, clientId: p.cid, scopes: Array.isArray(p.scp) ? p.scp : [], expiresAt: p.exp };
  }
  const refreshKvKey = (token) => `einvite:mcp-refresh-${sha256(token).toString("hex")}`;
  async function issueRefreshToken(userId, clientId, scopes) {
    const token = `eivr.${b64url(randomBytes(32))}`;
    await kvWrite(refreshKvKey(token), JSON.stringify({ userId, clientId, scopes, res: resource, exp: Date.now() + REFRESH_TTL_MS }));
    return token;
  }
  async function useRefreshToken(token) {
    if (!/^eivr\.[A-Za-z0-9_-]{30,60}$/.test(String(token || ""))) return null;
    const raw = await kvRead(refreshKvKey(token));
    const rec = raw ? JSON.parse(raw) : null;
    if (!rec || rec.used || !(rec.exp > Date.now()) || (rec.res && rec.res !== resource)) return null;
    await kvWrite(refreshKvKey(token), JSON.stringify({ ...rec, used: Date.now() }));
    return rec;
  }

  const codes = new Map(); // code -> { userId, clientId, redirectUri, challenge, scopes, resource, exp }
  setInterval(() => { const now = Date.now(); for (const [c, v] of codes) if (v.exp < now) codes.delete(c); }, 60000).unref();

  // --- authorization page ----------------------------------------------
  function parseScopes(scope) {
    const asked = String(scope || "").split(/\s+/).filter(Boolean);
    if (!asked.length) return Object.keys(SCOPES);
    const known = asked.filter((s) => SCOPES[s]);
    return known.length ? [...new Set(known)] : null;
  }
  // The resource the client named is this MCP server (scheme and host
  // compared case-insensitively, a trailing slash ignored).
  const canonical = (r) => { try { const u = new URL(String(r)); if (u.hash) return null; return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`.toLowerCase(); } catch { return null; } };
  const sameResource = (r) => !r || canonical(r) === canonical(resource);

  // Checks an authorization request. Errors that mustn't go back to an
  // unverified redirect URI are shown on the page instead.
  async function checkAuthorizeRequest(q) {
    const client = await resolveClient(q.client_id);
    if (!client) return { page: "This app isn't registered with eInvite.me (unknown client_id)." };
    const redirectUri = String(q.redirect_uri || "");
    if (!redirectUri || !client.redirectUris.includes(redirectUri) || !redirectAllowed(redirectUri, extraRedirects)) {
      return { page: "The return address (redirect_uri) of this app isn't allowed." };
    }
    const fail = (error, description) => ({ redirect: withParams(redirectUri, { error, error_description: description, state: q.state, iss: baseUrl }) });
    if (q.response_type !== "code") return fail("unsupported_response_type", "Only response_type=code is supported.");
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(String(q.code_challenge || "")) || q.code_challenge_method !== "S256") return fail("invalid_request", "PKCE with S256 is required.");
    if (!sameResource(q.resource)) return fail("invalid_target", `resource must be ${resource}`);
    const scopes = parseScopes(q.scope);
    if (!scopes) return fail("invalid_scope", `Supported scopes: ${Object.keys(SCOPES).join(" ")}`);
    return { client, redirectUri, scopes, state: q.state ? String(q.state).slice(0, 500) : undefined, challenge: String(q.code_challenge) };
  }
  function withParams(uri, params) {
    const u = new URL(uri);
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
    return u.toString();
  }
  // The checked request travels through the form signed, so the POST can't
  // swap the client, redirect URI, scopes or PKCE challenge.
  const packRequest = (r) => {
    const body = b64url(JSON.stringify({ c: r.client.id, u: r.redirectUri, s: r.scopes, st: r.state, ch: r.challenge, e: Date.now() + REQUEST_TTL_MS }));
    return `${body}.${sign(requestKey, body)}`;
  };
  function unpackRequest(packed) {
    const [body, sig] = String(packed || "").split(".");
    if (!body || !sig || !sameString(sig, sign(requestKey, body))) return null;
    try {
      const d = JSON.parse(Buffer.from(body, "base64url").toString());
      return d.e > Date.now() ? d : null;
    } catch { return null; }
  }

  function page(res, status, title, inner) {
    res.status(status).set({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-frame-options": "DENY", "content-security-policy": "frame-ancestors 'none'; default-src 'self'; style-src 'unsafe-inline'" }).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title>
<style>
body{margin:0;background:#F4EDE4;color:#1F3A2E;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:400px;margin:48px auto;padding:0 16px}
.card{background:#fff;border-radius:18px;padding:28px 24px;box-shadow:0 20px 50px -30px rgba(31,58,46,.4)}
.brand{font-family:Georgia,serif;font-size:26px;margin:0 0 4px}.brand i{color:#B8923F}
h1{font-size:17px;margin:14px 0 6px}p{font-size:14px;line-height:1.55;color:#4b5f56;margin:6px 0}
ul{padding-left:18px;font-size:14px;color:#4b5f56;line-height:1.6}
label{display:block;font-size:12px;font-weight:600;margin:14px 0 5px;color:#1F3A2E}
input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d9cfbf;border-radius:10px;font-size:15px;background:#FBF8F3}
button{width:100%;margin-top:16px;padding:12px;border:0;border-radius:10px;background:#1F3A2E;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
button.secondary{background:transparent;color:#1F3A2E;border:1px solid #d9cfbf;margin-top:10px}
.err{background:#fdecec;color:#9c3b3b;padding:10px 12px;border-radius:10px;font-size:13px;margin-top:12px}
.small{font-size:12px;color:#7b8c84}
</style></head><body><main><div class="card"><p class="brand">eInvite<i>.me</i></p>${inner}</div></main></body></html>`);
  }

  function consentHtml(r, packed, user, error) {
    const scopeList = r.s.map((s) => `<li>${escapeHtml(SCOPES[s])}</li>`).join("");
    const host = (() => { try { return new URL(r.u).host; } catch { return ""; } })();
    const who = user
      ? `<p>Signed in as <b>${escapeHtml(user.name || user.email)}</b> (${escapeHtml(user.email || "")}).</p>
         <form method="post" action="/oauth/authorize"><input type="hidden" name="req" value="${escapeHtml(packed)}"><input type="hidden" name="action" value="session">
         <button type="submit">Allow</button></form>
         <form method="post" action="/oauth/authorize"><input type="hidden" name="req" value="${escapeHtml(packed)}"><input type="hidden" name="action" value="deny"><button class="secondary" type="submit">Cancel</button></form>
         <p class="small">Not you? Sign in with another account:</p>`
      : "";
    return `<h1>${escapeHtml(r.clientName)} wants to use your eInvite.me account</h1>
<p>It will be able to:</p><ul>${scopeList}</ul>
<p class="small">It can't send WhatsApp messages, publish, delete or pay for anything. You'll return to ${escapeHtml(host)}.</p>
${error ? `<div class="err">${escapeHtml(error)}</div>` : ""}
${who}
<form method="post" action="/oauth/authorize" autocomplete="on">
<input type="hidden" name="req" value="${escapeHtml(packed)}"><input type="hidden" name="action" value="login">
<label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="username">
<label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password">
<button type="submit">Sign in and allow</button></form>
<form method="post" action="/oauth/authorize"><input type="hidden" name="req" value="${escapeHtml(packed)}"><input type="hidden" name="action" value="deny"><button class="secondary" type="submit">Cancel</button></form>
<p class="small">Signed up with Google? Sign in at ${escapeHtml(baseUrl.replace(/^https?:\/\//, ""))} first in this browser, then come back and press Allow.</p>`;
  }

  async function currentSessionUser(req) {
    const id = sessionUserId(req);
    if (!id) return null;
    const u = await findUser(id).catch(() => null);
    return u && userAllowed(u) === true ? u : null;
  }

  // --- routes -----------------------------------------------------------
  const router = express.Router();
  const cors = (req, res, next) => {
    res.set({ "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type, mcp-protocol-version", "access-control-allow-methods": "GET, POST, OPTIONS" });
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  };
  for (const p of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) {
    router.all(p, cors, (_req, res) => res.set("cache-control", "public, max-age=300").json(protectedResourceMetadata()));
  }
  for (const p of ["/.well-known/oauth-authorization-server", "/.well-known/openid-configuration"]) {
    router.all(p, cors, (_req, res) => res.set("cache-control", "public, max-age=300").json(authorizationServerMetadata()));
  }

  const registerHits = new Map(); // ip -> { count, since }
  router.options("/oauth/register", cors);
  router.post("/oauth/register", cors, express.json({ limit: "16kb" }), (req, res) => {
    const ip = clientIp(req), now = Date.now();
    const h = registerHits.get(ip);
    const cur = h && now - h.since < 3600000 ? h : { count: 0, since: now };
    if (cur.count >= 60) return res.status(429).json({ error: "slow_down", error_description: "Too many registrations." });
    registerHits.set(ip, { count: cur.count + 1, since: cur.since });
    const out = registerClient(req.body || {});
    res.set("cache-control", "no-store").status(out.error ? 400 : 201).json(out);
  });

  router.get("/oauth/authorize", async (req, res) => {
    const r = await checkAuthorizeRequest(req.query);
    if (r.page) return page(res, 400, "Can't connect", `<h1>Can't connect</h1><p>${escapeHtml(r.page)}</p>`);
    if (r.redirect) return res.redirect(302, r.redirect);
    const packed = packRequest(r);
    const req2 = { ...unpackRequest(packed), clientName: r.client.name };
    page(res, 200, "Connect to eInvite.me", consentHtml(req2, packed, await currentSessionUser(req)));
  });

  router.post("/oauth/authorize", express.urlencoded({ extended: false, limit: "8kb" }), async (req, res) => {
    const d = unpackRequest(req.body?.req);
    if (!d) return page(res, 400, "Expired", "<h1>This sign-in page expired</h1><p>Go back to ChatGPT and connect again.</p>");
    const client = await resolveClient(d.c);
    if (!client || !client.redirectUris.includes(d.u)) return page(res, 400, "Can't connect", "<h1>Can't connect</h1><p>Unknown app.</p>");
    const back = (params) => res.redirect(302, withParams(d.u, { ...params, state: d.st, iss: baseUrl }));
    const action = String(req.body?.action || "");
    if (action === "deny") return back({ error: "access_denied", error_description: "The user cancelled." });

    let user = null;
    const again = async (msg) => page(res, 200, "Connect to eInvite.me", consentHtml({ ...d, clientName: client.name, s: d.s, u: d.u }, req.body.req, await currentSessionUser(req), msg));
    if (action === "session") {
      user = await currentSessionUser(req);
      if (!user) return again("Your eInvite.me session ended — please sign in.");
    } else if (action === "login") {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const limitKeys = [`ip:${clientIp(req)}`, `email:${email}`];
      if (loginBlocked(limitKeys)) return again("Too many wrong attempts. Please try again in 15 minutes.");
      const found = email && password ? await checkPassword(email, password).catch(() => null) : null;
      if (!found) { noteLoginFailure(limitKeys); return again("Incorrect email or password."); }
      const allowed = userAllowed(found);
      if (allowed !== true) return again(allowed);
      user = found;
    } else {
      return again();
    }
    const code = b64url(randomBytes(32));
    codes.set(code, { userId: user.id, clientId: client.id, redirectUri: d.u, challenge: d.ch, scopes: d.s, exp: Date.now() + CODE_TTL_MS });
    back({ code });
  });

  router.options("/oauth/token", cors);
  router.post("/oauth/token", cors, express.urlencoded({ extended: false, limit: "16kb" }), express.json({ limit: "16kb" }), async (req, res) => {
    res.set({ "cache-control": "no-store", pragma: "no-cache" });
    const b = req.body || {};
    const err = (status, error, error_description) => res.status(status).json({ error, error_description });
    try {
      if (b.grant_type === "authorization_code") {
        const rec = codes.get(String(b.code || ""));
        codes.delete(String(b.code || ""));
        if (!rec || rec.exp < Date.now()) return err(400, "invalid_grant", "The code is invalid or expired.");
        const client = await authenticateClient(b);
        if (!client) return err(401, "invalid_client", "Client authentication failed.");
        if (rec.clientId !== client.id || rec.redirectUri !== String(b.redirect_uri || "")) return err(400, "invalid_grant", "client_id or redirect_uri doesn't match.");
        const verifier = String(b.code_verifier || "");
        if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !sameString(b64url(sha256(verifier)), rec.challenge)) return err(400, "invalid_grant", "PKCE verification failed.");
        if (!sameResource(b.resource)) return err(400, "invalid_target", `resource must be ${resource}`);
        const user = await findUser(rec.userId);
        if (!user || userAllowed(user) !== true) return err(400, "invalid_grant", "The account can't be used.");
        return res.json({ access_token: issueAccessToken(user.id, rec.clientId, rec.scopes), token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: await issueRefreshToken(user.id, rec.clientId, rec.scopes), scope: rec.scopes.join(" ") });
      }
      if (b.grant_type === "refresh_token") {
        const client = await authenticateClient(b);
        if (!client) return err(401, "invalid_client", "Client authentication failed.");
        const rec = await useRefreshToken(b.refresh_token);
        if (!rec || rec.clientId !== client.id) return err(400, "invalid_grant", "The refresh token is invalid or expired.");
        if (!sameResource(b.resource)) return err(400, "invalid_target", `resource must be ${resource}`);
        const asked = b.scope ? parseScopes(b.scope) : rec.scopes;
        if (!asked || asked.some((s) => !rec.scopes.includes(s))) return err(400, "invalid_scope", "Can't widen the granted scopes.");
        const user = await findUser(rec.userId);
        if (!user || userAllowed(user) !== true) return err(400, "invalid_grant", "The account can't be used.");
        return res.json({ access_token: issueAccessToken(user.id, rec.clientId, asked), token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: await issueRefreshToken(user.id, rec.clientId, asked), scope: asked.join(" ") });
      }
      return err(400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
    } catch (e) {
      console.error("mcp oauth token failed:", e.message);
      return err(500, "server_error", "Please try again.");
    }
  });

  // Revoking a refresh token (RFC 7009); access tokens just expire.
  router.options("/oauth/revoke", cors);
  router.post("/oauth/revoke", cors, express.urlencoded({ extended: false, limit: "8kb" }), async (req, res) => {
    const token = String(req.body?.token || "");
    if (/^eivr\./.test(token)) await useRefreshToken(token).catch(() => null);
    res.set("cache-control", "no-store").status(200).end();
  });

  return { router, verifyAccessToken, wwwAuthenticate, resource, protectedResourceMetadata, authorizationServerMetadata };
}
