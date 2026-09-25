# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
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

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# ffmpeg shrinks uploaded videos (see /api/video/optimize in server.js).
RUN apk add --no-cache ffmpeg
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js ./server.js

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
