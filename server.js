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
import compression from "compression";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import dns from "node:dns/promises";
import net from "node:net";
import { randomUUID } from "node:crypto";
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

// Reserved slug for the admin's own current design in the Builder — lets
// a link be shared/tested (e.g. previewed in WhatsApp) before any real
// client account exists to own a proper one. Must match ADMIN_PREVIEW_SLUG
// in src/App.jsx.
const ADMIN_PREVIEW_SLUG = "admin-preview";

async function renderCrawlerHtml(slug, requestUrl) {
  let snapshotKey = null;
  if (slug === ADMIN_PREVIEW_SLUG) {
    snapshotKey = "einvite:invitation-__owner__";
  } else {
    const draft = await getKvValue("einvite:draft-core");
    const matchedUser = (draft?.users || []).find((u) => u.invitationSlug === slug);
    if (matchedUser) snapshotKey = `einvite:invitation-${matchedUser.id}`;
  }

  let ogImage = null;
  let ogTitle = "You're Invited";
  let ogDescription = "";

  if (snapshotKey) {
    const snapshot = await getKvValue(snapshotKey);
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
// Gzip/Brotli every response — the app's main script is ~1.1 MB raw but
// ~0.3 MB compressed, and nothing in front of this server compresses it.
app.use(compression());

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// ---------------------------------------------------------------------------
// Video optimization. Videos straight off a phone are often 30+ MB, and an
// invitation's intro video is the first thing every guest has to download,
// so uploads come through here instead of going straight to Storage: ffmpeg
// re-encodes them to at most 720p H.264 (~5 MB, with a lower bitrate for
// long clips), moves the index to the front so playback starts while it
// downloads, grabs the first frame as a poster JPEG, and uploads both to
// Supabase Storage. Needs ffmpeg installed in the container (see Dockerfile).
// Only one video is processed at a time so a few uploads can't swamp the CPU.
// ---------------------------------------------------------------------------

const VIDEO_TARGET_BYTES = 4.8 * 1024 * 1024;
const VIDEO_MAX_UPLOAD = "250mb";
const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_QUEUED_VIDEOS = 4;

function runProcess(cmd, args, timeoutMs = FFMPEG_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr = (stderr + d).slice(-4000); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`${cmd} timed out`)); }, timeoutMs);
    child.on("error", (err) => { clearTimeout(timer); reject(err); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited with ${code}: ${stderr.split("\n").slice(-4).join(" ")}`));
    });
  });
}

async function probeDuration(file) {
  try {
    const out = await runProcess("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], 30000);
    const d = parseFloat(out);
    return Number.isFinite(d) && d > 0 ? d : null;
  } catch {
    return null;
  }
}

// Shorter side capped at 720px (portrait 1080x1920 -> 720x1280), even
// dimensions for H.264, at most 30 fps. Intro/preview videos play muted, so
// their audio track is dropped entirely.
async function encodeVideo(input, output, { audio, bitrate }) {
  const scale = "scale='if(gt(iw,ih),-2,min(720,trunc(iw/2)*2))':'if(gt(iw,ih),min(720,trunc(ih/2)*2),-2)'";
  const rate = bitrate
    ? ["-b:v", String(bitrate), "-maxrate", String(Math.round(bitrate * 1.3)), "-bufsize", String(bitrate * 2)]
    : ["-crf", "28"];
  await runProcess("ffmpeg", [
    "-y", "-i", input, "-vf", scale, "-fpsmax", "30",
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", ...rate,
    ...(audio ? ["-c:a", "aac", "-b:a", "96k"] : ["-an"]),
    "-movflags", "+faststart", output,
  ]);
}

async function optimizeVideo(input, dir, { audio }) {
  const first = path.join(dir, "first.mp4");
  await encodeVideo(input, first, { audio });
  let best = first;
  if ((await fs.stat(first)).size > VIDEO_TARGET_BYTES) {
    const duration = (await probeDuration(input)) || 10;
    const audioBits = audio ? 96000 : 0;
    const bitrate = Math.max(250000, Math.floor((VIDEO_TARGET_BYTES * 8 * 0.9) / duration - audioBits));
    const second = path.join(dir, "second.mp4");
    await encodeVideo(input, second, { audio, bitrate });
    if ((await fs.stat(second)).size < (await fs.stat(first)).size) best = second;
  }
  const poster = path.join(dir, "poster.jpg");
  try {
    await runProcess("ffmpeg", ["-y", "-i", best, "-frames:v", "1", "-q:v", "3", poster], 60000);
  } catch {
    // No poster is fine — the gate just stays dark until the video paints.
  }
  return { video: best, poster };
}

async function uploadToStorage(bucket, name, contentType, body) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": contentType },
    body,
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text().catch(() => "")}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${name}`;
}

let videoQueue = Promise.resolve();
let queuedVideos = 0;
function enqueueVideo(job) {
  const run = videoQueue.then(job, job);
  videoQueue = run.catch(() => {});
  return run;
}

// Runs one optimization end to end: writes the source to a temp folder,
// encodes, uploads, cleans up. Uploads end in "-opt.mp4" so the app can
// tell an optimized video from an original.
async function processVideo(sourceBuffer, { audio }) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "einvite-video-"));
  try {
    const input = path.join(dir, "source");
    await fs.writeFile(input, sourceBuffer);
    const { video, poster } = await optimizeVideo(input, dir, { audio });
    const id = randomUUID();
    const videoBytes = await fs.readFile(video);
    const url = await uploadToStorage("custom-videos", `${id}-opt.mp4`, "video/mp4", videoBytes);
    let posterUrl = null;
    try {
      posterUrl = await uploadToStorage("site-decorations", `${id}-poster.jpg`, "image/jpeg", await fs.readFile(poster));
    } catch {}
    return { url, posterUrl, bytes: videoBytes.length, originalBytes: sourceBuffer.length };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleVideoJob(res, getSource, audio) {
  if (queuedVideos >= MAX_QUEUED_VIDEOS) return res.status(503).json({ error: "Busy optimizing other videos — try again in a minute." });
  queuedVideos++;
  try {
    const result = await enqueueVideo(async () => processVideo(await getSource(), { audio }));
    res.json(result);
  } catch (err) {
    console.error("video optimize failed:", err.message);
    res.status(500).json({ error: "Couldn't optimize this video." });
  } finally {
    queuedVideos--;
  }
}

// ---------------------------------------------------------------------------
// Music from a link: the Builder can paste a link to a song (YouTube,
// SoundCloud, a direct MP3/WAV link, ...) and get back an MP3 in Storage,
// used exactly like an uploaded track. yt-dlp downloads the audio and ffmpeg
// converts it to a 128 kbps MP3. Runs in the same one-at-a-time queue as
// video optimization. Songs are limited to 15 minutes.
// ---------------------------------------------------------------------------

const MUSIC_MAX_SECONDS = 15 * 60;
const MUSIC_TIMEOUT_MS = 4 * 60 * 1000;

// yt-dlp would fetch whatever the link points to, from this server, so links
// to this machine or the private network are refused.
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("ff");
}

async function checkPublicUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return null;
  try {
    const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null;
  } catch {
    return null;
  }
  return url.toString();
}

// Turns yt-dlp's error output into something the couple can act on.
function musicLinkError(message) {
  const m = message || "";
  if (/does not pass filter|is_live|duration/i.test(m)) return "That song is too long (over 15 minutes) or is a live stream. Pick a shorter track.";
  if (/sign in to confirm|not a bot|429|too many requests/i.test(m)) return "That site blocked the download from our server. Download the song to your device and use Upload track instead.";
  if (/drm/i.test(m)) return "That site protects its music (DRM), so it can't be converted. Try a YouTube or SoundCloud link, or upload the file.";
  if (/unsupported url|no video formats|no suitable formats|unable to extract|http error 40[04]|not found/i.test(m)) return "Couldn't find a song at that link. Check the link, or upload the file instead.";
  if (/\bprivate\b|\blog ?in\b|members[- ]only|premium|age[- ]restricted|confirm your age/i.test(m)) return "That song is private or needs a login, so it can't be converted. Try another link, or upload the file.";
  if (/timed out/i.test(m)) return "That took too long. Try again, or upload the file instead.";
  return "Couldn't convert that link. Try another link, or upload the file instead.";
}

async function processMusicLink(url) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "einvite-music-"));
  try {
    const out = await runProcess("yt-dlp", [
      "--no-playlist", "--no-warnings", "--no-progress", "--no-cache-dir",
      "--js-runtimes", "node",
      "-f", "bestaudio/best",
      "--match-filter", `!is_live & duration <=? ${MUSIC_MAX_SECONDS}`,
      "--max-filesize", "200M",
      "-x", "--audio-format", "mp3", "--audio-quality", "128K",
      "--postprocessor-args", "ExtractAudio:-ac 2 -ar 44100",
      "-o", path.join(dir, "audio.%(ext)s"),
      "--print", "after_move:title", "--no-simulate",
      "--", url,
    ], MUSIC_TIMEOUT_MS);
    const file = path.join(dir, "audio.mp3");
    const bytes = await fs.readFile(file).catch(() => null);
    if (!bytes) throw new Error("does not pass filter"); // yt-dlp skips a filtered song without failing
    if ((await probeDuration(file) || 0) > MUSIC_MAX_SECONDS + 5) throw new Error("duration");
    const title = out.trim().split("\n").pop().trim().replace(/[\\/:*?"<>|]+/g, " ").slice(0, 120) || "Song";
    const musicUrl = await uploadToStorage("custom-videos", `${randomUUID()}.mp3`, "audio/mpeg", bytes);
    return { url: musicUrl, name: `${title}.mp3`, bytes: bytes.length };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

app.post("/api/music/from-link", express.json({ limit: "10kb" }), async (req, res) => {
  const raw = String(req.body?.url || "").trim();
  if (!raw || raw.length > 2000) return res.status(400).json({ error: "Paste a link to a song first." });
  const url = await checkPublicUrl(raw);
  if (!url) return res.status(400).json({ error: "That doesn't look like a link to a song. Paste the full link (starting with https://)." });
  if (queuedVideos >= MAX_QUEUED_VIDEOS) return res.status(503).json({ error: "Busy converting other files — try again in a minute." });
  queuedVideos++;
  try {
    res.json(await enqueueVideo(() => processMusicLink(url)));
  } catch (err) {
    console.error("music from link failed:", err.message);
    res.status(422).json({ error: musicLinkError(err.message) });
  } finally {
    queuedVideos--;
  }
});

// Sites change often and an old yt-dlp stops working with them, so it
// updates itself in the background whenever the server starts.
runProcess("yt-dlp", ["-U"], 120000).then(
  (out) => console.log("yt-dlp:", out.trim().split("\n").pop()),
  (err) => console.warn("yt-dlp update skipped:", err.message),
);

// ---------------------------------------------------------------------------
// AI translation for the Builder: when the owner adds a language, the texts
// they wrote in their main language are translated in one go. Needs
// OPENAI_API_KEY set on this app's container (the same key the AI chat's
// edge function uses). Takes { from, to, texts: { key: text } } and returns
// { texts: { key: translated } } with the same keys.
// ---------------------------------------------------------------------------

const TRANSLATE_LANG_NAMES = { en: "English", ar: "Arabic", fr: "French", es: "Spanish", hy: "Armenian" };
const TRANSLATE_CHUNK = 60;

async function translateChunk(from, to, texts) {
  const res = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You translate the text of elegant digital invitations (weddings, birthdays, quinceañeras, baptisms, baby showers and other celebrations) from ${TRANSLATE_LANG_NAMES[from]} to ${TRANSLATE_LANG_NAMES[to]}. Keep the warm, graceful tone of a printed invitation and keep each text about the same length. Rules: translate every value; keep exactly the same keys; keep line breaks and emojis; do not translate URLs, email addresses, phone numbers, or times and dates written with digits; write people's first names and family names in the script of ${TRANSLATE_LANG_NAMES[to]} (transliterate them if that script differs), otherwise keep them unchanged; if a value is already in ${TRANSLATE_LANG_NAMES[to]}, return it unchanged. Reply with only a JSON object of the form {"translations": {"<key>": "<translated text>"}}.`,
        },
        { role: "user", content: JSON.stringify(texts) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  return parsed.translations || parsed;
}

app.post("/api/translate", express.json({ limit: "400kb" }), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI translation isn't switched on yet: OPENAI_API_KEY needs to be set on the app in Dokploy." });
  const { from, to, texts } = req.body || {};
  if (!TRANSLATE_LANG_NAMES[from] || !TRANSLATE_LANG_NAMES[to] || from === to) return res.status(400).json({ error: "Unknown languages." });
  const entries = Object.entries(texts && typeof texts === "object" ? texts : {}).filter(([, v]) => typeof v === "string" && v.trim());
  if (entries.length > 600 || entries.reduce((n, [, v]) => n + v.length, 0) > 60000) return res.status(413).json({ error: "Too much text to translate at once." });
  try {
    const out = {};
    for (let i = 0; i < entries.length; i += TRANSLATE_CHUNK) {
      const chunk = Object.fromEntries(entries.slice(i, i + TRANSLATE_CHUNK));
      const translated = await translateChunk(from, to, chunk);
      for (const key of Object.keys(chunk)) {
        const value = translated?.[key];
        if (typeof value === "string" && value.trim()) out[key] = value;
      }
    }
    res.json({ texts: out });
  } catch (err) {
    console.error("translate failed:", err.message);
    res.status(502).json({ error: "The translation service didn't respond — please try again." });
  }
});

// Upload a new video: the raw file is the request body.
app.post("/api/video/optimize", express.raw({ type: () => true, limit: VIDEO_MAX_UPLOAD }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: "No video received." });
  return handleVideoJob(res, async () => req.body, req.query.audio === "1");
});

// Optimize a video that's already in our own Storage (e.g. an older, full-
// size intro video). Only URLs on this project's public Storage are accepted.
app.post("/api/video/optimize-url", express.json({ limit: "10kb" }), (req, res) => {
  const url = String(req.body?.url || "");
  if (!url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`)) return res.status(400).json({ error: "Only videos stored on this site can be optimized." });
  return handleVideoJob(res, async () => {
    const src = await fetch(url);
    if (!src.ok) throw new Error(`Couldn't fetch the original video (${src.status})`);
    return Buffer.from(await src.arrayBuffer());
  }, req.body?.audio === true);
});

// Crop and erase in the Builder need to read a stored photo back from a
// canvas, which the browser only allows for same-origin (or CORS-enabled)
// images. This serves photos from our own public Storage through the app,
// as a fallback for when Storage doesn't send CORS headers.
const IMAGE_PROXY_MAX = 25 * 1024 * 1024;
app.get("/api/image-proxy", async (req, res) => {
  const url = String(req.query.url || "");
  if (!url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`) || url.includes("..")) return res.status(400).json({ error: "Only images stored on this site can be edited." });
  try {
    const src = await fetch(url);
    const type = src.headers.get("content-type") || "";
    if (!src.ok) return res.status(src.status).end();
    if (!type.startsWith("image/")) return res.status(415).json({ error: "Not an image." });
    const buf = Buffer.from(await src.arrayBuffer());
    if (buf.length > IMAGE_PROXY_MAX) return res.status(413).json({ error: "Image too large." });
    res.set("Content-Type", type);
    res.set("Cache-Control", "no-store");
    res.send(buf);
  } catch (err) {
    console.error("image proxy failed:", err.message);
    res.status(502).json({ error: "Couldn't load the image." });
  }
});

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
