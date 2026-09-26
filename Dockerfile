# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
# This VPS's kernel hangs Node's io_uring-based filesystem I/O indefinitely
# once vite/esbuild starts opening the many small files under
# node_modules/lucide-react/dist/esm/icons (confirmed by watching a stuck
# build sit in D-state forever with wchan io_uring_del_tctx_node). Forcing
# libuv back onto its thread-pool I/O path avoids the hang entirely.
ENV UV_USE_IO_URING=0
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Same io_uring workaround as the build stage (see above).
ENV UV_USE_IO_URING=0
# ffmpeg shrinks uploaded videos (see /api/video/optimize in server.js).
# yt-dlp (plus python3 to run it) turns a music link into an MP3 (see
# /api/music/from-link). It's the latest release rather than Alpine's
# package, since sites like YouTube change often and old versions break.
# It solves YouTube's JavaScript challenge with this image's Node, which
# yt-dlp doesn't support on Node 20 (hence Node 24 above).
RUN apk add --no-cache ffmpeg python3 ca-certificates \
  && wget -q -O /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js ./server.js

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
