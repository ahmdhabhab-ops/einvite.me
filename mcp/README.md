# eInvite.me ChatGPT plugin (MCP server)

This lets a couple use eInvite.me from ChatGPT. They sign in to their own
eInvite.me account, then ChatGPT can list their invitation, create a draft,
edit the draft, and show who has replied.

- MCP server: `https://<your domain>/mcp` (Streamable HTTP, stateless, JSON responses)
- Sign-in: OAuth 2.1 with PKCE, served by this same app (`/oauth/*`)
- Code: `mcp/oauth.js` (sign-in), `mcp/tools.js` (tools), `shared/invitation-defaults.js` (new-invitation data, shared with the Builder)
- Tests: `tests/mcp-plugin.test.js` (`npm test`)

It is **off** until `MCP_ENABLED=1` is set, so deploying this code changes
nothing on the live site by itself.

## Listing details

| | |
|---|---|
| Name | eInvite.me |
| Short description | Create and edit digital wedding and event invitation drafts on eInvite.me, and check who has replied (RSVP). |
| Long description | Plan your invitation by chatting. Sign in with your eInvite.me account and ask ChatGPT to start a draft from the couple's names, the date, the places and the language (English, Arabic, French, Spanish or Armenian), change those details, or see how many guests are coming, declined, or haven't replied yet. Drafts get a preview link. Choosing a design, adding guests, sending invitations and publishing stay in the eInvite.me app. |
| Category | Lifestyle / Productivity |
| Privacy policy | `https://cores.einvite.me/privacy` (needs a ChatGPT section, see below) |
| Support | The eInvite.me contact page or email |

## Tools

Every tool runs as the signed-in account only. The account is re-read on
every call, so a frozen or deleted account stops working at once. The
invitation is always found through the caller's own user record. Another
account's id gets the same "not found" answer as an id that doesn't exist.

| Tool | What it does | Scope | readOnly | destructive | openWorld |
|---|---|---|---|---|---|
| `list_invitations` | The account's invitation: id, names, date, languages, places, status (draft/published), preview link | `invitations:read` | true | false | false |
| `create_invitation_draft` | New **draft** from names, date, time, places, language and an optional intro sentence. Returns the preview link. Refused if the account already has an invitation (eInvite.me has one per account). | `invitations:write` | false | false | false |
| `update_invitation_draft` | Changes names, date, time, places or intro sentence of a **draft**. Only the fields passed change. Published invitations are refused. | `invitations:write` | false | true (overwrites text) | false |
| `get_rsvp_summary` | Families and people coming, declined, and no reply, with family names. No phone numbers. | `invitations:read` | true | false | false |

Out of scope for v1, and not reachable through any tool:

- sending WhatsApp messages
- publishing an invitation
- deleting
- payments and package changes

A draft is saved exactly like a new invitation saved from the Builder:

- It uses the same data shape (from `shared/invitation-defaults.js`).
- It gets a link at `/e/<id>`, same as the Builder gives.
- It has no package (`packageTier` stays empty).

Pages that need details the couple hasn't given start hidden: family,
timeline, gift registry, DJ, networking and live stream. They can be
switched on in the Builder.

## Sign-in (OAuth) details

**Discovery**
- `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp` (RFC 9728).
- `/.well-known/oauth-authorization-server`, also served at `/.well-known/openid-configuration` (RFC 8414).
- `authorization_response_iss_parameter_supported: true` (RFC 9207). The `iss` parameter is returned on every redirect, so ChatGPT can use its stable redirect URI.

**Flow**
- Authorization code + PKCE, S256 only.
- `resource` must be `<base>/mcp` and becomes the token audience. Scheme and host are compared case-insensitively and a trailing slash is ignored, as the MCP spec recommends.

**Clients**
- Client ID Metadata Documents: an `https://` `client_id`, fetched only from `chatgpt.com` / `openai.com` hosts by default.
- Client ID Metadata Documents may use `token_endpoint_auth_method` `none` or `private_key_jwt`. For `private_key_jwt`, the token endpoint checks a signed client assertion (RFC 7523): RS256, PS256, ES256 or EdDSA, with keys from the document's `jwks` or `jwks_uri` (same allowed hosts). The assertion's `iss`/`sub` must be the client id and `aud` the token endpoint or issuer; it must expire within 10 minutes, and each `jti` works once.
- The `client_id` must be an https URL with a path, and must match the fetched document's `client_id` exactly.
- Dynamic client registration at `/oauth/register` (public clients). Nothing is stored; the client id is signed.

**Redirect URIs allowed**
- `https://chatgpt.com/connector_platform_oauth_redirect`
- `https://chatgpt.com/connector/oauth/<id>`
- Anything listed in `MCP_EXTRA_REDIRECT_URIS`.

**Sign-in page**
- Email + password of the eInvite.me account. The site's existing per-IP and per-email limit on wrong attempts applies.
- Someone already signed in on the site in that browser (including Google sign-ins) can just press **Allow**.
- Only **active** client accounts are accepted. Pending, frozen and designer accounts are refused.

**Tokens**
- Access tokens: signed, valid 1 hour, audience-checked on every request.
- Refresh tokens: valid 30 days, stored hashed in `kv_store` as `einvite:mcp-refresh-*` (admin-only key), and replaced on every use. A used one can't be used again. Each one is bound to the server that issued it, so a staging token doesn't work on production.
- Revocation endpoint: `/oauth/revoke`.

**Errors**
- `401` with `WWW-Authenticate: Bearer resource_metadata="…", scope="…"` when the token is missing or invalid.
- Inside a tool call, a missing permission or an account that can no longer be used returns an error result with `_meta["mcp/www_authenticate"]` (`error="insufficient_scope"` or `"invalid_token"`, plus the scopes needed). This is how OpenAI's Apps SDK auth example asks ChatGPT to show its connect / re-connect prompt.
- Each tool lists `securitySchemes` (`oauth2` + scopes) both on the tool and in its `_meta`, as in OpenAI's example.

## Checked against the official specs

The OpenAI developer pages (developers.openai.com) can't be opened from the development sandbox, so this was checked against:
- **MCP authorization spec, version 2025-11-25**, from the official `modelcontextprotocol/modelcontextprotocol` repository (`docs/specification/2025-11-25/basic/authorization.mdx`);
- **OpenAI's official Apps SDK example** `openai/openai-apps-sdk-examples` (`authenticated_server_python`);
- **search summaries** of the OpenAI plugin pages (auth, MCP server, review, submission). These are marked "search" below and must be confirmed in the live test.

| Requirement | Source | Status |
|---|---|---|
| Protected resource metadata (RFC 9728), with `authorization_servers` | MCP spec (MUST) | ✓ at the root and at `/mcp` |
| `WWW-Authenticate` on 401, with `resource_metadata` and `scope` | MCP spec (MUST / SHOULD) | ✓ |
| AS metadata (RFC 8414) or OIDC discovery | MCP spec (MUST, one of) | ✓ both paths |
| `code_challenge_methods_supported` (clients refuse without it) | MCP spec (MUST) | ✓ `S256` |
| PKCE S256 | MCP spec (MUST) | ✓ required |
| `resource` parameter (RFC 8707), token audience checked | MCP spec (MUST) | ✓ |
| Tokens only in the `Authorization` header, never in the URL | MCP spec (MUST) | ✓ header only |
| Invalid or expired token → 401 | MCP spec (MUST) | ✓ |
| Short-lived access tokens; refresh rotation for public clients | MCP spec (SHOULD / MUST) | ✓ 1 h, rotated |
| CIMD: https URL with a path, `client_id` matches, redirect URIs from the doc | MCP spec (MUST) | ✓ |
| CIMD: SSRF care, trust policy | MCP spec (SHOULD / MAY) | ✓ allowed hosts only, no redirects, size and time limits |
| Show the redirect hostname on the consent page | MCP spec (MUST, CIMD) | ✓ "You'll return to …" |
| Exact redirect URI match, `state` returned | MCP spec (MUST / SHOULD) | ✓ |
| All auth endpoints on https; redirect URIs https or localhost | MCP spec (MUST) | ✓ the server refuses to start the plugin on a non-https `MCP_PUBLIC_URL` (except localhost) |
| DCR | MCP spec (MAY) | ✓ |
| Insufficient scope during a call | MCP spec (SHOULD 403) + OpenAI example (`mcp/www_authenticate`) | ✓ the OpenAI form, since scopes are checked per tool inside one MCP request |
| `securitySchemes` on tools | OpenAI example | ✓ |
| RFC 9207 `iss`; stable redirect `https://chatgpt.com/connector_platform_oauth_redirect`; per-connection `https://chatgpt.com/connector/oauth/{id}` | OpenAI auth page (search) | ✓ to confirm live |
| CIMD client doc `https://chatgpt.com/oauth/client.json`, with `none` or `private_key_jwt` | OpenAI auth page (search) | ✓ both supported; confirm live which one ChatGPT uses |
| Tool annotations `readOnlyHint` / `destructiveHint` / `openWorldHint` on every tool | OpenAI review page (search) | ✓ |
| Domain challenge at `/.well-known/openai-apps-challenge` | OpenAI submission page (search) | ✓ (`OPENAI_APPS_CHALLENGE_TOKEN`) |

## Settings (environment variables)

Set these on the app in Dokploy. Only names are listed here; never paste values into chats.

| Name | Needed | What it is |
|---|---|---|
| `MCP_ENABLED` | yes | `1` turns the plugin on |
| `MCP_PUBLIC_URL` | yes | The public https origin, e.g. `https://cores.einvite.me` (no trailing slash). Used as the OAuth issuer and in preview links. |
| `MCP_TOKEN_SECRET` | yes | Its own long random secret for signing tokens and sign-in requests: at least 32 random bytes, never derived from another key. Without a strong one the plugin doesn't start. Use a different one for staging and production. Changing it signs everyone out of ChatGPT. |
| `MCP_ALLOWED_EMAILS` | no | Comma-separated emails. When set, only these accounts can connect (staging, or a soft launch). Others see "isn't open to this account yet". |
| `MCP_EXTRA_REDIRECT_URIS` | no | Comma-separated extra redirect URIs (exact, or ending in `*`) for testing tools like the MCP Inspector |
| `MCP_CIMD_HOSTS` | no | Hosts allowed to serve client metadata documents (default `chatgpt.com,openai.com`) |
| `OPENAI_APPS_CHALLENGE_TOKEN` | for submission | The domain-verification token from OpenAI's submission portal, served at `/.well-known/openai-apps-challenge` |

The plugin also uses the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD`.

## MCP_TOKEN_SECRET: making and storing it

Make it on the server, paste it straight into Dokploy, and never type or paste it anywhere else: no chat, no screenshot, no file in the repo.

1. In Dokploy, open the server's **Terminal**, or SSH to the server.
2. Run one of:
   - `openssl rand -base64 48`
   - `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
3. Copy the output. In Dokploy open the app → **Environment**, add `MCP_TOKEN_SECRET=` followed by the value, and **Save**. Clear the terminal (`clear`).
4. Redeploy. The log line `chatgpt plugin: MCP server on …` shows it was accepted; `MCP_TOKEN_SECRET must be set…` means it's missing or too short.

Staging and production each get their own value. To rotate it (if it ever leaks), set a new value and redeploy: every ChatGPT connection then has to sign in again.

## Staging test (before production)

Recommended: a **second Dokploy app** from the same repository, on its own domain, limited to test accounts.

1. **DNS:** add an `A` record `staging.einvite.me` → the server's IP.
2. **Dokploy:** create an app `einvite-staging` from the same repository and branch (`main`). Add the domain `staging.einvite.me` with HTTPS (Let's Encrypt).
3. **Environment of the staging app:**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`: same as production (see the note below).
   - `MCP_ENABLED=1`
   - `MCP_PUBLIC_URL=https://staging.einvite.me`
   - `MCP_TOKEN_SECRET`: a new value made as above, different from production.
   - `MCP_ALLOWED_EMAILS`: only the test accounts, e.g. `plugin-test-1@…,plugin-test-2@…`.
   - **Leave out** the WhatsApp/Meta keys, `WHATSAPP_INBOX_FORWARD_URL`, `FAL_KEY`, `BRIDAL_STUDIO_ENABLED` and payment keys, so staging can't send messages or spend money.
4. **Test accounts:** sign up on the site with 2 new emails and approve them in **Admin → Users**.
   - Test 1 stays without an invitation, for draft creation.
   - Test 2 gets an invitation with 3 to 4 guest families and a couple of replies, for the RSVP summary.
5. Deploy staging and check the 4 links below.

**Note on data:** this staging app uses the production database. That's why it's limited to `MCP_ALLOWED_EMAILS` test accounts and has no messaging or payment keys. What it can change: the test accounts' own drafts, plus refresh-token records (`einvite:mcp-refresh-*`, bound to staging). A fully separate staging needs its own Supabase. That is safer, but a bigger setup.

**Checks (in a browser):**
- `https://staging.einvite.me/.well-known/oauth-protected-resource/mcp` → JSON whose `resource` is `https://staging.einvite.me/mcp`.
- `https://staging.einvite.me/.well-known/oauth-authorization-server` → JSON with `"code_challenge_methods_supported":["S256"]`.
- `https://staging.einvite.me/mcp` → `{"error":"unauthorized",…}` (sign-in needed).
- The staging log shows `chatgpt plugin: MCP server on https://staging.einvite.me/mcp (limited to 2 account(s))`.

## Turning it on in production (after the staging test and approval)

1. In the production app's Environment: `MCP_ENABLED=1`, `MCP_PUBLIC_URL=https://cores.einvite.me`, and a production `MCP_TOKEN_SECRET` (made as above). Optionally keep `MCP_ALLOWED_EMAILS` for a soft launch.
2. Redeploy. The log should show `chatgpt plugin: MCP server on https://cores.einvite.me/mcp`.
3. Repeat the 4 checks above on `cores.einvite.me`.

## Existing clients with published invitations

"Published" means the account has a package (`packageTier`, after payment).

| Tool | Draft | Published |
|---|---|---|
| `list_invitations` | shown, status `draft` | shown, status `published` |
| `get_rsvp_summary` | works | works (read-only) |
| `update_invitation_draft` | works | **refused**: "This invitation is published, so it can only be changed in the eInvite.me app." |
| `create_invitation_draft` | creates the account's invitation | **refused**: the account already has one (one invitation per account) |

So a published invitation is never changed from ChatGPT: guests keep seeing exactly what the couple published. The same goes for accounts with a saved but unpaid invitation: they can edit it as a draft, and can't create a second one.

Ways to allow edits to published invitations later, to decide on:
1. Keep read-only (v1).
2. Let ChatGPT **propose** changes that the couple confirms in the app before guests see them.
3. Allow direct edits to published invitations for some fields only (e.g. time, venue), with a clear warning in the tool description.

## Testing with ChatGPT, step by step (staging first)

Use the staging URL `https://staging.einvite.me/mcp` until production is approved.

1. **Developer mode:** in ChatGPT (web), open **Settings → Security and login** and turn on **Developer mode**.
2. **Add the plugin:** open **Plugins**, press **+**, and enter:
   - name `eInvite.me (staging)`;
   - MCP server URL `https://staging.einvite.me/mcp`;
   - authentication **OAuth**.
   ChatGPT reads the rest from the server.
3. **Install and sign in:** open the plugin and press **+** to install. A new page opens on `staging.einvite.me`, saying **"ChatGPT wants to use your eInvite.me account"** and "You'll return to chatgpt.com".
   - Sign in with **Test 1** and press **Sign in and allow**. You return to ChatGPT, connected.
   - If the page says **"unknown client_id"** or **"return address … isn't allowed"**, stop and send the exact message, never the URL, which may contain codes.
4. **New chat:** start a new chat with the plugin turned on (the **+** menu → eInvite.me).
5. **Create a draft:** use prompt 1 below. ChatGPT asks before running `create_invitation_draft` (a write tool). Allow it. Expected: "Draft created: Rita & Sami …" and a preview link. Open the link and tap "Tap to start" to see the names.
6. **List and edit:** run prompts 2 and 3. Expected: the invitation listed as **draft**, then "Updated event_date, …". Open the preview again to see the new date.
7. **RSVP summary:** disconnect, then connect again as **Test 2** (step 8 explains how) and run prompt 4. Expected: the numbers match the Test 2 dashboard, with family names and no phone numbers.
8. **Isolation:** as Test 2, ask for Test 1's invitation id (from step 6), e.g. "Show the RSVP summary of invitation rita-sami". Expected: "No invitation with that id in your account."
9. **Refusals:** run the "Should be refused" prompts. Nothing is sent, published or paid.
10. **Sign out and back in:** in ChatGPT's plugin settings, disconnect, then connect again. Then check that an account that isn't in `MCP_ALLOWED_EMAILS` gets "isn't open to this account yet".
11. **Token refresh:** come back after more than an hour and run prompt 2 again. It should work without a new sign-in.

Note anything unexpected, with the time, so the staging log can be checked.

### Test prompts

Should work:

1. "Using eInvite, create a wedding invitation draft for Rita and Sami on 21 August 2027 at 18:00, in English. Ceremony at Saint Maron Church, Gemmayze at 6 PM, reception at Le Royal, Dbayeh at 8:30 PM."
2. "Show my eInvite invitations."
3. "Change the date of my invitation to 4 September 2027 and the reception to 9 PM."
4. "How many guests are coming to my wedding? Who hasn't replied yet?"
5. "اعمل لي دعوة بالعربي لعرس ليا وكريم بـ 12 حزيران 2027 بكنيسة مار مخايل." (Arabic draft)

Should be refused:

1. "Send the invitation to my guests on WhatsApp." (out of scope, no tool)
2. "Publish my invitation" or "Pay for the premium package." (out of scope)
3. "Show the RSVP list of invitation other-couple." (another account's invitation: "not found")

## What's still needed to submit to the public plugin directory

- **OpenAI side**
  - A verified OpenAI organization/account allowed to submit.
  - The submission form: name, logo (square, high resolution), descriptions, company details, privacy policy URL, MCP URL, tool information, localization.
- **Domain verification:** set `OPENAI_APPS_CHALLENGE_TOKEN` to the token the portal shows, then redeploy.
- **Privacy policy:** a proposed update is in `docs/legal/privacy-policy-update-DRAFT.md`. It needs owner and legal review before it goes into `/privacy`.
- **Terms of service page:** there isn't one yet. A draft is in `docs/legal/terms-of-service-DRAFT.md`; it needs review, then a `/terms` page.
- **Reviewer test account:** an active eInvite.me client account with a sample invitation and replies, plus a second empty account to show draft creation. The credentials go in the submission form only.
- **Test cases and demo:** 5 positive and 3 negative test cases with expected responses (above), and a demo recording.
- **Google-only accounts:** these have no password, so they must sign in on the site first, then press Allow. A "set a password" option would make this smoother.
- **Production test:** run the full flow in ChatGPT developer mode on the real domain, since this was tested only locally. In particular:
  - CIMD fetch of ChatGPT's `client.json`;
  - the stable redirect URI;
  - the refresh flow.
