# Linking the eInvite Inbox (inbox.einvite.me)

`server.js` keeps handling the Meta webhook exactly as before (RSVP, QR reply,
delivery ticks, forwarding to `WHATSAPP_WEBHOOK_FORWARD_URL`). In addition,
every webhook that passes Meta's signature check is copied to the Inbox.

The copy is a convenience, never a dependency: if it cannot be stored or the
Inbox is down, Meta still gets `200` and the invitation flow is unaffected.

## How the copy works (`whatsapp-inbox-forwarder.js`)
- Raw bytes + original `X-Hub-Signature-256` are forwarded untouched; the Inbox verifies Meta's signature itself.
- Written to disk before answering Meta (atomic rename), delivered oldest-first in the background.
- Retries with backoff (max 5 min) on network errors, 5xx, 408, 429. A 4xx from the Inbox drops that entry.
- Survives restarts: leftover files are delivered on startup.
- Bounded: at most 2000 entries, entries older than 3 days are dropped.
- Disabled (does nothing) while `WHATSAPP_INBOX_FORWARD_URL` is empty or `off`.

## Settings on the `einvite-me` Dokploy service
| Variable | Value |
|---|---|
| `WHATSAPP_INBOX_FORWARD_URL` | `https://inbox.einvite.me/api/webhook` |
| `WHATSAPP_INBOX_QUEUE_DIR` | `/data/whatsapp-inbox-outbox` (default) |
| `WHATSAPP_APP_SECRET` (or `META_APP_SECRET`) | Meta app secret — **must be set**, and identical on the Inbox (`META_APP_SECRET`) |

Add a **persistent volume** mounted at `/data/whatsapp-inbox-outbox` *before* setting the URL, otherwise queued messages are lost on redeploy.

## Rollout order
1. Add the volume. Merge/deploy this change with `WHATSAPP_INBOX_FORWARD_URL` still unset (no behaviour change).
2. Check invitations, an RSVP "Yes" (QR comes back) and delivery ticks still work.
3. Set `WHATSAPP_INBOX_FORWARD_URL`, redeploy, send a test message to the business number: it should appear in the Inbox.
4. Rollback = unset `WHATSAPP_INBOX_FORWARD_URL`.

Tests: `npm test`.
