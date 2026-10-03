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
- `resource` must be `<base>/mcp` and becomes the token audience.

**Clients**
- Client ID Metadata Documents: an `https://` `client_id`, fetched only from `chatgpt.com` / `openai.com` hosts by default.
- Dynamic client registration at `/oauth/register`. Nothing is stored; the client id is signed.
- Public clients only (`none`).

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
- Refresh tokens: valid 30 days, stored hashed in `kv_store` as `einvite:mcp-refresh-*` (admin-only key), and replaced on every use. A used one can't be used again.
- Revocation endpoint: `/oauth/revoke`.

**Errors**
- `401` with `WWW-Authenticate: Bearer resource_metadata="…"` when the token is missing or invalid.

## Settings (environment variables)

Set these on the app in Dokploy. Only names are listed here; never paste values into chats.

| Name | Needed | What it is |
|---|---|---|
| `MCP_ENABLED` | yes | `1` turns the plugin on |
| `MCP_PUBLIC_URL` | yes | The public https origin, e.g. `https://cores.einvite.me` (no trailing slash). Used as the OAuth issuer and in preview links. |
| `MCP_TOKEN_SECRET` | recommended | A long random secret for signing tokens. If unset, it's derived from the Supabase service key. Changing it signs everyone out of ChatGPT. |
| `MCP_EXTRA_REDIRECT_URIS` | no | Comma-separated extra redirect URIs (exact, or ending in `*`) for testing tools like the MCP Inspector |
| `MCP_CIMD_HOSTS` | no | Hosts allowed to serve client metadata documents (default `chatgpt.com,openai.com`) |
| `OPENAI_APPS_CHALLENGE_TOKEN` | for submission | The domain-verification token from OpenAI's submission portal, served at `/.well-known/openai-apps-challenge` |

The plugin also uses the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD`.

## Turning it on (after approval)

1. Merge the PR and Redeploy in Dokploy.
2. Add `MCP_ENABLED=1` and `MCP_PUBLIC_URL=https://cores.einvite.me`. Optionally add `MCP_TOKEN_SECRET`.
3. Redeploy again. The server log should show `chatgpt plugin: MCP server on https://cores.einvite.me/mcp`.
4. Check that `https://cores.einvite.me/.well-known/oauth-protected-resource/mcp` returns JSON.

## Adding it to ChatGPT (developer mode)

1. In ChatGPT open **Settings → Security and login** and turn on **Developer mode**.
2. Open **Plugins**, press **+**, and enter the MCP server URL `https://cores.einvite.me/mcp`. Choose **OAuth** as authentication; it discovers everything else.
3. Create the plugin, open it and press **+** to install. ChatGPT opens the eInvite.me sign-in page. Sign in with a test client account (active, without an invitation) and press **Allow**.
4. Try the prompts below in a new chat with the plugin turned on.

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
- **Privacy policy:** add what the ChatGPT plugin accesses and stores:
  - invitation details;
  - RSVP counts and family names;
  - sign-in tokens, and how to revoke them.
- **Terms of service page:** there isn't one yet (only `/privacy`).
- **Reviewer test account:** an active eInvite.me client account with a sample invitation and replies, plus a second empty account to show draft creation. The credentials go in the submission form only.
- **Test cases and demo:** 5 positive and 3 negative test cases with expected responses (above), and a demo recording.
- **Google-only accounts:** these have no password, so they must sign in on the site first, then press Allow. A "set a password" option would make this smoother.
- **Production test:** run the full flow in ChatGPT developer mode on the real domain, since this was tested only locally. In particular:
  - CIMD fetch of ChatGPT's `client.json`;
  - the stable redirect URI;
  - the refresh flow.
