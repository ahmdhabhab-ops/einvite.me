// server.js — production server for Dokploy/Docker deployment.
//
// Replaces two things Vercel gave this app for free:
//   1. Static file hosting with SPA fallback (was vercel.json's rewrite).
//   2. The og:image/title crawler middleware (was middleware.js, which only
//      runs as a Vercel Edge Function and has no equivalent on plain Docker
//      hosting). Its logic is ported below unchanged.
//
// Everything else (auth, payments, storage, RSVPs, streaming, etc.) already
// talks directly to Supabase from the browser/edge functions and needs no
// server of its own — this process only serves the built SPA.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://cores.einvite.me";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLXNlbGYtaG9zdGVkIiwiaWF0IjoxNzg5NjQzMjM5LCJleHAiOjIxMDUwMDMyMzl9.F94kRvGQvVWb0lrgiuFNPx4aG3g4oRCwGgudW4IIkR8";
const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

const CRAWLER_USER_AGENTS = [
  "whatsapp", "facebookexternalhit", "twitterbot", "linkedinbot",
  "telegrambot", "slackbot", "discordbot", "pinterest", "skypeuripreview",
  "facebot", "ia_archiver",
];

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function getKvValue(key) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, { headers: supabaseHeaders });
    if (!res.ok) {
      console.error(`og-middleware: getKvValue("${key}") failed with status ${res.status}`);
      return null;
    }
    const rows = await res.json();
    return rows[0]?.value ? JSON.parse(rows[0].value) : null;
  } catch (err) {
    console.error(`og-middleware: getKvValue("${key}") threw:`, err);
    return null;
  }
}

async function renderCrawlerHtml(slug, requestUrl) {
  const draft = await getKvValue("einvite:draft-core");
  const matchedUser = (draft?.users || []).find((u) => u.invitationSlug === slug);

  let ogImage = null;
  let ogTitle = "You're Invited";
  let ogDescription = "";

  if (matchedUser) {
    const snapshot = await getKvValue(`einvite:invitation-${matchedUser.id}`);
    if (snapshot?.og) {
      ogImage = snapshot.og.image || null;
      ogTitle = snapshot.og.title || ogTitle;
      ogDescription = snapshot.og.description || ogDescription;
    }
    if (!snapshot?.og?.title && snapshot?.content?.en?.cover) {
      const { name1, name2 } = snapshot.content.en.cover;
      if (name1 || name2) ogTitle = `${name1 || ""}${name1 && name2 ? " & " : ""}${name2 || ""}`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(ogTitle)}</title>
<meta property="og:title" content="${escapeHtml(ogTitle)}" />
<meta property="og:description" content="${escapeHtml(ogDescription)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(requestUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>Redirecting…</body>
</html>`;
}

const app = express();
app.disable("x-powered-by");

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get(/^\/e\/([^/]+)\/?$/, async (req, res, next) => {
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const isCrawler = CRAWLER_USER_AGENTS.some((ua) => userAgent.includes(ua));
  if (!isCrawler) return next();

  const slug = decodeURIComponent(req.params[0]);
  try {
    const html = await renderCrawlerHtml(slug, `${req.protocol}://${req.get("host")}${req.originalUrl}`);
    res.set("content-type", "text/html; charset=utf-8").send(html);
  } catch (err) {
    console.error("og-middleware error:", err);
    next();
  }
});

// Hashed build assets can be cached forever; index.html must always revalidate.
app.use(express.static(DIST_DIR, { index: false, maxAge: "1y", immutable: true }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`einvite.me server listening on port ${PORT}`);
});
