// middleware.js — place this at the ROOT of your project (same level as
// package.json), not inside src/. Vercel automatically detects and runs
// this on every request, for any project type (not just Next.js).
//
// THE ACTUAL PROBLEM THIS SOLVES: WhatsApp, Facebook, Twitter, etc. never
// run JavaScript when generating a link preview — they make one plain
// HTTP request and read <meta property="og:..."> tags directly from the
// raw HTML response. Since this app is a client-side React SPA, whatever
// the Builder's Settings panel shows only exists AFTER JavaScript runs —
// which these crawlers never wait for. The static HTML Vercel actually
// serves is identical for every URL, so it has no way to know which
// invitation's image belongs on a given link.
//
// This middleware detects requests specifically from known social-media
// crawler user-agents, looks up the correct couple's og image/title from
// Supabase directly (server-side, before any JS ever runs), and returns a
// tiny, complete HTML response with the right meta tags — while real
// human visitors are let through untouched to the normal React app.
//
// ⚠️ ONE THING TO VERIFY BEFORE TRUSTING THIS FULLY: this app currently
// stores the OG image as a base64 data: URI (embedded directly, not a
// separately-fetchable URL) — same as every other image in this project.
// I could not confirm with certainty whether Facebook/WhatsApp's crawler
// actually accepts a data: URI for og:image, versus requiring a real
// https:// URL it can fetch independently (which is how most social
// crawlers are documented to behave, and is the safer assumption). Test
// this with Facebook's own Sharing Debugger tool:
// https://developers.facebook.com/tools/debug/
// If the image doesn't show there, the real fix is to upload the OG
// image to Supabase Storage (same public-bucket approach already used
// for the template designs) and store that real URL instead of a data
// URI — not a further change to this middleware.

export const config = {
  matcher: "/e/:path*",
};

const CRAWLER_USER_AGENTS = [
  "whatsapp", "facebookexternalhit", "twitterbot", "linkedinbot",
  "telegrambot", "slackbot", "discordbot", "pinterest", "skypeuripreview",
  "facebot", "ia_archiver",
];

const SUPABASE_URL = "https://tahbjwbmigoodfrfjpri.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85PWR75Vq5WcSWvgos6pmg_4JwG0_iM";
const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

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
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0]?.value ? JSON.parse(rows[0].value) : null;
  } catch {
    return null;
  }
}

export default async function middleware(req) {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const isCrawler = CRAWLER_USER_AGENTS.some((ua) => userAgent.includes(ua));
  if (!isCrawler) return; // let real visitors through to the normal React app, completely untouched

  const url = new URL(req.url);
  const match = url.pathname.match(/^\/e\/([^/]+)\/?$/);
  if (!match) return;
  const slug = decodeURIComponent(match[1]);

  try {
    // Same two-step lookup the app itself does: find which client this
    // slug belongs to (users list lives in the main draft payload), then
    // fetch that specific client's own saved snapshot for their real og data.
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

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(ogTitle)}</title>
<meta property="og:title" content="${escapeHtml(ogTitle)}" />
<meta property="og:description" content="${escapeHtml(ogDescription)}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(url.href)}" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>Redirecting…</body>
</html>`;

    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  } catch (err) {
    // On any failure, fall through to the normal app rather than showing
    // a broken page to a real visitor who happened to share a user-agent
    // string with a crawler, or breaking the link preview silently.
    console.error("og-middleware error:", err);
    return;
  }
}
