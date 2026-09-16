# Deploying to Dokploy (Hetzner VPS)

This app was a Vercel-hosted Vite/React SPA. Two Vercel-only pieces needed a
replacement for this move:

1. **Static hosting + SPA fallback** — was `vercel.json`'s catch-all rewrite.
   Now handled by `server.js` (Express), which serves `dist/` and falls back
   to `index.html` for any unmatched path (`/dj/:slug`, `/checkin/:token`,
   `/quick/:slug`, `/network/:slug`, `/e/:slug`, etc. are all client-side
   routes read from `window.location.pathname` inside `src/App.jsx`).
2. **Social-crawler OG tags** — was `middleware.js`, a Vercel Edge Function
   that only runs on Vercel. Its exact logic (detect crawler UA on `/e/:slug`,
   look up the invitation's og:image/title from the `kv_store` table, return
   a tiny static HTML doc) is ported into `server.js`. `middleware.js` and
   `vercel.json` are now dead weight for this deployment target — left in
   the repo untouched in case you ever go back to Vercel, but they are not
   used by Docker/Dokploy.

Nothing else needed a server: auth, payments (Whish), storage, RSVPs, live
streaming, and WhatsApp all already run as Supabase Edge Functions or via
direct Supabase REST/Storage calls from the browser — those keep running on
Supabase regardless of where the frontend is hosted.

## What's new in this repo

- `server.js` — production Node/Express server (static files + OG middleware + SPA fallback + `/healthz`).
- `Dockerfile` — multi-stage build: `npm run build` (Vite) → `npm run start` (Express) on Node 20 Alpine.
- `.dockerignore`
- `docker-compose.yml` — for local testing (`docker compose up --build`) or as an alternative Dokploy Compose service.
- `.env.example` — optional runtime overrides for `server.js` (the frontend's Supabase URL/key are compiled-in literals in `src/App.jsx`, not env-driven — see that file if you ever rotate the key).
- `.gitignore` — repo previously tracked no ignore file at all.

## Deploy via Dokploy

1. **Create the application**: In Dokploy, add a new Application, connect
   the `ahmdhabhab-ops/einvite.me` GitHub repo, branch `main` (or whichever
   you deploy from).
2. **Build type**: choose **Dockerfile** (simplest — one container, no
   separate compose orchestration needed). Point it at the repo root
   `Dockerfile`.
3. **Port**: set the container port to `3000` (matches `EXPOSE 3000` /
   `server.js`'s default `PORT`). Dokploy's Traefik layer handles the
   public HTTPS domain and cert — you don't map host ports yourself.
4. **Environment variables** (optional — the app works with none set,
   since `server.js` falls back to the same publishable key already in the
   source): add `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env.example`
   if you want them configurable without a redeploy.
5. **Domain**: attach your domain (e.g. `einvite.me`) in Dokploy's Domains
   tab, enable "Generate Let's Encrypt Certificate".
6. **Health check**: Dokploy can poll `/healthz` (returns `200 ok`) to know
   the container is ready; the Dockerfile also defines a Docker-native
   `HEALTHCHECK` for the same endpoint.
7. **Deploy**. Dokploy will build the image from the Dockerfile and start
   the container. Watch the build logs for the `npm run build` (Vite) step
   and then `einvite.me server listening on port 3000` from `server.js`.

If you'd rather use Dokploy's **Compose** application type instead of a
plain Dockerfile app, point it at `docker-compose.yml` — just drop the
`ports:` mapping first, since Dokploy's Traefik will route to the
container's exposed port directly (the `ports:` block is only there so
`docker compose up` works standalone on your own machine).

## Local test before pushing

```bash
docker compose up --build
# visit http://localhost:3000
```

Confirm:
- `/` loads the app.
- `/e/<a-real-slug>` loads normally in a browser.
- `curl -A "facebookexternalhit/1.1" http://localhost:3000/e/<a-real-slug>` returns the OG HTML (not the SPA shell).
- `/dj/:slug`, `/checkin/:token`, `/quick/:slug`, `/network/:slug` all load the SPA instead of 404ing.

## Supabase — no migration needed, but worth knowing

The Supabase project (`tahbjwbmigoodfrfjpri`, Postgres 17, `ap-northeast-2`)
stays exactly where it is; only the frontend host is moving. Schema in
`public`: `invitations`, `guests`, `kv_store` (the app's main JSON blob
store — draft content + per-invitation snapshots), `stream_secrets`,
`stream_access_sessions`, `song_requests`, `package_purchases`,
`networking_guests`/`networking_connections`/`networking_messages`,
`guest_checkins`, `voice_messages`, `whatsapp_incoming`, plus an unrelated
`homeapp_*` set of tables sharing this project. 14 Edge Functions are
deployed and active (payments, streaming, WhatsApp, push, email) — none of
this needs redeploying for the hosting migration.

Supabase's advisor flagged a few pre-existing, low-urgency items unrelated
to this migration (worth a follow-up, not a blocker):
- `stream_access_sessions` and `stream_secrets` have RLS enabled but no
  policies defined (default-deny; fine unless something relies on public
  access to them).
- 5 functions (`homeapp_notify`, `homeapp_send_daily_summary`, etc.) have a
  mutable `search_path`.
- `pg_net` extension is installed in the `public` schema instead of its own.
- Leaked-password protection is disabled in Supabase Auth.

## Note on the tracked `.env`

The repo tracked a `.env` file, but nothing in the source reads
`import.meta.env` or `process.env` for these values — Supabase URL/key are
hardcoded literals in `src/App.jsx` and `middleware.js`. `.env` is now in
`.gitignore`; the committed values are just the public Supabase URL and
publishable key (not secrets), so there's no exposure to rotate, but stop
tracking it going forward to avoid confusion.
