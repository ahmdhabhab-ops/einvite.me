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
import { randomUUID, timingSafeEqual, createHmac, scrypt, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import webpush from "web-push";
import { createInboxForwarder } from "./whatsapp-inbox-forwarder.js";
import { createOAuth } from "./mcp/oauth.js";
import { createMcpHandler } from "./mcp/tools.js";
import { createBridalStudio } from "./bridal/studio.js";
import { imageType } from "./bridal/safe-fetch.js";

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
// The service_role key (set on the app in Dokploy, never sent to browsers)
// lets this server read and write data the website's public anon key
// can't, such as the hashed client passwords in app_accounts.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const serviceHeaders = SUPABASE_SERVICE_KEY
  ? { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json" }
  : null;

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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, { headers: serviceHeaders || supabaseHeaders });
    if (!res.ok) {
      console.error(`getKvValue("${key}") failed with status ${res.status}`);
      return null;
    }
    const rows = await res.json();
    return rows[0]?.value ? JSON.parse(rows[0].value) : null;
  } catch (err) {
    console.error(`getKvValue("${key}") threw:`, err);
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
  if (/cookies are no longer valid/i.test(m)) return "Our YouTube connection needs refreshing. Download the song and use Upload track for now.";
  if (/sign in to confirm|not a bot|429|too many requests|needs to be reloaded/i.test(m)) return "That site blocked the download from our server. Download the song to your device and use Upload track instead.";
  if (/drm/i.test(m)) return "That site protects its music (DRM), so it can't be converted. Try a YouTube or SoundCloud link, or upload the file.";
  if (/unsupported url|no video formats|no suitable formats|unable to extract|http error 40[04]|not found/i.test(m)) return "Couldn't find a song at that link. Check the link, or upload the file instead.";
  if (/\bprivate\b|\blog ?in\b|members[- ]only|premium|age[- ]restricted|confirm your age/i.test(m)) return "That song is private or needs a login, so it can't be converted. Try another link, or upload the file.";
  if (/timed out/i.test(m)) return "That took too long. Try again, or upload the file instead.";
  return "Couldn't convert that link. Try another link, or upload the file instead.";
}

// YouTube often refuses downloads from server IPs ("Sign in to confirm
// you're not a bot"). Two optional settings on the app in Dokploy help:
//   - a cookies.txt from a spare YouTube account, mounted at
//     /app/secrets/yt-cookies.txt (or wherever YTDLP_COOKIES_FILE says);
//   - YTDLP_PROXY, a proxy for yt-dlp to download through.
const YTDLP_COOKIES_FILE = process.env.YTDLP_COOKIES_FILE || "/app/secrets/yt-cookies.txt";

async function ytdlpAccessArgs(dir, { cookies = true } = {}) {
  const args = [];
  if (process.env.YTDLP_PROXY) args.push("--proxy", process.env.YTDLP_PROXY);
  if (!cookies) return args;
  // A copy per attempt: yt-dlp writes cookies back when it finishes, and
  // jobs shouldn't touch the mounted original.
  const copy = path.join(dir, "cookies.txt");
  try {
    await fs.copyFile(YTDLP_COOKIES_FILE, copy);
    args.push("--cookies", copy);
  } catch {
    // No cookies file set up: download without one.
  }
  return args;
}

// YouTube answers differently depending on which of its apps ("clients")
// yt-dlp pretends to be, and one that's refused ("The page needs to be
// reloaded", "not a bot") often works as another. So a YouTube link is
// tried with a few clients in turn; other sites get a single attempt.
const YOUTUBE_ATTEMPTS = [
  { label: "default" },
  { label: "tv", args: ["--extractor-args", "youtube:player_client=tv"] },
  { label: "mweb", args: ["--extractor-args", "youtube:player_client=mweb"] },
  { label: "web_safari", args: ["--extractor-args", "youtube:player_client=web_safari"] },
  { label: "android_vr without cookies", args: ["--extractor-args", "youtube:player_client=android_vr"], cookies: false },
];
const isYouTubeUrl = (url) => /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(url);
// Failures another client can't fix: the song itself is the problem.
const isFinalMusicError = (message) => /does not pass filter|is_live|duration|unsupported url|http error 404|drm|private video|video unavailable|removed|copyright|timed out/i.test(message || "");

async function downloadMusic(url, dir, attempt) {
  return runProcess("yt-dlp", [
    ...(await ytdlpAccessArgs(dir, { cookies: attempt.cookies !== false })),
    ...(attempt.args || []),
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
}

async function processMusicLink(url) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "einvite-music-"));
  try {
    const attempts = isYouTubeUrl(url) ? YOUTUBE_ATTEMPTS : [{ label: "default" }];
    let out = null;
    let lastError = null;
    for (const attempt of attempts) {
      try {
        out = await downloadMusic(url, dir, attempt);
        if (attempts.length > 1) console.log(`music from link: downloaded with YouTube client "${attempt.label}"`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`music from link: attempt "${attempt.label}" failed: ${err.message}`);
        if (isFinalMusicError(err.message)) break;
      }
    }
    if (out === null) throw lastError;
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

app.post("/api/music/from-link", requireMember, express.json({ limit: "10kb" }), async (req, res) => {
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
fs.access(YTDLP_COOKIES_FILE).then(
  () => console.log("yt-dlp: using YouTube cookies from", YTDLP_COOKIES_FILE),
  () => console.log("yt-dlp: no YouTube cookies file at", YTDLP_COOKIES_FILE),
);
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

app.post("/api/translate", requireMember, limitClientTranslations, express.json({ limit: "400kb" }), async (req, res) => {
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

// Guest list from a photo: reads a picture of a handwritten or printed
// guest list (any language) with OpenAI's vision model and returns the
// families on it, for the Dashboard to preview before adding them.
const guestOcrHits = new Map(); // userId -> { count, since }
function limitGuestOcr(req, res, next) {
  const who = authReady ? requestRole(req) : { role: "admin" };
  if (who.role !== "client") return next();
  const now = Date.now();
  const h = guestOcrHits.get(who.userId);
  const cur = h && now - h.since < 3600000 ? h : { count: 0, since: now };
  if (cur.count >= 30) return res.status(429).json({ error: "You've read a lot of photos in the last hour — please try again a bit later." });
  guestOcrHits.set(who.userId, { count: cur.count + 1, since: cur.since });
  next();
}
app.post("/api/guests/from-image", requireMember, limitGuestOcr, express.json({ limit: "8mb" }), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Reading photos isn't switched on yet: OPENAI_API_KEY needs to be set on the app in Dokploy." });
  const image = String(req.body?.image || "");
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 7_500_000) return res.status(400).json({ error: "Please upload a JPG or PNG photo of the list." });
  try {
    const r = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You read photos of guest lists for events (weddings, birthdays, seminars...). The list may be handwritten or printed, in any language (often Arabic, English or French), and may be a table. Return every invited party on it, in order. For each: \"name\" = the family or party name, or the person's name, exactly as written in its original script; \"members\" = the individual people's names if the list names them separately (else an empty array); \"phone\" = the phone number if one is written (digits, keep a leading +), else \"\"; \"extra\" = the number of additional unnamed guests if written (e.g. \"+2\", \"3 persons\" for one named person means 2 extra), else 0. Skip titles, headers, column names, row numbers, totals and anything that isn't a guest. Do not invent or translate names. Reply with only JSON: {\"guests\": [{\"name\": \"\", \"members\": [], \"phone\": \"\", \"extra\": 0}]}.",
          },
          { role: "user", content: [{ type: "text", text: "Here is the guest list." }, { type: "image_url", image_url: { url: image, detail: "high" } }] },
        ],
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const clean = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
    const guests = (Array.isArray(parsed.guests) ? parsed.guests : []).slice(0, 500).map((g) => ({
      name: clean(g?.name, 120),
      members: (Array.isArray(g?.members) ? g.members : []).map((m) => clean(m, 120)).filter(Boolean).slice(0, 30),
      phone: clean(g?.phone, 30).replace(/[^0-9+]/g, ""),
      extra: Math.max(0, Math.min(50, parseInt(g?.extra, 10) || 0)),
    })).filter((g) => g.name || g.members.length);
    res.json({ guests });
  } catch (err) {
    console.error("guest list from image failed:", err.message);
    res.status(502).json({ error: "Couldn't read that photo — please try again, or with a clearer, straighter photo." });
  }
});

// The app's assistant: answers the host's questions about their own guest
// list (who's coming, who isn't, how many, who hasn't replied) from their
// invitation's data, and says when they'd rather talk to a person.
const assistantHits = new Map(); // owner -> { count, since }
app.post("/api/assistant", requireMember, express.json({ limit: "64kb" }), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "The assistant isn't switched on yet: OPENAI_API_KEY needs to be set on the app in Dokploy." });
  const ownerId = pushOwnerOf(req);
  if (!ownerId) return res.status(401).json({ error: "Please log in." });
  const now = Date.now();
  const h = assistantHits.get(ownerId);
  const cur = h && now - h.since < 3600000 ? h : { count: 0, since: now };
  if (ownerId !== "__owner__" && cur.count >= 80) return res.status(429).json({ error: "You've asked a lot in the last hour — please try again a bit later." });
  assistantHits.set(ownerId, { count: cur.count + 1, since: cur.since });
  const history = (Array.isArray(req.body?.messages) ? req.body.messages : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!history.length || history[history.length - 1].role !== "user") return res.status(400).json({ error: "Ask a question." });
  try {
    const raw = await kvRead(`einvite:invitation-${ownerId}`);
    const inv = raw ? JSON.parse(raw) : {};
    const groups = Array.isArray(inv.guestGroups) ? inv.guestGroups : [];
    const cover = Object.values(inv.content || {})[0]?.cover || {};
    const rows = groups.map((g) => {
      const ms = (g.members || []).map((m) => ({ name: String(m.name || ""), status: m.status || "pending" }));
      const yes = ms.filter((m) => m.status === "yes").length;
      return {
        family: String(g.name || ms[0]?.name || "Guest"),
        members: ms,
        extraGuests: Number(g.additionalGuests) || 0,
        comingCount: yes ? yes + (Number(g.additionalGuests) || 0) : 0,
        phone: String(g.phone || ""),
        table: String(g.table || ""),
        replied: ms.some((m) => m.status !== "pending"),
        lastUpdate: g.updatedAt ? new Date(g.updatedAt).toISOString().slice(0, 16) : "",
      };
    });
    const totals = {
      families: rows.length,
      peopleComing: rows.reduce((n, r) => n + r.comingCount, 0),
      peopleNotComing: rows.reduce((n, r) => n + r.members.filter((m) => m.status === "no").length, 0),
      familiesNotReplied: rows.filter((r) => !r.replied).length,
    };
    const facts = { event: { names: [cover.name1, cover.name2].filter(Boolean).join(" & "), date: inv.rsvpSchedule?.date || "", time: inv.rsvpSchedule?.time || "" }, totals, guests: rows.slice(0, 600) };
    const r = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are the eInvite.me assistant inside the host's phone app. The host is organising an event and you help with their guest replies. Answer ONLY from the JSON data below (today is " + new Date().toISOString().slice(0, 10) + "); never invent guests or numbers. A family's comingCount = members who said yes plus their extraGuests. Be short and clear, use lists for names. Reply in the same language and style the host writes in (Arabic, Lebanese Arabizi, English, French...). If the host asks to talk to a person / the team / sales / support, or asks for something you can't do from this data (payments, changing the design, technical problems), say you're connecting them to the team and set handoff to true. Reply with only JSON: {\"reply\": \"...\", \"handoff\": false}.\n\nDATA:\n" + JSON.stringify(facts),
          },
          ...history,
        ],
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
    const data = await r.json();
    const out = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    res.json({ reply: String(out.reply || "").slice(0, 6000) || "Sorry, I couldn't answer that.", handoff: out.handoff === true });
  } catch (err) {
    console.error("assistant failed:", err.message);
    res.status(502).json({ error: "The assistant didn't respond — please try again." });
  }
});

// ---------------------------------------------------------------------------
// Team (sales) accounts: their own email + password, made by the admin.
// A sales account sees only the live chat, the clients list (read only)
// and invoices — nothing else of the admin or any invitation.
// ---------------------------------------------------------------------------
const STAFF_KV = "einvite:staff";
const STAFF_COOKIE = "staff_session";
const STAFF_SESSION_MS = 14 * 24 * 3600 * 1000;
const staffSig = (payload) => createHmac("sha256", sessionKey).update(`staff:${payload}`).digest("hex");
const isAdminReq = (req) => !gatewayEnforced() || hasAdminSession(req);
async function readStaff() { const raw = await kvRead(STAFF_KV); return raw ? JSON.parse(raw) : []; }
async function staffOf(req) {
  const raw = readCookie(req, STAFF_COOKIE);
  const i = raw.lastIndexOf(".");
  if (i < 0) return null;
  const payload = raw.slice(0, i);
  const [id, expires] = payload.split(".");
  if (!id || !(Number(expires) > Date.now()) || !sameSecret(raw.slice(i + 1), staffSig(payload))) return null;
  const member = (await readStaff()).find((m) => m.id === id);
  return member && member.active !== false ? member : null;
}
// The admin, or a logged-in sales account (req.staff is set for the latter).
async function requireStaffOrAdmin(req, res, next) {
  if (isAdminReq(req)) return next();
  try { req.staff = await staffOf(req); } catch { req.staff = null; }
  if (req.staff) return next();
  res.status(401).json({ error: "Please log in." });
}
function requireAdminOnly(req, res, next) {
  if (isAdminReq(req)) return next();
  res.status(403).json({ error: "Only the admin can do this." });
}
const publicStaff = (m) => ({ id: m.id, name: m.name, email: m.email, role: m.role || "sales", active: m.active !== false, createdAt: m.createdAt });

app.post("/api/staff/login", express.json({ limit: "4kb" }), async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const limitKeys = [`ip:${clientIp(req)}`, `staff:${email}`];
  if (loginBlocked(limitKeys)) return res.status(429).json({ error: "Too many wrong attempts. Please try again in 15 minutes." });
  try {
    const member = (await readStaff()).find((m) => m.email === email && m.active !== false);
    if (!member || !(await verifyPassword(password, member.hash))) {
      noteLoginFailure(limitKeys);
      return res.status(401).json({ error: "Wrong email or password." });
    }
    const payload = `${member.id}.${Date.now() + STAFF_SESSION_MS}`;
    res.cookie(STAFF_COOKIE, `${payload}.${staffSig(payload)}`, { httpOnly: true, sameSite: "lax", secure: isHttps(req), maxAge: STAFF_SESSION_MS, path: "/" });
    res.json({ staff: publicStaff(member) });
  } catch (err) {
    console.error("staff login failed:", err.message);
    res.status(502).json({ error: "Couldn't log in — please try again." });
  }
});
app.post("/api/staff/logout", (req, res) => { res.clearCookie(STAFF_COOKIE, { path: "/" }); res.json({ ok: true }); });
app.get("/api/staff/me", async (req, res) => {
  const member = await staffOf(req).catch(() => null);
  if (!member) return res.status(401).json({ error: "Please log in." });
  res.set("cache-control", "no-store").json({ staff: publicStaff(member) });
});

// The admin manages the team.
app.get("/api/staff", requireAdminOnly, async (_req, res) => {
  try { res.set("cache-control", "no-store").json({ staff: (await readStaff()).map(publicStaff) }); } catch (err) { res.status(502).json({ error: "Couldn't load the team." }); }
});
app.post("/api/staff", requireAdminOnly, express.json({ limit: "4kb" }), async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80);
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 120);
  const password = String(req.body?.password || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a name and a valid email." });
  if (password.length < 8) return res.status(400).json({ error: "The password needs at least 8 characters." });
  try {
    const staff = await readStaff();
    if (staff.some((m) => m.email === email)) return res.status(409).json({ error: "There's already a team account with this email." });
    const member = { id: randomUUID().replace(/-/g, "").slice(0, 12), name, email, role: "sales", active: true, hash: await hashPassword(password), createdAt: Date.now() };
    await kvWrite(STAFF_KV, JSON.stringify([...staff, member]));
    res.json({ staff: publicStaff(member) });
  } catch (err) { console.error("staff create failed:", err.message); res.status(502).json({ error: "Couldn't create the account." }); }
});
app.patch("/api/staff/:id", requireAdminOnly, express.json({ limit: "4kb" }), async (req, res) => {
  try {
    const staff = await readStaff();
    const i = staff.findIndex((m) => m.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Not found." });
    const b = req.body || {};
    if (typeof b.active === "boolean") staff[i].active = b.active;
    if (typeof b.name === "string" && b.name.trim()) staff[i].name = b.name.trim().slice(0, 80);
    if (typeof b.password === "string" && b.password) {
      if (b.password.length < 8) return res.status(400).json({ error: "The password needs at least 8 characters." });
      staff[i].hash = await hashPassword(b.password);
      loginFailures.delete(`staff:${staff[i].email}`);
    }
    await kvWrite(STAFF_KV, JSON.stringify(staff));
    res.json({ staff: publicStaff(staff[i]) });
  } catch (err) { res.status(502).json({ error: "Couldn't update the account." }); }
});
app.delete("/api/staff/:id", requireAdminOnly, async (req, res) => {
  try {
    const staff = await readStaff();
    await kvWrite(STAFF_KV, JSON.stringify(staff.filter((m) => m.id !== req.params.id)));
    res.json({ ok: true });
  } catch (err) { res.status(502).json({ error: "Couldn't delete the account." }); }
});

// The admin can lift the "too many wrong attempts" lock for everyone at
// once (e.g. after someone mistyped a password ten times).
app.post("/api/auth/unlock", requireAdminOnly, (_req, res) => {
  const n = loginFailures.size;
  loginFailures.clear();
  res.json({ ok: true, cleared: n });
});

// ---------------------------------------------------------------------------
// Designers: client accounts with role "designer" that build invitation
// designs in the normal builder and send them for review. The admin
// approves (with a name and price, which publishes it on /shop) or
// declines with a reason.
// ---------------------------------------------------------------------------
const SUBMISSIONS_KV = "einvite:design-submissions";
async function readSubmissions() { const raw = await kvRead(SUBMISSIONS_KV); return raw ? JSON.parse(raw) : []; }
app.get("/api/designers", requireAdminOnly, async (_req, res) => {
  try {
    const users = (await readDraftUsers()).filter((u) => u?.role === "designer").map((u) => ({ id: u.id, name: u.name, email: u.email, status: u.status, createdAt: u.createdAt }));
    res.set("cache-control", "no-store").json({ designers: users });
  } catch { res.status(502).json({ error: "Couldn't load designers." }); }
});
app.post("/api/designers", requireAdminOnly, express.json({ limit: "4kb" }), async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 100);
  const email = String(req.body?.email || "").trim().slice(0, 200);
  const password = String(req.body?.password || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a name and a valid email." });
  if (password.length < 8) return res.status(400).json({ error: "The password needs at least 8 characters." });
  try {
    const users = await readDraftUsers();
    if (users.some((u) => String(u?.email || "").toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: "An account with that email already exists." });
    const user = { id: randomUUID().replace(/-/g, "").slice(0, 10), name, email, phone: "", role: "designer", status: "active", dashboardAccess: false, canDesign: true, createdAt: Date.now(), invitationSlug: null, packageTier: null };
    await saveAccountHash(user.id, await hashPassword(password));
    await updateDraftUsers((list) => [user, ...list]);
    res.json({ designer: { id: user.id, name, email, status: user.status } });
  } catch (err) { console.error("designer create failed:", err.message); res.status(502).json({ error: "Couldn't create the designer account." }); }
});
// Who's asking: the admin, or a logged-in designer (their user record).
async function designerOf(req) {
  const who = authReady ? requestRole(req) : { role: "admin" };
  if (who.role !== "client") return null;
  const u = (await readDraftUsers()).find((x) => x?.id === who.userId);
  return u?.role === "designer" ? u : null;
}
app.post("/api/designs/submit", express.json({ limit: "512kb" }), async (req, res) => {
  try {
    const designer = await designerOf(req);
    if (!designer) return res.status(403).json({ error: "Only designer accounts can submit designs." });
    const design = req.body?.design;
    if (!design || typeof design !== "object") return res.status(400).json({ error: "bad request" });
    const sub = {
      id: randomUUID().replace(/-/g, "").slice(0, 12),
      designerId: designer.id, designerName: designer.name, designerEmail: designer.email,
      title: String(req.body?.title || "").trim().slice(0, 100), note: String(req.body?.note || "").trim().slice(0, 1000),
      previewSlug: String(designer.invitationSlug || ""),
      design: JSON.parse(JSON.stringify(design)), status: "pending", submittedAt: Date.now(),
    };
    // A copy of the designer's invitation as it is right now, so each
    // submission keeps its own link (/e/design-sub-<id>) even after the
    // designer goes on to make the next design in the same Builder.
    const designerRaw = await kvRead(`einvite:invitation-${designer.id}`).catch(() => null);
    if (designerRaw) {
      await kvWrite(`einvite:design-demo-sub-${sub.id}`, JSON.stringify({ ...JSON.parse(designerRaw), guestGroups: [], tables: [], openInviteLinks: [] }));
      sub.hasDemo = true;
    }
    await kvWrite(SUBMISSIONS_KV, JSON.stringify([sub, ...(await readSubmissions())]));
    res.json({ submission: { ...sub, design: undefined } });
  } catch (err) { console.error("design submit failed:", err.message); res.status(502).json({ error: "Couldn't send the design — please try again." }); }
});
app.get("/api/designs/submissions", async (req, res) => {
  try {
    const all = await readSubmissions();
    if (isAdminReq(req)) return res.set("cache-control", "no-store").json({ submissions: all });
    const designer = await designerOf(req);
    if (!designer) return res.status(401).json({ error: "Please log in." });
    res.set("cache-control", "no-store").json({ submissions: all.filter((x) => x.designerId === designer.id).map((x) => ({ ...x, design: undefined })) });
  } catch { res.status(502).json({ error: "Couldn't load submissions." }); }
});
app.post("/api/designs/submissions/:id/review", requireAdminOnly, express.json({ limit: "4kb" }), async (req, res) => {
  const action = req.body?.action;
  if (!["approve", "decline"].includes(action)) return res.status(400).json({ error: "bad request" });
  try {
    const all = await readSubmissions();
    const i = all.findIndex((x) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Not found." });
    if (action === "approve") {
      const name = String(req.body?.name || "").trim().slice(0, 100);
      const price = Math.max(0, Math.min(100000, Number(req.body?.price) || 0));
      if (!name) return res.status(400).json({ error: "Give the design a name." });
      const shopRaw = await kvRead("einvite:shop-designs");
      const shop = shopRaw ? JSON.parse(shopRaw) : [];
      const design = { ...all[i].design, id: `shop-${randomUUID().replace(/-/g, "").slice(0, 10)}`, name, price, description: all[i].title || "", designedBy: all[i].designerName };
      // The copy of the designer's invitation taken when this design was
      // sent becomes its live preview (/e/design-<id>), without guests.
      // (Older submissions have none: their designer's invitation as it is now.)
      const demoRaw = (await kvRead(`einvite:design-demo-sub-${all[i].id}`).catch(() => null))
        || (all[i].designerId ? await kvRead(`einvite:invitation-${all[i].designerId}`).catch(() => null) : null);
      if (demoRaw) {
        await kvWrite(`einvite:design-demo-${design.id}`, JSON.stringify({ ...JSON.parse(demoRaw), guestGroups: [], tables: [], openInviteLinks: [] }));
        design.hasDemo = true;
      }
      await kvWrite("einvite:shop-designs", JSON.stringify([...shop, design]));
      Object.assign(all[i], { status: "approved", shopDesignId: design.id, name, price, reviewedAt: Date.now(), reason: "" });
    } else {
      Object.assign(all[i], { status: "declined", reason: String(req.body?.reason || "").trim().slice(0, 1000), reviewedAt: Date.now() });
    }
    await kvWrite(SUBMISSIONS_KV, JSON.stringify(all));
    res.json({ submission: all[i] });
  } catch (err) { console.error("design review failed:", err.message); res.status(502).json({ error: "Couldn't save the review." }); }
});

// The live chat inbox password: remembered here once the admin uses the
// inbox, and handed to logged-in team accounts so they can answer chats.
app.post("/api/staff/chat-key", requireAdminOnly, express.json({ limit: "2kb" }), async (req, res) => {
  const key = String(req.body?.key || "").trim().slice(0, 200);
  if (!key) return res.status(400).json({ error: "bad request" });
  try { await kvWrite("einvite:live-chat-team-key", JSON.stringify({ key })); res.json({ ok: true }); } catch { res.status(502).json({ error: "Couldn't save." }); }
});
app.get("/api/staff/chat-key", requireStaffOrAdmin, async (_req, res) => {
  try {
    const raw = await kvRead("einvite:live-chat-team-key");
    const key = raw ? JSON.parse(raw).key : "";
    res.set("cache-control", "no-store").json({ key: key || "" });
  } catch { res.status(502).json({ error: "Couldn't load the chat." }); }
});

// The clients list, read only (no passwords or private data beyond contact).
app.get("/api/staff/users", requireStaffOrAdmin, async (_req, res) => {
  try {
    const users = (await readDraftUsers()).filter((u) => u?.id).map((u) => ({
      id: u.id, name: String(u.name || ""), email: String(u.email || ""), phone: String(u.phone || ""),
      status: String(u.status || "active"), role: String(u.role || "normal"), slug: String(u.invitationSlug || ""),
      createdAt: u.createdAt || null,
    }));
    const by = (st) => users.filter((u) => u.status === st).length;
    res.set("cache-control", "no-store").json({ total: users.length, active: by("active"), pending: by("pending"), users });
  } catch (err) { res.status(502).json({ error: "Couldn't load the clients." }); }
});

// Invoices, made by the admin or the team.
const INVOICES_KV = "einvite:invoices";
async function readInvoices() { const raw = await kvRead(INVOICES_KV); return raw ? JSON.parse(raw) : []; }
function cleanInvoice(b) {
  const str = (v, n) => String(v ?? "").trim().slice(0, n);
  const items = (Array.isArray(b?.items) ? b.items : []).slice(0, 50).map((it) => ({
    description: str(it?.description, 300),
    qty: Math.max(0, Math.min(100000, Number(it?.qty) || 0)),
    unitPrice: Math.max(0, Math.min(10000000, Math.round((Number(it?.unitPrice) || 0) * 100) / 100)),
  })).filter((it) => it.description && it.qty > 0);
  const subtotal = items.reduce((n, it) => n + it.qty * it.unitPrice, 0);
  const discount = Math.max(0, Math.min(subtotal, Math.round((Number(b?.discount) || 0) * 100) / 100));
  return {
    billTo: { name: str(b?.billTo?.name, 120), email: str(b?.billTo?.email, 120), phone: str(b?.billTo?.phone, 40), userId: str(b?.billTo?.userId, 40) },
    items, currency: /^[A-Z]{3}$/.test(String(b?.currency || "")) ? b.currency : "USD",
    issueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(b?.issueDate || "")) ? b.issueDate : new Date().toISOString().slice(0, 10),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(b?.dueDate || "")) ? b.dueDate : "",
    discount, notes: str(b?.notes, 1000),
    subtotal: Math.round(subtotal * 100) / 100, total: Math.round((subtotal - discount) * 100) / 100,
  };
}
app.get("/api/invoices", requireStaffOrAdmin, async (_req, res) => {
  try { res.set("cache-control", "no-store").json({ invoices: await readInvoices() }); } catch { res.status(502).json({ error: "Couldn't load invoices." }); }
});
app.post("/api/invoices", requireStaffOrAdmin, express.json({ limit: "64kb" }), async (req, res) => {
  const inv = cleanInvoice(req.body);
  if (!inv.billTo.name) return res.status(400).json({ error: "Who is the invoice for? Enter a name." });
  if (!inv.items.length) return res.status(400).json({ error: "Add at least one item with a quantity." });
  try {
    const all = await readInvoices();
    const year = inv.issueDate.slice(0, 4);
    const seq = all.filter((x) => String(x.number || "").startsWith(`INV-${year}-`)).length + 1;
    const invoice = { id: randomUUID().replace(/-/g, "").slice(0, 12), number: `INV-${year}-${String(seq).padStart(4, "0")}`, status: "unpaid", ...inv,
      createdBy: req.staff ? { role: "sales", id: req.staff.id, name: req.staff.name } : { role: "admin", name: "Admin" }, createdAt: Date.now() };
    await kvWrite(INVOICES_KV, JSON.stringify([invoice, ...all]));
    res.json({ invoice });
  } catch (err) { console.error("invoice create failed:", err.message); res.status(502).json({ error: "Couldn't save the invoice." }); }
});
app.patch("/api/invoices/:id", requireStaffOrAdmin, express.json({ limit: "64kb" }), async (req, res) => {
  try {
    const all = await readInvoices();
    const i = all.findIndex((x) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Not found." });
    const b = req.body || {};
    if (["unpaid", "paid", "void"].includes(b.status)) { all[i].status = b.status; all[i].paidAt = b.status === "paid" ? Date.now() : null; }
    if (b.items) Object.assign(all[i], cleanInvoice({ ...all[i], ...b }));
    all[i].updatedAt = Date.now();
    await kvWrite(INVOICES_KV, JSON.stringify(all));
    res.json({ invoice: all[i] });
  } catch (err) { res.status(502).json({ error: "Couldn't update the invoice." }); }
});
app.delete("/api/invoices/:id", requireAdminOnly, async (req, res) => {
  try { await kvWrite(INVOICES_KV, JSON.stringify((await readInvoices()).filter((x) => x.id !== req.params.id))); res.json({ ok: true }); } catch { res.status(502).json({ error: "Couldn't delete the invoice." }); }
});

// Appointments: a client asks for a Zoom meeting, an office visit or a
// phone call; the admin or the team confirms (with a time / Zoom link) or
// declines, and the client sees it in the app.
const APPOINTMENTS_KV = "einvite:appointments";
const APPOINTMENT_TYPES = ["zoom", "office", "phone"];
async function readAppointments() { const raw = await kvRead(APPOINTMENTS_KV); return raw ? JSON.parse(raw) : []; }
const myAppointment = (a) => ({ id: a.id, type: a.type, date: a.date, time: a.time, note: a.note, status: a.status, reply: a.reply || "", zoomLink: a.zoomLink || "", createdAt: a.createdAt, updatedAt: a.updatedAt || null });
const appointmentLabel = (t) => (t === "zoom" ? "Zoom meeting" : t === "office" ? "Office visit" : "Phone call");

app.get("/api/appointments/mine", async (req, res) => {
  const who = authReady ? requestRole(req) : { role: "anon" };
  if (who.role !== "client") return res.json({ appointments: [] });
  try { res.set("cache-control", "no-store").json({ appointments: (await readAppointments()).filter((a) => a.userId === who.userId).map(myAppointment) }); }
  catch { res.status(502).json({ error: "Couldn't load your appointments." }); }
});
app.post("/api/appointments", express.json({ limit: "8kb" }), async (req, res) => {
  const who = authReady ? requestRole(req) : { role: "anon" };
  if (who.role !== "client") return res.status(401).json({ error: "Please log in to book an appointment." });
  const b = req.body || {};
  const str = (v, n) => String(v ?? "").trim().slice(0, n);
  const type = APPOINTMENT_TYPES.includes(b.type) ? b.type : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? b.date : "";
  const time = /^\d{2}:\d{2}$/.test(String(b.time || "")) ? b.time : "";
  if (!type) return res.status(400).json({ error: "Choose how you'd like to meet." });
  if (!date || !time) return res.status(400).json({ error: "Choose a day and a time." });
  if (date < new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return res.status(400).json({ error: "That day has already passed." });
  try {
    const all = await readAppointments();
    if (all.filter((a) => a.userId === who.userId && a.status === "requested").length >= 3) return res.status(429).json({ error: "You already have 3 requests waiting — we'll get back to you soon." });
    const user = (await readDraftUsers()).find((u) => u?.id === who.userId) || {};
    const appt = {
      id: randomUUID().replace(/-/g, "").slice(0, 12), userId: who.userId,
      name: str(user.name, 120), email: str(user.email, 120), phone: str(b.phone, 40) || str(user.phone, 40),
      type, date, time, note: str(b.note, 1000), status: "requested", createdAt: Date.now(),
    };
    await kvWrite(APPOINTMENTS_KV, JSON.stringify([appt, ...all]));
    notifyOwner("__owner__", { title: "New appointment request", body: `${appt.name || appt.email || "A client"} · ${appointmentLabel(type)} · ${date} ${time}`, tag: `appt-${appt.id}`, url: "/" }).catch(() => {});
    res.json({ appointment: myAppointment(appt) });
  } catch (err) { console.error("appointment create failed:", err.message); res.status(502).json({ error: "Couldn't send your request — please try again." }); }
});
// The client cancels their own request.
app.post("/api/appointments/:id/cancel", async (req, res) => {
  const who = authReady ? requestRole(req) : { role: "anon" };
  if (who.role !== "client") return res.status(401).json({ error: "Please log in." });
  try {
    const all = await readAppointments();
    const a = all.find((x) => x.id === req.params.id && x.userId === who.userId);
    if (!a) return res.status(404).json({ error: "Not found." });
    a.status = "cancelled"; a.updatedAt = Date.now();
    await kvWrite(APPOINTMENTS_KV, JSON.stringify(all));
    res.json({ appointment: myAppointment(a) });
  } catch { res.status(502).json({ error: "Couldn't cancel — please try again." }); }
});
app.get("/api/appointments", requireStaffOrAdmin, async (_req, res) => {
  try { res.set("cache-control", "no-store").json({ appointments: await readAppointments() }); } catch { res.status(502).json({ error: "Couldn't load appointments." }); }
});
app.patch("/api/appointments/:id", requireStaffOrAdmin, express.json({ limit: "8kb" }), async (req, res) => {
  const b = req.body || {};
  try {
    const all = await readAppointments();
    const a = all.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: "Not found." });
    const before = `${a.status}|${a.date}|${a.time}`;
    if (["requested", "confirmed", "declined", "done"].includes(b.status)) a.status = b.status;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(b.date || ""))) a.date = b.date;
    if (/^\d{2}:\d{2}$/.test(String(b.time || ""))) a.time = b.time;
    if (b.reply !== undefined) a.reply = String(b.reply || "").trim().slice(0, 1000);
    if (b.zoomLink !== undefined) { const z = String(b.zoomLink || "").trim().slice(0, 500); a.zoomLink = /^https:\/\//i.test(z) ? z : ""; }
    a.handledBy = req.staff ? req.staff.name : "Admin";
    a.updatedAt = Date.now();
    await kvWrite(APPOINTMENTS_KV, JSON.stringify(all));
    if (before !== `${a.status}|${a.date}|${a.time}` && (a.status === "confirmed" || a.status === "declined")) {
      notifyOwner(a.userId, {
        title: a.status === "confirmed" ? "Appointment confirmed" : "Appointment not available",
        body: a.status === "confirmed" ? `${appointmentLabel(a.type)} · ${a.date} at ${a.time}` : a.reply || "Please choose another time.",
        tag: `appt-${a.id}`, url: "/app",
      }).catch(() => {});
    }
    res.json({ appointment: a });
  } catch (err) { res.status(502).json({ error: "Couldn't update the appointment." }); }
});

// Upload a new video: the raw file is the request body.
app.post("/api/video/optimize", requireMember, express.raw({ type: () => true, limit: VIDEO_MAX_UPLOAD }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: "No video received." });
  return handleVideoJob(res, async () => req.body, req.query.audio === "1");
});

// Optimize a video that's already in our own Storage (e.g. an older, full-
// size intro video). Only URLs on this project's public Storage are accepted.
app.post("/api/video/optimize-url", requireMember, express.json({ limit: "10kb" }), (req, res) => {
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

// ---------------------------------------------------------------------------
// Client accounts. Passwords used to sit in plain text in the users list of
// einvite:draft-core, which every browser could read. Now each account's
// password is stored only as a scrypt hash in the app_accounts table (see
// supabase/sql/app_accounts.sql), which only this server can read, and the
// server checks passwords at login:
//   POST /api/auth/login   { email, password } -> { userId }
//   POST /api/auth/signup  { name, email, phone, password } creates the account
//   POST /api/auth/google  { accessToken } Google sign-in (and sign-up)
//   POST /api/auth/migrate  hashes any plain-text passwords still in the
//                           users list, so the app can drop them on save
//   GET  /api/auth/status  { ready } - the app only switches to server
//                           logins once this server has the service key,
//                           the table exists and the passwords are migrated
// ---------------------------------------------------------------------------

const DRAFT_KEY = "einvite:draft-core";
const SCRYPT_N = 16384;
let authReady = false;

function scryptAsync(password, salt, keylen, opts) {
  return new Promise((resolve, reject) => scrypt(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(String(password), salt, 64, { N: SCRYPT_N, r: 8, p: 1 });
  return `scrypt$${SCRYPT_N}$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(password, stored) {
  const [kind, n, r, p, saltB64, keyB64] = String(stored || "").split("$");
  if (kind !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scryptAsync(String(password), Buffer.from(saltB64, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

async function readDraftUsers() {
  const draft = await getKvValue(DRAFT_KEY);
  return Array.isArray(draft?.users) ? draft.users : [];
}

async function getAccountHash(userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_accounts?user_id=eq.${encodeURIComponent(userId)}&select=password_hash`, { headers: serviceHeaders });
  if (!res.ok) throw new Error(`app_accounts read failed (${res.status})`);
  const rows = await res.json();
  return rows[0]?.password_hash || null;
}

async function listAccountIds() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_accounts?select=user_id`, { headers: serviceHeaders });
  if (!res.ok) throw new Error(`app_accounts list failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return new Set((await res.json()).map((r) => r.user_id));
}

async function saveAccountHash(userId, passwordHash) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_accounts`, {
    method: "POST",
    headers: { ...serviceHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: userId, password_hash: passwordHash, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`app_accounts write failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

// A real plain-text password (Google sign-ins get a random placeholder).
const isLegacyPassword = (pw) => typeof pw === "string" && pw.length > 0 && !pw.startsWith("google-oauth-");

// Hashes every plain-text password in the users list that has no account
// row yet. Safe to run any number of times. Returns the ids that now have
// an account row.
let migrateRunning = null;
function migrateLegacyPasswords() {
  if (!migrateRunning) {
    migrateRunning = (async () => {
      const [users, ids] = await Promise.all([readDraftUsers(), listAccountIds()]);
      let added = 0;
      for (const u of users) {
        if (!u?.id || ids.has(u.id) || !isLegacyPassword(u.password)) continue;
        await saveAccountHash(u.id, await hashPassword(u.password));
        ids.add(u.id);
        added++;
      }
      if (added) console.log(`auth: hashed ${added} plain-text password(s)`);
      return ids;
    })().finally(() => { migrateRunning = null; });
  }
  return migrateRunning;
}

(async () => {
  if (!serviceHeaders) {
    console.warn("auth: SUPABASE_SERVICE_ROLE_KEY is not set, so client passwords stay in the old plain-text form");
    return;
  }
  try {
    await migrateLegacyPasswords();
    authReady = true;
    console.log("auth: server-side password checks are on");
  } catch (err) {
    console.error("auth: not switched on:", err.message, "(has supabase/sql/app_accounts.sql been run?)");
  }
})();

// Wrong logins are limited per IP and per email to slow down guessing.
const loginFailures = new Map(); // key -> { count, since }
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function loginBlocked(keys) {
  const now = Date.now();
  return keys.some((k) => {
    const f = loginFailures.get(k);
    if (f && now - f.since > LOGIN_WINDOW_MS) { loginFailures.delete(k); return false; }
    return (f?.count || 0) >= LOGIN_MAX_FAILURES;
  });
}
function noteLoginFailure(keys) {
  const now = Date.now();
  for (const k of keys) {
    const f = loginFailures.get(k) || { count: 0, since: now };
    loginFailures.set(k, { count: f.count + 1, since: f.since });
  }
}

// The account with this email and password, or null.
async function checkClientPassword(email, password) {
  const user = email && password ? (await readDraftUsers()).find((u) => String(u?.email || "").toLowerCase() === email) : null;
  if (!user) return null;
  let hash = await getAccountHash(user.id);
  if (!hash && isLegacyPassword(user.password)) {
    await migrateLegacyPasswords();
    hash = await getAccountHash(user.id);
  }
  return hash && (await verifyPassword(password, hash)) ? user : null;
}

app.get("/api/auth/status", (_req, res) => res.set("cache-control", "no-store").json({ ready: authReady }));

app.post("/api/auth/login", express.json({ limit: "4kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "Login isn't available right now — please try again in a minute." });
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const limitKeys = [`ip:${clientIp(req)}`, `email:${email}`];
  if (loginBlocked(limitKeys)) return res.status(429).json({ error: "Too many wrong attempts. Please try again in 15 minutes." });
  try {
    const user = await checkClientPassword(email, password);
    if (!user) {
      noteLoginFailure(limitKeys);
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    setClientSession(req, res, user.id);
    res.json({ userId: user.id, user: publicUser(user) });
  } catch (err) {
    console.error("auth login failed:", err.message);
    res.status(500).json({ error: "Couldn't log in right now — please try again." });
  }
});

// Creates the account itself (the users-list record and the password hash)
// and logs the new client in. `active` is for sign-ups that already paid
// for a design, which skip the approval wait (as before).
app.post("/api/auth/signup", express.json({ limit: "4kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "Sign-up isn't available right now — please try again in a minute." });
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim().slice(0, 100);
  const phone = String(req.body?.phone || "").trim().slice(0, 40);
  if (!name || !email.includes("@") || email.length > 200 || password.length < 6 || password.length > 200) {
    return res.status(400).json({ error: "Please fill in your name, a valid email and a password of at least 6 characters." });
  }
  const limitKeys = [`signup:${clientIp(req)}`];
  if (loginBlocked(limitKeys)) return res.status(429).json({ error: "Too many sign-ups from here — please try again later." });
  try {
    const users = await readDraftUsers();
    if (users.some((u) => String(u?.email || "").toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: "An account with that email already exists." });
    const user = { id: randomUUID().replace(/-/g, "").slice(0, 10), name, email, phone, role: "normal", status: req.body?.active ? "active" : "pending", dashboardAccess: false, canDesign: false, createdAt: Date.now(), invitationSlug: null, packageTier: null };
    await saveAccountHash(user.id, await hashPassword(password));
    await updateDraftUsers((list) => [user, ...list]);
    noteLoginFailure(limitKeys); // counts sign-ups too, so one IP can't create hundreds
    setClientSession(req, res, user.id);
    res.json({ user });
  } catch (err) {
    console.error("auth signup failed:", err.message);
    res.status(500).json({ error: "Couldn't create the account right now — please try again." });
  }
});

// Google sign-in: the browser gets a Supabase access token from Google's
// sign-in; the server checks it with Supabase, then logs in the matching
// account, or creates one when `create` is set.
app.post("/api/auth/google", express.json({ limit: "8kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "Sign-in isn't available right now — please try again in a minute." });
  const token = String(req.body?.accessToken || "");
  if (!token || token.length > 5000) return res.status(400).json({ error: "bad request" });
  try {
    const check = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!check.ok) return res.status(401).json({ error: "Couldn't verify the Google account." });
    const g = await check.json();
    const email = String(g.email || "").trim();
    if (!email) return res.status(400).json({ error: "Google didn't share an email address." });
    let user = (await readDraftUsers()).find((u) => String(u?.email || "").toLowerCase() === email.toLowerCase());
    if (!user) {
      if (!req.body?.create) return res.status(404).json({ notFound: true });
      const name = String(g.user_metadata?.full_name || g.user_metadata?.name || email.split("@")[0]).slice(0, 100);
      user = { id: randomUUID().replace(/-/g, "").slice(0, 10), name, email, phone: "", role: "normal", status: req.body?.active ? "active" : "pending", dashboardAccess: false, canDesign: false, createdAt: Date.now(), invitationSlug: null, packageTier: null };
      await updateDraftUsers((list) => (list.some((u) => String(u?.email || "").toLowerCase() === email.toLowerCase()) ? list : [user, ...list]));
    }
    setClientSession(req, res, user.id);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("auth google failed:", err.message);
    res.status(500).json({ error: "Couldn't sign in with Google right now — please try again." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(CLIENT_COOKIE, { path: "/" });
  res.json({ ok: true });
});

app.post("/api/auth/migrate", requireMember, async (_req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  try {
    res.json({ ids: [...(await migrateLegacyPasswords())] });
  } catch (err) {
    console.error("auth migrate failed:", err.message);
    res.status(500).json({ error: "migrate failed" });
  }
});

// Guest links (/e/<slug>) only need to know which client a slug belongs
// to, not the whole users list with everyone's emails and phone numbers.
let draftUsersCache = { at: 0, users: [] };
app.get(/^\/api\/invitation-owner\/([^/]+)$/, async (req, res) => {
  const slug = decodeURIComponent(req.params[0]);
  try {
    if (Date.now() - draftUsersCache.at > 15000) draftUsersCache = { at: Date.now(), users: await readDraftUsers() };
    const user = draftUsersCache.users.find((u) => u?.invitationSlug === slug);
    if (!user) return res.status(404).json({ error: "not found" });
    res.set("cache-control", "no-store").json({ id: user.id, invitationSlug: user.invitationSlug, packageTier: user.packageTier || null });
  } catch (err) {
    console.error("invitation owner lookup failed:", err.message);
    res.status(500).json({ error: "lookup failed" });
  }
});

// ---------------------------------------------------------------------------
// Data gateway. The app used to read and write the kv_store table straight
// from the browser with the public anon key, so anyone could read every
// client's details or overwrite any invitation. Once auth is ready, the app
// goes through this server instead, which uses the service key and decides
// who may do what:
//   - admin (logged in with ADMIN_PASSWORD): everything
//   - a logged-in client (client_session cookie): read everything public,
//     their own record in the users list, write their own invitation, the
//     shared builder keys, and a limited set of fields on their own record
//   - anyone else: read public data only; guests reply through
//     /api/guest/rsvp, which changes only the guest list
// Rules are enforced only when ADMIN_PASSWORD is set (otherwise there is
// no way to tell the admin apart, and the admin must keep working).
// ---------------------------------------------------------------------------

const CLIENT_COOKIE = "client_session";
const CLIENT_SESSION_MS = 30 * 24 * 3600 * 1000;
const sessionKey = createHmac("sha256", SUPABASE_SERVICE_KEY || randomBytes(32)).update("einvite-client-session").digest();
const clientSig = (payload) => createHmac("sha256", sessionKey).update(payload).digest("hex");

function setClientSession(req, res, userId) {
  const payload = `${userId}.${Date.now() + CLIENT_SESSION_MS}`;
  res.cookie(CLIENT_COOKIE, `${payload}.${clientSig(payload)}`, { httpOnly: true, sameSite: "lax", secure: isHttps(req), maxAge: CLIENT_SESSION_MS, path: "/" });
}

function clientSessionUser(req) {
  const raw = readCookie(req, CLIENT_COOKIE);
  const i = raw.lastIndexOf(".");
  if (i < 0) return null;
  const payload = raw.slice(0, i);
  const [userId, expires] = [payload.slice(0, payload.lastIndexOf(".")), payload.slice(payload.lastIndexOf(".") + 1)];
  if (!userId || !(Number(expires) > Date.now()) || !sameSecret(raw.slice(i + 1), clientSig(payload))) return null;
  return userId;
}

const gatewayEnforced = () => !!ADMIN_PASSWORD;

// Features that cost money or a lot of CPU (AI translation through
// OpenAI, video and music conversion) are for the admin and logged-in
// clients only, not for anyone on the internet. Before the server auth is
// set up there are no sessions yet, so they stay open as before.
function requireMember(req, res, next) {
  if (!authReady || requestRole(req).role !== "anon") return next();
  res.status(401).json({ error: "Please log in to use this." });
}

// And a client can't run up the OpenAI bill: at most 60 translations an
// hour each (a whole invitation is one translation). The admin isn't limited.
const translateHits = new Map(); // userId -> { count, since }
function limitClientTranslations(req, res, next) {
  const who = authReady ? requestRole(req) : { role: "admin" };
  if (who.role !== "client") return next();
  const now = Date.now();
  const h = translateHits.get(who.userId);
  const cur = h && now - h.since < 3600000 ? h : { count: 0, since: now };
  if (cur.count >= 60) return res.status(429).json({ error: "You've translated a lot in the last hour — please try again a bit later." });
  translateHits.set(who.userId, { count: cur.count + 1, since: cur.since });
  next();
}
function requestRole(req) {
  if (!gatewayEnforced() || hasAdminSession(req)) return { role: "admin" };
  const userId = clientSessionUser(req);
  return userId ? { role: "client", userId } : { role: "anon" };
}

async function kvRead(key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, { headers: serviceHeaders });
  if (!res.ok) throw new Error(`kv read failed (${res.status})`);
  const rows = await res.json();
  return rows[0] ? rows[0].value : null;
}

async function kvWrite(key, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
    method: "POST",
    headers: { ...serviceHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`kv write failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

// Photos, music and videos that older versions saved INSIDE an invitation
// (as long base64 text) made some invitations several MB: the admin app
// downloads every invitation, and the client and every guest download
// theirs, so those few made the whole site slow. The Builder only ever
// cleaned up the invitation that happened to be open, so the rest stayed
// big. This moves every such file to Storage and leaves its link in its
// place, once, a little after the server starts. The untouched original is
// kept first under einvite:slim-backup-<key>, which nothing loads.
const INLINE_MEDIA_RE = /"(data:(image|audio|video)\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]{20000,}))"/g;
const INLINE_MEDIA_EXT = { jpeg: "jpg", jpg: "jpg", png: "png", gif: "gif", webp: "webp", mpeg: "mp3", mp3: "mp3", mp4: "mp4", "x-m4a": "m4a", aac: "aac", wav: "wav", "x-wav": "wav", ogg: "ogg", webm: "webm", quicktime: "mov" };
async function slimSavedValue(key) {
  const raw = await kvRead(key);
  if (!raw || raw.length < 100000) return null;
  const found = new Map();
  for (const m of raw.matchAll(INLINE_MEDIA_RE)) found.set(m[1], { kind: m[2], sub: m[3].toLowerCase(), b64: m[4] });
  if (!found.size) return { key, before: raw.length, after: raw.length, moved: 0 };
  const links = new Map();
  for (const [dataUri, f] of found) {
    try {
      const name = `${randomUUID()}.${INLINE_MEDIA_EXT[f.sub] || "bin"}`;
      const bucket = f.kind === "image" ? "invitation-photos" : "custom-videos";
      links.set(dataUri, await uploadToStorage(bucket, name, `${f.kind}/${f.sub}`, Buffer.from(f.b64, "base64")));
    } catch (err) {
      console.error(`slim: couldn't upload a file from ${key}:`, err.message);
    }
  }
  if (!links.size) return { key, before: raw.length, after: raw.length, moved: 0 };
  await kvWrite(`einvite:slim-backup-${key.slice("einvite:".length)}`, raw);
  // Re-read right before writing, so an edit saved while the files were
  // uploading isn't lost; only the embedded files themselves are swapped.
  const fresh = (await kvRead(key)) || raw;
  let next = fresh;
  for (const [dataUri, link] of links) next = next.split(dataUri).join(link);
  if (next !== fresh) await kvWrite(key, next);
  return { key, before: fresh.length, after: next.length, moved: links.size };
}
async function slimAllSavedValues() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?select=key&key=like.${encodeURIComponent("einvite:invitation-*")}`, { headers: serviceHeaders });
  if (!res.ok) throw new Error(`listing invitations failed (${res.status})`);
  const keys = [...(await res.json()).map((r) => r.key), "einvite:draft-core", "einvite:shop-designs"];
  for (const key of keys) {
    try {
      const r = await slimSavedValue(key);
      if (r?.moved) console.log(`slim: ${key} ${Math.round(r.before / 1024)} kB -> ${Math.round(r.after / 1024)} kB (${r.moved} file(s) moved to Storage)`);
    } catch (err) {
      console.error(`slim: ${key} failed:`, err.message);
    }
  }
}
if (serviceHeaders) setTimeout(() => slimAllSavedValues().catch((err) => console.error("slim: stopped:", err.message)), 20000);

// Read-modify-write of the users list in einvite:draft-core.
async function updateDraftUsers(fn) {
  const raw = await kvRead(DRAFT_KEY);
  const draft = raw ? JSON.parse(raw) : {};
  const users = Array.isArray(draft.users) ? draft.users : [];
  const next = fn(users);
  await kvWrite(DRAFT_KEY, JSON.stringify({ ...draft, users: next }));
  draftUsersCache = { at: 0, users: [] };
  return next;
}

const publicUser = (u) => {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
};

// What a client may change on their own record; the rest (role, status,
// access flags, email, id) stays as the server has it.
const CLIENT_LOCKED_FIELDS = ["id", "email", "role", "status", "dashboardAccess", "canDesign", "password", "createdAt"];
function mergeClientUsers(serverUsers, incomingUsers, userId) {
  const mine = Array.isArray(incomingUsers) ? incomingUsers.find((u) => u?.id === userId) : null;
  if (!mine) return serverUsers;
  return serverUsers.map((u) => {
    if (u?.id !== userId) return u;
    const patch = Object.fromEntries(Object.entries(mine).filter(([k]) => !CLIENT_LOCKED_FIELDS.includes(k)));
    // A client can't take a link another client already has.
    if (patch.invitationSlug && patch.invitationSlug !== u.invitationSlug) patch.invitationSlug = uniqueSlug(serverUsers, patch.invitationSlug, userId);
    return { ...u, ...patch };
  });
}

// Same rules as generateUniqueSlug in the app.
function uniqueSlug(users, base, excludeUserId) {
  const clean = String(base || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "invitation";
  const taken = new Set(users.filter((u) => u?.id !== excludeUserId).map((u) => u?.invitationSlug).filter(Boolean));
  taken.add(ADMIN_PREVIEW_SLUG);
  let candidate = clean;
  for (let n = 2; taken.has(candidate); n++) candidate = `${clean}-${n}`;
  return candidate;
}

// Clients only see their own record, so the app asks here for a free link.
app.get("/api/unique-slug", async (req, res) => {
  try {
    res.set("cache-control", "no-store").json({ slug: uniqueSlug(await readDraftUsers(), String(req.query.base || "").slice(0, 200), String(req.query.exclude || "")) });
  } catch (err) {
    console.error("unique slug failed:", err.message);
    res.status(502).json({ error: "failed" });
  }
});

const KV_KEY_RE = /^einvite:[A-Za-z0-9:_\-.]{1,120}$/;
// The Builder's shared working copy of the admin's own backgrounds, intro
// media, share image and music. Older Builder versions saved these from a
// client's session too, overwriting the admin's images; a client's copy
// lives in their own invitation, so those writes are now ignored.
const ADMIN_WORKING_COPY = (key) => /^einvite:(bg-|introbg-)/.test(key) || key === "einvite:og-image" || key === "einvite:music-audio";

// Server-only data (logins, invoices, keys…): read through their own
// endpoints, never straight from the store by anyone but the admin.
const ADMIN_ONLY_KV = (key) =>
  /^einvite:(access-keys|appointments|design-submissions|invoices|live-chat-team-key|staff|vapid-keys|wa-verify-token|wa-errors)$/.test(key) ||
  /^einvite:(push-subs-|slim-backup-|wa-msg-|mcp-|bridal-)/.test(key);

app.get("/api/kv", async (req, res) => {
  const key = String(req.query.key || "");
  if (!KV_KEY_RE.test(key)) return res.status(400).json({ error: "bad key" });
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const who = requestRole(req);
  if (ADMIN_ONLY_KV(key) && who.role !== "admin") return res.status(403).json({ error: "not allowed" });
  try {
    let value = await kvRead(key);
    if (value !== null && key === DRAFT_KEY && who.role !== "admin") {
      const draft = JSON.parse(value);
      const users = Array.isArray(draft.users) ? draft.users : [];
      draft.users = who.role === "client" ? users.filter((u) => u?.id === who.userId).map(publicUser) : [];
      value = JSON.stringify(draft);
    }
    res.set("cache-control", "no-store").json({ value });
  } catch (err) {
    console.error("kv get failed:", key, err.message);
    res.status(502).json({ error: "read failed" });
  }
});

// Guests answer (and open their link) on the server while the couple may
// have the Builder open with an older copy of the list. When that older
// copy is saved, each family keeps whichever version is newer, and families
// that appeared after the Builder last synced (an open-link reply) stay.
function mergeGuestGroupsOnSave(incomingValue, serverValue) {
  let incoming, server;
  try { incoming = JSON.parse(incomingValue); server = JSON.parse(serverValue); } catch { return incomingValue; }
  if (!Array.isArray(incoming?.guestGroups) || !Array.isArray(server?.guestGroups)) return incomingValue;
  const byId = new Map(server.guestGroups.filter((g) => g?.id).map((g) => [g.id, g]));
  const seen = new Set();
  const merged = incoming.guestGroups.map((g) => {
    const sv = g?.id ? byId.get(g.id) : null;
    if (!sv) return g;
    seen.add(g.id);
    const viewedAt = Math.max(Number(g.viewedAt) || 0, Number(sv.viewedAt) || 0) || undefined;
    if ((Number(sv.updatedAt) || 0) > (Number(g.updatedAt) || 0)) {
      return { ...g, members: sv.members, additionalGuests: sv.additionalGuests, rsvpVia: sv.rsvpVia ?? g.rsvpVia, updatedAt: sv.updatedAt, invitationViewed: !!(sv.invitationViewed || g.invitationViewed), ...(viewedAt ? { viewedAt } : {}) };
    }
    const viewedSince = (Number(sv.viewedAt) || 0) > (Number(g.updatedAt) || 0);
    return { ...g, invitationViewed: !!(g.invitationViewed || viewedSince), ...(viewedAt ? { viewedAt } : {}) };
  });
  const syncedAt = Number(incoming.guestsSyncedAt) || 0;
  const added = syncedAt ? server.guestGroups.filter((g) => g?.id && !seen.has(g.id) && !incoming.guestGroups.some((x) => x?.id === g.id) && Math.max(Number(g.updatedAt) || 0, Number(g.viewedAt) || 0) > syncedAt) : [];
  return JSON.stringify({ ...incoming, guestGroups: [...added, ...merged] });
}
const INVITATION_KEY_RE = /^einvite:invitation-[A-Za-z0-9_-]+$/;

app.put("/api/kv", express.json({ limit: "25mb" }), async (req, res) => {
  const key = String(req.body?.key || "");
  const value = req.body?.value;
  if (!KV_KEY_RE.test(key) || typeof value !== "string") return res.status(400).json({ error: "bad request" });
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const who = requestRole(req);
  try {
    const withLatestGuests = async () => {
      if (!INVITATION_KEY_RE.test(key)) return value;
      const current = await kvRead(key).catch(() => null);
      return current ? mergeGuestGroupsOnSave(value, current) : value;
    };
    if (who.role === "admin") {
      await kvWrite(key, await withLatestGuests());
    } else if (who.role === "client" && key === `einvite:invitation-${who.userId}`) {
      await kvWrite(key, await withLatestGuests());
    } else if (who.role === "client" && key === DRAFT_KEY) {
      const incoming = JSON.parse(value);
      const raw = await kvRead(DRAFT_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const users = mergeClientUsers(Array.isArray(current.users) ? current.users : [], incoming.users, who.userId);
      // The admin's own lists stay as they are: a client's save can add to
      // the invitation list but never drop anyone from it, and can't touch
      // the intro media library, the site domain, or which invitation the
      // admin's app opens on (activeInvitationId — a client's save used to
      // switch the admin over to that client's invitation).
      const invitationIds = [...new Set([...(current.invitationIds || []), ...(Array.isArray(incoming.invitationIds) ? incoming.invitationIds : [])])];
      // Everything else in the draft (content, layouts, settings...) is the
      // admin's own working copy; a client's invitation is saved in its own
      // key, so a client's save only adds their user record and invitation.
      await kvWrite(DRAFT_KEY, JSON.stringify({ ...(Object.keys(current).length ? current : incoming), users, invitationIds }));
      draftUsersCache = { at: 0, users: [] };
    } else if (who.role === "client" && ADMIN_WORKING_COPY(key)) {
      return res.json({ ok: true, ignored: true });
    } else {
      return res.status(who.role === "anon" ? 401 : 403).json({ error: "not allowed" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("kv put failed:", key, err.message);
    res.status(502).json({ error: "save failed" });
  }
});

// Sending the WhatsApp invitation / reminder templates. Used to go through
// the clever-api edge function, which anyone holding the public anon key
// could call (and send messages on the account's Meta bill); now only a
// logged-in client or the admin can, and only the app's two approved
// templates. Uses the same Meta credentials as the whatsapp-webhook
// function (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID), set on
// this app in Dokploy.
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || "";
const WHATSAPP_TEMPLATES = new Set(["wedding_invitation", "wedding_invitation_reminder"]);
const whatsappHits = new Map(); // userId -> { count, since }
// The message templates this app's WhatsApp number can actually send (name,
// language, status), straight from Meta, so the Dashboard can offer them to
// pick from instead of a hand-typed name that might not match. The
// WhatsApp Business Account is WHATSAPP_BUSINESS_ACCOUNT_ID when set,
// otherwise the one(s) the access token itself is granted.
let wabaIdsCache = null;
async function whatsappAccountIds() {
  // Read forgivingly: spaces around the name or value, quotes, or one of
  // the other common names for it.
  const WABA_NAMES = ["WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_WABA_ID", "WABA_ID", "META_WABA_ID", "META_WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_ACCOUNT_ID", "META_BUSINESS_ACCOUNT_ID"];
  const envKey = Object.keys(process.env).find((k) => WABA_NAMES.includes(k.trim().toUpperCase()));
  const fromEnv = envKey ? String(process.env[envKey]).replace(/[^0-9]/g, "") : "";
  if (fromEnv) return [fromEnv];
  if (envKey) throw new Error(`${envKey.trim()} is set but has no number in it. Put the WhatsApp Business Account ID (digits only) after the "=".`);
  if (wabaIdsCache) return wabaIdsCache;
  const r = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${encodeURIComponent(WHATSAPP_TOKEN)}&access_token=${encodeURIComponent(WHATSAPP_TOKEN)}`);
  const data = await r.json().catch(() => ({}));
  const ids = new Set();
  for (const s of data?.data?.granular_scopes || []) {
    if (/whatsapp_business_(management|messaging)/.test(s.scope)) (s.target_ids || []).forEach((id) => ids.add(String(id)));
  }
  if (!ids.size) throw new Error(data?.error?.message || "Couldn't tell which WhatsApp Business Account this token belongs to. Set WHATSAPP_BUSINESS_ACCOUNT_ID on the app in Dokploy.");
  wabaIdsCache = [...ids];
  return wabaIdsCache;
}
// What a template needs filled in: its body variables ({{1}}… or named
// ones), whether it has an image or text-variable header, and a "Visit
// website" button whose URL ends in a variable (filled with the guest's
// own link).
function whatsappTemplateShape(t) {
  const comps = t.components || [];
  const tokens = (text) => [...new Set([...String(text || "").matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]))];
  const header = comps.find((c) => c.type === "HEADER");
  const buttons = comps.find((c) => c.type === "BUTTONS")?.buttons || [];
  let urlButton = null;
  buttons.forEach((btn, index) => {
    if (!urlButton && btn.type === "URL" && /\{\{/.test(btn.url || "")) urlButton = { index, base: String(btn.url).split("{{")[0] };
  });
  const params = tokens(comps.find((c) => c.type === "BODY")?.text);
  return {
    params,
    named: t.parameter_format === "NAMED" || params.some((p) => !/^\d+$/.test(p)),
    imageHeader: header?.format === "IMAGE",
    headerParams: header?.format === "TEXT" ? tokens(header.text) : [],
    urlButton,
  };
}
// What each body variable is filled with when the couple hasn't said:
// the guest's name first, then their link (unless a link button already
// carries it), then the couple's names.
function defaultWhatsappVars(count, hasUrlButton) {
  const base = hasUrlButton ? ["name", "names"] : count === 1 ? ["link"] : count === 2 ? ["name", "link"] : ["name", "names", "link"];
  return Array.from({ length: count }, (_, i) => base[i] || "names");
}
async function whatsappTemplatesRaw(name) {
  const out = [];
  for (const id of await whatsappAccountIds()) {
    const q = name ? `&name=${encodeURIComponent(name)}` : "";
    const r = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(id)}/message_templates?fields=name,language,status,components,parameter_format&limit=200${q}`, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `Meta answered ${r.status}`);
    out.push(...(data.data || []));
  }
  return out;
}
const templateShapeCache = new Map(); // "name:lang" -> { at, shape }
async function whatsappTemplateShapeFor(name, lang) {
  const key = `${name}:${lang}`;
  const hit = templateShapeCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.shape;
  const t = (await whatsappTemplatesRaw(name)).find((x) => x.name === name && x.language === lang);
  const shape = t ? whatsappTemplateShape(t) : null;
  templateShapeCache.set(key, { at: Date.now(), shape });
  return shape;
}
app.get("/api/whatsapp/templates", async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  if (requestRole(req).role === "anon") return res.status(401).json({ error: "Please log in." });
  if (!WHATSAPP_TOKEN) return res.status(503).json({ error: "WhatsApp sending isn't set up." });
  try {
    templateShapeCache.clear();
    const templates = (await whatsappTemplatesRaw()).map((t) => {
      const shape = whatsappTemplateShape(t);
      return { name: t.name, language: t.language, status: t.status, variables: shape.params.length, params: shape.params, imageHeader: shape.imageHeader, urlButton: shape.urlButton };
    });
    res.set("cache-control", "no-store").json({ templates });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/whatsapp/send", express.json({ limit: "16kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const who = requestRole(req);
  if (who.role === "anon") return res.status(401).json({ error: "Please log in to send WhatsApp messages." });
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    return res.status(503).json({ error: "WhatsApp sending isn't set up: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID need to be set on the app in Dokploy." });
  }
  if (who.role === "client") {
    const now = Date.now();
    const h = whatsappHits.get(who.userId);
    const cur = h && now - h.since < 3600000 ? h : { count: 0, since: now };
    if (cur.count >= 500) return res.status(429).json({ error: "You've sent a lot of messages in the last hour — please try again a bit later." });
    whatsappHits.set(who.userId, { count: cur.count + 1, since: cur.since });
  }
  const b = req.body || {};
  const to = String(b.to || "").replace(/[^0-9]/g, "");
  let templateName = String(b.templateName || "");
  let languageCode = /^[a-z]{2}(_[A-Z]{2})?$/.test(String(b.languageCode || "")) ? b.languageCode : "en";
  // "__default__": the admin's chosen invitation template (Yes / No), in
  // the asked language when it exists, otherwise English, otherwise any.
  if (templateName === "__default__") {
    try {
      const name = String((await kvRead(WA_DEFAULT_TEMPLATE_KV)) || "").trim();
      if (!/^[a-z0-9_]{1,100}$/.test(name)) return res.status(400).json({ error: "No invitation template is set yet — ask eInvite to set one." });
      const approved = (await whatsappTemplatesRaw(name)).filter((t) => t.name === name && t.status === "APPROVED").map((t) => t.language);
      if (!approved.length) return res.status(400).json({ error: `The invitation template "${name}" isn't approved in WhatsApp yet.` });
      const want = languageCode.slice(0, 2);
      languageCode = approved.find((l) => l === languageCode) || approved.find((l) => l.slice(0, 2) === want) || approved.find((l) => l.slice(0, 2) === "en") || approved[0];
      templateName = name;
    } catch (err) {
      console.error("default template lookup failed:", err.message);
      return res.status(502).json({ error: "Couldn't reach WhatsApp to find the invitation template — please try again." });
    }
  }
  const variables = (Array.isArray(b.variables) ? b.variables : []).slice(0, 5).map((v) => String(v ?? "").slice(0, 500));
  const headerImageUrl = /^https:\/\/[^\s]{1,1000}$/.test(String(b.headerImageUrl || "")) ? b.headerImageUrl : null;
  if (to.length < 6 || to.length > 16) return res.status(400).json({ error: "That phone number doesn't look right." });
  // The two standard templates, or a couple's own approved template (just
  // a template name; Meta itself rejects one that isn't approved).
  const standardTemplate = WHATSAPP_TEMPLATES.has(templateName);
  if (!standardTemplate && !/^[a-z0-9_]{1,100}$/.test(templateName)) return res.status(400).json({ error: "Unknown message template." });
  // The standard templates read "…the wedding of {{2}}" — never send them without names.
  if (standardTemplate && !String(variables[1] || "").trim()) return res.status(400).json({ error: "Fill in \"Names in WhatsApp messages\" first." });
  let components = [];
  if (headerImageUrl) components.push({ type: "header", parameters: [{ type: "image", image: { link: headerImageUrl } }] });
  if (variables.length) components.push({ type: "body", parameters: variables.map((text) => ({ type: "text", text })) });
  // A couple's own template: fill exactly what that template has (its
  // variables, image header, link button), looked up from Meta, so the
  // message always matches it.
  const fill = !standardTemplate && b.fill && typeof b.fill === "object" ? b.fill : null;
  if (fill) {
    const val = (k) => String(fill[k] ?? "").slice(0, 500).trim();
    let shape = null;
    try { shape = await whatsappTemplateShapeFor(templateName, languageCode); } catch (err) { console.error("WhatsApp template lookup failed:", err.message); }
    if (shape) {
      const roles = Array.isArray(b.vars) && b.vars.length ? b.vars.map(String) : defaultWhatsappVars(shape.params.length, !!shape.urlButton);
      const text = (role) => val(["name", "names", "link"].includes(role) ? role : "name") || val("name") || "-";
      const param = (tok, role) => ({ type: "text", text: text(role), ...(shape.named ? { parameter_name: tok } : {}) });
      components = [];
      if (shape.imageHeader) {
        if (!headerImageUrl) return res.status(400).json({ error: "This template has an image at the top: add a photo in Settings → Share preview first." });
        components.push({ type: "header", parameters: [{ type: "image", image: { link: headerImageUrl } }] });
      } else if (shape.headerParams.length) {
        components.push({ type: "header", parameters: shape.headerParams.map((tok) => param(tok, "name")) });
      }
      if (shape.params.length) components.push({ type: "body", parameters: shape.params.map((tok, i) => param(tok, roles[i] || defaultWhatsappVars(shape.params.length, !!shape.urlButton)[i])) });
      if (shape.urlButton) {
        const link = val("link");
        const suffix = link.startsWith(shape.urlButton.base) ? link.slice(shape.urlButton.base.length) : link;
        components.push({ type: "button", sub_type: "url", index: String(shape.urlButton.index), parameters: [{ type: "text", text: suffix || "-" }] });
      }
    }
  }
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(WHATSAPP_PHONE_ID)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: templateName, language: { code: languageCode }, components } }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("WhatsApp send failed:", r.status, JSON.stringify(data?.error || data).slice(0, 500));
      // Plain-language reasons for Meta's most common template errors.
      const code = data?.error?.code;
      const hint = {
        132001: `WhatsApp has no approved template "${templateName}" in language "${languageCode}". Check that it's Active (not "In review") in WhatsApp Manager, and that the name and language here match it exactly.`,
        132000: "The number of variables sent doesn't match the template. Check the template has exactly the {{…}} variables this message fills in.",
        132012: "The template's header doesn't match: turn \"Image at the top\" on if the template has an image header, or off if it doesn't (and make sure the Share preview has a photo).",
        131026: "This number can't receive WhatsApp messages (it may not be on WhatsApp).",
        132015: "This template is paused by WhatsApp because of low quality. Check it in WhatsApp Manager.",
        132016: "This template was disabled by WhatsApp. Check it in WhatsApp Manager.",
      }[code];
      return res.status(502).json({ error: hint ? `${hint} (${data?.error?.message || code})` : data?.error?.message || "Meta didn't accept the message." });
    }
    const messageId = data?.messages?.[0]?.id || null;
    // Remember which guest this message went to, so a Yes / No tapped on
    // it in WhatsApp can be recorded against them (see the webhook below).
    const slug = String(b.slug || "");
    const groupId = String(b.groupId || "");
    if (messageId && SLUG_RE.test(slug) && /^[A-Za-z0-9_-]{1,64}$/.test(groupId) && (await ownsSlug(req, slug).catch(() => false))) {
      const ownerId = await slugOwnerId(slug).catch(() => null);
      if (ownerId) await kvWrite(waMessageKey(messageId), JSON.stringify({ ownerId, slug, groupId, phone: to, lang: languageCode.slice(0, 2), at: Date.now() })).catch((err) => console.error("WhatsApp message record failed:", err.message));
    }
    res.json({ sent: true, messageId });
  } catch (err) {
    console.error("WhatsApp send failed:", err.message);
    res.status(502).json({ error: "Couldn't reach WhatsApp — please try again." });
  }
});

// ---------------------------------------------------------------------------
// Yes / No in the WhatsApp chat. An invitation template with two quick-reply
// buttons (Yes / No): the guest's tap comes back to this webhook, marks
// their family as coming / not coming, and a Yes gets their check-in QR
// code straight back in the chat. Set this URL as the WhatsApp webhook in
// Meta; everything is then passed on to the whatsapp-webhook edge function
// too, so the delivery ticks keep working.
// ---------------------------------------------------------------------------
const WA_DEFAULT_TEMPLATE_KV = "einvite:wa-default-template";
const waMessageKey = (messageId) => `einvite:wa-msg-${createHmac("sha256", "wa-msg").update(String(messageId)).digest("hex").slice(0, 40)}`;
const WA_APP_SECRET = (process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || "").trim();
const WA_FORWARD_URL = (process.env.WHATSAPP_WEBHOOK_FORWARD_URL || `${SUPABASE_URL}/functions/v1/whatsapp-webhook`).trim();
let waWebhookLastAt = 0;
// Copy of every verified webhook for the eInvite Inbox (inbox.einvite.me).
// Off unless WHATSAPP_INBOX_FORWARD_URL is set; failures never touch the flow below.
const inboxForwarder = createInboxForwarder({
  url: process.env.WHATSAPP_INBOX_FORWARD_URL || "",
  queueDir: process.env.WHATSAPP_INBOX_QUEUE_DIR || "/data/whatsapp-inbox-outbox",
});
if (inboxForwarder.enabled) {
  if (!WA_APP_SECRET) console.error("WHATSAPP_INBOX_FORWARD_URL is set but no app secret is configured: the Inbox rejects unsigned webhooks, so nothing will reach it.");
  inboxForwarder.start();
}
async function waVerifyToken() {
  if (process.env.WHATSAPP_VERIFY_TOKEN) return process.env.WHATSAPP_VERIFY_TOKEN.trim();
  let token = await kvRead("einvite:wa-verify-token");
  if (!token) { token = randomBytes(18).toString("hex"); await kvWrite("einvite:wa-verify-token", token); }
  return token;
}
const WA_YES = /^(yes|y|yeah|yep|oui|s[ií]|ok|okay|coming|attending|نعم|ايه|أيوه|ايوه|اكيد|أكيد|موافق|حاضر|سنحضر|այո)(?=\s|$)/i;
const WA_NO = /^(no|n|nope|non|not coming|can'?t|لا|ما رح|لن|ոչ)(?=\s|$)/i;
const waReplyStatus = (text) => {
  const t = String(text || "").trim().replace(/[^\p{L}\p{N}' ]+/gu, " ").trim();
  return WA_YES.test(t) ? "yes" : WA_NO.test(t) ? "no" : null;
};
const WA_TEXT = {
  en: { qr: (n) => `Thank you${n ? `, ${n}` : ""}! 🎉 Here is your check-in QR code — show it at the door.`, no: "Thank you for letting us know — you'll be missed! 💛" },
  ar: { qr: (n) => `شكراً${n ? ` ${n}` : ""}! 🎉 هذا رمز الدخول الخاص بكم — أظهروه عند الباب.`, no: "شكراً لإعلامنا — سنفتقدكم! 💛" },
  fr: { qr: (n) => `Merci${n ? ` ${n}` : ""} ! 🎉 Voici votre QR code d'entrée — montrez-le à l'accueil.`, no: "Merci de nous avoir prévenus — vous nous manquerez ! 💛" },
  es: { qr: (n) => `¡Gracias${n ? `, ${n}` : ""}! 🎉 Este es tu código QR de entrada — muéstralo en la puerta.`, no: "Gracias por avisarnos — ¡te extrañaremos! 💛" },
  hy: { qr: (n) => `Շնորհակալություն${n ? `, ${n}` : ""}։ 🎉 Ահա ձեր մուտքի QR կոդը — ցույց տվեք այն մուտքի մոտ։`, no: "Շնորհակալություն տեղեկացնելու համար — մենք ձեզ կկարոտենք։ 💛" },
};
async function waSend(to, message) {
  const r = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(WHATSAPP_PHONE_ID)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...message }),
  });
  if (!r.ok) throw new Error(`WhatsApp reply failed (${r.status}): ${(await r.text().catch(() => "")).slice(0, 300)}`);
}
async function siteDomainForLinks() {
  try { const d = JSON.parse((await kvRead(DRAFT_KEY)) || "{}"); if (d.siteDomain) return String(d.siteDomain).replace(/^https?:\/\//, "").replace(/\/.*$/, ""); } catch {}
  return process.env.PUBLIC_SITE_DOMAIN || "cores.einvite.me";
}
// Marks the whole family as coming / not coming, like their own link would.
async function applyWhatsappRsvp(sent, status) {
  const key = `einvite:invitation-${sent.ownerId}`;
  const raw = await kvRead(key);
  if (!raw) return null;
  const latest = JSON.parse(raw);
  const groups = Array.isArray(latest.guestGroups) ? latest.guestGroups : [];
  const existing = groups.find((g) => g.id === sent.groupId);
  if (!existing) return null;
  const members = (existing.members || []).length ? existing.members.map((m) => ({ ...m, status })) : [{ id: randomUUID().replace(/-/g, "").slice(0, 8), name: existing.name || "Guest", status }];
  const group = { ...existing, members, invitationViewed: true, rsvpVia: "whatsapp", updatedAt: Date.now() };
  latest.guestGroups = groups.map((g) => (g.id === group.id ? group : g));
  await kvWrite(key, JSON.stringify(latest));
  notifyOwner(sent.ownerId, rsvpNotice(group, status)).catch((err) => console.error("rsvp notification failed:", err.message));
  return group;
}
const waSeen = new Map(); // incoming message id -> time (Meta can deliver a message twice)
async function handleWhatsappMessage(msg) {
  if (!msg?.id || waSeen.has(msg.id)) return;
  waSeen.set(msg.id, Date.now());
  if (waSeen.size > 5000) for (const [k, t] of waSeen) if (Date.now() - t > 3600000) waSeen.delete(k);
  const text = msg.type === "button" ? msg.button?.payload || msg.button?.text
    : msg.type === "interactive" ? msg.interactive?.button_reply?.title || msg.interactive?.button_reply?.id
    : msg.type === "text" ? msg.text?.body : "";
  const status = waReplyStatus(text);
  const contextId = msg.context?.id;
  if (!status || !contextId) return;
  const raw = await kvRead(waMessageKey(contextId));
  if (!raw) return;
  const sent = JSON.parse(raw);
  const from = String(msg.from || "").replace(/[^0-9]/g, "");
  // Only the number the invitation went to can answer for that family.
  if (!from || !(from.endsWith(sent.phone.slice(-8)) || sent.phone.endsWith(from.slice(-8)))) return;
  const group = await applyWhatsappRsvp(sent, status);
  if (!group) return;
  const words = WA_TEXT[sent.lang] || WA_TEXT.en;
  const name = String(group.name || (group.members || []).map((m) => m.name).filter((n) => n && n !== "Guest").slice(0, 3).join(", ") || "").slice(0, 80);
  if (status === "no") { await waSend(from, { type: "text", text: { body: words.no } }); return; }
  let token = (await restGet(`guest_checkins?guest_group_id=eq.${enc(group.id)}&select=token`).catch(() => []))[0]?.token;
  if (!token) {
    token = randomUUID();
    const coming = (group.members || []).map((m) => m.name).filter(Boolean).join(", ") + (Number(group.additionalGuests) > 0 ? ` + ${Number(group.additionalGuests)}` : "");
    await restSend("POST", "guest_checkins", { invitation_slug: sent.slug, guest_group_id: group.id, guest_names: (name || coming || "Guest").slice(0, 300), token });
  }
  const checkinLink = `https://${await siteDomainForLinks()}/checkin/${token}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=24&format=png&data=${encodeURIComponent(checkinLink)}`;
  await waSend(from, { type: "image", image: { link: qr, caption: words.qr(name) } });
}

app.get("/api/whatsapp/webhook", async (req, res) => {
  try {
    if (req.query["hub.mode"] === "subscribe" && sameSecret(String(req.query["hub.verify_token"] || ""), await waVerifyToken())) {
      return res.type("text/plain").send(String(req.query["hub.challenge"] || ""));
    }
  } catch (err) { console.error("WhatsApp webhook verify failed:", err.message); }
  res.sendStatus(403);
});
app.post("/api/whatsapp/webhook", express.raw({ type: () => true, limit: "1mb" }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  const signature = String(req.get("x-hub-signature-256") || "");
  if (WA_APP_SECRET && !sameSecret(signature, `sha256=${createHmac("sha256", WA_APP_SECRET).update(body).digest("hex")}`)) return res.sendStatus(401);
  // Stored on disk before answering Meta, but only as a copy: if it can't be stored we still answer 200 so invitations/RSVPs keep working.
  await inboxForwarder.enqueue(body, signature);
  res.sendStatus(200); // answer Meta straight away; the work happens after
  waWebhookLastAt = Date.now();
  if (WA_FORWARD_URL && WA_FORWARD_URL !== "off") {
    fetch(WA_FORWARD_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(signature ? { "X-Hub-Signature-256": signature } : {}) }, body })
      .catch((err) => console.error("WhatsApp webhook forward failed:", err.message));
  }
  let payload = null;
  try { payload = JSON.parse(body.toString("utf8")); } catch { return; }
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return;
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const msg of change?.value?.messages || []) {
        await handleWhatsappMessage(msg).catch((err) => console.error("WhatsApp reply failed:", err.message));
      }
      await noteWhatsappFailures(change?.value?.statuses || []).catch((err) => console.error("WhatsApp status note failed:", err.message));
    }
  }
});
// Why a message didn't reach a guest (Meta's "failed" status), kept per
// phone number so the dashboard can say it in plain words; cleared once a
// later message to that number is delivered.
const WA_ERRORS_KV = "einvite:wa-errors";
async function noteWhatsappFailures(statuses) {
  if (!statuses.length) return;
  const raw = await kvRead(WA_ERRORS_KV);
  const all = raw ? JSON.parse(raw) : {};
  let changed = false;
  for (const st of statuses) {
    const phone = String(st?.recipient_id || "").replace(/[^0-9]/g, "");
    if (!phone) continue;
    if (st.status === "failed") {
      const e = (st.errors || [])[0] || {};
      all[phone] = { code: Number(e.code) || null, title: String(e.title || e.message || "").slice(0, 200), details: String(e.error_data?.details || "").slice(0, 300), at: Date.now() };
      changed = true;
      console.error("WhatsApp delivery failed:", phone.slice(0, 4) + "…", e.code, e.title);
    } else if ((st.status === "delivered" || st.status === "read") && all[phone]) {
      delete all[phone];
      changed = true;
    }
  }
  if (!changed) return;
  const entries = Object.entries(all).sort((x, y) => y[1].at - x[1].at).slice(0, 3000);
  await kvWrite(WA_ERRORS_KV, JSON.stringify(Object.fromEntries(entries)));
}
const WA_ERROR_TEXT = {
  131049: "WhatsApp didn't deliver this marketing message: Meta limits how many marketing messages one person gets. Try again later, or use a Utility template.",
  131050: "This person has stopped marketing messages from your WhatsApp number.",
  130472: "Meta held this one back (the number is part of a WhatsApp experiment). Try again later.",
  131026: "Couldn't deliver: the number may not be on WhatsApp, or they haven't accepted WhatsApp's latest terms.",
  131047: "More than 24 hours since they last wrote — only an approved template can be sent.",
  131052: "WhatsApp couldn't load the photo at the top — upload the share photo again.",
  131053: "WhatsApp couldn't load the photo at the top — upload the share photo again.",
  131042: "There's a payment problem on the WhatsApp Business account.",
  131031: "The WhatsApp Business account is locked.",
  131021: "That's the business's own number — send to a different one.",
  131000: "Something went wrong on WhatsApp's side. Try again.",
  132000: "The message's variables don't match the template.",
  132001: "This template doesn't exist (or isn't approved) in that language.",
};
const waErrorText = (e) => WA_ERROR_TEXT[e.code] || [e.title, e.details].filter(Boolean).join(" — ") || "WhatsApp couldn't deliver this message.";

// What the admin pastes into Meta to turn this on.
app.get("/api/whatsapp/webhook-info", requireAdminOnly, async (req, res) => {
  try {
    res.set("cache-control", "no-store").json({
      url: `https://${req.get("host")}/api/whatsapp/webhook`,
      verifyToken: await waVerifyToken(),
      appSecretSet: !!WA_APP_SECRET,
      sendingReady: !!(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
      lastEventAt: waWebhookLastAt || null,
    });
  } catch (err) { res.status(502).json({ error: "Couldn't load the webhook details." }); }
});

// WhatsApp delivery ticks in the guest dashboard. The whatsapp_incoming
// table holds every phone number the webhook has seen, so it's no longer
// readable by the anon key; logged-in users ask here, and only get the
// statuses for the numbers they send (the ones in their own guest list).
app.post("/api/whatsapp-status", express.json({ limit: "64kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  if (requestRole(req).role === "anon") return res.status(401).json({ error: "Please log in." });
  const phones = [...new Set((Array.isArray(req.body?.phones) ? req.body.phones : []).map((p) => String(p || "").replace(/[^0-9]/g, "")).filter((p) => p.length >= 6 && p.length <= 16))].slice(0, 500);
  if (!phones.length) return res.json({ statuses: {} });
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_incoming?direction=eq.status&from_number=in.(${phones.join(",")})&select=from_number,message_type,received_at&order=received_at.asc`, { headers: serviceHeaders });
    if (!r.ok) throw new Error(`whatsapp_incoming read failed (${r.status})`);
    const statuses = {};
    const times = {}; // when that latest status came in, so an older message's status isn't shown for a newer send
    for (const row of await r.json()) { statuses[row.from_number] = row.message_type; times[row.from_number] = Date.parse(row.received_at) || null; } // latest wins
    const errors = {};
    try {
      const all = JSON.parse((await kvRead(WA_ERRORS_KV)) || "{}");
      for (const p of phones) if (all[p] && statuses[p] === "failed") errors[p] = `${waErrorText(all[p])}${all[p].code ? ` (${all[p].code})` : ""}`;
    } catch {}
    res.set("cache-control", "no-store").json({ statuses, errors, times });
  } catch (err) {
    console.error("whatsapp status failed:", err.message);
    res.status(502).json({ error: "failed" });
  }
});

// Guests replying to an invitation: only the guest list of that one
// invitation changes. Mirrors what the invitation page used to write
// itself (a personal link updates its own entry, anything else adds one).
const rsvpHits = new Map(); // ip -> { count, since }
const RSVP_STATUSES = ["yes", "no", "maybe", "pending"];
// ---------------------------------------------------------------------------
// Phone notifications (the /app web app): a client turns them on, and each
// guest reply to their invitation pings their phone. The signing keys
// (VAPID) are made once and kept in kv_store, unless set as
// WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY.
// ---------------------------------------------------------------------------
let vapidReady = null;
function pushKeys() {
  if (!vapidReady) vapidReady = (async () => {
    let keys = process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY
      ? { publicKey: process.env.WEB_PUSH_PUBLIC_KEY, privateKey: process.env.WEB_PUSH_PRIVATE_KEY }
      : null;
    if (!keys) {
      const raw = await kvRead("einvite:vapid-keys");
      keys = raw ? JSON.parse(raw) : null;
      if (!keys?.publicKey) {
        keys = webpush.generateVAPIDKeys();
        await kvWrite("einvite:vapid-keys", JSON.stringify(keys));
      }
    }
    webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || "mailto:hello@einvite.me", keys.publicKey, keys.privateKey);
    return keys;
  })().catch((err) => { vapidReady = null; throw err; });
  return vapidReady;
}
const pushSubsKey = (ownerId) => `einvite:push-subs-${ownerId}`;
// Whose notifications a request manages: a client's own, or the admin's.
const pushOwnerOf = (req) => { const who = authReady ? requestRole(req) : { role: "admin" }; return who.role === "client" ? who.userId : who.role === "admin" ? "__owner__" : null; };
app.get("/api/push/key", async (_req, res) => {
  try { res.json({ publicKey: (await pushKeys()).publicKey }); } catch (err) { console.error("push keys:", err.message); res.status(503).json({ error: "Notifications aren't available right now." }); }
});
app.post("/api/push/subscribe", requireMember, express.json({ limit: "8kb" }), async (req, res) => {
  const ownerId = pushOwnerOf(req);
  const sub = req.body?.subscription;
  if (!ownerId || !sub || !/^https:\/\//.test(String(sub.endpoint || "")) || !sub.keys?.p256dh || !sub.keys?.auth) return res.status(400).json({ error: "bad subscription" });
  try {
    const raw = await kvRead(pushSubsKey(ownerId));
    const list = (raw ? JSON.parse(raw) : []).filter((x) => x.endpoint !== sub.endpoint);
    list.unshift({ endpoint: String(sub.endpoint), keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) }, at: Date.now() });
    await kvWrite(pushSubsKey(ownerId), JSON.stringify(list.slice(0, 10)));
    res.json({ ok: true });
  } catch (err) { console.error("push subscribe:", err.message); res.status(502).json({ error: "Couldn't turn on notifications — please try again." }); }
});
app.post("/api/push/unsubscribe", requireMember, express.json({ limit: "8kb" }), async (req, res) => {
  const ownerId = pushOwnerOf(req);
  if (!ownerId) return res.status(400).json({ error: "bad request" });
  try {
    const raw = await kvRead(pushSubsKey(ownerId));
    const list = (raw ? JSON.parse(raw) : []).filter((x) => x.endpoint !== String(req.body?.endpoint || ""));
    await kvWrite(pushSubsKey(ownerId), JSON.stringify(list));
    res.json({ ok: true });
  } catch (err) { res.status(502).json({ error: "Couldn't turn off notifications." }); }
});
// Sends to every phone the owner turned notifications on for; drops the
// ones the phone has since revoked (404 / 410).
async function notifyOwner(ownerId, payload) {
  const raw = await kvRead(pushSubsKey(ownerId)).catch(() => null);
  const list = raw ? JSON.parse(raw) : [];
  if (!list.length) return;
  await pushKeys();
  const gone = new Set();
  await Promise.all(list.map((sub) => webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 86400 }).catch((err) => {
    if (err.statusCode === 404 || err.statusCode === 410) gone.add(sub.endpoint);
    else console.error("push send failed:", err.statusCode || "", String(err.body || err.message).slice(0, 160));
  })));
  if (gone.size) await kvWrite(pushSubsKey(ownerId), JSON.stringify(list.filter((x) => !gone.has(x.endpoint)))).catch(() => {});
}
function rsvpNotice(group, status) {
  const ms = group.members || [];
  const named = group.name || ms.map((m) => m.name).filter((n) => n && n !== "Guest").slice(0, 3).join(", ") || "A guest";
  const coming = ms.filter((m) => m.status === "yes").length + (status === "yes" ? Number(group.additionalGuests) || 0 : 0);
  return status === "yes"
    ? { title: "New reply: coming", body: `${named} ${coming > 1 ? `are coming (${coming} people)` : "is coming"}`, tag: `rsvp-${group.id}`, url: "/app" }
    : status === "no"
    ? { title: "New reply: not coming", body: `${named} can't make it`, tag: `rsvp-${group.id}`, url: "/app" }
    : { title: "New reply", body: `${named} replied: ${status}`, tag: `rsvp-${group.id}`, url: "/app" };
}

app.post("/api/guest/rsvp", express.json({ limit: "16kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const ip = clientIp(req);
  const now = Date.now();
  const hit = rsvpHits.get(ip);
  if (hit && now - hit.since < 60000 && hit.count >= 20) return res.status(429).json({ error: "Too many replies — please try again in a minute." });
  rsvpHits.set(ip, hit && now - hit.since < 60000 ? { count: hit.count + 1, since: hit.since } : { count: 1, since: now });

  const b = req.body || {};
  const ownerId = String(b.ownerId || "");
  const status = String(b.status || "");
  const names = (Array.isArray(b.names) ? b.names : []).map((n) => String(n || "").trim().slice(0, 80)).filter(Boolean).slice(0, 20);
  // A family's personal link can say who of them isn't coming.
  const declinedNames = (Array.isArray(b.declinedNames) ? b.declinedNames : []).map((n) => String(n || "").trim().slice(0, 80)).filter(Boolean).slice(0, 20);
  const additionalGuests = Math.max(0, Math.min(50, Number(b.additionalGuests) || 0));
  // An open-link reply in "Number only" gives just the family's name.
  const familyName = String(b.familyName || "").trim().slice(0, 80);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(ownerId) || !RSVP_STATUSES.includes(status)) return res.status(400).json({ error: "bad request" });
  const key = `einvite:invitation-${ownerId}`;
  const genId = () => randomUUID().replace(/-/g, "").slice(0, 8);
  try {
    const raw = await kvRead(key);
    if (!raw) return res.status(404).json({ error: "Invitation not found." });
    const latest = JSON.parse(raw);
    const groups = Array.isArray(latest.guestGroups) ? latest.guestGroups : [];
    const members = [
      ...(names.length ? names.map((name) => ({ id: genId(), name, status })) : declinedNames.length ? [] : [{ id: genId(), name: "Guest", status }]),
      ...declinedNames.map((name) => ({ id: genId(), name, status: "no" })),
    ];
    let group;
    if (b.quick) {
      group = { id: genId(), lastName: "", members, additionalGuests: 0, table: "", phone: "", invitationSent: false, invitationViewed: true, updatedAt: now };
      latest.guestGroups = [group, ...groups];
    } else {
      const existing = b.groupId ? groups.find((g) => g.id === String(b.groupId)) : null;
      if (existing) {
        group = { ...existing, members: names.length || declinedNames.length ? members : existing.members, additionalGuests: status === "yes" ? additionalGuests : 0, invitationViewed: true, updatedAt: now };
        latest.guestGroups = groups.map((g) => (g.id === existing.id ? group : g));
      } else {
        group = { id: genId(), ...(familyName ? { name: familyName } : {}), lastName: "", members, additionalGuests: status === "yes" ? additionalGuests : 0, table: "", phone: "", tableId: null, invitationSent: false, invitationViewed: true, inviteBatchId: b.batchId ? String(b.batchId).slice(0, 64) : null, updatedAt: now };
        latest.guestGroups = [group, ...groups];
      }
    }
    await kvWrite(key, JSON.stringify(latest));
    res.json({ group });
    notifyOwner(ownerId, rsvpNotice(group, status)).catch((err) => console.error("rsvp notification failed:", err.message));
  } catch (err) {
    console.error("guest rsvp failed:", err.message);
    res.status(502).json({ error: "Couldn't save your response — please try again." });
  }
});

// A guest opened their personal link: the dashboard's "Viewed" ticks.
const viewedHits = new Map(); // ip -> { count, since }
app.post("/api/guest/viewed", express.json({ limit: "2kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const ip = clientIp(req);
  const now = Date.now();
  const hit = viewedHits.get(ip);
  if (hit && now - hit.since < 60000 && hit.count >= 30) return res.status(429).json({ error: "slow down" });
  viewedHits.set(ip, hit && now - hit.since < 60000 ? { count: hit.count + 1, since: hit.since } : { count: 1, since: now });
  const ownerId = String(req.body?.ownerId || "");
  const groupId = String(req.body?.groupId || "");
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(ownerId) || !/^[A-Za-z0-9_-]{1,64}$/.test(groupId)) return res.status(400).json({ error: "bad request" });
  try {
    const key = `einvite:invitation-${ownerId}`;
    const raw = await kvRead(key);
    if (!raw) return res.json({ ok: false });
    const latest = JSON.parse(raw);
    const groups = Array.isArray(latest.guestGroups) ? latest.guestGroups : [];
    const g = groups.find((x) => x.id === groupId);
    if (!g) return res.json({ ok: false });
    if (!g.invitationViewed || !g.viewedAt) {
      latest.guestGroups = groups.map((x) => (x.id === groupId ? { ...x, invitationViewed: true, viewedAt: now } : x));
      await kvWrite(key, JSON.stringify(latest));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("guest viewed failed:", err.message);
    res.status(502).json({ error: "failed" });
  }
});

// ---------------------------------------------------------------------------
// Event features: song requests, voice messages, QR check-ins and guest
// networking. Their tables used to be read and written straight from the
// browser with the anon key, so anyone could read every guest's details or
// change them. Now they go through here (service key), with these rules:
//   - guests can add a song request, a voice message, a check-in code, and
//     their own networking profile / connections / messages (proved with a
//     per-guest secret the server hands out when they register)
//   - the invitation's owner (that client, or the admin) sees and manages
//     everything for their invitation
//   - the DJ link and the check-in staff link carry a secret key
//     (/dj/<slug>?k=... and /checkin-staff/<slug>?k=...) instead of being
//     open to anyone who knows the invitation's link
//   - a QR check-in code (a random token) is its own proof, as before
// ---------------------------------------------------------------------------

const ACCESS_KEYS_KV = "einvite:access-keys";

async function restGet(pathAndQuery) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, { headers: serviceHeaders });
  if (!r.ok) throw new Error(`${pathAndQuery.split("?")[0]} read failed (${r.status}): ${(await r.text().catch(() => "")).slice(0, 200)}`);
  return r.json();
}
async function restSend(method, pathAndQuery, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers: { ...serviceHeaders, Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    const err = new Error(`${pathAndQuery.split("?")[0]} ${method} failed (${r.status}): ${(await r.text().catch(() => "")).slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}
const enc = encodeURIComponent;

// The client who owns a slug ("admin-preview" is the admin's own).
async function slugOwnerId(slug) {
  if (slug === ADMIN_PREVIEW_SLUG) return "__owner__";
  if (Date.now() - draftUsersCache.at > 15000) draftUsersCache = { at: Date.now(), users: await readDraftUsers() };
  let user = draftUsersCache.users.find((u) => u?.invitationSlug === slug);
  // A slug that was just created or renamed may not be in the cache yet.
  if (!user && Date.now() - draftUsersCache.at > 2000) {
    draftUsersCache = { at: Date.now(), users: await readDraftUsers() };
    user = draftUsersCache.users.find((u) => u?.invitationSlug === slug);
  }
  return user?.id || null;
}

async function ownsSlug(req, slug) {
  const who = requestRole(req);
  if (who.role === "admin") return true;
  if (who.role !== "client") return false;
  return (await slugOwnerId(slug)) === who.userId;
}

async function accessKeys() {
  const raw = await kvRead(ACCESS_KEYS_KV);
  return raw ? JSON.parse(raw) : {};
}
async function accessKeysFor(slug) {
  const all = await accessKeys();
  if (all[slug]?.dj && all[slug]?.staff) return all[slug];
  const keys = { dj: randomBytes(12).toString("hex"), staff: randomBytes(12).toString("hex") };
  await kvWrite(ACCESS_KEYS_KV, JSON.stringify({ ...(await accessKeys()), [slug]: keys }));
  return keys;
}
// The owner, or someone holding that slug's DJ / staff key.
async function canUseSlug(req, slug, kind) {
  if (await ownsSlug(req, slug)) return true;
  const key = String(req.get("x-access-key") || "");
  if (!key) return false;
  const keys = (await accessKeys())[slug];
  return !!keys?.[kind] && sameSecret(key, keys[kind]);
}

const SLUG_RE = /^[a-z0-9-]{1,100}$/;
const eventHits = new Map(); // "bucket:ip" -> { count, since }
function eventRateLimited(req, max = 30, bucket = "event") {
  const ip = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const h = eventHits.get(ip);
  const cur = h && now - h.since < 60000 ? h : { count: 0, since: now };
  cur.count++;
  eventHits.set(ip, cur);
  return cur.count > max;
}

// Wraps a handler: auth must be set up, errors become a plain 502.
const eventRoute = (fn) => async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "not ready" });
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`${req.method} ${req.path} failed:`, err.message);
    if (!res.headersSent) res.status(502).json({ error: "Something went wrong — please try again." });
  }
};
const deny = (res) => res.status(403).json({ error: "not allowed" });

// The owner's DJ and check-in staff links carry these keys.
app.get("/api/access-links", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await ownsSlug(req, slug))) return deny(res);
  const keys = await accessKeysFor(slug);
  res.set("cache-control", "no-store").json({ djKey: keys.dj, staffKey: keys.staff });
}));

// ---- Song requests ----
app.post("/api/song-requests", express.json({ limit: "8kb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || "");
  if (eventRateLimited(req)) return res.status(429).json({ error: "Too many requests — please try again in a minute." });
  if (!SLUG_RE.test(slug) || !(await slugOwnerId(slug))) return res.status(404).json({ error: "Invitation not found." });
  const songName = String(b.songName || "").trim().slice(0, 200);
  if (!songName) return res.status(400).json({ error: "Please enter a song name." });
  const rows = await restSend("POST", "song_requests", {
    invitation_slug: slug,
    song_name: songName,
    artist: String(b.artist || "").trim().slice(0, 200) || null,
    requester_name: String(b.requesterName || "").trim().slice(0, 100) || null,
  });
  res.json(rows[0] || {});
}));

app.get("/api/song-requests", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await canUseSlug(req, slug, "dj"))) return deny(res);
  res.set("cache-control", "no-store").json(await restGet(`song_requests?invitation_slug=eq.${enc(slug)}&order=created_at.desc`));
}));

app.patch("/api/song-requests/:id", express.json({ limit: "2kb" }), eventRoute(async (req, res) => {
  const slug = String(req.body?.slug || "");
  const status = String(req.body?.status || "").slice(0, 30);
  if (!SLUG_RE.test(slug) || !status || !(await canUseSlug(req, slug, "dj"))) return deny(res);
  const rows = await restSend("PATCH", `song_requests?id=eq.${enc(req.params.id)}&invitation_slug=eq.${enc(slug)}`, { status });
  if (!rows.length) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
}));

// ---- Live stream viewers ----
// A guest's phone pings every 20s while the live page is on screen.
// "Watching now" = pinged in the last 45s (kept in memory only); "in total"
// = every different phone that ever opened it, saved in kv_store so it
// survives a redeploy.
const LIVE_KV = "einvite:live-viewers";
const LIVE_WINDOW_MS = 45000;
const liveNow = new Map(); // slug -> Map(viewerId -> lastSeen)
let liveTotals = null; // slug -> Set(viewerId), stored as arrays
let liveTotalsDirty = false;
async function loadLiveTotals() {
  if (!liveTotals) {
    const raw = await kvRead(LIVE_KV);
    const saved = raw ? JSON.parse(raw) : {};
    liveTotals = liveTotals || Object.fromEntries(Object.entries(saved).map(([slug, ids]) => [slug, new Set(ids)]));
  }
  return liveTotals;
}
setInterval(async () => {
  const now = Date.now();
  for (const [slug, viewers] of liveNow) {
    for (const [id, seen] of viewers) if (now - seen > LIVE_WINDOW_MS) viewers.delete(id);
    if (!viewers.size) liveNow.delete(slug);
  }
  if (!liveTotalsDirty || !liveTotals) return;
  liveTotalsDirty = false;
  try {
    await kvWrite(LIVE_KV, JSON.stringify(Object.fromEntries(Object.entries(liveTotals).map(([slug, ids]) => [slug, [...ids]]))));
  } catch (err) {
    liveTotalsDirty = true;
    console.error("live viewers save failed:", err.message);
  }
}, 30000).unref();

app.post("/api/live/ping", express.json({ limit: "2kb" }), eventRoute(async (req, res) => {
  const slug = String(req.body?.slug || "");
  const viewerId = String(req.body?.viewerId || "");
  if (eventRateLimited(req, 120, "live")) return res.status(429).json({ error: "slow down" });
  if (!SLUG_RE.test(slug) || !/^[a-z0-9-]{6,64}$/i.test(viewerId)) return res.status(400).json({ error: "bad request" });
  if (!(await slugOwnerId(slug))) return res.status(404).json({ error: "not found" });
  const viewers = liveNow.get(slug) || new Map();
  if (viewers.size < 5000 || viewers.has(viewerId)) viewers.set(viewerId, Date.now());
  liveNow.set(slug, viewers);
  const totals = await loadLiveTotals();
  const seen = totals[slug] || (totals[slug] = new Set());
  if (seen.size < 20000 && !seen.has(viewerId)) {
    seen.add(viewerId);
    liveTotalsDirty = true;
  }
  res.status(204).end();
}));

app.get("/api/live/viewers", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await ownsSlug(req, slug))) return deny(res);
  const now = Date.now();
  let watching = 0;
  for (const seen of (liveNow.get(slug) || new Map()).values()) if (now - seen <= LIVE_WINDOW_MS) watching++;
  const total = (await loadLiveTotals())[slug]?.size || 0;
  res.set("cache-control", "no-store").json({ watching, total });
}));

// ---- Voice messages ----
app.post("/api/voice-messages", express.json({ limit: "12mb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || "");
  if (eventRateLimited(req, 10)) return res.status(429).json({ error: "Too many messages — please try again in a minute." });
  if (!SLUG_RE.test(slug) || !(await slugOwnerId(slug))) return res.status(404).json({ error: "Invitation not found." });
  const audioData = String(b.audioData || "");
  if (!audioData.startsWith("data:audio/") || audioData.length > 11 * 1024 * 1024) return res.status(400).json({ error: "That recording couldn't be sent." });
  const rows = await restSend("POST", "voice_messages", {
    invitation_slug: slug,
    guest_group_id: b.guestGroupId ? String(b.guestGroupId).slice(0, 64) : null,
    guest_name: String(b.guestName || "Guest").trim().slice(0, 100),
    rsvp_status: String(b.rsvpStatus || "").slice(0, 20) || null,
    audio_data: audioData,
    mime_type: String(b.mimeType || "audio/webm").slice(0, 60),
    duration_seconds: Number.isFinite(Number(b.durationSeconds)) ? Math.round(Number(b.durationSeconds)) : null,
  });
  res.json({ id: rows[0]?.id || null });
}));

app.get("/api/voice-messages", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await ownsSlug(req, slug))) return deny(res);
  res.set("cache-control", "no-store").json(await restGet(`voice_messages?invitation_slug=eq.${enc(slug)}&order=created_at.desc`));
}));

// ---- QR check-ins ----
app.post("/api/checkins", express.json({ limit: "4kb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || "");
  if (eventRateLimited(req)) return res.status(429).json({ error: "Too many requests." });
  if (!SLUG_RE.test(slug) || !(await slugOwnerId(slug))) return res.status(404).json({ error: "Invitation not found." });
  const token = randomUUID();
  await restSend("POST", "guest_checkins", {
    invitation_slug: slug,
    guest_group_id: String(b.guestGroupId || "").slice(0, 64) || null,
    guest_names: String(b.guestNames || "").slice(0, 300),
    token,
  });
  res.json({ token });
}));

app.get("/api/checkins", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await canUseSlug(req, slug, "staff"))) return deny(res);
  res.set("cache-control", "no-store").json(await restGet(`guest_checkins?invitation_slug=eq.${enc(slug)}&order=checked_in_at.desc.nullslast`));
}));

const TOKEN_RE = /^[A-Za-z0-9-]{8,80}$/;
app.get("/api/checkins/token/:token", eventRoute(async (req, res) => {
  if (!TOKEN_RE.test(req.params.token)) return res.json(null);
  const rows = await restGet(`guest_checkins?token=eq.${enc(req.params.token)}`);
  res.set("cache-control", "no-store").json(rows[0] || null);
}));

// A guest reopening their personal link gets their own code back.
app.get("/api/checkins/group/:groupId", eventRoute(async (req, res) => {
  const rows = await restGet(`guest_checkins?guest_group_id=eq.${enc(String(req.params.groupId).slice(0, 64))}&select=token`);
  res.set("cache-control", "no-store").json({ token: rows[0]?.token || null });
}));

app.post("/api/checkins/token/:token/check-in", eventRoute(async (req, res) => {
  if (!TOKEN_RE.test(req.params.token)) return res.json(null);
  const rows = await restSend("PATCH", `guest_checkins?token=eq.${enc(req.params.token)}&checked_in_at=is.null`, { checked_in_at: new Date().toISOString() });
  res.json(rows[0] || null);
}));

app.post("/api/checkins/token/:token/reset", eventRoute(async (req, res) => {
  if (!TOKEN_RE.test(req.params.token)) return res.json(null);
  const rows = await restSend("PATCH", `guest_checkins?token=eq.${enc(req.params.token)}`, { checked_in_at: null });
  res.json(rows[0] || null);
}));

// ---- Guest networking ----
const NET_PUBLIC_FIELDS = "id,invitation_slug,name,field,interests,linkedin,instagram,opted_in,approved,photo_url,created_at";

// A guest proves who they are with the secret they got when registering.
// Profiles made before secrets existed have none, and keep working by id.
async function netGuestAuthed(guestId, secret) {
  if (!guestId) return null;
  const rows = await restGet(`networking_guests?id=eq.${enc(guestId)}`);
  const g = rows[0];
  if (!g) return null;
  if (g.secret && !(secret && sameSecret(String(secret), g.secret))) return null;
  return g;
}
const netPublic = (g) => {
  if (!g) return g;
  const { secret, ...rest } = g;
  return rest;
};

app.post("/api/networking/guests", express.json({ limit: "16kb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || "");
  if (eventRateLimited(req, 10)) return res.status(429).json({ error: "Too many requests — please try again in a minute." });
  if (!SLUG_RE.test(slug) || !(await slugOwnerId(slug))) return res.status(404).json({ error: "Invitation not found." });
  const name = String(b.name || "").trim().slice(0, 100);
  if (!name) return res.status(400).json({ error: "Please enter your name." });
  const photoUrl = typeof b.photoUrl === "string" && b.photoUrl.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`) ? b.photoUrl.slice(0, 500) : null;
  const secret = randomBytes(18).toString("hex");
  const rows = await restSend("POST", "networking_guests", {
    invitation_slug: slug,
    name,
    field: String(b.field || "").trim().slice(0, 100) || null,
    interests: String(b.interests || "").trim().slice(0, 300) || null,
    linkedin: String(b.linkedin || "").trim().slice(0, 200) || null,
    instagram: String(b.instagram || "").trim().slice(0, 200) || null,
    opted_in: b.optedIn !== false,
    photo_url: photoUrl,
    approved: false,
    secret,
  });
  res.json({ ...netPublic(rows[0]), secret });
}));

// One guest's public profile: their own (with the secret), an approved
// guest's, or any for the invitation's owner.
app.get("/api/networking/guests/:id", eventRoute(async (req, res) => {
  const rows = await restGet(`networking_guests?id=eq.${enc(req.params.id)}`);
  const g = rows[0];
  if (!g) return res.json(null);
  const viewerId = String(req.query.viewer || "");
  const isSelf = !viewerId || viewerId === g.id
    ? !g.secret || (req.get("x-guest-secret") && sameSecret(String(req.get("x-guest-secret")), g.secret))
    : false;
  // Someone this guest is connected with (either direction) sees them too.
  let connected = false;
  if (!isSelf && viewerId && viewerId !== g.id) {
    const viewer = await netGuestAuthed(viewerId, req.get("x-guest-secret"));
    if (viewer) connected = (await restGet(`networking_connections?or=(and(from_guest_id.eq.${enc(viewer.id)},to_guest_id.eq.${enc(g.id)}),and(from_guest_id.eq.${enc(g.id)},to_guest_id.eq.${enc(viewer.id)}))&select=id&limit=1`)).length > 0;
  }
  if (!isSelf && !connected && !(g.approved && g.opted_in) && !(await ownsSlug(req, g.invitation_slug))) return res.json(null);
  if (!isSelf) {
    const { secret, ...shown } = g;
    return res.set("cache-control", "no-store").json(shown);
  }
  res.set("cache-control", "no-store").json(netPublic(g));
}));

app.get("/api/networking/directory", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  const me = await netGuestAuthed(String(req.query.guestId || ""), req.get("x-guest-secret"));
  if (!SLUG_RE.test(slug) || !me || me.invitation_slug !== slug) return deny(res);
  res.set("cache-control", "no-store").json((await restGet(`networking_guests?invitation_slug=eq.${enc(slug)}&opted_in=eq.true&approved=eq.true&id=neq.${enc(me.id)}&select=${NET_PUBLIC_FIELDS}&order=created_at.desc`)).map(netPublic));
}));

app.post("/api/networking/connections", express.json({ limit: "4kb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const me = await netGuestAuthed(String(b.fromGuestId || ""), req.get("x-guest-secret"));
  if (!me) return deny(res);
  const other = (await restGet(`networking_guests?id=eq.${enc(String(b.toGuestId || ""))}&select=id,invitation_slug,approved,opted_in`))[0];
  if (!other || other.invitation_slug !== me.invitation_slug || !other.approved || !other.opted_in || other.id === me.id) return deny(res);
  try {
    const rows = await restSend("POST", "networking_connections", { invitation_slug: me.invitation_slug, from_guest_id: me.id, to_guest_id: other.id, status: "pending" });
    res.json(rows[0] || {});
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: "You've already sent a request to this guest." });
    throw err;
  }
}));

app.get("/api/networking/connections", eventRoute(async (req, res) => {
  const me = await netGuestAuthed(String(req.query.guestId || ""), req.get("x-guest-secret"));
  if (!me) return deny(res);
  res.set("cache-control", "no-store").json(await restGet(`networking_connections?or=(from_guest_id.eq.${enc(me.id)},to_guest_id.eq.${enc(me.id)})&order=created_at.desc`));
}));

// Only the guest who received the request answers it.
app.patch("/api/networking/connections/:id", express.json({ limit: "2kb" }), eventRoute(async (req, res) => {
  const me = await netGuestAuthed(String(req.body?.guestId || ""), req.get("x-guest-secret"));
  const status = String(req.body?.status || "");
  if (!me || !["accepted", "declined", "pending"].includes(status)) return deny(res);
  const rows = await restSend("PATCH", `networking_connections?id=eq.${enc(req.params.id)}&to_guest_id=eq.${enc(me.id)}`, { status, responded_at: new Date().toISOString() });
  if (!rows.length) return deny(res);
  res.json(rows[0]);
}));

async function connectionFor(connectionId, guestId) {
  const c = (await restGet(`networking_connections?id=eq.${enc(connectionId)}`))[0];
  return c && (c.from_guest_id === guestId || c.to_guest_id === guestId) ? c : null;
}

app.post("/api/networking/messages", express.json({ limit: "8kb" }), eventRoute(async (req, res) => {
  const b = req.body || {};
  const me = await netGuestAuthed(String(b.senderId || ""), req.get("x-guest-secret"));
  const text = String(b.text || "").trim().slice(0, 1000);
  if (!me || !text || !(await connectionFor(String(b.connectionId || ""), me.id))) return deny(res);
  if (eventRateLimited(req, 60)) return res.status(429).json({ error: "Slow down a little — please try again in a minute." });
  const rows = await restSend("POST", "networking_messages", { connection_id: String(b.connectionId), sender_id: me.id, text });
  res.json(rows[0] || {});
}));

app.get("/api/networking/messages", eventRoute(async (req, res) => {
  const me = await netGuestAuthed(String(req.query.guestId || ""), req.get("x-guest-secret"));
  const connectionId = String(req.query.connectionId || "");
  if (!me || !(await connectionFor(connectionId, me.id))) return deny(res);
  res.set("cache-control", "no-store").json(await restGet(`networking_messages?connection_id=eq.${enc(connectionId)}&order=created_at.asc`));
}));

// The couple's own view: every registration (to approve) and connection.
app.get("/api/networking/owner", eventRoute(async (req, res) => {
  const slug = String(req.query.slug || "");
  if (!SLUG_RE.test(slug) || !(await ownsSlug(req, slug))) return deny(res);
  const [guests, connections] = await Promise.all([
    restGet(`networking_guests?invitation_slug=eq.${enc(slug)}&select=${NET_PUBLIC_FIELDS}&order=created_at.desc`),
    restGet(`networking_connections?invitation_slug=eq.${enc(slug)}&select=*,from_guest:from_guest_id(name),to_guest:to_guest_id(name)&order=created_at.desc`),
  ]);
  res.set("cache-control", "no-store").json({ guests: guests.map(netPublic), connections });
}));

app.post("/api/networking/guests/:id/approve", eventRoute(async (req, res) => {
  const g = (await restGet(`networking_guests?id=eq.${enc(req.params.id)}&select=id,invitation_slug`))[0];
  if (!g || !(await ownsSlug(req, g.invitation_slug))) return deny(res);
  const rows = await restSend("PATCH", `networking_guests?id=eq.${enc(g.id)}`, { approved: true });
  res.json(netPublic(rows[0]) || null);
}));

// ---------------------------------------------------------------------------
// Admin password: /admin (the owner's Builder and dashboards) asks for
// ADMIN_PASSWORD, set on the app in Dokploy, before the page is served.
// A correct password sets a signed, httpOnly cookie for 30 days; changing
// the password logs every browser out. Failed attempts are limited per IP.
// Without ADMIN_PASSWORD the admin stays open as before (with a warning in
// the log), so setting it up can't lock the owner out mid-deploy.
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_COOKIE = "admin_session";
const ADMIN_SESSION_MS = 30 * 24 * 3600 * 1000;
const ADMIN_MAX_FAILURES = 10;
const ADMIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const adminFailures = new Map(); // ip -> { count, since }

if (!ADMIN_PASSWORD) console.warn("admin: ADMIN_PASSWORD is not set, so /admin is open to anyone");

const adminSignature = (expires) => createHmac("sha256", ADMIN_PASSWORD).update(`einvite-admin:${expires}`).digest("hex");

function readCookie(req, name) {
  const found = String(req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

function hasAdminSession(req) {
  const [expires, sig] = readCookie(req, ADMIN_COOKIE).split(".");
  if (!expires || !sig || !(Number(expires) > Date.now())) return false;
  return sameSecret(sig, adminSignature(expires));
}

const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "";
const isHttps = (req) => req.secure || req.get("x-forwarded-proto") === "https";
// Only ever send someone back to a page inside /admin after logging in.
const safeAdminPath = (p) => (typeof p === "string" && /^\/admin(\/[^\s\\]*)?$/.test(p) && !p.startsWith("//") ? p : "/admin");

function adminLoginPage({ next = "/admin", error = "" } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin login · eInvite.me</title>
<style>
:root { --bg: #2B3830; --card: rgba(243,237,225,0.05); --text: #F3EDE1; --text2: #CFC3AC; --gold: #D4AB4E; --line: rgba(243,237,225,0.15); }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--bg); color: var(--text); font-family: "Inter", system-ui, -apple-system, sans-serif; }
form { width: 100%; max-width: 360px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 28px 24px; }
.logo { font-weight: 700; font-size: 22px; margin: 0 0 4px; }
.logo span { color: var(--gold); }
p { margin: 0 0 20px; color: var(--text2); font-size: 14px; }
label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; }
input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line); background: rgba(0,0,0,0.18); color: var(--text); font-size: 16px; outline: none; }
input:focus { border-color: var(--gold); }
button { width: 100%; margin-top: 16px; padding: 12px; border: 0; border-radius: 999px; background: var(--gold); color: #1F2A23; font-weight: 700; font-size: 15px; cursor: pointer; }
.error { margin: 12px 0 0; color: #E8A3A3; font-size: 13px; }
</style>
</head>
<body>
<form method="post" action="/admin/login">
  <div class="logo">e<span>Invite</span>.me</div>
  <p>Admin area. Enter the password to continue.</p>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
  <button type="submit">Log in</button>
</form>
</body>
</html>`;
}

const sendAdminLogin = (res, status, opts) => res.status(status).set({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).send(adminLoginPage(opts));

app.post("/admin/login", express.urlencoded({ extended: false, limit: "4kb" }), (req, res) => {
  const next = safeAdminPath(req.body?.next);
  if (!ADMIN_PASSWORD) return res.redirect(303, next);
  const ip = clientIp(req);
  const now = Date.now();
  const f = adminFailures.get(ip);
  if (f && now - f.since > ADMIN_FAILURE_WINDOW_MS) adminFailures.delete(ip);
  if ((adminFailures.get(ip)?.count || 0) >= ADMIN_MAX_FAILURES) {
    return sendAdminLogin(res, 429, { next, error: "Too many wrong attempts. Try again in 15 minutes." });
  }
  if (!sameSecret(String(req.body?.password || ""), ADMIN_PASSWORD)) {
    const cur = adminFailures.get(ip) || { count: 0, since: now };
    adminFailures.set(ip, { count: cur.count + 1, since: cur.since });
    console.warn(`admin: wrong password from ${ip}`);
    return sendAdminLogin(res, 401, { next, error: "Wrong password." });
  }
  adminFailures.delete(ip);
  const expires = String(now + ADMIN_SESSION_MS);
  res.cookie(ADMIN_COOKIE, `${expires}.${adminSignature(expires)}`, { httpOnly: true, sameSite: "lax", secure: isHttps(req), maxAge: ADMIN_SESSION_MS, path: "/" });
  res.redirect(303, next);
});

app.get("/admin/logout", (req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  res.redirect(303, "/admin");
});

app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
  if (!ADMIN_PASSWORD || hasAdminSession(req)) return next();
  sendAdminLogin(res, 401, { next: safeAdminPath(req.path) });
});

// ---------------------------------------------------------------------------
// Blog: the Markdown articles in blog/<lang>/ served as plain server-rendered
// HTML pages, so search engines get the full text, title and description
// without running the app's JavaScript:
//   /blog              -> redirects to the visitor's language (default English)
//   /blog/<lang>       -> that language's article list
//   /blog/<lang>/<slug> -> one article
// Articles are named "<order>-<slug>.md" and share the same slug in every
// language, which links the translations together (hreflang + the language
// switcher). Each starts with an HTML comment holding its SEO fields
// (title, description, keywords). Files are read once at start.
// ---------------------------------------------------------------------------

const BLOG_DIR = path.join(__dirname, "blog");
const SITE_URL = (process.env.SITE_URL || "https://einvite.me").replace(/\/+$/, "");
const BLOG_LANGS = ["en", "ar", "fr", "es", "hy"];
const BLOG_DEFAULT_LANG = "en";
let blogPosts = {}; // { [lang]: [post, ...] } in reading order

// The blog stays hidden until BLOG_PUBLIC=true is set on the app in Dokploy.
// Until then only someone with BLOG_PREVIEW_KEY can see it: opening
// /blog?preview=<key> once sets a cookie that shows the blog in that
// browser for 30 days. Hidden pages fall through to the normal site (so
// /blog just shows the home page), stay out of the sitemap, and previews
// are marked noindex so search engines never pick them up.
const BLOG_PUBLIC = /^(1|true|yes|on)$/i.test(process.env.BLOG_PUBLIC || "");
const BLOG_PREVIEW_KEY = process.env.BLOG_PREVIEW_KEY || "";
const BLOG_PREVIEW_COOKIE = "blog_preview";

function sameSecret(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function canSeeBlog(req, res) {
  if (BLOG_PUBLIC) return true;
  if (!BLOG_PREVIEW_KEY) return false;
  if (req.query.preview && sameSecret(req.query.preview, BLOG_PREVIEW_KEY)) {
    res.cookie(BLOG_PREVIEW_COOKIE, BLOG_PREVIEW_KEY, { httpOnly: true, sameSite: "lax", secure: req.secure || req.get("x-forwarded-proto") === "https", maxAge: 30 * 24 * 3600 * 1000, path: "/blog" });
    return true;
  }
  const cookie = String(req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${BLOG_PREVIEW_COOKIE}=`));
  return !!cookie && sameSecret(decodeURIComponent(cookie.slice(BLOG_PREVIEW_COOKIE.length + 1)), BLOG_PREVIEW_KEY);
}

const BLOG_UI = {
  en: {
    name: "English", locale: "en_US", dir: "ltr",
    blog: "Blog", designs: "Designs", start: "Create your invitation", home: "Home",
    indexTitle: "eInvite.me Blog: Digital Invitation Ideas and Event Planning Tips",
    indexDescription: "Ideas and practical tips for planning weddings and celebrations: designing digital invitations, managing guest RSVPs, the latest designs, and digital maps.",
    heading: "The eInvite.me Blog",
    lead: "Practical ideas and tips for planning weddings and celebrations, and for invitations worthy of your occasion.",
    readMore: "Read the article →", languages: "Languages",
    footer: "Digital invitation studio in Beirut, Lebanon",
  },
  ar: {
    name: "العربية", locale: "ar_AR", dir: "rtl",
    blog: "المدونة", designs: "التصاميم", start: "ابدأ دعوتك", home: "الرئيسية",
    indexTitle: "مدونة eInvite.me: أفكار ونصائح للدعوات الإلكترونية وتنظيم الحفلات",
    indexDescription: "نصائح وأفكار لتنظيم الأعراس والحفلات في لبنان والعالم العربي: تصميم الدعوات الإلكترونية، إدارة حضور الضيوف، أحدث التصاميم، والخرائط الرقمية.",
    heading: "مدونة eInvite.me",
    lead: "أفكار ونصائح عملية لتنظيم الأعراس والحفلات، ولدعوات إلكترونية تليق بمناسبتك.",
    readMore: "اقرأ المقال ←", languages: "اللغات",
    footer: "استوديو دعوات رقمية في بيروت، لبنان",
  },
  fr: {
    name: "Français", locale: "fr_FR", dir: "ltr",
    blog: "Blog", designs: "Modèles", start: "Créer votre invitation", home: "Accueil",
    indexTitle: "Le blog eInvite.me : idées de faire-part digitaux et conseils d'organisation",
    indexDescription: "Idées et conseils pratiques pour organiser mariages et fêtes : créer un faire-part digital, gérer les réponses des invités, les dernières tendances et les cartes numériques.",
    heading: "Le blog eInvite.me",
    lead: "Des idées et des conseils pratiques pour organiser vos mariages et vos fêtes, et pour des invitations à la hauteur de l'occasion.",
    readMore: "Lire l'article →", languages: "Langues",
    footer: "Studio d'invitations digitales à Beyrouth, Liban",
  },
  es: {
    name: "Español", locale: "es_ES", dir: "ltr",
    blog: "Blog", designs: "Diseños", start: "Crea tu invitación", home: "Inicio",
    indexTitle: "Blog de eInvite.me: ideas de invitaciones digitales y consejos para eventos",
    indexDescription: "Ideas y consejos prácticos para organizar bodas y celebraciones: diseñar invitaciones digitales, gestionar las confirmaciones, las últimas tendencias y los mapas digitales.",
    heading: "El blog de eInvite.me",
    lead: "Ideas y consejos prácticos para organizar bodas y celebraciones, y para invitaciones a la altura de tu ocasión.",
    readMore: "Leer el artículo →", languages: "Idiomas",
    footer: "Estudio de invitaciones digitales en Beirut, Líbano",
  },
  hy: {
    name: "Հայերեն", locale: "hy_AM", dir: "ltr",
    blog: "Բլոգ", designs: "Դիզայններ", start: "Ստեղծել հրավեր", home: "Գլխավոր",
    indexTitle: "eInvite.me բլոգ. թվային հրավերների գաղափարներ և տոների կազմակերպման խորհուրդներ",
    indexDescription: "Գաղափարներ և գործնական խորհուրդներ հարսանիքներ ու տոներ կազմակերպելու համար. թվային հրավերների ձևավորում, հյուրերի պատասխանների կառավարում, նորագույն դիզայններ և թվային քարտեզներ:",
    heading: "eInvite.me բլոգ",
    lead: "Գործնական գաղափարներ և խորհուրդներ հարսանիքներ ու տոներ կազմակերպելու և ձեր առիթին վայել հրավերների համար:",
    readMore: "Կարդալ հոդվածը →", languages: "Լեզուներ",
    footer: "Թվային հրավերների ստուդիա Բեյրութում, Լիբանան",
  },
};

const BLOG_FONTS = {
  ar: { href: "family=Cairo:wght@400;600;700", stack: '"Cairo", system-ui, sans-serif' },
  hy: { href: "family=Noto+Sans+Armenian:wght@400;600;700", stack: '"Noto Sans Armenian", system-ui, sans-serif' },
  latin: { href: "family=Inter:wght@400;600;700", stack: '"Inter", system-ui, sans-serif' },
};

function blogField(header, name) {
  const m = header.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : "";
}

function parseBlogPost(file, raw) {
  const header = (raw.match(/^\s*<!--([\s\S]*?)-->/) || [])[1] || "";
  const body = raw.replace(/^\s*<!--[\s\S]*?-->\s*/, "");
  const title = ((body.match(/^#\s+(.+)$/m) || [])[1] || "").trim();
  const slug = file.replace(/\.md$/, "").replace(/^\d+-/, "");
  const excerpt = ((body.match(/^>\s*(.+)$/m) || [])[1] || "")
    .replace(/^\*\*[^*]{1,30}\*\*\s*/, "") // the "In short:" label
    .replace(/\*\*/g, "")
    .trim();
  const html = marked
    .parse(body)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>")
    .replace(/<li><input [^>]*type="checkbox"[^>]*>/g, '<li class="check"><span class="box"></span>')
    .replace(/<p><strong>(?:👈|👉)\s*/g, '<p class="cta"><strong>');
  return {
    slug,
    title,
    seoTitle: blogField(header, "title") || title,
    description: blogField(header, "description") || excerpt,
    keywords: blogField(header, "keywords"),
    excerpt,
    html,
  };
}

async function loadBlogPosts() {
  const loaded = {};
  for (const lang of BLOG_LANGS) {
    try {
      const dir = path.join(BLOG_DIR, lang);
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
      loaded[lang] = await Promise.all(files.map(async (f) => parseBlogPost(f, await fs.readFile(path.join(dir, f), "utf8"))));
    } catch {
      loaded[lang] = [];
    }
  }
  blogPosts = loaded;
  console.log(`blog: ${BLOG_LANGS.map((l) => `${l} ${loaded[l].length}`).join(", ")} articles loaded (${BLOG_PUBLIC ? "public" : BLOG_PREVIEW_KEY ? "hidden, preview key set" : "hidden, no preview key"})`);
}
loadBlogPosts();

const blogUrl = (lang, slug) => `${SITE_URL}/blog/${lang}${slug ? `/${slug}` : ""}`;

// The visitor's preferred blog language from Accept-Language, else English.
function preferredBlogLang(req) {
  const header = String(req.headers["accept-language"] || "").toLowerCase();
  for (const part of header.split(",")) {
    const code = part.trim().slice(0, 2);
    if (BLOG_LANGS.includes(code) && blogPosts[code]?.length) return code;
  }
  return BLOG_DEFAULT_LANG;
}

const BLOG_CSS = `
:root { --bg: #2B3830; --card: rgba(243,237,225,0.045); --text: #F3EDE1; --text2: #CFC3AC; --gold: #D4AB4E; --line: rgba(243,237,225,0.13); }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.8; font-size: 17px; }
body[dir="rtl"] { line-height: 1.9; }
a { color: var(--gold); }
.wrap { max-width: 760px; margin: 0 auto; padding: 0 16px; }
header.site .wrap { max-width: 1080px; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; flex-wrap: wrap; padding-top: 8px; padding-bottom: 8px; }
header.site { border-bottom: 1px solid var(--line); }
.logo { color: var(--text); text-decoration: none; font-weight: 700; font-size: 20px; direction: ltr; font-family: "Inter", system-ui, sans-serif; }
.logo span { color: var(--gold); }
nav.site { display: flex; align-items: center; gap: 16px; font-size: 15px; flex-wrap: wrap; }
nav.site a { color: var(--text2); text-decoration: none; }
nav.site a.start { background: var(--gold); color: #1F2A23; padding: 7px 16px; border-radius: 999px; font-weight: 700; }
.langs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 22px; font-size: 13px; }
.langs a, .langs span { padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--text2); text-decoration: none; }
.langs span { border-color: var(--gold); color: var(--gold); }
main { padding: 32px 0 64px; }
.crumbs { font-size: 14px; color: var(--text2); margin-bottom: 12px; }
.crumbs a { color: var(--text2); }
h1 { font-size: clamp(28px, 5vw, 40px); line-height: 1.35; margin: 0 0 20px; }
h2 { font-size: clamp(22px, 3.6vw, 28px); line-height: 1.4; margin: 44px 0 12px; color: var(--gold); }
h3 { font-size: 20px; margin: 30px 0 8px; }
article p, article li { color: #EAE3D6; }
hr { border: 0; border-top: 1px solid var(--line); margin: 36px 0; }
blockquote { margin: 22px 0; padding: 14px 18px; background: var(--card); border-inline-start: 3px solid var(--gold); border-radius: 10px; }
blockquote p { margin: 0; }
ul, ol { padding-inline-start: 22px; }
li { margin: 6px 0; }
li.check { list-style: none; margin-inline-start: -22px; display: flex; gap: 10px; align-items: baseline; }
li.check .box { flex: none; width: 15px; height: 15px; border: 1.5px solid var(--gold); border-radius: 4px; transform: translateY(2px); }
.table-wrap { overflow-x: auto; margin: 20px 0; border: 1px solid var(--line); border-radius: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 15px; }
th, td { padding: 10px 14px; text-align: start; border-bottom: 1px solid var(--line); vertical-align: top; }
th { background: var(--card); color: var(--gold); font-weight: 700; }
tr:last-child td { border-bottom: 0; }
p.cta { margin-top: 28px; text-align: center; }
p.cta a { display: inline-block; background: var(--gold); color: #1F2A23; text-decoration: none; padding: 12px 26px; border-radius: 999px; font-weight: 700; }
.posts { display: grid; gap: 18px; grid-template-columns: 1fr; margin-top: 28px; }
@media (min-width: 760px) { .posts { grid-template-columns: 1fr 1fr; } }
.post-card { display: block; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 22px; text-decoration: none; color: var(--text); }
.post-card:hover { border-color: rgba(212,171,78,0.55); }
.post-card h2 { font-size: 20px; margin: 0 0 8px; color: var(--text); }
.post-card p { margin: 0 0 12px; color: var(--text2); font-size: 15px; line-height: 1.7; }
.post-card .more { color: var(--gold); font-size: 15px; font-weight: 700; }
.lead { color: var(--text2); margin: 0; }
footer.site { border-top: 1px solid var(--line); padding: 24px 0 36px; font-size: 14px; color: var(--text2); }
footer.site a { color: var(--text2); }
`;

// alternates: { [lang]: absolute url } for the same page in every language it exists in.
function blogPage({ lang, title, description, keywords, canonical, alternates, type = "website", jsonLd, body }) {
  const ui = BLOG_UI[lang];
  const font = BLOG_FONTS[lang] || BLOG_FONTS.latin;
  const hreflang = Object.entries(alternates)
    .map(([l, href]) => `<link rel="alternate" hreflang="${l}" href="${escapeHtml(href)}">`)
    .concat(alternates[BLOG_DEFAULT_LANG] ? [`<link rel="alternate" hreflang="x-default" href="${escapeHtml(alternates[BLOG_DEFAULT_LANG])}">`] : [])
    .join("\n");
  const langLinks = BLOG_LANGS.filter((l) => alternates[l])
    .map((l) => (l === lang ? `<span>${BLOG_UI[l].name}</span>` : `<a href="${escapeHtml(alternates[l].replace(SITE_URL, ""))}" hreflang="${l}" lang="${l}">${BLOG_UI[l].name}</a>`))
    .join("");
  return `<!doctype html>
<html lang="${lang}" dir="${ui.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${BLOG_PUBLIC ? "" : '<meta name="robots" content="noindex, nofollow">'}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ""}
<link rel="canonical" href="${escapeHtml(canonical)}">
${hreflang}
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="eInvite.me">
<meta property="og:locale" content="${ui.locale}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${font.href}${font === BLOG_FONTS.latin ? "" : `&${BLOG_FONTS.latin.href}`}&display=swap" rel="stylesheet">
<style>:root { --font: ${font.stack}; }${BLOG_CSS}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body dir="${ui.dir}">
<header class="site"><div class="wrap">
  <a class="logo" href="/">e<span>Invite</span>.me</a>
  <nav class="site"><a href="/blog/${lang}">${ui.blog}</a><a href="/shop">${ui.designs}</a><a class="start" href="/">${ui.start}</a></nav>
</div></header>
<main><div class="wrap">
<nav class="langs" aria-label="${escapeHtml(ui.languages)}">${langLinks}</nav>
${body}
</div></main>
<footer class="site"><div class="wrap">© ${new Date().getFullYear()} <a href="/">eInvite.me</a> · ${ui.footer}</div></footer>
</body>
</html>`;
}

const sendBlogHtml = (res, html) => res.set({ "content-type": "text/html; charset=utf-8", "cache-control": BLOG_PUBLIC ? "public, max-age=300" : "private, no-store" }).send(html);

// Lets the home page show its Blog link only once the blog is public.
app.get("/api/blog/status", (_req, res) => res.set("cache-control", "no-store").json({ public: BLOG_PUBLIC }));

app.get(/^\/blog\/?$/, (req, res, next) => {
  if (!canSeeBlog(req, res)) return next();
  res.set("vary", "Accept-Language").redirect(302, `/blog/${preferredBlogLang(req)}`);
});

app.get(/^\/blog\/([a-z]{2})\/?$/, (req, res, next) => {
  const lang = req.params[0];
  if (!BLOG_LANGS.includes(lang) || !canSeeBlog(req, res)) return next();
  const ui = BLOG_UI[lang];
  const posts = blogPosts[lang] || [];
  const alternates = Object.fromEntries(BLOG_LANGS.filter((l) => blogPosts[l]?.length).map((l) => [l, blogUrl(l)]));
  const cards = posts.map((p) => `<a class="post-card" href="/blog/${lang}/${encodeURIComponent(p.slug)}">
  <h2>${escapeHtml(p.title)}</h2>
  <p>${escapeHtml(p.excerpt)}</p>
  <span class="more">${ui.readMore}</span>
</a>`).join("\n");
  sendBlogHtml(res, blogPage({
    lang,
    title: ui.indexTitle,
    description: ui.indexDescription,
    canonical: blogUrl(lang),
    alternates,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: ui.heading,
      url: blogUrl(lang),
      inLanguage: lang,
      blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: blogUrl(lang, p.slug) })),
    },
    body: `<h1>${escapeHtml(ui.heading)}</h1>
<p class="lead">${escapeHtml(ui.lead)}</p>
<div class="posts">${cards}</div>`,
  }));
});

app.get(/^\/blog\/([a-z]{2})\/([^/]+)\/?$/, (req, res, next) => {
  const lang = req.params[0];
  const slug = decodeURIComponent(req.params[1]);
  const post = BLOG_LANGS.includes(lang) && blogPosts[lang]?.find((p) => p.slug === slug);
  if (!post || !canSeeBlog(req, res)) return next();
  const ui = BLOG_UI[lang];
  const url = blogUrl(lang, post.slug);
  const alternates = Object.fromEntries(BLOG_LANGS.filter((l) => blogPosts[l]?.some((p) => p.slug === slug)).map((l) => [l, blogUrl(l, slug)]));
  sendBlogHtml(res, blogPage({
    lang,
    title: post.seoTitle,
    description: post.description,
    keywords: post.keywords,
    canonical: url,
    alternates,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      inLanguage: lang,
      url,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "eInvite.me", url: SITE_URL },
      publisher: { "@type": "Organization", name: "eInvite.me", url: SITE_URL },
    },
    body: `<div class="crumbs"><a href="/">${ui.home}</a> / <a href="/blog/${lang}">${ui.blog}</a></div>
<article>${post.html}</article>`,
  }));
});

// The first version of the blog was Arabic only, at /blog/<slug>.
app.get(/^\/blog\/([^/]+)\/?$/, (req, res, next) => {
  const slug = decodeURIComponent(req.params[0]);
  if (!blogPosts.ar?.some((p) => p.slug === slug) || !canSeeBlog(req, res)) return next();
  res.redirect(301, `/blog/ar/${slug}`);
});

// Search engines: the public pages and articles go in the sitemap; the
// admin area and personal invitation/DJ links stay out of search results.
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /e/\nDisallow: /dj/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (_req, res) => {
  const blogUrls = BLOG_PUBLIC ? BLOG_LANGS.flatMap((l) => (blogPosts[l]?.length ? [`/blog/${l}`, ...blogPosts[l].map((p) => `/blog/${l}/${p.slug}`)] : [])) : [];
  const urls = ["/", "/shop", "/cost-calculator", ...["wedding", "birthday", "quinceanera", "baptism", "baby-shower", "party"].map((o) => `/${o}-cost-calculator`), ...blogUrls];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeHtml(SITE_URL + (u === "/" ? "/" : u))}</loc></url>`).join("\n")}
</urlset>
`);
});

// Hashed build assets can be cached forever; index.html must always revalidate.
// The app's service worker and manifest must never be cached, or phones
// keep running an old version after a Redeploy.
app.get(["/sw.js", "/manifest.webmanifest"], (req, res) => {
  res.set("cache-control", "no-cache");
  if (req.path === "/sw.js") res.set("service-worker-allowed", "/");
  res.sendFile(path.join(DIST_DIR, req.path.slice(1)));
});
// ---------------------------------------------------------------------------
// ChatGPT plugin (MCP server at /mcp, sign-in at /oauth/*). Off unless
// MCP_ENABLED=1 and MCP_PUBLIC_URL (e.g. https://cores.einvite.me) are set,
// so turning it on is a deliberate settings change. See mcp/README.md.
// ---------------------------------------------------------------------------
const MCP_PUBLIC_URL = String(process.env.MCP_PUBLIC_URL || "").trim().replace(/\/+$/, "");
const MCP_SECRET = process.env.MCP_TOKEN_SECRET || (SUPABASE_SERVICE_KEY ? createHmac("sha256", SUPABASE_SERVICE_KEY).update("einvite-mcp-tokens").digest() : "");
// Domain check for the plugin directory submission: the token OpenAI's
// portal shows, served as-is.
app.get("/.well-known/openai-apps-challenge", (_req, res) => {
  const token = String(process.env.OPENAI_APPS_CHALLENGE_TOKEN || "").trim();
  if (!token) return res.status(404).type("text/plain").send("not set");
  res.set("cache-control", "no-store").type("text/plain").send(token);
});
if (process.env.MCP_ENABLED === "1") {
  if (!/^https?:\/\/[^/]+$/.test(MCP_PUBLIC_URL) || !MCP_SECRET || !serviceHeaders) {
    console.error("chatgpt plugin: not started — needs MCP_PUBLIC_URL (like https://cores.einvite.me) and the Supabase service key");
  } else {
    // A plugin user: an active client account (not a designer account).
    const userAllowed = (u) => (!u ? "Account not found." : u.role === "designer" ? "Designer accounts can't use the ChatGPT plugin." : u.status !== "active" ? (u.status === "pending" ? "This account is still waiting for approval." : "This account is frozen. Contact eInvite.me for help.") : true);
    let usersCache = { at: 0, users: [] };
    const findUser = async (id) => {
      if (Date.now() - usersCache.at > 10000) usersCache = { at: Date.now(), users: await readDraftUsers() };
      return usersCache.users.find((u) => u?.id === id) || null;
    };
    const readUsersDraft = async () => {
      const raw = await kvRead(DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : {};
      return { draft, users: Array.isArray(draft.users) ? draft.users : [] };
    };
    const writeUsersDraft = async (draft) => {
      await kvWrite(DRAFT_KEY, JSON.stringify(draft));
      draftUsersCache = { at: 0, users: [] };
      usersCache = { at: 0, users: [] };
    };
    const oauth = createOAuth({
      baseUrl: MCP_PUBLIC_URL,
      secret: MCP_SECRET,
      extraRedirects: String(process.env.MCP_EXTRA_REDIRECT_URIS || "").split(",").map((x) => x.trim()).filter(Boolean),
      cimdHosts: String(process.env.MCP_CIMD_HOSTS || "chatgpt.com,openai.com").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      checkPassword: (email, password) => (authReady ? checkClientPassword(email, password) : null),
      sessionUserId: (req) => clientSessionUser(req),
      findUser, userAllowed, loginBlocked, noteLoginFailure, clientIp, kvRead, kvWrite, escapeHtml,
    });
    app.use(oauth.router);
    app.use(createMcpHandler({
      siteUrl: MCP_PUBLIC_URL,
      verifyAccessToken: oauth.verifyAccessToken,
      wwwAuthenticate: oauth.wwwAuthenticate,
      findUser, userAllowed, readUsersDraft, writeUsersDraft, kvRead, kvWrite, uniqueSlug,
    }));
    console.log(`chatgpt plugin: MCP server on ${MCP_PUBLIC_URL}/mcp`);
  }
}

// ---------------------------------------------------------------------------
// AI Bridal Studio (virtual dress try-on with fal.ai). Off unless
// BRIDAL_STUDIO_ENABLED=1; needs FAL_KEY, which only bridal/fal.js reads.
// See bridal/README.md.
// ---------------------------------------------------------------------------
const BRIDAL_BUCKET = "bridal-studio";
if (process.env.BRIDAL_STUDIO_ENABLED === "1") {
  if (!serviceHeaders || !gatewayEnforced()) {
    console.error("bridal studio: not started — needs the Supabase service key and ADMIN_PASSWORD");
  } else {
    // Previews live in a private bucket that only this server can read.
    const storageUrl = (p) => `${SUPABASE_URL}/storage/v1/object/${BRIDAL_BUCKET}/${p.split("/").map(encodeURIComponent).join("/")}`;
    const bridalStorage = {
      async put(p, buf, type) {
        const r = await fetch(storageUrl(p), { method: "POST", headers: { ...serviceHeaders, "Content-Type": type, "x-upsert": "true" }, body: buf });
        if (!r.ok) throw new Error(`bridal storage put failed (${r.status})`);
      },
      async get(p) {
        const r = await fetch(storageUrl(p), { headers: serviceHeaders });
        if (!r.ok) throw new Error(`bridal storage get failed (${r.status})`);
        return Buffer.from(await r.arrayBuffer());
      },
      async remove(p) {
        const r = await fetch(storageUrl(p), { method: "DELETE", headers: serviceHeaders });
        if (!r.ok && r.status !== 404) throw new Error(`bridal storage delete failed (${r.status})`);
      },
    };
    fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method: "POST", headers: { ...serviceHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ id: BRIDAL_BUCKET, name: BRIDAL_BUCKET, public: false, file_size_limit: 26214400, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] }) })
      .then(async (r) => { if (!r.ok && !/exist|duplicate/i.test(await r.text().catch(() => ""))) console.error(`bridal studio: couldn't create the private bucket (${r.status})`); })
      .catch((e) => console.error("bridal studio: bucket check failed:", e.message));
    let bridalUsersCache = { at: 0, users: [] };
    const bridal = createBridalStudio({
      requestRole,
      findUser: async (id) => {
        if (Date.now() - bridalUsersCache.at > 15000) bridalUsersCache = { at: Date.now(), users: await readDraftUsers() };
        return bridalUsersCache.users.find((u) => u?.id === id) || null;
      },
      kvRead, kvWrite,
      kvListKeys: async (prefix) => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?select=key&key=like.${encodeURIComponent(`${prefix}*`)}`, { headers: serviceHeaders });
        if (!r.ok) throw new Error(`kv list failed (${r.status})`);
        return (await r.json()).map((x) => x.key);
      },
      storage: bridalStorage,
      uploadPublicImage: (name, type, buf) => uploadToStorage("invitation-photos", name, type, buf),
      // Catalog photos uploaded to this site's own public storage.
      readOwnImage: async (url) => {
        const prefix = `${SUPABASE_URL}/storage/v1/object/public/`;
        if (!String(url).startsWith(prefix) || url.includes("..")) return null;
        const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) return null;
        const body = Buffer.from(await r.arrayBuffer());
        const type = imageType(body);
        return type && body.length <= 12 * 1024 * 1024 ? { body, type } : null;
      },
      secret: createHmac("sha256", SUPABASE_SERVICE_KEY).update("einvite-bridal").digest(),
      ownImagePrefix: `${SUPABASE_URL}/storage/v1/object/public/`,
    });
    app.use(bridal.router);
    setTimeout(() => bridal.sweepExpired().catch((e) => console.error("bridal studio: sweep failed:", e.message)), 60000);
    console.log("bridal studio: on");
  }
}

app.use(express.static(DIST_DIR, { index: false, maxAge: "1y", immutable: true }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`einvite.me server listening on port ${PORT}`);
});
