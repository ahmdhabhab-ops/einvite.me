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

app.get("/api/auth/status", (_req, res) => res.set("cache-control", "no-store").json({ ready: authReady }));

app.post("/api/auth/login", express.json({ limit: "4kb" }), async (req, res) => {
  if (!authReady) return res.status(503).json({ error: "Login isn't available right now — please try again in a minute." });
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const limitKeys = [`ip:${clientIp(req)}`, `email:${email}`];
  if (loginBlocked(limitKeys)) return res.status(429).json({ error: "Too many wrong attempts. Please try again in 15 minutes." });
  try {
    const user = email && password ? (await readDraftUsers()).find((u) => String(u?.email || "").toLowerCase() === email) : null;
    let ok = false;
    if (user) {
      let hash = await getAccountHash(user.id);
      if (!hash && isLegacyPassword(user.password)) {
        await migrateLegacyPasswords();
        hash = await getAccountHash(user.id);
      }
      ok = !!hash && (await verifyPassword(password, hash));
    }
    if (!ok) {
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
// Keys a logged-in client's Builder saves besides their own invitation.
const CLIENT_WRITABLE = (key) => /^einvite:(bg-|introbg-)/.test(key) || key === "einvite:og-image" || key === "einvite:music-audio";

app.get("/api/kv", async (req, res) => {
  const key = String(req.query.key || "");
  if (!KV_KEY_RE.test(key)) return res.status(400).json({ error: "bad key" });
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const who = requestRole(req);
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

app.put("/api/kv", express.json({ limit: "25mb" }), async (req, res) => {
  const key = String(req.body?.key || "");
  const value = req.body?.value;
  if (!KV_KEY_RE.test(key) || typeof value !== "string") return res.status(400).json({ error: "bad request" });
  if (!authReady) return res.status(503).json({ error: "not ready" });
  const who = requestRole(req);
  try {
    if (who.role === "admin") {
      await kvWrite(key, value);
    } else if (who.role === "client" && key === `einvite:invitation-${who.userId}`) {
      await kvWrite(key, value);
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
      const kept = Object.fromEntries(["introMediaLibrary", "siteDomain", "activeInvitationId"].filter((k) => k in current).map((k) => [k, current[k]]));
      await kvWrite(DRAFT_KEY, JSON.stringify({ ...incoming, ...kept, users, invitationIds }));
      draftUsersCache = { at: 0, users: [] };
    } else if (who.role === "client" && CLIENT_WRITABLE(key)) {
      await kvWrite(key, value);
    } else {
      return res.status(who.role === "anon" ? 401 : 403).json({ error: "not allowed" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("kv put failed:", key, err.message);
    res.status(502).json({ error: "save failed" });
  }
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
    for (const row of await r.json()) statuses[row.from_number] = row.message_type; // latest wins
    res.set("cache-control", "no-store").json({ statuses });
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
  const additionalGuests = Math.max(0, Math.min(50, Number(b.additionalGuests) || 0));
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(ownerId) || !RSVP_STATUSES.includes(status)) return res.status(400).json({ error: "bad request" });
  const key = `einvite:invitation-${ownerId}`;
  const genId = () => randomUUID().replace(/-/g, "").slice(0, 8);
  try {
    const raw = await kvRead(key);
    if (!raw) return res.status(404).json({ error: "Invitation not found." });
    const latest = JSON.parse(raw);
    const groups = Array.isArray(latest.guestGroups) ? latest.guestGroups : [];
    const members = names.length ? names.map((name) => ({ id: genId(), name, status })) : [{ id: genId(), name: "Guest", status }];
    let group;
    if (b.quick) {
      group = { id: genId(), lastName: "", members, additionalGuests: 0, table: "", phone: "", invitationSent: false, invitationViewed: true, updatedAt: now };
      latest.guestGroups = [group, ...groups];
    } else {
      const existing = b.groupId ? groups.find((g) => g.id === String(b.groupId)) : null;
      if (existing) {
        group = { ...existing, members: names.length ? members : existing.members, additionalGuests: status === "yes" ? additionalGuests : 0, invitationViewed: true, updatedAt: now };
        latest.guestGroups = groups.map((g) => (g.id === existing.id ? group : g));
      } else {
        group = { id: genId(), lastName: "", members, additionalGuests: status === "yes" ? additionalGuests : 0, table: "", phone: "", tableId: null, invitationSent: false, invitationViewed: true, inviteBatchId: b.batchId ? String(b.batchId).slice(0, 64) : null, updatedAt: now };
        latest.guestGroups = [group, ...groups];
      }
    }
    await kvWrite(key, JSON.stringify(latest));
    res.json({ group });
  } catch (err) {
    console.error("guest rsvp failed:", err.message);
    res.status(502).json({ error: "Couldn't save your response — please try again." });
  }
});

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
  const urls = ["/", "/shop", ...blogUrls];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeHtml(SITE_URL + (u === "/" ? "/" : u))}</loc></url>`).join("\n")}
</urlset>
`);
});

// Hashed build assets can be cached forever; index.html must always revalidate.
app.use(express.static(DIST_DIR, { index: false, maxAge: "1y", immutable: true }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`einvite.me server listening on port ${PORT}`);
});
