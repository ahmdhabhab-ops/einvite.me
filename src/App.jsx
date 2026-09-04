import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart, Users, Clock, MapPin, CalendarClock, ChevronUp, ChevronDown,
  Plus, Trash2, Upload, Navigation2,
  Church, Wine, UtensilsCrossed, PartyPopper, Sparkles, Check, X, Music2, Star,
  Settings, BarChart3, Copy, Link2, ImagePlus, Search, CheckCircle2, XCircle, Move, Mail, Film,
  ChevronsUp, Volume2, VolumeX, Share2, Disc3, Headphones, Feather, MessageCircle,
  FilePlus2, Lock, Unlock, ShieldCheck, LogOut, UserPlus, LogIn, Eye, EyeOff, ArrowLeft,
  ThumbsUp, ThumbsDown, CalendarDays, Pencil, Gift, ExternalLink, Handshake, Video, AlertTriangle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/* Tokens                                                                  */
/* ---------------------------------------------------------------------- */

const INK = "#161F1B";
const INK_2 = "#1E2B25";
const INK_3 = "#28382F";
const GOLD = "#C9A44C";
const GOLD_SOFT = "#E4CE95";
const IVORY = "#F4EDE4";
const MUTED = "#93A69B";
const PAPER = "#FBF1E7";
const PAPER_2 = "#F1E2D2";
const EMERALD = "#24463D";
const ROSE = "#B76E6E";

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_SCRIPT = "'Parisienne', cursive";
const FONT_AR = "'Cairo', sans-serif";

const CHART_COLORS = { yes: "#8FBFA3", no: "#D98E8E", pending: "#6C7C74" };

const BG_PRESETS = {
  botanical: { name: "Botanical", css: "linear-gradient(160deg, #1f3a2e 0%, #24463d 45%, #16211d 100%)" },
  blush: { name: "Blush", css: "linear-gradient(160deg, #7a4a52 0%, #b76e6e 55%, #e4cd9a 100%)" },
  dusk: { name: "Dusk", css: "linear-gradient(160deg, #2b1f3a 0%, #4a2f4d 50%, #b76e6e 100%)" },
  gilded: { name: "Gilded", css: "linear-gradient(160deg, #3a2f14 0%, #8a6a2c 50%, #e4ce95 100%)" },
};

const TIMELINE_ICONS = {
  church: { icon: Church }, wine: { icon: Wine }, utensils: { icon: UtensilsCrossed },
  party: { icon: PartyPopper }, heart: { icon: Heart }, sparkles: { icon: Sparkles },
};

const GATE_ICONS = { heart: Heart, mail: Mail, sparkles: Sparkles, star: Star };
const MUSIC_ICONS = {
  speaker: { name: "Speaker", playing: Volume2, muted: VolumeX },
  note: { name: "Music note", playing: Music2, muted: Music2 },
  disc: { name: "Vinyl disc", playing: Disc3, muted: Disc3 },
  headphones: { name: "Headphones", playing: Headphones, muted: Headphones },
};

const GATE_ANIMATIONS = {
  floatingHearts: { name: "Floating hearts", icon: Heart, colors: [GOLD_SOFT, PAPER, "#E8A9A9"] },
  confetti: { name: "Confetti", icon: Sparkles, colors: [GOLD, ROSE, PAPER] },
  petals: { name: "Falling petals", icon: PartyPopper, colors: ["#E8B4B4", GOLD_SOFT, PAPER] },
  sparkleDrift: { name: "Sparkle drift", icon: Star, colors: [GOLD_SOFT, PAPER, GOLD] },
};

const ENVELOPE_STYLES = {
  kraftGold: {
    name: "Golden Kraft",
    swatch: "linear-gradient(135deg, #9C7A4A 0%, #6E5530 100%)",
    envelopeBg: "linear-gradient(160deg, #9C7A4A 0%, #8B6B3E 42%, #6E5530 100%)",
    texture: "crosshatch",
    flapBg: "linear-gradient(135deg, #2E2712 0%, #14120A 100%)",
    flapStyle: "thick",
    waxOuter: "radial-gradient(circle at 34% 28%, #F3D793 0%, #C9A44C 45%, #83621F 100%)",
    waxInner: "radial-gradient(circle at 38% 32%, #E9C77E 0%, #B8923F 60%, #6E5322 100%)",
    engrave: Feather, engraveColor: "#5B441C",
  },
  velvetBurgundy: {
    name: "Burgundy Velvet",
    swatch: "linear-gradient(135deg, #A6134A 0%, #4A0824 100%)",
    envelopeBg: "radial-gradient(120% 80% at 20% 8%, rgba(255,255,255,0.06), transparent 42%), radial-gradient(100% 70% at 82% 92%, rgba(0,0,0,0.3), transparent 52%), linear-gradient(160deg, #8C1042 0%, #6B0C33 50%, #4A0824 100%)",
    texture: "velvet",
    flapBg: null,
    flapStyle: "seam",
    waxOuter: "radial-gradient(circle at 34% 28%, #F3D793 0%, #C9A44C 45%, #83621F 100%)",
    waxInner: "radial-gradient(circle at 38% 32%, #E9C77E 0%, #B8923F 60%, #6E5322 100%)",
    engrave: null, engraveColor: "#5B441C",
  },
  kraftRed: {
    name: "Ruby Kraft",
    swatch: "linear-gradient(135deg, #A83B32 0%, #4A140F 100%)",
    envelopeBg: "linear-gradient(160deg, #A8483E 0%, #8F332B 42%, #6B221C 100%)",
    texture: "crosshatch",
    flapBg: "linear-gradient(135deg, #3A130E 0%, #180705 100%)",
    flapStyle: "thick",
    waxOuter: "radial-gradient(circle at 34% 28%, #F3D793 0%, #C9A44C 45%, #83621F 100%)",
    waxInner: "radial-gradient(circle at 38% 32%, #E9C77E 0%, #B8923F 60%, #6E5322 100%)",
    engrave: Feather, engraveColor: "#5B441C",
  },
};

const emptyIntroMedia = () => ({ en: null, ar: null, fr: null, es: null }); // each entry: { type: 'image'|'video', url, name }

const defaultIntroSettings = {
  type: "button",
  icon: "heart",
  animationStyle: "floatingHearts",
  sealDesign: "gold",
  media: emptyIntroMedia(),
};

const FONT_OPTIONS = [
  { key: "auto", label: "Default", value: null },
  { key: "display", label: "Fraunces", value: "'Fraunces', serif" },
  { key: "playfair", label: "Playfair Display", value: "'Playfair Display', serif" },
  { key: "cormorant", label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { key: "marcellus", label: "Marcellus", value: "'Marcellus', serif" },
  { key: "script", label: "Parisienne", value: "'Parisienne', cursive" },
  { key: "greatvibes", label: "Great Vibes", value: "'Great Vibes', cursive" },
  { key: "dancing", label: "Dancing Script", value: "'Dancing Script', cursive" },
  { key: "body", label: "Inter", value: "'Inter', sans-serif" },
  { key: "montserrat", label: "Montserrat", value: "'Montserrat', sans-serif" },
  { key: "arabic", label: "Cairo (Arabic)", value: "'Cairo', sans-serif" },
];
const fontValue = (key) => FONT_OPTIONS.find((f) => f.key === key)?.value || null;

// Custom image size/position are stored as percentages of the frame's own
// content area (not fixed pixels) — so sizing stays correct no matter how
// large the phone frame actually renders (it's fluid now, capped at 292px
// wide but shrinks on narrow screens). 100% = full frame width.
const PHONE_IMAGE_MAX_HEIGHT_PCT = 73; // ~440/600 of the frame's height, as before
const clampXForImageWidth = (x, widthPercent) => {
  const halfWidthPct = Math.min(50, widthPercent / 2);
  return Math.min(100 - halfWidthPct, Math.max(halfWidthPct, x));
};

const emptyCustomBlocks = () => ({ cover: [], family: [], timeline: [], locations: [], countdown: [], rsvp: [], registry: [], djRequests: [], networking: [], livestream: [] });

// display:none breaks programmatic .click() on file inputs in iOS Safari, so hide them
// visually instead — this keeps the input "present" enough for the OS picker to open.
const VISUALLY_HIDDEN = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 };


const ALL_STEPS = [
  { key: "cover", label: "Cover & Intro", icon: Heart },
  { key: "family", label: "Family & Details", icon: Users },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "locations", label: "The Celebration", icon: MapPin },
  { key: "countdown", label: "Countdown", icon: CalendarClock },
  { key: "rsvp", label: "RSVP", icon: CheckCircle2 },
  { key: "registry", label: "Gift Registry", icon: Gift },
  { key: "djRequests", label: "DJ Requests", icon: Music2 },
  { key: "networking", label: "Guest Networking", icon: Handshake },
  { key: "livestream", label: "Live Stream", icon: Video },
];
const REQUIRED_STEP_KEY = "cover"; // always shown — an invitation needs at least a cover

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * window.storage only exists inside Claude.ai's own artifact preview — it's
 * not a standard browser API, so on a real deployment (Vercel, Netlify,
 * GitHub Pages, your own domain) it simply doesn't exist, and every save/
 * load call would silently do nothing. This wrapper tries window.storage
 * first (so behavior inside Claude.ai is unchanged), and falls back to real
 * browser localStorage otherwise — which DOES work on any real domain,
 * giving genuine persistence for that browser/device once deployed.
 * Note: like window.storage, localStorage is per-browser/per-device, not
 * shared across different people's devices — that still needs a real
 * backend + database, same as the DJ/Networking projects.
 */
// Fill in your own Supabase project's values here to make saves go to a real
// shared cloud database instead of this browser's local storage — that's
// what actually makes data visible across different devices/guests. Get
// these from your Supabase project: Settings → API. The anon key is
// DESIGNED to be public (safe to put directly in client-side code like
// this) — real protection comes from the RLS policies on the table itself,
// not from hiding this key. See sql/kv_store.sql for the table this expects.
const SUPABASE_URL = "https://tahbjwbmigoodfrfjpri.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85PWR75Vq5WcSWvgos6pmg_4JwG0_iM";
const supabaseConfigured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// Talks to Supabase's auto-generated REST API (PostgREST) directly via
// fetch() — deliberately not using the @supabase/supabase-js package, since
// that's not among the libraries available inside this artifact environment.
// A plain key/value table (see sql/kv_store.sql) is enough here: it mirrors
// exactly the get(key)/set(key,value) shape this app already calls
// everywhere, so nothing else in the app needs to change to benefit from
// this — every existing call site (saveDraft, the load effect, per-client
// invitation keys) keeps working completely unchanged.
const persistentStorage = {
  async get(key) {
    if (supabaseConfigured) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=value`, { headers: supabaseHeaders });
        if (!res.ok) {
          console.error(`Supabase GET failed for key "${key}": ${res.status} ${res.statusText}`, await res.text().catch(() => ""));
          return null;
        }
        const rows = await res.json();
        return rows[0] ? { key, value: rows[0].value, shared: false } : null;
      } catch (err) {
        console.error(`Supabase GET threw for key "${key}":`, err);
        return null; // network error, Supabase down, CORS misconfigured, etc.
      }
    }
    if (typeof window === "undefined") return null;
    if (window.storage) {
      try { return await window.storage.get(key, false); } catch { return null; } // was calling itself before — infinite recursion whenever window.storage existed
    }
    try {
      const raw = window.localStorage?.getItem(key);
      return raw !== null && raw !== undefined ? { key, value: raw, shared: false } : null;
    } catch {
      return null; // localStorage can throw in private-browsing/blocked-storage contexts
    }
  },
  async set(key, value) {
    if (supabaseConfigured) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store`, {
          method: "POST",
          headers: { ...supabaseHeaders, Prefer: "resolution=merge-duplicates" }, // upsert on the primary key
          body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
        });
        if (!res.ok) {
          console.error(`Supabase SET failed for key "${key}": ${res.status} ${res.statusText}`, await res.text().catch(() => ""));
          return null;
        }
        return { key, value, shared: false };
      } catch (err) {
        console.error(`Supabase SET threw for key "${key}":`, err);
        return null;
      }
    }
    if (typeof window === "undefined") return null;
    if (window.storage) {
      try { return await window.storage.set(key, value, false); } catch { return null; } // same fix as get() above
    }
    try {
      window.localStorage?.setItem(key, value);
      return { key, value, shared: false };
    } catch {
      return null; // e.g. quota exceeded, or storage disabled — save() surfaces this as an error state
    }
  },
  /** Whether ANY persistence backend is actually available right now. */
  available() {
    if (supabaseConfigured) return true;
    if (typeof window === "undefined") return false;
    if (window.storage) return true;
    try { window.localStorage?.setItem("__probe__", "1"); window.localStorage?.removeItem("__probe__"); return true; }
    catch { return false; }
  },
};

// ---------------------------------------------------------------------- //
// DJ Song Requests — built directly into this app now, backed by the same
// Supabase project, instead of a separate external backend project. Falls
// back to safe no-ops if Supabase isn't configured, matching the same
// graceful-degradation pattern as persistentStorage above.
// ---------------------------------------------------------------------- //

async function submitSongRequest(slug, { songName, artist, requesterName }) {
  if (!supabaseConfigured) throw new Error("Song requests aren't set up yet — the site owner needs to finish configuring the database.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/song_requests`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      invitation_slug: slug,
      song_name: (songName || "").trim().slice(0, 200),
      artist: (artist || "").trim().slice(0, 200) || null,
      requester_name: (requesterName || "").trim().slice(0, 100) || null,
    }),
  });
  if (!res.ok) {
    console.error("submitSongRequest failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't send your request — please try again.");
  }
  const rows = await res.json();
  return rows[0];
}

async function getSongRequests(slug) {
  if (!supabaseConfigured) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/song_requests?invitation_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc`, { headers: supabaseHeaders });
    if (!res.ok) {
      console.error("getSongRequests failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("getSongRequests threw:", err);
    return [];
  }
}

async function updateSongRequestStatus(id, status) {
  if (!supabaseConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/song_requests?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------- //
// Secure paid live stream — unlike everything else in this file, these
// three calls go to Supabase EDGE FUNCTIONS (real server-side code), not
// directly to a table via the public anon key. That's the whole point:
// the real stream URL never gets sent to a guest's browser until a
// server-side check confirms their specific session is marked 'paid' —
// something only a genuine payment webhook (not the guest's own browser)
// can cause. See the paid-stream-backend project for the actual function
// code and setup instructions.
// ---------------------------------------------------------------------- //

const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/** A stable per-browser id, so a guest's session survives leaving to pay and coming back. */
function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "server";
  let token = window.localStorage.getItem("einvite:guest-token");
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem("einvite:guest-token", token);
  }
  return token;
}

async function createPaymentSession(invitationSlug, amount, currency) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/create-payment-session`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ invitationSlug, amount, currency, guestToken: getOrCreateGuestToken() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't start payment — please try again.");
  return data; // { paymentReference, paymentUrl }
}

async function getStreamUrl(paymentReference) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/get-stream-url`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ paymentReference }),
  });
  return await res.json(); // { authorized, embedUrl? , status? }
}

// ---------------------------------------------------------------------- //
// Guest Networking — built directly into this app now, backed by the same
// Supabase project, instead of a separate external backend project. Same
// graceful-degradation pattern as everything else here: safe empty/no-op
// results if Supabase isn't configured, real errors surfaced via
// console.error when a call actually fails.
// ---------------------------------------------------------------------- //

async function registerNetworkingGuest(slug, { name, field, interests, linkedin, instagram, optedIn }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_guests`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      invitation_slug: slug,
      name: (name || "").trim().slice(0, 100),
      field: (field || "").trim().slice(0, 100) || null,
      interests: (interests || "").trim().slice(0, 300) || null,
      linkedin: (linkedin || "").trim().slice(0, 200) || null,
      instagram: (instagram || "").trim().slice(0, 200) || null,
      opted_in: optedIn !== false,
    }),
  });
  if (!res.ok) {
    console.error("registerNetworkingGuest failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't complete registration — please try again.");
  }
  const rows = await res.json();
  return rows[0];
}

async function getNetworkingDirectory(slug, excludeGuestId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/networking_guests?invitation_slug=eq.${encodeURIComponent(slug)}&opted_in=eq.true&id=neq.${encodeURIComponent(excludeGuestId)}&order=created_at.desc`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) {
      console.error("getNetworkingDirectory failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("getNetworkingDirectory threw:", err);
    return [];
  }
}

/** Simple shared-interests + same-field match score, computed client-side over the small directory list this app expects for one event. */
function networkingMatchScore(me, other) {
  const myInterests = (me.interests || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  const otherInterests = (other.interests || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  const shared = myInterests.filter((i) => otherInterests.includes(i)).length;
  const sameField = me.field && other.field && me.field.trim().toLowerCase() === other.field.trim().toLowerCase() ? 1 : 0;
  return shared * 2 + sameField;
}

async function sendConnectionRequest(slug, fromGuestId, toGuestId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_connections`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ invitation_slug: slug, from_guest_id: fromGuestId, to_guest_id: toGuestId, status: "pending" }),
  });
  if (!res.ok) {
    console.error("sendConnectionRequest failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't send that connection request — you may have already sent one to this guest.");
  }
  const rows = await res.json();
  return rows[0];
}

async function getConnectionsForGuest(guestId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/networking_connections?or=(from_guest_id.eq.${encodeURIComponent(guestId)},to_guest_id.eq.${encodeURIComponent(guestId)})&order=created_at.desc`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) {
      console.error("getConnectionsForGuest failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("getConnectionsForGuest threw:", err);
    return [];
  }
}

async function respondToConnection(connectionId, status) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_connections?id=eq.${encodeURIComponent(connectionId)}`, {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({ status, responded_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendNetworkingMessage(connectionId, senderId, text) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_messages`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ connection_id: connectionId, sender_id: senderId, text: (text || "").trim().slice(0, 1000) }),
  });
  if (!res.ok) {
    console.error("sendNetworkingMessage failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't send that message — please try again.");
  }
  const rows = await res.json();
  return rows[0];
}

async function getNetworkingMessages(connectionId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_messages?connection_id=eq.${encodeURIComponent(connectionId)}&order=created_at.asc`, { headers: supabaseHeaders });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getNetworkingGuestById(guestId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_guests?id=eq.${encodeURIComponent(guestId)}`, { headers: supabaseHeaders });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- //
// QR check-in — when a guest group RSVPs yes, a random token is created
// and encoded into a QR code as a URL (not raw data). That's what lets
// this work with any phone's completely ordinary camera app — no custom
// in-app scanner or QR-decoding library needed, since scanning a URL and
// opening it is something every modern phone camera already does.
// ---------------------------------------------------------------------- //

async function createCheckinToken(slug, guestGroupId, guestNames) {
  const token = crypto.randomUUID();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/guest_checkins`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ invitation_slug: slug, guest_group_id: guestGroupId, guest_names: guestNames, token }),
  });
  if (!res.ok) {
    console.error("createCheckinToken failed:", res.status, await res.text().catch(() => ""));
    return null; // check-in is a bonus on top of RSVP, not something that should block the RSVP itself from succeeding
  }
  return token;
}

async function getCheckinByToken(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guest_checkins?token=eq.${encodeURIComponent(token)}`, { headers: supabaseHeaders });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

async function markCheckedIn(token) {
  try {
    // Only sets checked_in_at if it's currently null — this is what
    // preserves the ORIGINAL check-in time if the same QR code somehow
    // gets scanned twice, instead of silently overwriting it.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guest_checkins?token=eq.${encodeURIComponent(token)}&checked_in_at=is.null`, {
      method: "PATCH",
      headers: { ...supabaseHeaders, Prefer: "return=representation" },
      body: JSON.stringify({ checked_in_at: new Date().toISOString() }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null; // null here specifically means "already had a checked_in_at" — the filter excluded it, not an error
  } catch {
    return null;
  }
}

/** Uses a free, no-API-key QR generation service — this app has no QR-encoding library available, so this renders the code as a plain <img>. */
function qrCodeImageUrl(data, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

// navigator.clipboard.writeText() is async — a plain try/catch around the call
// (without awaiting it) never actually catches a rejection, so failures were
// silent. This awaits it properly and falls back to the older execCommand
// approach, which works in more sandboxed/embedded contexts.
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the fallback below
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// Phone camera photos can be several MB — far more than a saved draft can hold once
// base64-encoded. Downscale and re-compress to JPEG before it ever enters state, so
// uploads stay fast, previews stay smooth, and Save doesn't hit the storage size limit.
// Converts a normal YouTube/Vimeo watch URL (whatever a couple would
// naturally paste, copied straight from their browser) into the specific
// embeddable player URL those platforms actually require for an <iframe>.
// Returns null for anything else — including Zoom, which doesn't support
// this at all (a Zoom meeting is joined through Zoom's own client/app, not
// embedded as a video player), and for URLs we don't recognize the shape
// of. That null is the signal to fall back to a plain "open in new tab"
// link instead of guessing at an embed that won't actually work.
function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      let videoId = null;
      if (u.hostname === "youtu.be") videoId = u.pathname.slice(1);
      else if (u.pathname.startsWith("/watch")) videoId = u.searchParams.get("v");
      else if (u.pathname.startsWith("/live/")) videoId = u.pathname.split("/live/")[1];
      else if (u.pathname.startsWith("/embed/")) videoId = u.pathname.split("/embed/")[1];
      videoId = videoId ? videoId.split("?")[0].split("&")[0] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const match = u.pathname.match(/\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
  } catch {
    return null; // not a valid URL at all
  }
  return null;
}

function readImageCompressed(file, maxDim = 2400, quality = 0.92) {
  // JPEG has no alpha channel — compressing a transparent PNG/WebP/GIF down to
  // JPEG silently flattens every transparent pixel to black. Keep transparency-
  // capable formats as PNG (lossless, so no quality param) and only use JPEG
  // for formats that never had transparency to begin with, where JPEG's much
  // smaller file size is worth it.
  const preserveTransparency = ["image/png", "image/webp", "image/gif"].includes(file.type);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Without explicitly requesting high-quality smoothing, browsers aren't
        // guaranteed to use good interpolation when scaling a large source image
        // down — this is what actually makes canvas-resized images look soft,
        // independent of the target resolution or JPEG quality below.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(preserveTransparency ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------------- */
/* Languages                                                                */
/* ---------------------------------------------------------------------- */

const LANGS = ["en", "ar", "fr", "es"];
const LANG_META = {
  en: { label: "English", short: "EN", dir: "ltr", locale: "en-US" },
  ar: { label: "العربية", short: "AR", dir: "rtl", locale: "ar" },
  fr: { label: "Français", short: "FR", dir: "ltr", locale: "fr-FR" },
  es: { label: "Español", short: "ES", dir: "ltr", locale: "es-ES" },
};

const PREVIEW_T = {
  en: { orderOfDay: "Order of the day", celebration: "The Celebration", countingDownTo: "Counting down to", celebrationWord: "the celebration", celebrationBegun: "The celebration has begun!", days: "days", hrs: "hrs", min: "min", sec: "sec", swipeUp: "Swipe up", directions: "Get Directions", tapToStart: "Tap to start", rsvpHeading: "Will you join us?", giftRegistry: "Gift Registry", registryIntro: "Your presence is the greatest gift — but if you'd like to spoil us anyway:", viewRegistry: "View registry" },
  ar: { orderOfDay: "برنامج اليوم", celebration: "مراسم الاحتفال", countingDownTo: "العد التنازلي لـ", celebrationWord: "الاحتفال", celebrationBegun: "لقد بدأ الاحتفال!", days: "يوم", hrs: "ساعة", min: "دقيقة", sec: "ثانية", swipeUp: "اسحب لأعلى", directions: "احصل على الاتجاهات", tapToStart: "اضغط للبدء", rsvpHeading: "هل ستكونون معنا؟", giftRegistry: "قائمة الهدايا", registryIntro: "حضوركم هو أجمل هدية — وإن أردتم تدليلنا أكثر:", viewRegistry: "عرض القائمة" },
  fr: { orderOfDay: "Déroulé de la journée", celebration: "La Célébration", countingDownTo: "Compte à rebours vers", celebrationWord: "la célébration", celebrationBegun: "La célébration a commencé !", days: "jours", hrs: "h", min: "min", sec: "s", swipeUp: "Glissez vers le haut", directions: "Itinéraire", tapToStart: "Touchez pour commencer", rsvpHeading: "Serez-vous des nôtres ?", giftRegistry: "Liste de mariage", registryIntro: "Votre présence est le plus beau des cadeaux — mais si vous souhaitez nous gâter :", viewRegistry: "Voir la liste" },
  es: { orderOfDay: "Orden del día", celebration: "La Celebración", countingDownTo: "Cuenta atrás para", celebrationWord: "la celebración", celebrationBegun: "¡La celebración ha comenzado!", days: "días", hrs: "h", min: "min", sec: "s", swipeUp: "Desliza hacia arriba", directions: "Cómo llegar", tapToStart: "Toca para comenzar", rsvpHeading: "¿Nos acompañarás?", giftRegistry: "Lista de regalos", registryIntro: "Su presencia es el mejor regalo — pero si desean consentirnos:", viewRegistry: "Ver la lista" },
};

/* ---------------------------------------------------------------------- */
/* Default content / data                                                  */
/* ---------------------------------------------------------------------- */

const defaultContent = {
  en: {
    cover: { name1: "Elena", name2: "Marcus", intro: "together with their families, joyfully invite you to celebrate their wedding", tapText: "TAP TO START" },
    family: { greeting: "With hearts full of joy, we invite you to witness the beginning of our forever.", quote: "", side1Title: "Bride's Family", side1Names: "Mr. & Mrs. Rodriguez", side2Title: "Groom's Family", side2Names: "Mr. & Mrs. Chen" },
    rsvp: { yesLabel: "Joyfully Accepts", noLabel: "Regretfully Declines" },
  },
  ar: {
    cover: { name1: "إيلينا", name2: "ماركوس", intro: "يتشرفان مع عائلتيهما بدعوتكم للاحتفال بزفافهما", tapText: "اضغط للبدء" },
    family: { greeting: "بقلوب مفعمة بالفرح، ندعوكم لمشاركتنا بداية قصتنا الأبدية.", quote: "", side1Title: "عائلة العروس", side1Names: "السيد والسيدة رودريغيز", side2Title: "عائلة العريس", side2Names: "السيد والسيدة تشين" },
    rsvp: { yesLabel: "بكل سرور سأحضر", noLabel: "نعتذر عن الحضور" },
  },
  fr: {
    cover: { name1: "Elena", name2: "Marcus", intro: "avec leurs familles, ont la joie de vous inviter à célébrer leur mariage", tapText: "TOUCHEZ POUR COMMENCER" },
    family: { greeting: "Le cœur rempli de joie, nous vous invitons à célébrer le début de notre éternité.", quote: "", side1Title: "Famille de la mariée", side1Names: "M. et Mme Rodriguez", side2Title: "Famille du marié", side2Names: "M. et Mme Chen" },
    rsvp: { yesLabel: "Sera présent avec joie", noLabel: "Ne pourra malheureusement pas venir" },
  },
  es: {
    cover: { name1: "Elena", name2: "Marcus", intro: "junto a sus familias, tienen el placer de invitarles a celebrar su boda", tapText: "TOCA PARA COMENZAR" },
    family: { greeting: "Con el corazón lleno de alegría, les invitamos a celebrar el comienzo de nuestra eternidad.", quote: "", side1Title: "Familia de la novia", side1Names: "Sr. y Sra. Rodríguez", side2Title: "Familia del novio", side2Names: "Sr. y Sra. Chen" },
    rsvp: { yesLabel: "Asistirá con alegría", noLabel: "Lamenta no poder asistir" },
  },
};

const defaultTimeline = [
  { id: uid(), icon: "church", time: "4:00 PM", label: { en: "Ceremony", ar: "حفل الزفاف", fr: "Cérémonie", es: "Ceremonia" } },
  { id: uid(), icon: "wine", time: "5:30 PM", label: { en: "Welcome Drinks", ar: "مشروبات الترحيب", fr: "Cocktail de bienvenue", es: "Bienvenida" } },
  { id: uid(), icon: "utensils", time: "7:00 PM", label: { en: "Dinner", ar: "العشاء", fr: "Dîner", es: "Cena" } },
  { id: uid(), icon: "party", time: "9:00 PM", label: { en: "Party", ar: "الحفلة", fr: "Soirée dansante", es: "Fiesta" } },
];

const defaultLocations = [
  { id: uid(), time: "4:00 PM", address: "St. Augustine Chapel, 12 Rose Ave", title: { en: "The Ceremony", ar: "مراسم الزفاف", fr: "La Cérémonie", es: "La Ceremonia" } },
  { id: uid(), time: "5:30 PM", address: "Willowbrook Estate, 88 Garden Rd", title: { en: "The Reception", ar: "حفل الاستقبال", fr: "La Réception", es: "La Recepción" } },
];

const defaultRegistry = [
  { id: uid(), label: "Amazon Registry", url: "https://www.amazon.com/wedding/registry", note: "" },
  { id: uid(), label: "Honeymoon Fund", url: "", note: "IBAN: XX00 0000 0000 0000 0000 00" },
];

const defaultPageBackgrounds = {
  cover: { mode: "photo", preset: "botanical", image: null, darken: 55 },
  family: { mode: "paper", preset: "blush", image: null, darken: 55 },
  timeline: { mode: "paper", preset: "dusk", image: null, darken: 55 },
  locations: { mode: "paper", preset: "gilded", image: null, darken: 55 },
  countdown: { mode: "paper", preset: "botanical", image: null, darken: 55 },
  rsvp: { mode: "paper", preset: "blush", image: null, darken: 55 },
  registry: { mode: "paper", preset: "gilded", image: null, darken: 55 },
  djRequests: { mode: "paper", preset: "dusk", image: null, darken: 55 },
  networking: { mode: "paper", preset: "botanical", image: null, darken: 55 },
  livestream: { mode: "paper", preset: "dusk", image: null, darken: 55 },
};

const DEFAULT_LAYOUTS = {
  cover: { names: { x: 50, y: 62 }, intro: { x: 50, y: 76 } },
  family: { greeting: { x: 50, y: 34 }, quote: { x: 50, y: 52 }, names: { x: 50, y: 76 } },
  timeline: { heading: { x: 50, y: 13 }, list: { x: 50, y: 58 } },
  locations: { heading: { x: 50, y: 11 }, list: { x: 50, y: 55 } },
  countdown: { heading: { x: 50, y: 30 }, countdown: { x: 50, y: 58 } },
  rsvp: { heading: { x: 50, y: 22 }, buttons: { x: 50, y: 55 } },
  registry: { heading: { x: 50, y: 13 }, list: { x: 50, y: 55 } },
  djRequests: { heading: { x: 50, y: 26 }, form: { x: 50, y: 60 } },
  networking: { heading: { x: 50, y: 32 }, button: { x: 50, y: 58 } },
  livestream: { heading: { x: 50, y: 32 }, button: { x: 50, y: 58 } },
};

const seedGuestGroups = () => {
  const now = Date.now();
  const day = 86400000;
  const mk = (firstName, status) => ({ id: uid(), name: firstName, status });
  return [
    { id: uid(), lastName: "Malik", members: [mk("Sarah", "yes")], additionalGuests: 1, table: "5", phone: "+15551234567", invitationSent: true, invitationViewed: true, updatedAt: now - 2 * day },
    { id: uid(), lastName: "Nasser", members: [mk("Ahmed", "yes"), mk("Layla", "yes")], additionalGuests: 0, table: "3", phone: "+15559876543", invitationSent: true, invitationViewed: true, updatedAt: now - 1 * day },
    { id: uid(), lastName: "Laurent", members: [mk("Julie", "no")], additionalGuests: 0, table: "", phone: "+33612345678", invitationSent: true, invitationViewed: true, updatedAt: now - 3 * day },
    { id: uid(), lastName: "Mendes", members: [mk("Carlos", "yes"), mk("Ana", "pending")], additionalGuests: 2, table: "7", phone: "+34611223344", invitationSent: true, invitationViewed: true, updatedAt: now - 4 * day },
    { id: uid(), lastName: "Zahra", members: [mk("Fatima", "pending")], additionalGuests: 0, table: "", phone: "+96170123456", invitationSent: true, invitationViewed: false, updatedAt: null },
    { id: uid(), lastName: "Whitfield", members: [mk("Tom", "yes")], additionalGuests: 1, table: "5", phone: "+15552223333", invitationSent: true, invitationViewed: true, updatedAt: now - 5 * day },
    { id: uid(), lastName: "Rousseau", members: [mk("Camille", "pending"), mk("Pierre", "pending")], additionalGuests: 0, table: "", phone: "+33698765432", invitationSent: false, invitationViewed: false, updatedAt: null },
    { id: uid(), lastName: "Fernández", members: [mk("Lucía", "yes"), mk("Mateo", "no")], additionalGuests: 1, table: "9", phone: "+34655667788", invitationSent: true, invitationViewed: true, updatedAt: now - 6 * day },
    { id: uid(), lastName: "Haddad", members: [mk("Omar", "no")], additionalGuests: 0, table: "", phone: "+96176543210", invitationSent: true, invitationViewed: true, updatedAt: now - 2 * day },
    { id: uid(), lastName: "Kim", members: [mk("Grace", "yes"), mk("David", "yes"), mk("Emma", "yes")], additionalGuests: 0, table: "2", phone: "+15557778888", invitationSent: true, invitationViewed: true, updatedAt: now - 1 * day },
    { id: uid(), lastName: "Dubois", members: [mk("Pierre", "pending")], additionalGuests: 1, table: "", phone: "+33611119999", invitationSent: false, invitationViewed: false, updatedAt: null },
    { id: uid(), lastName: "García", members: [mk("Mateo", "no"), mk("Sofia", "yes")], additionalGuests: 0, table: "9", phone: "+34699887766", invitationSent: true, invitationViewed: true, updatedAt: now - 7 * day },
  ];
};

const flattenMembers = (groups) => groups.flatMap((g) => g.members);

const seedTables = () => [
  { id: uid(), name: "Family Table", capacity: 10 },
  { id: uid(), name: "Friends Table", capacity: 8 },
];

// How many seats a guest group actually needs: confirmed named members +
// any additional (unnamed) guests — declined members don't need a seat.
const groupHeadcount = (group) => group.members.filter((m) => m.status === "yes").length + (group.additionalGuests || 0);
const groupIsConfirmed = (group) => group.members.some((m) => m.status === "yes");

const USER_ROLES = {
  owner: { label: "Owner", color: GOLD },
  couple: { label: "Couple", color: "#8FBFA3" },
  normal: { label: "Normal", color: MUTED },
};

const STATUS_STYLE = {
  active: { label: "Active", color: CHART_COLORS.yes },
  inactive: { label: "Inactive", color: CHART_COLORS.no },
  pending: { label: "Pending approval", color: GOLD_SOFT },
};

// NOTE: passwords here are plain strings held in local component state purely
// to demonstrate the signup/login UI flow. There is no backend, no hashing,
// and nothing here is remotely secure — this is a UX prototype, not auth.
const seedUsers = () => {
  const now = Date.now();
  const day = 86400000;
  return [
    { id: uid(), name: "Elena Rodriguez", email: "elena@einvite.me", password: "demo1234", role: "owner", status: "active", dashboardAccess: true, canDesign: true, createdAt: now - 240 * day, invitationSlug: "elena-marcus" },
    { id: uid(), name: "Marcus Chen", email: "marcus.chen@gmail.com", password: "demo1234", role: "couple", status: "active", dashboardAccess: true, canDesign: true, createdAt: now - 40 * day, invitationSlug: "marcus-jenny" },
    { id: uid(), name: "Sarah Malik", email: "sarah.malik@outlook.com", password: "demo1234", role: "couple", status: "active", dashboardAccess: false, canDesign: true, createdAt: now - 33 * day, invitationSlug: "sarah-daniel" },
    { id: uid(), name: "Ahmed Nasser", email: "ahmed.nasser@yahoo.com", password: "demo1234", role: "couple", status: "inactive", dashboardAccess: false, canDesign: true, createdAt: now - 90 * day, invitationSlug: "ahmed-layla" },
    { id: uid(), name: "Julie Laurent", email: "julie.laurent@icloud.com", password: "demo1234", role: "normal", status: "active", dashboardAccess: false, canDesign: false, createdAt: now - 12 * day, invitationSlug: null },
    { id: uid(), name: "Carlos Mendes", email: "carlos.mendes@gmail.com", password: "demo1234", role: "couple", status: "active", dashboardAccess: false, canDesign: true, createdAt: now - 18 * day, invitationSlug: "carlos-ana" },
    { id: uid(), name: "Fatima Zahra", email: "fatima.zahra@gmail.com", password: "demo1234", role: "normal", status: "inactive", dashboardAccess: false, canDesign: false, createdAt: now - 150 * day, invitationSlug: null },
    { id: uid(), name: "Tom Whitfield", email: "tom.w@companymail.com", password: "demo1234", role: "normal", status: "active", dashboardAccess: false, canDesign: false, createdAt: now - 5 * day, invitationSlug: null },
    { id: uid(), name: "Nour Haddad", email: "nour.haddad@gmail.com", password: "demo1234", role: "normal", status: "pending", dashboardAccess: false, canDesign: false, createdAt: now - 1 * day, invitationSlug: null },
  ];
};

/* ---------------------------------------------------------------------- */
/* Small UI atoms                                                          */
/* ---------------------------------------------------------------------- */

function FieldLabel({ children }) {
  return (
    <div className="mb-1.5 text-[11px] font-semibold uppercase" style={{ color: GOLD_SOFT, letterSpacing: "0.12em", fontFamily: FONT_BODY }}>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
      style={{ background: INK_3, color: IVORY, border: `1px solid ${INK_3}`, fontFamily: FONT_BODY }}
      onFocus={(e) => (e.target.style.border = `1px solid ${GOLD}`)}
      onBlur={(e) => (e.target.style.border = `1px solid ${INK_3}`)}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
      style={{ background: INK_3, color: IVORY, border: `1px solid ${INK_3}`, fontFamily: FONT_BODY }}
      onFocus={(e) => (e.target.style.border = `1px solid ${GOLD}`)}
      onBlur={(e) => (e.target.style.border = `1px solid ${INK_3}`)}
    />
  );
}

function GhostButton({ children, onClick, danger, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        color: danger ? "#E29B9B" : active ? INK : GOLD_SOFT,
        background: active ? GOLD : "transparent",
        border: `1px solid ${danger ? "rgba(226,155,155,0.35)" : "rgba(201,164,76,0.35)"}`,
        fontFamily: FONT_BODY,
      }}
    >
      {children}
    </button>
  );
}

// Styled identically to GhostButton, but a <label> directly wrapping the file input —
// no ref, no programmatic .click(). This is the pattern that reliably opens the native
// file/photo picker on mobile browsers (the same one already used for image uploads).
function GhostUploadButton({ children, accept, onChange }) {
  return (
    <label
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{ color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.35)`, fontFamily: FONT_BODY }}
    >
      {children}
      <input type="file" accept={accept} style={VISUALLY_HIDDEN} onChange={onChange} />
    </label>
  );
}

function GoldButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98]"
      style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={{ background: INK_3, color: IVORY, border: `1px solid ${INK_3}`, fontFamily: FONT_BODY }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: INK_2, color: IVORY }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SegmentedToggle({ value, onChange, options }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg" style={{ border: `1px solid ${INK_3}` }}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className="px-4 py-2 text-[12px] font-semibold"
          style={{ background: value === opt.value ? GOLD : INK_3, color: value === opt.value ? INK : MUTED, fontFamily: FONT_BODY }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberStepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg" style={{ border: `1px solid ${INK_3}` }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center"
        style={{ background: INK_3, color: IVORY }}
      >
        <ChevronDown size={14} />
      </button>
      <span className="flex h-9 w-12 items-center justify-center text-[13px] font-semibold" style={{ background: INK_3, color: IVORY, fontFamily: FONT_BODY }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center"
        style={{ background: INK_3, color: IVORY }}
      >
        <ChevronUp size={14} />
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "rgba(201,164,76,0.2)" }} />
      <Sparkles size={12} style={{ color: GOLD }} />
      <div className="h-px flex-1" style={{ background: "rgba(201,164,76,0.2)" }} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Top tab bar                                                             */
/* ---------------------------------------------------------------------- */

function TabBar({ view, setView, isClientPortal }) {
  const tabs = [
    { key: "builder", label: "Builder", icon: Heart },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    ...(isClientPortal ? [] : [{ key: "users", label: "Users", icon: Users }]),
  ];
  return (
    <div className="mb-7 flex gap-2 border-b" style={{ borderColor: "rgba(147,166,155,0.18)" }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-colors"
            style={{
              color: isActive ? GOLD : MUTED,
              borderBottom: `2px solid ${isActive ? GOLD : "transparent"}`,
              fontFamily: FONT_BODY,
            }}
          >
            <Icon size={14} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Language switcher                                                       */
/* ---------------------------------------------------------------------- */

function LangSwitcher({ activeLang, setActiveLang, defaultLang, setDefaultLang, enabledLanguages, onToggleLanguage }) {
  const [showAdd, setShowAdd] = useState(false);
  const disabledLangs = LANGS.filter((l) => !enabledLanguages.includes(l));

  const removeLanguage = (l) => {
    if (enabledLanguages.length <= 1) return; // always keep at least one language
    onToggleLanguage(l, false);
    if (defaultLang === l) setDefaultLang(enabledLanguages.find((x) => x !== l));
    if (activeLang === l) setActiveLang(enabledLanguages.find((x) => x !== l));
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl p-3" style={{ background: INK_3 }}>
      <span className="mr-1 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.1em", fontFamily: FONT_BODY }}>
        Editing
      </span>
      {enabledLanguages.map((l) => (
        <button
          key={l}
          onClick={() => setActiveLang(l)}
          className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ background: activeLang === l ? GOLD : "transparent", color: activeLang === l ? INK : IVORY, border: `1px solid ${activeLang === l ? GOLD : "rgba(147,166,155,0.35)"}`, fontFamily: FONT_BODY }}
        >
          {LANG_META[l].short}
          <span role="button" title={defaultLang === l ? "Default language" : "Set as default language"} onClick={(e) => { e.stopPropagation(); setDefaultLang(l); }}>
            <Star size={11} fill={defaultLang === l ? (activeLang === l ? INK : GOLD) : "none"} color={activeLang === l ? INK : GOLD} />
          </span>
          {enabledLanguages.length > 1 && (
            <span
              role="button"
              title={`Remove ${LANG_META[l].short} — its content is kept and can be turned back on anytime`}
              onClick={(e) => { e.stopPropagation(); removeLanguage(l); }}
              style={{ color: activeLang === l ? INK : MUTED }}
            >
              <X size={11} />
            </span>
          )}
        </button>
      ))}
      {disabledLangs.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            style={{ border: `1px dashed rgba(147,166,155,0.4)`, color: MUTED, fontFamily: FONT_BODY }}
          >
            <Plus size={12} /> Language
          </button>
          {showAdd && (
            <div className="absolute left-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-lg p-1.5" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.25)` }}>
              {disabledLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => { onToggleLanguage(l, true); setShowAdd(false); }}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs"
                  style={{ color: IVORY, fontFamily: FONT_BODY }}
                >
                  {LANG_META[l].short} — {LANG_META[l].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <span className="ml-auto text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Tap <Star size={9} style={{ display: "inline", verticalAlign: "middle" }} /> for default, <X size={9} style={{ display: "inline", verticalAlign: "middle" }} /> to remove a language
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Background picker (per slide)                                           */
/* ---------------------------------------------------------------------- */

function BackgroundPicker({ bg, onChange }) {
  const setPreset = (key) => onChange({ ...bg, mode: "photo", preset: key, image: null });
  const setPaper = () => onChange({ ...bg, mode: "paper" });
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageCompressed(file);
      onChange({ ...bg, mode: "photo", image: dataUrl });
    } catch {
      // If compression fails for any reason, fall back to the raw file.
      const reader = new FileReader();
      reader.onload = () => onChange({ ...bg, mode: "photo", image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mt-5">
      <FieldLabel>Page background</FieldLabel>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={setPaper}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[9px] font-semibold"
          style={{ background: PAPER, color: EMERALD, border: bg.mode === "paper" ? `2px solid ${GOLD}` : "2px solid transparent", boxShadow: bg.mode === "paper" ? `0 0 0 2px ${INK_2}` : "none" }}
          title="Paper"
        >
          Aa
        </button>
        {Object.entries(BG_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className="h-11 w-11 rounded-lg transition-all"
            style={{ background: preset.css, border: bg.mode === "photo" && bg.preset === key && !bg.image ? `2px solid ${GOLD}` : "2px solid transparent", boxShadow: bg.mode === "photo" && bg.preset === key && !bg.image ? `0 0 0 2px ${INK_2}` : "none" }}
            title={preset.name}
          />
        ))}
        <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg" style={{ border: bg.mode === "photo" && bg.image ? `2px solid ${GOLD}` : `2px dashed rgba(147,166,155,0.5)`, background: bg.mode === "photo" && bg.image ? `url(${bg.image}) center/cover` : "transparent" }}>
          {!(bg.mode === "photo" && bg.image) && <Upload size={16} style={{ color: MUTED }} />}
          <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUpload} />
        </label>
      </div>
      {bg.mode === "photo" && bg.image && (
        <button onClick={() => onChange({ ...bg, image: null })} className="mt-2 text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          Remove photo, use preset instead
        </button>
      )}
      {bg.mode === "photo" && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Darken photo</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{bg.darken ?? 55}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={bg.darken ?? 55}
            onChange={(e) => onChange({ ...bg, darken: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: GOLD }}
          />
          <p className="mt-1 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            Applied automatically so text stays readable — adjust if the photo looks too dark or too light.
          </p>
        </div>
      )}
    </div>
  );
}

function BlockStylePanel({ isCustom, current, onChangeStyle, onChangeText, onDelete, onDeselect }) {
  const fontKey = FONT_OPTIONS.find((f) => f.value === current.fontFamily)?.key || "auto";
  const isImage = current.type === "image";
  return (
    <div className="mb-5 rounded-xl p-4" style={{ background: INK_3, border: `1px solid rgba(201,164,76,0.3)` }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase" style={{ color: GOLD_SOFT, letterSpacing: "0.1em", fontFamily: FONT_BODY }}>
          {isImage ? "Custom image" : isCustom ? "Custom text" : "Text style"}
        </span>
        <button onClick={onDeselect} style={{ color: MUTED }}><X size={14} /></button>
      </div>

      {isImage && (
        <div className="mb-3 overflow-hidden rounded-lg" style={{ background: INK_2, maxHeight: 100 }}>
          <img src={current.url} alt="" className="mx-auto" style={{ maxHeight: 100, objectFit: "contain" }} />
        </div>
      )}

      {isCustom && !isImage && (
        <div className="mb-3">
          <FieldLabel>Text content</FieldLabel>
          <TextArea value={current.text} onChange={onChangeText} rows={2} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Horizontal</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{Math.round(current.x ?? 50)}%</span>
          </div>
          <input type="range" min={8} max={92} value={current.x ?? 50} onChange={(e) => onChangeStyle({ x: Number(e.target.value) })} className="w-full accent-current" style={{ accentColor: GOLD }} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Vertical</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{Math.round(current.y ?? 50)}%</span>
          </div>
          <input type="range" min={6} max={94} value={current.y ?? 50} onChange={(e) => onChangeStyle({ y: Number(e.target.value) })} className="w-full accent-current" style={{ accentColor: GOLD }} />
        </div>
      </div>
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Drag on the phone works too — these sliders are a reliable backup if dragging doesn't respond on your device.
      </p>

      {isImage ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Size (% of screen width)</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.width || 40}%</span>
          </div>
          <input
            type="range" min={10} max={100} value={current.width || 40}
            onChange={(e) => {
              const width = Number(e.target.value);
              onChangeStyle({ width, x: clampXForImageWidth(current.x ?? 50, width) });
            }}
            className="w-full" style={{ accentColor: GOLD }}
          />
          <button onClick={() => onChangeStyle({ width: 100, x: 50 })} className="mt-1.5 text-[10.5px] underline" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
            Fill screen width
          </button>

          <div className="mt-4">
            <FieldLabel>Link (optional)</FieldLabel>
            <TextInput value={current.linkUrl || ""} onChange={(v) => onChangeStyle({ linkUrl: v })} placeholder="https://… — tapping the image opens this" />
            <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              Leave blank for a plain decorative image. In "Position text" mode the image stays draggable either way.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Font</FieldLabel>
              <Select value={fontKey} onChange={(key) => onChangeStyle({ fontFamily: fontValue(key) })} options={FONT_OPTIONS.map((f) => ({ value: f.key, label: f.label }))} />
            </div>
            <div>
              <FieldLabel>Size (px)</FieldLabel>
              <TextInput type="number" value={String(current.fontSize || "")} onChange={(v) => onChangeStyle({ fontSize: v ? Number(v) : null })} placeholder="Auto" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <FieldLabel>Color</FieldLabel>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={current.color || "#F4EDE4"} onChange={(e) => onChangeStyle({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded" style={{ border: `1px solid ${INK_3}`, background: "transparent" }} />
            {current.color && (
              <button onClick={() => onChangeStyle({ color: null })} className="text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                Reset to default
              </button>
            )}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center gap-2">
        {!isImage && <GhostButton onClick={() => onChangeStyle({ fontFamily: null, color: null, fontSize: null })}>Reset style</GhostButton>}
        {isCustom && (
          <GhostButton danger onClick={onDelete}>
            <Trash2 size={12} /> Delete
          </GhostButton>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Step navigator ("wax seal" rail)                                        */
/* ---------------------------------------------------------------------- */

function StepRail({ steps, activeIndex, visited, onSelect }) {
  return (
    <div className="mb-7 flex flex-wrap items-start gap-y-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeIndex;
        const isVisited = visited.has(i);
        return (
          <React.Fragment key={step.key}>
            <button onClick={() => onSelect(i)} className="group flex flex-col items-center gap-2" style={{ width: 64 }}>
              <div className="flex items-center justify-center rounded-full transition-all duration-300" style={{ width: isActive ? 46 : 38, height: isActive ? 46 : 38, background: isActive ? GOLD : isVisited ? "rgba(201,164,76,0.15)" : INK_3, border: `1.5px solid ${isActive || isVisited ? GOLD : "rgba(147,166,155,0.35)"}`, boxShadow: isActive ? "0 0 0 4px rgba(201,164,76,0.15)" : "none" }}>
                <Icon size={isActive ? 20 : 16} color={isActive ? INK : isVisited ? GOLD : MUTED} />
              </div>
              <span className="text-center text-[10px] leading-tight" style={{ color: isActive ? IVORY : MUTED, fontFamily: FONT_BODY, fontWeight: isActive ? 600 : 500 }}>
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && <div className="mt-[19px] h-px min-w-[12px] flex-1" style={{ background: isVisited ? GOLD : "rgba(147,166,155,0.25)", opacity: 0.5 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PagesManager({ orderedAllSteps, enabledSteps, onToggle, onMove }) {
  return (
    <div className="mb-6 rounded-xl p-3" style={{ background: INK_3 }}>
      <div className="mb-2 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.1em", fontFamily: FONT_BODY }}>
        Pages in this invitation
      </div>
      <div className="flex flex-col gap-1.5">
        {orderedAllSteps.map((step, i) => {
          const Icon = step.icon;
          const isRequired = step.key === REQUIRED_STEP_KEY;
          const isOn = enabledSteps[step.key];
          return (
            <div
              key={step.key}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: isOn ? "rgba(201,164,76,0.1)" : "transparent", border: `1px solid ${isOn ? "rgba(201,164,76,0.3)" : "rgba(147,166,155,0.2)"}`, opacity: isRequired ? 0.85 : 1 }}
            >
              <div className="flex flex-col">
                <button onClick={() => onMove(step.key, -1)} disabled={isRequired || i <= 1} title="Move earlier" style={{ color: isRequired || i <= 1 ? "rgba(147,166,155,0.3)" : MUTED }}>
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => onMove(step.key, 1)} disabled={isRequired || i >= orderedAllSteps.length - 1} title="Move later" style={{ color: isRequired || i >= orderedAllSteps.length - 1 ? "rgba(147,166,155,0.3)" : MUTED }}>
                  <ChevronDown size={12} />
                </button>
              </div>
              <Icon size={13} color={isOn ? GOLD_SOFT : MUTED} />
              <span className="flex-1 text-[12px] font-medium" style={{ color: isOn ? IVORY : MUTED, fontFamily: FONT_BODY }}>{step.label}</span>
              {isRequired ? (
                <span className="text-[10px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>Always first</span>
              ) : (
                <button
                  onClick={() => onToggle(step.key)}
                  title={isOn ? "Hide this page" : "Show this page"}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: isOn ? GOLD_SOFT : MUTED, fontFamily: FONT_BODY }}
                >
                  {isOn ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Use the arrows to reorder pages — the cover always opens the story. Hidden pages keep their content.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Editor: step panels                                                     */
/* ---------------------------------------------------------------------- */

function CoverStep({ c, updateContent, bg, setBg, music, updateMusic, onUploadAudio, onRemoveAudio, intro, updateIntro, activeLang, onUploadIntroMedia, onRemoveIntroMedia }) {
  const introMedia = intro.media[activeLang];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Partner one</FieldLabel>
          <TextInput value={c.name1} onChange={(v) => updateContent({ name1: v })} placeholder="Elena" />
        </div>
        <div>
          <FieldLabel>Partner two</FieldLabel>
          <TextInput value={c.name2} onChange={(v) => updateContent({ name2: v })} placeholder="Marcus" />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Introductory phrase</FieldLabel>
        <TextArea value={c.intro} onChange={(v) => updateContent({ intro: v })} placeholder="together with their families, joyfully invite you to celebrate their wedding" />
      </div>

      <BackgroundPicker bg={bg} onChange={setBg} />

      <Divider />

      <div className="flex items-center justify-between">
        <FieldLabel>Background music</FieldLabel>
        <button onClick={() => updateMusic({ enabled: !music.enabled })} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: music.enabled ? GOLD : INK_3 }}>
          <span className="absolute top-0.5 h-5 w-5 rounded-full transition-transform" style={{ background: IVORY, transform: music.enabled ? "translateX(22px)" : "translateX(2px)" }} />
        </button>
      </div>
      {music.enabled && (
        <div className="mt-2 flex items-center gap-2">
          <GhostUploadButton accept="audio/*" onChange={onUploadAudio}>
            <Upload size={13} /> {music.name ? "Replace track" : "Upload track"}
          </GhostUploadButton>
          {music.name && (
            <span className="flex items-center gap-1 text-xs" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              <Music2 size={12} /> {music.name}
              <button onClick={onRemoveAudio} className="ml-1" style={{ color: "#E29B9B" }}>
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
      {music.enabled && !music.name && (
        <p className="mt-1.5 text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          No track yet — the play button will appear at the bottom of the cover once you add one.
        </p>
      )}
      {music.enabled && (
        <div className="mt-3">
          <FieldLabel>Music icon</FieldLabel>
          <div className="flex gap-2">
            {Object.entries(MUSIC_ICONS).map(([key, opt]) => (
              <button
                key={key}
                onClick={() => updateMusic({ icon: key })}
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: music.icon === key ? GOLD : INK_3, border: `1px solid ${music.icon === key ? GOLD : "rgba(147,166,155,0.3)"}` }}
                title={opt.name}
              >
                <opt.playing size={16} color={music.icon === key ? INK : MUTED} />
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Names and intro are saved per language. Background and music are shared across every language.
      </p>

      <Divider />

      <FieldLabel>Intro type</FieldLabel>
      <Select
        value={intro.type}
        onChange={(v) => updateIntro({ type: v })}
        options={[{ value: "button", label: "Tap to start button" }, { value: "animation", label: "Animation" }, { value: "seal", label: "Wax seal envelope" }]}
      />

      {intro.type === "seal" && (
        <div className="mt-3">
          <FieldLabel>Envelope style</FieldLabel>
          <div className="flex gap-2">
            {Object.entries(ENVELOPE_STYLES).map(([key, d]) => (
              <button
                key={key}
                onClick={() => updateIntro({ sealDesign: key })}
                className="h-10 w-10 rounded-full"
                style={{ background: d.swatch, border: intro.sealDesign === key ? `2.5px solid ${GOLD_SOFT}` : "2.5px solid transparent", boxShadow: intro.sealDesign === key ? `0 0 0 2px ${INK_2}` : "none" }}
                title={d.name}
              />
            ))}
          </div>
          <p className="mt-2 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            {ENVELOPE_STYLES[intro.sealDesign]?.name || "Golden Kraft"} — built in, no photo needed. Upload your own photo below to use that instead.
          </p>
        </div>
      )}

      {intro.type === "animation" && (
        <div className="mt-3">
          <FieldLabel>Animation style</FieldLabel>
          <Select
            value={intro.animationStyle}
            onChange={(v) => updateIntro({ animationStyle: v })}
            options={Object.entries(GATE_ANIMATIONS).map(([key, a]) => ({ value: key, label: a.name }))}
          />
        </div>
      )}

      {intro.type === "button" && (
        <div className="mt-3">
          <FieldLabel>Tap to start icon</FieldLabel>
          <div className="flex gap-2">
            {Object.entries(GATE_ICONS).map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => updateIntro({ icon: key })}
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: intro.icon === key ? GOLD : INK_3, border: `1px solid ${intro.icon === key ? GOLD : "rgba(147,166,155,0.3)"}` }}
              >
                <Icon size={16} color={intro.icon === key ? INK : MUTED} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <FieldLabel>Tap to start text ({LANG_META[activeLang].short})</FieldLabel>
        <TextInput value={c.tapText} onChange={(v) => updateContent({ tapText: v })} placeholder="TAP TO START" />
      </div>

      <div className="mt-4">
        <FieldLabel>
          {intro.type === "seal" ? "Custom envelope background — photo or video" : "Intro background — photo or video"} ({LANG_META[activeLang].short})
        </FieldLabel>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg" style={{ border: introMedia ? `2px solid ${GOLD}` : `2px dashed rgba(147,166,155,0.5)`, background: introMedia?.type === "image" ? `url(${introMedia.url}) center/cover` : INK_3 }}>
            {!introMedia && <Upload size={16} style={{ color: MUTED }} />}
            {introMedia?.type === "video" && <Film size={16} style={{ color: GOLD_SOFT }} />}
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <GhostUploadButton accept="image/*,video/*" onChange={onUploadIntroMedia}>
              <Upload size={13} /> {introMedia ? "Replace" : "Upload photo or video"}
            </GhostUploadButton>
            {introMedia ? (
              <button onClick={onRemoveIntroMedia} className="text-[10.5px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                Remove{introMedia.name ? ` (${introMedia.name})` : ""}{intro.type === "seal" ? ", use the envelope style instead" : ", fall back to cover background"}
              </button>
            ) : (
              <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                {intro.type === "seal" ? "No custom photo — using the envelope style above." : "No override for this language — using the Cover slide background above."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}

function FamilyStep({ c, updateContent, bg, setBg }) {
  return (
    <div>
      <FieldLabel>Greeting text</FieldLabel>
      <TextArea value={c.greeting} onChange={(v) => updateContent({ greeting: v })} rows={3} />
      <div className="mt-4">
        <FieldLabel>Verse or quote (optional)</FieldLabel>
        <TextArea value={c.quote} onChange={(v) => updateContent({ quote: v })} rows={2} placeholder="Add a verse or quote that speaks to your journey together" />
      </div>
      <Divider />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Side one title</FieldLabel>
          <TextInput value={c.side1Title} onChange={(v) => updateContent({ side1Title: v })} />
          <div className="mt-3">
            <FieldLabel>Names</FieldLabel>
            <TextInput value={c.side1Names} onChange={(v) => updateContent({ side1Names: v })} />
          </div>
        </div>
        <div>
          <FieldLabel>Side two title</FieldLabel>
          <TextInput value={c.side2Title} onChange={(v) => updateContent({ side2Title: v })} />
          <div className="mt-3">
            <FieldLabel>Names</FieldLabel>
            <TextInput value={c.side2Names} onChange={(v) => updateContent({ side2Names: v })} />
          </div>
        </div>
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function TimelineStep({ items, update, activeLang, bg, setBg }) {
  const setItem = (id, patch) => update(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const setLabel = (id, v) => update(items.map((it) => (it.id === id ? { ...it, label: { ...it.label, [activeLang]: v } } : it)));
  const removeItem = (id) => update(items.filter((it) => it.id !== id));
  const addItem = () => update([...items, { id: uid(), icon: "sparkles", time: "", label: { en: "New moment", ar: "", fr: "", es: "" } }]);

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-3" style={{ background: INK_3 }}>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {Object.entries(TIMELINE_ICONS).map(([key, { icon: Icon }]) => (
                  <button key={key} onClick={() => setItem(item.id, { icon: key })} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: item.icon === key ? GOLD : "transparent", border: `1px solid ${item.icon === key ? GOLD : "rgba(147,166,155,0.3)"}` }}>
                    <Icon size={13} color={item.icon === key ? INK : MUTED} />
                  </button>
                ))}
              </div>
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}>
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <TextInput value={item.label[activeLang] || ""} onChange={(v) => setLabel(item.id, v)} placeholder={`Event name (${LANG_META[activeLang].short})`} />
              </div>
              <TextInput value={item.time} onChange={(v) => setItem(item.id, { time: v })} placeholder="4:00 PM" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}>
          <Plus size={13} /> Add timeline event
        </GhostButton>
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function LocationsStep({ items, update, activeLang, bg, setBg }) {
  const setItem = (id, patch) => update(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const setTitle = (id, v) => update(items.map((it) => (it.id === id ? { ...it, title: { ...it.title, [activeLang]: v } } : it)));
  const removeItem = (id) => update(items.filter((it) => it.id !== id));
  const addItem = () => update([...items, { id: uid(), time: "", address: "", title: { en: "New location", ar: "", fr: "", es: "" } }]);

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-3" style={{ background: INK_3 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <TextInput value={item.title[activeLang] || ""} onChange={(v) => setTitle(item.id, v)} placeholder={`Venue title (${LANG_META[activeLang].short})`} />
              </div>
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}>
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <TextInput value={item.address} onChange={(v) => setItem(item.id, { address: v })} placeholder="Address, for Get Directions" />
              </div>
              <TextInput value={item.time} onChange={(v) => setItem(item.id, { time: v })} placeholder="Time" />
            </div>
            {item.address && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                <Navigation2 size={10} /> Opens in Google Maps
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}>
          <Plus size={13} /> Add location
        </GhostButton>
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function CountdownStep({ schedule, setSchedule, bg, setBg }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Event date</FieldLabel>
          <TextInput type="date" value={schedule.date} onChange={(v) => setSchedule({ date: v })} />
        </div>
        <div>
          <FieldLabel>Event time</FieldLabel>
          <TextInput type="time" value={schedule.time} onChange={(v) => setSchedule({ time: v })} />
        </div>
      </div>
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Date and time are shared across every language, and also drive the RSVP page.
      </p>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function RsvpStep({ c, updateContent, bg, setBg, rsvpSettings, updateRsvpSettings }) {
  return (
    <div>
      <FieldLabel>RSVP style</FieldLabel>
      <div className="flex gap-3">
        <button
          onClick={() => updateRsvpSettings({ style: "classic" })}
          className="flex-1 rounded-xl p-3 text-left"
          style={{ background: INK_3, border: `1.5px solid ${rsvpSettings.style === "classic" ? GOLD : "rgba(147,166,155,0.25)"}` }}
        >
          <div className="mb-1.5 text-[9px] font-semibold uppercase" style={{ color: GOLD_SOFT, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Classic</div>
          <div className="rounded-lg p-2" style={{ background: PAPER }}>
            <div className="text-center text-[9px] font-semibold" style={{ color: EMERALD, fontFamily: FONT_DISPLAY }}>RSVP</div>
            <div className="mx-auto my-1 h-px w-6" style={{ background: GOLD }} />
            <div className="flex justify-center gap-1">
              <span className="rounded-full px-1.5 py-0.5 text-[6.5px]" style={{ border: `1px solid ${EMERALD}`, color: EMERALD, fontFamily: FONT_BODY }}>○ Attending</span>
              <span className="rounded-full px-1.5 py-0.5 text-[6.5px]" style={{ border: `1px solid ${EMERALD}`, color: EMERALD, fontFamily: FONT_BODY }}>○ Not</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => updateRsvpSettings({ style: "stacked" })}
          className="flex-1 rounded-xl p-3 text-left"
          style={{ background: INK_3, border: `1.5px solid ${rsvpSettings.style === "stacked" ? GOLD : "rgba(147,166,155,0.25)"}` }}
        >
          <div className="mb-1.5 text-[9px] font-semibold uppercase" style={{ color: GOLD_SOFT, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Stacked</div>
          <div className="rounded-lg p-2" style={{ background: EMERALD }}>
            <div className="text-center text-[9px] italic" style={{ color: PAPER, fontFamily: FONT_SCRIPT }}>Be Our Guest</div>
            <div className="mt-1 space-y-1">
              <div className="rounded-full py-0.5 text-center text-[6.5px]" style={{ border: `1px solid ${PAPER}`, color: PAPER, fontFamily: FONT_BODY }}>Yes</div>
              <div className="rounded-full py-0.5 text-center text-[6.5px]" style={{ border: `1px solid ${PAPER}`, color: PAPER, fontFamily: FONT_BODY }}>No</div>
            </div>
          </div>
        </button>
      </div>

      <Divider />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>"Attending" button label</FieldLabel>
          <TextInput value={c.yesLabel} onChange={(v) => updateContent({ yesLabel: v })} />
        </div>
        <div>
          <FieldLabel>"Can't attend" button label</FieldLabel>
          <TextInput value={c.noLabel} onChange={(v) => updateContent({ noLabel: v })} />
        </div>
      </div>
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Button wording is per language; the event date lives on the Countdown page.
      </p>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

// Shared editor panel for pages that link out to a separately-hosted backend
// (DJ Requests, Guest Networking) — this app can't run those live itself
// (they need a real server + database for multi-guest real-time sync), so
// this page is just a nicely designed doorway to wherever you've deployed
// that project.
function SecureStreamUrlSetter({ slug }) {
  const [rememberedSecret] = useState(() => (typeof window !== "undefined" ? window.localStorage.getItem("einvite:owner-secret") || "" : "")); // read once on mount, never reassigned — safe to use as an effect dependency without re-firing per keystroke
  const [ownerSecret, setOwnerSecret] = useState(rememberedSecret); // the actual input field's editable value
  const [embedUrl, setEmbedUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | saving | saved | error
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // If this browser already remembers an owner code, automatically load
  // what's currently saved — this is what actually fixes "the field always
  // looks empty after a refresh." Still gated by the same code as writing,
  // so this doesn't weaken the security model at all.
  useEffect(() => {
    if (!rememberedSecret || !slug) return;
    let cancelled = false;
    setStatus("loading");
    fetch(`${EDGE_FUNCTIONS_URL}/get-stream-secret-for-owner`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ invitationSlug: slug, ownerSecret: rememberedSecret }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          console.error(`get-stream-secret-for-owner failed (${res.status}) for slug "${slug}":`, data.error);
          setError(`Couldn't load the saved link: ${data.error || `status ${res.status}`}`);
          setStatus("idle");
          return;
        }
        if (data.embedUrl) { setEmbedUrl(data.embedUrl); setLastUpdated(data.updatedAt); }
        else { console.log(`No stream secret saved yet for slug "${slug}".`); } // legitimately empty, not an error — nothing saved for this invitation yet
        setStatus("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("get-stream-secret-for-owner threw:", err);
        setError("Couldn't reach the server to load the saved link — check your connection.");
        setStatus("idle");
      });
    return () => { cancelled = true; };
  }, [slug, rememberedSecret]); // rememberedSecret never changes after mount, so this effectively only re-fires when slug itself settles to its real, final value — see the guest-detection fix elsewhere in this file for why that timing matters

  const save = async () => {
    if (!embedUrl.trim()) { setError("Enter the real stream URL first."); return; }
    setStatus("saving");
    setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTIONS_URL}/set-stream-secret`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify({ invitationSlug: slug, embedUrl: embedUrl.trim(), ownerSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save.");
      window.localStorage.setItem("einvite:owner-secret", ownerSecret); // remember it now that we know it's correct
      setStatus("saved");
      setLastUpdated(new Date().toISOString());
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  return (
    <div className="rounded-lg p-3" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}>
      <div className="mb-1.5 flex items-center justify-between">
        <FieldLabel>Real stream URL (kept hidden — never shown to guests directly)</FieldLabel>
        {status === "loading" && <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Loading current value…</span>}
      </div>
      <TextInput value={embedUrl} onChange={setEmbedUrl} placeholder="https://youtube.com/watch?v=… or the actual private stream link" />
      {lastUpdated && <p className="mt-1 text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Currently saved — last updated {new Date(lastUpdated).toLocaleString()}</p>}
      <div className="mt-2">
        <FieldLabel>Owner access code</FieldLabel>
        <TextInput value={ownerSecret} onChange={setOwnerSecret} placeholder="Set by whoever deployed this (see paid-stream-backend setup)" />
        <p className="mt-1 text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          Remembered on this device after a successful save — you won't need to retype it here every time. A basic safeguard for now, not full per-client security — see the honest note in set-stream-secret's own code.
        </p>
      </div>
      {error && <p className="mt-2 text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
      <GhostButton onClick={save} active={status === "saved"}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save hidden stream URL"}
      </GhostButton>
    </div>
  );
}

function NetworkingPanel({ heading, setHeading, subtitle, setSubtitle, buttonLabel, setButtonLabel, bg, setBg }) {
  return (
    <div>
      <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(201,164,76,0.08)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <p className="text-[11.5px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
          Built directly into eInvite.me now — no separate project to deploy, no link to paste. Guests tap the button on this page to register, browse a match-sorted list of other opted-in guests, send connection requests, and message once connected — all within your invitation's own domain.
        </p>
      </div>
      <FieldLabel>Heading</FieldLabel>
      <TextInput value={heading} onChange={setHeading} placeholder="Meet the Other Guests" />
      <div className="mt-3">
        <FieldLabel>Subtitle</FieldLabel>
        <TextInput value={subtitle} onChange={setSubtitle} placeholder="Discover guests who share your interests, and connect right from your phone." />
      </div>
      <div className="mt-3">
        <FieldLabel>Button text</FieldLabel>
        <TextInput value={buttonLabel} onChange={setButtonLabel} placeholder="Open Guest Networking" />
      </div>
      <div className="mt-4">
        <BackgroundPicker bg={bg} onChange={setBg} />
      </div>
    </div>
  );
}

function DjRequestsPanel({ heading, setHeading, subtitle, setSubtitle, bg, setBg, dashboardUrl, slug }) {
  const [copied, setCopied] = useState(false);
  const [pendingCount, setPendingCount] = useState(null);
  const [checking, setChecking] = useState(false);

  const copyLink = async () => {
    const ok = await copyToClipboard(dashboardUrl);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkPending = async () => {
    setChecking(true);
    const rows = await getSongRequests(slug);
    setPendingCount(rows.filter((r) => r.status === "pending").length);
    setChecking(false);
  };

  return (
    <div>
      <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(201,164,76,0.08)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <p className="text-[11.5px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
          Built directly into eInvite.me now — no separate project to deploy. Guests fill in a song request right on this page, and it's saved instantly. Share the dashboard link below with your DJ so they can see requests come in live.
        </p>
      </div>

      <FieldLabel>DJ Dashboard link (private — for the DJ only)</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="flex-1 truncate rounded-lg px-3 py-2 text-[12px]" style={{ background: INK_3, color: GOLD_SOFT, fontFamily: FONT_BODY }}>{dashboardUrl}</div>
        <GhostButton onClick={copyLink}>{copied ? "Copied ✓" : <><Copy size={12} /> Copy</>}</GhostButton>
      </div>
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Don't post this publicly — anyone with this link can see and manage requests. Send it directly to your DJ.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: INK_3 }}>
        <span className="text-[11.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
          {pendingCount === null ? "Check for pending requests" : `${pendingCount} pending request${pendingCount === 1 ? "" : "s"}`}
        </span>
        <GhostButton onClick={checkPending}>{checking ? "Checking…" : "Check now"}</GhostButton>
      </div>

      <div className="mt-4">
        <FieldLabel>Heading</FieldLabel>
        <TextInput value={heading} onChange={setHeading} placeholder="Song Requests" />
      </div>
      <div className="mt-3">
        <FieldLabel>Subtitle</FieldLabel>
        <TextInput value={subtitle} onChange={setSubtitle} placeholder="Have a song you want to hear tonight? Send it straight to the DJ." />
      </div>
      <div className="mt-4">
        <BackgroundPicker bg={bg} onChange={setBg} />
      </div>
    </div>
  );
}

function IntegrationStep({ label, helpText, projectHint, url, setUrl, buttonLabel, setButtonLabel, heading, setHeading, subtitle, setSubtitle, bg, setBg, dashboardFileName, dashboardLabel, guestFileName = "guest.html", placeholderUrl, urlHelpText }) {
  const [copied, setCopied] = useState(false);
  const dashboardUrl = dashboardFileName && url && url.includes(guestFileName) ? url.replace(guestFileName, dashboardFileName) : "";

  const copyDashboardLink = async () => {
    const ok = await copyToClipboard(dashboardUrl);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(201,164,76,0.08)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <p className="text-[11.5px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{helpText}</p>
      </div>
      <FieldLabel>{label} link (for guests)</FieldLabel>
      <TextInput value={url} onChange={setUrl} placeholder={placeholderUrl || `https://your-${projectHint}.example.com/${guestFileName}?event=${'{'}your-slug${'}'}`} />
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        {urlHelpText || "Paste the live URL once it's deployed. Until then, the button on this page stays disabled for guests."}
      </p>

      {dashboardFileName && (
        <div className="mt-3">
          <FieldLabel>{dashboardLabel} link (private — for you only)</FieldLabel>
          {dashboardUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg px-3 py-2 text-[11.5px]" style={{ background: INK_3, color: GOLD_SOFT, fontFamily: FONT_BODY }}>{dashboardUrl}</div>
              <button onClick={copyDashboardLink} title="Copy" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: INK_3, color: copied ? GOLD_SOFT : IVORY }}>
                <Copy size={13} />
              </button>
            </div>
          ) : (
            <p className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              Enter the {guestFileName} link above first — the {dashboardLabel.toLowerCase()} link is derived from it automatically. Don't share this one with guests.
            </p>
          )}
        </div>
      )}

      <div className="mt-3">
        <FieldLabel>Heading</FieldLabel>
        <TextInput value={heading} onChange={setHeading} />
      </div>
      <div className="mt-3">
        <FieldLabel>Subtitle</FieldLabel>
        <TextArea value={subtitle} onChange={setSubtitle} rows={2} />
      </div>
      <div className="mt-3">
        <FieldLabel>Button text</FieldLabel>
        <TextInput value={buttonLabel} onChange={setButtonLabel} />
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function RegistryStep({ items, update, activeLang, bg, setBg }) {
  const setItem = (id, patch) => update(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id) => update(items.filter((it) => it.id !== id));
  const addItem = () => update([...items, { id: uid(), label: "New registry", url: "", note: "" }]);

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-3" style={{ background: INK_3 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <TextInput value={item.label} onChange={(v) => setItem(item.id, { label: v })} placeholder="Registry name" />
              </div>
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}>
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2">
              <TextInput value={item.url} onChange={(v) => setItem(item.id, { url: v })} placeholder="https://... (leave blank for a note instead, e.g. bank details)" />
            </div>
            {!item.url && (
              <div className="mt-2">
                <TextInput value={item.note} onChange={(v) => setItem(item.id, { note: v })} placeholder="e.g. IBAN or a short note, shown instead of a link" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}>
          <Plus size={13} /> Add registry
        </GhostButton>
      </div>
      <p className="mt-3 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Registry names and notes are shared across every language.
      </p>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Draggable text block (Canva-style)                                      */
/* ---------------------------------------------------------------------- */

function DraggableBlock({ id, pos, editMode, onMove, label, light, children, selected, onSelect, noMaxWidth, widthPercent, maxHeightPercent }) {
  const ref = useRef(null);
  const draggingRef = useRef(false);

  const computeFromPoint = (clientX, clientY) => {
    const parent = ref.current?.parentElement;
    if (!parent) return null;
    const rect = parent.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    // Blocks with a known width-as-percent (images) get clamped by their
    // actual size, so the block always stays fully inside the frame — a
    // full-width image can only ever sit dead center, a half-width one only
    // gets halfway to each edge, etc. Text blocks (no widthPercent) keep the
    // old fixed margin.
    if (widthPercent) {
      x = clampXForImageWidth(x, widthPercent);
    } else {
      x = Math.min(92, Math.max(8, x));
    }
    y = Math.min(88, Math.max(6, y));
    return { x, y };
  };

  // Mouse / stylus via Pointer Events.
  const handleDown = (e) => {
    if (!editMode || e.pointerType === "touch") return;
    e.stopPropagation();
    onSelect?.();
    draggingRef.current = true;
    e.target.setPointerCapture?.(e.pointerId);
  };
  const handleMove = (e) => {
    if (!editMode || !draggingRef.current || e.pointerType === "touch") return;
    const next = computeFromPoint(e.clientX, e.clientY);
    if (next) onMove(next);
  };
  const handleUp = (e) => {
    if (e.pointerType === "touch") return;
    draggingRef.current = false;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  // Keep latest callbacks in refs so the touch-listener effect below doesn't need to
  // depend on them — onMove changes identity on every position update, and depending
  // on it would tear down and rebuild the touch listeners mid-drag on every frame.
  const onMoveRef = useRef(onMove);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onMoveRef.current = onMove; onSelectRef.current = onSelect; });

  // Touch via native listeners, attached non-passive so preventDefault reliably stops
  // the page from scrolling instead of the block — React's synthetic touch handlers
  // are passive by default and silently ignore preventDefault on mobile browsers.
  useEffect(() => {
    const el = ref.current;
    if (!el || !editMode) return;
    const onStart = (e) => {
      e.stopPropagation();
      onSelectRef.current?.();
      draggingRef.current = true;
    };
    const onMoveTouch = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const next = computeFromPoint(t.clientX, t.clientY);
      if (next) onMoveRef.current(next);
    };
    const onEnd = () => { draggingRef.current = false; };
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMoveTouch, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: false });
    el.addEventListener("touchcancel", onEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMoveTouch);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [editMode]);

  // Clamped here (not just during dragging) so an already-saved position from
  // before this safe zone existed is corrected automatically the moment it's
  // displayed — this is what actually fixes old saved data, not just future
  // drags. 88 keeps any block clear of the swipe-up hint's zone at the bottom.
  const safeY = Math.min(pos.y, 88);

  return (
    <div
      ref={ref}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${safeY}%`,
        transform: "translate(-50%, -50%)",
        width: widthPercent ? `${widthPercent}%` : undefined,
        maxHeight: maxHeightPercent ? `${maxHeightPercent}%` : undefined,
        boxSizing: "border-box",
        maxWidth: noMaxWidth ? "none" : "88%",
        cursor: editMode ? "grab" : "default",
        touchAction: editMode ? "none" : "auto",
        outline: editMode ? `${selected ? 2 : 1.5}px ${selected ? "solid" : "dashed"} ${selected ? GOLD : light ? "rgba(244,237,228,0.65)" : "rgba(36,70,61,0.5)"}` : "none",
        outlineOffset: 6,
        borderRadius: 10,
        padding: editMode ? 4 : 0,
        userSelect: editMode ? "none" : "auto",
        zIndex: editMode ? (selected ? 31 : 30) : 1,
      }}
    >
      {editMode && (
        <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-semibold" style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}>
          <Move size={8} /> {label}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Preview: slide contents                                                 */
/* ---------------------------------------------------------------------- */

function useCountdown(date, time) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = useMemo(() => {
    if (!date) return null;
    const d = new Date(`${date}T${time || "00:00"}`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }, [date, time]);
  if (!target) return null;
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60, passed: diff <= 0 };
}

function CustomTextBlock({ block, light, editMode, selected, onSelect, onMove, onDelete }) {
  const [editingText, setEditingText] = useState(false);
  const [draft, setDraft] = useState(block.text || "");

  const bump = (field, delta, min, max, base) => {
    const current = block[field] ?? base;
    const newValue = Math.max(min, Math.min(max, current + delta));
    if (field === "width") {
      onMove({ width: newValue, x: clampXForImageWidth(block.x ?? 50, newValue) });
    } else {
      onMove({ [field]: newValue });
    }
  };

  const commitText = () => {
    onMove({ text: draft });
    setEditingText(false);
  };

  const toolbar = editMode && selected && (
    <div
      className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1"
      style={{ bottom: "calc(100% + 16px)", background: INK, border: `1px solid ${GOLD}` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {block.type === "image" ? (
        <>
          <button onClick={() => bump("width", -5, 10, 100, 40)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.width || 40}%</span>
          <button onClick={() => bump("width", 5, 10, 100, 40)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
          <button onClick={() => onMove({ width: 100, x: 50 })} title="Fill the full screen width" className="px-1 text-[9.5px] font-bold uppercase" style={{ color: GOLD_SOFT }}>Fill</button>
        </>
      ) : (
        <>
          <button onClick={() => bump("fontSize", -2, 8, 72, 16)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.fontSize || 16}px</span>
          <button onClick={() => bump("fontSize", 2, 8, 72, 16)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
          <button onClick={() => { setDraft(block.text || ""); setEditingText(true); }} title="Edit text" style={{ color: GOLD_SOFT }}><Pencil size={11} /></button>
        </>
      )}
      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
      <button onClick={onDelete} title="Delete" style={{ color: "#E29B9B" }}><Trash2 size={12} /></button>
    </div>
  );

  if (block.type === "image") {
    const img = (
      <img
        src={block.url}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 8 }}
      />
    );
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom image" light={light} selected={selected} onSelect={onSelect} noMaxWidth widthPercent={block.width || 40} maxHeightPercent={PHONE_IMAGE_MAX_HEIGHT_PCT}>
        {toolbar}
        {!editMode && block.linkUrl ? (
          <a href={block.linkUrl} target="_blank" rel="noreferrer">{img}</a>
        ) : (
          img
        )}
      </DraggableBlock>
    );
  }
  return (
    <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom text" light={light} selected={selected} onSelect={onSelect}>
      {toolbar}
      {editingText ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); } }}
          onPointerDown={(e) => e.stopPropagation()}
          className="resize-none text-center outline-none"
          rows={2}
          style={{
            width: 140,
            fontFamily: block.fontFamily || FONT_BODY,
            color: block.color || (light ? PAPER : EMERALD),
            fontSize: `${block.fontSize || 16}px`,
            lineHeight: 1.4,
            background: "rgba(0,0,0,0.25)",
            borderRadius: 6,
          }}
        />
      ) : (
        <p
          className="text-center"
          style={{
            fontFamily: block.fontFamily || (light ? FONT_BODY : FONT_BODY),
            color: block.color || (light ? PAPER : EMERALD),
            fontSize: `${block.fontSize || 16}px`,
            lineHeight: 1.4,
          }}
        >
          {block.text || "New text"}
        </p>
      )}
    </DraggableBlock>
  );
}

function StoryPage({ bg, children }) {
  const isPhoto = bg.mode === "photo";
  const background = isPhoto ? (bg.image ? `url(${bg.image}) center/cover` : BG_PRESETS[bg.preset].css) : PAPER;
  // "darken" (0-100) sets the strength of the bottom stop; top/mid scale with it
  // at the same ratios as the original fixed overlay, so 55 looks identical to before.
  const amount = (bg.darken ?? 55) / 100;
  const overlay = `linear-gradient(180deg, rgba(10,12,10,${(amount * 0.636).toFixed(2)}) 0%, rgba(10,12,10,${(amount * 0.273).toFixed(2)}) 40%, rgba(10,12,10,${amount.toFixed(2)}) 100%)`;
  return (
    <div className="relative h-full w-full" style={{ background }}>
      {isPhoto && amount > 0 && <div className="absolute inset-0" style={{ background: overlay }} />}
      <div className="relative z-10 h-full w-full">{children(isPhoto)}</div>
    </div>
  );
}

function CoverSlide({ content, bg, fontDisplay, fontScript, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const namesStyle = layout.names;
  const introStyle = layout.intro;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="names" pos={namesStyle} editMode={editMode} onMove={(p) => onMoveBlock("names", p)} label="Names" light={light} selected={selectedBlock === "names"} onSelect={() => onSelectBlock("names")}>
            <div className="text-center">
              <div style={{ fontFamily: namesStyle.fontFamily || fontScript, fontSize: namesStyle.fontSize ? `${namesStyle.fontSize}px` : 40, color: namesStyle.color || (light ? PAPER : EMERALD), lineHeight: 1.1 }}>
                {content.name1 || "—"} <span style={{ color: light ? GOLD_SOFT : ROSE }}>&amp;</span> {content.name2 || "—"}
              </div>
            </div>
          </DraggableBlock>
          <DraggableBlock id="intro" pos={introStyle} editMode={editMode} onMove={(p) => onMoveBlock("intro", p)} label="Intro" light={light} selected={selectedBlock === "intro"} onSelect={() => onSelectBlock("intro")}>
            <p className="text-center italic leading-relaxed" style={{ color: introStyle.color || (light ? "rgba(244,237,228,0.85)" : EMERALD), fontFamily: introStyle.fontFamily || fontDisplay, fontSize: introStyle.fontSize ? `${introStyle.fontSize}px` : 12.5 }}>
              {content.intro}
            </p>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function FamilySlide({ content, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const gs = layout.greeting, qs = layout.quote, ns = layout.names;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="greeting" pos={gs} editMode={editMode} onMove={(p) => onMoveBlock("greeting", p)} label="Greeting" light={light} selected={selectedBlock === "greeting"} onSelect={() => onSelectBlock("greeting")}>
            <div className="text-center">
              <p style={{ fontFamily: gs.fontFamily || fontDisplay, fontStyle: "italic", fontSize: gs.fontSize ? `${gs.fontSize}px` : 16, color: gs.color || (light ? PAPER : EMERALD), lineHeight: 1.5 }}>{content.greeting}</p>
            </div>
          </DraggableBlock>
          {(content.quote || editMode) && (
            <DraggableBlock id="quote" pos={qs} editMode={editMode} onMove={(p) => onMoveBlock("quote", p)} label="Quote" light={light} selected={selectedBlock === "quote"} onSelect={() => onSelectBlock("quote")}>
              <p className="text-center italic" style={{ color: qs.color || (light ? GOLD_SOFT : ROSE), fontFamily: qs.fontFamily || fontDisplay, fontSize: qs.fontSize ? `${qs.fontSize}px` : 12 }}>
                {content.quote ? `“${content.quote}”` : "Add a verse or quote in the editor"}
              </p>
            </DraggableBlock>
          )}
          <DraggableBlock id="names" pos={ns} editMode={editMode} onMove={(p) => onMoveBlock("names", p)} label="Family names" light={light} selected={selectedBlock === "names"} onSelect={() => onSelectBlock("names")}>
            <div className="grid grid-cols-2 gap-4" style={{ width: 220 }}>
              {[{ title: content.side1Title, names: content.side1Names }, { title: content.side2Title, names: content.side2Names }].map((side, i) => (
                <div key={i} className="text-center">
                  <div className="text-[9.5px] font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.1em", fontFamily: FONT_BODY }}>{side.title}</div>
                  <div className="mt-1" style={{ color: ns.color || (light ? PAPER : EMERALD), fontFamily: ns.fontFamily || fontDisplay, fontSize: ns.fontSize ? `${ns.fontSize}px` : 13 }}>{side.names}</div>
                </div>
              ))}
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function TimelineSlide({ items, lang, bg, fontDisplay, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const hs = layout.heading, ls = layout.list;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center font-semibold uppercase" style={{ color: hs.color || (light ? GOLD_SOFT : ROSE), letterSpacing: "0.15em", fontFamily: hs.fontFamily || FONT_BODY, fontSize: hs.fontSize ? `${hs.fontSize}px` : 10 }}>{t.orderOfDay}</div>
          </DraggableBlock>
          <DraggableBlock id="list" pos={ls} editMode={editMode} onMove={(p) => onMoveBlock("list", p)} label="Timeline" light={light} selected={selectedBlock === "list"} onSelect={() => onSelectBlock("list")}>
            <div className="relative" style={{ width: 210 }}>
              <div className="absolute bottom-2 left-[13px] top-2 w-px" style={{ background: light ? "rgba(255,255,255,0.25)" : "rgba(36,70,61,0.25)" }} />
              <div className="space-y-5">
                {items.map((item) => {
                  const Icon = TIMELINE_ICONS[item.icon]?.icon || Sparkles;
                  return (
                    <div key={item.id} className="relative flex items-center gap-3">
                      <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: light ? GOLD : EMERALD }}>
                        <Icon size={13} color={light ? INK : PAPER} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: ls.color || (light ? PAPER : EMERALD), fontFamily: ls.fontFamily || fontDisplay, fontSize: ls.fontSize ? `${ls.fontSize}px` : 13 }}>{item.label[lang] || item.label.en}</div>
                        <div className="text-[11px]" style={{ color: light ? GOLD_SOFT : ROSE, fontFamily: FONT_BODY }}>{item.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function LocationsSlide({ items, lang, bg, fontDisplay, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const hs = layout.heading, ls = layout.list;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center font-semibold uppercase" style={{ color: hs.color || (light ? GOLD_SOFT : ROSE), letterSpacing: "0.15em", fontFamily: hs.fontFamily || FONT_BODY, fontSize: hs.fontSize ? `${hs.fontSize}px` : 10 }}>{t.celebration}</div>
          </DraggableBlock>
          <DraggableBlock id="list" pos={ls} editMode={editMode} onMove={(p) => onMoveBlock("list", p)} label="Locations" light={light} selected={selectedBlock === "list"} onSelect={() => onSelectBlock("list")}>
            <div className="flex flex-col gap-3" style={{ width: 232 }}>
              {items.map((loc) => (
                <div key={loc.id} className="rounded-xl p-3" style={{ background: light ? "rgba(255,255,255,0.12)" : PAPER_2, backdropFilter: light ? "blur(3px)" : "none" }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium" style={{ color: ls.color || (light ? PAPER : EMERALD), fontFamily: ls.fontFamily || fontDisplay, fontSize: ls.fontSize ? `${ls.fontSize}px` : 13 }}>{loc.title[lang] || loc.title.en}</div>
                    <span className="text-[10.5px]" style={{ color: light ? GOLD_SOFT : ROSE, fontFamily: FONT_BODY }}>{loc.time}</span>
                  </div>
                  {loc.address && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, fontFamily: FONT_BODY }}>
                      <Navigation2 size={10} /> {t.directions}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function CountdownSlide({ schedule, bg, fontDisplay, fontScript, t, locale, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const cd = useCountdown(schedule.date, schedule.time);
  const hs = layout.heading, cs = layout.countdown;
  const formattedDate = useMemo(() => {
    if (!schedule.date) return "";
    const d = new Date(`${schedule.date}T${schedule.time || "00:00"}`);
    if (isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }); } catch { return ""; }
  }, [schedule, locale]);

  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY }}>{t.countingDownTo}</div>
              <div style={{ fontFamily: hs.fontFamily || fontScript, fontSize: hs.fontSize ? `${hs.fontSize}px` : 26, color: hs.color || (light ? PAPER : EMERALD), margin: "4px 0 4px" }}>{t.celebrationWord}</div>
              {formattedDate && <div className="text-[10.5px]" style={{ color: light ? "rgba(244,237,228,0.75)" : ROSE, fontFamily: FONT_BODY }}>{formattedDate}</div>}
            </div>
          </DraggableBlock>
          <DraggableBlock id="countdown" pos={cs} editMode={editMode} onMove={(p) => onMoveBlock("countdown", p)} label="Countdown" light={light} selected={selectedBlock === "countdown"} onSelect={() => onSelectBlock("countdown")}>
            {cd && !cd.passed ? (
              <div className="flex gap-2.5">
                {[[t.days, cd.days], [t.hrs, cd.hours], [t.min, cd.mins], [t.sec, cd.secs]].map(([label, val], i) => (
                  <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: light ? "rgba(255,255,255,0.14)" : EMERALD, minWidth: 44 }}>
                    <div style={{ fontFamily: cs.fontFamily || fontDisplay, fontSize: cs.fontSize ? `${cs.fontSize}px` : 18, color: cs.color || PAPER }}>{String(val).padStart(2, "0")}</div>
                    <div className="text-[8.5px] uppercase" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, letterSpacing: "0.08em" }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: light ? PAPER : EMERALD, fontFamily: fontDisplay, fontStyle: "italic" }}>{t.celebrationBegun}</p>
            )}
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function RsvpSlide({ content, bg, fontDisplay, fontScript, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, rsvpSettings, totalAttending, onSubmitRsvp, siteDomain, slug }) {
  const hs = layout.heading, bs = layout.buttons;
  const style = rsvpSettings.style || "classic";
  const [choice, setChoice] = useState(null);
  const [name, setName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [checkinToken, setCheckinToken] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalGuestCount, setModalGuestCount] = useState(1);
  const [confirmedNames, setConfirmedNames] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [modalError, setModalError] = useState("");

  const nameNeeded = choice === "yes" ? rsvpSettings.namesRequired : choice === "no" && rsvpSettings.namesRequiredWhenDeclining;
  const isFull = rsvpSettings.maxTotalRsvps > 0 && totalAttending >= rsvpSettings.maxTotalRsvps;

  const submit = async () => {
    if (nameNeeded && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setSubmitted(true); // show the confirmation immediately — the QR code appears a moment later once the token comes back, rather than making the guest wait on a network call before seeing anything
    const token = await onSubmitRsvp({ status: choice, names: name.trim() ? [name.trim()] : [], additionalGuests: choice === "yes" ? Math.max(0, guestCount - (name.trim() ? 1 : 0)) : 0 });
    if (token) setCheckinToken(token);
  };

  const openGuestModal = () => {
    if (isFull) return;
    setChoice("yes");
    setModalGuestCount(1);
    setConfirmedNames([]);
    setSkipped(0);
    setNameInput("");
    setModalError("");
    setShowModal(true);
  };

  const accountedFor = confirmedNames.length + skipped;
  const commitName = () => {
    if (nameInput.trim()) {
      setConfirmedNames((n) => [...n, nameInput.trim()]);
      setNameInput("");
      setModalError("");
    } else if (!rsvpSettings.namesRequired) {
      setSkipped((s) => s + 1);
    } else {
      setModalError("Please enter a name, or make names optional in Settings.");
    }
  };

  const confirmModal = async () => {
    if (rsvpSettings.namesRequired && confirmedNames.length < modalGuestCount) {
      setModalError("Please name every guest before saving.");
      return;
    }
    setShowModal(false);
    setSubmitted(true);
    const token = await onSubmitRsvp({ status: "yes", names: confirmedNames, additionalGuests: Math.max(0, modalGuestCount - confirmedNames.length) });
    if (token) setCheckinToken(token);
  };

  const guestStepper = (light) => (
    <div className="flex items-center justify-between rounded-full px-3 py-1.5" style={{ background: light ? "rgba(255,255,255,0.1)" : PAPER_2 }}>
      <span className="text-[10.5px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY }}>Number of attending</span>
      <div className="flex items-center gap-2">
        <button onClick={() => setGuestCount((c) => Math.max(1, c - 1))} style={{ color: light ? PAPER : EMERALD }}><ChevronDown size={13} /></button>
        <span className="text-[12px] font-semibold" style={{ color: light ? PAPER : EMERALD, fontFamily: FONT_BODY }}>{guestCount}</span>
        <button onClick={() => setGuestCount((c) => Math.min(rsvpSettings.maxGuestsOpenInvite, c + 1))} style={{ color: light ? PAPER : EMERALD }}><ChevronUp size={13} /></button>
      </div>
    </div>
  );

  const nameField = (light) => (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder={nameNeeded ? "Your name *" : "Your name (optional)"}
      className="w-full rounded-full px-3 py-2 text-center text-[12px] outline-none"
      style={{ background: light ? "rgba(255,255,255,0.12)" : PAPER_2, color: light ? PAPER : EMERALD, fontFamily: FONT_BODY }}
    />
  );

  const thankYou = (light) => (
    <div className="text-center">
      <CheckCircle2 size={22} color={light ? PAPER : EMERALD} style={{ margin: "0 auto 6px" }} />
      <p style={{ color: light ? PAPER : EMERALD, fontFamily: fontDisplay, fontStyle: "italic", fontSize: 14 }}>Thank you for your response!</p>
      {rsvpSettings.showTotalAttending && (
        <p className="mt-2 text-[11.5px]" style={{ color: light ? GOLD_SOFT : ROSE, fontFamily: FONT_BODY }}>
          {totalAttending} {totalAttending === 1 ? "person is" : "people are"} coming so far
        </p>
      )}
      {checkinToken && (
        <div className="mt-4">
          <img
            src={qrCodeImageUrl(`https://${siteDomain}/checkin/${checkinToken}`, 150)}
            alt="Check-in QR code"
            style={{ width: 130, height: 130, margin: "0 auto", borderRadius: 10, background: "#fff", padding: 6 }}
          />
          <p className="mt-2 text-[10px]" style={{ color: light ? "rgba(244,237,228,0.75)" : "rgba(36,70,61,0.7)", fontFamily: FONT_BODY, maxWidth: 200, margin: "6px auto 0" }}>
            Save this — show it at the door for quick check-in
          </p>
        </div>
      )}
    </div>
  );

  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            {style === "stacked" ? (
              <p className="text-center" style={{ fontFamily: hs.fontFamily || fontScript, fontSize: hs.fontSize ? `${hs.fontSize}px` : 28, color: hs.color || (light ? PAPER : EMERALD) }}>
                Be Our Guest
              </p>
            ) : (
              <div className="text-center">
                <div className="font-semibold" style={{ fontFamily: hs.fontFamily || fontDisplay, fontSize: hs.fontSize ? `${hs.fontSize}px` : 22, color: hs.color || (light ? PAPER : EMERALD) }}>RSVP</div>
                <div className="mx-auto my-1.5 h-px w-10" style={{ background: light ? GOLD_SOFT : GOLD }} />
                <p className="italic" style={{ fontFamily: fontDisplay, fontSize: 12, color: light ? "rgba(244,237,228,0.85)" : ROSE }}>{t.rsvpHeading}</p>
              </div>
            )}
          </DraggableBlock>

          <DraggableBlock id="buttons" pos={bs} editMode={editMode} onMove={(p) => onMoveBlock("buttons", p)} label="RSVP form" light={light} selected={selectedBlock === "buttons"} onSelect={() => onSelectBlock("buttons")}>
            <div style={{ width: 230 }}>
              {submitted ? (
                thankYou(light)
              ) : style === "stacked" ? (
                <>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={openGuestModal}
                      disabled={isFull}
                      className="rounded-full py-2.5 text-[12px] font-semibold"
                      style={
                        isFull
                          ? { background: "transparent", color: light ? "rgba(244,237,228,0.35)" : "rgba(36,70,61,0.35)", border: `1.5px solid ${light ? "rgba(244,237,228,0.25)" : "rgba(36,70,61,0.2)"}`, fontFamily: FONT_BODY }
                          : choice === "yes"
                          ? { background: light ? GOLD : EMERALD, color: light ? INK : PAPER, fontFamily: FONT_BODY }
                          : { background: "transparent", color: light ? PAPER : EMERALD, border: `1.5px solid ${light ? "rgba(244,237,228,0.6)" : EMERALD}`, fontFamily: FONT_BODY }
                      }
                    >
                      {isFull ? "Fully booked" : content.yesLabel}
                    </button>
                    <button
                      onClick={() => setChoice("no")}
                      className="rounded-full py-2.5 text-[12px] font-semibold"
                      style={choice === "no" ? { background: ROSE, color: PAPER, fontFamily: FONT_BODY } : { background: "transparent", color: light ? PAPER : ROSE, border: `1.5px solid ${light ? "rgba(244,237,228,0.6)" : ROSE}`, fontFamily: FONT_BODY }}
                    >
                      {content.noLabel}
                    </button>
                  </div>
                  {isFull && <p className="mt-2 text-center text-[10px] italic" style={{ color: light ? "rgba(244,237,228,0.6)" : ROSE, fontFamily: FONT_BODY }}>We've reached capacity for confirmed guests.</p>}
                  {choice === "no" && (
                    <div className="mt-3 flex flex-col gap-2">
                      {nameField(light)}
                      {error && <p className="text-center text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
                      <button onClick={submit} className="rounded-full py-2 text-[10.5px] font-semibold underline" style={{ color: light ? PAPER : EMERALD, fontFamily: FONT_BODY }}>
                        Submit
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => !isFull && setChoice("yes")}
                      disabled={isFull}
                      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium"
                      style={{
                        background: light ? "rgba(255,255,255,0.1)" : PAPER_2,
                        border: `1.5px solid ${isFull ? (light ? "rgba(244,237,228,0.2)" : "rgba(36,70,61,0.15)") : choice === "yes" ? (light ? GOLD_SOFT : EMERALD) : (light ? "rgba(244,237,228,0.4)" : "rgba(36,70,61,0.3)")}`,
                        color: isFull ? (light ? "rgba(244,237,228,0.35)" : "rgba(36,70,61,0.35)") : light ? PAPER : EMERALD,
                        fontFamily: FONT_BODY,
                      }}
                    >
                      <span className="flex h-3 w-3 items-center justify-center rounded-full" style={{ border: `1.5px solid currentColor` }}>
                        {choice === "yes" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />}
                      </span>
                      {isFull ? "Fully booked" : content.yesLabel}
                    </button>
                    <button
                      onClick={() => setChoice("no")}
                      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium"
                      style={{ background: light ? "rgba(255,255,255,0.1)" : PAPER_2, border: `1.5px solid ${choice === "no" ? (light ? GOLD_SOFT : ROSE) : (light ? "rgba(244,237,228,0.4)" : "rgba(36,70,61,0.3)")}`, color: light ? PAPER : EMERALD, fontFamily: FONT_BODY }}
                    >
                      <span className="flex h-3 w-3 items-center justify-center rounded-full" style={{ border: `1.5px solid currentColor` }}>
                        {choice === "no" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />}
                      </span>
                      {content.noLabel}
                    </button>
                  </div>
                  {isFull && <p className="mt-1.5 text-center text-[10px] italic" style={{ color: light ? "rgba(244,237,228,0.6)" : ROSE, fontFamily: FONT_BODY }}>We've reached capacity for confirmed guests.</p>}
                  {choice && (
                    <div className="mt-3 flex flex-col gap-2">
                      {nameField(light)}
                      {choice === "yes" && rsvpSettings.maxGuestsOpenInvite > 0 && guestStepper(light)}
                      {error && <p className="text-center text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
                    </div>
                  )}
                  <button
                    onClick={submit}
                    disabled={!choice}
                    className="mt-3 w-full rounded-full py-2.5 text-[11px] font-bold uppercase"
                    style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.12em", fontFamily: FONT_BODY, opacity: choice ? 1 : 0.5 }}
                  >
                    Submit RSVP
                  </button>
                </>
              )}
            </div>
          </DraggableBlock>

          {/* "Who's joining us?" guest-count + names modal, shown for the stacked style's Attending flow */}
          {showModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(10,12,10,0.55)" }}>
              <div className="w-full rounded-2xl p-4" style={{ maxWidth: 250, background: "#FFFFFF" }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>Who's joining us?</h3>

                <div className="mt-3 flex items-center justify-between rounded-lg p-2.5" style={{ background: "#F2F2F0" }}>
                  <span style={{ fontSize: 10.5, color: "#333", fontFamily: FONT_BODY, lineHeight: 1.3 }}>How many of<br />you are coming?</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalGuestCount((c) => Math.max(1, c - 1))} style={{ color: "#333" }}><ChevronDown size={13} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", fontFamily: FONT_BODY }}>{modalGuestCount}</span>
                    <button onClick={() => setModalGuestCount((c) => Math.min(rsvpSettings.maxGuestsOpenInvite || 1, c + 1))} style={{ color: "#333" }}><ChevronUp size={13} /></button>
                  </div>
                </div>

                {confirmedNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {confirmedNames.map((n, i) => (
                      <span key={i} className="rounded-full px-2 py-0.5 text-[9.5px]" style={{ background: "#EFEFEF", color: "#333", fontFamily: FONT_BODY }}>{n}</span>
                    ))}
                  </div>
                )}

                {accountedFor < modalGuestCount && (
                  <div className="mt-2">
                    <label className="text-[9.5px] font-medium" style={{ color: "#3B6FD4", fontFamily: FONT_BODY }}>
                      Names {rsvpSettings.namesRequired ? "(required)" : "(optional)"}
                    </label>
                    <div className="mt-1 flex items-center gap-1.5 border-b" style={{ borderColor: "#3B6FD4" }}>
                      <input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && commitName()}
                        placeholder="Type a name, then +"
                        className="flex-1 py-1 text-[11px] outline-none"
                        style={{ color: "#111" }}
                      />
                      <button onClick={commitName} style={{ color: "#3B6FD4" }}><Plus size={15} /></button>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-[9.5px]" style={{ color: "#888", fontFamily: FONT_BODY }}>{confirmedNames.length}/{modalGuestCount} named</p>

                <div className="my-2.5 border-t" style={{ borderColor: "#E5E5E5" }} />
                <p className="text-center text-[11.5px] font-semibold underline" style={{ color: "#1A1A1A", fontFamily: FONT_BODY }}>
                  You're confirming {modalGuestCount} guest{modalGuestCount !== 1 ? "s" : ""}
                </p>
                {modalError && <p className="mt-1 text-center text-[10px]" style={{ color: "#C0392B", fontFamily: FONT_BODY }}>{modalError}</p>}

                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => { setShowModal(false); setChoice(null); }} className="text-[12px]" style={{ color: "#666", fontFamily: FONT_BODY }}>Cancel</button>
                  <button onClick={confirmModal} className="rounded-full px-5 py-2 text-[12px] font-semibold" style={{ background: "#111", color: "#FFF", fontFamily: FONT_BODY }}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </StoryPage>
  );
}

function RegistrySlide({ items, bg, fontDisplay, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const hs = layout.heading, ls = layout.list;
  const [copiedId, setCopiedId] = useState(null);
  const copyNote = async (item) => {
    const ok = await copyToClipboard(item.note);
    setCopiedId(ok ? item.id : null);
    setTimeout(() => setCopiedId(null), 1800);
  };
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 230 }}>
              <div className="font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY, fontSize: 10 }}>{t.giftRegistry}</div>
              <p className="mt-1.5 text-[11px] italic" style={{ color: light ? "rgba(244,237,228,0.8)" : EMERALD, fontFamily: fontDisplay }}>{t.registryIntro}</p>
            </div>
          </DraggableBlock>
          <DraggableBlock id="list" pos={ls} editMode={editMode} onMove={(p) => onMoveBlock("list", p)} label="Registry list" light={light} selected={selectedBlock === "list"} onSelect={() => onSelectBlock("list")}>
            <div className="flex flex-col gap-3" style={{ width: 220 }}>
              {items.map((item) => (
                <div key={item.id} className="rounded-xl p-3 text-center" style={{ background: light ? "rgba(255,255,255,0.12)" : PAPER_2, backdropFilter: light ? "blur(3px)" : "none" }}>
                  <div className="font-medium" style={{ color: light ? PAPER : EMERALD, fontFamily: fontDisplay, fontSize: 13 }}>{item.label}</div>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold" style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, fontFamily: FONT_BODY }}>
                      <ExternalLink size={10} /> {t.viewRegistry}
                    </a>
                  ) : item.note ? (
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <div className="text-[11px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY }}>{item.note}</div>
                      <button
                        onClick={() => copyNote(item)}
                        title="Copy"
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                        style={{ color: light ? GOLD_SOFT : EMERALD }}
                      >
                        <Copy size={11} />
                      </button>
                      {copiedId === item.id && (
                        <span className="text-[10px]" style={{ color: light ? GOLD_SOFT : EMERALD, fontFamily: FONT_BODY }}>Copied!</span>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

/* ---------------------------------------------------------------------- */
/* Preview: phone mockup                                                   */
/* ---------------------------------------------------------------------- */

function IntegrationSlide({ icon: Icon, heading, subtitle, buttonLabel, url, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, paid, price, paymentUrl }) {
  const hs = layout.heading, bs = layout.button;
  const isPaid = !!paid;
  const hasPaymentLink = isPaid && !!(paymentUrl && paymentUrl.trim());
  const hasUrl = !isPaid && !!(url && url.trim());
  const canAct = isPaid ? hasPaymentLink : hasUrl;
  const actionHref = isPaid ? paymentUrl : url;
  const actionLabel = isPaid ? `${buttonLabel}${price ? ` — ${price}` : ""}` : buttonLabel;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 220 }}>
              <Icon size={26} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 10px" }} />
              <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 18, color: light ? PAPER : EMERALD }}>{heading}</div>
              <p className="mt-1.5 text-[11.5px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{subtitle}</p>
              {isPaid && price && (
                <span className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: light ? "rgba(201,164,76,0.2)" : "rgba(36,70,61,0.15)", color: light ? GOLD_SOFT : EMERALD, fontFamily: FONT_BODY }}>
                  {price} to watch
                </span>
              )}
            </div>
          </DraggableBlock>
          <DraggableBlock id="button" pos={bs} editMode={editMode} onMove={(p) => onMoveBlock("button", p)} label="Button" light={light} selected={selectedBlock === "button"} onSelect={() => onSelectBlock("button")}>
            {canAct ? (
              <a
                href={actionHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11.5px] font-bold uppercase"
                style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.1em", fontFamily: FONT_BODY }}
              >
                {isPaid && <Lock size={11} />} {actionLabel} {!isPaid && <ExternalLink size={12} />}
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-semibold"
                style={{ background: "transparent", border: `1.5px dashed ${light ? "rgba(244,237,228,0.4)" : "rgba(36,70,61,0.3)"}`, color: light ? "rgba(244,237,228,0.5)" : "rgba(36,70,61,0.5)", fontFamily: FONT_BODY }}
                title={isPaid ? "Add a payment link in the editor panel to activate this button" : "Add the live link in the editor panel to activate this button"}
              >
                {isPaid ? "Payment link not set up yet" : buttonLabel}
              </span>
            )}
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function DjRequestSlide({ heading, subtitle, slug, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const [songName, setSongName] = useState("");
  const [artist, setArtist] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const hs = layout.heading, fs = layout.form;

  const submit = async () => {
    if (!songName.trim()) { setError("Please enter a song name."); return; }
    setError("");
    setSubmitting(true);
    try {
      await submitSongRequest(slug, { songName, artist, requesterName });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (light) => ({
    width: "100%", background: light ? "rgba(244,237,228,0.12)" : "rgba(36,70,61,0.08)",
    border: `1px solid ${light ? "rgba(244,237,228,0.25)" : "rgba(36,70,61,0.2)"}`, borderRadius: 8,
    padding: "8px 10px", fontSize: 12, color: light ? PAPER : EMERALD, fontFamily: FONT_BODY, outline: "none",
    marginBottom: 8, boxSizing: "border-box",
  });

  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 220 }}>
              <Music2 size={26} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 10px" }} />
              <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 18, color: light ? PAPER : EMERALD }}>{heading}</div>
              <p className="mt-1.5 text-[11.5px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{subtitle}</p>
            </div>
          </DraggableBlock>
          <DraggableBlock id="form" pos={fs} editMode={editMode} onMove={(p) => onMoveBlock("form", p)} label="Request form" light={light} selected={selectedBlock === "form"} onSelect={() => onSelectBlock("form")}>
            {editMode ? (
              <div style={{ width: 220, padding: "12px 14px", borderRadius: 10, border: `1.5px dashed ${light ? "rgba(244,237,228,0.4)" : "rgba(36,70,61,0.3)"}`, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: light ? "rgba(244,237,228,0.6)" : "rgba(36,70,61,0.6)", fontFamily: FONT_BODY }}>Song request form — guests fill this in live on the real page</span>
              </div>
            ) : sent ? (
              <div className="text-center" style={{ width: 220 }}>
                <Check size={20} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 8px" }} />
                <p style={{ color: light ? PAPER : EMERALD, fontFamily: FONT_BODY, fontSize: 12.5 }}>Sent to the DJ!</p>
              </div>
            ) : !slug ? (
              <p style={{ color: light ? "rgba(244,237,228,0.6)" : "rgba(36,70,61,0.6)", fontFamily: FONT_BODY, fontSize: 11, textAlign: "center", width: 220 }}>Song requests aren't available in this preview.</p>
            ) : (
              <div style={{ width: 220 }}>
                <input value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="Song name" style={inputStyle(light)} />
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist (optional)" style={inputStyle(light)} />
                <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Your name (optional)" style={inputStyle(light)} />
                {error && <p style={{ color: "#E29B9B", fontSize: 10.5, marginBottom: 6, fontFamily: FONT_BODY }}>{error}</p>}
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full rounded-full text-[11px] font-bold uppercase"
                  style={{ padding: "9px 0", background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.08em", fontFamily: FONT_BODY, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Sending…" : "Send Request"}
                </button>
              </div>
            )}
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function LivestreamSlide({ heading, subtitle, url, buttonLabel, paid, price, paymentUrl, slug, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const [session, setSession] = useState(null); // null=not checked yet, {status,...}
  const [starting, setStarting] = useState(false);

  // For a paid stream, check whether THIS guest's browser already has an
  // authorized session — this is what makes "leave to pay, come back" and
  // "revisit later, still unlocked" both work without re-showing the
  // payment button. Polls while a payment is pending, since the guest may
  // still be off completing checkout on Whish's own site.
  useEffect(() => {
    if (!paid || editMode || !slug) return;
    let cancelled = false;
    const storageKey = `einvite:stream-session:${slug}`;
    const storedRef = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;

    if (!storedRef) {
      setSession({ status: "unauthorized" });
      return;
    }

    setSession({ status: "checking" });
    const check = async () => {
      try {
        const result = await getStreamUrl(storedRef);
        if (cancelled) return;
        setSession(result.authorized ? { status: "authorized", embedUrl: result.embedUrl } : { status: "pending" });
      } catch {
        if (!cancelled) setSession({ status: "unauthorized" });
      }
    };
    check();
    const interval = setInterval(check, 4000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [paid, editMode, slug]);

  const startPayment = async () => {
    setStarting(true);
    try {
      const amount = parseFloat(String(price || "").replace(/[^0-9.]/g, "")) || 0;
      const { paymentReference, paymentUrl: whishUrl } = await createPaymentSession(slug, amount, "USD");
      window.localStorage.setItem(`einvite:stream-session:${slug}`, paymentReference);
      window.location.href = whishUrl; // hand off to Whish's own checkout — real payment happens there, not in this app
    } catch (err) {
      setSession({ status: "error", error: err.message });
      setStarting(false);
    }
  };

  // Never auto-embed a paid stream from the `url` field — for paid streams
  // the real URL is never even present here at all; it only ever comes
  // back from getStreamUrl() after a verified payment (see the useEffect
  // above). Only free streams on a platform that actually supports iframe
  // embedding get the inline player this way; everything else (paid, or a
  // non-embeddable URL like Zoom) falls through to the button-based version.
  const embedUrl = !paid ? getEmbedUrl(url) : null;

  if (embedUrl && !editMode) {
    return (
      <StoryPage bg={bg}>
        {(light) => (
          <div className="relative flex h-full w-full flex-col">
            <div className="flex-shrink-0 px-4 pb-2 pt-8 text-center">
              <Video size={18} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 6px" }} />
              <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 15, color: light ? PAPER : EMERALD }}>{heading}</div>
              {subtitle && <p className="mt-1 text-[10.5px]" style={{ color: light ? "rgba(244,237,228,0.75)" : ROSE, fontFamily: FONT_BODY }}>{subtitle}</p>}
            </div>
            <div className="flex-1 px-3 pb-6">
              <iframe
                src={embedUrl}
                className="h-full w-full rounded-xl"
                style={{ border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Live stream"
              />
            </div>
          </div>
        )}
      </StoryPage>
    );
  }

  if (paid && !editMode) {
    return (
      <StoryPage bg={bg}>
        {(light) => (
          <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
            <Video size={26} color={light ? GOLD_SOFT : EMERALD} style={{ marginBottom: 10 }} />
            <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 18, color: light ? PAPER : EMERALD }}>{heading}</div>
            {subtitle && <p className="mt-1.5 text-[11.5px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY, maxWidth: 220 }}>{subtitle}</p>}

            {!session || session.status === "checking" ? (
              <p className="mt-6 text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Checking access…</p>
            ) : session.status === "authorized" ? (
              <div className="mt-5 w-full" style={{ maxWidth: 260, aspectRatio: "9 / 16" }}>
                <iframe
                  src={session.embedUrl}
                  className="h-full w-full rounded-xl"
                  style={{ border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Live stream"
                />
              </div>
            ) : session.status === "pending" ? (
              <p className="mt-6 text-[11px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>Waiting for payment confirmation…</p>
            ) : (
              <>
                {session.status === "error" && <p className="mt-3 text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{session.error}</p>}
                <button
                  onClick={startPayment}
                  disabled={starting}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11.5px] font-bold uppercase"
                  style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.1em", fontFamily: FONT_BODY, opacity: starting ? 0.7 : 1 }}
                >
                  <Lock size={11} /> {starting ? "Starting…" : `${buttonLabel}${price ? ` — ${price}` : ""}`}
                </button>
              </>
            )}
          </div>
        )}
      </StoryPage>
    );
  }

  // Editor preview (owner editing/positioning blocks), or the free-but-not-
  // embeddable case — falls back to the generic draggable button version.
  return (
    <IntegrationSlide
      icon={Video}
      heading={heading}
      subtitle={subtitle}
      buttonLabel={buttonLabel}
      url={url}
      paid={paid}
      price={price}
      paymentUrl={paymentUrl}
      bg={bg} fontDisplay={fontDisplay} layout={layout} editMode={editMode} onMoveBlock={onMoveBlock} selectedBlock={selectedBlock} onSelectBlock={onSelectBlock}
    />
  );
}

function GateAnimation({ style }) {
  const conf = GATE_ANIMATIONS[style] || GATE_ANIMATIONS.floatingHearts;
  const Icon = conf.icon;
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        left: Math.round(Math.random() * 92),
        delay: (Math.random() * 4).toFixed(2),
        duration: (5 + Math.random() * 4).toFixed(2),
        size: 10 + Math.round(Math.random() * 10),
        color: conf.colors[i % conf.colors.length],
        opacity: (0.35 + Math.random() * 0.45).toFixed(2),
      })),
    [style]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <Icon
          key={i}
          size={p.size}
          color={p.color}
          fill={p.color}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            bottom: -20,
            opacity: p.opacity,
            animation: `gateFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Envelope gate with an embossed wax seal. Either a built-in style (no upload
// needed, everything CSS) or a custom uploaded photo/video behind the seal.
function WaxSealGate({ tapText, design, customMedia, videoRef }) {
  const d = ENVELOPE_STYLES[design] || ENVELOPE_STYLES.kraftGold;
  const EngraveIcon = d.engrave;
  const hasCustomBg = !!customMedia;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: hasCustomBg ? undefined : d.envelopeBg }}>
      {hasCustomBg ? (
        <>
          {customMedia.type === "video" ? (
            <video
              ref={videoRef}
              src={customMedia.url}
              preload="auto"
              muted
              loop
              playsInline
              onPause={(e) => { if (e.currentTarget.currentTime > 0) e.currentTarget.play().catch(() => {}); }} // only auto-resume a video that's actually been started (currentTime > 0) — never before the tap
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: `url(${customMedia.url}) center/cover` }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,12,10,0.25) 0%, rgba(10,12,10,0.5) 100%)" }} />
        </>
      ) : (
        <>
          {d.texture === "crosshatch" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 5px)",
              }}
            />
          )}
          {d.texture === "velvet" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(60% 40% at 15% 15%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(50% 35% at 85% 80%, rgba(0,0,0,0.2), transparent 60%), radial-gradient(40% 30% at 70% 20%, rgba(0,0,0,0.12), transparent 60%)",
              }}
            />
          )}
          {d.flapStyle === "thick" && (
            <div
              className="absolute"
              style={{
                top: "-15%", right: "-25%", width: "130%", height: "150%",
                background: d.flapBg,
                clipPath: "polygon(42% 0%, 100% 0%, 100% 100%, 12% 100%)",
                boxShadow: "inset 10px 0 22px rgba(0,0,0,0.5)",
              }}
            />
          )}
          {d.flapStyle === "seam" && (
            <div
              className="absolute"
              style={{
                top: "6%", left: "-10%", width: "80%", height: 2,
                background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.4), transparent)",
                transform: "rotate(34deg)", transformOrigin: "left top",
              }}
            />
          )}
        </>
      )}

      {/* wax seal */}
      <div
        className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full"
        style={{
          width: 112, height: 112, transform: "translate(-50%, -50%)",
          background: d.waxOuter,
          boxShadow: "0 10px 24px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.45), inset 0 -4px 8px rgba(0,0,0,0.4)",
          animation: "sealPulse 2.6s ease-in-out infinite",
        }}
      >
        <div className="flex items-center justify-center rounded-full" style={{ width: 86, height: 86, background: d.waxInner, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)" }}>
          {EngraveIcon ? (
            <EngraveIcon size={34} color={d.engraveColor} strokeWidth={1.3} />
          ) : (
            <div className="rounded-full" style={{ width: 52, height: 52, border: `2px solid ${d.engraveColor}`, opacity: 0.7 }}>
              <div className="h-full rounded-full" style={{ margin: 8, border: `1.5px solid ${d.engraveColor}`, opacity: 0.7 }} />
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 z-10" style={{ bottom: "17%" }}>
        <p className="text-center text-[12px] font-semibold uppercase" style={{ color: "#F3E6C8", letterSpacing: "0.35em", fontFamily: FONT_BODY, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {tapText}
        </p>
      </div>
    </div>
  );
}

function PhonePreview({ data, steps, activeIndex, onNavigate, lang, layoutEditMode, onMoveBlock, started, onStart, selectedBlockId, onSelectBlock, onMoveCustomBlock, onRemoveCustomBlock, onSubmitRsvp, fullscreen, slug, siteDomain }) {
  const [playing, setPlaying] = useState(false);
  const cardRef = useRef(null);
  const [fsScale, setFsScale] = useState(1);
  const [fsViewportHeight, setFsViewportHeight] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 700));
  const [fsIsNarrow, setFsIsNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 420 : true));

  useEffect(() => {
    if (!fullscreen || typeof window === "undefined") return;
    // window.visualViewport tracks the ACTUALLY-visible area on mobile as the
    // browser's own address bar shrinks/grows — this is what makes the card's
    // height reliable across different mobile browsers, regardless of
    // whether a given browser supports the dvh CSS unit at all.
    const update = () => {
      setFsViewportHeight(window.visualViewport?.height || window.innerHeight);
      setFsIsNarrow(window.innerWidth <= 420);
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen || !cardRef.current) return;
    const el = cardRef.current;
    const update = () => setFsScale(el.offsetWidth / 292); // 292 = the fixed px width every layout/font size in this app was designed against
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen]);
  const [gateClosing, setGateClosing] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState(1);
  const audioRef = useRef(null);
  const gateVideoRef = useRef(null);
  const touchStartRef = useRef(null);
  const wheelLockRef = useRef(false);

  useEffect(() => setAnimKey((k) => k + 1), [activeIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing && data.music.url) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing, data.music.url]);

  const introMedia = data.intro.media[lang];

  const t = PREVIEW_T[lang];
  const dir = LANG_META[lang].dir;
  const fontDisplay = lang === "ar" ? FONT_AR : FONT_DISPLAY;
  const fontScript = lang === "ar" ? FONT_AR : FONT_SCRIPT;
  const stepKey = steps[activeIndex].key;

  const goDir = (d) => {
    if (layoutEditMode) return;
    const next = Math.min(steps.length - 1, Math.max(0, activeIndex + d));
    if (next !== activeIndex) { setDirection(d); onNavigate(next); }
  };

  const onTouchStart = (e) => { if (!layoutEditMode && started) touchStartRef.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (layoutEditMode || !started || touchStartRef.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartRef.current;
    touchStartRef.current = null;
    if (dy < -40) goDir(1); else if (dy > 40) goDir(-1);
  };
  const onWheel = (e) => {
    if (layoutEditMode || !started || wheelLockRef.current || Math.abs(e.deltaY) < 15) return;
    wheelLockRef.current = true;
    goDir(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => (wheelLockRef.current = false), 550);
  };

  const layout = data.layouts[stepKey];
  const moveBlock = (blockId, pos) => onMoveBlock(stepKey, blockId, pos);

  const gateImage = (introMedia?.type === "image" ? introMedia.url : null) || data.pageBackgrounds.cover.image;
  const gateBackground = gateImage ? `url(${gateImage}) center/cover` : BG_PRESETS[data.pageBackgrounds.cover.preset].css;
  const GateIcon = GATE_ICONS[data.intro.icon] || Heart;
  const tapText = data.content[lang].cover.tapText || t.tapToStart;

  const bottomRightActions = [];
  if (data.music.enabled) {
    const musicIconSet = MUSIC_ICONS[data.music.icon] || MUSIC_ICONS.speaker;
    const MusicIcon = playing ? musicIconSet.playing : musicIconSet.muted;
    bottomRightActions.push({
      key: "music",
      icon: MusicIcon,
      onClick: () => setPlaying((p) => !p),
      dim: !playing && data.music.icon !== "speaker",
      pulse: playing && data.music.icon !== "speaker",
    });
  }
  // More bottom-right actions (share, like, etc.) can be appended to this array the same way.

  const customBlocks = data.customBlocks[stepKey] || [];

  const renderSlide = (key) => {
    const layout = data.layouts[key] || DEFAULT_LAYOUTS[key];
    const bg = data.pageBackgrounds[key];
    const onMove = (id, p) => onMoveBlock(key, id, p);
    const common = { editMode: layoutEditMode, selectedBlock: selectedBlockId, onSelectBlock };
    switch (key) {
      case "cover":
        return <CoverSlide content={data.content[lang].cover} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} layout={layout} onMoveBlock={onMove} {...common} />;
      case "family":
        return <FamilySlide content={data.content[lang].family} bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common} />;
      case "timeline":
        return <TimelineSlide items={data.timeline} lang={lang} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      case "locations":
        return <LocationsSlide items={data.locations} lang={lang} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      case "countdown":
        return <CountdownSlide schedule={data.rsvpSchedule} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} locale={LANG_META[lang].locale} layout={layout} onMoveBlock={onMove} {...common} />;
      case "rsvp":
        return <RsvpSlide content={data.content[lang].rsvp} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} layout={layout} onMoveBlock={onMove} rsvpSettings={data.rsvpSettings} totalAttending={data.totalAttending} onSubmitRsvp={onSubmitRsvp} siteDomain={siteDomain} slug={slug} {...common} />;
      case "registry":
        return <RegistrySlide items={data.registry} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      case "djRequests":
        return (
          <DjRequestSlide
            heading={data.integrations.djHeading}
            subtitle={data.integrations.djSubtitle}
            slug={slug}
            bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common}
          />
        );
      case "networking":
        return (
          <IntegrationSlide
            icon={Handshake}
            heading={data.integrations.networkingHeading}
            subtitle={data.integrations.networkingSubtitle}
            buttonLabel={data.integrations.networkingButtonLabel}
            url={slug ? `https://${siteDomain}/network/${slug}` : ""}
            bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common}
          />
        );
      case "livestream":
        return (
          <LivestreamSlide
            heading={data.integrations.livestreamHeading}
            subtitle={data.integrations.livestreamSubtitle}
            buttonLabel={data.integrations.livestreamButtonLabel}
            url={data.integrations.livestreamUrl}
            paid={data.integrations.livestreamPaid}
            price={data.integrations.livestreamPrice}
            paymentUrl={data.integrations.livestreamPaymentUrl}
            slug={slug}
            bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUpIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownIn { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes musicPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.75; } }
        @keyframes sealPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } }
        @keyframes eqBar { from { height: 3px; } to { height: 9px; } }
        .pv-fullscreen-card { max-width: 420px; aspect-ratio: 292 / 600; }
        @media (max-width: 420px) {
          .pv-fullscreen-card { max-width: 100%; aspect-ratio: unset; height: 100vh; height: 100dvh; }
        }
      `}</style>
    <div className={fullscreen ? "flex flex-col items-center justify-center" : "flex flex-col items-center"} style={fullscreen ? { width: "100%", minHeight: "100dvh", background: INK } : undefined}>
      <div
        ref={cardRef}
        className={fullscreen ? "relative w-full pv-fullscreen-card" : "relative flex-shrink-0"}
        style={
          fullscreen
            ? { margin: "0 auto", background: PAPER, padding: 0, boxShadow: "none", overflow: "hidden", ...(fsIsNarrow ? { height: fsViewportHeight } : {}) }
            : { width: 292, height: 600, background: "#000", borderRadius: 42, padding: 10, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,164,76,0.15)" }
        }
      >
        <div
          className="relative overflow-hidden"
          style={
            fullscreen
              ? { touchAction: "none", width: 292, height: 600, transform: `scale(${fsScale})`, transformOrigin: "top left" }
              : { touchAction: "none", borderRadius: 32, background: PAPER, height: "100%", width: "100%" }
          }
          dir={dir} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}
        >
          {!fullscreen && <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full" style={{ background: "#000" }} />}

          {started && !fullscreen && (
            <div className="absolute left-3 right-3 top-4 z-20 flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.35)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: i <= activeIndex ? "100%" : "0%", background: GOLD_SOFT }} />
                </div>
              ))}
            </div>
          )}

          <div key={animKey} className="h-full w-full" style={{ animation: `${direction > 0 ? "slideUpIn" : "slideDownIn"} 0.35s ease` }}>
            {renderSlide(stepKey)}
          </div>

          {started && (
            <div className="absolute inset-0">
              {customBlocks.map((block) => (
                <CustomTextBlock
                  key={block.id}
                  block={block}
                  light={data.pageBackgrounds[stepKey].mode === "photo"}
                  editMode={layoutEditMode}
                  selected={selectedBlockId === `custom:${block.id}`}
                  onSelect={() => onSelectBlock(`custom:${block.id}`)}
                  onMove={(p) => onMoveCustomBlock(stepKey, block.id, p)}
                  onDelete={() => onRemoveCustomBlock(stepKey, block.id)}
                />
              ))}
            </div>
          )}

          {(!started || gateClosing) && (
            <div className="absolute inset-0 z-40 overflow-hidden">
              {data.intro.type === "seal" ? (
                <button
                  onClick={() => {
                    if (gateClosing) return;
                    if (introMedia?.type === "video" && gateVideoRef.current) {
                      gateVideoRef.current.muted = true;
                      gateVideoRef.current.play().catch(() => {});
                    }
                    setGateClosing(true);
                    setTimeout(() => { onStart(); setGateClosing(false); }, 480);
                  }}
                  className="absolute inset-0"
                  style={{ opacity: gateClosing ? 0 : 1, transition: "opacity 0.48s ease", pointerEvents: gateClosing ? "none" : "auto", cursor: "pointer" }}
                >
                  <WaxSealGate tapText={tapText} design={data.intro.sealDesign} customMedia={introMedia} videoRef={gateVideoRef} />
                </button>
              ) : (
                <div className="absolute inset-0" style={{ background: gateBackground }}>
                  {/* Media layer: never animated directly, so playback isn't disrupted mid-decode on lower-power phones */}
                  {introMedia?.type === "video" && (
                    <video
                      ref={gateVideoRef}
                      src={introMedia.url}
                      preload="auto"
                      muted
                      loop
                      playsInline
                      onPause={(e) => { if (started) e.currentTarget.play().catch(() => {}); }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {data.intro.type === "animation" && <GateAnimation style={data.intro.animationStyle} />}

                  {/* Curtain layer: this is the only thing that fades on tap */}
                  <button
                    onClick={() => {
                      if (gateClosing) return;
                      // A tap is a real user gesture, so play() here succeeds even in
                      // sandboxed/embedded contexts that silently block autoplay before
                      // any interaction — the earlier mount-time play() attempt is a
                      // bonus for environments that do allow autoplay, not the only path.
                      if (introMedia?.type === "video" && gateVideoRef.current) {
                        gateVideoRef.current.muted = true;
                        gateVideoRef.current.play().catch(() => {});
                      }
                      setGateClosing(true);
                      const holdMs = introMedia?.type === "video" ? 900 : 480;
                      setTimeout(() => { onStart(); setGateClosing(false); }, holdMs);
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ opacity: gateClosing ? 0 : 1, transition: `opacity ${introMedia?.type === "video" ? 0.9 : 0.48}s ease`, pointerEvents: gateClosing ? "none" : "auto", cursor: "pointer" }}
                  >
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,12,10,0.3) 0%, rgba(10,12,10,0.5) 100%)" }} />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      {data.intro.type === "button" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ border: `1.5px solid rgba(244,237,228,0.85)` }}>
                          <GateIcon size={24} color={PAPER} strokeWidth={1.4} />
                        </div>
                      )}
                      <span className="text-[12px] font-semibold uppercase" style={{ color: PAPER, letterSpacing: "0.35em", fontFamily: FONT_BODY }}>
                        {tapText}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* A subtle bottom scrim guarantees the swipe-up hint and action icons
            stay legible no matter what invitation content sits behind them —
            this works regardless of saved text positions or screen size,
            rather than depending on content never drifting into this zone. */}
        {started && !layoutEditMode && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: 110, background: "linear-gradient(180deg, rgba(10,12,10,0) 0%, rgba(10,12,10,0.45) 55%, rgba(10,12,10,0.6) 100%)" }} />
        )}

        {/* Swipe-up hint and bottom-right action icons live OUTSIDE the scaled
            292x600 canvas on purpose — they're UI chrome, not invitation
            content, so they're positioned against the card's own real
            dimensions instead of the fixed reference canvas. This is what
            keeps them always visible regardless of how a real device's
            aspect ratio compares to 292:600, without needing to compromise
            on filling the full width. */}
        {started && (layoutEditMode ? (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(10,12,10,0.6)", backdropFilter: "blur(4px)" }}>
              <Move size={11} color={GOLD_SOFT} />
              <span className="text-[9.5px]" style={{ color: PAPER, fontFamily: FONT_BODY }}>Drag text blocks to reposition</span>
            </div>
          </div>
        ) : (
          <>
            {activeIndex < steps.length - 1 && (
              <button onClick={() => goDir(1)} className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1">
                <ChevronsUp size={20} color={PAPER} style={{ animation: "bounceUp 1.4s ease-in-out infinite", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
                <span className="text-[10px] font-semibold uppercase" style={{ color: PAPER, fontFamily: FONT_BODY, letterSpacing: "0.2em", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  {t.swipeUp}
                </span>
              </button>
            )}

            {/* Bottom-right action icons — data-driven so more than the music toggle can be added here */}
            <div className="absolute bottom-5 right-3 z-20 flex flex-col items-center gap-2">
              {bottomRightActions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "rgba(10,12,10,0.5)", backdropFilter: "blur(4px)", opacity: action.dim ? 0.5 : 1 }}
                >
                  <action.icon size={14} color={PAPER} style={{ animation: action.pulse ? "musicPulse 1.6s ease-in-out infinite" : "none" }} />
                </button>
              ))}
            </div>
          </>
        ))}
      </div>

      {data.music.url && <audio ref={audioRef} src={data.music.url} loop />}

      {!fullscreen && (
        <div className="mt-4 text-center">
          <div className="text-[11px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>
            Slide {activeIndex + 1} of {steps.length} — {steps[activeIndex].label}
          </div>
          <div className="mt-1 text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            {layoutEditMode ? "Drag any dashed block to move it" : "Swipe up / down on the phone, scroll, or tap a step to preview"}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Settings view (OG / WhatsApp share image)                               */
/* ---------------------------------------------------------------------- */

function WhatsAppPreviewCard({ image, title, description, domain }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: "#EDEDED", maxWidth: 320 }}>
      <div className="flex h-40 w-full items-center justify-center" style={{ background: image ? `url(${image}) center/cover` : "linear-gradient(160deg, #1f3a2e 0%, #24463d 45%, #16211d 100%)" }}>
        {!image && <ImagePlus size={26} color="rgba(255,255,255,0.5)" />}
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-[13px] font-semibold" style={{ color: "#111", fontFamily: FONT_BODY }}>{title || "Your invitation title"}</div>
        <div className="mt-0.5 line-clamp-2 text-[11.5px]" style={{ color: "#555", fontFamily: FONT_BODY }}>{description || "Your intro text will appear here as the share description."}</div>
        <div className="mt-1 text-[10.5px] uppercase" style={{ color: "#8a8a8a", fontFamily: FONT_BODY, letterSpacing: "0.04em" }}>{domain}</div>
      </div>
    </div>
  );
}

function SettingsView({ og, setOg, autoTitle, autoDescription, slug, siteDomain, setSiteDomain }) {
  const [copyState, setCopyState] = useState("idle"); // idle | copied | failed
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageCompressed(file, 1200, 0.82);
      setOg((o) => ({ ...o, image: dataUrl }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setOg((o) => ({ ...o, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };
  const link = `https://${siteDomain}/e/${slug}`;
  const copyLink = async () => {
    const ok = await copyToClipboard(link);
    setCopyState(ok ? "copied" : "failed");
    setTimeout(() => setCopyState("idle"), 2000);
  };
  const whatsappMessage = `${og.title || autoTitle}\n${link}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Site domain</h2>
      <p className="mb-4 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Every link this app generates (Copy Open Invitation, guest links, share previews, user invitation links) is built from this domain. It defaults to a placeholder — once you've actually deployed (e.g. to Vercel), replace it with your real domain, such as <code style={{ color: GOLD_SOFT }}>your-project.vercel.app</code> or a custom domain, so the links people actually receive point somewhere real.
      </p>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: INK_3 }}>
        <span className="text-[13px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>https://</span>
        <input
          value={siteDomain}
          onChange={(e) => setSiteDomain(e.target.value.replace(/^https?:\/\//, "").replace(/\/$/, ""))}
          placeholder="your-project.vercel.app"
          className="flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: IVORY, fontFamily: FONT_BODY }}
        />
      </div>
      {siteDomain === "einvite.me" && (
        <p className="mt-2 text-[10.5px]" style={{ color: "#E4CE95", fontFamily: FONT_BODY }}>
          This is still the placeholder domain — links won't work for real guests until you update it to wherever this app is actually deployed.
        </p>
      )}

      <Divider />

      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Share preview</h2>
      <p className="mb-6 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        This is what appears when your invitation link is shared on WhatsApp, iMessage, or social media.
      </p>

      <FieldLabel>Share thumbnail (recommended 1200 × 630)</FieldLabel>
      <label className="flex cursor-pointer items-center gap-3">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg" style={{ border: og.image ? `2px solid ${GOLD}` : `2px dashed rgba(147,166,155,0.5)`, background: og.image ? `url(${og.image}) center/cover` : "transparent" }}>
          {!og.image && <Upload size={18} style={{ color: MUTED }} />}
        </div>
        <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUpload} />
        <div className="flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium" style={{ color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.35)`, fontFamily: FONT_BODY }}>
            <ImagePlus size={13} /> {og.image ? "Replace image" : "Upload image"}
          </span>
          {og.image && (
            <button onClick={(e) => { e.preventDefault(); setOg((o) => ({ ...o, image: null })); }} className="text-left text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              Remove image
            </button>
          )}
        </div>
      </label>

      <div className="mt-5">
        <FieldLabel>Link title (optional override)</FieldLabel>
        <TextInput value={og.title} onChange={(v) => setOg((o) => ({ ...o, title: v }))} placeholder={autoTitle} />
      </div>
      <div className="mt-4">
        <FieldLabel>Link description (optional override)</FieldLabel>
        <TextArea value={og.description} onChange={(v) => setOg((o) => ({ ...o, description: v }))} rows={2} placeholder={autoDescription} />
      </div>

      <Divider />

      <FieldLabel>Shareable link</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: INK_3 }}>
          <Link2 size={13} color={MUTED} />
          <span className="select-all text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>{link}</span>
        </div>
        <GhostButton onClick={copyLink}>
          <Copy size={13} /> {copyState === "copied" ? "Copied!" : "Copy"}
        </GhostButton>
      </div>
      {copyState === "failed" && (
        <p className="mt-1.5 text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>
          Couldn't copy automatically — tap the link above to select it, then copy manually.
        </p>
      )}

      <div className="mt-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ background: "#25D366", color: "#0B2E1A", fontFamily: FONT_BODY }}
        >
          <MessageCircle size={15} /> Share via WhatsApp
        </a>
        <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          Opens WhatsApp with the invitation title and link ready to send to anyone you choose.
        </p>
      </div>

      <div className="mt-6">
        <FieldLabel>WhatsApp preview</FieldLabel>
        <WhatsAppPreviewCard image={og.image} title={og.title || autoTitle} description={og.description || autoDescription} domain={siteDomain} />
      </div>
    </div>
  );
}

function RsvpSettingsView({ rsvpSettings, updateRsvpSettings }) {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>RSVP configuration</h2>
      <p className="mb-6 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Controls what guests are asked for on the RSVP page, and what shows publicly.
      </p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Names Required</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Guests must enter their name to submit an RSVP</div>
        </div>
        <SegmentedToggle
          value={rsvpSettings.namesRequired}
          onChange={(v) => updateRsvpSettings({ namesRequired: v })}
          options={[{ value: false, label: "Optional" }, { value: true, label: "Required" }]}
        />
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Names Required When Declining</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Applies to the open invitation link, when a guest selects "Not Attending"</div>
        </div>
        <SegmentedToggle
          value={rsvpSettings.namesRequiredWhenDeclining}
          onChange={(v) => updateRsvpSettings({ namesRequiredWhenDeclining: v })}
          options={[{ value: false, label: "Optional" }, { value: true, label: "Required" }]}
        />
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Max Guests</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Most additional guests one RSVP can add, via the open invitation link</div>
        </div>
        <NumberStepper value={rsvpSettings.maxGuestsOpenInvite} onChange={(v) => updateRsvpSettings({ maxGuestsOpenInvite: v })} min={0} max={20} />
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Max Total RSVPs</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Closes "Attending" on the open invitation link once this many confirmed guests are reached. 0 = unlimited.</div>
        </div>
        <NumberStepper value={rsvpSettings.maxTotalRsvps} onChange={(v) => updateRsvpSettings({ maxTotalRsvps: v })} min={0} max={2000} />
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Show Total Attending</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Displays the live confirmed-guest count on the RSVP page itself</div>
        </div>
        <button onClick={() => updateRsvpSettings({ showTotalAttending: !rsvpSettings.showTotalAttending })} className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors" style={{ background: rsvpSettings.showTotalAttending ? GOLD : INK_3 }}>
          <span className="absolute top-0.5 h-5 w-5 rounded-full transition-transform" style={{ background: IVORY, transform: rsvpSettings.showTotalAttending ? "translateX(22px)" : "translateX(2px)" }} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Dashboard view (RSVP analytics)                                         */
/* ---------------------------------------------------------------------- */

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl p-4" style={{ background: INK_3 }}>
      <div className="text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>{label}</div>
      <div className="mt-1 text-2xl" style={{ fontFamily: FONT_DISPLAY, color: accent || IVORY }}>{value}</div>
    </div>
  );
}

function MemberBadge({ member }) {
  const declined = member.status === "no";
  return (
    <span
      className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-px text-[9.5px] font-medium leading-tight"
      style={{ background: declined ? "rgba(217,142,142,0.18)" : "rgba(143,191,163,0.18)", color: declined ? "#E8A9A9" : "#A8D4BB", fontFamily: FONT_BODY }}
    >
      {member.name}
    </span>
  );
}

function UnnamedBadge({ onNamed }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const commit = () => {
    if (value.trim()) onNamed(value.trim());
    setEditing(false);
    setValue("");
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setValue(""); } }}
        placeholder="Name…"
        className="w-20 flex-shrink-0 rounded-full px-1.5 py-px text-[9.5px] outline-none leading-tight"
        style={{ background: INK_3, color: IVORY, border: `1px solid ${GOLD}`, fontFamily: FONT_BODY }}
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to name this guest"
      className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-px text-[9.5px] italic leading-tight"
      style={{ background: "transparent", color: "rgba(147,166,155,0.7)", border: `1px dashed rgba(147,166,155,0.4)`, fontFamily: FONT_BODY }}
    >
      (unnamed)
    </button>
  );
}

function RsvpBadges({ members }) {
  const yes = members.filter((m) => m.status === "yes").length;
  const no = members.filter((m) => m.status === "no").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const circle = (value, color, title) => (
    <span title={title} className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none" style={{ background: color, color: "#0B120E" }}>
      {value}
    </span>
  );
  return (
    <div className="flex items-center gap-1">
      {circle(yes, CHART_COLORS.yes, `${yes} attending`)}
      {circle(no, CHART_COLORS.no, `${no} declined`)}
      {pending > 0 && circle(pending, "#9AA8A0", `${pending} awaiting response`)}
    </div>
  );
}

function TableCard({ table, groups, allTables, onUpdateTable, onDeleteTable, onAssignGuest }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(table.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const occupied = groups.reduce((sum, g) => sum + groupHeadcount(g), 0);
  const overCapacity = occupied > table.capacity;

  const commitName = () => {
    onUpdateTable(table.id, { name: nameDraft.trim() || table.name });
    setEditingName(false);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: INK_2, border: `1px solid ${overCapacity ? "rgba(217,142,142,0.4)" : "rgba(201,164,76,0.12)"}` }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {editingName ? (
            <input
              autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName} onKeyDown={(e) => e.key === "Enter" && commitName()}
              className="min-w-0 rounded-md px-2 py-1 text-[14px] font-semibold outline-none"
              style={{ background: INK_3, color: IVORY, fontFamily: FONT_BODY }}
            />
          ) : (
            <button onClick={() => { setNameDraft(table.name); setEditingName(true); }} className="truncate text-[14px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }} title="Click to rename">
              {table.name}
            </button>
          )}
          <span
            className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{ background: overCapacity ? "rgba(217,142,142,0.18)" : "rgba(143,191,163,0.18)", color: overCapacity ? "#E8A9A9" : "#A8D4BB", fontFamily: FONT_BODY }}
          >
            {occupied}/{table.capacity} seats
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateTable(table.id, { capacity: Math.max(1, table.capacity - 1) })} style={{ color: MUTED }}><ChevronDown size={13} /></button>
            <button onClick={() => onUpdateTable(table.id, { capacity: table.capacity + 1 })} style={{ color: MUTED }}><ChevronUp size={13} /></button>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <GhostButton danger onClick={() => onDeleteTable(table.id)}>Delete</GhostButton>
              <GhostButton onClick={() => setConfirmDelete(false)}>Cancel</GhostButton>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete table" style={{ color: MUTED }}><Trash2 size={14} /></button>
          )}
        </div>
      </div>

      {overCapacity && (
        <p className="mb-2 text-[10.5px]" style={{ color: "#E8A9A9", fontFamily: FONT_BODY }}>
          Over capacity by {occupied - table.capacity} — move a guest elsewhere or add seats.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: INK_3 }}>
            <div className="min-w-0">
              <div className="truncate text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
                {g.members.filter((m) => m.status === "yes").map((m) => m.name).join(", ") || g.lastName || "Guest"}
                {g.lastName ? ` (${g.lastName})` : ""}
              </div>
              <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{groupHeadcount(g)} seat{groupHeadcount(g) === 1 ? "" : "s"}</div>
            </div>
            <select
              value={table.id}
              onChange={(e) => onAssignGuest(g.id, e.target.value || null)}
              className="flex-shrink-0 rounded-md px-2 py-1 text-[11px] outline-none"
              style={{ background: INK_2, color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.3)`, fontFamily: FONT_BODY }}
            >
              {allTables.map((t) => <option key={t.id} value={t.id} style={{ background: INK_2, color: IVORY }}>{t.name}</option>)}
              <option value="" style={{ background: INK_2, color: IVORY }}>— Unassign —</option>
            </select>
          </div>
        ))}
        {groups.length === 0 && <p className="py-3 text-center text-[11px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>No guests seated here yet.</p>}
      </div>
    </div>
  );
}

function SeatingManager({ guestGroups, tables, onAddTable, onUpdateTable, onDeleteTable, onAssignGuest }) {
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);

  const confirmedGroups = guestGroups.filter(groupIsConfirmed);
  const unassigned = confirmedGroups.filter((g) => !g.tableId || !tables.some((t) => t.id === g.tableId));
  const totalSeated = confirmedGroups.filter((g) => g.tableId && tables.some((t) => t.id === g.tableId)).reduce((sum, g) => sum + groupHeadcount(g), 0);
  const totalConfirmed = confirmedGroups.reduce((sum, g) => sum + groupHeadcount(g), 0);

  const submitAddTable = () => {
    onAddTable(newTableName, newTableCapacity);
    setNewTableName("");
    setNewTableCapacity(8);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{totalSeated} of {totalConfirmed} confirmed guests seated</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Only guests with a confirmed "Attending" response can be assigned to a table.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TextInput value={newTableName} onChange={setNewTableName} placeholder="New table name" />
          <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: INK_3 }}>
            <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Seats</span>
            <input
              type="number" min={1} value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(Math.max(1, Number(e.target.value) || 1))}
              className="w-12 bg-transparent text-[12px] outline-none" style={{ color: IVORY, fontFamily: FONT_BODY }}
            />
          </div>
          <GoldButton onClick={submitAddTable}><Plus size={14} /> Add table</GoldButton>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="mb-5 rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(228,206,149,0.25)` }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12.5px] font-semibold" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>Unassigned</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(201,164,76,0.15)", color: GOLD_SOFT, fontFamily: FONT_BODY }}>{unassigned.length}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {unassigned.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: INK_3 }}>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
                    {g.members.filter((m) => m.status === "yes").map((m) => m.name).join(", ") || g.lastName || "Guest"}
                    {g.lastName ? ` (${g.lastName})` : ""}
                  </div>
                  <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{groupHeadcount(g)} seat{groupHeadcount(g) === 1 ? "" : "s"}</div>
                </div>
                {tables.length > 0 ? (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onAssignGuest(g.id, e.target.value)}
                    className="flex-shrink-0 rounded-md px-2 py-1 text-[11px] outline-none"
                    style={{ background: INK_2, color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.3)`, fontFamily: FONT_BODY }}
                  >
                    <option value="" disabled style={{ background: INK_2, color: MUTED }}>Assign to…</option>
                    {tables.map((t) => <option key={t.id} value={t.id} style={{ background: INK_2, color: IVORY }}>{t.name}</option>)}
                  </select>
                ) : (
                  <span className="text-[10.5px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>Add a table first</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tables.length === 0 ? (
        <p className="py-10 text-center text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No tables yet — add one above to start seating guests.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tables.map((t) => (
            <TableCard
              key={t.id} table={t} allTables={tables}
              groups={confirmedGroups.filter((g) => g.tableId === t.id)}
              onUpdateTable={onUpdateTable} onDeleteTable={onDeleteTable} onAssignGuest={onAssignGuest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardView({ guestGroups, addGuestGroup, updateGuestGroup, deleteGuestGroup, moveGuestGroup, tables, addTable, updateTable, deleteTable, assignGuestToTable, integrations, coupleTitle, slug, siteDomain }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [addGuestsCount, setAddGuestsCount] = useState(0);
  const [phone, setPhone] = useState("");
  const [copiedOpenLink, setCopiedOpenLink] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [sendNote, setSendNote] = useState("");
  const [subTab, setSubTab] = useState("guests");
  const [copiedLivestream, setCopiedLivestream] = useState(false);

  const allMembers = flattenMembers(guestGroups);
  const yes = allMembers.filter((m) => m.status === "yes").length;
  const no = allMembers.filter((m) => m.status === "no").length;
  const pending = allMembers.filter((m) => m.status === "pending").length;
  const total = allMembers.length;
  const totalInvited = allMembers.length + guestGroups.reduce((sum, g) => sum + (g.additionalGuests || 0), 0);
  const rate = total ? Math.round(((yes + no) / total) * 100) : 0;

  const pieData = [
    { name: "Attending", value: yes, color: CHART_COLORS.yes },
    { name: "Not attending", value: no, color: CHART_COLORS.no },
    { name: "Awaiting reply", value: pending, color: CHART_COLORS.pending },
  ];

  const filtered = guestGroups
    .filter((g) => (filter === "all" ? true : g.members.some((m) => m.status === filter)))
    .filter((g) => {
      const q = search.toLowerCase();
      return !q || g.lastName.toLowerCase().includes(q) || g.members.some((m) => m.name.toLowerCase().includes(q));
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, pageCount - 1);
  const paged = filtered.slice(pageSafe * pageSize, pageSafe * pageSize + pageSize);

  const openLink = `https://${siteDomain}/e/${slug}`;
  const copyOpenInvitation = async () => {
    const ok = await copyToClipboard(openLink);
    setCopiedOpenLink(ok);
    setTimeout(() => setCopiedOpenLink(false), 2000);
  };

  const guestLink = (group) => `https://${siteDomain}/e/${slug}?g=${group.id}`;
  const copyGuestLink = async (group) => {
    const ok = await copyToClipboard(guestLink(group));
    setCopiedRowId(ok ? group.id : null);
    setTimeout(() => setCopiedRowId(null), 2000);
  };
  const whatsappHrefFor = (group) => {
    const digits = group.phone.replace(/[^0-9]/g, "");
    const msg = `Hi ${group.members[0]?.name || ""}! Here's your invitation link: ${guestLink(group)}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  };

  const toggleSelected = (id) =>
    setSelectedIds((s) => { const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleSelectAllVisible = () => {
    setSelectedIds((s) => {
      const allSelected = paged.every((g) => s.has(g.id));
      const next = new Set(s);
      paged.forEach((g) => (allSelected ? next.delete(g.id) : next.add(g.id)));
      return next;
    });
  };

  // Real one-tap bulk WhatsApp sending needs the Meta Business API (browsers can't
  // send messages on their own) — see the whatsapp-cloud-api backend from earlier.
  // What this can genuinely do: open the chat for the first pending guest (browsers
  // only allow one popup per real click), and mark everyone targeted as sent so the
  // Sent/Viewed columns stay an accurate to-do list while you work through the rest
  // using each row's own WhatsApp button.
  const sendInvites = () => {
    const pool = selectedIds.size > 0 ? filtered.filter((g) => selectedIds.has(g.id)) : filtered;
    const targets = pool.filter((g) => g.phone && !g.invitationSent);
    if (targets.length === 0) {
      setSendNote("Nothing to send — everyone selected already has an invite marked sent, or has no phone number.");
      setTimeout(() => setSendNote(""), 5000);
      return;
    }
    window.open(whatsappHrefFor(targets[0]), "_blank");
    targets.forEach((g) => updateGuestGroup(g.id, { invitationSent: true }));
    setSendNote(
      targets.length === 1
        ? `Opened WhatsApp for ${targets[0].members[0]?.name || targets[0].lastName} and marked their invite as sent.`
        : `Opened WhatsApp for the first guest and marked all ${targets.length} as sent. For real bulk sending in one click, use the whatsapp-cloud-api backend (see Settings).`
    );
    setTimeout(() => setSendNote(""), 7000);
  };

  const nameAdditionalGuest = (group, name) => {
    updateGuestGroup(group.id, {
      members: [...group.members, { id: uid(), name, status: "pending" }],
      additionalGuests: Math.max(0, group.additionalGuests - 1),
    });
  };

  const submitAddGuest = () => {
    if (!lastName.trim() || !firstName.trim()) return;
    addGuestGroup({
      id: uid(), lastName: lastName.trim(),
      members: [{ id: uid(), name: firstName.trim(), status: "pending" }],
      additionalGuests: addGuestsCount, table: "", phone: phone.trim(), invitationSent: false, invitationViewed: false, updatedAt: Date.now(),
    });
    setLastName(""); setFirstName(""); setAddGuestsCount(0); setPhone("");
  };

  const addBlankRow = () => addGuestGroup({ id: uid(), lastName: "", members: [], additionalGuests: 0, table: "", phone: "", invitationSent: false, invitationViewed: false, updatedAt: Date.now() });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero banner */}
      <div className="mb-6 overflow-hidden rounded-2xl p-8 text-center" style={{ background: "linear-gradient(150deg, #1B2440 0%, #202C52 55%, #12182E 100%)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <Users size={22} color={ROSE} style={{ margin: "0 auto 8px" }} />
        <h2 className="text-2xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Guests</h2>
        <p className="mt-1 text-[12px]" style={{ color: "rgba(244,237,228,0.7)", fontFamily: FONT_BODY }}>Manage your guest list and track RSVPs — {coupleTitle}</p>
        <span className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "rgba(226,155,183,0.15)", color: "#E8A9C8", fontFamily: FONT_BODY }}>
          {totalInvited} guests
        </span>
      </div>

      <div className="mb-6 flex gap-2">
        <GhostButton active={subTab === "guests"} onClick={() => setSubTab("guests")}>Guest List</GhostButton>
        <GhostButton active={subTab === "seating"} onClick={() => setSubTab("seating")}>Table Seating</GhostButton>
      </div>

      {integrations && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ background: INK_2, border: `1px solid ${integrations.livestreamUrl ? "rgba(143,191,163,0.3)" : "rgba(201,164,76,0.12)"}` }}>
          <div className="flex items-center gap-2.5">
            <Video size={16} color={integrations.livestreamUrl ? CHART_COLORS.yes : MUTED} />
            <div>
              <div className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>
                Live Stream — {integrations.livestreamUrl ? "Ready for guests" : "Not set up yet"}
                {integrations.livestreamPaid && (
                  <span className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase" style={{ background: "rgba(201,164,76,0.18)", color: GOLD_SOFT, fontFamily: FONT_BODY }}>
                    Paid · {integrations.livestreamPrice || "price not set"}
                  </span>
                )}
              </div>
              <div className="max-w-md truncate text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                {integrations.livestreamPaid && !integrations.livestreamPaymentUrl
                  ? "Paid mode is on but no payment link is set yet — guests can't pay until you add one in the Builder."
                  : integrations.livestreamUrl || 'Add the stream link from the "Live Stream" page in the Builder to activate this for guests.'}
              </div>
            </div>
          </div>
          {integrations.livestreamUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => { const ok = await copyToClipboard(integrations.livestreamUrl); setCopiedLivestream(ok); setTimeout(() => setCopiedLivestream(false), 2000); }}
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ background: INK_3, color: copiedLivestream ? GOLD_SOFT : IVORY }}
                title="Copy link"
              >
                <Copy size={13} />
              </button>
              <a href={integrations.livestreamUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[11.5px] font-semibold" style={{ background: CHART_COLORS.yes, color: "#0B2E1A", fontFamily: FONT_BODY }}>
                Open <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>
      )}

      {subTab === "seating" ? (
        <SeatingManager
          guestGroups={guestGroups} tables={tables}
          onAddTable={addTable} onUpdateTable={updateTable} onDeleteTable={deleteTable} onAssignGuest={assignGuestToTable}
        />
      ) : (
        <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total responded" value={total} />
        <StatCard label="Attending" value={yes} accent={CHART_COLORS.yes} />
        <StatCard label="Not attending" value={no} accent={CHART_COLORS.no} />
        <StatCard label="Response rate" value={`${rate}%`} accent={GOLD} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-2" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: INK_3, border: "none", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 12, color: IVORY }} />
              <Legend wrapperStyle={{ fontFamily: FONT_BODY, fontSize: 11, color: IVORY }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <FieldLabel>Add a guest family</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <TextInput value={firstName} onChange={setFirstName} placeholder="First name" />
            <TextInput value={lastName} onChange={setLastName} placeholder="Last name" />
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: INK_3 }}>
            <span className="text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>+ Guests</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setAddGuestsCount((c) => Math.max(0, c - 1))} style={{ color: IVORY }}><ChevronDown size={14} /></button>
              <span className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{addGuestsCount}</span>
              <button onClick={() => setAddGuestsCount((c) => c + 1)} style={{ color: IVORY }}><ChevronUp size={14} /></button>
            </div>
          </div>
          <TextInput value={phone} onChange={setPhone} placeholder="Phone (for WhatsApp), optional" />
          <GoldButton onClick={submitAddGuest}><Plus size={14} /> Add guest</GoldButton>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Guest List</h3>
          <div className="flex items-center gap-2">
            <GhostButton onClick={copyOpenInvitation}>
              <Copy size={12} /> {copiedOpenLink ? "Copied!" : "Copy Open Invitation"}
            </GhostButton>
            <GhostButton onClick={sendInvites}>
              <MessageCircle size={12} /> Send Invites{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </GhostButton>
            <button onClick={addBlankRow} title="Add a blank row" className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: INK_3, color: GOLD_SOFT }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {sendNote && (
          <div className="mb-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "rgba(201,164,76,0.1)", color: GOLD_SOFT, fontFamily: FONT_BODY }}>
            {sendNote}
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: INK_3, flex: 1, minWidth: 160 }}>
            <Search size={12} color={MUTED} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search by name" className="w-full bg-transparent text-[12px] outline-none" style={{ color: IVORY, fontFamily: FONT_BODY }} />
          </div>
          {["all", "yes", "no", "pending"].map((f) => (
            <GhostButton key={f} active={filter === f} onClick={() => { setFilter(f); setPage(0); }}>
              {f === "all" ? "All" : f === "yes" ? "Attending" : f === "no" ? "Not attending" : "Pending"}
            </GhostButton>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 26 }} />
              <col style={{ width: 64 }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(147,166,155,0.15)" }}>
                <th className="px-1">
                  <input type="checkbox" checked={paged.length > 0 && paged.every((g) => selectedIds.has(g.id))} onChange={toggleSelectAllVisible} />
                </th>
                <th></th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Members</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Last Name</th>
                <th className="px-2 py-2 text-center text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>+ Guests</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>
                  RSVPs
                  <span className="ml-1.5 font-normal normal-case" style={{ color: "rgba(147,166,155,0.7)", fontSize: 9 }}>
                    (<span style={{ color: CHART_COLORS.yes }}>●</span> yes <span style={{ color: CHART_COLORS.no }}>●</span> no <span style={{ color: "#9AA8A0" }}>●</span> pending)
                  </span>
                </th>
                <th className="px-1 py-2 text-center text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Sent</th>
                <th className="px-1 py-2 text-center text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Viewed</th>
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((g, rowIndex) => {
                const confirming = confirmDeleteId === g.id;
                if (confirming) {
                  return (
                    <tr key={g.id} className="border-b" style={{ borderColor: "rgba(147,166,155,0.08)" }}>
                      <td colSpan={9} className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Delete {g.lastName || "this guest"}?</span>
                          <GhostButton danger onClick={() => { deleteGuestGroup(g.id); setConfirmDeleteId(null); }}>Yes, delete</GhostButton>
                          <GhostButton onClick={() => setConfirmDeleteId(null)}>Cancel</GhostButton>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={g.id} className="border-b align-middle" style={{ borderColor: "rgba(147,166,155,0.08)", opacity: g.hidden ? 0.45 : 1 }}>
                    <td className="px-1">
                      <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelected(g.id)} />
                    </td>
                    <td className="px-2 py-0.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateGuestGroup(g.id, { hidden: !g.hidden })} title={g.hidden ? "Show guest" : "Hide guest"} style={{ color: MUTED }}>
                          {g.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button onClick={() => setConfirmDeleteId(g.id)} title="Delete" style={{ color: MUTED }}>
                          <Trash2 size={13} />
                        </button>
                        <div className="flex flex-col">
                          <button onClick={() => moveGuestGroup(g.id, -1)} disabled={rowIndex === 0 && pageSafe === 0} style={{ color: MUTED }}><ChevronUp size={11} /></button>
                          <button onClick={() => moveGuestGroup(g.id, 1)} style={{ color: MUTED }}><ChevronDown size={11} /></button>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-0.5">
                      <div className="guest-scroll flex flex-nowrap items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
                        {g.members.map((m) => <MemberBadge key={m.id} member={m} />)}
                        {Array.from({ length: g.additionalGuests || 0 }).map((_, i) => (
                          <UnnamedBadge key={i} onNamed={(name) => nameAdditionalGuest(g, name)} />
                        ))}
                        {g.members.length === 0 && !g.additionalGuests && (
                          <span className="whitespace-nowrap text-[11px] italic" style={{ color: "rgba(147,166,155,0.5)", fontFamily: FONT_BODY }}>No members yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-0.5">
                      <input
                        value={g.lastName}
                        onChange={(e) => updateGuestGroup(g.id, { lastName: e.target.value })}
                        placeholder="Last name"
                        className="w-full rounded-md bg-transparent px-1 py-0.5 text-[12px] outline-none"
                        style={{ color: IVORY, fontFamily: FONT_BODY }}
                      />
                    </td>
                    <td className="px-2 py-0.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={g.additionalGuests || 0}
                        onChange={(e) => updateGuestGroup(g.id, { additionalGuests: Math.max(0, Number(e.target.value)) })}
                        className="w-12 rounded-md px-1.5 py-0.5 text-center text-[12px] outline-none"
                        style={{ background: INK_3, color: IVORY, border: `1px solid ${INK_3}`, fontFamily: FONT_BODY }}
                      />
                    </td>
                    <td className="px-2 py-0.5">
                      <RsvpBadges members={g.members} />
                    </td>
                    <td className="px-1 py-0.5 text-center">
                      <button onClick={() => updateGuestGroup(g.id, { invitationSent: !g.invitationSent })} title={g.invitationSent ? "Marked as sent — click to unmark" : "Not sent yet — click to mark as sent"}>
                        {g.invitationSent ? <CheckCircle2 size={14} color={CHART_COLORS.yes} /> : <XCircle size={14} color="rgba(147,166,155,0.4)" />}
                      </button>
                    </td>
                    <td className="px-1 py-0.5 text-center">
                      <button onClick={() => updateGuestGroup(g.id, { invitationViewed: !g.invitationViewed })} title={g.invitationViewed ? "Marked as viewed — click to unmark" : "Not viewed yet — click to mark as viewed"}>
                        {g.invitationViewed ? <CheckCircle2 size={14} color={CHART_COLORS.yes} /> : <XCircle size={14} color="rgba(147,166,155,0.4)" />}
                      </button>
                    </td>
                    <td className="px-2 py-0.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => copyGuestLink(g)} title="Copy personal invite link" className="flex h-5 w-5 items-center justify-center rounded" style={{ background: INK_3, color: copiedRowId === g.id ? GOLD_SOFT : "#7FA8D9" }}>
                          <Copy size={10} />
                        </button>
                        {g.phone ? (
                          <a href={whatsappHrefFor(g)} target="_blank" rel="noreferrer" onClick={() => updateGuestGroup(g.id, { invitationSent: true })} title="Message on WhatsApp" className="flex h-5 w-5 items-center justify-center rounded" style={{ background: "#25D366", color: "#0B2E1A" }}>
                            <MessageCircle size={10} />
                          </a>
                        ) : (
                          <span title="No phone number on file" className="flex h-5 w-5 items-center justify-center rounded" style={{ background: INK_3, color: "rgba(147,166,155,0.35)" }}>
                            <MessageCircle size={10} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-6 text-center text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No guests match this filter.</p>}
        </div>

        {filtered.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "rgba(147,166,155,0.15)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Rows per page:</span>
              <Select value={String(pageSize)} onChange={(v) => { setPageSize(Number(v)); setPage(0); }} options={[{ value: "25", label: "25" }, { value: "50", label: "50" }, { value: "100", label: "100" }]} />
            </div>
            <span className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              {pageSafe * pageSize + 1}–{Math.min(filtered.length, (pageSafe + 1) * pageSize)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</GhostButton>
              <span className="text-[11px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>Page {pageSafe + 1} of {pageCount}</span>
              <GhostButton onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>Next</GhostButton>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Event overview (shown when the owner opens/creates an invitation         */
/* for a specific user)                                                    */
/* ---------------------------------------------------------------------- */

function OverviewStatCard({ icon: Icon, iconBg, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
        <Icon size={16} color={IVORY} />
      </div>
      <div>
        <div className="text-lg font-semibold" style={{ color: IVORY, fontFamily: FONT_DISPLAY }}>{value}</div>
        <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{label}</div>
      </div>
    </div>
  );
}

function EventOverviewView({
  user, cover, rsvpSchedule, guestGroups, og, setOg,
  onUpdateNames, onUpdateDate, onSaveDraft, saveStatus,
  onUpdateUserEmail, onToggleDashboardAccess, onToggleCanDesign,
  onOpenBuilder, onBack,
}) {
  const [names, setNames] = useState({ name1: cover.name1, name2: cover.name2 });
  const [date, setDate] = useState(rsvpSchedule.date);
  const [emailDraft, setEmailDraft] = useState(user.email);
  const [editingEmail, setEditingEmail] = useState(false);

  const cd = useCountdown(date, rsvpSchedule.time);
  const allMembers = flattenMembers(guestGroups);
  const yes = allMembers.filter((m) => m.status === "yes").length;
  const no = allMembers.filter((m) => m.status === "no").length;

  const onUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageCompressed(file, 1200, 0.82);
      setOg((o) => ({ ...o, image: dataUrl }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setOg((o) => ({ ...o, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const saveDetails = () => {
    onUpdateNames(names);
    onUpdateDate(date);
    onSaveDraft();
  };

  const saveEmail = () => {
    onUpdateUserEmail(user.id, emailDraft.trim() || user.email);
    setEditingEmail(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          <ArrowLeft size={13} /> Back to Users
        </button>
        <GhostButton onClick={onOpenBuilder}>
          <Heart size={12} /> Open full builder
        </GhostButton>
      </div>

      {/* Header banner */}
      <div className="mb-5 overflow-hidden rounded-2xl p-6 text-center" style={{ background: "linear-gradient(150deg, #1F3A2E 0%, #24463D 55%, #16211D 100%)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <h2 className="text-2xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>
          {names.name1 || "—"} <span style={{ color: ROSE }}>&amp;</span> {names.name2 || "—"}
        </h2>
        {date && (
          <p className="mt-1 text-[12.5px]" style={{ color: "rgba(244,237,228,0.75)", fontFamily: FONT_BODY }}>
            {new Date(`${date}T00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
        {cd && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: cd.passed ? "rgba(143,191,163,0.15)" : "rgba(201,164,76,0.15)", color: cd.passed ? CHART_COLORS.yes : GOLD_SOFT, fontFamily: FONT_BODY }}
          >
            {cd.passed ? <>🎉 Today is the day!</> : `${cd.days} day${cd.days === 1 ? "" : "s"} to go`}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OverviewStatCard icon={CalendarDays} iconBg={EMERALD} value={cd ? cd.days : "—"} label="Days to go" />
        <OverviewStatCard icon={Users} iconBg="#2F4A6B" value={guestGroups.length} label="Total guests" />
        <OverviewStatCard icon={ThumbsUp} iconBg="#2E5A44" value={yes} label="Accepted" />
        <OverviewStatCard icon={ThumbsDown} iconBg="#6B2E33" value={no} label="Declined" />
      </div>

      {/* Wedding details */}
      <div className="mb-5 rounded-2xl p-5" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Wedding details</h3>
          <GoldButton onClick={saveDetails}>
            <Check size={12} /> {saveStatus === "saving" ? "Saving…" : "Save"}
          </GoldButton>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Bride's name</FieldLabel>
            <TextInput value={names.name1} onChange={(v) => setNames((n) => ({ ...n, name1: v }))} />
          </div>
          <div>
            <FieldLabel>Groom's name</FieldLabel>
            <TextInput value={names.name2} onChange={(v) => setNames((n) => ({ ...n, name2: v }))} />
          </div>
        </div>
        <div className="mt-3">
          <FieldLabel>Wedding date</FieldLabel>
          <TextInput type="date" value={date} onChange={setDate} />
        </div>
      </div>

      {/* Share preview */}
      <div className="mb-5 rounded-2xl p-5" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <h3 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Share preview</h3>
        <p className="mt-1 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          The photo and caption shown when this invitation link is shared on WhatsApp. Saved with the Save button above.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg" style={{ border: og.image ? `2px solid ${GOLD}` : `2px dashed rgba(147,166,155,0.5)`, background: og.image ? `url(${og.image}) center/cover` : INK_3 }}>
            {!og.image && <ImagePlus size={16} style={{ color: MUTED }} />}
            <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUploadPhoto} />
          </label>
          <GhostUploadButton accept="image/*" onChange={onUploadPhoto}>
            <ImagePlus size={13} /> Upload photo
          </GhostUploadButton>
        </div>
        <div className="mt-3">
          <FieldLabel>Share description</FieldLabel>
          <TextArea value={og.description} onChange={(v) => setOg((o) => ({ ...o, description: v }))} rows={2} placeholder="A short line guests see when the link is shared" />
        </div>
      </div>

      {/* Couple account */}
      <div className="rounded-2xl p-5" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <h3 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Couple account</h3>
        <p className="mt-1 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          Give the couple their own login, and choose what it can do.
        </p>

        {editingEmail ? (
          <div className="mt-3 flex items-center gap-2">
            <TextInput value={emailDraft} onChange={setEmailDraft} placeholder="couple@email.com" />
            <GhostButton onClick={saveEmail}>Save</GhostButton>
            <GhostButton onClick={() => { setEmailDraft(user.email); setEditingEmail(false); }}>Cancel</GhostButton>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
              Linked to <strong style={{ color: GOLD_SOFT }}>{user.name}</strong> ({user.email})
            </span>
            <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1 text-[12px] underline" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
              <Pencil size={11} /> Edit
            </button>
          </div>
        )}

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: INK_3 }}>
            <div>
              <div className="text-[12px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>View RSVP dashboard</div>
              <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>See guest responses — read only</div>
            </div>
            <button
              onClick={() => onToggleDashboardAccess(user.id)}
              className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors"
              style={{ background: user.dashboardAccess ? GOLD : INK_2 }}
            >
              <span className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ background: IVORY, transform: user.dashboardAccess ? "translateX(18px)" : "translateX(2px)" }} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: INK_3 }}>
            <div>
              <div className="text-[12px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>Can design the invitation</div>
              <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Edit slides, text, and background in the Builder</div>
            </div>
            <button
              onClick={() => onToggleCanDesign(user.id)}
              className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors"
              style={{ background: user.canDesign ? GOLD : INK_2 }}
            >
              <span className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ background: IVORY, transform: user.canDesign ? "translateX(18px)" : "translateX(2px)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Users view (admin)                                                      */
/* ---------------------------------------------------------------------- */

function UsersView({ users, invitationsStore, onDelete, onToggleStatus, onCreateInvitationFor, onApprove, onToggleDashboardAccess, onToggleCanDesign, siteDomain }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [approvalNotice, setApprovalNotice] = useState(null);

  const copyUserLink = async (user) => {
    const link = `https://${siteDomain}/e/${user.invitationSlug}`;
    const ok = await copyToClipboard(link);
    setCopiedLinkId(ok ? user.id : null);
    setTimeout(() => setCopiedLinkId(null), 1800);
  };

  const approveUser = (user) => {
    onApprove(user.id);
    setApprovalNotice(user.email);
    setTimeout(() => setApprovalNotice(null), 4000);
    onCreateInvitationFor({ ...user, status: "active", dashboardAccess: true, canDesign: true });
  };

  const filtered = users
    .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
    .filter((u) => (statusFilter === "all" ? true : u.status === statusFilter))
    .filter((u) => {
      const q = search.toLowerCase();
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const activeCount = users.filter((u) => u.status === "active").length;
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Admin Dashboard</h2>
      <p className="mb-6 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        {users.length} total · {activeCount} active{pendingCount > 0 ? ` · ${pendingCount} awaiting approval` : ""} — each client's invitation, guest list, and settings are kept separate from every other client's.
      </p>

      {approvalNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(201,164,76,0.1)", border: `1px solid rgba(201,164,76,0.35)` }}>
          <Mail size={14} color={GOLD} />
          <span className="text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
            Approved — a notification email was sent to <strong style={{ color: GOLD_SOFT }}>{approvalNotice}</strong>.
          </span>
          <span className="ml-auto text-[10.5px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>(simulated — no real email sent)</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2" style={{ background: INK_3, minWidth: 180 }}>
          <Search size={13} color={MUTED} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="w-full bg-transparent text-sm outline-none" style={{ color: IVORY, fontFamily: FONT_BODY }} />
        </div>
        {["all", "owner", "couple", "normal"].map((r) => (
          <GhostButton key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>
            {r === "all" ? "All roles" : USER_ROLES[r].label}
          </GhostButton>
        ))}
        <div className="mx-1 h-5 w-px" style={{ background: "rgba(147,166,155,0.25)" }} />
        {["all", "pending", "active", "inactive"].map((s) => (
          <GhostButton key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All statuses" : STATUS_STYLE[s].label}
          </GhostButton>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <div className="hidden gap-3 border-b px-5 py-3 lg:grid" style={{ gridTemplateColumns: "1.1fr 1.4fr 0.6fr 0.8fr 0.7fr 1.7fr", borderColor: "rgba(147,166,155,0.15)" }}>
          {["Name", "Email", "Role", "Status", "Permissions", "Actions"].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>{h}</span>
          ))}
        </div>

        {filtered.map((u) => {
          const role = USER_ROLES[u.role];
          const statusStyle = STATUS_STYLE[u.status];
          const isActive = u.status === "active";
          const isPending = u.status === "pending";
          const confirming = confirmDeleteId === u.id;
          const clientData = invitationsStore[u.id];
          const guestCount = clientData ? clientData.guestGroups.length : null;
          return (
            <div key={u.id} className="grid grid-cols-1 gap-2 border-b px-5 py-2.5 lg:grid-cols-[1.1fr_1.4fr_0.6fr_0.8fr_0.7fr_1.7fr] lg:items-center lg:gap-3" style={{ borderColor: "rgba(147,166,155,0.1)" }}>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>{u.name}</span>
                {guestCount !== null && (
                  <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: "rgba(201,164,76,0.15)", color: GOLD_SOFT, fontFamily: FONT_BODY }} title="Guests on their invitation">
                    {guestCount}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }} title={u.phone ? `${u.email} · ${u.phone}` : u.email}>
                  {u.email}
                </span>
                {u.invitationSlug ? (
                  <>
                    <a href={`https://${siteDomain}/e/${u.invitationSlug}`} target="_blank" rel="noreferrer" title={`Open invitation: ${siteDomain}/e/${u.invitationSlug}`} style={{ color: GOLD_SOFT, flexShrink: 0 }}>
                      <Link2 size={12} />
                    </a>
                    <button onClick={() => copyUserLink(u)} title="Copy invitation link" style={{ color: copiedLinkId === u.id ? GOLD_SOFT : MUTED, flexShrink: 0 }}>
                      <Copy size={11} />
                    </button>
                  </>
                ) : (
                  <span className="flex-shrink-0 text-[10px] italic" style={{ color: "rgba(147,166,155,0.5)", fontFamily: FONT_BODY }}>no invite</span>
                )}
              </div>
              <span>
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "rgba(255,255,255,0.06)", color: role.color, fontFamily: FONT_BODY }}>
                  {role.label}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: statusStyle.color }} />
                <span className="truncate text-[11.5px]" style={{ color: statusStyle.color, fontFamily: FONT_BODY }}>
                  {statusStyle.label}
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => u.role !== "owner" && onToggleDashboardAccess(u.id)}
                  title={u.role === "owner" ? "Owners always have dashboard access" : (u.dashboardAccess ? "Dashboard access on — click to revoke" : "Dashboard access off — click to grant")}
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: (u.dashboardAccess || u.role === "owner") ? "rgba(201,164,76,0.2)" : INK_3, color: (u.dashboardAccess || u.role === "owner") ? GOLD_SOFT : MUTED, opacity: u.role === "owner" ? 0.6 : 1 }}
                >
                  <Eye size={12} />
                </button>
                <button
                  onClick={() => u.role !== "owner" && onToggleCanDesign(u.id)}
                  title={u.role === "owner" ? "Owners can always design" : (u.canDesign ? "Design access on — click to revoke" : "Design access off — click to grant")}
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: (u.canDesign || u.role === "owner") ? "rgba(201,164,76,0.2)" : INK_3, color: (u.canDesign || u.role === "owner") ? GOLD_SOFT : MUTED, opacity: u.role === "owner" ? 0.6 : 1 }}
                >
                  <Pencil size={12} />
                </button>
              </div>

              {confirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Delete {u.name}?</span>
                  <GhostButton danger onClick={() => { onDelete(u.id); setConfirmDeleteId(null); }}>Yes, delete</GhostButton>
                  <GhostButton onClick={() => setConfirmDeleteId(null)}>Cancel</GhostButton>
                </div>
              ) : (
                <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto">
                  {isPending && (
                    <GhostButton onClick={() => approveUser(u)}>
                      <CheckCircle2 size={12} /> Approve &amp; Create Invite
                    </GhostButton>
                  )}
                  {isActive && (
                    <GhostButton onClick={() => onCreateInvitationFor(u)}>
                      <FilePlus2 size={12} /> New invite
                    </GhostButton>
                  )}
                  {!isPending && (
                    <GhostButton onClick={() => onToggleStatus(u.id)}>
                      {isActive ? <><Lock size={12} /> Freeze</> : <><Unlock size={12} /> Activate</>}
                    </GhostButton>
                  )}
                  <GhostButton danger onClick={() => setConfirmDeleteId(u.id)}>
                    <Trash2 size={12} /> Delete
                  </GhostButton>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No users match this filter.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Guest sign-up & login preview                                           */
/* ---------------------------------------------------------------------- */

function AuthPreview({ users, onSignUp, onExit, onEnterBuilderAs }) {
  const [screen, setScreen] = useState("signup"); // signup | pendingNotice | login | welcome
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const submitSignUp = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || form.password.length < 6) {
      setError("Please fill in your name, email, phone number, and a password of at least 6 characters.");
      return;
    }
    if (form.phone.replace(/[^0-9]/g, "").length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError("An account with that email already exists.");
      return;
    }
    onSignUp({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
    setScreen("pendingNotice");
  };

  const submitLogin = (e) => {
    e.preventDefault();
    setError("");
    const match = users.find((u) => u.email.toLowerCase() === form.email.toLowerCase());
    if (!match || match.password !== form.password) {
      setError("Incorrect email or password.");
      return;
    }
    if (match.status === "pending") {
      setError("This account is still awaiting the owner's approval — check back once you get the approval email.");
      return;
    }
    if (match.status === "inactive") {
      setError("This account has been frozen. Contact the site owner for help.");
      return;
    }
    setLoggedInUser(match);
    setScreen("welcome");
  };

  const shell = (children) => (
    <div className="mx-auto max-w-md rounded-2xl p-7" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}>
      {children}
    </div>
  );

  return (
    <div className="mx-auto max-w-md">
      {onExit && (
        <button onClick={onExit} className="mb-5 flex items-center gap-1.5 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          <ArrowLeft size={13} /> Back to admin app
        </button>
      )}

      {screen === "signup" &&
        shell(
          <>
            <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Create your account</h2>
            <p className="mb-5 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Anyone can sign up — an owner reviews and approves new accounts before you can log in.</p>
            <form onSubmit={submitSignUp} className="space-y-3">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Jane Doe" />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="jane@example.com" />
              </div>
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <TextInput type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+961 70 123 456" />
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="flex items-center gap-2 rounded-lg px-3" style={{ background: INK_3, border: `1px solid ${INK_3}` }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                    style={{ color: IVORY, fontFamily: FONT_BODY }}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} style={{ color: MUTED }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
              <GoldButton onClick={submitSignUp}>
                <UserPlus size={14} /> Sign up
              </GoldButton>
            </form>
            <button onClick={() => { setError(""); setScreen("login"); }} className="mt-4 text-[12px] underline" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
              Already approved? Log in instead
            </button>
          </>
        )}

      {screen === "pendingNotice" &&
        shell(
          <div className="text-center">
            <Mail size={28} color={GOLD} style={{ margin: "0 auto 12px" }} />
            <h2 className="mb-2 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>You're all set — almost</h2>
            <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              Your account is waiting for the owner's approval. You'll get an email at <strong style={{ color: GOLD_SOFT }}>{form.email}</strong> the moment you're approved — then you can log in and start designing your invitation.
            </p>
            <button onClick={() => setScreen("login")} className="mt-5 text-[12px] underline" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
              I've been approved — take me to login
            </button>
          </div>
        )}

      {screen === "login" &&
        shell(
          <>
            <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Log in</h2>
            <p className="mb-5 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Welcome back — enter the details from your account.</p>
            <form onSubmit={submitLogin} className="space-y-3">
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="jane@example.com" />
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <TextInput type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="••••••••" />
              </div>
              {error && <p className="text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
              <GoldButton onClick={submitLogin}>
                <LogIn size={14} /> Log in
              </GoldButton>
            </form>
            <button onClick={() => { setError(""); setScreen("signup"); }} className="mt-4 text-[12px] underline" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
              Don't have an account? Sign up
            </button>
          </>
        )}

      {screen === "welcome" && loggedInUser &&
        shell(
          <div className="text-center">
            <ShieldCheck size={28} color={GOLD} style={{ margin: "0 auto 12px" }} />
            <h2 className="mb-2 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Welcome, {loggedInUser.name}</h2>
            <p className="mb-4 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Here's what your account can access:</p>
            <div className="mb-5 flex flex-col items-center gap-1.5">
              <span className="text-[12px]" style={{ color: loggedInUser.canDesign ? IVORY : "rgba(147,166,155,0.5)", fontFamily: FONT_BODY }}>
                {loggedInUser.canDesign ? "✓" : "✕"} Invitation Builder — {loggedInUser.canDesign ? "design your own invitation" : "not granted yet"}
              </span>
              <span className="text-[12px]" style={{ color: loggedInUser.dashboardAccess ? IVORY : "rgba(147,166,155,0.5)", fontFamily: FONT_BODY }}>
                {loggedInUser.dashboardAccess ? "✓" : "✕"} RSVP Dashboard — {loggedInUser.dashboardAccess ? "view guest responses (read only)" : "not granted yet"}
              </span>
              <span className="text-[12px]" style={{ color: "rgba(147,166,155,0.5)", fontFamily: FONT_BODY }}>✕ Managing other clients — owner only</span>
            </div>
            {loggedInUser.canDesign ? (
              <GoldButton onClick={() => onEnterBuilderAs(loggedInUser)}>
                <Heart size={14} /> Go design my invitation
              </GoldButton>
            ) : (
              <p className="text-[11.5px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                Ask the owner to grant design access to unlock the Builder.
              </p>
            )}
          </div>
        )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DJ Dashboard — served at /dj/:slug, a private link for the DJ only.      */
/* Polls for new requests every few seconds rather than a real websocket    */
/* subscription, since this app talks to Supabase via plain fetch() calls   */
/* rather than the full client SDK — simpler, and good enough for this.     */
/* ---------------------------------------------------------------------- */

function DjDashboard({ slug }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    const rows = await getSongRequests(slug);
    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [slug]);

  const setStatus = async (id, status) => {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r))); // optimistic, corrected by the next poll if it fails
    await updateSongRequestStatus(id, status);
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: INK, color: IVORY, fontFamily: FONT_BODY }}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-2 flex items-center gap-2">
          <Music2 size={20} color={GOLD} />
          <h1 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}>DJ Dashboard</h1>
        </div>
        <p className="mb-6 text-[12.5px]" style={{ color: MUTED }}>
          Live song requests for this event — refreshes automatically every few seconds. {pendingCount} pending right now.
        </p>

        <div className="mb-5 flex gap-2">
          {["pending", "played", "skipped", "all"].map((f) => (
            <GhostButton key={f} active={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</GhostButton>
          ))}
        </div>

        {loading ? (
          <p className="text-[12.5px]" style={{ color: MUTED }}>Loading requests…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: MUTED }}>No {filter === "all" ? "" : filter} requests yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold" style={{ fontFamily: FONT_BODY }}>{r.song_name}</div>
                  {r.artist && <div className="truncate text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{r.artist}</div>}
                  {r.requester_name && <div className="mt-1 text-[10.5px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>Requested by {r.requester_name}</div>}
                </div>
                <div className="flex flex-shrink-0 gap-1.5">
                  {r.status !== "played" && <GhostButton onClick={() => setStatus(r.id, "played")}>Played</GhostButton>}
                  {r.status !== "skipped" && <GhostButton onClick={() => setStatus(r.id, "skipped")}>Skip</GhostButton>}
                  {r.status !== "pending" && <GhostButton onClick={() => setStatus(r.id, "pending")}>Undo</GhostButton>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Guest Networking Hub — served at /network/:slug. Registration, a        */
/* match-sorted directory of other opted-in guests, connection requests,   */
/* and simple messaging once a connection is accepted.                     */
/* ---------------------------------------------------------------------- */

/* ---------------------------------------------------------------------- */
/* Check-in scan page — served at /checkin/:token. This is what a phone's  */
/* ordinary camera app opens after scanning a guest's QR code — no        */
/* special scanner app needed, since the code just encodes this URL.       */
/* ---------------------------------------------------------------------- */

function CheckinPage({ token }) {
  const [checkin, setCheckin] = useState(null); // null=loading, false=invalid, {...}=result
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await getCheckinByToken(token);
      if (!existing) { setCheckin(false); return; }
      if (existing.checked_in_at) {
        setCheckin(existing);
        return;
      }
      const marked = await markCheckedIn(token);
      if (marked) {
        setCheckin(marked);
        setJustMarked(true);
      } else {
        // Someone else scanned it between our read and write — re-fetch so
        // this screen shows the real, current state rather than a stale one.
        setCheckin((await getCheckinByToken(token)) || existing);
      }
    })();
  }, [token]);

  if (checkin === null) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>Checking…</p>
      </div>
    );
  }

  if (checkin === false) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <XCircle size={40} color="#E29B9B" style={{ margin: "0 auto 14px" }} />
          <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 20, color: IVORY }}>Invalid Code</h1>
          <p className="mt-2 text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>This check-in code doesn't match any guest.</p>
        </div>
      </div>
    );
  }

  const alreadyCheckedIn = !justMarked && checkin.checked_in_at;

  return (
    <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        {alreadyCheckedIn ? (
          <>
            <AlertTriangle size={44} color="#E0B84C" style={{ margin: "0 auto 14px" }} />
            <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: IVORY }}>Already Checked In</h1>
            <p className="mt-2 text-lg" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, fontWeight: 600 }}>{checkin.guest_names}</p>
            <p className="mt-2 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Checked in at {new Date(checkin.checked_in_at).toLocaleString()}</p>
          </>
        ) : (
          <>
            <CheckCircle2 size={48} color="#8FBFA3" style={{ margin: "0 auto 14px" }} />
            <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: IVORY }}>Checked In</h1>
            <p className="mt-2 text-lg" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, fontWeight: 600 }}>{checkin.guest_names}</p>
            <p className="mt-2 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Welcome — enjoy the celebration!</p>
          </>
        )}
      </div>
    </div>
  );
}

function NetworkingHub({ slug }) {
  const storageKey = `einvite:networking-guest:${slug}`;
  const [me, setMe] = useState(null); // null = checking, false = not registered, {id,name,...} = registered
  const [view, setView] = useState("discover"); // discover | connections | messages
  const [activeConnection, setActiveConnection] = useState(null);

  useEffect(() => {
    const storedId = window.localStorage.getItem(storageKey);
    if (!storedId) { setMe(false); return; }
    getNetworkingGuestById(storedId).then((guest) => setMe(guest || false));
  }, [slug]);

  const handleRegistered = (guest) => {
    window.localStorage.setItem(storageKey, guest.id);
    setMe(guest);
  };

  if (me === null) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p>
      </div>
    );
  }

  if (!me) {
    return <NetworkingRegisterForm slug={slug} onRegistered={handleRegistered} />;
  }

  if (activeConnection) {
    return <NetworkingMessageThread slug={slug} me={me} connection={activeConnection} onBack={() => setActiveConnection(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: INK, color: IVORY, fontFamily: FONT_BODY }}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-2 flex items-center gap-2">
          <Handshake size={20} color={GOLD} />
          <h1 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}>Guest Networking</h1>
        </div>
        <p className="mb-6 text-[12.5px]" style={{ color: MUTED }}>Hi {me.name} — connect with other guests before the big day.</p>

        <div className="mb-5 flex gap-2">
          <GhostButton active={view === "discover"} onClick={() => setView("discover")}>Discover</GhostButton>
          <GhostButton active={view === "connections"} onClick={() => setView("connections")}>My Connections</GhostButton>
        </div>

        {view === "discover" ? (
          <NetworkingDiscoverList slug={slug} me={me} />
        ) : (
          <NetworkingConnectionsList slug={slug} me={me} onOpenConnection={setActiveConnection} />
        )}
      </div>
    </div>
  );
}

function NetworkingRegisterForm({ slug, onRegistered }) {
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [interests, setInterests] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setSubmitting(true);
    setError("");
    try {
      const guest = await registerNetworkingGuest(slug, { name, field, interests, linkedin, instagram, optedIn: true });
      onRegistered(guest);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const inputStyle = { width: "100%", background: INK_3, border: `1px solid ${INK_3}`, color: IVORY, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: FONT_BODY, outline: "none", marginBottom: 10, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 360, width: "100%" }}>
        <div className="mb-5 text-center">
          <Handshake size={26} color={GOLD} style={{ margin: "0 auto 10px" }} />
          <h1 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Meet the Other Guests</h1>
          <p className="mt-1.5 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Tell us a bit about yourself to find people worth meeting.</p>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        <input value={field} onChange={(e) => setField(e.target.value)} placeholder="What do you do? (optional)" style={inputStyle} />
        <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Interests, comma-separated (e.g. hiking, wine, travel)" style={inputStyle} />
        <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn (optional)" style={inputStyle} />
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram (optional)" style={inputStyle} />
        {error && <p style={{ color: "#E29B9B", fontSize: 12, marginBottom: 10, fontFamily: FONT_BODY }}>{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          style={{ width: "100%", background: GOLD, color: INK, border: "none", borderRadius: 999, padding: 12, fontWeight: 700, fontSize: 12.5, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Joining…" : "Join Guest Networking"}
        </button>
      </div>
    </div>
  );
}

function NetworkingDiscoverList({ slug, me }) {
  const [directory, setDirectory] = useState(null);
  const [connections, setConnections] = useState([]);
  const [sending, setSending] = useState(null);

  const load = async () => {
    const [dir, conns] = await Promise.all([getNetworkingDirectory(slug, me.id), getConnectionsForGuest(me.id)]);
    setDirectory(dir.map((g) => ({ ...g, score: networkingMatchScore(me, g) })).sort((a, b) => b.score - a.score));
    setConnections(conns);
  };

  useEffect(() => { load(); }, [slug, me.id]);

  const connectionStatusWith = (guestId) => {
    const c = connections.find((c) => c.from_guest_id === guestId || c.to_guest_id === guestId);
    return c ? c.status : null;
  };

  const connect = async (guestId) => {
    setSending(guestId);
    try {
      await sendConnectionRequest(slug, me.id, guestId);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(null);
    }
  };

  if (directory === null) return <p className="text-[12.5px]" style={{ color: MUTED }}>Loading…</p>;
  if (directory.length === 0) return <p className="text-[12.5px]" style={{ color: MUTED }}>No other guests have joined yet — check back soon.</p>;

  return (
    <div className="flex flex-col gap-2.5">
      {directory.map((g) => {
        const status = connectionStatusWith(g.id);
        return (
          <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[14px] font-semibold">{g.name}</div>
                {g.score > 0 && <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(201,164,76,0.18)", color: GOLD_SOFT }}>Good match</span>}
              </div>
              {g.field && <div className="truncate text-[12px]" style={{ color: MUTED }}>{g.field}</div>}
              {g.interests && <div className="truncate text-[11px]" style={{ color: GOLD_SOFT, marginTop: 2 }}>{g.interests}</div>}
            </div>
            <div className="flex-shrink-0">
              {status === "accepted" ? (
                <span className="text-[10.5px]" style={{ color: "#8FBFA3", fontFamily: FONT_BODY }}>Connected</span>
              ) : status === "pending" ? (
                <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Pending</span>
              ) : status === "declined" ? (
                <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>—</span>
              ) : (
                <GhostButton onClick={() => connect(g.id)}>{sending === g.id ? "Sending…" : "Connect"}</GhostButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NetworkingConnectionsList({ slug, me, onOpenConnection }) {
  const [connections, setConnections] = useState(null);
  const [guestsById, setGuestsById] = useState({});

  const load = async () => {
    const conns = await getConnectionsForGuest(me.id);
    setConnections(conns);
    const otherIds = [...new Set(conns.map((c) => (c.from_guest_id === me.id ? c.to_guest_id : c.from_guest_id)))];
    const guests = await Promise.all(otherIds.map((id) => getNetworkingGuestById(id)));
    setGuestsById(Object.fromEntries(guests.filter(Boolean).map((g) => [g.id, g])));
  };

  useEffect(() => { load(); }, [slug, me.id]);

  const respond = async (connectionId, status) => {
    await respondToConnection(connectionId, status);
    load();
  };

  if (connections === null) return <p className="text-[12.5px]" style={{ color: MUTED }}>Loading…</p>;
  if (connections.length === 0) return <p className="text-[12.5px]" style={{ color: MUTED }}>No connections yet — head to Discover to meet someone.</p>;

  return (
    <div className="flex flex-col gap-2.5">
      {connections.map((c) => {
        const otherId = c.from_guest_id === me.id ? c.to_guest_id : c.from_guest_id;
        const other = guestsById[otherId];
        const incoming = c.to_guest_id === me.id && c.status === "pending";
        return (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{other?.name || "Guest"}</div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                {c.status === "accepted" ? "Connected" : incoming ? "Wants to connect with you" : c.status === "pending" ? "Request sent — waiting" : "Declined"}
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-1.5">
              {incoming ? (
                <>
                  <GhostButton onClick={() => respond(c.id, "accepted")}>Accept</GhostButton>
                  <GhostButton onClick={() => respond(c.id, "declined")} danger>Decline</GhostButton>
                </>
              ) : c.status === "accepted" ? (
                <GhostButton onClick={() => onOpenConnection({ ...c, otherGuest: other })}>Message</GhostButton>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NetworkingMessageThread({ slug, me, connection, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    const msgs = await getNetworkingMessages(connection.id);
    setMessages(msgs);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [connection.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendNetworkingMessage(connection.id, me.id, text);
      setText("");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: INK, color: IVORY, fontFamily: FONT_BODY, display: "flex", flexDirection: "column" }}>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
          <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} /> Back
        </button>
        <h2 className="mb-4 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}>{connection.otherGuest?.name || "Guest"}</h2>

        <div className="flex-1 overflow-y-auto" style={{ minHeight: 300 }}>
          {messages.length === 0 ? (
            <p className="text-[12px]" style={{ color: MUTED }}>No messages yet — say hi!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const mine = m.sender_id === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px]" style={{ background: mine ? GOLD : INK_2, color: mine ? INK : IVORY, fontFamily: FONT_BODY }}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Write a message…"
            style={{ flex: 1, background: INK_3, border: `1px solid ${INK_3}`, color: IVORY, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontFamily: FONT_BODY, outline: "none" }}
          />
          <button
            onClick={send}
            disabled={sending}
            style={{ background: GOLD, color: INK, border: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 700, fontSize: 12, fontFamily: FONT_BODY, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvitationBuilder() {
  const [view, setView] = useState("builder");
  const [content, setContent] = useState(defaultContent);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [locations, setLocations] = useState(defaultLocations);
  const [pageBackgrounds, setPageBackgrounds] = useState(defaultPageBackgrounds);
  const [music, setMusic] = useState({ enabled: true, url: null, name: "", icon: "speaker" });
  const [rsvpSchedule, setRsvpSchedule] = useState({ date: "2027-06-12", time: "16:00" });
  const [registry, setRegistry] = useState(defaultRegistry);
  const [enabledSteps, setEnabledSteps] = useState(() => Object.fromEntries(ALL_STEPS.map((s) => [s.key, true])));
  const [pageOrder, setPageOrder] = useState(() => ALL_STEPS.map((s) => s.key));
  const orderedAllSteps = pageOrder.map((key) => ALL_STEPS.find((s) => s.key === key)).filter(Boolean);
  const steps = orderedAllSteps.filter((s) => enabledSteps[s.key]);
  const toggleStepVisibility = (key) => setEnabledSteps((e) => ({ ...e, [key]: !e[key] }));
  const moveStepOrder = (key, direction) => {
    if (key === REQUIRED_STEP_KEY) return; // cover always opens the story
    setPageOrder((order) => {
      const i = order.indexOf(key);
      const j = i + direction;
      // position 0 is reserved for the cover page — never swap into or out of it
      if (j < 1 || j >= order.length) return order;
      const next = [...order];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const [defaultLang, setDefaultLang] = useState("en");
  const [enabledLanguages, setEnabledLanguages] = useState(LANGS);
  const toggleLanguage = (lang, on) => setEnabledLanguages((list) => (on ? [...list, lang] : list.filter((l) => l !== lang)));
  const [activeLang, setActiveLang] = useState("en");
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [customBlocks, setCustomBlocks] = useState(emptyCustomBlocks);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [og, setOg] = useState({ image: null, title: "", description: "" });
  const [guestGroups, setGuestGroups] = useState(seedGuestGroups);
  const [tables, setTables] = useState(seedTables);
  const [rsvpSettings, setRsvpSettings] = useState({ style: "classic", namesRequired: true, namesRequiredWhenDeclining: false, maxGuestsOpenInvite: 5, maxTotalRsvps: 0, showTotalAttending: true });
  const [integrations, setIntegrations] = useState({
    djUrl: "", djButtonLabel: "Request a Song", djHeading: "Song Requests", djSubtitle: "Have a song you want to hear tonight? Send it straight to the DJ.",
    networkingUrl: "", networkingButtonLabel: "Open Guest Networking", networkingHeading: "Meet the Other Guests", networkingSubtitle: "Discover guests who share your interests, and connect right from your phone.",
    livestreamUrl: "", livestreamButtonLabel: "Watch Live", livestreamHeading: "Join Us Live", livestreamSubtitle: "Can't be there in person? Watch the ceremony live, streamed just for you.",
    livestreamPaid: false, livestreamPrice: "$10", livestreamPaymentUrl: "",
  });
  const updateIntegrations = (patch) => setIntegrations((i) => ({ ...i, ...patch }));
  const [users, setUsers] = useState(seedUsers);
  const [siteDomain, setSiteDomain] = useState("einvite.me");
  const [actingAsUser, setActingAsUser] = useState(null);
  const [sessionCheckResolved, setSessionCheckResolved] = useState(false);

  // Restore a client's logged-in session after a page refresh — without
  // this, actingAsUser always starts at null on every fresh page load
  // (React state doesn't survive a refresh on its own), which silently
  // dropped a logged-in client back into the login screen every single
  // time they refreshed. Runs once real data has actually arrived (not
  // the initial seed list). Uses real state (not just a ref) specifically
  // so the login-screen guard elsewhere can WAIT for this to resolve
  // before deciding what to show — otherwise that guard could fire based
  // on a still-null actingAsUser before this async check (which needs the
  // real user list to finish loading from Supabase first) had any chance
  // to complete, flashing the login screen on every refresh even for an
  // already-logged-in client.
  useEffect(() => {
    if (sessionCheckResolved) return;
    const savedId = window.localStorage.getItem("einvite:acting-as-user-id");
    if (!savedId) { setSessionCheckResolved(true); return; }
    const match = users.find((u) => u.id === savedId);
    if (!match) return; // real user list may not have loaded yet — try again once it does, rather than giving up after checking only the initial seed data
    setSessionCheckResolved(true);
    switchActiveInvitation(match.id);
    setActingAsUser(match);
  }, [users, sessionCheckResolved]);

  useEffect(() => {
    // Safety net: if the real user list never arrives at all (a Supabase
    // outage, for example), the effect above would otherwise wait forever
    // and leave the app stuck on a blank screen. Fall back to showing
    // login after a few seconds rather than hanging indefinitely.
    const timeout = setTimeout(() => setSessionCheckResolved(true), 6000);
    return () => clearTimeout(timeout);
  }, []);

  const [showAuthPreview, setShowAuthPreview] = useState(false);

  const [intro, setIntro] = useState(defaultIntroSettings);

  // --- Per-client data isolation -----------------------------------------
  // Everything above this line (content, timeline, guestGroups, etc.) is
  // "the invitation currently being edited". Without the mechanism below,
  // every client who gets acted-as would silently share and overwrite the
  // exact same data — there'd be no real separation between different
  // couples' invitations. `invitationsStore` holds a saved snapshot per
  // client (keyed by user id); switching who's being acted-as saves the
  // outgoing snapshot and loads the incoming one, so each client's edits
  // stay genuinely separate from every other client's and from the owner's
  // own default invitation ("__owner__").
  const OWNER_SLOT = "__owner__";
  const [invitationsStore, setInvitationsStore] = useState({});
  const [activeInvitationId, setActiveInvitationId] = useState(OWNER_SLOT);

  const freshInvitationSnapshot = () => ({
    content: defaultContent, timeline: defaultTimeline, locations: defaultLocations,
    pageBackgrounds: defaultPageBackgrounds, music: { enabled: true, url: null, name: "", icon: "speaker" },
    rsvpSchedule: { date: "2027-06-12", time: "16:00" }, registry: defaultRegistry,
    enabledSteps: Object.fromEntries(ALL_STEPS.map((s) => [s.key, true])), pageOrder: ALL_STEPS.map((s) => s.key),
    defaultLang: "en", enabledLanguages: LANGS, layouts: DEFAULT_LAYOUTS, customBlocks: emptyCustomBlocks(),
    og: { image: null, title: "", description: "" }, guestGroups: [], tables: [],
    rsvpSettings: { style: "classic", namesRequired: true, namesRequiredWhenDeclining: false, maxGuestsOpenInvite: 5, maxTotalRsvps: 0, showTotalAttending: true },
    integrations: {
      djUrl: "", djButtonLabel: "Request a Song", djHeading: "Song Requests", djSubtitle: "Have a song you want to hear tonight? Send it straight to the DJ.",
      networkingUrl: "", networkingButtonLabel: "Open Guest Networking", networkingHeading: "Meet the Other Guests", networkingSubtitle: "Discover guests who share your interests, and connect right from your phone.",
      livestreamUrl: "", livestreamButtonLabel: "Watch Live", livestreamHeading: "Join Us Live", livestreamSubtitle: "Can't be there in person? Watch the ceremony live, streamed just for you.",
    livestreamPaid: false, livestreamPrice: "$10", livestreamPaymentUrl: "",
    },
    intro: defaultIntroSettings,
  });

  const getActiveSnapshot = () => ({
    content, timeline, locations, pageBackgrounds, music, rsvpSchedule, registry, enabledSteps, pageOrder,
    defaultLang, enabledLanguages, layouts, customBlocks, og, guestGroups, tables, rsvpSettings, integrations, intro,
  });

  const applySnapshot = (snap) => {
    setContent(snap.content); setTimeline(snap.timeline); setLocations(snap.locations);
    setPageBackgrounds(snap.pageBackgrounds); setMusic(snap.music); setRsvpSchedule(snap.rsvpSchedule);
    setRegistry(snap.registry); setEnabledSteps(snap.enabledSteps); setPageOrder(snap.pageOrder);
    setDefaultLang(snap.defaultLang); setEnabledLanguages(snap.enabledLanguages || LANGS); setLayouts(snap.layouts); setCustomBlocks(snap.customBlocks);
    setOg(snap.og); setGuestGroups(snap.guestGroups); setTables(snap.tables || []); setRsvpSettings(snap.rsvpSettings);
    setIntegrations(snap.integrations); setIntro(snap.intro);
    setActiveIndex(0); setVisited(new Set([0])); setStarted(false); setSelectedBlockId(null); setLayoutEditMode(false);
  };

  // Switches which client's invitation is currently loaded into the editor —
  // saving the outgoing one first so nothing is lost, then loading (or
  // freshly creating) the incoming one.
  const switchActiveInvitation = async (nextId) => {
    const outgoing = getActiveSnapshot();
    const incoming = invitationsStore[nextId] || freshInvitationSnapshot();
    setInvitationsStore((store) => ({ ...store, [activeInvitationId]: outgoing, [nextId]: incoming }));
    applySnapshot(incoming);
    setActiveInvitationId(nextId);
    // THE ACTUAL FIX: persist the outgoing client's data directly to
    // Supabase right now, not just to local invitationsStore state. Without
    // this, the only place that data ever reached the database was
    // saveDraft's blanket re-save of EVERY client using whatever was
    // sitting in local state — which could silently overwrite fresher data
    // written elsewhere (a guest's direct RSVP, for example) with a stale
    // local copy the owner's browser hadn't refreshed in a while.
    if (activeInvitationId && persistentStorage.available()) {
      try {
        await persistentStorage.set(invitationKey(activeInvitationId), JSON.stringify(outgoing), false);
      } catch (err) {
        console.error(`switchActiveInvitation: failed to save outgoing invitation "${activeInvitationId}" to Supabase:`, err);
      }
    }
  };


  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));

  useEffect(() => {
    if (activeIndex > steps.length - 1) setActiveIndex(Math.max(0, steps.length - 1));
  }, [steps.length, activeIndex]);

  useEffect(() => {
    if (actingAsUser && view === "users") setView("builder");
  }, [actingAsUser, view]);

  useEffect(() => {
    if (actingAsUser && showAuthPreview) setShowAuthPreview(false);
  }, [actingAsUser, showAuthPreview]);

  const [saveStatus, setSaveStatus] = useState("idle"); // idle | loading | saving | saved | error
  const DRAFT_KEY = "einvite:draft-core";
  const bgKey = (stepKey) => `einvite:bg-${stepKey}`;
  const introBgKey = (lang) => `einvite:introbg-${lang}`;
  const OG_IMAGE_KEY = "einvite:og-image";
  const invitationKey = (id) => `einvite:invitation-${id}`;
  const CUSTOM_BLOCKS_KEY = "einvite:custom-blocks";
  const MUSIC_AUDIO_KEY = "einvite:music-audio";

  const selectStep = (i) => { setActiveIndex(i); setVisited((v) => new Set(v).add(i)); setStarted(true); setSelectedBlockId(null); };
  const previewFromStart = () => { setActiveIndex(0); setStarted(false); };

  const updateContentSection = (stepKey, patch) =>
    setContent((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: { ...c[activeLang][stepKey], ...patch } } }));

  const setBgFor = (stepKey) => (bg) => setPageBackgrounds((p) => ({ ...p, [stepKey]: bg }));

  const moveBlock = (stepKey, blockId, pos) =>
    setLayouts((l) => ({ ...l, [stepKey]: { ...l[stepKey], [blockId]: { ...l[stepKey][blockId], ...pos } } }));

  const updateBlockStyle = (stepKey, blockId, patch) =>
    setLayouts((l) => ({ ...l, [stepKey]: { ...l[stepKey], [blockId]: { ...l[stepKey][blockId], ...patch } } }));

  const resetLayout = () => {
    const key = steps[activeIndex].key;
    setLayouts((l) => ({ ...l, [key]: { ...DEFAULT_LAYOUTS[key] } }));
    setCustomBlocks((c) => ({ ...c, [key]: [] }));
    setSelectedBlockId(null);
  };

  // Load any previously saved draft once, on first mount. Uploaded audio/video use
  // blob: URLs that only live for the current browser tab, so they can't be restored
  // here — re-upload after loading a draft. Images are saved as data URLs and do restore.
  useEffect(() => {
    if (!persistentStorage.available()) return; // no storage backend at all in this environment
    let cancelled = false;
    (async () => {
      try {
        const res = await persistentStorage.get(DRAFT_KEY, false);
        if (cancelled || !res?.value) return;
        const d = JSON.parse(res.value);
        if (d.content) setContent(d.content);
        if (d.timeline) setTimeline(d.timeline);
        if (d.locations) setLocations(d.locations);
        if (d.registry) setRegistry(d.registry);
        if (d.enabledSteps) setEnabledSteps((e) => ({ ...e, ...d.enabledSteps }));
        if (Array.isArray(d.pageOrder)) {
          // Guard against a saved order from before a page existed (e.g. Registry) —
          // append any missing keys at the end rather than silently dropping the page.
          const missing = ALL_STEPS.map((s) => s.key).filter((k) => !d.pageOrder.includes(k));
          setPageOrder([...d.pageOrder, ...missing]);
        }
        if (d.rsvpSchedule) setRsvpSchedule(d.rsvpSchedule);
        if (d.defaultLang) setDefaultLang(d.defaultLang);
        if (d.enabledLanguages) setEnabledLanguages(d.enabledLanguages);
        if (d.layouts) setLayouts((l) => ({ ...DEFAULT_LAYOUTS, ...l, ...d.layouts }));
        if (d.guestGroups) setGuestGroups(d.guestGroups);
        if (d.tables) setTables(d.tables);
        if (d.rsvpSettings) setRsvpSettings((s) => ({ ...s, ...d.rsvpSettings }));
        if (d.integrations) setIntegrations((i) => ({ ...i, ...d.integrations }));
        if (Array.isArray(d.invitationIds) && d.invitationIds.length) {
          const results = await Promise.allSettled(d.invitationIds.map((id) => persistentStorage.get(invitationKey(id), false)));
          if (!cancelled) {
            const restoredStore = {};
            d.invitationIds.forEach((id, i) => {
              const r = results[i];
              if (r.status === "fulfilled" && r.value?.value) {
                try { restoredStore[id] = JSON.parse(r.value.value); } catch {} // skip a corrupted individual entry rather than failing the whole load
              }
            });
            setInvitationsStore(restoredStore);
          }
        }
        if (d.activeInvitationId) setActiveInvitationId(d.activeInvitationId);
        if (d.users) setUsers(d.users);
        if (d.siteDomain) setSiteDomain(d.siteDomain);
        if (d.ogText) setOg((o) => ({ ...o, title: d.ogText.title, description: d.ogText.description }));
        if (d.intro) setIntro((i) => ({ ...i, ...d.intro }));
        if (d.musicMeta) setMusic((m) => ({ ...m, enabled: d.musicMeta.enabled, name: d.musicMeta.name }));
      } catch {
        // No saved draft yet — start fresh with the defaults.
      }
    })();
    // The Cover page's background is the one thing a guest actually needs
    // for the first paint — load it first and alone, so it isn't racing
    // nine other pages' background images for the same bandwidth. Only once
    // it settles do the rest start loading (still independently of each
    // other, one missing/corrupt key never blocks the rest).
    const [firstStep, ...restSteps] = ALL_STEPS;
    const loadBg = (key) => (async () => {
      try {
        const res = await persistentStorage.get(bgKey(key), false);
        if (cancelled || !res?.value) return;
        const bg = JSON.parse(res.value);
        setPageBackgrounds((p) => ({ ...p, [key]: bg }));
      } catch {}
    })();
    loadBg(firstStep.key).then(() => {
      restSteps.forEach(({ key }) => loadBg(key));
    });
    LANGS.forEach((lang) => {
      (async () => {
        try {
          const res = await persistentStorage.get(introBgKey(lang), false);
          if (cancelled || !res?.value) return;
          const media = JSON.parse(res.value);
          setIntro((i) => ({ ...i, media: { ...i.media, [lang]: media } }));
        } catch {}
      })();
    });
    (async () => {
      try {
        const res = await persistentStorage.get(OG_IMAGE_KEY, false);
        if (cancelled || !res?.value) return;
        setOg((o) => ({ ...o, image: res.value }));
      } catch {}
    })();
    (async () => {
      try {
        const res = await persistentStorage.get(CUSTOM_BLOCKS_KEY, false);
        if (cancelled || !res?.value) return;
        const cb = JSON.parse(res.value);
        setCustomBlocks((c) => ({ ...emptyCustomBlocks(), ...c, ...cb }));
      } catch {}
    })();
    (async () => {
      try {
        const res = await persistentStorage.get(MUSIC_AUDIO_KEY, false);
        if (cancelled || !res?.value) return;
        setMusic((m) => ({ ...m, url: res.value }));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const saveDraft = async () => {
    if (!persistentStorage.available()) {
      setSaveStatus("unavailable");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    setSaveStatus("saving");
    const invitationIds = Object.keys({ ...invitationsStore, [activeInvitationId]: true });
    const corePayload = {
      content, timeline, locations, registry, enabledSteps, pageOrder, rsvpSchedule, defaultLang, enabledLanguages, layouts,
      guestGroups, tables, rsvpSettings, users, integrations, siteDomain,
      invitationIds, activeInvitationId, // the actual snapshots are saved separately below, one key per client
      ogText: { title: og.title, description: og.description },
      intro: { type: intro.type, icon: intro.icon, animationStyle: intro.animationStyle, sealDesign: intro.sealDesign }, // media (image or video) saved separately below via introBgKey
      musicMeta: { enabled: music.enabled, name: music.name }, // url saved separately below — see MUSIC_AUDIO_KEY
    };
    const imageJobs = [
      persistentStorage.set(DRAFT_KEY, JSON.stringify(corePayload), false),
      ...ALL_STEPS.map(({ key }) => persistentStorage.set(bgKey(key), JSON.stringify(pageBackgrounds[key]), false)),
      ...LANGS.filter((lang) => intro.media[lang]?.url).map((lang) => persistentStorage.set(introBgKey(lang), JSON.stringify(intro.media[lang]), false)),
      // customBlocks can contain embedded base64 images (custom image blocks) —
      // its own key, same reasoning as everything else here: keep the core
      // payload small and fast, regardless of how many images are in it.
      persistentStorage.set(CUSTOM_BLOCKS_KEY, JSON.stringify(customBlocks), false),
      // THE ACTUAL FIX: only write the CURRENTLY ACTIVE invitation's own
      // snapshot here — not every other known client's local copy. Other
      // clients' data is now saved at the moment of switching away from
      // them (see switchActiveInvitation), which is the only place their
      // data actually changes from this browser's perspective. Re-saving
      // all of them here, from whatever was sitting in local state, was
      // the actual bug: it could silently overwrite fresher writes made
      // directly by a guest (an RSVP, for example) with a stale copy this
      // browser hadn't refreshed recently.
      persistentStorage.set(invitationKey(activeInvitationId), JSON.stringify(getActiveSnapshot()), false),
    ];
    if (og.image) imageJobs.push(persistentStorage.set(OG_IMAGE_KEY, og.image, false));
    if (music.url) imageJobs.push(persistentStorage.set(MUSIC_AUDIO_KEY, music.url, false));
    try {
      const outcomes = await Promise.allSettled(imageJobs);
      const [coreOutcome, ...restOutcomes] = outcomes;
      const coreOk = coreOutcome.status === "fulfilled" && coreOutcome.value;
      const allImagesOk = restOutcomes.every((o) => o.status === "fulfilled" && o.value);
      if (coreOk && allImagesOk) setSaveStatus("saved");
      else if (coreOk && !allImagesOk) setSaveStatus("errorImages");
      else setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 3200);
  };

  const addCustomText = () => {
    const stepKey = steps[activeIndex].key;
    const newBlock = { id: uid(), type: "text", text: "New text", x: 50, y: 50, fontFamily: null, color: null, fontSize: 16 };
    setCustomBlocks((c) => ({ ...c, [stepKey]: [...c[stepKey], newBlock] }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const addCustomImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stepKey = steps[activeIndex].key;
    const addBlock = (url) => {
      const existingImages = customBlocks[stepKey].filter((b) => b.type === "image").length;
      const offset = (existingImages % 4) * 8; // small staggered offset so new images don't land exactly on top of existing ones
      const newBlock = { id: uid(), type: "image", url, x: 50 + offset, y: 50 + offset, width: 40 };
      setCustomBlocks((c) => ({ ...c, [stepKey]: [...c[stepKey], newBlock] }));
      setSelectedBlockId(`custom:${newBlock.id}`);
    };
    try {
      addBlock(await readImageCompressed(file, 2400, 0.92));
    } catch {
      const reader = new FileReader();
      reader.onload = () => addBlock(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const updateCustomBlock = (stepKey, id, patch) =>
    setCustomBlocks((c) => ({ ...c, [stepKey]: c[stepKey].map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const moveCustomBlock = (stepKey, id, pos) => updateCustomBlock(stepKey, id, pos);
  const removeCustomBlock = (stepKey, id) => {
    setCustomBlocks((c) => ({ ...c, [stepKey]: c[stepKey].filter((b) => b.id !== id) }));
    setSelectedBlockId((sel) => (sel === `custom:${id}` ? null : sel));
  };

  const toggleLayoutEditMode = () => setLayoutEditMode((v) => { if (v) setSelectedBlockId(null); return !v; });

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("That audio file is quite large (over 20MB) — try a shorter clip or a more compressed format (MP3 rather than WAV) for a smoother experience.");
      return;
    }
    // Read as a persistent base64 data URI instead of a temporary blob URL —
    // a blob URL only exists within the current browser tab's session, so it
    // never survives a reload, a different tab, or the guest-facing view
    // reading this data back later — exactly why uploaded music stopped
    // being audible after upload.
    const reader = new FileReader();
    reader.onload = () => {
      setMusic((m) => ({ ...m, url: reader.result, name: file.name, enabled: true }));
    };
    reader.readAsDataURL(file);
  };

  const addGuestGroup = (g) => setGuestGroups((list) => [g, ...list]);
  const updateGuestGroup = (id, patch) => setGuestGroups((list) => list.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g)));
  const deleteGuestGroup = (id) => setGuestGroups((list) => list.filter((g) => g.id !== id));
  const moveGuestGroup = (id, direction) => {
    setGuestGroups((list) => {
      const i = list.findIndex((g) => g.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const updateRsvpSettings = (patch) => setRsvpSettings((s) => ({ ...s, ...patch }));

  const addTable = (name, capacity) => setTables((list) => [...list, { id: uid(), name: name.trim() || "New table", capacity: Math.max(1, capacity || 8) }]);
  const updateTable = (id, patch) => setTables((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const deleteTable = (id) => {
    setTables((list) => list.filter((t) => t.id !== id));
    setGuestGroups((list) => list.map((g) => (g.tableId === id ? { ...g, tableId: null } : g)));
  };
  const assignGuestToTable = (groupId, tableId) => setGuestGroups((list) => list.map((g) => (g.id === groupId ? { ...g, tableId } : g)));

  // What a guest submits through the actual RSVP form on the invitation itself —
  // separate from the owner's manual "Add a guest family" tool in the Dashboard,
  // though both land in the same guest list. `names` may contain zero, one, or
  // several people (from the "Who's joining us?" modal); anyone not named counts
  // toward additionalGuests as an unnamed slot, same as guests added manually.
  const submitGuestRsvp = async ({ names, status, additionalGuests }) => {
    const cleanNames = (names || []).filter((n) => n && n.trim());
    const groupId = uid();
    addGuestGroup({
      id: groupId,
      lastName: "",
      members: cleanNames.length ? cleanNames.map((n) => ({ id: uid(), name: n, status })) : status === "no" ? [{ id: uid(), name: "Guest", status }] : [],
      additionalGuests: status === "yes" ? additionalGuests || 0 : 0,
      table: "",
      phone: "",
      invitationSent: false, // we don't know if this was reached via a sent link or the open one
      invitationViewed: true, // they just viewed it — they're submitting from the page itself
      updatedAt: Date.now(),
    });
    if (status !== "yes") return null;
    const extra = status === "yes" ? additionalGuests || 0 : 0;
    const displayNames = (cleanNames.length ? cleanNames.join(", ") : "Guest") + (extra > 0 ? ` + ${extra} guest${extra === 1 ? "" : "s"}` : "");
    return await createCheckinToken(slug, groupId, displayNames);
  };

  const deleteUser = (id) => setUsers((list) => list.filter((u) => u.id !== id));
  const toggleUserStatus = (id) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u)));
  const approveUser = (id) => setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: "active", dashboardAccess: true, canDesign: true } : u)));
  const toggleDashboardAccess = (id) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, dashboardAccess: !u.dashboardAccess } : u)));
  const toggleCanDesign = (id) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, canDesign: !u.canDesign } : u)));
  const updateUserEmail = (id, email) => setUsers((list) => list.map((u) => (u.id === id ? { ...u, email } : u)));
  const signUpUser = ({ name, email, phone, password }) => {
    setUsers((list) => [
      { id: uid(), name, email, phone, password, role: "normal", status: "pending", dashboardAccess: false, canDesign: false, createdAt: Date.now(), invitationSlug: null },
      ...list,
    ]);
  };
  const createInvitationFor = (user) => {
    let finalUser = user;
    if (!user.invitationSlug) {
      const base = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `guest-${user.id.slice(0, 6)}`;
      // THE ACTUAL FIX: the previous version used `base` directly with no
      // check at all — two clients with the same name (or both left blank
      // during testing, which happens constantly) silently got the exact
      // same slug. Since every guest link and data lookup resolves BY
      // slug, a colliding slug can make a brand-new client's link resolve
      // to a completely different, earlier client — which looks exactly
      // like "the new invitation shows the previous one's data."
      const existingSlugs = new Set(users.map((u) => u.invitationSlug).filter(Boolean));
      let slug = base;
      let suffix = 2;
      while (existingSlugs.has(slug)) {
        slug = `${base}-${suffix}`;
        suffix++;
      }
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, invitationSlug: slug } : u)));
      finalUser = { ...user, invitationSlug: slug };
    }
    switchActiveInvitation(finalUser.id);
    setActingAsUser(finalUser);
    window.localStorage.setItem("einvite:acting-as-user-id", finalUser.id);
    setView("overview");
  };
  const enterBuilderAsLoggedInUser = (user) => {
    switchActiveInvitation(user.id);
    setActingAsUser(user);
    window.localStorage.setItem("einvite:acting-as-user-id", user.id); // survives a refresh — see the restore effect near the other load effects
    setShowAuthPreview(false);
    setView("builder");
  };
  const exitActingAs = () => {
    switchActiveInvitation(OWNER_SLOT);
    setActingAsUser(null);
    window.localStorage.removeItem("einvite:acting-as-user-id");
  };

  const updateIntro = (patch) => setIntro((i) => ({ ...i, ...patch }));
  const handleIntroMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("video/")) {
      if (file.size > 20 * 1024 * 1024) {
        alert("That video is quite large (over 20MB) — try a shorter clip or a more compressed export for a smoother experience.");
        return;
      }
      // Read as a persistent base64 data URI instead of a temporary blob URL —
      // a blob URL only exists within the current browser tab's session, so
      // it never survives a reload or a different device reading this data
      // back later. Same bug class, same fix, as the music upload earlier.
      const reader = new FileReader();
      reader.onload = () => {
        setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: { type: "video", url: reader.result, name: file.name } } }));
      };
      reader.readAsDataURL(file);
      return;
    }
    try {
      const dataUrl = await readImageCompressed(file);
      setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: { type: "image", url: dataUrl, name: file.name } } }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: { type: "image", url: reader.result, name: file.name } } }));
      reader.readAsDataURL(file);
    }
  };
  const removeIntroMedia = () => setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: null } }));

  const totalAttending = flattenMembers(guestGroups).filter((m) => m.status === "yes").length;
  const data = { content, timeline, locations, registry, pageBackgrounds, music, rsvpSchedule, layouts, intro, customBlocks, rsvpSettings, totalAttending, integrations };
  const stepKey = steps[activeIndex].key;
  const c = content[activeLang];

  const autoTitle = `${content.en.cover.name1} & ${content.en.cover.name2} — Wedding Invitation`;
  const autoDescription = content.en.cover.intro;
  const slug = `${content.en.cover.name1}-${content.en.cover.name2}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invitation";

  // ------------------------------------------------------------------ //
  // Guest-link detection — runs once on load. If the URL is /e/:slug,
  // figure out which invitation that slug belongs to (this device's own
  // active one, or another client's from invitationsStore), and — if a
  // ?g=<guest group id> or ?guest=<name> is present — which guest. This
  // does NOT touch the actively-loaded editing state; it's a completely
  // separate, read-only path that short-circuits the whole app below.
  // ------------------------------------------------------------------ //

  const [guestView, setGuestView] = useState(null); // null = checking, false = not a guest link, { ... } = resolved
  const [guestActiveIndex, setGuestActiveIndex] = useState(0);
  const [guestStarted, setGuestStarted] = useState(false);
  const [djDashboardSlug, setDjDashboardSlug] = useState(null); // null = checking, false = not a DJ link, string = the slug
  const [networkingSlug, setNetworkingSlug] = useState(null); // null = checking, false = not a networking link, string = the slug
  const [checkinToken, setCheckinTokenFromUrl] = useState(null); // null = checking, false = not a check-in link, string = the token
  const [isAdminPath, setIsAdminPath] = useState(null); // null = checking, true/false = resolved

  useEffect(() => {
    const match = window.location.pathname.match(/^\/dj\/([^/]+)\/?$/);
    setDjDashboardSlug(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/checkin\/([^/]+)\/?$/);
    setCheckinTokenFromUrl(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const p = window.location.pathname;
    setIsAdminPath(p === "/admin" || p.startsWith("/admin/"));
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/network\/([^/]+)\/?$/);
    setNetworkingSlug(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/e\/([^/]+)\/?$/);
    if (!match) {
      setGuestView(false);
      return;
    }
    const urlSlug = decodeURIComponent(match[1]);
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("g");
    const guestNameParam = params.get("guest");

    // This device's own currently-loaded invitation matches directly —
    // reuse the live state, no snapshot lookup needed.
    if (urlSlug === slug) {
      setGuestView({ found: true, ownSlug: true, slug: urlSlug, snapshotGuestGroups: guestGroups, groupId, guestNameParam });
      return;
    }
    // Otherwise, find which client this slug actually belongs to.
    const matchedUser = users.find((u) => u.invitationSlug === urlSlug);
    if (!matchedUser) {
      setGuestView({ found: false });
      return;
    }
    const snapshot = invitationsStore[matchedUser.id] || freshInvitationSnapshot();
    setGuestView({ found: true, ownSlug: false, slug: urlSlug, userId: matchedUser.id, snapshot, snapshotGuestGroups: snapshot.guestGroups || [], groupId, guestNameParam });
    // Re-run once the real saved data finishes loading (it loads
    // asynchronously in a separate effect) — without this, a guest link can
    // get permanently evaluated against the initial seed/demo data instead
    // of the couple's real saved content, since this effect would otherwise
    // only run once, before that async load has had a chance to complete.
  }, [slug, users, invitationsStore]);

  const guestSnapshotData = guestView && guestView.found && !guestView.ownSlug
    ? { ...guestView.snapshot, totalAttending: flattenMembers(guestView.snapshotGuestGroups).filter((m) => m.status === "yes").length }
    : null;
  const guestData = guestView && guestView.found ? (guestView.ownSlug ? data : guestSnapshotData) : null;
  const guestSteps = guestView && guestView.found
    ? (guestView.ownSlug ? steps : (guestView.snapshot.pageOrder || ALL_STEPS.map((s) => s.key)).map((k) => ALL_STEPS.find((s) => s.key === k)).filter(Boolean).filter((s) => (guestView.snapshot.enabledSteps || {})[s.key]))
    : null;
  const guestLang = guestView && guestView.found ? (guestView.ownSlug ? activeLang : (guestView.snapshot.defaultLang || "en")) : "en";
  const matchedGroup = guestView && guestView.found ? guestView.snapshotGuestGroups.find((g) => g.id === guestView.groupId) : null;
  const resolvedGuestName = matchedGroup?.members?.find((m) => m.status === "yes")?.name || matchedGroup?.members?.[0]?.name || guestView?.guestNameParam || null;

  // Submitting an RSVP from a guest view needs to write into the RIGHT
  // place — the live state if it's this device's own invitation, or the
  // correct client's slot in invitationsStore otherwise (without touching
  // whatever invitation is currently loaded for editing).
  const submitGuestViewRsvp = async ({ names, status, additionalGuests }) => {
    if (!guestView?.found) return null;
    if (guestView.ownSlug) {
      return await submitGuestRsvp({ names, status, additionalGuests });
    }
    const cleanNames = (names || []).filter((n) => n && n.trim());
    const newGroup = {
      id: uid(), lastName: "",
      members: cleanNames.length ? cleanNames.map((n) => ({ id: uid(), name: n, status })) : status === "no" ? [{ id: uid(), name: "Guest", status }] : [],
      additionalGuests: status === "yes" ? additionalGuests || 0 : 0,
      table: "", phone: "", tableId: null, invitationSent: false, invitationViewed: true, updatedAt: Date.now(),
    };
    // THE ACTUAL FIX: write straight to Supabase, not just to local
    // invitationsStore state. A guest submitting this is on their OWN
    // device/browser, loading the page fresh via a shared link — their
    // local React state is never seen by the owner's dashboard, which
    // loads its own copy from Supabase on a completely different device.
    // Without this, the RSVP only ever existed in the guest's own browser
    // memory and vanished the moment they closed the tab.
    let savedOk = false;
    try {
      const res = await persistentStorage.get(invitationKey(guestView.userId), false);
      const latest = res?.value ? JSON.parse(res.value) : (guestView.snapshot || freshInvitationSnapshot());
      const updated = { ...latest, guestGroups: [newGroup, ...(latest.guestGroups || [])] };
      const saveRes = await persistentStorage.set(invitationKey(guestView.userId), JSON.stringify(updated), false);
      savedOk = !!saveRes;
      if (!savedOk) console.error("submitGuestViewRsvp: save to Supabase returned falsy — RSVP may not have persisted.");
    } catch (err) {
      console.error("submitGuestViewRsvp: failed to save RSVP to Supabase:", err);
    }
    // Also update local state so the UI reflects this immediately without
    // waiting on a re-fetch — but this is now a mirror of what's saved,
    // not the only copy of the data.
    setInvitationsStore((store) => {
      const current = store[guestView.userId] || freshInvitationSnapshot();
      return { ...store, [guestView.userId]: { ...current, guestGroups: [newGroup, ...(current.guestGroups || [])] } };
    });
    if (!savedOk) {
      console.error(`RSVP for "${cleanNames.join(", ") || "Guest"}" (slug: ${guestView.slug}) could not be confirmed as saved to the shared database.`);
    }
    if (status !== "yes") return null;
    const extra = additionalGuests || 0;
    const displayNames = (cleanNames.length ? cleanNames.join(", ") : "Guest") + (extra > 0 ? ` + ${extra} guest${extra === 1 ? "" : "s"}` : "");
    return await createCheckinToken(guestView.slug, newGroup.id, displayNames);
  };

  if (djDashboardSlug === null) {
    return null; // still checking the URL
  }
  if (djDashboardSlug) {
    return <DjDashboard slug={djDashboardSlug} />;
  }

  if (networkingSlug === null) {
    return null; // still checking the URL
  }
  if (networkingSlug) {
    return <NetworkingHub slug={networkingSlug} />;
  }

  if (checkinToken === null) {
    return null; // still checking the URL
  }
  if (checkinToken) {
    return <CheckinPage token={checkinToken} />;
  }

  if (guestView === null) {
    return null; // still checking the URL — avoid flashing the homepage/builder first
  }

  if (guestView && guestView.found === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center" style={{ background: INK, fontFamily: FONT_BODY }}>
        <div>
          <h1 className="mb-2 text-xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>This invitation link isn't available</h1>
          <p className="text-[13px]" style={{ color: MUTED }}>It may not be published yet, or the link may be incorrect.</p>
        </div>
      </div>
    );
  }

  if (guestView && guestView.found) {
    return (
      <div>
        <PhonePreview
          data={guestData}
          steps={guestSteps}
          activeIndex={guestActiveIndex}
          onNavigate={setGuestActiveIndex}
          lang={guestLang}
          layoutEditMode={false}
          onMoveBlock={() => {}}
          started={guestStarted}
          onStart={() => setGuestStarted(true)}
          selectedBlockId={null}
          onSelectBlock={() => {}}
          onMoveCustomBlock={() => {}}
          onRemoveCustomBlock={() => {}}
          onSubmitRsvp={submitGuestViewRsvp}
          fullscreen
          slug={guestView.slug}
          siteDomain={siteDomain}
        />
      </div>
    );
  }

  if (isAdminPath === null || !sessionCheckResolved) {
    return null; // still checking the URL / still trying to restore a saved session — showing login here would be premature and could flash it even for an already-logged-in client
  }

  // The actual fix: the site's default landing (anything that isn't /admin
  // and isn't one of the other special paths already handled above) now
  // shows login/signup instead of dropping straight into the builder. A
  // client who's already logged in (actingAsUser, restored from
  // localStorage after a refresh) still goes straight to their own portal
  // — this only gates people who aren't recognized as anything yet.
  if (!isAdminPath && !actingAsUser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-10" style={{ background: INK, fontFamily: FONT_BODY }}>
        <AuthPreview users={users} onSignUp={signUpUser} onExit={null} onEnterBuilderAs={enterBuilderAsLoggedInUser} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: INK, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&family=Parisienne&family=Cairo:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,500&family=Marcellus&family=Great+Vibes&family=Dancing+Script:wght@400;600&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes slideUpIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownIn { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes eqBar { from { height: 3px; } to { height: 9px; } }
        @keyframes bounceUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes musicPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.75; } }
        @keyframes sealPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } }
        @keyframes gateFloat { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-620px) rotate(25deg); opacity: 0; } }
        .guest-scroll::-webkit-scrollbar { height: 3px; }
        .guest-scroll::-webkit-scrollbar-thumb { background: rgba(201,164,76,0.3); border-radius: 2px; }
        .guest-scroll::-webkit-scrollbar-track { background: transparent; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(3) hue-rotate(0deg); cursor: pointer; }
      `}</style>

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: GOLD, letterSpacing: "0.2em" }}>eInvite.me</div>
            <h1 className="mt-1 text-2xl" style={{ fontFamily: activeLang === "ar" ? FONT_AR : FONT_DISPLAY, color: IVORY, fontStyle: activeLang === "ar" ? "normal" : "italic" }}>
              {c.cover.name1 || "—"} &amp; {c.cover.name2 || "—"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && <span className="text-[11px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>Saved ✓</span>}
            {saveStatus === "error" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Couldn't save — try again</span>}
            {saveStatus === "errorImages" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Text saved, but photos are too large — try a smaller image</span>}
            {saveStatus === "unavailable" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Saving isn't available — your browser is blocking storage (try disabling private/incognito mode)</span>}
            <GoldButton onClick={saveDraft}>
              <Check size={14} /> {saveStatus === "saving" ? "Saving…" : "Save invitation"}
            </GoldButton>
          </div>
        </div>

        {!showAuthPreview && !actingAsUser && (
          <button onClick={() => setShowAuthPreview(true)} className="mb-6 flex items-center gap-1.5 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            <UserPlus size={12} /> Preview the guest sign-up &amp; login flow
          </button>
        )}

        {showAuthPreview ? (
          <AuthPreview users={users} onSignUp={signUpUser} onExit={() => setShowAuthPreview(false)} onEnterBuilderAs={enterBuilderAsLoggedInUser} />
        ) : view === "overview" && actingAsUser ? (
          <EventOverviewView
            user={actingAsUser}
            cover={c.cover}
            rsvpSchedule={rsvpSchedule}
            guestGroups={guestGroups}
            og={og}
            setOg={setOg}
            onUpdateNames={(names) => updateContentSection("cover", names)}
            onUpdateDate={(date) => setRsvpSchedule((s) => ({ ...s, date }))}
            onSaveDraft={saveDraft}
            saveStatus={saveStatus}
            onUpdateUserEmail={updateUserEmail}
            onToggleDashboardAccess={toggleDashboardAccess}
            onToggleCanDesign={toggleCanDesign}
            onOpenBuilder={() => setView("builder")}
            onBack={() => { exitActingAs(); setView("users"); }}
          />
        ) : (
          <>
        <TabBar view={view} setView={setView} isClientPortal={!!actingAsUser} />

        {actingAsUser && (view === "builder" || view === "settings" || view === "dashboard") && (
          <div className="mb-5 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(201,164,76,0.1)", border: `1px solid rgba(201,164,76,0.35)` }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} color={GOLD} />
              <span className="text-[12.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
                <strong style={{ color: GOLD_SOFT }}>Client Portal</strong> — editing on behalf of <strong style={{ color: GOLD_SOFT }}>{actingAsUser.name}</strong> ({actingAsUser.email}). Their data is kept separate from every other client's.
              </span>
            </div>
            <GhostButton onClick={exitActingAs}>
              <LogOut size={12} /> Exit to Admin Dashboard
            </GhostButton>
          </div>
        )}

        {view === "builder" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
              <LangSwitcher activeLang={activeLang} setActiveLang={setActiveLang} defaultLang={defaultLang} setDefaultLang={setDefaultLang} enabledLanguages={enabledLanguages} onToggleLanguage={toggleLanguage} />
              <StepRail steps={steps} activeIndex={activeIndex} visited={visited} onSelect={selectStep} />

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>{steps[activeIndex].label}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {layoutEditMode && <GhostButton onClick={addCustomText}><Plus size={13} /> Add text</GhostButton>}
                  {layoutEditMode && <GhostUploadButton accept="image/*" onChange={addCustomImage}><ImagePlus size={13} /> Add image</GhostUploadButton>}
                  {layoutEditMode && <GhostButton onClick={resetLayout}>Reset layout</GhostButton>}
                  <GhostButton active={layoutEditMode} onClick={toggleLayoutEditMode}>
                    <Move size={13} /> {layoutEditMode ? "Done positioning" : "Position text"}
                  </GhostButton>
                </div>
              </div>

              {layoutEditMode && selectedBlockId && (() => {
                const isCustom = selectedBlockId.startsWith("custom:");
                const customId = isCustom ? selectedBlockId.slice(7) : null;
                const current = isCustom
                  ? customBlocks[stepKey].find((b) => b.id === customId) || { fontFamily: null, color: null, fontSize: 16, text: "" }
                  : layouts[stepKey][selectedBlockId] || { fontFamily: null, color: null, fontSize: null };
                return (
                  <BlockStylePanel
                    isCustom={isCustom}
                    current={current}
                    onChangeStyle={(patch) => (isCustom ? updateCustomBlock(stepKey, customId, patch) : updateBlockStyle(stepKey, selectedBlockId, patch))}
                    onChangeText={(v) => updateCustomBlock(stepKey, customId, { text: v })}
                    onDelete={() => removeCustomBlock(stepKey, customId)}
                    onDeselect={() => setSelectedBlockId(null)}
                  />
                );
              })()}

              {stepKey === "cover" && (
                <CoverStep
                  c={c.cover}
                  updateContent={(p) => updateContentSection("cover", p)}
                  bg={pageBackgrounds.cover}
                  setBg={setBgFor("cover")}
                  music={music}
                  updateMusic={(p) => setMusic((m) => ({ ...m, ...p }))}
                  onUploadAudio={handleAudioUpload}
                  onRemoveAudio={() => setMusic((m) => ({ ...m, url: null, name: "" }))}
                  intro={intro}
                  updateIntro={updateIntro}
                  activeLang={activeLang}
                  onUploadIntroMedia={handleIntroMediaUpload}
                  onRemoveIntroMedia={removeIntroMedia}
                />
              )}
              {stepKey === "family" && <FamilyStep c={c.family} updateContent={(p) => updateContentSection("family", p)} bg={pageBackgrounds.family} setBg={setBgFor("family")} />}
              {stepKey === "timeline" && <TimelineStep items={timeline} update={setTimeline} activeLang={activeLang} bg={pageBackgrounds.timeline} setBg={setBgFor("timeline")} />}
              {stepKey === "locations" && <LocationsStep items={locations} update={setLocations} activeLang={activeLang} bg={pageBackgrounds.locations} setBg={setBgFor("locations")} />}
              {stepKey === "countdown" && <CountdownStep schedule={rsvpSchedule} setSchedule={(p) => setRsvpSchedule((s) => ({ ...s, ...p }))} bg={pageBackgrounds.countdown} setBg={setBgFor("countdown")} />}
              {stepKey === "rsvp" && <RsvpStep c={c.rsvp} updateContent={(p) => updateContentSection("rsvp", p)} bg={pageBackgrounds.rsvp} setBg={setBgFor("rsvp")} rsvpSettings={rsvpSettings} updateRsvpSettings={updateRsvpSettings} />}
              {stepKey === "registry" && <RegistryStep items={registry} update={setRegistry} activeLang={activeLang} bg={pageBackgrounds.registry} setBg={setBgFor("registry")} />}
              {stepKey === "djRequests" && (
                <DjRequestsPanel
                  heading={integrations.djHeading}
                  setHeading={(v) => updateIntegrations({ djHeading: v })}
                  subtitle={integrations.djSubtitle}
                  setSubtitle={(v) => updateIntegrations({ djSubtitle: v })}
                  bg={pageBackgrounds.djRequests}
                  setBg={setBgFor("djRequests")}
                  dashboardUrl={`https://${siteDomain}/dj/${slug}`}
                  slug={slug}
                />
              )}
              {stepKey === "networking" && (
                <NetworkingPanel
                  heading={integrations.networkingHeading}
                  setHeading={(v) => updateIntegrations({ networkingHeading: v })}
                  subtitle={integrations.networkingSubtitle}
                  setSubtitle={(v) => updateIntegrations({ networkingSubtitle: v })}
                  buttonLabel={integrations.networkingButtonLabel}
                  setButtonLabel={(v) => updateIntegrations({ networkingButtonLabel: v })}
                  bg={pageBackgrounds.networking}
                  setBg={setBgFor("networking")}
                />
              )}
              {stepKey === "livestream" && (
                <IntegrationStep
                  label="Live Stream"
                  helpText="Paste a YouTube or Vimeo link and it plays directly embedded on this page — guests never leave your invitation to watch. Zoom (and anything else not from YouTube/Vimeo) still works, but opens as a link instead, since Zoom meetings are joined through Zoom's own app, not embeddable as a video player."
                  url={integrations.livestreamUrl}
                  setUrl={(v) => updateIntegrations({ livestreamUrl: v })}
                  placeholderUrl="https://youtube.com/live/…  or  https://zoom.us/j/…"
                  urlHelpText="Paste the stream link once your photographer/videographer has it set up. Until then, the button on this page stays disabled for guests."
                  buttonLabel={integrations.livestreamButtonLabel}
                  setButtonLabel={(v) => updateIntegrations({ livestreamButtonLabel: v })}
                  heading={integrations.livestreamHeading}
                  setHeading={(v) => updateIntegrations({ livestreamHeading: v })}
                  subtitle={integrations.livestreamSubtitle}
                  setSubtitle={(v) => updateIntegrations({ livestreamSubtitle: v })}
                  bg={pageBackgrounds.livestream}
                  setBg={setBgFor("livestream")}
                />
              )}

              {stepKey === "livestream" && (
                <div className="mt-5 rounded-xl p-4" style={{ background: INK_3 }}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Charge for access</div>
                      <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Guests pay before they can watch</div>
                    </div>
                    <SegmentedToggle
                      value={integrations.livestreamPaid}
                      onChange={(v) => updateIntegrations({ livestreamPaid: v })}
                      options={[{ value: false, label: "Free" }, { value: true, label: "Paid" }]}
                    />
                  </div>

                  {integrations.livestreamPaid && (
                    <>
                      <div className="mb-3 rounded-lg p-3" style={{ background: "rgba(201,164,76,0.08)", border: `1px solid rgba(201,164,76,0.2)` }}>
                        <p className="text-[11px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
                          The real stream link is kept genuinely hidden now — it's stored server-side and only ever sent to a guest's browser after Whish confirms their payment actually went through. It never sits in this invitation's normal saved data, so there's nothing for a guest to find by inspecting the page, copying a link, or sharing it with someone who hasn't paid.
                        </p>
                      </div>
                      <div className="mb-3">
                        <FieldLabel>Price to show</FieldLabel>
                        <TextInput value={integrations.livestreamPrice} onChange={(v) => updateIntegrations({ livestreamPrice: v })} placeholder="$10" />
                      </div>
                      <SecureStreamUrlSetter slug={slug} />
                    </>
                  )}
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "rgba(147,166,155,0.15)" }}>
                <GhostButton onClick={() => selectStep(Math.max(0, activeIndex - 1))}>
                  <ChevronDown size={13} /> Back
                </GhostButton>
                <div className="flex items-center gap-3">
                  {saveStatus === "saved" && <span className="text-[11px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>Saved ✓</span>}
                  {saveStatus === "error" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Couldn't save — try again</span>}
                  {saveStatus === "errorImages" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Text saved, but photos are too large — try a smaller image</span>}
                  {saveStatus === "unavailable" && <span className="text-[11px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>Saving isn't available — your browser is blocking storage (try disabling private/incognito mode)</span>}
                  {activeIndex < steps.length - 1 ? (
                    <GoldButton onClick={() => selectStep(activeIndex + 1)}>Next <ChevronUp size={14} /></GoldButton>
                  ) : (
                    <GoldButton onClick={saveDraft}><Check size={14} /> {saveStatus === "saving" ? "Saving…" : "Finish & Save"}</GoldButton>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3 overflow-x-auto lg:sticky lg:top-10 lg:w-auto lg:self-start">
              <PhonePreview data={data} steps={steps} activeIndex={activeIndex} onNavigate={selectStep} lang={activeLang} layoutEditMode={layoutEditMode} onMoveBlock={moveBlock} started={started} onStart={() => setStarted(true)} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} onMoveCustomBlock={moveCustomBlock} onRemoveCustomBlock={removeCustomBlock} onSubmitRsvp={submitGuestRsvp} slug={slug} siteDomain={siteDomain} />
              <GhostButton onClick={previewFromStart}>
                <Mail size={12} /> Preview from start
              </GhostButton>
              <div className="w-full">
                <PagesManager orderedAllSteps={orderedAllSteps} enabledSteps={enabledSteps} onToggle={toggleStepVisibility} onMove={moveStepOrder} />
              </div>
            </div>
          </div>
        )}

        {view === "settings" && (
          <>
            <SettingsView og={og} setOg={setOg} autoTitle={autoTitle} autoDescription={autoDescription} slug={slug} siteDomain={siteDomain} setSiteDomain={setSiteDomain} />
            <RsvpSettingsView rsvpSettings={rsvpSettings} updateRsvpSettings={updateRsvpSettings} />
          </>
        )}

        {view === "dashboard" && (
          <DashboardView
            guestGroups={guestGroups}
            addGuestGroup={addGuestGroup}
            updateGuestGroup={updateGuestGroup}
            deleteGuestGroup={deleteGuestGroup}
            moveGuestGroup={moveGuestGroup}
            tables={tables}
            addTable={addTable}
            updateTable={updateTable}
            deleteTable={deleteTable}
            assignGuestToTable={assignGuestToTable}
            integrations={integrations}
            coupleTitle={`${c.cover.name1} & ${c.cover.name2}`}
            slug={slug}
            siteDomain={siteDomain}
          />
        )}

        {view === "users" && !actingAsUser && (
          <UsersView
            users={users}
            invitationsStore={invitationsStore}
            onDelete={deleteUser}
            onToggleStatus={toggleUserStatus}
            onCreateInvitationFor={createInvitationFor}
            onApprove={approveUser}
            onToggleDashboardAccess={toggleDashboardAccess}
            onToggleCanDesign={toggleCanDesign}
            siteDomain={siteDomain}
          />
        )}
          </>
        )}
      </div>
    </div>
  );
}
