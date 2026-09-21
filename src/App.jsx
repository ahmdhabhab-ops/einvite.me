import React, { useState, useEffect, useRef, useMemo, useContext, createContext } from "react";
import { createPortal } from "react-dom";
import {
  Heart, Users, Clock, MapPin, CalendarClock, ChevronUp, ChevronDown,
  Plus, Trash2, Upload, Navigation2,
  Church, Wine, UtensilsCrossed, PartyPopper, Sparkles, Check, X, Music2, Star,
  Settings, BarChart3, Copy, Link2, ImagePlus, Search, CheckCircle2, XCircle, Move, Mail, Film,
  ChevronsUp, ChevronsLeft, Volume2, VolumeX, Share2, Disc3, Headphones, Feather, MessageCircle, Send,
  FilePlus2, Lock, Unlock, ShieldCheck, LogOut, UserPlus, LogIn, Eye, EyeOff, ArrowLeft,
  ThumbsUp, ThumbsDown, CalendarDays, Pencil, Gift, ExternalLink, Handshake, Video, AlertTriangle, Mic,
  Moon, BookOpen, Flower2, Gem, Crown, Bell, Sun, Minus, CheckCheck, DoorOpen, Sofa, Wind, ChevronsDown, Undo2, Redo2,
  Download,
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
const FONT_HY = "'Noto Serif Armenian', serif";

const CHART_COLORS = { yes: "#8FBFA3", no: "#D98E8E", pending: "#6C7C74" };

const BG_PRESETS = {
  botanical: { name: "Botanical", css: "linear-gradient(160deg, #1f3a2e 0%, #24463d 45%, #16211d 100%)" },
  blush: { name: "Blush", css: "linear-gradient(160deg, #7a4a52 0%, #b76e6e 55%, #e4cd9a 100%)" },
  dusk: { name: "Dusk", css: "linear-gradient(160deg, #2b1f3a 0%, #4a2f4d 50%, #b76e6e 100%)" },
  gilded: { name: "Gilded", css: "linear-gradient(160deg, #3a2f14 0%, #8a6a2c 50%, #e4ce95 100%)" },
};

// A page background can hold BOTH an uploaded custom photo (bg.image) and a
// chosen preset (bg.preset) at the same time — switching to a preset swatch
// only changes which one is currently shown, it never discards the uploaded
// photo. `useCustomImage` is the flag that tracks which one is active;
// `undefined` (invitations saved before this flag existed) defaults to
// "active" so old data keeps showing its photo exactly as before.
function hasActiveCustomImage(bg) {
  return !!(bg?.mode === "photo" && bg.image && bg.useCustomImage !== false);
}

const TIMELINE_ICONS = {
  church: { icon: Church }, wine: { icon: Wine }, utensils: { icon: UtensilsCrossed },
  party: { icon: PartyPopper }, heart: { icon: Heart }, sparkles: { icon: Sparkles },
};

// Lucide's own "Cross" icon is a symmetric medical/first-aid cross (equal
// arms, like a plus sign) — not a Latin/religious cross, which has a long
// vertical bar and a shorter horizontal bar set in the upper third, not
// centered. Drawn here directly rather than relying on lucide's version,
// which visibly doesn't match what a religious cross actually looks like.
function LatinCrossIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" style={style}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="5" y1="8" x2="19" y2="8" />
    </svg>
  );
}

function CelticCrossIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" style={style}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="5" y1="9" x2="19" y2="9" />
      <circle cx="12" cy="9" r="5.5" />
    </svg>
  );
}

function OrnateCrossIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="5" y1="9" x2="19" y2="9" />
      <path d="M12 3l-2 2 2 2 2-2-2-2z" />
      <path d="M12 17l-2 2 2 2 2-2-2-2z" />
      <path d="M5 9l-2 2 2 2 2-2-2-2z" />
      <path d="M19 9l-2 2 2 2 2-2-2-2z" />
    </svg>
  );
}

function CrossRaysIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 3 L12 20 M6.5 9 L17.5 9" strokeWidth={2.4} />
      <g strokeWidth={1.2}>
        <line x1="12" y1="0.5" x2="12" y2="2.2" />
        <line x1="4" y1="3.5" x2="5.3" y2="4.8" />
        <line x1="20" y1="3.5" x2="18.7" y2="4.8" />
        <line x1="1" y1="9.5" x2="3" y2="9.5" />
        <line x1="23" y1="9.5" x2="21" y2="9.5" />
        <line x1="2" y1="16" x2="4" y2="15" />
        <line x1="22" y1="16" x2="20" y2="15" />
        <line x1="7" y1="2" x2="8" y2="3.7" />
        <line x1="17" y1="2" x2="16" y2="3.7" />
      </g>
    </svg>
  );
}

// A loose, single-stroke heart with a small flourish tail past the bottom
// point — a hand-drawn "doodle" feel, distinct from the plain filled/outline
// Heart icon already in this list.
function HeartDoodleIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 19 C12 19 4.5 12.5 4.5 7.8 C4.5 4.3 8 2.5 10 4.3 C11 5.2 12 6.8 12 6.8 C12 6.8 13 5.2 14 4.3 C16 2.5 19.5 4.3 19.5 7.8 C19.5 12.5 12 19 12 19" />
      <path d="M12 19 C10.3 20.6 7.8 21.6 6.3 20.4" />
    </svg>
  );
}

function BrideIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="4.3" r="2" />
      <path d="M12 6.3 L12 8" />
      <path d="M9.5 8 C9.5 8 8.2 8.3 7.5 10 L6 21 Q12 23 18 21 L16.5 10 C15.8 8.3 14.5 8 14.5 8 Z" />
      <circle cx="12" cy="14.5" r="1.3" />
      <circle cx="10.6" cy="14" r="0.9" />
      <circle cx="13.4" cy="14" r="0.9" />
    </svg>
  );
}

function GroomIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="4.3" r="2" />
      <path d="M12 6.3 L12 7.5" />
      <path d="M8.5 8 L7.5 15 L16.5 15 L15.5 8 C15.5 8 13.6 9 12 9 C10.4 9 8.5 8 8.5 8 Z" />
      <path d="M9 15 L8.3 21 M10.5 15 L10 21 M13.5 15 L14 21 M15 15 L15.7 21" />
      <circle cx="12" cy="8.6" r="0.55" fill={color} stroke="none" />
    </svg>
  );
}

function ChurchArchIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2 L12 5 M10.6 3.3 L13.4 3.3" />
      <path d="M6 21 L6 11 L12 6 L18 11 L18 21 Z" />
      <path d="M10.5 21 L10.5 15 Q12 13.3 13.5 15 L13.5 21" />
      <path d="M7.5 17.5 L9 17.5 M15 17.5 L16.5 17.5" />
    </svg>
  );
}

function ChampagneToastIcon({ size = 24, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <g transform="rotate(-22 5.5 13)">
        <path d="M2.5 3.5 L8.5 3.5 L5.5 9 Z" />
        <path d="M5.5 9 L5.5 17" />
        <path d="M3.3 18.5 L7.7 18.5" />
        <path d="M5.5 17 L5.5 18.5" />
        <path d="M3.3 5.8 C4.1 7 6.9 7 7.7 5.8" strokeWidth={1} />
        <path d="M3.3 18.5 C2 17.7 2 16.6 3.1 16.2 C2.3 15.3 3.3 14.3 4.3 14.7" strokeWidth={0.9} />
      </g>
      <g transform="rotate(22 18.5 13)">
        <path d="M15.5 3.5 L21.5 3.5 L18.5 9 Z" />
        <path d="M18.5 9 L18.5 17" />
        <path d="M16.3 18.5 L20.7 18.5" />
        <path d="M18.5 17 L18.5 18.5" />
        <path d="M16.3 5.8 C17.1 7 19.9 7 20.7 5.8" strokeWidth={1} />
        <path d="M20.7 18.5 C22 17.7 22 16.6 20.9 16.2 C21.7 15.3 20.7 14.3 19.7 14.7" strokeWidth={0.9} />
      </g>
    </svg>
  );
}

// Decorative icons available as a standalone block on ANY page, or next to
// each side's title on the Family page. Lucide doesn't provide a combined
// crescent-and-star or Star-of-David icon, so each entry is named for
// exactly what it depicts (a cross, a crescent moon, an open book, a star)
// rather than claiming a specific religious symbol it wouldn't precisely
// represent.
const DECORATIVE_ICONS = {
  cross: { name: "Cross", icon: LatinCrossIcon },
  crossCeltic: { name: "Celtic cross", icon: CelticCrossIcon },
  crossOrnate: { name: "Ornate cross", icon: OrnateCrossIcon },
  crossRays: { name: "Cross with rays", icon: CrossRaysIcon },
  church: { name: "Church", icon: Church },
  churchArch: { name: "Church (arch)", icon: ChurchArchIcon },
  crescentMoon: { name: "Crescent moon", icon: Moon },
  openBook: { name: "Open book", icon: BookOpen },
  star: { name: "Star", icon: Star },
  flower: { name: "Flower", icon: Flower2 },
  heart: { name: "Heart", icon: Heart },
  heartDoodle: { name: "Heart (doodle)", icon: HeartDoodleIcon },
  sparkles: { name: "Sparkles", icon: Sparkles },
  gem: { name: "Gem", icon: Gem },
  crown: { name: "Crown", icon: Crown },
  bell: { name: "Bell", icon: Bell },
  sun: { name: "Sun", icon: Sun },
  bride: { name: "Bride", icon: BrideIcon },
  groom: { name: "Groom", icon: GroomIcon },
  champagneToast: { name: "Champagne toast", icon: ChampagneToastIcon },
};

const GATE_ICONS = { heart: Heart, mail: Mail, sparkles: Sparkles, star: Star };
// Slow-motion feel for the intro gate's video background once it starts
// playing after the tap — never before it (that's still governed entirely
// by the pause/play guards around gateVideoRef).
const GATE_VIDEO_PLAYBACK_RATE = 0.5;
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

// The 5 starting templates a client picks from before entering the Builder.
// Each one is a complete, cohesive combination built from the presets and
// styles that already exist in this app (backgrounds, gate animation, gate
// icon) — this is a real, working starting point today.
//
// Honest limitation: fonts and the core color palette (GOLD, EMERALD, INK,
// PAPER, etc.) are fixed module-level constants in this file, not yet
// per-invitation settings — so these 5 templates differ in background,
// gate style, and icon, not in typography or overall color scheme.
//
// TO USE YOUR OWN REAL CANVA DESIGN for a template's Cover page: add
// `coverImage` (the real, public image URL — see the Supabase Storage
// steps discussed earlier) and, since a transparent PNG export needs a
// solid color behind it, `coverBackdropColor` (a hex string matching your
// design's own background color). Example:
//
//   {
//     id: "my-real-design",
//     name: "Garden Romance",
//     description: "Hand-painted florals on ivory.",
//     previewSwatch: "#FBF6EE", // shown in the picker grid before the real image loads
//     coverImage: "https://your-project.supabase.co/storage/v1/object/public/template-images/garden-romance-cover.png",
//     coverBackdropColor: "#FBF6EE", // matches your design's own background — fills any transparent areas
//     pageBackgroundPreset: "blush", // still used for the OTHER 9 pages (RSVP, Timeline, etc.) unless you also give each of those their own image
//     gateAnimationStyle: "petals",
//     gateIcon: "heart",
//   },
//
// The couple's names and other dynamic text are never part of the image
// itself — they render as separate, draggable text blocks on top of it,
// via the same layout system already used everywhere else in this app
// (layouts.cover.names / layouts.cover.intro). Nothing new needed there.
// Event types for the new Step Zero — chosen before the template picker.
// Honest limitation: content overrides below are written for English only.
// The other 3 languages (ar/fr/es) keep the wedding-oriented wording
// unless/until real translations are written for each event type — same
// shape of extension as English, just more text to translate carefully
// (worth getting a native speaker to review, especially for something
// like Baptism wording).
//
// Also honest: the underlying PAGE STRUCTURE (Timeline, Family, RSVP,
// etc.) stays the same regardless of event type — this changes the
// starting TEXT to fit the occasion, not the page types themselves. A
// Baptism's religious content or a Baby Shower's registry emphasis being
// genuinely different sections would need a larger redesign than this.
const EVENT_TYPES = [
  {
    id: "wedding",
    name: "Wedding",
    icon: Heart,
    contentOverrides: null, // the app's existing defaults are already wedding-oriented — nothing to override
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: PartyPopper,
    contentOverrides: {
      cover: { name1: "Sarah", name2: "", intro: "joyfully invites you to celebrate her birthday", tapText: "TAP TO START" },
      family: { greeting: "Come celebrate another wonderful year — your presence would make the day even sweeter.", side1Title: "Hosted by", side1Names: "The Smith Family", side2Title: "", side2Names: "" },
      rsvp: { yesLabel: "Yes, I'll be there!", noLabel: "Sorry, can't make it" },
    },
    // Replaces the wedding-specific timeline/locations/registry entirely —
    // a birthday has its own day shape (arrival, cake, party) rather than
    // a ceremony-then-reception structure, and no gift registry makes
    // sense without a couple to register as.
    timeline: [
      { id: "bday-tl-1", icon: "utensils", time: "4:00 PM", label: { en: "Guests Arrive", ar: "وصول الضيوف", fr: "Arrivée des invités", es: "Llegada de invitados" } },
      { id: "bday-tl-2", icon: "party", time: "5:00 PM", label: { en: "Games & Fun", ar: "ألعاب ومرح", fr: "Jeux et animations", es: "Juegos y diversión" } },
      { id: "bday-tl-3", icon: "wine", time: "6:30 PM", label: { en: "Cake & Candles", ar: "الكيك والشموع", fr: "Gâteau et bougies", es: "Pastel y velas" } },
      { id: "bday-tl-4", icon: "party", time: "7:30 PM", label: { en: "Party Continues", ar: "استمرار الحفلة", fr: "La fête continue", es: "Sigue la fiesta" } },
    ],
    locations: [
      { id: "bday-loc-1", time: "4:00 PM", address: "123 Celebration Lane", title: { en: "The Party", ar: "مكان الحفلة", fr: "La Fête", es: "La Fiesta" } },
    ],
    registry: [
      { id: "bday-reg-1", label: "Wishlist", url: "", note: "" },
    ],
  },
  {
    id: "quinceanera",
    name: "Quinceañera",
    icon: Crown,
    contentOverrides: {
      cover: { name1: "Sofía", name2: "", intro: "joyfully invites you to celebrate her Quinceañera — a magical XV celebration", tapText: "TAP TO START" },
      family: { greeting: "Fifteen years of joy, grace, and dreams — please join us as we celebrate this cherished milestone.", side1Title: "Parents", side1Names: "Mr. & Mrs. Rodríguez", side2Title: "Padrinos", side2Names: "" },
      rsvp: { yesLabel: "Joyfully Accepts", noLabel: "Regretfully Declines" },
    },
    // A Quinceañera has its own well-known shape — mass, the court of
    // honor, the traditional shoe-change and father-daughter waltz — quite
    // different from either a wedding or an ordinary birthday party.
    timeline: [
      { id: "quince-tl-1", icon: "church", time: "4:00 PM", label: { en: "Mass / Ceremony", ar: "القداس", fr: "Messe / Cérémonie", es: "Misa / Ceremonia" } },
      { id: "quince-tl-2", icon: "sparkles", time: "6:00 PM", label: { en: "Court of Honor Presentation", ar: "تقديم موكب الشرف", fr: "Présentation de la cour d'honneur", es: "Presentación de la corte de honor" } },
      { id: "quince-tl-3", icon: "party", time: "6:30 PM", label: { en: "Changing of the Shoes & Waltz", ar: "تبديل الحذاء والرقصة", fr: "Changement de chaussures et valse", es: "Cambio de zapatillas y vals" } },
      { id: "quince-tl-4", icon: "utensils", time: "7:30 PM", label: { en: "Dinner", ar: "العشاء", fr: "Dîner", es: "Cena" } },
      { id: "quince-tl-5", icon: "wine", time: "9:00 PM", label: { en: "Cake & Toast", ar: "الكيك ونخب", fr: "Gâteau et toast", es: "Pastel y brindis" } },
      { id: "quince-tl-6", icon: "party", time: "9:30 PM", label: { en: "Party & Dancing", ar: "حفلة ورقص", fr: "Fête et danse", es: "Fiesta y baile" } },
    ],
    locations: [
      { id: "quince-loc-1", time: "4:00 PM", address: "123 Cathedral Ave", title: { en: "The Ceremony", ar: "مكان القداس", fr: "La Cérémonie", es: "La Ceremonia" } },
      { id: "quince-loc-2", time: "6:00 PM", address: "456 Grand Ballroom Dr", title: { en: "The Celebration", ar: "مكان الحفلة", fr: "La Célébration", es: "La Celebración" } },
    ],
    registry: [
      { id: "quince-reg-1", label: "Wishlist", url: "", note: "" },
    ],
  },
  {
    id: "baptism",
    name: "Baptism",
    icon: Church,
    contentOverrides: {
      cover: { name1: "Baby Noor", name2: "", intro: "You are lovingly invited to witness her baptism and blessing", tapText: "TAP TO START" },
      family: { greeting: "With grateful hearts, we invite you to celebrate this sacred milestone with us.", side1Title: "Godparents", side1Names: "", side2Title: "Parents", side2Names: "" },
      rsvp: { yesLabel: "Joyfully Accepts", noLabel: "Regretfully Declines" },
    },
  },
  {
    id: "babyShower",
    name: "Baby Shower",
    icon: Gift,
    contentOverrides: {
      cover: { name1: "Sarah", name2: "", intro: "is expecting! Join us for a baby shower to celebrate", tapText: "TAP TO START" },
      family: { greeting: "Come shower the mom-to-be with love as we celebrate the newest addition to the family.", side1Title: "Hosted by", side1Names: "", side2Title: "", side2Names: "" },
      rsvp: { yesLabel: "I'll be there!", noLabel: "Can't make it" },
    },
  },
];

/** Applies an event type's content overrides onto a fresh snapshot — English only, see the honest note above EVENT_TYPES. */
function applyEventTypeToSnapshot(snapshot, eventType) {
  if (!eventType?.contentOverrides && !eventType?.timeline && !eventType?.locations && !eventType?.registry) return snapshot;
  const en = snapshot.content.en;
  return {
    ...snapshot,
    content: eventType.contentOverrides ? {
      ...snapshot.content,
      en: {
        ...en,
        cover: { ...en.cover, ...eventType.contentOverrides.cover },
        family: { ...en.family, ...eventType.contentOverrides.family },
        rsvp: { ...en.rsvp, ...eventType.contentOverrides.rsvp },
      },
    } : snapshot.content,
    timeline: eventType.timeline || snapshot.timeline,
    locations: eventType.locations || snapshot.locations,
    registry: eventType.registry || snapshot.registry,
  };
}

// Fill in your own Supabase project's values here to make saves go to a real
// shared cloud database instead of this browser's local storage — that's
// what actually makes data visible across different devices/guests. Get
// these from your Supabase project: Settings → API. The anon key is
// DESIGNED to be public (safe to put directly in client-side code like
// this) — real protection comes from the RLS policies on the table itself,
// not from hiding this key. See sql/kv_store.sql for the table this expects.
// THE ACTUAL FIX for the blank/white screen: this block MUST come before
// anything that references SUPABASE_URL — TEMPLATE_IMAGE_BASE below does
// exactly that. Unlike a reference inside a function body (safe, since
// that only runs when the function is later called), this is top-level
// code that executes immediately, in file order, when the module loads.
// Referencing SUPABASE_URL before its own declaration threw a
// ReferenceError that crashed the entire app before anything could
// render — which is exactly what a blank white screen looks like.
const SUPABASE_URL = "https://cores.einvite.me";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLXNlbGYtaG9zdGVkIiwiaWF0IjoxNzg5NjQzMjM5LCJleHAiOjIxMDUwMDMyMzl9.F94kRvGQvVWb0lrgiuFNPx4aG3g4oRCwGgudW4IIkR8";
const supabaseConfigured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// Public Storage URLs for the real, uploaded designs — bucket must be set
// to public in Supabase Dashboard -> Storage -> template-images -> bucket
// settings, or these URLs won't load for guests/clients.
const TEMPLATE_IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/template-images`;
// Same setup as TEMPLATE_IMAGE_BASE, but its own bucket — videos are much
// larger than the template thumbnails, so keeping them separate avoids
// slowing down anything that lists all templates and only needs the image.
// Create this bucket the same way: Supabase Dashboard -> Storage -> New
// bucket -> name it exactly "template-videos" -> toggle Public.
const TEMPLATE_VIDEO_BASE = `${SUPABASE_URL}/storage/v1/object/public/template-videos`;

const INVITATION_TEMPLATES = [
  {
    id: "design-1",
    name: "Design 1",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/1.png`,
    coverBackdropColor: null, // defaults to this app's own dark background (INK) behind any transparent areas — set this to your design's real background color (a hex string) if it isn't dark
    pageBackgroundPreset: "botanical", // still used for the OTHER 9 pages (RSVP, Timeline, etc.) — give each of those their own coverImage-style override too if you want the whole invitation matching this design
    // Matches the client's OWN typed name text to whatever decorative font
    // the Canva design itself used for its sample name — since that sample
    // name is just pixels baked into the flat image, it can never be
    // edited directly; this is what makes a real client's own name LOOK
    // like it belongs in the design, even though it's a separate, fully
    // editable text layer rendered on top of the image.
    coverName1Font: "'IBM Plex Sans Condensed', sans-serif",
    // TeX Gyre Termes isn't a Google Font and no license/files were on
    // hand for it — PT Serif substituted as the closest free, similar
    // classic serif. Swap this value if a real license is obtained later.
    coverAmpersandFont: "'PT Serif', serif",
    // Brittany is a paid script font (no license/files on hand) — Alex
    // Brush substituted as the closest free, similarly flowing script.
    // Swap this value if a real license is obtained later.
    coverName2Font: "'Alex Brush', cursive",
    coverIntroFont: "'Moontime', cursive",
    coverDateFont: "'Lora', serif",
    gateAnimationStyle: "floatingHearts",
    gateIcon: "heart",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"], // tag more narrowly once you know which occasion(s) each real design actually suits
    // Etsy-style purchase: a guest pays THIS specific price for THIS
    // specific design, then gets redirected straight to canvaTemplateUrl
    // to customize it themselves in Canva — this app has no further
    // involvement once that redirect happens. canvaTemplateUrl needs to
    // be a real Canva "Use template" share link (Canva: open the design →
    // Share → "Template link" — NOT the normal edit-URL, which would let
    // a buyer edit YOUR original instead of getting their own copy).
    // price is shown on the template card and is what buyer actually pays.
    price: 0, // placeholder — set the real price in USD (or your currency) before enabling this for real
    canvaTemplateUrl: "https://canva.link/hj1zcghbmpr8bc9", // verify this is specifically a "Use Template" share link, not a regular edit link — see the setup note above INVITATION_TEMPLATES
    // Filename has spaces ("template video 1.mp4") — encodeURIComponent
    // handles that correctly; a raw space in a URL breaks it.
    previewVideo: `${TEMPLATE_VIDEO_BASE}/${encodeURIComponent("template video 1.mp4")}`,
  },
  {
    id: "design-3",
    name: "Design 3",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/3.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "blush",
    coverNameFont: null,
    coverNameColor: null,
    gateAnimationStyle: "petals",
    gateIcon: "heart",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    canvaTemplateUrl: null, // placeholder — paste the real Canva "Use template" link
    previewVideo: `${TEMPLATE_VIDEO_BASE}/wedding-template-1.mp4`,
  },
  {
    id: "design-5",
    name: "Design 5",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/5.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "dusk",
    coverNameFont: null,
    coverNameColor: null,
    gateAnimationStyle: "sparkleDrift",
    gateIcon: "star",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    canvaTemplateUrl: "https://canva.link/arv645e3ivxnkgf", // verify this is specifically a "Use Template" share link, not a regular edit link
    previewVideo: `${TEMPLATE_VIDEO_BASE}/wedding-template.mp4`,
  },
  {
    id: "design-6",
    name: "Design 6",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/6.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "gilded",
    coverNameFont: null,
    coverNameColor: null,
    gateAnimationStyle: "confetti",
    gateIcon: "sparkles",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    canvaTemplateUrl: null, // placeholder — paste the real Canva "Use template" link
    previewVideo: null, // placeholder — once uploaded, set to `${TEMPLATE_VIDEO_BASE}/6.mp4`
  },
  {
    id: "design-8",
    name: "Design 8",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/8.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "botanical",
    coverNameFont: null,
    coverNameColor: null,
    gateAnimationStyle: "floatingHearts",
    gateIcon: "heart",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    canvaTemplateUrl: null, // placeholder — paste the real Canva "Use template" link
    previewVideo: null, // placeholder — once uploaded, set to `${TEMPLATE_VIDEO_BASE}/8.mp4`
  },
  {
    id: "design-11",
    name: "Design 11",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/11.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "blush",
    coverNameFont: null,
    coverNameColor: null,
    gateAnimationStyle: "petals",
    gateIcon: "star",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    canvaTemplateUrl: null, // placeholder — paste the real Canva "Use template" link
    previewVideo: null, // placeholder — once uploaded, set to `${TEMPLATE_VIDEO_BASE}/11.mp4`
  },
  {
    id: "design-12",
    name: "Design 12",
    description: "",
    coverImage: `${TEMPLATE_IMAGE_BASE}/12.png`,
    coverBackdropColor: null,
    pageBackgroundPreset: "dusk",
    coverNameFont: "'Amiri', serif",
    coverNameColor: null,
    // One image per other page — upload each to the template-images
    // bucket (same as coverImage above) and set its URL here. Any page
    // left as null keeps the pageBackgroundPreset ("dusk") instead.
    pageImages: {
      family: null, // e.g. `${TEMPLATE_IMAGE_BASE}/12-family.png`
      timeline: null,
      locations: null,
      countdown: null,
      rsvp: null,
      registry: null,
      djRequests: null,
      networking: null,
      livestream: null,
    },
    gateAnimationStyle: "confetti",
    gateIcon: "sparkles",
    eventTypes: ["wedding", "birthday", "baptism", "babyShower"],
    price: 0, // placeholder — set the real price
    // This design is edited directly on core.einvite.me's own Builder,
    // not via a Canva redirect — the shop purchase flow creates an
    // account and applies this template instead of emailing a Canva link.
    editOnWebsite: true,
    canvaTemplateUrl: null,
    previewVideo: null, // placeholder — once uploaded, set to `${TEMPLATE_VIDEO_BASE}/12.mp4`
  },
];

/** Applies a template's choices onto a fresh invitation snapshot — background preset (if the template specifies one), gate style/icon, and (when specified) a matching font/color for the Cover page's own dynamic name text, so it visually matches whatever decorative font the Canva design itself used for its baked-in sample name. */
function applyTemplateToSnapshot(snapshot, template) {
  if (!template) return snapshot;
  let pageBackgrounds = template.pageBackgroundPreset
    ? Object.fromEntries(Object.entries(snapshot.pageBackgrounds).map(([key, bg]) => [key, { ...bg, preset: template.pageBackgroundPreset }]))
    : snapshot.pageBackgrounds;
  // A real custom design image (e.g. a Canva export) for the Cover page,
  // as opposed to just picking one of the built-in gradient presets.
  // darken defaults to 0 here — the usual dark gradient overlay is meant
  // for photo backgrounds, not a designed graphic with its own transparent
  // areas and colors already chosen deliberately.
  if (template.coverImage) {
    pageBackgrounds = {
      ...pageBackgrounds,
      cover: { mode: "photo", preset: pageBackgrounds.cover.preset, image: template.coverImage, backdropColor: template.coverBackdropColor || null, darken: template.coverDarken ?? 0 },
    };
  }
  // Per-page custom images beyond just the cover — e.g. a 9-page Canva
  // design where every page (Family, Timeline, Locations, RSVP...) has
  // its own matching background, not just one shared preset. Only pages
  // actually listed in pageImages are overridden; anything not listed
  // keeps whatever pageBackgroundPreset (or the default) already set.
  if (template.pageImages) {
    pageBackgrounds = {
      ...pageBackgrounds,
      ...Object.fromEntries(
        Object.entries(template.pageImages)
          .filter(([, image]) => image) // skip any page not yet given a real image — leave its preset background alone
          .map(([stepKey, image]) => [
            stepKey,
            { mode: "photo", preset: pageBackgrounds[stepKey]?.preset, image, backdropColor: null, darken: 0 },
          ])
      ),
    };
  }
  // Only touches layouts.cover when the snapshot actually has one AND the
  // template specifies at least one of these overrides — leaves position,
  // size, and any field not explicitly set by this template untouched.
  // Applied to every language's own cover layout, since a shop template's
  // font/color choices should look the same regardless of which language a
  // guest is viewing.
  let layouts = snapshot.layouts;
  const hasNameOverrides = template.coverNameFont || template.coverNameColor
    || template.coverName1Font || template.coverAmpersandFont || template.coverName2Font;
  const hasIntroOverride = template.coverIntroFont || template.coverIntroColor;
  const hasDateOverride = template.coverDateFont || template.coverDateColor;
  if (layouts && (hasNameOverrides || hasIntroOverride || hasDateOverride)) {
    const overrideOneLangCover = (langLayouts) => {
      if (!langLayouts?.cover) return langLayouts;
      return {
        ...langLayouts,
        cover: {
          ...langLayouts.cover,
          ...(hasNameOverrides && langLayouts.cover.names ? {
            names: {
              ...langLayouts.cover.names,
              ...(template.coverNameFont ? { fontFamily: template.coverNameFont } : {}),
              ...(template.coverNameColor ? { color: template.coverNameColor } : {}),
              ...(template.coverName1Font ? { name1FontFamily: template.coverName1Font } : {}),
              ...(template.coverAmpersandFont ? { ampersandFontFamily: template.coverAmpersandFont } : {}),
              ...(template.coverName2Font ? { name2FontFamily: template.coverName2Font } : {}),
            },
          } : {}),
          ...(hasIntroOverride && langLayouts.cover.intro ? {
            intro: {
              ...langLayouts.cover.intro,
              ...(template.coverIntroFont ? { fontFamily: template.coverIntroFont } : {}),
              ...(template.coverIntroColor ? { color: template.coverIntroColor } : {}),
            },
          } : {}),
          ...(hasDateOverride && langLayouts.cover.date ? {
            date: {
              ...langLayouts.cover.date,
              ...(template.coverDateFont ? { fontFamily: template.coverDateFont } : {}),
              ...(template.coverDateColor ? { color: template.coverDateColor } : {}),
            },
          } : {}),
        },
      };
    };
    layouts = Object.fromEntries(LANGS.map((l) => [l, overrideOneLangCover(layouts[l])]));
  }
  return {
    ...snapshot,
    pageBackgrounds,
    ...(layouts ? { layouts } : {}),
    intro: { ...snapshot.intro, animationStyle: template.gateAnimationStyle, icon: template.gateIcon },
  };
}

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

const emptyIntroMedia = () => ({ en: null, ar: null, fr: null, es: null, hy: null }); // each entry: { type: 'image'|'video', url, name }

const defaultIntroSettings = {
  type: "button",
  icon: "heart",
  animationStyle: "floatingHearts",
  sealDesign: "gold",
  media: emptyIntroMedia(),
  revealHoldMs: null, // null = 700ms (the "Medium" point in REVEAL_SPEED_MS, in CoverStep) — same speed regardless of background media type, until the admin picks a different one
};

// Named points on the "Transition speed" slider in CoverStep, rather than a
// raw free-typed number — keeps the range sane and the label readable.
const REVEAL_SPEED_MS = [
  { key: "fast", label: "Fast", ms: 350 },
  { key: "medium", label: "Medium", ms: 700 },
  { key: "slow", label: "Slow", ms: 1200 },
];

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
  { key: "ibmplexcondensed", label: "IBM Plex Sans Condensed", value: "'IBM Plex Sans Condensed', sans-serif" },
  { key: "ptserif", label: "PT Serif (free substitute for TeX Gyre Termes — no license on file for the original)", value: "'PT Serif', serif" },
  { key: "alexbrush", label: "Alex Brush (free substitute for Brittany — no license on file for the original)", value: "'Alex Brush', cursive" },
  { key: "moontime", label: "Moontime", value: "'Moontime', cursive" },
  { key: "lora", label: "Lora", value: "'Lora', serif" },
  { key: "amiri", label: "Amiri (Arabic)", value: "'Amiri', serif" },
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

/**
 * Sends a real approval-notification email via the send-approval-email
 * Edge Function (Resend under the hood — see approval-email-backend/).
 * Never throws: a failed email send is logged but never blocks the actual
 * account approval from succeeding, since the approval itself (unlocking
 * the client's access) matters more than the notification about it.
 */
async function sendApprovalEmail({ recipientEmail, recipientName, invitationLink, siteDomain }) {
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/send-approval-email`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ recipientEmail, recipientName, invitationLink, siteDomain }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("sendApprovalEmail failed:", res.status, data.error);
      return { sent: false, error: data.error || `Status ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("sendApprovalEmail threw:", err);
    return { sent: false, error: "Couldn't reach the email service." };
  }
}

// ---------------------------------------------------------------------- //
// Package purchases — a client can build/edit their invitation completely
// freely; this is what actually unlocks it for real, live use (publishing
// the real guest link, and any features their package tier includes).
// Same proven payment pattern as the livestream feature above: a pending
// session, a redirect to Whish, a server-side webhook confirms it, and the
// app polls to find out once that's happened.
// ---------------------------------------------------------------------- //

// What each package tier actually includes — the single place to edit if
// pricing or feature inclusion changes. `pageKeys` lists which of this
// app's page types this tier unlocks for real, live/published use; a page
// not listed here still works fine while just building/previewing, but
// won't be reachable by actual guests until the client's tier includes it
// (see isFeatureUnlocked below).
const PACKAGE_TIERS = {
  basic: {
    name: "Basic",
    price: 15,
    tagline: "Everything you need for a beautiful, working invitation.",
    pageKeys: ["cover", "family", "timeline", "locations", "countdown", "rsvp", "registry"],
  },
  pro: {
    name: "Pro",
    price: 35,
    tagline: "Basic, plus ways for guests to interact with each other and the night's music.",
    pageKeys: ["cover", "family", "timeline", "locations", "countdown", "rsvp", "registry", "djRequests", "networking"],
  },
  premium: {
    name: "Premium",
    price: 60,
    tagline: "Everything — live streaming for those who can't attend, door check-in, and voice messages from guests.",
    pageKeys: ["cover", "family", "timeline", "locations", "countdown", "rsvp", "registry", "djRequests", "networking", "livestream"],
  },
};

async function createPackagePaymentSession(userId, invitationSlug, packageTier) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/create-package-payment-session`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ userId, invitationSlug, packageTier }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't start payment — please try again.");
  return data; // { paymentReference, paymentUrl }
}

async function getPackageStatus(paymentReference) {
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/get-package-status`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ paymentReference }),
    });
    if (!res.ok) return null;
    return await res.json(); // { status, packageTier }
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- //
// Per-template Canva purchases — an Etsy-style flow, separate and
// independent from the package/publish system above: a guest picks a
// specific design, pays that design's own price, and is redirected
// straight to a real Canva template link to customize it themselves in
// Canva — this app never touches that customization at all. Same proven
// payment pattern (a pending session, a redirect to Whish, a server-side
// webhook confirms it, this app polls to find out), against separate
// Edge Functions of its own — see the setup note above INVITATION_TEMPLATES
// for exactly what needs to be deployed for this to work for real.
// ---------------------------------------------------------------------- //

async function createTemplatePaymentSession(templateId, buyerEmail) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/create-template-payment-session`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ templateId, buyerEmail, guestToken: getOrCreateGuestToken() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't start payment — please try again.");
  return data; // { paymentReference, paymentUrl }
}

async function getTemplatePurchaseStatus(paymentReference) {
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/get-template-purchase-status`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ paymentReference }),
    });
    if (!res.ok) return null;
    return await res.json(); // { status, canvaTemplateUrl }
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------- //
// AI support chatbot — a real AI (not scripted FAQ answers) that can
// answer anything a visitor asks. The actual AI call has to happen on a
// server, never in this browser code: an API key for a real AI service
// (e.g. Anthropic's Claude) must never be embedded in client-side code,
// since anyone could open dev tools and steal it. So this just posts the
// conversation so far to a new Edge Function, which is what actually
// holds the API key and calls the AI service — see the setup note above
// ChatSupportWidget for exactly what needs to be deployed.
// ---------------------------------------------------------------------- //
// ---------------------------------------------------------------------- //
// WhatsApp — sends an approved template message via the send-whatsapp
// Edge Function (the only place that ever holds the real Meta access
// token). See the setup notes above INTEGRATIONS_SETTINGS_HINT / in
// SettingsView's WhatsApp section for what needs to be deployed.
// ---------------------------------------------------------------------- //
// The one approved WhatsApp template this app sends — created and
// approved once in Meta's WhatsApp Manager, referenced here by its exact
// name. Its variables, in order, are: guest name, couple names, and the
// guest's own invitation link; its header is an Image (the invitation's
// share photo).
const WHATSAPP_TEMPLATE_NAME = "wedding_invitation";
const WHATSAPP_REMINDER_TEMPLATE_NAME = "wedding_invitation_reminder"; // sent via the paid "Send Reminder" feature, once unlocked
const WHATSAPP_TEMPLATE_LANGUAGE = "en"; // confirmed via Meta's own template list — do not change without re-checking there first

async function sendWhatsAppMessage({ to, templateName, languageCode, variables, headerImageUrl }) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/clever-api`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ action: "send-whatsapp", to, templateName, languageCode, variables, headerImageUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't send the WhatsApp message.");
  return data; // { sent: true, messageId }
}

// Fires the moment a new account is created that needs manual approval
// (see signUpUser) — never throws, same reasoning as sendApprovalEmail
// below: a failed notification email should never block the signup itself
// from succeeding, it just means you find out about it later than ideal.
async function notifyAdminNewSignup({ userName, userEmail, userPhone }) {
  try {
    const res = await fetch(`${EDGE_FUNCTIONS_URL}/clever-api`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ action: "notify-admin-signup", userName, userEmail, userPhone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("notifyAdminNewSignup failed:", res.status, data.error);
      return { sent: false, error: data.error || `Status ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("notifyAdminNewSignup threw:", err);
    return { sent: false, error: "Couldn't reach the email service." };
  }
}

async function sendChatSupportMessage(messages, context = "shop") {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/clever-api`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ messages, context }), // context: "shop" (default, public/no-account) or "builder" (logged-in client filling their own invitation)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't reach support chat — please try again.");
  return data; // { reply: { role: "assistant", content: "..." }, formData?: {...} }
}

// ---------------------------------------------------------------------- //
// Guest Networking — built directly into this app now, backed by the same
// Supabase project, instead of a separate external backend project. Same
// graceful-degradation pattern as everything else here: safe empty/no-op
// results if Supabase isn't configured, real errors surfaced via
// console.error when a call actually fails.
// ---------------------------------------------------------------------- //

async function registerNetworkingGuest(slug, { name, field, interests, linkedin, instagram, optedIn, photoUrl }) {
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
      photo_url: photoUrl || null,
      approved: false, // requires the couple's explicit approval (see approveNetworkingGuest) before this guest appears to anyone else in the directory
    }),
  });
  if (!res.ok) {
    console.error("registerNetworkingGuest failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't complete registration — please try again.");
  }
  const rows = await res.json();
  return rows[0];
}

// Approves a guest's networking registration — only after this does the
// guest actually appear in getNetworkingDirectory for others to see and
// connect with.
async function approveNetworkingGuest(guestId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/networking_guests?id=eq.${encodeURIComponent(guestId)}`, {
      method: "PATCH",
      headers: { ...supabaseHeaders, Prefer: "return=representation" },
      body: JSON.stringify({ approved: true }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

// Every registered guest for this invitation, regardless of approval status
// — for the couple's own dashboard view, so they can see who's pending and
// approve them. Ordinary guests never see this list; getNetworkingDirectory
// (below) is what they see, and it only ever returns approved guests.
async function getAllNetworkingGuestsForCouple(slug) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/networking_guests?invitation_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Read-only view of every connection made between guests, with both
// guests' names joined in — for the couple's dashboard. The couple never
// moderates these (accept/decline stays strictly between the two guests
// involved); this is purely so they can see who's connecting at their event.
async function getNetworkingConnectionsForCouple(slug) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/networking_connections?invitation_slug=eq.${encodeURIComponent(slug)}&select=*,from_guest:from_guest_id(name),to_guest:to_guest_id(name)&order=created_at.desc`,
      { headers: supabaseHeaders }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getNetworkingDirectory(slug, excludeGuestId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/networking_guests?invitation_slug=eq.${encodeURIComponent(slug)}&opted_in=eq.true&approved=eq.true&id=neq.${encodeURIComponent(excludeGuestId)}&order=created_at.desc`,
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

async function submitVoiceMessage(slug, { guestGroupId, guestName, rsvpStatus, audioData, mimeType, durationSeconds }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/voice_messages`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      invitation_slug: slug,
      guest_group_id: guestGroupId || null,
      guest_name: (guestName || "Guest").trim().slice(0, 100),
      rsvp_status: rsvpStatus,
      audio_data: audioData,
      mime_type: mimeType || "audio/webm",
      duration_seconds: durationSeconds || null,
    }),
  });
  if (!res.ok) {
    console.error("submitVoiceMessage failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't send your voice message — please try again.");
  }
  const rows = await res.json();
  return rows[0];
}

async function getVoiceMessages(slug) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/voice_messages?invitation_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc`, { headers: supabaseHeaders });
    if (!res.ok) {
      console.error("getVoiceMessages failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("getVoiceMessages threw:", err);
    return [];
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

// Undoes a check-in — for a guest who scanned their own QR code out of
// curiosity before actually arriving at the event, marking them checked in
// prematurely; whoever's actually at the door needs a way to clear that
// false mark so the real, on-arrival scan isn't blocked by it.
async function resetCheckin(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guest_checkins?token=eq.${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { ...supabaseHeaders, Prefer: "return=representation" },
      body: JSON.stringify({ checked_in_at: null }),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

/** Uses a free, no-API-key QR generation service — this app has no QR-encoding library available, so this renders the code as a plain <img>. */
function qrCodeImageUrl(data, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Builds a layered neon-style text-shadow: a few tight, bright layers close
// to the letters plus wider, softer layers further out — this reads as a
// glow rather than a flat drop shadow. Returns undefined when no glow
// color is set, so it can be spread straight into a style object.
// `transparency` (0-100, 0 = fully solid) fades the glow's own alpha
// without touching the color underneath it.
function glowTextShadow(color, transparency = 0) {
  if (!color) return undefined;
  const alpha = Math.max(0, Math.min(100, 100 - (transparency || 0))) / 100;
  const c = hexToRgba(color, alpha);
  return `0 0 4px ${c}, 0 0 11px ${c}, 0 0 19px ${c}, 0 0 40px ${c}`;
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

/**
 * Uploads a file to Supabase Storage's public bucket and returns its real,
 * fetchable https:// URL — as opposed to readImageCompressed above, which
 * returns an embedded base64 data URI. This distinction matters
 * specifically for the OG image: WhatsApp/Facebook's crawler independently
 * fetches and caches whatever URL is in og:image, and is documented to
 * expect a real URL it can request on its own — not a value already
 * embedded inline in the HTML it received. A data URI most likely doesn't
 * satisfy that, which is the actual reason the OG image wasn't showing up
 * in link previews even though it displayed correctly inside this app's
 * own UI (where a data URI works completely normally).
 *
 * Requires a PUBLIC bucket named "og-images" in Supabase Storage — same
 * setup as the "template-images" bucket used for template designs
 * (Dashboard -> Storage -> create bucket -> toggle Public).
 */
async function uploadImageToStorage(file, bucket = "og-images", maxDim = 1200, quality = 0.82) {
  // readImageCompressed below draws the file onto a canvas to re-encode it,
  // which only captures a single frame — fine for a still photo, but it
  // silently flattens an animated GIF into a static picture. Upload the raw
  // bytes instead so the animation survives.
  if (file.type === "image/gif") {
    const path = `${crypto.randomUUID()}.gif`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "image/gif" },
      body: file,
    });
    if (!res.ok) {
      console.error("uploadImageToStorage (gif) failed:", res.status, await res.text().catch(() => ""));
      throw new Error("Couldn't upload the image — please try again.");
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
  const compressedDataUrl = await readImageCompressed(file, maxDim, quality);
  const blob = await (await fetch(compressedDataUrl)).blob(); // convert the compressed data URI back into a real Blob Storage can actually store
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": blob.type },
    body: blob,
  });
  if (!res.ok) {
    console.error("uploadImageToStorage failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't upload the image — please try again.");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Uploads an already-compressed data: URI (rather than a raw File) to
// Storage — used both by callers that already have a data URL in hand and
// by the one-time migration below that moves existing base64 images (saved
// before uploads went through Storage) out of the JSON payload.
async function uploadDataUrlToStorage(dataUrl, bucket) {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/gif" ? "gif" : blob.type === "image/png" ? "png" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": blob.type },
    body: blob,
  });
  if (!res.ok) {
    console.error("uploadDataUrlToStorage failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Upload failed");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// A GIF background needs to stay STILL until the guest taps "tap to start" —
// but a GIF, once it's the CSS background-image of a live element, can't be
// paused/resumed the way a <video> can; browsers just animate it continuously
// from the moment it loads. The only way to hold it still is to show a
// separate, genuinely static image in its place before the tap, and switch to
// the real animated GIF only once the tap transition begins. This uploads
// that static frame (reusing readImageCompressed, which captures exactly one
// frame off a canvas — the same behavior that used to be the bug when it was
// the ONLY thing saved for a GIF). A failure here is non-fatal: the caller
// just won't get a "before tap" poster and falls back to the animated URL.
async function uploadGifPosterFrame(file, bucket = "site-decorations") {
  try {
    const compressedDataUrl = await readImageCompressed(file, 1200, 0.82);
    const blob = await (await fetch(compressedDataUrl)).blob();
    const path = `${crypto.randomUUID()}.png`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": blob.type },
      body: blob,
    });
    if (!res.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  } catch {
    return null;
  }
}

// Videos can't be compressed client-side the way images are, and are
// typically many times larger — storing one as a base64 data URL directly
// inside the saved JSON snapshot (like an image used to be, before
// uploadImageToStorage existed) blows straight through the size limit on
// that saved row. Uploading the raw file to its own Storage bucket and
// keeping only the resulting URL in the snapshot avoids that entirely.
// Needs a "custom-videos" bucket created the same way as the others:
// Supabase Dashboard -> Storage -> New bucket -> name it exactly
// "custom-videos" -> toggle Public.
async function uploadVideoToStorage(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/custom-videos/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": file.type || "video/mp4" },
    body: file,
  });
  if (!res.ok) {
    console.error("uploadVideoToStorage failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Couldn't upload the video — please try again.");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/custom-videos/${path}`;
}

/* ---------------------------------------------------------------------- */
/* Languages                                                                */
/* ---------------------------------------------------------------------- */

const LANGS = ["en", "ar", "fr", "es", "hy"];
const LANG_META = {
  en: { label: "English", short: "EN", dir: "ltr", locale: "en-US" },
  ar: { label: "العربية", short: "AR", dir: "rtl", locale: "ar" },
  fr: { label: "Français", short: "FR", dir: "ltr", locale: "fr-FR" },
  es: { label: "Español", short: "ES", dir: "ltr", locale: "es-ES" },
  hy: { label: "Հայերեն", short: "Armenian", dir: "ltr", locale: "hy-AM" },
};

const PREVIEW_T = {
  en: { orderOfDay: "Order of the day", celebration: "The Celebration", countingDownTo: "Counting down to", celebrationWord: "the celebration", celebrationBegun: "The celebration has begun!", days: "days", hrs: "hrs", min: "min", sec: "sec", swipeUp: "Swipe up", swipeLeft: "Swipe left", directions: "Get Directions", tapToStart: "Tap to start", rsvpHeading: "Will you join us?", giftRegistry: "Gift Registry", registryIntro: "Your presence is the greatest gift — but if you'd like to spoil us anyway:", viewRegistry: "View registry" },
  ar: { orderOfDay: "برنامج اليوم", celebration: "مراسم الاحتفال", countingDownTo: "العد التنازلي لـ", celebrationWord: "الاحتفال", celebrationBegun: "لقد بدأ الاحتفال!", days: "يوم", hrs: "ساعة", min: "دقيقة", sec: "ثانية", swipeUp: "اسحب لأعلى", swipeLeft: "اسحب لليسار", directions: "احصل على الاتجاهات", tapToStart: "اضغط للبدء", rsvpHeading: "هل ستكونون معنا؟", giftRegistry: "قائمة الهدايا", registryIntro: "حضوركم هو أجمل هدية — وإن أردتم تدليلنا أكثر:", viewRegistry: "عرض القائمة" },
  fr: { orderOfDay: "Déroulé de la journée", celebration: "La Célébration", countingDownTo: "Compte à rebours vers", celebrationWord: "la célébration", celebrationBegun: "La célébration a commencé !", days: "jours", hrs: "h", min: "min", sec: "s", swipeUp: "Glissez vers le haut", swipeLeft: "Glissez vers la gauche", directions: "Itinéraire", tapToStart: "Touchez pour commencer", rsvpHeading: "Serez-vous des nôtres ?", giftRegistry: "Liste de mariage", registryIntro: "Votre présence est le plus beau des cadeaux — mais si vous souhaitez nous gâter :", viewRegistry: "Voir la liste" },
  es: { orderOfDay: "Orden del día", celebration: "La Celebración", countingDownTo: "Cuenta atrás para", celebrationWord: "la celebración", celebrationBegun: "¡La celebración ha comenzado!", days: "días", hrs: "h", min: "min", sec: "s", swipeUp: "Desliza hacia arriba", swipeLeft: "Desliza hacia la izquierda", directions: "Cómo llegar", tapToStart: "Toca para comenzar", rsvpHeading: "¿Nos acompañarás?", giftRegistry: "Lista de regalos", registryIntro: "Su presencia es el mejor regalo — pero si desean consentirnos:", viewRegistry: "Ver la lista" },
  hy: { orderOfDay: "Օրվա ծրագիրը", celebration: "Տոնակատարությունը", countingDownTo: "Հաշվարկը մինչև", celebrationWord: "տոնակատարությունը", celebrationBegun: "Տոնակատարությունը սկսվել է:", days: "օր", hrs: "ժ", min: "ր", sec: "վ", swipeUp: "Սահեցրեք վերև", swipeLeft: "Սահեցրեք ձախ", directions: "Երթուղի ստանալ", tapToStart: "Հպեք՝ սկսելու համար", rsvpHeading: "Կմիանա՞ք մեզ", giftRegistry: "Նվերների ցանկ", registryIntro: "Ձեր ներկայությունը մեզ համար ամենամեծ նվերն է, սակայն եթե ցանկանում եք մեզ ուրախացնել.", viewRegistry: "Դիտել ցանկը" },
};

/* ---------------------------------------------------------------------- */
/* Default content / data                                                  */
/* ---------------------------------------------------------------------- */

const defaultContent = {
  en: {
    cover: { name1: "Elena", name2: "Marcus", intro: "together with their families, joyfully invite you to celebrate their wedding", tapText: "TAP TO START" },
    family: { greeting: "With hearts full of joy, we invite you to witness the beginning of our forever.", quote: "", side1Title: "Bride's Family", side1Names: "Mr. & Mrs. Rodriguez", side2Title: "Groom's Family", side2Names: "Mr. & Mrs. Chen", side1Icon: null, side2Icon: null },
    rsvp: { heading: "RSVP", yesLabel: "Joyfully Accepts", noLabel: "Regretfully Declines" },
  },
  ar: {
    cover: { name1: "إيلينا", name2: "ماركوس", intro: "يتشرفان مع عائلتيهما بدعوتكم للاحتفال بزفافهما", tapText: "اضغط للبدء" },
    family: { greeting: "بقلوب مفعمة بالفرح، ندعوكم لمشاركتنا بداية قصتنا الأبدية.", quote: "", side1Title: "عائلة العروس", side1Names: "السيد والسيدة رودريغيز", side2Title: "عائلة العريس", side2Names: "السيد والسيدة تشين", side1Icon: null, side2Icon: null },
    rsvp: { heading: "الحضور", yesLabel: "بكل سرور سأحضر", noLabel: "نعتذر عن الحضور" },
  },
  fr: {
    cover: { name1: "Elena", name2: "Marcus", intro: "avec leurs familles, ont la joie de vous inviter à célébrer leur mariage", tapText: "TOUCHEZ POUR COMMENCER" },
    family: { greeting: "Le cœur rempli de joie, nous vous invitons à célébrer le début de notre éternité.", quote: "", side1Title: "Famille de la mariée", side1Names: "M. et Mme Rodriguez", side2Title: "Famille du marié", side2Names: "M. et Mme Chen", side1Icon: null, side2Icon: null },
    rsvp: { heading: "RSVP", yesLabel: "Sera présent avec joie", noLabel: "Ne pourra malheureusement pas venir" },
  },
  es: {
    cover: { name1: "Elena", name2: "Marcus", intro: "junto a sus familias, tienen el placer de invitarles a celebrar su boda", tapText: "TOCA PARA COMENZAR" },
    family: { greeting: "Con el corazón lleno de alegría, les invitamos a celebrar el comienzo de nuestra eternidad.", quote: "", side1Title: "Familia de la novia", side1Names: "Sr. y Sra. Rodríguez", side2Title: "Familia del novio", side2Names: "Sr. y Sra. Chen", side1Icon: null, side2Icon: null },
    rsvp: { heading: "Confirmación", yesLabel: "Asistirá con alegría", noLabel: "Lamenta no poder asistir" },
  },
  hy: {
    cover: { name1: "Elena", name2: "Marcus", intro: "իրենց ընտանիքների հետ միասին սիրով հրավիրում են ձեզ կիսելու իրենց հարսանիքի ուրախությունը", tapText: "ՀՊԵՔ՝ ՍԿՍԵԼՈՒ ՀԱՄԱՐ" },
    family: { greeting: "Ուրախությամբ լի սրտերով հրավիրում ենք ձեզ վկա դառնալու մեր հավերժության սկզբին.", quote: "", side1Title: "Հարսի ընտանիքը", side1Names: "Պարոն և տիկին Ռոդրիգես", side2Title: "Փեսայի ընտանիքը", side2Names: "Պարոն և տիկին Չեն", side1Icon: null, side2Icon: null },
    rsvp: { heading: "Հաստատում", yesLabel: "Ուրախությամբ կմասնակցենք", noLabel: "Ցավոք՝ չենք կարող մասնակցել" },
  },
};

const defaultTimeline = [
  { id: uid(), icon: "church", time: "4:00 PM", label: { en: "Ceremony", ar: "حفل الزفاف", fr: "Cérémonie", es: "Ceremonia", hy: "Արարողություն" } },
  { id: uid(), icon: "wine", time: "5:30 PM", label: { en: "Welcome Drinks", ar: "مشروبات الترحيب", fr: "Cocktail de bienvenue", es: "Bienvenida", hy: "Ողջույնի խմիչքներ" } },
  { id: uid(), icon: "utensils", time: "7:00 PM", label: { en: "Dinner", ar: "العشاء", fr: "Dîner", es: "Cena", hy: "Ընթրիք" } },
  { id: uid(), icon: "party", time: "9:00 PM", label: { en: "Party", ar: "الحفلة", fr: "Soirée dansante", es: "Fiesta", hy: "Խնջույք" } },
];

const defaultLocations = [
  { id: uid(), time: "4:00 PM", address: "St. Augustine Chapel, 12 Rose Ave", title: { en: "The Ceremony", ar: "مراسم الزفاف", fr: "La Cérémonie", es: "La Ceremonia", hy: "Արարողությունը" } },
  { id: uid(), time: "5:30 PM", address: "Willowbrook Estate, 88 Garden Rd", title: { en: "The Reception", ar: "حفل الاستقبال", fr: "La Réception", es: "La Recepción", hy: "Ընդունելությունը" } },
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
  cover: { names: { x: 50, y: 62 }, intro: { x: 50, y: 76 }, date: { x: 50, y: 88 } },
  family: { greeting: { x: 50, y: 34 }, quote: { x: 50, y: 52 }, titles: { x: 50, y: 68 }, names: { x: 50, y: 78 } },
  timeline: { heading: { x: 50, y: 13 }, list: { x: 50, y: 58 } },
  locations: { heading: { x: 50, y: 11 }, list: { x: 50, y: 55 } },
  countdown: { heading: { x: 50, y: 30 }, countdown: { x: 50, y: 58 } },
  rsvp: { heading: { x: 50, y: 22 }, buttons: { x: 50, y: 55 } },
  registry: { heading: { x: 50, y: 13 }, list: { x: 50, y: 55 } },
  djRequests: { heading: { x: 50, y: 26 }, form: { x: 50, y: 60 } },
  networking: { heading: { x: 50, y: 32 }, button: { x: 50, y: 58 } },
  livestream: { heading: { x: 50, y: 32 }, button: { x: 50, y: 58 } },
};

/**
 * Fills in any per-block layout key missing from previously-saved data with
 * its DEFAULT_LAYOUTS value — a saved block's own x/y/color/etc always wins
 * where it exists. THE ACTUAL BUG THIS FIXES: saved layouts were being
 * loaded via a plain object replace (or, at one load site, a merge that
 * only went one level deep — per PAGE key, not per BLOCK key within a
 * page). Older saved data naturally predates any block added after it was
 * saved (e.g. the Family page's "titles" block), so that key was simply
 * missing from `layouts.family` after loading — and DraggableBlock reads
 * `pos.y` directly with no fallback, so a missing block crashes the whole
 * page (blank/white screen) instead of degrading gracefully. Call this on
 * every load path that sets layouts from saved data, not just one of them.
 */
function mergeLayoutsWithDefaults(savedLayouts) {
  const mergeOnePageSet = (pageSet) => {
    const merged = {};
    for (const pageKey of Object.keys(DEFAULT_LAYOUTS)) {
      merged[pageKey] = { ...DEFAULT_LAYOUTS[pageKey], ...(pageSet?.[pageKey] || {}) };
    }
    for (const pageKey of Object.keys(pageSet || {})) {
      if (!merged[pageKey]) merged[pageKey] = pageSet[pageKey];
    }
    return merged;
  };

  // Old saves (before per-language positions) stored page keys directly at
  // the top level: { cover: {...}, family: {...} }. New saves are keyed by
  // language first: { en: { cover: {...} }, ar: { cover: {...} } }. Detect
  // which shape this is by checking whether the top-level keys look like
  // language codes.
  const topKeys = Object.keys(savedLayouts || {});
  const looksPerLanguage = topKeys.length > 0 && topKeys.every((k) => LANGS.includes(k));

  const result = {};
  if (looksPerLanguage) {
    for (const lang of LANGS) result[lang] = mergeOnePageSet(savedLayouts[lang]);
  } else {
    // Old flat structure (or empty/new invitation) — migrate by copying the
    // same positions into every language, so nothing already positioned is
    // lost. Each language's positions become independent from this point on.
    const migrated = mergeOnePageSet(savedLayouts);
    for (const lang of LANGS) result[lang] = migrated;
  }
  return result;
}

// Same backward-compatibility pattern as mergeLayoutsWithDefaults, for
// custom blocks (uploaded images/videos/text/icons/dividers added via
// "Position text"). Old saves stored these flat, shared across every
// language: { cover: [...], family: [...] }. New saves are keyed by
// language first: { en: { cover: [...] }, ar: { cover: [...] } }.
function mergeCustomBlocksWithDefaults(saved) {
  const topKeys = Object.keys(saved || {});
  const looksPerLanguage = topKeys.length > 0 && topKeys.every((k) => LANGS.includes(k));

  const fillMissingSteps = (pageSet) => ({ ...emptyCustomBlocks(), ...(pageSet || {}) });

  const result = {};
  if (looksPerLanguage) {
    for (const lang of LANGS) result[lang] = fillMissingSteps(saved[lang]);
  } else {
    // Old flat structure (or empty/new invitation) — migrate by copying the
    // same custom blocks into every language, so nothing already placed is
    // lost. Each language's custom blocks become independent from this
    // point on (editing one language no longer affects the others).
    const migrated = fillMissingSteps(saved);
    for (const lang of LANGS) result[lang] = migrated;
  }
  return result;
}

// Same backward-compatibility need as the two merge functions above, for the
// actual cover/family/rsvp text: an invitation saved before a language (e.g.
// Armenian) existed has no key for it at all in its saved content, so
// switching to that language left content[lang] undefined — and every step
// component reads it unconditionally (content[activeLang].cover.name1, etc.),
// so the whole editor crashed to a blank page the moment it became active.
function mergeContentWithDefaults(saved) {
  const result = {};
  for (const lang of LANGS) {
    const langDefault = defaultContent[lang] || defaultContent.en;
    const langSaved = saved?.[lang] || {};
    result[lang] = { ...langDefault, ...langSaved };
    for (const section of Object.keys(langDefault)) {
      result[lang][section] = { ...langDefault[section], ...(langSaved[section] || {}) };
    }
  }
  return result;
}

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

// Wraps a value in quotes and escapes any quotes/commas/newlines inside it —
// only needed when the value actually contains a character that would
// otherwise break the CSV grid (a comma reads as a new column, a bare quote
// or newline corrupts the row), so plain values pass through untouched.
const csvCell = (value) => {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// Triggers a browser download for arbitrary text content — used for the
// guest list export, but generic enough to reuse elsewhere later.
const downloadTextFile = (filename, content, mimeType = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

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

function TextInput({ value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
      style={{ background: INK_3, color: disabled ? MUTED : IVORY, border: `1px solid ${INK_3}`, fontFamily: FONT_BODY, opacity: disabled ? 0.6 : 1 }}
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

function GoldButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
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
  const customImageActive = hasActiveCustomImage(bg);
  // Switching presets only changes which source is active — the uploaded
  // photo (bg.image) is left untouched so it's still there, one click away,
  // if the user comes back to it.
  const setPreset = (key) => onChange({ ...bg, mode: "photo", preset: key, useCustomImage: false });
  const setPaper = () => onChange({ ...bg, mode: "paper" });
  // Re-activates the already-uploaded photo without needing to re-upload it.
  const useUploadedImage = () => onChange({ ...bg, mode: "photo", useCustomImage: true });
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Uploaded to Storage (not embedded as a base64 data URI) — a
      // background photo saved inline used to bloat every page's saved
      // background by the full size of the compressed image, which is what
      // made loading a step's background slower the more photos a design
      // accumulated.
      const url = await uploadImageToStorage(file, "invitation-photos", 2400, 0.92);
      // Functional form: merges onto whatever bg is current when this
      // (async) upload finishes, not the `bg` prop from when it started —
      // otherwise clicking a preset swatch or another control right after
      // starting the upload would get silently reverted once the upload's
      // own stale-bg write lands.
      onChange((current) => ({ ...current, mode: "photo", image: url, useCustomImage: true }));
    } catch {
      // Either readImageCompressed couldn't decode this format at all
      // (HEIC/HEIF straight off an iPhone is the common case), or the
      // Storage upload itself failed (network, or the "invitation-photos"
      // bucket doesn't exist yet). Falling back to the raw, undecodable
      // file used to "work" silently: it set a background image with no
      // error, but nothing ever rendered. Failing loudly instead of
      // leaving a stuck blank background.
      alert("Couldn't use that photo — either this format isn't supported by the browser (common for HEIC/HEIF straight off an iPhone), or the upload failed. Convert it to JPG/PNG, check your connection, and try again.");
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
            style={{ background: preset.css, border: bg.mode === "photo" && bg.preset === key && !customImageActive ? `2px solid ${GOLD}` : "2px solid transparent", boxShadow: bg.mode === "photo" && bg.preset === key && !customImageActive ? `0 0 0 2px ${INK_2}` : "none" }}
            title={preset.name}
          />
        ))}
        {bg.image ? (
          <button
            type="button"
            onClick={useUploadedImage}
            className="relative h-11 w-11 rounded-lg transition-all"
            style={{ border: customImageActive ? `2px solid ${GOLD}` : "2px solid transparent", boxShadow: customImageActive ? `0 0 0 2px ${INK_2}` : "none", background: `url(${bg.image}) center/cover` }}
            title="Your uploaded photo"
          >
            <label
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full"
              style={{ background: INK_3, border: `1px solid ${INK_2}` }}
              title="Replace photo"
              onClick={(e) => e.stopPropagation()}
            >
              <Upload size={10} style={{ color: MUTED }} />
              <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUpload} />
            </label>
          </button>
        ) : (
          <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg" style={{ border: `2px dashed rgba(147,166,155,0.5)` }}>
            <Upload size={16} style={{ color: MUTED }} />
            <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUpload} />
          </label>
        )}
      </div>
      {bg.image && (
        <button onClick={() => onChange({ ...bg, image: null, useCustomImage: false })} className="mt-2 text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
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

function BlockStylePanel({ isCustom, isLocation, blockId, stepKey, current, onChangeStyle, onChangeText, onDelete, onDuplicate, onDeselect, onReorder }) {
  const fontKey = FONT_OPTIONS.find((f) => f.value === current.fontFamily)?.key || "auto";
  const isImage = current.type === "image" || current.type === "video";
  const isLine = current.type === "line";
  const isIcon = current.type === "icon";
  return (
    <div className="mb-5 rounded-xl p-4" style={{ background: INK_3, border: `1px solid rgba(201,164,76,0.3)` }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase" style={{ color: GOLD_SOFT, letterSpacing: "0.1em", fontFamily: FONT_BODY }}>
          {current.type === "video" ? "Custom video" : current.type === "divider" ? "Divider" : isLine ? "Line" : isIcon ? "Icon" : isImage ? "Custom image" : isLocation ? "Location" : isCustom ? "Custom text" : "Text style"}
        </span>
        <button onClick={onDeselect} style={{ color: MUTED }}><X size={14} /></button>
      </div>

      {blockId === "heading" && (
        <div className="mb-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
          <div>
            <div className="text-[12px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Heading</div>
            <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Hide this section's title label</div>
          </div>
          <SegmentedToggle
            value={current.hidden ? "hidden" : "shown"}
            onChange={(v) => onChangeStyle({ hidden: v === "hidden" })}
            options={[{ value: "shown", label: "Show" }, { value: "hidden", label: "Hide" }]}
          />
        </div>
      )}

      {stepKey === "locations" && blockId === "list" && (
        <div className="mb-3 rounded-lg p-3" style={{ background: INK_2 }}>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Card background (on a photo)</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.cardOpacity ?? 12}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={current.cardOpacity ?? 12}
            onChange={(e) => onChangeStyle({ cardOpacity: Number(e.target.value) })}
            className="w-full" style={{ accentColor: GOLD }}
          />
          <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            Each location's card behind its title and time — 0% is fully see-through, only visible on a photo background.
          </p>
          <div className="mt-3">
            <FieldLabel>"Get Directions" button text</FieldLabel>
            <TextInput value={current.directionsLabel || ""} onChange={(v) => onChangeStyle({ directionsLabel: v })} placeholder="Get Directions" />
          </div>
          <div className="mt-3">
            <FieldLabel>Button size</FieldLabel>
            <TextInput
              type="number"
              value={String(current.directionsFontSize || 10)}
              onChange={(v) => onChangeStyle({ directionsFontSize: v ? Math.max(8, Math.min(28, Number(v))) : 10 })}
            />
            <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              Scales the whole button — icon, text, and padding — bigger or smaller.
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Button background</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="color" value={current.directionsColor || "#C9A44C"} onChange={(e) => onChangeStyle({ directionsColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded" style={{ border: `1px solid ${INK_3}`, background: "transparent" }} />
                {current.directionsColor && (
                  <button onClick={() => onChangeStyle({ directionsColor: null })} className="text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Button text</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="color" value={current.directionsTextColor || INK} onChange={(e) => onChangeStyle({ directionsTextColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded" style={{ border: `1px solid ${INK_3}`, background: "transparent" }} />
                {current.directionsTextColor && (
                  <button onClick={() => onChangeStyle({ directionsTextColor: null })} className="text-[11px] underline" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <FieldLabel>Button background transparency</FieldLabel>
              <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.directionsTransparency ?? 0}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={current.directionsTransparency ?? 0}
              onChange={(e) => onChangeStyle({ directionsTransparency: Number(e.target.value) })}
              className="w-full" style={{ accentColor: GOLD }}
            />
            <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              100% removes the button's pill shape entirely, leaving just the icon and text — the color picker above can't do this on its own since it only ever picks a solid color.
            </p>
          </div>
        </div>
      )}

      {isLine && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Length (px)</FieldLabel>
              <input
                type="number" min={10} max={400} value={current.length || 100}
                onChange={(e) => onChangeStyle({ length: Math.max(10, Number(e.target.value) || 100) })}
                className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
                style={{ background: INK_2, color: IVORY, fontFamily: FONT_BODY }}
              />
            </div>
            <div>
              <FieldLabel>Thickness (px)</FieldLabel>
              <input
                type="number" min={1} max={40} value={current.thickness || 2}
                onChange={(e) => onChangeStyle({ thickness: Math.max(1, Number(e.target.value) || 2) })}
                className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
                style={{ background: INK_2, color: IVORY, fontFamily: FONT_BODY }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
            <FieldLabel>Orientation</FieldLabel>
            <SegmentedToggle
              value={current.orientation || "horizontal"}
              onChange={(v) => onChangeStyle({ orientation: v })}
              options={[{ value: "horizontal", label: "Horizontal" }, { value: "vertical", label: "Vertical" }]}
            />
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

      {isImage && (
        <div className="mb-3 overflow-hidden rounded-lg" style={{ background: INK_2, maxHeight: 100 }}>
          {current.type === "video" ? (
            <video src={current.url} muted className="mx-auto" style={{ maxHeight: 100, objectFit: "contain" }} />
          ) : (
            <img src={current.url} alt="" className="mx-auto" style={{ maxHeight: 100, objectFit: "contain" }} />
          )}
        </div>
      )}

      {isCustom && !isImage && !isLine && (
        <div className="mb-3">
          <FieldLabel>Text content</FieldLabel>
          <TextArea value={current.text} onChange={onChangeText} rows={2} />
        </div>
      )}

      {current.type === "divider" && (
        <div className="mb-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
          <div>
            <div className="text-[12px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Orientation</div>
            <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Horizontal line, or a subtle vertical line to split the page</div>
          </div>
          <SegmentedToggle
            value={current.orientation || "horizontal"}
            onChange={(v) => onChangeStyle({ orientation: v })}
            options={[{ value: "horizontal", label: "Horizontal" }, { value: "vertical", label: "Vertical" }]}
          />
        </div>
      )}

      {current.type === "divider" && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Size</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.width || 40}%</span>
          </div>
          <input
            type="range" min={10} max={100} value={current.width || 40}
            onChange={(e) => onChangeStyle({ width: Number(e.target.value) })}
            className="w-full" style={{ accentColor: GOLD }}
          />
        </div>
      )}

      {(current.type === "video" || current.type === "image") && (
        <div className="mb-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
          <div>
            <div className="text-[12px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Full screen</div>
            <div className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Covers the entire phone screen instead of a positioned block, showing the whole {current.type} with no cropping</div>
          </div>
          <SegmentedToggle
            value={current.fullScreen ? "on" : "off"}
            onChange={(v) => onChangeStyle({ fullScreen: v === "on", noCrop: v === "on" })}
            options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }]}
          />
        </div>
      )}

      {current.type === "image" && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Transparency</FieldLabel>
            <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.transparency ?? 0}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={current.transparency ?? 0}
            onChange={(e) => onChangeStyle({ transparency: Number(e.target.value) })}
            className="w-full" style={{ accentColor: GOLD }}
          />
          <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            Raise this if the image is too strong or unclear against the background — 0% is fully solid.
          </p>
        </div>
      )}

      {!current.fullScreen && (
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
      )}
      {!current.fullScreen && (
      <p className="mt-1.5 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        Drag on the phone works too — these sliders are a reliable backup if dragging doesn't respond on your device.
      </p>
      )}

      {isLine ? null : isIcon ? (
        <div className="mt-4">
          <FieldLabel>Size (px)</FieldLabel>
          <TextInput
            type="number"
            value={String(current.iconSize || 32)}
            onChange={(v) => onChangeStyle({ iconSize: v ? Math.max(16, Math.min(96, Number(v))) : 32 })}
          />

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
        </div>
      ) : isImage && !current.fullScreen ? (
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
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <FieldLabel>Width (% of screen) — drag the box's corners on the phone works too</FieldLabel>
              <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{Math.round(current.width || 88)}%</span>
            </div>
            <input
              type="range" min={20} max={96} value={current.width || 88}
              onChange={(e) => onChangeStyle({ width: Number(e.target.value) })}
              className="w-full" style={{ accentColor: GOLD }}
            />
          </div>

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

          <div className="mt-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
            <FieldLabel>Bold</FieldLabel>
            <SegmentedToggle
              value={current.fontWeight === 700 ? "on" : "off"}
              onChange={(v) => onChangeStyle({ fontWeight: v === "on" ? 700 : null })}
              options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }]}
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg p-3" style={{ background: INK_2 }}>
            <FieldLabel>Italic</FieldLabel>
            <SegmentedToggle
              value={current.italic ? "on" : "off"}
              onChange={(v) => onChangeStyle({ italic: v === "on" })}
              options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }]}
            />
          </div>

          <div className="mt-3 rounded-lg p-3" style={{ background: INK_2 }}>
            <div className="flex items-center justify-between">
              <FieldLabel>Glow</FieldLabel>
              <SegmentedToggle
                value={current.glow ? "on" : "off"}
                onChange={(v) => onChangeStyle({ glow: v === "on" ? (current.glowColor || "#F4C95D") : null })}
                options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }]}
              />
            </div>
            {current.glow && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Glow color</span>
                  <input
                    type="color" value={current.glow}
                    onChange={(e) => onChangeStyle({ glow: e.target.value })}
                    className="h-7 w-10 cursor-pointer rounded" style={{ border: `1px solid ${INK_3}`, background: "transparent" }}
                  />
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Glow transparency</span>
                    <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{current.glowTransparency ?? 0}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={current.glowTransparency ?? 0}
                    onChange={(e) => onChangeStyle({ glowTransparency: Number(e.target.value) })}
                    className="w-full" style={{ accentColor: GOLD }}
                  />
                </div>
              </>
            )}
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
        {!isImage && !isLine && <GhostButton onClick={() => onChangeStyle({ fontFamily: null, color: null, fontSize: null, fontWeight: null, italic: null, glow: null, glowTransparency: null })}>Reset style</GhostButton>}
        {(isCustom || isLocation) && (
          <GhostButton onClick={onDuplicate}>
            <Copy size={12} /> Duplicate
          </GhostButton>
        )}
        {(isCustom || isLocation) && (
          <GhostButton danger onClick={onDelete}>
            <Trash2 size={12} /> Delete
          </GhostButton>
        )}
      </div>

      {isCustom && onReorder && (
        <div className="mt-3">
          <FieldLabel>Layer order</FieldLabel>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <GhostButton onClick={() => onReorder("front")}><ChevronsUp size={12} /> Bring to front</GhostButton>
            <GhostButton onClick={() => onReorder("back")}><ChevronsDown size={12} /> Send to back</GhostButton>
            <GhostButton onClick={() => onReorder("forward")}><ChevronUp size={12} /> Bring forward</GhostButton>
            <GhostButton onClick={() => onReorder("backward")}><ChevronDown size={12} /> Send backward</GhostButton>
          </div>
        </div>
      )}
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

function CoverStep({ c, updateContent, bg, setBg, music, updateMusic, onUploadAudio, onRemoveAudio, intro, updateIntro, activeLang, onUploadIntroMedia, onRemoveIntroMedia, introMediaLibrary, isAdmin, onAddLibraryItem, onRemoveLibraryItem, onPickLibraryItem }) {
  const introMedia = intro.media[activeLang];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput value={c.name1} onChange={(v) => updateContent({ name1: v })} placeholder="Elena" />
        </div>
        <div>
          <FieldLabel>Second name (optional)</FieldLabel>
          <TextInput value={c.name2} onChange={(v) => updateContent({ name2: v })} placeholder="Marcus" />
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Icon behind names (optional)</FieldLabel>
        <FamilyIconPicker
          value={c.coverHeartIcon === undefined ? "heart" : c.coverHeartIcon}
          onChange={(v) => updateContent({ coverHeartIcon: v })}
        />
      </div>

      <div className="mt-4">
        <FieldLabel>Symbol between names</FieldLabel>
        <div className="flex items-center gap-2">
          <TextInput
            value={c.coverAmpersand === null ? "" : (c.coverAmpersand ?? "&")}
            onChange={(v) => updateContent({ coverAmpersand: v })}
            placeholder="&"
            disabled={c.coverAmpersand === null}
          />
          <button
            onClick={() => updateContent({ coverAmpersand: c.coverAmpersand === null ? "&" : null })}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-[11px]"
            style={{ border: `1px solid rgba(147,166,155,0.35)`, color: c.coverAmpersand === null ? GOLD_SOFT : MUTED, fontFamily: FONT_BODY }}
          >
            {c.coverAmpersand === null ? "Show it" : "Hide it"}
          </button>
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
        <FieldLabel>Transition speed</FieldLabel>
        <p className="mb-2 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          How long the tap-to-start reveal takes before the invitation opens.
        </p>
        <div className="flex gap-2">
          {REVEAL_SPEED_MS.map(({ key, label, ms }) => (
            <button
              key={key}
              onClick={() => updateIntro({ revealHoldMs: ms })}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{
                background: (intro.revealHoldMs ?? 700) === ms ? GOLD : INK_3,
                color: (intro.revealHoldMs ?? 700) === ms ? INK : MUTED,
                border: `1px solid ${(intro.revealHoldMs ?? 700) === ms ? GOLD : "rgba(147,166,155,0.3)"}`,
                fontFamily: FONT_BODY,
              }}
            >
              {label}
            </button>
          ))}
        </div>
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

      <div className="mt-5">
        <FieldLabel>Choose from the shared background library ({LANG_META[activeLang].short})</FieldLabel>
        <p className="mb-2 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          {isAdmin ? "Add photos or videos here once and every client can pick one for their own intro." : "Pick a background the team has provided, or use your own upload above instead."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(introMediaLibrary || []).map((item) => {
            const picked = intro.introMediaChoiceId === item.id;
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => onPickLibraryItem(picked ? null : item)}
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg"
                  style={{
                    border: picked ? `2px solid ${GOLD}` : `2px solid rgba(147,166,155,0.3)`,
                    background: item.type === "image" ? `url(${item.url}) center/cover` : INK_3,
                  }}
                >
                  {item.type === "video" && <Film size={16} style={{ color: GOLD_SOFT }} />}
                  {picked && (
                    <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: GOLD }}>
                      <Check size={10} color={INK} />
                    </div>
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onRemoveLibraryItem(item.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: INK, border: `1px solid rgba(226,155,155,0.6)` }}
                    title="Remove from library"
                  >
                    <X size={10} color="#E29B9B" />
                  </button>
                )}
              </div>
            );
          })}
          {isAdmin && (
            <GhostUploadButton accept="image/*,video/*" onChange={onAddLibraryItem}>
              <Plus size={13} /> Add option
            </GhostUploadButton>
          )}
          {!isAdmin && (introMediaLibrary || []).length === 0 && (
            <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No options added yet.</span>
          )}
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
            <FieldLabel>Title color (optional)</FieldLabel>
            <SwatchColorPicker value={c.side1TitleColor} onChange={(v) => updateContent({ side1TitleColor: v })} />
          </div>
          <div className="mt-3">
            <FieldLabel>Names</FieldLabel>
            <TextInput value={c.side1Names} onChange={(v) => updateContent({ side1Names: v })} />
          </div>
          <div className="mt-3">
            <FieldLabel>Names color (optional)</FieldLabel>
            <SwatchColorPicker value={c.side1NamesColor} onChange={(v) => updateContent({ side1NamesColor: v })} />
          </div>
        </div>
        <div>
          <FieldLabel>Side two title</FieldLabel>
          <TextInput value={c.side2Title} onChange={(v) => updateContent({ side2Title: v })} />
          <div className="mt-3">
            <FieldLabel>Title color (optional)</FieldLabel>
            <SwatchColorPicker value={c.side2TitleColor} onChange={(v) => updateContent({ side2TitleColor: v })} />
          </div>
          <div className="mt-3">
            <FieldLabel>Names</FieldLabel>
            <TextInput value={c.side2Names} onChange={(v) => updateContent({ side2Names: v })} />
          </div>
          <div className="mt-3">
            <FieldLabel>Names color (optional)</FieldLabel>
            <SwatchColorPicker value={c.side2NamesColor} onChange={(v) => updateContent({ side2NamesColor: v })} />
          </div>
        </div>
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

// A tiny swatch picker for a single optional color override — used where a
// full style panel would be overkill (per-side title/name colors that
// share a position with their counterpart, so styling them independently
// through the canvas selection isn't possible).
function SwatchColorPicker({ value, onChange }) {
  const swatches = ["#F4EDE4", "#C9A44C", "#B76E6E", "#24463D", "#93A69B", "#FBF1E7"];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        title="Use default"
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ border: `1.5px solid ${!value ? GOLD : "rgba(147,166,155,0.35)"}`, color: !value ? GOLD_SOFT : MUTED }}
      >
        <X size={11} />
      </button>
      {swatches.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          className="h-7 w-7 rounded-full"
          style={{ background: c, border: value === c ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.4)" }}
        />
      ))}
    </div>
  );
}

function FamilyIconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        title="None"
        className="flex h-8 w-8 items-center justify-center rounded-md text-[10px]"
        style={{ border: `1.5px solid ${!value ? GOLD : "rgba(147,166,155,0.35)"}`, color: !value ? GOLD_SOFT : MUTED, fontFamily: FONT_BODY }}
      >
        <X size={13} />
      </button>
      {Object.entries(DECORATIVE_ICONS).map(([key, { name, icon: Icon }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={name}
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ border: `1.5px solid ${value === key ? GOLD : "rgba(147,166,155,0.35)"}`, color: value === key ? GOLD_SOFT : MUTED }}
        >
          <Icon size={14} />
        </button>
      ))}
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
  const duplicateItem = (id) => {
    const index = items.findIndex((it) => it.id === id);
    if (index === -1) return;
    const clone = { ...items[index], id: uid() };
    const next = [...items];
    next.splice(index + 1, 0, clone);
    update(next);
  };

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-3" style={{ background: INK_3 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <TextInput value={item.title[activeLang] || ""} onChange={(v) => setTitle(item.id, v)} placeholder={`Venue title (${LANG_META[activeLang].short})`} />
              </div>
              <button onClick={() => duplicateItem(item.id)} title="Duplicate" style={{ color: GOLD_SOFT }}>
                <Copy size={15} />
              </button>
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

// Shared registry (a ref to a Map, provided once per phone canvas) that every
// mounted DraggableBlock on the current slide publishes its own {x, y} center
// into. Lets alignment guides snap to OTHER elements' centers — and to the
// midpoint between two of them — not just the page's own dead-center.
const BlockPositionsContext = createContext(null);

function DraggableBlock({ id, pos, editMode, onMove, onScale, onResizeWidth, editableText, onTextEdit, label, light, children, selected, onSelect, noMaxWidth, widthPercent, maxHeightPercent, isEmpty, layerIndex, onDragStateChange }) {
  const ref = useRef(null);
  const draggingRef = useRef(false);
  const [isDraggingNow, setIsDraggingNow] = useState(false);
  const resizingRef = useRef(null); // { startDist, startScale } while a resize drag is in progress
  const [isEditingText, setIsEditingText] = useState(false);
  const textRef = useRef(null);
  // Canva-style alignment guides — the exact position (percent, not just a
  // boolean) the block is currently snapped to on each axis, so the guide
  // line can be drawn there. Snap targets are the page's own dead-center,
  // every OTHER block's center on this slide, and the midpoint between any
  // two of them — not just the screen's center.
  const [snapGuide, setSnapGuide] = useState({ x: null, y: null });
  const positionsRegistry = useContext(BlockPositionsContext);

  useEffect(() => {
    if (!positionsRegistry) return;
    positionsRegistry.current.set(id, { x: pos.x, y: pos.y });
    return () => { positionsRegistry.current.delete(id); };
  }, [positionsRegistry, id, pos.x, pos.y]);

  const SNAP_THRESHOLD = 2.5; // percent — how close to a snap target before it snaps and shows the guide
  // Once a block is sitting exactly on a snap target (page center, another
  // block's center, a midpoint between two blocks), ordinary cursor jitter
  // while dragging keeps landing back inside SNAP_THRESHOLD of that SAME
  // target every frame, so it just re-snaps to itself. A slightly wider
  // "release" threshold than the "engage" one absorbs that jitter without
  // re-triggering the snap. IMPORTANT: while the raw cursor is within this
  // band, the block's position is pinned to the STICKY value, not the raw
  // cursor — that's the whole point (ignore small jitter) but it also means
  // this band is a genuine dead zone where the block stops tracking the
  // cursor at all. 6 (a first attempt) turned out to be that dead zone on a
  // crowded slide where a small deliberate nudge often never traveled far
  // enough to escape it, reading as the block being stuck in place no
  // matter how much was dragged. Kept just barely above SNAP_THRESHOLD so
  // it still absorbs same-frame jitter (which is sub-percent) without
  // swallowing an intentional drag.
  const SNAP_RELEASE_THRESHOLD = 3.2;
  const stickyXRef = useRef(null);
  const stickyYRef = useRef(null);
  // A crowded slide (several icon/line/text/location blocks stacked down a
  // hand-built timeline) packs in a LOT of snap candidates — every block's
  // own position plus every pairwise midpoint between them — so a single
  // long drag sweeping down the page runs a gauntlet of "magnetic" zones
  // one after another, each needing its own small fight to escape even with
  // the release-threshold fix above. Real design tools sidestep this by
  // only snapping once the cursor has actually slowed down (fine
  // positioning), not while it's still sweeping across the canvas — so a
  // fast, deliberate drag glides straight through every candidate it
  // passes, and snapping only kicks back in once the cursor settles near
  // wherever it's actually headed.
  const FAST_MOVE_THRESHOLD = 1.5; // percent moved since the last computed frame (frames are now coalesced to one per animation frame, so this is roughly a percent-per-16ms speed)
  const lastRawRef = useRef(null);

  // Picks the candidate value closest to `val` within SNAP_THRESHOLD, or null.
  const closestSnap = (val, candidates) => {
    let best = null, bestDist = SNAP_THRESHOLD;
    for (const c of candidates) {
      const d = Math.abs(val - c);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  };

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

    const others = positionsRegistry
      ? [...positionsRegistry.current.entries()].filter(([oid]) => oid !== id).map(([, p]) => p)
      : [];
    const otherXs = others.map((p) => p.x).filter((v) => v != null);
    const otherYs = others.map((p) => p.y).filter((v) => v != null);
    const midpoints = (vals) => {
      const mids = [];
      for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) mids.push((vals[i] + vals[j]) / 2);
      return mids;
    };
    const candidatesX = [50, ...otherXs, ...midpoints(otherXs)];
    const candidatesY = [50, ...otherYs, ...midpoints(otherYs)];

    const prevRaw = lastRawRef.current;
    const movingFast = prevRaw != null && Math.hypot(x - prevRaw.x, y - prevRaw.y) > FAST_MOVE_THRESHOLD;
    lastRawRef.current = { x, y };

    let snapXVal = null, snapYVal = null;
    if (!movingFast) {
      snapXVal = stickyXRef.current != null && Math.abs(x - stickyXRef.current) < SNAP_RELEASE_THRESHOLD
        ? stickyXRef.current
        : closestSnap(x, candidatesX);
      snapYVal = stickyYRef.current != null && Math.abs(y - stickyYRef.current) < SNAP_RELEASE_THRESHOLD
        ? stickyYRef.current
        : closestSnap(y, candidatesY);
    }
    stickyXRef.current = snapXVal;
    stickyYRef.current = snapYVal;
    if (snapXVal != null) x = snapXVal;
    if (snapYVal != null) y = snapYVal;
    setSnapGuide({ x: snapXVal, y: snapYVal });

    return { x, y };
  };

  // Mouse / stylus via Pointer Events.
  const downPointRef = useRef(null); // { x, y, offsetX, offsetY } where the pointer went down — a simple click/select shouldn't move the block at all, only a real drag past a small threshold should
  const MOVE_THRESHOLD = 4; // px

  // Grabbing a block anywhere other than dead-center used to snap its CENTER
  // to the cursor the instant a drag started — computeFromPoint always
  // treated the raw cursor position as the block's new center, so clicking
  // near a tall image's top edge and dragging made the whole image jump
  // down to recenter under the cursor before it had moved at all. Capturing
  // the pointer's offset from the block's actual current center here, and
  // subtracting it in every subsequent move, keeps the block glued to where
  // it was grabbed instead of teleporting to the cursor.
  const dragOffsetFromCenter = (clientX, clientY) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return { offsetX: 0, offsetY: 0 };
    return { offsetX: clientX - (rect.left + rect.width / 2), offsetY: clientY - (rect.top + rect.height / 2) };
  };

  const handleDown = (e) => {
    if (!editMode || e.pointerType === "touch" || isEditingText) return;
    e.stopPropagation();
    // Without this, the browser can still kick off its own native text
    // selection/drag on mousedown — invisible most of the time since
    // user-select: none on this block usually pre-empts it, but any
    // pre-existing selection (e.g. left over from a prior contentEditable
    // session, or right after a click on another control like Duplicate)
    // wins the race and the browser shows its own "can't drop here" cursor
    // for the rest of the drag instead of ours, even though our own
    // pointer-move handling keeps running underneath it. The resize handle
    // below already does this; the main drag never did.
    e.preventDefault();
    onSelect?.();
    draggingRef.current = true;
    downPointRef.current = { x: e.clientX, y: e.clientY, ...dragOffsetFromCenter(e.clientX, e.clientY) };
    stickyXRef.current = null;
    stickyYRef.current = null;
    lastRawRef.current = null;
    setIsDraggingNow(true);
    onDragStateChange?.(true);
    e.target.setPointerCapture?.(e.pointerId);
  };
  // computeFromPoint scans every OTHER registered block's position on the
  // slide and every pairwise midpoint between them (for the alignment
  // guides), which is O(n²) in block count — on a crowded page (a
  // hand-built timeline with several icon/line/text blocks per entry) that
  // adds up to real work. Pointer/touch move events can fire far faster
  // than the screen actually repaints (well over 60Hz on some mice/trackpads),
  // so doing that full recompute — plus the state update it triggers — on
  // every single one made dragging visibly laggy on a busy slide. Coalescing
  // to at most once per animation frame keeps the drag exactly as
  // responsive as the screen can actually show, without doing the same work
  // many times over for frames that never even get painted.
  const dragRafRef = useRef(null);
  const pendingMoveRef = useRef(null);
  const flushPendingMove = () => {
    dragRafRef.current = null;
    const ev = pendingMoveRef.current;
    pendingMoveRef.current = null;
    if (!ev || !draggingRef.current) return;
    const d = downPointRef.current;
    const next = computeFromPoint(ev.clientX - (d?.offsetX || 0), ev.clientY - (d?.offsetY || 0));
    // onMoveRef (declared below) rather than the onMove prop directly — this
    // is called from a requestAnimationFrame callback that can fire after
    // the touch-drag effect further down last closed over it, so it needs
    // the always-current value, not a copy from whichever render scheduled it.
    if (next) onMoveRef.current(next);
  };
  const handleMove = (e) => {
    if (!editMode || !draggingRef.current || e.pointerType === "touch") return;
    const d = downPointRef.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < MOVE_THRESHOLD) return; // hasn't moved enough yet to count as an actual drag
    pendingMoveRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (dragRafRef.current == null) dragRafRef.current = requestAnimationFrame(flushPendingMove);
  };
  const handleUp = (e) => {
    if (e.pointerType === "touch") return;
    if (dragRafRef.current != null) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null; }
    pendingMoveRef.current = null;
    setSnapGuide({ x: null, y: null }); // guides only show WHILE actively dragging, not once released
    draggingRef.current = false;
    downPointRef.current = null;
    setIsDraggingNow(false);
    onDragStateChange?.(false);
    e.target.releasePointerCapture?.(e.pointerId);
  };

  // Resize handle. Two modes, opt-in per usage so every existing
  // DraggableBlock without either prop behaves exactly as before:
  //   - onScale (icons, lines): drags from the block's own center, so
  //     distance from center to the pointer maps to a uniform scale factor —
  //     these have no natural "reflow", so growing them just enlarges them.
  //   - onResizeWidth (text blocks): drags horizontally only, resizing the
  //     block's width as a percent of the card — text re-wraps into that
  //     width at its existing font size, Canva-style, instead of the whole
  //     block visually stretching.
  const handleResizeDown = (e) => {
    if (!editMode || (!onScale && !onResizeWidth)) return;
    e.stopPropagation();
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    if (onResizeWidth) {
      const startDistX = Math.max(Math.abs(e.clientX - centerX), 1);
      resizingRef.current = { mode: "width", centerX, startDistX, startWidthPercent: widthPercent || 88 };
    } else {
      const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      resizingRef.current = { mode: "scale", centerX, centerY, startDist, startScale: pos.scale || 1 };
    }
    e.target.setPointerCapture?.(e.pointerId);
  };
  const handleResizeMove = (e) => {
    const r = resizingRef.current;
    if (!r) return;
    if (r.mode === "width") {
      const distX = Math.abs(e.clientX - r.centerX);
      const ratio = distX / r.startDistX;
      const newWidthPercent = Math.min(96, Math.max(20, r.startWidthPercent * ratio)); // clamp so a text box can't be resized down to unreadable or wider than the card
      onResizeWidth(newWidthPercent);
    } else {
      const dist = Math.hypot(e.clientX - r.centerX, e.clientY - r.centerY);
      const ratio = dist / Math.max(r.startDist, 1);
      const newScale = Math.min(2.5, Math.max(0.5, r.startScale * ratio)); // clamp so a block can't be resized into being invisible or absurdly huge
      onScale(newScale);
    }
  };
  const handleResizeUp = (e) => {
    resizingRef.current = null;
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
      if (isEditingText) return;
      e.stopPropagation();
      onSelectRef.current?.();
      draggingRef.current = true;
      const t0 = e.touches[0];
      downPointRef.current = t0 ? { x: t0.clientX, y: t0.clientY, ...dragOffsetFromCenter(t0.clientX, t0.clientY) } : null;
      stickyXRef.current = null;
      stickyYRef.current = null;
      lastRawRef.current = null;
      setIsDraggingNow(true);
      onDragStateChange?.(true);
    };
    const onMoveTouch = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const d = downPointRef.current;
      if (d && Math.hypot(t.clientX - d.x, t.clientY - d.y) < MOVE_THRESHOLD) return;
      // Same rAF coalescing as the mouse path above — touchmove can fire
      // just as fast as pointermove, and the same O(n²) snap-candidate scan
      // on every single event is what made dragging laggy on a busy slide.
      pendingMoveRef.current = { clientX: t.clientX, clientY: t.clientY };
      if (dragRafRef.current == null) dragRafRef.current = requestAnimationFrame(flushPendingMove);
    };
    const onEnd = () => {
      if (dragRafRef.current != null) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null; }
      pendingMoveRef.current = null;
      draggingRef.current = false; downPointRef.current = null; setIsDraggingNow(false); onDragStateChange?.(false); setSnapGuide({ x: null, y: null });
    };
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
  }, [editMode, isEditingText]);

  // Inline text editing — double-click/tap while selected enters edit mode.
  // Only active when onTextEdit is provided (opt-in), since not every block
  // wraps plain editable text (the RSVP buttons or a timeline list, for
  // example, aren't a single string to edit this way).
  const startEditingText = () => {
    if (!editMode || !onTextEdit) return;
    setIsEditingText(true);
  };
  useEffect(() => {
    if (isEditingText && textRef.current) {
      textRef.current.focus();
      // Place the cursor at the end rather than selecting/resetting to the start.
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditingText]);
  const finishEditingText = () => {
    setIsEditingText(false);
    if (textRef.current) onTextEdit(textRef.current.textContent || "");
  };

  // Clamped here (not just during dragging) so an already-saved position from
  // before this safe zone existed is corrected automatically the moment it's
  // displayed — this is what actually fixes old saved data, not just future
  // drags. 88 keeps any block clear of the swipe-up hint's zone at the bottom.
  const safeY = Math.min(pos.y, 88);
  // Stale `scale` from before a block switched to width-based resizing (or
  // simply never had onScale wired up) should never apply — only read it
  // when this block is actually in scale mode.
  const scale = onScale ? (pos.scale || 1) : 1;
  const isTrulyEmpty = isEmpty !== undefined ? isEmpty : (onTextEdit ? !(editableText && editableText.trim()) : false);

  return (
    <div
      ref={ref}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onDoubleClick={startEditingText}
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${safeY}%`,
        transform: "translate(-50%, -50%)",
        // The edit-mode-only padding below is meant purely as extra grab
        // area — but with box-sizing: border-box and a percentage width,
        // it was eating directly into the box's own content size, so a
        // percentage-sized block (images especially) visibly shrank by 8px
        // the instant edit mode turned on and grew back the instant it
        // turned off. That's what read as the block "zooming" every time
        // "Position text" was toggled. Compensating the box's own
        // dimensions by the same 8px keeps the rendered content size
        // identical in and out of edit mode; the padding then only adds
        // outward hit-area, which is all it was ever meant to do.
        width: widthPercent ? (editMode ? `calc(${widthPercent}% + 8px)` : `${widthPercent}%`) : undefined,
        maxHeight: maxHeightPercent ? (editMode ? `calc(${maxHeightPercent}% + 8px)` : `${maxHeightPercent}%`) : undefined,
        boxSizing: "border-box",
        maxWidth: noMaxWidth ? "none" : "88%",
        cursor: editMode ? (isEditingText ? "text" : "grab") : "default",
        touchAction: editMode ? "none" : "auto",
        outline: editMode && selected && !isTrulyEmpty && !isDraggingNow ? `2px solid ${GOLD}` : "none",
        outlineOffset: 6,
        borderRadius: 10,
        padding: editMode ? 4 : 0,
        userSelect: editMode && !isEditingText ? "none" : "auto",
        zIndex: layerIndex !== undefined ? 30 + layerIndex : editMode ? (selected ? 31 : 30) : 1,
      }}
    >
      {editMode && selected && !isTrulyEmpty && !isDraggingNow && (
        <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-semibold" style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}>
          <Move size={8} /> {label}{onTextEdit ? " · double-tap to edit text" : ""}
        </div>
      )}
      <div style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: "center" }}>
        {isEditingText ? (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={finishEditingText}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); finishEditingText(); } if (e.key === "Escape") { e.preventDefault(); setIsEditingText(false); } }}
            style={{ outline: "none" }}
          >
            {editableText}
          </div>
        ) : (
          children
        )}
      </div>
      {editMode && selected && (onScale || onResizeWidth) && !isTrulyEmpty && !isDraggingNow && (
        <>
          {[
            { bottom: -5, right: -5, cursor: onResizeWidth ? "ew-resize" : "nwse-resize" },
            { bottom: -5, left: -5, cursor: onResizeWidth ? "ew-resize" : "nesw-resize" },
            { top: -5, right: -5, cursor: onResizeWidth ? "ew-resize" : "nesw-resize" },
            { top: -5, left: -5, cursor: onResizeWidth ? "ew-resize" : "nwse-resize" },
          ].map((posStyle, i) => (
            <div
              key={i}
              onPointerDown={handleResizeDown}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeUp}
              className="absolute"
              style={{
                ...posStyle,
                width: 10, height: 10,
                background: "#FFFFFF",
                border: `1.5px solid ${GOLD}`,
                borderRadius: 2,
                touchAction: "none", zIndex: 32,
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
              title="Drag to resize"
            />
          ))}
        </>
      )}
      {ref.current?.parentElement && (snapGuide.x != null || snapGuide.y != null) && createPortal(
        <>
          {snapGuide.x != null && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${snapGuide.x}%`,
                top: 0,
                width: 1,
                height: "100%",
                transform: "translateX(-0.5px)",
                background: "repeating-linear-gradient(to bottom, #FF3D8A 0, #FF3D8A 6px, transparent 6px, transparent 11px)",
                boxShadow: "0 0 4px rgba(255,61,138,0.6)",
                zIndex: 200,
              }}
            />
          )}
          {snapGuide.y != null && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: 0,
                top: `${snapGuide.y}%`,
                width: "100%",
                height: 1,
                transform: "translateY(-0.5px)",
                background: "repeating-linear-gradient(to right, #FF3D8A 0, #FF3D8A 6px, transparent 6px, transparent 11px)",
                boxShadow: "0 0 4px rgba(255,61,138,0.6)",
                zIndex: 200,
              }}
            />
          )}
        </>,
        ref.current.parentElement
      )}
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

function CustomTextBlock({ block, light, editMode, selected, onSelect, onMove, onDelete, onDuplicate, layerIndex }) {
  const [editingText, setEditingText] = useState(false);
  const [draft, setDraft] = useState(block.text || "");
  const editRef = useRef(null);

  useEffect(() => {
    if (!editingText || !editRef.current) return;
    const el = editRef.current;
    el.focus();
    // Place the cursor at the end of the existing text, rather than the
    // start — matches what people expect when re-opening a text box to
    // keep editing it.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editingText]);

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

  const [isDragging, setIsDragging] = useState(false);

  const toolbar = editMode && selected && !isDragging && (
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
      ) : block.type === "icon" ? (
        <>
          <button onClick={() => bump("iconSize", -4, 16, 96, 32)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.iconSize || 32}px</span>
          <button onClick={() => bump("iconSize", 4, 16, 96, 32)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
          {["#F4EDE4", "#C9A44C", "#B76E6E", "#24463D", "#93A69B"].map((c) => (
            <button
              key={c}
              onClick={() => onMove({ color: c })}
              className="h-4 w-4 rounded-full"
              style={{ background: c, border: block.color === c ? `1.5px solid ${GOLD}` : "1px solid rgba(255,255,255,0.4)" }}
              title={c}
            />
          ))}
        </>
      ) : block.type === "video" ? (
        <>
          <button onClick={() => bump("width", -5, 10, 100, 55)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.width || 55}%</span>
          <button onClick={() => bump("width", 5, 10, 100, 55)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
          <button onClick={() => onMove({ width: 100, x: 50 })} title="Fill the full screen width" className="px-1 text-[9.5px] font-bold uppercase" style={{ color: GOLD_SOFT }}>Fill</button>
        </>
      ) : block.type === "line" ? (
        <>
          <button onClick={() => bump("length", -10, 20, 300, 100)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.length || 100}px</span>
          <button onClick={() => bump("length", 10, 20, 300, 100)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
          <button onClick={() => bump("thickness", -1, 1, 12, 2)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.thickness || 2}px</span>
          <button onClick={() => bump("thickness", 1, 1, 12, 2)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
        </>
      ) : block.type === "divider" ? (
        <>
          <button onClick={() => bump("width", -5, 10, 100, 40)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>−</button>
          <span className="text-[10px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{block.width || 40}%</span>
          <button onClick={() => bump("width", 5, 10, 100, 40)} className="px-1 text-[13px] font-bold" style={{ color: IVORY }}>+</button>
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
      <button onClick={onDuplicate} title="Duplicate" style={{ color: GOLD_SOFT }}><Copy size={11} /></button>
      <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)" }} />
      <button onClick={onDelete} title="Delete" style={{ color: "#E29B9B" }}><Trash2 size={12} /></button>
    </div>
  );

  if (block.type === "image") {
    const imgOpacity = 1 - (block.transparency ?? 0) / 100;
    const img = (
      <img
        src={block.url}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 8, opacity: imgOpacity }}
      />
    );
    // Without this, a link typed as "instagram.com/xxx" (no protocol) gets
    // treated by the browser as a relative path off the CURRENT invitation
    // URL instead of an external site — which looks exactly like "tapping
    // the image does nothing", since it silently navigates to a broken
    // internal path rather than the intended external link.
    const normalizedLinkUrl = block.linkUrl && !/^([a-z][a-z0-9+.-]*:)/i.test(block.linkUrl.trim())
      ? `https://${block.linkUrl.trim()}`
      : block.linkUrl?.trim();
    if (block.fullScreen) {
      return (
        <>
          <div
            style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", background: "transparent" }}
            onClick={editMode ? (e) => { e.stopPropagation(); onSelect?.(); } : undefined}
          >
            <img
              src={block.url}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", display: "block", objectFit: block.noCrop ? "contain" : "cover", pointerEvents: editMode ? "auto" : "none", opacity: imgOpacity }}
            />
          </div>
          {editMode && (
            <div className="absolute left-1/2 top-16 -translate-x-1/2" style={{ zIndex: 500 }} onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
              {toolbar}
            </div>
          )}
        </>
      );
    }
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom image" light={light} selected={selected} onSelect={onSelect} noMaxWidth widthPercent={block.width || 40} maxHeightPercent={PHONE_IMAGE_MAX_HEIGHT_PCT} layerIndex={layerIndex} onDragStateChange={setIsDragging}>
        {toolbar}
        {!editMode && normalizedLinkUrl ? (
          <a href={normalizedLinkUrl} target="_blank" rel="noreferrer">{img}</a>
        ) : (
          img
        )}
      </DraggableBlock>
    );
  }
  if (block.type === "video") {
    if (block.fullScreen) {
      return (
        <>
          <div
            style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", background: "transparent" }}
            onClick={editMode ? (e) => { e.stopPropagation(); onSelect?.(); } : undefined}
          >
            <video
              src={block.url}
              controls={false}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: block.noCrop ? "contain" : "cover", pointerEvents: "none" }}
            />
          </div>
          {editMode && (
            <div className="absolute left-1/2 top-16 -translate-x-1/2" style={{ zIndex: 500 }} onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
              {toolbar}
            </div>
          )}
        </>
      );
    }
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom video" light={light} selected={selected} onSelect={onSelect} noMaxWidth widthPercent={block.width || 55} maxHeightPercent={PHONE_IMAGE_MAX_HEIGHT_PCT} layerIndex={layerIndex} onDragStateChange={setIsDragging}>
        {toolbar}
        <video
          src={block.url}
          controls={editMode}
          autoPlay={!editMode}
          muted={!editMode}
          loop={!editMode}
          playsInline
          style={{ width: "100%", aspectRatio: "9 / 16", objectFit: "cover", display: "block", borderRadius: 8 }}
        />
      </DraggableBlock>
    );
  }
  if (block.type === "icon") {
    const Icon = DECORATIVE_ICONS[block.icon]?.icon || Sparkles;
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y, scale: block.scale }} editMode={editMode} onMove={onMove} onScale={(scale) => onMove({ scale })} label="Icon" light={light} selected={selected} onSelect={onSelect} noMaxWidth layerIndex={layerIndex} onDragStateChange={setIsDragging}>
        {toolbar}
        <Icon size={block.iconSize || 32} color={block.color || (light ? PAPER : EMERALD)} />
      </DraggableBlock>
    );
  }
  if (block.type === "line") {
    const lineColor = block.color || (light ? PAPER : EMERALD);
    const isVertical = block.orientation === "vertical";
    const scale = block.scale || 1;
    const length = (block.length || 100) * scale;
    const thickness = Math.max(1, (block.thickness || 2) * scale);
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} onScale={(s) => onMove({ scale: s })} label="Line" light={light} selected={selected} onSelect={onSelect} noMaxWidth layerIndex={layerIndex} onDragStateChange={setIsDragging}>
        {toolbar}
        <div style={{ width: isVertical ? thickness : length, height: isVertical ? length : thickness, background: lineColor }} />
      </DraggableBlock>
    );
  }
  if (block.type === "divider") {
    const dividerColor = block.color || (light ? "rgba(244,237,228,0.55)" : "rgba(201,164,76,0.55)");
    const isVertical = block.orientation === "vertical";
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Divider" light={light} selected={selected} onSelect={onSelect} noMaxWidth layerIndex={layerIndex} onDragStateChange={setIsDragging}>
        {toolbar}
        {isVertical ? (
          <div style={{ width: 1, height: `${(block.width || 40) * 4}px`, background: `linear-gradient(to bottom, transparent, ${dividerColor}, transparent)` }} />
        ) : (
          <div className="flex items-center gap-2" style={{ width: `${(block.width || 40) * 3}px` }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${dividerColor})` }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: dividerColor, flexShrink: 0 }} />
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${dividerColor})` }} />
          </div>
        )}
      </DraggableBlock>
    );
  }
  return (
    <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} onResizeWidth={(w) => onMove({ width: w })} widthPercent={block.width || 29} noMaxWidth label="Custom text" light={light} selected={selected} onSelect={onSelect} layerIndex={layerIndex} onDragStateChange={setIsDragging}>
      {toolbar}
      {editingText ? (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setDraft(e.currentTarget.textContent || "")}
          onBlur={commitText}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); } }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-center outline-none"
          style={{
            display: "inline-block",
            minWidth: 20,
            maxWidth: "none",
            whiteSpace: "pre-wrap",
            fontFamily: block.fontFamily || FONT_BODY,
            color: block.color || (light ? PAPER : EMERALD),
            fontSize: `${block.fontSize || 16}px`,
            fontWeight: block.fontWeight || 400,
            fontStyle: block.italic ? "italic" : "normal",
            textShadow: glowTextShadow(block.glow, block.glowTransparency),
            lineHeight: 1.4,
            background: "rgba(0,0,0,0.25)",
            borderRadius: 6,
            padding: "2px 6px",
          }}
        >
          {block.text || ""}
        </div>
      ) : (
        <p
          className="text-center"
          onDoubleClick={(e) => {
            // Editing directly via a double-click, in addition to the
            // toolbar's pencil button. This used to trigger on a plain
            // second click once the block was already selected, but that's
            // indistinguishable from the click that starts a drag — every
            // attempt to drag an already-selected block instead dropped it
            // into text-edit mode, whose contentEditable div deliberately
            // stops pointerdown from propagating (so placing a text cursor
            // doesn't also start dragging), which silently broke dragging
            // entirely for a selected block. A double-click is unambiguous.
            if (!editMode) return;
            e.stopPropagation();
            setDraft(block.text || "");
            setEditingText(true);
          }}
          style={{
            whiteSpace: "pre-wrap",
            // No cursor override here — a single click no longer enters edit
            // mode (only a double-click does, see above), so hinting "text"
            // the moment the block is selected was misleading: it showed an
            // I-beam caret cursor instead of the grab/drag cursor the outer
            // DraggableBlock already sets, right while the block was being
            // dragged. Let that cursor show through instead.
            fontFamily: block.fontFamily || (light ? FONT_BODY : FONT_BODY),
            color: block.color || (light ? PAPER : EMERALD),
            fontSize: `${block.fontSize || 16}px`,
            fontWeight: block.fontWeight || 400,
            fontStyle: block.italic ? "italic" : "normal",
            textShadow: glowTextShadow(block.glow, block.glowTransparency),
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
  // backdropColor sits BEHIND the image in the CSS background shorthand —
  // this is what actually fixes a transparent PNG (like a Canva export
  // with no background) showing as blank/white: without an explicit
  // color here, transparent areas show whatever's behind this element,
  // which is nothing by default. Defaults to INK (this app's own dark
  // background) if the page hasn't set one.
  const background = isPhoto ? (hasActiveCustomImage(bg) ? `${bg.backdropColor || INK} url(${bg.image}) center/cover` : BG_PRESETS[bg.preset].css) : PAPER;
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

function CoverSlide({ content, bg, fontDisplay, fontScript, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, rsvpSchedule }) {
  const namesStyle = layout.names;
  const introStyle = layout.intro;
  const dateStyle = layout.date || { x: 50, y: 88 };
  const formattedDate = rsvpSchedule?.date
    ? new Date(`${rsvpSchedule.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";
  // Both default to their original always-on behavior (a heart, the "&"
  // symbol) so nothing changes for an invitation that hasn't touched these
  // new settings — content.coverHeartIcon === undefined still shows the
  // heart; only an explicit null (picked via the new "None" option) hides it.
  const HeartIconComp = content.coverHeartIcon === null ? null : (DECORATIVE_ICONS[content.coverHeartIcon]?.icon || Heart);
  const ampersandText = content.coverAmpersand === null ? null : (content.coverAmpersand || "&");
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="names" pos={namesStyle} editMode={editMode} onMove={(p) => onMoveBlock("names", p)} onResizeWidth={(w) => onMoveBlock("names", { width: w })} widthPercent={namesStyle.width || 88} noMaxWidth label="Names" light={light} selected={selectedBlock === "names"} onSelect={() => onSelectBlock("names")} isEmpty={!content.name1 && !content.name2}>
            <div className="relative text-center">
              {/* Large icon with a soft glow behind the names — optional,
                  and choosable (not forced to a heart specifically). CSS
                  drop-shadow layered twice (tight + wide) gives a genuine
                  glow rather than a flat, hard-edged shadow. */}
              {HeartIconComp && (
                <HeartIconComp
                  size={110}
                  fill={light ? "rgba(244,237,228,0.14)" : "rgba(183,110,110,0.14)"}
                  color={light ? "rgba(244,237,228,0.35)" : "rgba(183,110,110,0.35)"}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ filter: `drop-shadow(0 0 14px ${light ? "rgba(244,237,228,0.55)" : "rgba(183,110,110,0.55)"}) drop-shadow(0 0 34px ${light ? "rgba(244,237,228,0.35)" : "rgba(183,110,110,0.35)"})`, zIndex: 0 }}
                />
              )}
              <div className="relative flex flex-col items-center" style={{ fontSize: namesStyle.fontSize ? `${namesStyle.fontSize}px` : 40, zIndex: 1 }}>
                <div style={{ fontFamily: namesStyle.name1FontFamily || namesStyle.fontFamily || fontScript, color: namesStyle.color || (light ? PAPER : EMERALD), fontWeight: namesStyle.fontWeight || 400, fontStyle: namesStyle.italic ? "italic" : "normal", textShadow: glowTextShadow(namesStyle.glow, namesStyle.glowTransparency), lineHeight: 1.3 }}>
                  {content.name1 || ""}
                </div>
                {content.name2 ? (
                  <>
                    {ampersandText && (
                      <div style={{ margin: "0.35em 0", fontSize: "0.55em", lineHeight: 1.3, fontFamily: namesStyle.ampersandFontFamily || namesStyle.fontFamily || fontScript, color: light ? GOLD_SOFT : ROSE }}>
                        {ampersandText}
                      </div>
                    )}
                    <div style={{ marginTop: ampersandText ? 0 : "0.35em", fontFamily: namesStyle.name2FontFamily || namesStyle.fontFamily || fontScript, color: namesStyle.color || (light ? PAPER : EMERALD), fontWeight: namesStyle.fontWeight || 400, fontStyle: namesStyle.italic ? "italic" : "normal", textShadow: glowTextShadow(namesStyle.glow, namesStyle.glowTransparency), lineHeight: 1.3 }}>
                      {content.name2}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </DraggableBlock>
          <DraggableBlock id="intro" pos={introStyle} editMode={editMode} onMove={(p) => onMoveBlock("intro", p)} onResizeWidth={(w) => onMoveBlock("intro", { width: w })} widthPercent={introStyle.width || 85} noMaxWidth label="Intro" light={light} selected={selectedBlock === "intro"} onSelect={() => onSelectBlock("intro")} isEmpty={!content.intro}>
            <p className="text-center italic leading-relaxed" style={{ color: introStyle.color || (light ? "rgba(244,237,228,0.85)" : EMERALD), fontFamily: introStyle.fontFamily || fontDisplay, fontSize: introStyle.fontSize ? `${introStyle.fontSize}px` : 12.5 }}>
              {content.intro}
            </p>
          </DraggableBlock>
          {formattedDate && (
            <DraggableBlock id="date" pos={dateStyle} editMode={editMode} onMove={(p) => onMoveBlock("date", p)} onResizeWidth={(w) => onMoveBlock("date", { width: w })} widthPercent={dateStyle.width || 70} noMaxWidth label="Date" light={light} selected={selectedBlock === "date"} onSelect={() => onSelectBlock("date")}>
              <p className="text-center" style={{ color: dateStyle.color || (light ? GOLD_SOFT : ROSE), fontFamily: dateStyle.fontFamily || FONT_BODY, fontSize: dateStyle.fontSize ? `${dateStyle.fontSize}px` : 12 }}>
                {formattedDate}
              </p>
            </DraggableBlock>
          )}
        </div>
      )}
    </StoryPage>
  );
}

function FamilySlide({ content, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const gs = layout.greeting, qs = layout.quote, ts = layout.titles, ns = layout.names;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="greeting" pos={gs} editMode={editMode} onMove={(p) => onMoveBlock("greeting", p)} label="Greeting" light={light} selected={selectedBlock === "greeting"} onSelect={() => onSelectBlock("greeting")} isEmpty={!content.greeting}>
            <div className="text-center">
              <p style={{ fontFamily: gs.fontFamily || fontDisplay, fontStyle: "italic", fontSize: gs.fontSize ? `${gs.fontSize}px` : 16, color: gs.color || (light ? PAPER : EMERALD), lineHeight: 1.5 }}>{content.greeting}</p>
            </div>
          </DraggableBlock>
          <DraggableBlock id="quote" pos={qs} editMode={editMode} onMove={(p) => onMoveBlock("quote", p)} label="Quote" light={light} selected={selectedBlock === "quote"} onSelect={() => onSelectBlock("quote")} isEmpty={!content.quote}>
            <p className="text-center italic" style={{ color: qs.color || (light ? GOLD_SOFT : ROSE), fontFamily: qs.fontFamily || fontDisplay, fontSize: qs.fontSize ? `${qs.fontSize}px` : 12 }}>
              {content.quote ? `“${content.quote}”` : ""}
            </p>
          </DraggableBlock>
          <DraggableBlock id="titles" pos={ts} editMode={editMode} onMove={(p) => onMoveBlock("titles", p)} onResizeWidth={(w) => onMoveBlock("titles", { width: w })} widthPercent={ts.width || 75} noMaxWidth label="Side titles" light={light} selected={selectedBlock === "titles"} onSelect={() => onSelectBlock("titles")}>
            <div className="grid grid-cols-2 gap-4" style={{ width: "100%" }}>
              {[{ title: content.side1Title, icon: content.side1Icon, color: content.side1TitleColor }, { title: content.side2Title, icon: content.side2Icon, color: content.side2TitleColor }].map((side, i) => {
                const SideIcon = DECORATIVE_ICONS[side.icon]?.icon;
                const sideColor = side.color || ts.color || (light ? GOLD_SOFT : ROSE);
                return (
                  <div key={i} className="flex flex-col items-center gap-1 text-center">
                    {SideIcon && <SideIcon size={14} style={{ color: sideColor }} />}
                    <div className="text-[9.5px] font-semibold uppercase" style={{ color: sideColor, letterSpacing: "0.1em", fontFamily: ts.fontFamily || FONT_BODY, fontSize: ts.fontSize ? `${ts.fontSize}px` : undefined }}>{side.title}</div>
                  </div>
                );
              })}
            </div>
          </DraggableBlock>
          <DraggableBlock id="names" pos={ns} editMode={editMode} onMove={(p) => onMoveBlock("names", p)} onResizeWidth={(w) => onMoveBlock("names", { width: w })} widthPercent={ns.width || 75} noMaxWidth label="Family names" light={light} selected={selectedBlock === "names"} onSelect={() => onSelectBlock("names")} isEmpty={!content.side1Names && !content.side2Names}>
            <div className="grid grid-cols-2 gap-4" style={{ width: "100%" }}>
              {[{ names: content.side1Names, color: content.side1NamesColor }, { names: content.side2Names, color: content.side2NamesColor }].map((side, i) => (
                <div key={i} className="text-center">
                  <div style={{ color: side.color || ns.color || (light ? PAPER : EMERALD), fontFamily: ns.fontFamily || fontDisplay, fontSize: ns.fontSize ? `${ns.fontSize}px` : 13 }}>{side.names}</div>
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
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center font-semibold uppercase" style={{ color: hs.color || (light ? GOLD_SOFT : ROSE), letterSpacing: "0.15em", fontFamily: hs.fontFamily || FONT_BODY, fontSize: hs.fontSize ? `${hs.fontSize}px` : 10, opacity: hs.hidden ? 0 : 1 }}>{t.orderOfDay}</div>
          </DraggableBlock>
          )}
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

function LocationsSlide({ items, lang, bg, fontDisplay, t, layout, editMode, onMoveBlock, onMoveLocation, selectedBlock, onSelectBlock }) {
  const hs = layout.heading, ls = layout.list;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center font-semibold uppercase" style={{ color: hs.color || (light ? GOLD_SOFT : ROSE), letterSpacing: "0.15em", fontFamily: hs.fontFamily || FONT_BODY, fontSize: hs.fontSize ? `${hs.fontSize}px` : 10, opacity: hs.hidden ? 0 : 1 }}>{t.celebration}</div>
          </DraggableBlock>
          )}
          {/* Each location is its own independently draggable block — they
              used to all live inside one shared "list" block, positioned via
              a plain vertical stack, so moving one moved every location
              together and a newly added one could only ever land glued
              right after the previous one. Position is per-item; color,
              font, card background, and the Get Directions button's styling
              stay shared across every location via the "list" layout entry
              (see the selection handling in InvitationBuilder). */}
          {items.map((loc, index) => {
            const pos = { x: loc.x ?? (50 + (index % 4) * 8), y: loc.y ?? Math.min(88, 30 + index * 16) };
            const blockId = `loc:${loc.id}`;
            return (
              <DraggableBlock
                key={loc.id}
                id={blockId}
                pos={pos}
                editMode={editMode}
                onMove={(p) => onMoveLocation(loc.id, p)}
                label="Location"
                light={light}
                selected={selectedBlock === blockId}
                onSelect={() => onSelectBlock(blockId)}
              >
                <div className="rounded-xl p-3" style={{ background: light ? `rgba(255,255,255,${(ls.cardOpacity ?? 12) / 100})` : PAPER_2, backdropFilter: light && (ls.cardOpacity ?? 12) > 0 ? "blur(3px)" : "none" }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium" style={{ color: ls.color || (light ? PAPER : EMERALD), fontFamily: ls.fontFamily || fontDisplay, fontSize: ls.fontSize ? `${ls.fontSize}px` : 13 }}>{loc.title[lang] || loc.title.en}</div>
                    <span className="text-[10.5px]" style={{ color: light ? GOLD_SOFT : ROSE, fontFamily: FONT_BODY }}>{loc.time}</span>
                  </div>
                  {loc.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                      target="_blank" rel="noreferrer"
                      onClick={(e) => { if (editMode) e.preventDefault(); }}
                      className="mt-2 inline-flex items-center gap-1 rounded-full font-semibold"
                      style={{
                        background: hexToRgba(ls.directionsColor || (light ? GOLD : EMERALD), 1 - (ls.directionsTransparency ?? 0) / 100),
                        color: ls.directionsTextColor || (light ? INK : PAPER),
                        fontFamily: FONT_BODY,
                        fontSize: `${ls.directionsFontSize || 10}px`,
                        padding: `${(ls.directionsFontSize || 10) * 0.4}px ${ls.directionsFontSize || 10}px`,
                      }}
                    >
                      <Navigation2 size={(ls.directionsFontSize || 10)} /> {ls.directionsLabel || t.directions}
                    </a>
                  )}
                </div>
              </DraggableBlock>
            );
          })}
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
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ opacity: hs.hidden ? 0 : 1 }}>
              <div className="text-[10px] font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY }}>{t.countingDownTo}</div>
              <div style={{ fontFamily: hs.fontFamily || fontScript, fontSize: hs.fontSize ? `${hs.fontSize}px` : 26, color: hs.color || (light ? PAPER : EMERALD), margin: "4px 0 4px" }}>{t.celebrationWord}</div>
              {formattedDate && <div className="text-[10.5px]" style={{ color: light ? "rgba(244,237,228,0.75)" : ROSE, fontFamily: FONT_BODY }}>{formattedDate}</div>}
            </div>
          </DraggableBlock>
          )}
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

function VoiceMessageRecorder({ rsvpStatus, guestName, slug, guestGroupId, onDone, onSkip, light }) {
  const [status, setStatus] = useState("idle"); // idle | recording | recorded | uploading | sent | error
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioBlobRef = useRef(null);
  const MAX_SECONDS = 90; // keeps recordings small — same size-conscious reasoning as the other media limits already in this app

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : (MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "");
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((t) => t.stop()); // release the mic once we're done with it
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setSeconds(0);
      setStatus("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Couldn't access your microphone — please allow microphone access and try again.");
    }
  };

  const reRecord = () => {
    setAudioUrl(null);
    audioBlobRef.current = null;
    setStatus("idle");
    setSeconds(0);
    setError("");
  };

  const send = () => {
    if (!audioBlobRef.current) return;
    setStatus("uploading");
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await submitVoiceMessage(slug, { guestGroupId, guestName, rsvpStatus, audioData: reader.result, mimeType: audioBlobRef.current.type, durationSeconds: seconds });
        setStatus("sent");
        setTimeout(() => onDone(), 1200);
      } catch (err) {
        setError(err.message);
        setStatus("recorded");
      }
    };
    reader.onerror = () => { setError("Couldn't process the recording — please try again."); setStatus("recorded"); };
    reader.readAsDataURL(audioBlobRef.current);
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const heading = rsvpStatus === "yes" ? "Leave a Message" : "We'll Miss You";
  const subtitle = rsvpStatus === "yes"
    ? "Record a short congratulations or well-wishes — they'll love hearing your voice."
    : "Record a quick note so they know you're thinking of them.";
  const accentColor = light ? GOLD_SOFT : EMERALD;

  return (
    <div className="text-center" style={{ width: 220 }}>
      <Mic size={22} color={accentColor} style={{ margin: "0 auto 6px" }} />
      <p style={{ color: light ? PAPER : EMERALD, fontWeight: 600, fontSize: 13, fontFamily: FONT_BODY }}>{heading}</p>
      <p className="mt-1 text-[10.5px]" style={{ color: light ? "rgba(244,237,228,0.75)" : "rgba(36,70,61,0.7)", fontFamily: FONT_BODY, lineHeight: 1.5 }}>{subtitle}</p>

      <div className="mt-4">
        {status === "idle" && (
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase"
            style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.08em", fontFamily: FONT_BODY }}
          >
            <Mic size={13} /> Record
          </button>
        )}

        {status === "recording" && (
          <>
            <p className="text-[11px]" style={{ color: accentColor, fontFamily: FONT_BODY, animation: "musicPulse 1.6s ease-in-out infinite" }}>
              ● {fmtTime(seconds)} / {fmtTime(MAX_SECONDS)}
            </p>
            <button
              onClick={stopRecording}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase"
              style={{ background: "#C05B5B", color: PAPER, letterSpacing: "0.08em", fontFamily: FONT_BODY }}
            >
              Stop
            </button>
          </>
        )}

        {(status === "recorded" || status === "uploading" || status === "sent") && audioUrl && (
          <div>
            <audio src={audioUrl} controls style={{ width: "100%", height: 32 }} />
            {status === "recorded" && (
              <div className="mt-3 flex justify-center gap-2">
                <button onClick={reRecord} className="rounded-full px-3.5 py-2 text-[10.5px] font-semibold" style={{ background: "rgba(120,120,120,0.2)", color: light ? PAPER : EMERALD, fontFamily: FONT_BODY }}>
                  Record Again
                </button>
                <button onClick={send} className="rounded-full px-3.5 py-2 text-[10.5px] font-bold uppercase" style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.06em", fontFamily: FONT_BODY }}>
                  Send
                </button>
              </div>
            )}
            {status === "uploading" && <p className="mt-2 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Sending…</p>}
            {status === "sent" && <p className="mt-2 text-[10.5px]" style={{ color: "#8FBFA3", fontFamily: FONT_BODY }}>Sent ✓</p>}
          </div>
        )}

        {error && <p className="mt-2 text-[10px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}

        {status !== "uploading" && status !== "sent" && (
          <button onClick={onSkip} className="mt-3 block w-full text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function RsvpSlide({ content, bg, fontDisplay, fontScript, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, rsvpSettings, totalAttending, onSubmitRsvp, siteDomain, slug, prefilledGuestName, onUpdateContent }) {
  const hs = layout.heading, bs = layout.buttons;
  const style = rsvpSettings.style || "classic";
  const [choice, setChoice] = useState(null);
  const [name, setName] = useState(prefilledGuestName || "");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [checkinToken, setCheckinToken] = useState(null);
  const [voiceMessageStage, setVoiceMessageStage] = useState("recording"); // recording | done — shown after a submitted RSVP, before the final thank-you

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
          {(!hs.hidden || editMode) && (
          <DraggableBlock
            id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)}
            onResizeWidth={(w) => onMoveBlock("heading", { width: w })} widthPercent={hs.width || 80} noMaxWidth
            editableText={content.heading || "RSVP"}
            onTextEdit={(text) => onUpdateContent({ heading: text })}
            label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}
          >
            <div style={{ opacity: hs.hidden ? 0 : 1 }}>
            {style === "stacked" ? (
              <p className="text-center" style={{ fontFamily: hs.fontFamily || fontScript, fontSize: hs.fontSize ? `${hs.fontSize}px` : 28, color: hs.color || (light ? PAPER : EMERALD) }}>
                {content.heading || "RSVP"}
              </p>
            ) : (
              <div className="text-center">
                <div className="font-semibold" style={{ fontFamily: hs.fontFamily || fontDisplay, fontSize: hs.fontSize ? `${hs.fontSize}px` : 22, color: hs.color || (light ? PAPER : EMERALD) }}>{content.heading || "RSVP"}</div>
                <div className="mx-auto my-1.5 h-px w-10" style={{ background: light ? GOLD_SOFT : GOLD }} />
                <p className="italic" style={{ fontFamily: fontDisplay, fontSize: 12, color: light ? "rgba(244,237,228,0.85)" : ROSE }}>{t.rsvpHeading}</p>
              </div>
            )}
            </div>
          </DraggableBlock>
          )}

          <DraggableBlock id="buttons" pos={bs} editMode={editMode} onMove={(p) => onMoveBlock("buttons", p)} label="RSVP form" light={light} selected={selectedBlock === "buttons"} onSelect={() => onSelectBlock("buttons")}>
            <div style={{ width: 230 }}>
              {submitted ? (
                voiceMessageStage === "recording" && choice === "no" && rsvpSettings.enableGuestVoiceRecorder ? (
                  <VoiceMessageRecorder
                    rsvpStatus={choice}
                    guestName={name.trim() || "Guest"}
                    slug={slug}
                    guestGroupId={null}
                    light={light}
                    onDone={() => setVoiceMessageStage("done")}
                    onSkip={() => setVoiceMessageStage("done")}
                  />
                ) : (
                  thankYou(light)
                )
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
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 230, opacity: hs.hidden ? 0 : 1 }}>
              <div className="font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY, fontSize: 10 }}>{t.giftRegistry}</div>
              <p className="mt-1.5 text-[11px] italic" style={{ color: light ? "rgba(244,237,228,0.8)" : EMERALD, fontFamily: fontDisplay }}>{t.registryIntro}</p>
            </div>
          </DraggableBlock>
          )}
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
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 220, opacity: hs.hidden ? 0 : 1 }}>
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
          )}
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
          {(!hs.hidden || editMode) && (
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 220, opacity: hs.hidden ? 0 : 1 }}>
              <Music2 size={26} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 10px" }} />
              <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 18, color: light ? PAPER : EMERALD }}>{heading}</div>
              <p className="mt-1.5 text-[11.5px]" style={{ color: light ? "rgba(244,237,228,0.8)" : ROSE, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{subtitle}</p>
            </div>
          </DraggableBlock>
          )}
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
                  onClick={() => setSession({ status: "error", error: "Credit card payment isn't set up yet — a Stripe account needs to be connected first." })}
                  disabled={starting}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11.5px] font-bold uppercase"
                  style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER, letterSpacing: "0.1em", fontFamily: FONT_BODY, opacity: starting ? 0.7 : 1 }}
                >
                  <Lock size={11} /> Pay by Credit Card{price ? ` — ${price}` : ""}
                </button>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: light ? "rgba(244,237,228,0.25)" : "rgba(147,166,155,0.3)" }} />
                  <span className="text-[9px]" style={{ color: light ? "rgba(244,237,228,0.5)" : MUTED, fontFamily: FONT_BODY }}>TEMPORARY — remove before going live</span>
                  <div className="h-px flex-1" style={{ background: light ? "rgba(244,237,228,0.25)" : "rgba(147,166,155,0.3)" }} />
                </div>
                <button
                  onClick={() => setSession({ status: "authorized", embedUrl: url })}
                  className="mt-2 rounded-full px-4 py-1.5 text-[10.5px] font-semibold"
                  style={{ border: `1px dashed ${light ? "rgba(244,237,228,0.4)" : "rgba(147,166,155,0.4)"}`, color: light ? "rgba(244,237,228,0.7)" : MUTED, fontFamily: FONT_BODY }}
                >
                  Skip payment — unlock stream directly (testing only)
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
function WaxSealGate({ tapText, design, customMedia, videoRef, started, revealing }) {
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
              onPlay={(e) => {
                // `started` only flips true at the END of the tap-to-reveal hold
                // (see revealHoldMs) — checking it alone here re-paused the video
                // the instant the tap handler's own play() call made it start,
                // since that happens well before `started` becomes true. `revealing`
                // (gateClosing) is what's actually true from the moment of the tap.
                if (!started && !revealing) { e.currentTarget.pause(); return; }
                e.currentTarget.playbackRate = GATE_VIDEO_PLAYBACK_RATE;
              }}
              onPause={(e) => { if (started || revealing) e.currentTarget.play().catch(() => {}); }} // only auto-resume once the gate has actually been tapped
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                // Same reasoning as the button-style gate: a GIF can't be paused
                // once it's a live CSS background, so show its static posterUrl
                // (generated at upload time) until the tap actually starts the
                // reveal, then switch to the real animated GIF.
                background: `url(${customMedia.posterUrl && !revealing ? customMedia.posterUrl : customMedia.url}) center/cover, ${INK}`,
              }}
            />
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

function PhonePreview({ data, steps, activeIndex, onNavigate, lang, layoutEditMode, onMoveBlock, started, onStart, selectedBlockId, onSelectBlock, onMoveCustomBlock, onRemoveCustomBlock, onDuplicateCustomBlock, onMoveLocation, onSubmitRsvp, fullscreen, slug, siteDomain, prefilledGuestName, onUpdateRsvpContent, swipeDirection = "vertical", transitionStyle = "slide" }) {
  const [playing, setPlaying] = useState(false);
  const cardRef = useRef(null);
  const [fsScale, setFsScale] = useState(1);
  const [fsViewportHeight, setFsViewportHeight] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 700));
  const [fsIsNarrow, setFsIsNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 420 : true));

  useEffect(() => {
    // Preloads every page's background photo as soon as the invitation
    // loads, so swiping to a page later never has to wait on that image —
    // it's already decoded and sitting in the browser's cache. Without
    // this, an image that hasn't loaded yet shows the fallback backdrop
    // color first and then pops in once it finishes loading, which reads
    // as a jarring flash during the swipe transition.
    Object.values(data.pageBackgrounds || {}).forEach((bg) => {
      if (bg?.mode === "photo" && bg.image) {
        const img = new Image();
        img.src = bg.image;
      }
    });
  }, [data.pageBackgrounds]);

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
    // 292 is the fixed design width every layout/font size in this app was
    // built against. Scale is deliberately based on WIDTH ONLY, and only
    // reacts to width changes — a mobile browser's address bar showing or
    // hiding changes the available HEIGHT, never the width, so tying scale
    // to width alone guarantees it can never jump/reflow from that specific
    // interaction. Any vertical mismatch between the 600px-tall design and
    // the real device's height is handled by the container's overflow:hidden
    // plus the content being centered, not by reacting to height here.
    const update = () => setFsScale(el.offsetWidth / 292);
    update();
    const ro = new ResizeObserver((entries) => {
      // Only recompute if the width actually changed — ResizeObserver also
      // fires on height-only changes, which is exactly what we're avoiding.
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w !== el.dataset.lastWidth) {
          el.dataset.lastWidth = w;
          update();
        }
      }
    });
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
  // Admin-adjustable via the "Transition speed" control in CoverStep — how
  // long the tap-to-start reveal holds before the invitation actually opens.
  // Applies uniformly regardless of gate style or background media type.
  const revealHoldMs = data.intro.revealHoldMs ?? 700;

  // Kept in sync so the async play()/pause() priming below (whose promise can
  // resolve after a render or two) can check the CURRENT started state rather
  // than the one captured in its own closure when it started.
  const startedRef = useRef(started);
  useEffect(() => { startedRef.current = started; }, [started]);

  // The gate video must stay frozen on tap-to-start — it must never actually
  // play on its own before the user taps. But some mobile browsers (notably
  // iOS Safari) render nothing at all for a <video> — a blank/black box, not
  // its first frame — until playback has been triggered at least once,
  // regardless of preload. So rather than just pausing it, briefly play then
  // immediately pause (both silent and effectively instant, since it's
  // muted) to force that first frame to actually decode and be visible
  // as the gate's background before the real tap.
  useEffect(() => {
    const v = gateVideoRef.current;
    if (!v || started) return;
    v.muted = true;
    const playPromise = v.play();
    if (playPromise?.then) {
      playPromise.then(() => { if (!startedRef.current) v.pause(); }).catch(() => {});
    } else {
      v.pause();
    }
  }, [started, introMedia?.url]);

  const t = PREVIEW_T[lang];
  const dir = LANG_META[lang].dir;
  const fontDisplay = lang === "ar" ? FONT_AR : lang === "hy" ? FONT_HY : FONT_DISPLAY;
  const fontScript = lang === "ar" ? FONT_AR : lang === "hy" ? FONT_HY : FONT_SCRIPT;
  const stepKey = steps[activeIndex].key;
  // Whether the CURRENT active page needs light text (dark/photo background)
  // or dark text (light/paper background) — same "photo mode = light text"
  // convention every other page element in this app already uses. Drives
  // both the bottom scrim and the swipe-hint/action-icon colors below.
  const currentPageIsLight = data.pageBackgrounds[stepKey]?.mode === "photo";

  const goDir = (d) => {
    if (layoutEditMode) return;
    const next = Math.min(steps.length - 1, Math.max(0, activeIndex + d));
    if (next !== activeIndex) { setDirection(d); onNavigate(next); }
  };

  const isHorizontal = swipeDirection === "horizontal";
  const onTouchStart = (e) => { if (!layoutEditMode && started) touchStartRef.current = isHorizontal ? e.touches[0].clientX : e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (layoutEditMode || !started || touchStartRef.current == null) return;
    const delta = (isHorizontal ? e.changedTouches[0].clientX : e.changedTouches[0].clientY) - touchStartRef.current;
    touchStartRef.current = null;
    if (delta < -40) goDir(1); else if (delta > 40) goDir(-1);
  };
  const onWheel = (e) => {
    if (layoutEditMode || !started || wheelLockRef.current) return;
    const delta = isHorizontal ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 15) return;
    wheelLockRef.current = true;
    goDir(delta > 0 ? 1 : -1);
    setTimeout(() => (wheelLockRef.current = false), 550);
  };

  const layout = data.layouts[lang]?.[stepKey];
  const moveBlock = (blockId, pos) => onMoveBlock(stepKey, blockId, pos);
  const customBlocks = data.customBlocks[lang]?.[stepKey] || [];
  // "Send to back"/"Bring to front" need to cross the page's own structural
  // content (titles, icons, the timeline list, etc.), not just reorder among
  // other custom blocks — so behindContent-flagged blocks render in their own
  // pass BEFORE renderSlide() below, and everything else renders AFTER it,
  // in the same relative order they'd have had in one flat list.
  const behindCustomBlocks = customBlocks.filter((b) => b.behindContent);
  const frontCustomBlocks = customBlocks.filter((b) => !b.behindContent);

  // Canva-style rubber-band multi-select: drag a rectangle across empty
  // canvas space to select every block whose position falls inside it, then
  // drag any of them to move the whole group together by the same delta.
  // Scoped to this component (not persisted) — it's a builder-session
  // selection, not invitation data.
  const canvasRef = useRef(null);
  const [marquee, setMarquee] = useState(null); // {x1,y1,x2,y2} in % of the canvas, only while actively dragging
  const [groupSelectedIds, setGroupSelectedIds] = useState([]); // block ids ("names", "custom:<id>", ...) currently multi-selected
  const marqueeDownRef = useRef(null);
  const groupDragRef = useRef(null);
  // Every DraggableBlock on the current slide publishes its own {x, y}
  // center into this map (see BlockPositionsContext) so alignment guides
  // can snap to each other's centers, not just the page's dead-center.
  const blockPositionsRef = useRef(new Map());

  const onCanvasPointerDown = (e) => {
    // DraggableBlock's own handleDown calls stopPropagation, so reaching
    // here usually means the pointerdown landed on bare canvas, not on a
    // block. But a handful of things inside the canvas aren't
    // DraggableBlocks and don't stop propagation either — the "tap to
    // start" gate button chief among them — so without this check,
    // starting the marquee-select gesture (and capturing the pointer on
    // the canvas) on every such click hijacked their own click handling,
    // e.g. silently breaking the gate's tap-to-reveal while positioning.
    if (e.target.closest?.("button")) return;
    if (!layoutEditMode || e.pointerType === "touch") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    marqueeDownRef.current = { x, y, rect, moved: false };
    setGroupSelectedIds([]);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onCanvasPointerMove = (e) => {
    const d = marqueeDownRef.current;
    if (!d) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - d.rect.left) / d.rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - d.rect.top) / d.rect.height) * 100));
    if (Math.abs(x - d.x) > 1 || Math.abs(y - d.y) > 1) d.moved = true;
    if (d.moved) setMarquee({ x1: Math.min(d.x, x), y1: Math.min(d.y, y), x2: Math.max(d.x, x), y2: Math.max(d.y, y) });
  };
  const onCanvasPointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const d = marqueeDownRef.current;
    if (d?.moved && marquee) {
      const hits = [];
      Object.entries(layout || {}).forEach(([id, pos]) => {
        if (pos?.x == null || pos?.y == null) return;
        if (pos.x >= marquee.x1 && pos.x <= marquee.x2 && pos.y >= marquee.y1 && pos.y <= marquee.y2) hits.push(id);
      });
      customBlocks.forEach((b) => {
        if (b.x >= marquee.x1 && b.x <= marquee.x2 && b.y >= marquee.y1 && b.y <= marquee.y2) hits.push(`custom:${b.id}`);
      });
      // Each location is its own independently positioned block (see
      // LocationsSlide) but wasn't wired into the marquee at all, so
      // rubber-band selecting a group of "Get Directions" buttons alongside
      // other blocks silently skipped every one of them.
      if (stepKey === "locations") {
        (data.locations || []).forEach((loc) => {
          const x = loc.x ?? 50, y = loc.y ?? 50;
          if (x >= marquee.x1 && x <= marquee.x2 && y >= marquee.y1 && y <= marquee.y2) hits.push(`loc:${loc.id}`);
        });
      }
      if (hits.length > 1) { setGroupSelectedIds(hits); onSelectBlock(null); }
    }
    marqueeDownRef.current = null;
    setMarquee(null);
  };

  const groupPositionOf = (id) =>
    id.startsWith("custom:")
      ? customBlocks.find((b) => `custom:${b.id}` === id)
      : id.startsWith("loc:")
        ? (data.locations || []).find((loc) => `loc:${loc.id}` === id)
        : layout?.[id];
  const groupBounds = (() => {
    if (groupSelectedIds.length < 2) return null;
    const positions = groupSelectedIds.map(groupPositionOf).filter(Boolean);
    if (positions.length < 2) return null;
    const xs = positions.map((p) => p.x), ys = positions.map((p) => p.y);
    const pad = 7;
    return {
      x1: Math.max(0, Math.min(...xs) - pad), x2: Math.min(100, Math.max(...xs) + pad),
      y1: Math.max(0, Math.min(...ys) - pad), y2: Math.min(100, Math.max(...ys) + pad),
    };
  })();
  const onGroupPointerDown = (e) => {
    e.stopPropagation();
    if (e.pointerType === "touch") return;
    const rect = canvasRef.current.getBoundingClientRect();
    groupDragRef.current = {
      clientX: e.clientX, clientY: e.clientY, width: rect.width, height: rect.height,
      positions: groupSelectedIds.map((id) => ({ ...groupPositionOf(id), id })).filter((p) => p.x != null),
    };
    console.log("[group-drag] pointerdown", { ids: groupSelectedIds, positions: groupDragRef.current.positions });
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onGroupPointerMove = (e) => {
    const d = groupDragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.clientX) / d.width) * 100;
    const dy = ((e.clientY - d.clientY) / d.height) * 100;
    console.log("[group-drag] pointermove", { dx, dy });
    d.positions.forEach(({ id, x, y }) => {
      const newX = Math.min(92, Math.max(8, x + dx));
      const newY = Math.min(88, Math.max(6, y + dy));
      if (id.startsWith("custom:")) onMoveCustomBlock(stepKey, id.slice(7), { x: newX, y: newY });
      else if (id.startsWith("loc:")) onMoveLocation(id.slice(4), { x: newX, y: newY });
      else moveBlock(id, { x: newX, y: newY });
    });
  };
  const onGroupPointerUp = (e) => {
    groupDragRef.current = null;
    e.target.releasePointerCapture?.(e.pointerId);
  };
  const deleteGroupSelection = () => {
    groupSelectedIds.filter((id) => id.startsWith("custom:")).forEach((id) => onRemoveCustomBlock(stepKey, id.slice(7)));
    setGroupSelectedIds([]);
  };
  const groupHasDeletable = groupSelectedIds.some((id) => id.startsWith("custom:"));
  // Selecting a single block directly (not via the marquee, which already
  // clears this on its own pointerdown) should drop any stale group
  // selection instead of leaving its bounding box drawn over a now-unrelated
  // selection. Same for leaving positioning mode or switching pages.
  useEffect(() => { if (selectedBlockId) setGroupSelectedIds([]); }, [selectedBlockId]);
  useEffect(() => { setGroupSelectedIds([]); }, [layoutEditMode, stepKey]);

  // A GIF can't be paused like a <video> — it animates continuously the
  // moment it's a live background, so a GIF with a posterUrl (its static
  // first frame, generated at upload time) shows that instead, right up
  // until the tap actually starts the reveal transition.
  const introMediaUrl = introMedia?.type === "image" && introMedia.posterUrl && !gateClosing ? introMedia.posterUrl : introMedia?.url;
  const gateImage = (introMedia?.type === "image" ? introMediaUrl : null) || (hasActiveCustomImage(data.pageBackgrounds.cover) ? data.pageBackgrounds.cover.image : null);
  // An opaque color as the bottom layer here matters for any uploaded image/GIF
  // with transparent regions (a common design pattern for decorative overlay
  // art) — without it, the transparent parts let whatever sits behind the gate
  // in the DOM (the cover slide's own photo and text) show straight through.
  const gateBackground = gateImage ? `url(${gateImage}) center/cover, ${INK}` : BG_PRESETS[data.pageBackgrounds.cover.preset].css;
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

  const renderSlide = (key) => {
    const layout = data.layouts[lang]?.[key] || DEFAULT_LAYOUTS[key];
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
        return <LocationsSlide items={data.locations} lang={lang} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} onMoveLocation={onMoveLocation} {...common} />;
      case "countdown":
        return <CountdownSlide schedule={data.rsvpSchedule} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} locale={LANG_META[lang].locale} layout={layout} onMoveBlock={onMove} {...common} />;
      case "rsvp":
        return <RsvpSlide content={data.content[lang].rsvp} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} layout={layout} onMoveBlock={onMove} rsvpSettings={data.rsvpSettings} totalAttending={data.totalAttending} onSubmitRsvp={onSubmitRsvp} siteDomain={siteDomain} slug={slug} prefilledGuestName={prefilledGuestName} onUpdateContent={onUpdateRsvpContent} {...common} />;
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
        @keyframes slideUpIn { from { transform: translateY(24px); } to { transform: translateY(0); } }
        @keyframes slideDownIn { from { transform: translateY(-24px); } to { transform: translateY(0); } }
        @keyframes stackIn { from { transform: scale(0.96) translateY(10px); } to { transform: scale(1) translateY(0); } }
        @keyframes bounceUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes bounceLeft { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
        @keyframes musicPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.75; } }
        @keyframes sealPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } }
        @keyframes eqBar { from { height: 3px; } to { height: 9px; } }
        @keyframes gateFloat { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-620px) rotate(25deg); opacity: 0; } }
        .pv-fullscreen-card { max-width: 420px; aspect-ratio: 292 / 600; }
        @media (max-width: 420px) {
          .pv-fullscreen-card { max-width: 100%; aspect-ratio: unset; height: 100vh; height: 100svh; }
        }
      `}</style>
    <div className={fullscreen ? "flex flex-col items-center justify-center" : "relative inline-flex flex-col items-center"} style={fullscreen ? { width: "100%", minHeight: "100dvh", background: INK } : undefined}>
      <div
        ref={cardRef}
        className={fullscreen ? "relative w-full pv-fullscreen-card" : "relative flex-shrink-0"}
        style={
          fullscreen
            ? { margin: "0 auto", background: PAPER, padding: 0, boxShadow: "none", overflow: "hidden", ...(fsIsNarrow ? { height: "100svh" } : {}) }
            : { width: 292, height: 600, background: "#000", borderRadius: 26, padding: 6, overflow: "hidden" }
        }
      >
        <div
          ref={canvasRef}
          className="relative overflow-hidden"
          style={
            fullscreen
              ? { touchAction: "none", position: "absolute", left: "50%", top: "50%", width: 292, height: 600, transform: `translate(-50%, -50%) scale(${fsScale})` }
              : { touchAction: "none", borderRadius: 20, background: PAPER, height: "100%", width: "100%" }
          }
          dir={dir} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}
          onPointerDown={onCanvasPointerDown} onPointerMove={onCanvasPointerMove} onPointerUp={onCanvasPointerUp}
        >
          {/* Samsung-style centered punch-hole camera, instead of a wide notch/Dynamic Island */}
          {!fullscreen && <div className="absolute left-1/2 top-2.5 z-30 h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }} />}

          {started && !fullscreen && (
            <div className="absolute left-3 right-3 top-4 z-20 flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.35)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: i <= activeIndex ? "100%" : "0%", background: GOLD_SOFT }} />
                </div>
              ))}
            </div>
          )}

          <div key={animKey} className="h-full w-full" style={{ animation: transitionStyle === "stack" ? "stackIn 0.55s cubic-bezier(0.22,1,0.36,1)" : `${direction > 0 ? "slideUpIn" : "slideDownIn"} 0.5s cubic-bezier(0.22,1,0.36,1)` }}>
            <BlockPositionsContext.Provider value={blockPositionsRef}>
            {started && behindCustomBlocks.length > 0 && (
              <div className="absolute inset-0">
                {behindCustomBlocks.map((block, index) => (
                  <CustomTextBlock
                    key={block.id}
                    block={block}
                    layerIndex={index}
                    light={data.pageBackgrounds[stepKey].mode === "photo"}
                    editMode={layoutEditMode}
                    selected={selectedBlockId === `custom:${block.id}`}
                    onSelect={() => onSelectBlock(`custom:${block.id}`)}
                    onMove={(p) => onMoveCustomBlock(stepKey, block.id, p)}
                    onDelete={() => onRemoveCustomBlock(stepKey, block.id)}
                    onDuplicate={() => onDuplicateCustomBlock(stepKey, block.id)}
                  />
                ))}
              </div>
            )}
            {renderSlide(stepKey)}
            {started && frontCustomBlocks.length > 0 && (
              <div className="absolute inset-0">
                {frontCustomBlocks.map((block, index) => (
                  <CustomTextBlock
                    key={block.id}
                    block={block}
                    layerIndex={index}
                    light={data.pageBackgrounds[stepKey].mode === "photo"}
                    editMode={layoutEditMode}
                    selected={selectedBlockId === `custom:${block.id}`}
                    onSelect={() => onSelectBlock(`custom:${block.id}`)}
                    onMove={(p) => onMoveCustomBlock(stepKey, block.id, p)}
                    onDelete={() => onRemoveCustomBlock(stepKey, block.id)}
                    onDuplicate={() => onDuplicateCustomBlock(stepKey, block.id)}
                  />
                ))}
              </div>
            )}
            </BlockPositionsContext.Provider>
            {marquee && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${marquee.x1}%`, top: `${marquee.y1}%`,
                  width: `${marquee.x2 - marquee.x1}%`, height: `${marquee.y2 - marquee.y1}%`,
                  background: "rgba(201,164,76,0.15)", border: `1.5px solid ${GOLD}`, zIndex: 500,
                }}
              />
            )}
            {groupBounds && (
              <div
                className="absolute"
                style={{
                  left: `${groupBounds.x1}%`, top: `${groupBounds.y1}%`,
                  width: `${groupBounds.x2 - groupBounds.x1}%`, height: `${groupBounds.y2 - groupBounds.y1}%`,
                  // Individual blocks stack at 30 + layerIndex (see DraggableBlock),
                  // which climbs past whatever z-index this had on a page with many
                  // blocks — a click meant to drag the whole group was landing on
                  // whichever block happened to render on top instead, so nothing in
                  // the group actually moved. Comfortably above any realistic block
                  // count instead of guessing a number close to the collision.
                  border: `1.5px dashed ${GOLD}`, borderRadius: 8, zIndex: 500,
                  cursor: "grab", touchAction: "none",
                }}
                onPointerDown={onGroupPointerDown} onPointerMove={onGroupPointerMove} onPointerUp={onGroupPointerUp}
              >
                <div
                  className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1"
                  style={{ bottom: "calc(100% + 8px)", background: INK, border: `1px solid ${GOLD}` }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Move size={10} color={GOLD_SOFT} />
                  <span className="text-[10px] font-semibold" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{groupSelectedIds.length} selected</span>
                  {groupHasDeletable && (
                    <button onClick={deleteGroupSelection} title="Delete the custom elements in this selection" style={{ color: "#E29B9B" }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {(!started || gateClosing) && (
            <div className="absolute inset-0 z-40 overflow-hidden">
              {data.intro.type === "seal" ? (
                <button
                  onClick={() => {
                    if (gateClosing) return;
                    if (introMedia?.type === "video" && gateVideoRef.current) {
                      gateVideoRef.current.muted = true;
                      gateVideoRef.current.playbackRate = GATE_VIDEO_PLAYBACK_RATE;
                      gateVideoRef.current.play().catch(() => {});
                    }
                    setGateClosing(true);
                    setTimeout(() => { onStart(); setGateClosing(false); }, revealHoldMs);
                  }}
                  className="absolute inset-0"
                  style={{ pointerEvents: gateClosing ? "none" : "auto", cursor: "pointer" }}
                >
                  <WaxSealGate tapText={tapText} design={data.intro.sealDesign} customMedia={introMedia} videoRef={gateVideoRef} started={started} revealing={gateClosing} />
                </button>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: gateBackground,
                    // Tapping just lets the video/photo keep playing at full
                    // visibility for the whole hold — no fading out gradually.
                    // Once revealHoldMs elapses, `started` flips true and this
                    // whole gate unmounts in one step, switching straight to the
                    // slide underneath.
                  }}
                >
                  {/* Media layer: never animated directly, so playback isn't disrupted mid-decode on lower-power phones */}
                  {introMedia?.type === "video" && (
                    <video
                      ref={gateVideoRef}
                      src={introMedia.url}
                      preload="auto"
                      muted
                      loop
                      playsInline
                      onPlay={(e) => {
                        // Extra safety net on top of the mount-time pause() effect above —
                        // if any browser-specific quirk starts playback on its own before
                        // the tap, this stops it the instant it's detected. `started` only
                        // flips true at the END of the tap-to-reveal hold (revealHoldMs), so
                        // checking it alone re-paused the video the instant the tap
                        // handler's own play() call made it start — gateClosing is what's
                        // actually true from the moment of the tap.
                        if (!started && !gateClosing) { e.currentTarget.pause(); return; }
                        e.currentTarget.playbackRate = GATE_VIDEO_PLAYBACK_RATE;
                      }}
                      onPause={(e) => { if (started || gateClosing) e.currentTarget.play().catch(() => {}); }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {data.intro.type === "animation" && <GateAnimation style={data.intro.animationStyle} />}

                  <button
                    onClick={() => {
                      if (gateClosing) return;
                      // A tap is a real user gesture, so play() here succeeds even in
                      // sandboxed/embedded contexts that silently block autoplay before
                      // any interaction — the gate stays paused until tap otherwise (see
                      // the pause effect and onPlay guard above).
                      if (introMedia?.type === "video" && gateVideoRef.current) {
                        gateVideoRef.current.muted = true;
                        gateVideoRef.current.playbackRate = GATE_VIDEO_PLAYBACK_RATE;
                        gateVideoRef.current.play().catch(() => {});
                      }
                      setGateClosing(true);
                      setTimeout(() => { onStart(); setGateClosing(false); }, revealHoldMs);
                    }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ pointerEvents: gateClosing ? "none" : "auto", cursor: "pointer" }}
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

        {/* A subtle scrim guarantees the swipe-up hint and action icons stay
            legible no matter what invitation content sits behind them — this
            works regardless of saved text positions or screen size, rather
            than depending on content never drifting into this zone.
            THE ACTUAL FIX: this used to be a single, always-dark gradient,
            which looked like an out-of-place dark smudge on light "paper"
            pages (whose own text is dark, not light, so a dark scrim never
            matched what it was sitting on). It and the swipe-hint/action-icon
            colors below now both key off the CURRENT page's own light/dark
            styling — same "photo mode = light text" convention every other
            page element already uses — so a light page gets a light scrim
            behind dark text, and a dark/photo page keeps the original dark
            scrim behind light text. */}
        {started && !layoutEditMode && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
            style={{
              height: 110,
              background: currentPageIsLight
                ? "linear-gradient(180deg, rgba(10,12,10,0) 0%, rgba(10,12,10,0.45) 55%, rgba(10,12,10,0.6) 100%)"
                : "linear-gradient(180deg, rgba(251,241,231,0) 0%, rgba(251,241,231,0.55) 55%, rgba(251,241,231,0.75) 100%)",
            }}
          />
        )}

        {/* Swipe-up hint and bottom-right action icons live OUTSIDE the scaled
            292x600 canvas on purpose — they're UI chrome, not invitation
            content, so they're positioned against the card's own real
            dimensions instead of the fixed reference canvas. This is what
            keeps them always visible regardless of how a real device's
            aspect ratio compares to 292:600, without needing to compromise
            on filling the full width. */}
        {started && (layoutEditMode ? (
          <>
            {activeIndex < steps.length - 1 && (
              <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1">
                {isHorizontal ? (
                  <ChevronsLeft size={20} color={currentPageIsLight ? PAPER : EMERALD} style={{ animation: "bounceLeft 1.4s ease-in-out infinite", filter: currentPageIsLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none" }} />
                ) : (
                  <ChevronsUp size={20} color={currentPageIsLight ? PAPER : EMERALD} style={{ animation: "bounceUp 1.4s ease-in-out infinite", filter: currentPageIsLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none" }} />
                )}
                <span className="text-[10px] font-semibold uppercase" style={{ color: currentPageIsLight ? PAPER : EMERALD, fontFamily: FONT_BODY, letterSpacing: "0.2em", textShadow: currentPageIsLight ? "0 1px 3px rgba(0,0,0,0.4)" : "none" }}>
                  {isHorizontal ? t.swipeLeft : t.swipeUp}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {activeIndex < steps.length - 1 && (
              <button onClick={() => goDir(1)} className="absolute bottom-7 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
                {isHorizontal ? (
                  <ChevronsLeft size={20} color={currentPageIsLight ? PAPER : EMERALD} style={{ animation: "bounceLeft 1.4s ease-in-out infinite", filter: currentPageIsLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none" }} />
                ) : (
                  <ChevronsUp size={20} color={currentPageIsLight ? PAPER : EMERALD} style={{ animation: "bounceUp 1.4s ease-in-out infinite", filter: currentPageIsLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none" }} />
                )}
                <span className="text-[10px] font-semibold uppercase" style={{ color: currentPageIsLight ? PAPER : EMERALD, fontFamily: FONT_BODY, letterSpacing: "0.2em", textShadow: currentPageIsLight ? "0 1px 3px rgba(0,0,0,0.4)" : "none" }}>
                  {isHorizontal ? t.swipeLeft : t.swipeUp}
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
                  style={{ background: currentPageIsLight ? "rgba(10,12,10,0.5)" : "rgba(251,241,231,0.7)", backdropFilter: "blur(4px)", opacity: action.dim ? 0.5 : 1 }}
                >
                  <action.icon size={14} color={currentPageIsLight ? PAPER : EMERALD} style={{ animation: action.pulse ? "musicPulse 1.6s ease-in-out infinite" : "none" }} />
                </button>
              ))}
            </div>
          </>
        ))}
      </div>

      {/* Samsung-style side buttons — volume rocker + power button, both on
          the right edge. True siblings of cardRef (not children), so they
          stick out past its edge without being clipped by its necessary
          overflow:hidden (needed to clip the scrim/hint/icons to its
          rounded corners). The outer wrapper now shrinks to cardRef's own
          292px width (inline-flex + relative), so right/-right positioning
          here lines up exactly with cardRef's real edges. */}
      {!fullscreen && (
        <>
          <div className="absolute -right-[3px] z-50 rounded-l-sm" style={{ top: 130, width: 3, height: 34, background: "linear-gradient(90deg, #050505 0%, #1c1c1c 55%, #050505 100%)", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.15), 1px 0 2px rgba(0,0,0,0.5)" }} />
          <div className="absolute -right-[3px] z-50 rounded-l-sm" style={{ top: 172, width: 3, height: 58, background: "linear-gradient(90deg, #050505 0%, #1c1c1c 55%, #050505 100%)", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.15), 1px 0 2px rgba(0,0,0,0.5)" }} />
        </>
      )}

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

function SettingsView({ og, setOg, autoTitle, autoDescription, slug, siteDomain, setSiteDomain, slugMatchesCoupleNames, nameBasedSlugPreview, onRegenerateSlug, swipeDirection, setSwipeDirection, transitionStyle, setTransitionStyle, integrations, updateIntegrations, isAdmin }) {
  const [copyState, setCopyState] = useState("idle"); // idle | copied | failed
  const [ogUploading, setOgUploading] = useState(false);
  const [ogUploadError, setOgUploadError] = useState("");
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgUploading(true);
    setOgUploadError("");
    try {
      const url = await uploadImageToStorage(file);
      setOg((o) => ({ ...o, image: url }));
    } catch (err) {
      setOgUploadError(err.message || "Couldn't upload the image — please try again.");
    } finally {
      setOgUploading(false);
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
      {isAdmin && (
        <>
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
        </>
      )}

      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Navigation style</h2>
      <p className="mb-4 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
        How guests move between pages of the invitation.
      </p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Swipe direction</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Which way guests swipe to move to the next page</div>
        </div>
        <SegmentedToggle
          value={swipeDirection}
          onChange={setSwipeDirection}
          options={[{ value: "vertical", label: "Swipe up" }, { value: "horizontal", label: "Swipe left" }]}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Transition style</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>How each page animates in when guests navigate</div>
        </div>
        <SegmentedToggle
          value={transitionStyle}
          onChange={setTransitionStyle}
          options={[{ value: "slide", label: "Slide (quick)" }, { value: "stack", label: "Stack (slower)" }]}
        />
      </div>

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
        <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUpload} disabled={ogUploading} />
        <div className="flex flex-col items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium" style={{ color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.35)`, fontFamily: FONT_BODY }}>
            <ImagePlus size={13} /> {ogUploading ? "Uploading…" : og.image ? "Replace image" : "Upload image"}
          </span>
          {ogUploadError && <span className="text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{ogUploadError}</span>}
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
      {!slugMatchesCoupleNames && (
        <div className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(226,155,155,0.08)", border: `1px solid rgba(226,155,155,0.25)` }}>
          <p className="text-[11.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
            This link doesn't match the couple's current names. It would become <span style={{ color: GOLD_SOFT }}>https://{siteDomain}/e/{nameBasedSlugPreview}</span> instead.
          </p>
          <p className="mt-1 text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>
            Updating breaks any link already sent to guests — only do this before sending invitations out.
          </p>
          <p className="mt-1 text-[10.5px] font-semibold" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>
            Make sure the couple's names on the Cover page are saved first — this button only updates the link itself, not the names it's based on.
          </p>
          <button
            onClick={() => { if (window.confirm("Have you already saved the couple's names on the Cover page? This button only updates the LINK — it does not save the names themselves.\n\nUpdating the link now will also break any copy already sent to guests.\n\nContinue?")) onRegenerateSlug(); }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
            style={{ color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.35)`, fontFamily: FONT_BODY }}
          >
            <Link2 size={12} /> Update link to match couple's names
          </button>
        </div>
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
          <div className="text-[13px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>Let guests record a voice message</div>
          <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Only offered to guests who select "Not Attending" — never shown when a guest confirms they're coming</div>
        </div>
        <SegmentedToggle
          value={rsvpSettings.enableGuestVoiceRecorder}
          onChange={(v) => updateRsvpSettings({ enableGuestVoiceRecorder: v })}
          options={[{ value: false, label: "Off" }, { value: true, label: "On" }]}
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

function VoiceMessagesPanel({ slug }) {
  const [messages, setMessages] = useState(null); // null = loading
  const [filter, setFilter] = useState("all"); // all | yes | no

  const load = async () => {
    const rows = await getVoiceMessages(slug);
    setMessages(rows);
  };

  useEffect(() => { load(); }, [slug]);

  if (messages === null) {
    return <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Loading…</p>;
  }

  const filtered = filter === "all" ? messages : messages.filter((m) => m.rsvp_status === filter);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <GhostButton active={filter === "all"} onClick={() => setFilter("all")}>All ({messages.length})</GhostButton>
          <GhostButton active={filter === "yes"} onClick={() => setFilter("yes")}>Attending ({messages.filter((m) => m.rsvp_status === "yes").length})</GhostButton>
          <GhostButton active={filter === "no"} onClick={() => setFilter("no")}>Not Attending ({messages.filter((m) => m.rsvp_status === "no").length})</GhostButton>
        </div>
        <GhostButton onClick={load}>Refresh</GhostButton>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No voice messages yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{m.guest_name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase"
                    style={m.rsvp_status === "yes" ? { background: "rgba(143,191,163,0.18)", color: CHART_COLORS.yes } : { background: "rgba(224,155,155,0.18)", color: "#E29B9B" }}
                  >
                    {m.rsvp_status === "yes" ? "Attending" : "Not Attending"}
                  </span>
                </div>
                <span className="text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <audio src={m.audio_data} controls style={{ width: "100%", height: 34 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Dashboard panel for the couple: approve/pending status for every guest
// who registered for Guest Networking (only approved guests are visible to
// each other — see getNetworkingDirectory), plus a read-only view of
// connections already made between guests. The couple never moderates
// connections themselves — accept/decline for those stays strictly between
// the two guests involved; this view is purely informational.
// Shown when a client tries to publish their invitation (or reach a
// feature their current package doesn't include) without having paid for
// a package tier yet — or wants to upgrade to a higher one. Building and
// editing the invitation itself is never gated by this; only making it
// real/live for guests is.
function PublishPaywallModal({ userId, invitationSlug, currentPackageTier, onClose, onConfirmed }) {
  const [selectedTier, setSelectedTier] = useState(currentPackageTier || "basic");
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");

  const startPayment = async () => {
    setPaying(true);
    setError("");
    try {
      const { paymentReference, paymentUrl } = await createPackagePaymentSession(userId, invitationSlug, selectedTier);
      window.open(paymentUrl, "_blank");
      setPolling(true);
      // Polls every 3s for up to 10 minutes — matches how long a client
      // might reasonably take to complete payment in the other tab before
      // giving up and coming back to try again.
      const start = Date.now();
      const poll = async () => {
        if (Date.now() - start > 10 * 60 * 1000) { setPolling(false); setError("Payment session expired — please try again."); return; }
        const result = await getPackageStatus(paymentReference);
        if (result?.status === "paid") {
          setPolling(false);
          onConfirmed(result.packageTier);
          return;
        }
        setTimeout(poll, 3000);
      };
      poll();
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(10,12,10,0.75)" }}>
      <div className="w-full max-w-2xl rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Publish Your Invitation</h2>
          {!polling && <button onClick={onClose} style={{ color: MUTED }}><X size={18} /></button>}
        </div>
        <p className="mb-5 text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          You can keep building and editing for free, any time. Pick a package below to make your real guest link live.
        </p>

        {polling ? (
          <div className="py-8 text-center">
            <p className="text-[13px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>Waiting for payment to complete in the other tab…</p>
            <p className="mt-2 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>This updates automatically once payment is confirmed — no need to refresh.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.entries(PACKAGE_TIERS).map(([key, tier]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTier(key)}
                  className="rounded-xl p-4 text-left"
                  style={{ background: selectedTier === key ? "rgba(201,164,76,0.1)" : INK_3, border: `2px solid ${selectedTier === key ? GOLD : "transparent"}` }}
                >
                  <div className="text-[13px] font-bold uppercase" style={{ color: selectedTier === key ? GOLD_SOFT : IVORY, fontFamily: FONT_BODY, letterSpacing: "0.05em" }}>{tier.name}</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: IVORY, fontFamily: FONT_BODY }}>${tier.price}</div>
                  <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: MUTED, fontFamily: FONT_BODY }}>{tier.tagline}</p>
                  {currentPackageTier === key && <div className="mt-2 text-[10.5px] font-semibold" style={{ color: CHART_COLORS.yes }}>Your current package</div>}
                </button>
              ))}
            </div>
            {error && <p className="mt-4 text-[12px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
            <button
              onClick={startPayment}
              disabled={paying || selectedTier === currentPackageTier}
              className="mt-5 w-full rounded-full py-3 text-sm font-bold uppercase"
              style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.05em", opacity: (paying || selectedTier === currentPackageTier) ? 0.5 : 1 }}
            >
              {paying ? "Opening payment…" : selectedTier === currentPackageTier ? "Already your package" : `Pay $${PACKAGE_TIERS[selectedTier].price} for ${PACKAGE_TIERS[selectedTier].name}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NetworkingApprovalPanel({ slug }) {
  const [guests, setGuests] = useState(null); // null = loading
  const [connections, setConnections] = useState(null);
  const [tab, setTab] = useState("guests"); // guests | connections
  const [approvingId, setApprovingId] = useState(null);

  const load = async () => {
    const [g, c] = await Promise.all([getAllNetworkingGuestsForCouple(slug), getNetworkingConnectionsForCouple(slug)]);
    setGuests(g);
    setConnections(c);
  };

  useEffect(() => { load(); }, [slug]);

  const approve = async (guestId) => {
    setApprovingId(guestId);
    await approveNetworkingGuest(guestId);
    await load();
    setApprovingId(null);
  };

  if (guests === null || connections === null) {
    return <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Loading…</p>;
  }

  const pendingCount = guests.filter((g) => !g.approved).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <GhostButton active={tab === "guests"} onClick={() => setTab("guests")}>Guests ({guests.length}){pendingCount > 0 ? ` · ${pendingCount} pending` : ""}</GhostButton>
          <GhostButton active={tab === "connections"} onClick={() => setTab("connections")}>Connections ({connections.length})</GhostButton>
        </div>
        <GhostButton onClick={load}>Refresh</GhostButton>
      </div>

      {tab === "guests" && (
        guests.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No one has registered for Guest Networking yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {guests.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: g.photo_url ? `url(${g.photo_url}) center/cover` : INK_3 }}>
                    {!g.photo_url && <Users size={14} style={{ color: MUTED }} />}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{g.name}</div>
                    {g.field && <div className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{g.field}</div>}
                  </div>
                </div>
                {g.approved ? (
                  <span className="rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase" style={{ background: "rgba(143,191,163,0.18)", color: CHART_COLORS.yes }}>Approved</span>
                ) : (
                  <button
                    onClick={() => approve(g.id)}
                    disabled={approvingId === g.id}
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, opacity: approvingId === g.id ? 0.6 : 1 }}
                  >
                    {approvingId === g.id ? "Approving…" : "Approve"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "connections" && (
        connections.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No connections made yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
                <div className="text-[13px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>
                  <span className="font-semibold">{c.from_guest?.name || "—"}</span>
                  <span style={{ color: MUTED }}> → </span>
                  <span className="font-semibold">{c.to_guest?.name || "—"}</span>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase"
                  style={
                    c.status === "accepted" ? { background: "rgba(143,191,163,0.18)", color: CHART_COLORS.yes }
                    : c.status === "declined" ? { background: "rgba(224,155,155,0.18)", color: "#E29B9B" }
                    : { background: "rgba(201,164,76,0.18)", color: GOLD_SOFT }
                  }
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function SeatingManager({ guestGroups, tables, onAddTable, onUpdateTable, onDeleteTable, onAssignGuest, venueElements, onAddVenueElement, onUpdateVenueElement, onDeleteVenueElement }) {
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [newTableShape, setNewTableShape] = useState("round");
  const [view, setView] = useState("list"); // "list" | "floorplan"

  const confirmedGroups = guestGroups.filter(groupIsConfirmed);
  const unassigned = confirmedGroups.filter((g) => !g.tableId || !tables.some((t) => t.id === g.tableId));
  const totalSeated = confirmedGroups.filter((g) => g.tableId && tables.some((t) => t.id === g.tableId)).reduce((sum, g) => sum + groupHeadcount(g), 0);
  const totalConfirmed = confirmedGroups.reduce((sum, g) => sum + groupHeadcount(g), 0);

  const submitAddTable = () => {
    onAddTable(newTableName, newTableCapacity, newTableShape);
    setNewTableName("");
    setNewTableCapacity(8);
    setNewTableShape("round");
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
          <SegmentedToggle
            value={newTableShape}
            onChange={setNewTableShape}
            options={[{ value: "round", label: "Round" }, { value: "square", label: "Square" }, { value: "long", label: "Long" }]}
          />
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

      {tables.length > 0 && (
        <div className="mb-4">
          <SegmentedToggle
            value={view}
            onChange={setView}
            options={[{ value: "list", label: "List" }, { value: "floorplan", label: "Floor Plan" }]}
          />
        </div>
      )}

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
      ) : view === "floorplan" ? (
        <FloorPlanCanvas
          tables={tables} confirmedGroups={confirmedGroups} onUpdateTable={onUpdateTable} onDeleteTable={onDeleteTable} onAssignGuest={onAssignGuest}
          venueElements={venueElements} onAddVenueElement={onAddVenueElement} onUpdateVenueElement={onUpdateVenueElement} onDeleteVenueElement={onDeleteVenueElement}
        />
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

// A visual floor plan — each table renders as its actual shape (round,
// square, or long/banquet) at a draggable x/y position. Clicking a table
// selects it and opens a side panel to assign confirmed guests to it or
// see who's already seated there.
const VENUE_ELEMENT_ICONS = { stage: Music2, danceFloor: Disc3, entrance: DoorOpen, lounge: Sofa, ac: Wind, staff: Handshake };
const VENUE_ELEMENT_DEFAULTS_LABELS = { stage: "Stage", danceFloor: "Dance Floor", entrance: "Entrance", lounge: "Lounge", ac: "A/C Unit", staff: "Staff Station" };

function FloorPlanCanvas({ tables, confirmedGroups, onUpdateTable, onDeleteTable, onAssignGuest, venueElements, onAddVenueElement, onUpdateVenueElement, onDeleteVenueElement }) {
  const [selectedId, setSelectedId] = useState(null); // "table:<id>" | "venue:<id>" | null
  const canvasRef = useRef(null);
  const dragState = useRef(null); // { kind: 'table'|'venue', id, startX, startY, origX, origY }

  const selectedKind = selectedId?.split(":")[0] || null;
  const selectedRealId = selectedId?.split(":")[1] || null;
  const selectedTable = selectedKind === "table" ? tables.find((t) => t.id === selectedRealId) : null;

  const seatedAt = (tableId) => confirmedGroups.filter((g) => g.tableId === tableId);
  const unassigned = confirmedGroups.filter((g) => !g.tableId || !tables.some((t) => t.id === g.tableId));
  const guestLabel = (g) => g.members.filter((m) => m.status === "yes").map((m) => m.name).join(", ") || g.lastName || "Guest";

  const shapeSize = (table) => {
    const scale = table.scale || 1;
    let base = table.shape === "long" ? { width: 150, height: 50 } : { width: 66, height: 66 };
    if (table.shape === "long" && table.rotation === 90) base = { width: base.height, height: base.width };
    return { width: Math.round(base.width * scale), height: Math.round(base.height * scale) };
  };

  // Positions chairs around a table's actual perimeter — evenly spaced
  // around the circle for round tables, one per side for square, and
  // split between the two long edges for a banquet table. This is what
  // makes the plan read as a real room instead of bare shapes.
  const chairPositions = (table, size) => {
    const n = Math.max(1, table.capacity);
    const gap = 14; // distance from the table's edge to each chair
    const chairs = [];
    if (table.shape === "round") {
      const radius = size.width / 2 + gap;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        chairs.push({ x: size.width / 2 + radius * Math.cos(angle) - 6, y: size.height / 2 + radius * Math.sin(angle) - 6 });
      }
    } else if (table.shape === "long") {
      const vertical = table.rotation === 90;
      const perSide = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const onFirstSide = i < perSide;
        const sideIndex = onFirstSide ? i : i - perSide;
        const sideCount = onFirstSide ? perSide : n - perSide;
        if (vertical) {
          const y = sideCount > 1 ? (sideIndex / (sideCount - 1)) * (size.height - 16) + 8 : size.height / 2;
          chairs.push({ x: onFirstSide ? -gap : size.width + gap - 12, y: y - 6 });
        } else {
          const x = sideCount > 1 ? (sideIndex / (sideCount - 1)) * (size.width - 16) + 8 : size.width / 2;
          chairs.push({ x: x - 6, y: onFirstSide ? -gap : size.height + gap - 12 });
        }
      }
    } else {
      // square — one chair per side, extra chairs beyond 4 stack along the longer sides
      const perSide = Math.max(1, Math.ceil(n / 4));
      let placed = 0;
      const sides = [
        { edge: "top", fixed: -gap, axis: "x" },
        { edge: "right", fixed: size.width + gap - 12, axis: "y" },
        { edge: "bottom", fixed: size.height + gap - 12, axis: "x" },
        { edge: "left", fixed: -gap, axis: "y" },
      ];
      for (const side of sides) {
        for (let i = 0; i < perSide && placed < n; i++, placed++) {
          const t = perSide > 1 ? (i / (perSide - 1)) * (size.width - 16) + 8 : size.width / 2;
          if (side.axis === "x") chairs.push({ x: t - 6, y: side.fixed });
          else chairs.push({ x: side.fixed, y: t - 6 });
        }
      }
    }
    return chairs;
  };

  const onTablePointerDown = (e, table) => {
    e.stopPropagation();
    setSelectedId(`table:${table.id}`);
    dragState.current = { kind: "table", id: table.id, startX: e.clientX, startY: e.clientY, origX: table.x || 0, origY: table.y || 0 };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onVenuePointerDown = (e, el) => {
    e.stopPropagation();
    setSelectedId(`venue:${el.id}`);
    dragState.current = { kind: "venue", id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x || 0, origY: el.y || 0 };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onTableResizePointerDown = (e, table) => {
    e.stopPropagation();
    dragState.current = { kind: "table-resize", id: table.id, startX: e.clientX, startY: e.clientY, origScale: table.scale || 1 };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onVenueResizePointerDown = (e, el) => {
    e.stopPropagation();
    dragState.current = { kind: "venue-resize", id: el.id, startX: e.clientX, startY: e.clientY, origWidth: el.width, origHeight: el.height };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.kind === "table-resize") {
      const newScale = Math.min(2.5, Math.max(0.5, d.origScale + dx / 100));
      onUpdateTable(d.id, { scale: Math.round(newScale * 100) / 100 });
      return;
    }
    if (d.kind === "venue-resize") {
      const newWidth = Math.min(320, Math.max(28, d.origWidth + dx));
      const newHeight = Math.min(320, Math.max(20, d.origHeight + dy));
      onUpdateVenueElement(d.id, { width: newWidth, height: newHeight });
      return;
    }

    const canvasEl = canvasRef.current;
    const maxX = canvasEl ? canvasEl.clientWidth - 60 : 700;
    const maxY = canvasEl ? canvasEl.clientHeight - 60 : 520;
    const newX = Math.min(Math.max(20, d.origX + dx), maxX);
    const newY = Math.min(Math.max(20, d.origY + dy), maxY);
    if (d.kind === "table") onUpdateTable(d.id, { x: newX, y: newY });
    else onUpdateVenueElement(d.id, { x: newX, y: newY });
  };
  const onPointerUp = () => { dragState.current = null; };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[10.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Add to room:</span>
        {Object.entries(VENUE_ELEMENT_ICONS).map(([type, Icon]) => (
          <button
            key={type}
            onClick={() => onAddVenueElement(type)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{ border: `1px solid rgba(201,164,76,0.3)`, color: GOLD_SOFT, fontFamily: FONT_BODY }}
          >
            <Icon size={12} /> {VENUE_ELEMENT_DEFAULTS_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelectedId(null)}
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "#1a2420", height: 520, touchAction: "none", backgroundImage: "radial-gradient(rgba(201,164,76,0.14) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        >
          {venueElements.map((el) => {
            const Icon = VENUE_ELEMENT_ICONS[el.type] || Sofa;
            const isSel = selectedId === `venue:${el.id}`;
            return (
              <div
                key={el.id}
                onPointerDown={(e) => onVenuePointerDown(e, el)}
                onClick={(e) => e.stopPropagation()}
                className="absolute flex flex-col items-center justify-center gap-1"
                style={{
                  left: el.x || 0, top: el.y || 0, width: el.width, height: el.height,
                  borderRadius: 10, background: isSel ? "rgba(147,166,155,0.25)" : "rgba(147,166,155,0.12)",
                  border: `1.5px dashed ${isSel ? PAPER : "rgba(147,166,155,0.45)"}`,
                  cursor: "grab", userSelect: "none",
                }}
              >
                <Icon size={16} color={MUTED} />
                <span className="text-[9.5px] font-medium uppercase" style={{ color: MUTED, letterSpacing: "0.05em", fontFamily: FONT_BODY }}>{el.label}</span>
                {isSel && (
                  <div
                    onPointerDown={(e) => onVenueResizePointerDown(e, el)}
                    className="absolute rounded-sm"
                    style={{ right: -5, bottom: -5, width: 12, height: 12, background: PAPER, border: `1.5px solid ${GOLD}`, cursor: "nwse-resize" }}
                    title="Drag to resize"
                  />
                )}
              </div>
            );
          })}

          {tables.map((t) => {
            const size = shapeSize(t);
            const count = seatedAt(t.id).reduce((sum, g) => sum + groupHeadcount(g), 0);
            const over = count > t.capacity;
            const isSel = selectedId === `table:${t.id}`;
            return (
              <div key={t.id} className="absolute" style={{ left: t.x || 0, top: t.y || 0, width: size.width, height: size.height }}>
                {/* Chairs drawn around the table's actual perimeter */}
                {chairPositions(t, size).map((c, i) => (
                  <div key={i} className="absolute rounded-full" style={{ left: c.x, top: c.y, width: 12, height: 12, background: "#0d1512", border: `1.5px solid ${isSel ? GOLD : "rgba(201,164,76,0.35)"}` }} />
                ))}
                <div
                  onPointerDown={(e) => onTablePointerDown(e, t)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute flex h-full w-full flex-col items-center justify-center text-center"
                  style={{
                    borderRadius: t.shape === "round" ? "50%" : 8,
                    background: isSel ? "rgba(201,164,76,0.28)" : INK_2,
                    border: `2px solid ${isSel ? GOLD : over ? "#E29B9B" : "rgba(201,164,76,0.35)"}`,
                    cursor: "grab", userSelect: "none", padding: 4, boxShadow: "0 4px 10px -4px rgba(0,0,0,0.4)",
                  }}
                >
                  <span className="truncate text-[10.5px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY, maxWidth: size.width - 10 }}>{t.name}</span>
                  <span className="text-[9px]" style={{ color: over ? "#E29B9B" : MUTED, fontFamily: FONT_BODY }}>{count}/{t.capacity}</span>
                </div>
                {isSel && (
                  <div
                    onPointerDown={(e) => onTableResizePointerDown(e, t)}
                    className="absolute rounded-sm"
                    style={{ right: -5, bottom: -5, width: 12, height: 12, background: PAPER, border: `1.5px solid ${GOLD}`, cursor: "nwse-resize", zIndex: 5 }}
                    title="Drag to resize"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
            {selectedTable ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Table settings</h4>
                  <button onClick={() => setSelectedId(null)} style={{ color: MUTED }}><X size={14} /></button>
                </div>
                <FieldLabel>Name</FieldLabel>
                <TextInput value={selectedTable.name} onChange={(v) => onUpdateTable(selectedTable.id, { name: v })} placeholder="Table name" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Shape</FieldLabel>
                    <SegmentedToggle
                      value={selectedTable.shape}
                      onChange={(v) => onUpdateTable(selectedTable.id, { shape: v })}
                      options={[{ value: "round", label: "Round" }, { value: "square", label: "Square" }, { value: "long", label: "Long" }]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Seats</FieldLabel>
                    <input
                      type="number" min={1} value={selectedTable.capacity}
                      onChange={(e) => onUpdateTable(selectedTable.id, { capacity: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
                      style={{ background: INK_3, color: IVORY, fontFamily: FONT_BODY }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Drag the gold square at the table's corner to resize it.</p>
                {selectedTable.shape === "long" && (
                  <div className="mt-2 flex items-center justify-between">
                    <FieldLabel>Orientation</FieldLabel>
                    <SegmentedToggle
                      value={selectedTable.rotation === 90 ? "vertical" : "horizontal"}
                      onChange={(v) => onUpdateTable(selectedTable.id, { rotation: v === "vertical" ? 90 : 0 })}
                      options={[{ value: "horizontal", label: "Horizontal" }, { value: "vertical", label: "Vertical" }]}
                    />
                  </div>
                )}

                <Divider />

                <div className="mb-3 space-y-1.5">
                  {seatedAt(selectedTable.id).length === 0 ? (
                    <p className="text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>No one seated here yet.</p>
                  ) : (
                    seatedAt(selectedTable.id).map((g) => (
                      <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: INK_3 }}>
                        <span className="truncate text-[11.5px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>{guestLabel(g)}</span>
                        <button onClick={() => onAssignGuest(g.id, null)} title="Remove from this table" style={{ color: "#E29B9B", flexShrink: 0 }}><X size={12} /></button>
                      </div>
                    ))
                  )}
                </div>
                {unassigned.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onAssignGuest(e.target.value, selectedTable.id)}
                    className="mb-3 w-full rounded-md px-2 py-1.5 text-[11px] outline-none"
                    style={{ background: INK_3, color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.3)`, fontFamily: FONT_BODY }}
                  >
                    <option value="" disabled style={{ background: INK_2, color: MUTED }}>Assign a guest…</option>
                    {unassigned.map((g) => (
                      <option key={g.id} value={g.id} style={{ background: INK_2, color: IVORY }}>{guestLabel(g)}</option>
                    ))}
                  </select>
                )}
                <GhostButton onClick={() => { onDeleteTable(selectedTable.id); setSelectedId(null); }}><Trash2 size={12} /> Delete table</GhostButton>
              </>
            ) : selectedKind === "venue" ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Room element</h4>
                  <button onClick={() => setSelectedId(null)} style={{ color: MUTED }}><X size={14} /></button>
                </div>
                <FieldLabel>Label</FieldLabel>
                <TextInput
                  value={venueElements.find((v) => v.id === selectedRealId)?.label || ""}
                  onChange={(v) => onUpdateVenueElement(selectedRealId, { label: v })}
                  placeholder="Label"
                />
                <p className="mb-3 mt-2 text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Drag the gold square at its corner to resize.</p>
                <GhostButton onClick={() => { onDeleteVenueElement(selectedRealId); setSelectedId(null); }}><Trash2 size={12} /> Remove from room</GhostButton>
              </>
            ) : (
              <p className="text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Tap a table to assign guests, or drag anything to arrange the room.</p>
            )}
          </div>

          <div className="rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)`, maxHeight: 320, overflowY: "auto" }}>
            <h4 className="mb-2 text-[12px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>
              Confirmed Guests <span style={{ color: MUTED, fontWeight: 400 }}>({confirmedGroups.length})</span>
            </h4>
            <div className="space-y-1.5">
              {confirmedGroups.map((g) => {
                const assignedTable = tables.find((t) => t.id === g.tableId);
                return (
                  <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: INK_3 }}>
                    <span className="truncate text-[11px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>{guestLabel(g)}</span>
                    {assignedTable ? (
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px]" style={{ background: "rgba(143,191,163,0.15)", color: CHART_COLORS.yes, fontFamily: FONT_BODY }}>{assignedTable.name}</span>
                    ) : (
                      <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px]" style={{ background: "rgba(226,155,155,0.15)", color: "#E29B9B", fontFamily: FONT_BODY }}>Unassigned</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ guestGroups, addGuestGroup, updateGuestGroup, deleteGuestGroup, moveGuestGroup, tables, addTable, updateTable, deleteTable, assignGuestToTable, integrations, updateIntegrations, coupleTitle, slug, siteDomain, og, openInviteLinks, addOpenInviteLink, deleteOpenInviteLink, venueElements, addVenueElement, updateVenueElement, deleteVenueElement }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [addGuestsCount, setAddGuestsCount] = useState(0);
  const [addGuestError, setAddGuestError] = useState("");
  const [showReminderUnlockModal, setShowReminderUnlockModal] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkMax, setNewLinkMax] = useState("5");
  const [copiedBatchId, setCopiedBatchId] = useState(null);
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

  const batchLink = (link) => `https://${siteDomain}/e/${slug}?batch=${link.id}`;
  const copyBatchLink = async (link) => {
    const ok = await copyToClipboard(batchLink(link));
    setCopiedBatchId(ok ? link.id : null);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };
  const batchAttendingCount = (linkId) =>
    flattenMembers(guestGroups.filter((g) => g.inviteBatchId === linkId)).filter((m) => m.status === "yes").length;

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

  // Tracks per-guest send state so the UI can show a spinner/checkmark/error
  // right on that guest's row without a page-wide loading state.
  const [sendingWhatsAppIds, setSendingWhatsAppIds] = useState(() => new Set());
  const [whatsappResults, setWhatsappResults] = useState({}); // { [groupId]: "sent" | "error" }
  // Maps phone number -> latest delivery status Meta has reported via the
  // webhook ("sent" | "delivered" | "read" | "failed"). Refreshed
  // periodically so the checkmarks update without a manual page reload.
  const [whatsappDeliveryStatus, setWhatsappDeliveryStatus] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchStatuses = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/whatsapp_incoming?direction=eq.status&select=from_number,message_type,received_at&order=received_at.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) return;
        const rows = await res.json();
        if (cancelled) return;
        // Keep only the latest status per phone number — statuses arrive
        // sent -> delivered -> read over time, so the last row wins.
        const latest = {};
        for (const row of rows) latest[row.from_number] = row.message_type;
        setWhatsappDeliveryStatus(latest);
      } catch {
        // Silent — this is a background refresh; a failed fetch just means
        // checkmarks stay at whatever they were, not a user-facing error.
      }
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 15000); // refresh every 15s so checkmarks update live without a manual reload
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const sendAutomatedWhatsApp = async (group) => {
    if (!group.phone) {
      setWhatsappResults((r) => ({ ...r, [group.id]: "error" }));
      return;
    }
    setSendingWhatsAppIds((s) => new Set(s).add(group.id));
    try {
      await sendWhatsAppMessage({
        to: group.phone,
        templateName: WHATSAPP_TEMPLATE_NAME,
        languageCode: WHATSAPP_TEMPLATE_LANGUAGE,
        variables: [group.members[0]?.name || group.lastName, coupleTitle, guestLink(group)],
        headerImageUrl: og?.image || null,
      });
      setWhatsappResults((r) => ({ ...r, [group.id]: "sent" }));
      updateGuestGroup(group.id, { whatsappTemplateSentAt: Date.now() });
    } catch {
      setWhatsappResults((r) => ({ ...r, [group.id]: "error" }));
    } finally {
      setSendingWhatsAppIds((s) => { const next = new Set(s); next.delete(group.id); return next; });
    }
  };

  const sendWhatsAppToSelected = async () => {
    const groups = guestGroups.filter((g) => selectedIds.has(g.id));
    // Sent one at a time with a short pause between each — Meta rate-limits
    // bursts of template sends, and this keeps each guest's row updating
    // individually as it goes rather than all appearing to hang at once.
    for (const group of groups) {
      await sendAutomatedWhatsApp(group);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  };

  const sendAutomatedReminder = async (group) => {
    if (!integrations.reminderFeatureUnlocked || !group.phone) {
      setWhatsappResults((r) => ({ ...r, [group.id]: "error" }));
      return;
    }
    setSendingWhatsAppIds((s) => new Set(s).add(group.id));
    try {
      await sendWhatsAppMessage({
        to: group.phone,
        templateName: WHATSAPP_REMINDER_TEMPLATE_NAME,
        languageCode: WHATSAPP_TEMPLATE_LANGUAGE,
        variables: [group.members[0]?.name || group.lastName, coupleTitle, guestLink(group)],
        headerImageUrl: og?.image || null,
      });
      setWhatsappResults((r) => ({ ...r, [group.id]: "sent" }));
      updateGuestGroup(group.id, { whatsappReminderSentAt: Date.now() });
    } catch {
      setWhatsappResults((r) => ({ ...r, [group.id]: "error" }));
    } finally {
      setSendingWhatsAppIds((s) => { const next = new Set(s); next.delete(group.id); return next; });
    }
  };

  const sendReminderToSelected = async () => {
    const groups = guestGroups.filter((g) => selectedIds.has(g.id));
    for (const group of groups) {
      await sendAutomatedReminder(group);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
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
    if (!phone.trim()) {
      setAddGuestError("Phone number is required.");
      return;
    }
    setAddGuestError("");
    addGuestGroup({
      id: uid(), lastName: lastName.trim(),
      members: [{ id: uid(), name: firstName.trim(), status: "pending" }],
      additionalGuests: addGuestsCount, table: "", phone: phone.trim(), invitationSent: false, invitationViewed: false, updatedAt: Date.now(),
    });
    setLastName(""); setFirstName(""); setAddGuestsCount(0); setPhone("");
  };

  const addBlankRow = () => addGuestGroup({ id: uid(), lastName: "", members: [], additionalGuests: 0, table: "", phone: "", invitationSent: false, invitationViewed: false, updatedAt: Date.now() });

  // One row per invited person (not per family group), since that's what's
  // actually useful for a headcount or a mail-merge — a group's shared
  // fields (last name, phone, table) repeat on every member's row.
  const exportGuestsToCsv = () => {
    const header = ["Last Name", "Guest Name", "RSVP Status", "Phone", "Additional Guests", "Table", "Invitation Sent", "Invitation Viewed"];
    const rows = guestGroups.flatMap((g) => {
      const tableName = tables.find((t) => t.id === g.tableId)?.name || "";
      const members = g.members.length > 0 ? g.members : [{ name: "", status: "" }];
      return members.map((m) => [
        g.lastName || "", m.name || "", m.status || "", g.phone || "",
        g.additionalGuests || 0, tableName, g.invitationSent ? "Yes" : "No", g.invitationViewed ? "Yes" : "No",
      ]);
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    // The BOM is what makes Excel detect this as UTF-8 instead of the
    // system's default codepage — without it, guest names with Arabic or
    // other non-ASCII characters show up garbled when opened in Excel.
    downloadTextFile(`guest-list-${slug}.csv`, `﻿${csv}`);
  };

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
        <GhostButton active={subTab === "voice"} onClick={() => setSubTab("voice")}>Voice Messages</GhostButton>
        <GhostButton active={subTab === "networking"} onClick={() => setSubTab("networking")}>Guest Networking</GhostButton>
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
          venueElements={venueElements} onAddVenueElement={addVenueElement} onUpdateVenueElement={updateVenueElement} onDeleteVenueElement={deleteVenueElement}
        />
      ) : subTab === "voice" ? (
        <VoiceMessagesPanel slug={slug} />
      ) : subTab === "networking" ? (
        <NetworkingApprovalPanel slug={slug} />
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
          <TextInput value={phone} onChange={setPhone} placeholder="Phone (required)" />
          {addGuestError && <p className="text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{addGuestError}</p>}
          <GoldButton onClick={submitAddGuest}><Plus size={14} /> Add guest</GoldButton>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
        <h3 className="mb-1 text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Multiple Open Invite Links</h3>
        <p className="mb-3 text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          Create separate open links for different groups (e.g. "Family side", "Friends"), each with its own guest limit — independent of the single shared "Open Invitation" link and of each other.
        </p>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="flex-1" style={{ minWidth: 140 }}>
            <FieldLabel>Label</FieldLabel>
            <TextInput value={newLinkLabel} onChange={setNewLinkLabel} placeholder="Family side" />
          </div>
          <div style={{ width: 90 }}>
            <FieldLabel>Max guests</FieldLabel>
            <TextInput type="number" value={newLinkMax} onChange={setNewLinkMax} placeholder="5" />
          </div>
          <GoldButton
            onClick={() => { addOpenInviteLink(newLinkLabel, newLinkMax); setNewLinkLabel(""); setNewLinkMax("5"); }}
            disabled={!newLinkLabel.trim()}
          >
            <Plus size={14} /> Create link
          </GoldButton>
        </div>
        {openInviteLinks.length > 0 && (
          <div className="space-y-2">
            {openInviteLinks.map((link) => {
              const count = batchAttendingCount(link.id);
              const full = link.maxGuests > 0 && count >= link.maxGuests;
              return (
                <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-2.5" style={{ background: INK_3 }}>
                  <div>
                    <div className="text-[12.5px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>{link.label}</div>
                    <div className="text-[10.5px]" style={{ color: full ? "#E29B9B" : MUTED, fontFamily: FONT_BODY }}>
                      {count} / {link.maxGuests || "∞"} confirmed{full ? " — full" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GhostButton onClick={() => copyBatchLink(link)}>
                      <Copy size={11} /> {copiedBatchId === link.id ? "Copied!" : "Copy link"}
                    </GhostButton>
                    <button onClick={() => deleteOpenInviteLink(link.id)} title="Delete this link" className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "#E29B9B" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            {selectedIds.size > 0 && (
              <GhostButton onClick={sendWhatsAppToSelected}>
                <Send size={12} /> Send WhatsApp Template ({selectedIds.size})
              </GhostButton>
            )}
            {selectedIds.size > 0 && (
              integrations.reminderFeatureUnlocked ? (
                <GhostButton onClick={sendReminderToSelected}>
                  <Send size={12} /> Send Reminder ({selectedIds.size})
                </GhostButton>
              ) : (
                <GhostButton onClick={() => setShowReminderUnlockModal(true)}>
                  <Lock size={12} /> Unlock Reminders — $10
                </GhostButton>
              )
            )}
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
          <GhostButton onClick={exportGuestsToCsv} title="Downloads a .csv file that opens directly in Excel">
            <Download size={13} /> Download
          </GhostButton>
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
                <th className="px-2 py-2 text-left text-[9.5px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>Phone</th>
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
                    <td className="px-2 py-0.5">
                      <input
                        value={g.phone || ""}
                        onChange={(e) => updateGuestGroup(g.id, { phone: e.target.value })}
                        placeholder="Phone"
                        className="w-full rounded-md bg-transparent px-1 py-0.5 text-[12px] outline-none"
                        style={{ color: g.phone ? IVORY : "#E29B9B", fontFamily: FONT_BODY }}
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
                        {g.phone && (
                          <button
                            onClick={() => sendAutomatedWhatsApp(g)}
                            disabled={sendingWhatsAppIds.has(g.id)}
                            title={(whatsappResults[g.id] === "sent" || g.whatsappTemplateSentAt) ? "Sent!" : whatsappResults[g.id] === "error" ? "Failed — click to retry" : "Send approved WhatsApp template automatically"}
                            className="flex h-5 w-5 items-center justify-center rounded"
                            style={{
                              background: (whatsappResults[g.id] === "sent" || g.whatsappTemplateSentAt) ? "rgba(143,191,163,0.2)" : whatsappResults[g.id] === "error" ? "rgba(226,155,155,0.2)" : INK_3,
                              color: (whatsappResults[g.id] === "sent" || g.whatsappTemplateSentAt) ? CHART_COLORS.yes : whatsappResults[g.id] === "error" ? "#E29B9B" : GOLD_SOFT,
                              opacity: sendingWhatsAppIds.has(g.id) ? 0.5 : 1,
                            }}
                          >
                            {(whatsappResults[g.id] === "sent" || g.whatsappTemplateSentAt) ? <CheckCircle2 size={10} /> : whatsappResults[g.id] === "error" ? <XCircle size={10} /> : <Send size={10} />}
                          </button>
                        )}
                        {g.phone && whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] && (
                          <span
                            title={
                              whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "read" ? "Read" :
                              whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "delivered" ? "Delivered" :
                              whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "failed" ? "Failed to deliver" : "Sent"
                            }
                            className="flex h-5 w-5 items-center justify-center"
                            style={{ color: whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "read" ? "#53BDEB" : whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "failed" ? "#E29B9B" : "rgba(147,166,155,0.7)" }}
                          >
                            {whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "failed" ? <XCircle size={12} /> :
                             whatsappDeliveryStatus[g.phone.replace(/[^0-9]/g, "")] === "sent" ? <Check size={12} /> : <CheckCheck size={12} />}
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
      {showReminderUnlockModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(6,8,6,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: INK_2 }}>
            <h3 className="mb-2 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Unlock Reminders</h3>
            <p className="mb-4 text-[13px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              A one-time $10 unlocks sending WhatsApp reminders to your guests, for this invitation, with no limit on how many times you use it afterward.
            </p>
            {integrations.reminderPaymentUrl ? (
              <a
                href={integrations.reminderPaymentUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex w-full items-center justify-center rounded-full py-3 text-sm font-bold uppercase"
                style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.05em" }}
              >
                Pay $10 to Unlock
              </a>
            ) : (
              <p className="mb-3 text-[12px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>No payment link has been set up yet — contact support.</p>
            )}
            <button onClick={() => setShowReminderUnlockModal(false)} className="mb-4 w-full text-center text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Cancel</button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.3)" }} />
              <span className="text-[9px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>TEMPORARY — remove before going live</span>
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.3)" }} />
            </div>
            <button
              onClick={() => { updateIntegrations({ reminderFeatureUnlocked: true }); setShowReminderUnlockModal(false); }}
              className="mt-2 w-full rounded-full py-2 text-[11px] font-semibold"
              style={{ border: `1px dashed rgba(147,166,155,0.4)`, color: MUTED, fontFamily: FONT_BODY }}
            >
              Skip payment — unlock directly (testing only)
            </button>
          </div>
        </div>
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

  const [ogUploading, setOgUploading] = useState(false);
  const [ogUploadError, setOgUploadError] = useState("");
  const onUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgUploading(true);
    setOgUploadError("");
    try {
      const url = await uploadImageToStorage(file);
      setOg((o) => ({ ...o, image: url }));
    } catch (err) {
      setOgUploadError(err.message || "Couldn't upload the image — please try again.");
    } finally {
      setOgUploading(false);
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
          {names.name1 || "—"}{names.name2 ? <> <span style={{ color: ROSE }}>&amp;</span> {names.name2}</> : null}
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
            <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUploadPhoto} disabled={ogUploading} />
          </label>
          <GhostUploadButton accept="image/*" onChange={onUploadPhoto}>
            <ImagePlus size={13} /> {ogUploading ? "Uploading…" : "Upload photo"}
          </GhostUploadButton>
        </div>
        {ogUploadError && <p className="mt-2 text-[10.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{ogUploadError}</p>}
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
            Approved — sending a notification email to <strong style={{ color: GOLD_SOFT }}>{approvalNotice}</strong>.
          </span>
          <span className="ml-auto text-[10.5px] italic" style={{ color: MUTED, fontFamily: FONT_BODY }}>Check Edge Function logs if it doesn't arrive</span>
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

function EventTypePicker({ onChoose, onCancel }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>What are you celebrating?</h1>
        <p className="mt-2 text-[13px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>This sets up the right starting wording for your invitation.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {EVENT_TYPES.map((et) => (
          <button
            key={et.id}
            onClick={() => onChoose(et)}
            className="flex flex-col items-center gap-2.5 rounded-2xl py-7 transition-transform hover:scale-[1.03]"
            style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}
          >
            <et.icon size={26} color={GOLD_SOFT} />
            <span className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{et.name}</span>
          </button>
        ))}
      </div>
      {onCancel && (
        <div className="mt-8 text-center">
          <button onClick={onCancel} className="text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function TemplatePicker({ eventTypeId, onChoose, onCancel }) {
  const matching = eventTypeId ? INVITATION_TEMPLATES.filter((tpl) => tpl.eventTypes?.includes(eventTypeId)) : INVITATION_TEMPLATES;
  const templates = matching.length ? matching : INVITATION_TEMPLATES; // fallback — never leave the picker empty if no template happens to be tagged for this event type
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Choose a Design</h1>
        <p className="mt-2 text-[13px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Pick a starting look — every detail can still be customized afterward in the Builder.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onChoose(tpl)}
            className="group overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.02]"
            style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}
          >
            {tpl.coverImage ? (
              <img src={tpl.coverImage} alt={tpl.name} style={{ height: 140, width: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ height: 140, background: tpl.previewSwatch }} />
            )}
            <div className="p-4">
              <div className="text-[14px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{tpl.name}</div>
              <div className="mt-1 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{tpl.description}</div>
            </div>
          </button>
        ))}
      </div>
      {onCancel && (
        <div className="mt-8 text-center">
          <button onClick={onCancel} className="text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// Etsy-style, standalone shop page — no account, no signup, no builder
// involved at all. A buyer picks a specific design, pays that design's
// own price, and is redirected straight to a real Canva template link to
// customize it themselves in Canva. Completely separate from this app's
// own package/publish payment system (PublishPaywallModal) — a template
// bought here has nothing to do with an eInvite.me account or invitation.
// Admin-only modal for capturing the current invitation's visual style
// (see saveCurrentAsShopDesign) as a new, independent design on /shop.
function SaveAsShopDesignModal({ onClose, onSave, existingDesigns, onUpdateDesign, onDeleteDesign, onEditInBuilder, onUploadVideo }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [canvaUrl, setCanvaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCanvaUrl, setEditCanvaUrl] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), price, canvaUrl.trim());
    setSaving(false);
    setDone(true);
  };

  const startEdit = (design) => {
    setEditingId(design.id);
    setEditName(design.name);
    setEditPrice(String(design.price || ""));
    setEditCanvaUrl(design.canvaTemplateUrl || "");
  };
  const saveEdit = () => {
    const trimmedCanvaUrl = editCanvaUrl.trim();
    onUpdateDesign(editingId, {
      name: editName.trim() || "Untitled design",
      price: Number(editPrice) || 0,
      canvaTemplateUrl: trimmedCanvaUrl || null,
      editOnWebsite: !trimmedCanvaUrl, // a Canva link makes this a /shop (Canva-linked) design; no link keeps it a /designs (built-in-app) one
    });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(10,12,10,0.75)" }}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, maxHeight: "85vh" }}>
        <div className="overflow-y-auto p-6" style={{ maxHeight: "85vh" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Shop Designs</h2>
          <button onClick={onClose} style={{ color: MUTED }}><X size={18} /></button>
        </div>

        {existingDesigns && existingDesigns.length > 0 && (
          <div className="mb-5 space-y-2">
            <FieldLabel>Your published designs</FieldLabel>
            {existingDesigns.map((d) => (
              <div key={d.id} className="rounded-lg p-3" style={{ background: INK_3 }}>
                {editingId === d.id ? (
                  <div className="space-y-2">
                    <TextInput value={editName} onChange={setEditName} placeholder="Design name" />
                    <TextInput type="number" value={editPrice} onChange={setEditPrice} placeholder="Price" />
                    <TextInput value={editCanvaUrl} onChange={setEditCanvaUrl} placeholder="Canva template link (leave blank for a /designs, built-in-app design)" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 rounded-full py-1.5 text-[11.5px] font-semibold" style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 rounded-full py-1.5 text-[11.5px] font-semibold" style={{ border: `1px solid rgba(147,166,155,0.3)`, color: MUTED, fontFamily: FONT_BODY }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-medium" style={{ color: IVORY, fontFamily: FONT_BODY }}>{d.name}</span>
                        <span className="rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold uppercase" style={{ background: d.editOnWebsite ? "rgba(143,191,163,0.15)" : "rgba(201,164,76,0.15)", color: d.editOnWebsite ? CHART_COLORS.yes : GOLD_SOFT }}>
                          {d.editOnWebsite ? "Designs" : "Shop"}
                        </span>
                      </div>
                      <div className="text-[11px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>${d.price}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEditInBuilder(d)} className="rounded-md px-2 py-1 text-[10.5px] font-semibold" style={{ color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.35)`, fontFamily: FONT_BODY }} title="Edit full design in Builder">
                        Edit design
                      </button>
                      <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md" style={{ color: MUTED }} title={d.previewVideo ? "Replace preview video" : "Add preview video"}>
                        <Film size={13} />
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => onUploadVideo(d.id, e.target.files?.[0])} />
                      </label>
                      <button onClick={() => startEdit(d)} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: MUTED }} title="Edit name/price">
                        <Settings size={13} />
                      </button>
                      <button onClick={() => onDeleteDesign(d.id)} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "#E29B9B" }} title="Delete">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <div className="text-center">
            <CheckCircle2 size={32} color="#8FBFA3" style={{ margin: "0 auto 10px" }} />
            <p className="text-[13px]" style={{ color: IVORY, fontFamily: FONT_BODY }}>Saved — it's live on /shop now.</p>
            <button onClick={onClose} className="mt-4 rounded-full px-5 py-2 text-[12px] font-semibold" style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}>Done</button>
          </div>
        ) : (
          <>
            <FieldLabel>Save current styling as a new design</FieldLabel>
            <p className="mb-3 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
              This captures every page's current background image and the Cover page's name fonts/colors — not any names or content you've typed — as a brand new design buyers can pick on /shop.
            </p>
            <FieldLabel>Design name</FieldLabel>
            <TextInput value={name} onChange={setName} placeholder="e.g. Golden Botanical" />
            <div className="mt-3">
              <FieldLabel>Price (USD)</FieldLabel>
              <TextInput type="number" value={price} onChange={setPrice} placeholder="35" />
            </div>
            <div className="mt-3">
              <FieldLabel>Canva template link (optional)</FieldLabel>
              <TextInput value={canvaUrl} onChange={setCanvaUrl} placeholder="Leave blank for a /designs design" />
              <p className="mt-1 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                With a link: shows on /shop as a Canva-linked design. Without one: shows on /designs, editable right here in the Builder.
              </p>
            </div>
            <button
              onClick={submit}
              disabled={saving || !name.trim()}
              className="mt-5 w-full rounded-full py-3 text-sm font-bold uppercase"
              style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.05em", opacity: saving || !name.trim() ? 0.6 : 1 }}
            >
              {saving ? "Saving…" : "Save as New Design"}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function TemplateShopPage({ mode = "canva" }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [purchasedUrl, setPurchasedUrl] = useState(null);
  const [purchaseComplete, setPurchaseComplete] = useState(false); // true once paid, even for editOnWebsite templates that have no Canva link
  // Admin-published designs (via "Save as Shop Design" in the Builder) —
  // this page is standalone with no shared state from the main app, so it
  // fetches them directly from their own dedicated key.
  const [shopDesigns, setShopDesigns] = useState([]);
  const allTemplates = INVITATION_TEMPLATES
    .map((t) => shopDesigns.find((d) => d.id === t.id) || t) // a saved edit with the same id overrides the hardcoded original
    .concat(shopDesigns.filter((d) => !INVITATION_TEMPLATES.some((t) => t.id === d.id))) // plus any genuinely new designs
    .filter((t) =>
      mode === "website" ? t.editOnWebsite : !t.editOnWebsite
    );

  useEffect(() => {
    (async () => {
      try {
        const res = await persistentStorage.get("einvite:shop-designs", false);
        if (res?.value) setShopDesigns(JSON.parse(res.value));
      } catch {}
    })();
  }, []);

  // On return from Whish's checkout, resume checking a payment that was
  // already started before the redirect — same reasoning as the
  // livestream flow: the guest may come back to this exact page after
  // completing checkout in another tab/after being redirected back.
  useEffect(() => {
    const storedRef = window.localStorage.getItem("einvite:template-purchase-ref");
    const storedTemplateId = window.localStorage.getItem("einvite:template-purchase-template-id");
    if (!storedRef || !storedTemplateId) return;
    const tpl = allTemplates.find((t) => t.id === storedTemplateId);
    if (!tpl) return;
    setSelectedTemplate(tpl);
    setPolling(true);
    const start = Date.now();
    const poll = async () => {
      if (Date.now() - start > 10 * 60 * 1000) { setPolling(false); setError("Payment session expired — please try again."); return; }
      const result = await getTemplatePurchaseStatus(storedRef);
      // editOnWebsite designs have no Canva link to wait for — payment
      // confirmed is enough to move on to account creation.
      if (result?.status === "paid" && (tpl.editOnWebsite || result.canvaTemplateUrl)) {
        setPolling(false);
        setPurchasedUrl(result.canvaTemplateUrl || null);
        setPurchaseComplete(true);
        window.localStorage.removeItem("einvite:template-purchase-ref");
        window.localStorage.removeItem("einvite:template-purchase-template-id");
        return;
      }
      setTimeout(poll, 3000);
    };
    poll();
  }, []);

  const startPurchase = async () => {
    if (!selectedTemplate) return;
    if (!buyerEmail.trim()) { setError("Please enter your email so we can confirm your purchase."); return; }
    setPaying(true);
    setError("");
    try {
      const { paymentReference, paymentUrl } = await createTemplatePaymentSession(selectedTemplate.id, buyerEmail.trim());
      window.localStorage.setItem("einvite:template-purchase-ref", paymentReference);
      window.localStorage.setItem("einvite:template-purchase-template-id", selectedTemplate.id);
      window.location.href = paymentUrl; // hand off to Whish's own checkout — real payment happens there, not in this app
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  if (purchasedUrl || purchaseComplete) {
    const isEditOnWebsite = selectedTemplate?.editOnWebsite;
    const signupUrl = isEditOnWebsite
      ? `${window.location.origin}/?buildTemplate=${encodeURIComponent(selectedTemplate.id)}&email=${encodeURIComponent(buyerEmail)}`
      : null;
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <CheckCircle2 size={40} color="#8FBFA3" style={{ margin: "0 auto 14px" }} />
          <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: IVORY }}>Payment confirmed!</h1>
          <p className="mt-2 text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            {isEditOnWebsite ? "Create your free account to start customizing this design on the website." : "Your design is ready to customize in Canva."}
          </p>
          <a
            href={isEditOnWebsite ? signupUrl : purchasedUrl}
            target={isEditOnWebsite ? "_self" : "_blank"}
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}
          >
            {isEditOnWebsite ? "Create your account" : "Open in Canva"} <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  if (polling) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: IVORY, fontFamily: FONT_BODY, fontSize: 13 }}>Waiting for payment to complete…</p>
          <p className="mt-2 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>This updates automatically once payment is confirmed — no need to refresh.</p>
          {error && <p className="mt-3 text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: INK }}>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Wedding Invitation Designs</h1>
          <p className="mt-2 text-[13px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
            {mode === "website" ? "Buy a design, then customize it yourself directly on our website." : "Buy a design, then customize it yourself directly in Canva — no account needed here."}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {allTemplates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => { setSelectedTemplate(tpl); setError(""); }}
              className="group overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.02]"
              style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.15)` }}
            >
              <div className="p-3" style={{ background: INK_3 }}>
                <div className="relative mx-auto" style={{ width: "100%", maxWidth: 180, background: "#000", borderRadius: 20, padding: 6, boxShadow: "0 10px 24px -8px rgba(0,0,0,0.6)" }}>
                  <div className="absolute left-1/2 top-2 z-10 h-2.5 w-10 -translate-x-1/2 rounded-full" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <div className="relative overflow-hidden" style={{ borderRadius: 15, aspectRatio: "9 / 19.5" }}>
                    {tpl.previewVideo ? (
                      <video
                        key={tpl.previewVideo}
                        src={tpl.previewVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : tpl.coverImage ? (
                      <img src={tpl.coverImage} alt={tpl.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: BG_PRESETS[tpl.coverPreset]?.css || "linear-gradient(150deg, #1F3A2E 0%, #24463D 55%, #16211D 100%)" }}
                      >
                        <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: "rgba(244,237,228,0.55)", textAlign: "center", padding: "0 10px" }}>
                          {tpl.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>{tpl.name}</div>
                  <div className="text-[14px] font-bold" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>${tpl.price}</div>
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>{tpl.description}</div>
              </div>
            </button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(10,12,10,0.75)" }}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, maxHeight: "90vh", overflowY: "auto" }}>
              {selectedTemplate.previewVideo && (
                <video
                  src={selectedTemplate.previewVideo}
                  controls
                  playsInline
                  style={{ width: "100%", display: "block", background: INK }}
                />
              )}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>{selectedTemplate.name}</h2>
                  <button onClick={() => setSelectedTemplate(null)} style={{ color: MUTED }}><X size={18} /></button>
                </div>
                <p className="mb-4 text-[13px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, fontWeight: 700 }}>${selectedTemplate.price}</p>
                <FieldLabel>Your email (for your purchase confirmation)</FieldLabel>
                <TextInput type="email" value={buyerEmail} onChange={setBuyerEmail} placeholder="you@example.com" />
                {error && <p className="mt-2 text-[11.5px]" style={{ color: "#E29B9B", fontFamily: FONT_BODY }}>{error}</p>}
                <p className="mb-1.5 mt-4 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Choose how to pay:</p>
                <button
                  onClick={startPurchase}
                  disabled={paying}
                  className="w-full rounded-full py-3 text-sm font-bold uppercase"
                  style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.05em", opacity: paying ? 0.6 : 1 }}
                >
                  {paying ? "Opening payment…" : `Pay with Whish — $${selectedTemplate.price}`}
                </button>
                <button
                  onClick={() => setError("Credit card payment isn't set up yet — a Stripe account needs to be connected first.")}
                  className="mt-2 w-full rounded-full py-3 text-sm font-bold uppercase"
                  style={{ border: `1.5px solid ${GOLD}`, color: GOLD, fontFamily: FONT_BODY, letterSpacing: "0.05em" }}
                >
                  {`Pay by Credit Card — $${selectedTemplate.price}`}
                </button>
                {selectedTemplate.canvaTemplateUrl && (
                  <>
                    <div className="my-3 flex items-center gap-2">
                      <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
                      <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>TEMPORARY — remove before going live</span>
                      <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
                    </div>
                    <a
                      href={selectedTemplate.canvaTemplateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full rounded-full py-2.5 text-center text-[11.5px] font-semibold"
                      style={{ border: `1px dashed rgba(147,166,155,0.4)`, color: MUTED, fontFamily: FONT_BODY }}
                    >
                      Skip payment — open Canva link directly (testing only)
                    </a>
                  </>
                )}
                {selectedTemplate.editOnWebsite && (
                  <>
                    <div className="my-3 flex items-center gap-2">
                      <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
                      <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>TEMPORARY — remove before going live</span>
                      <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
                    </div>
                    <button
                      onClick={() => { setPurchaseComplete(true); setPurchasedUrl(null); }}
                      className="block w-full rounded-full py-2.5 text-center text-[11.5px] font-semibold"
                      style={{ border: `1px dashed rgba(147,166,155,0.4)`, color: MUTED, fontFamily: FONT_BODY }}
                    >
                      Skip payment — go straight to account creation (testing only)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating AI support chat — a small round bubble in the corner that
// expands into a chat panel. Needs an Edge Function named exactly
// "clever-api" deployed at {SUPABASE_URL}/functions/v1/clever-api —
// see sendChatSupportMessage above, which is what this actually calls.
// (An earlier version of this comment said "chat-support", which was
// never the real endpoint — if a function was ever deployed under that
// name instead, every request here 404s regardless of any API key.)
// That function is what holds the real API key and calls an AI service
// (e.g. Anthropic's Claude) server-side — for the "builder" context, it
// also needs to return a `formData` object of whatever invitation
// fields it extracted from the conversation (see onFillForm below) —
// then returns just the reply text here. It also needs to handle the
// { action: "send-whatsapp", ... } shape sendWhatsAppMessage posts to
// this same endpoint. Until that Edge Function exists and responds
// correctly, this will show the friendly error message below instead
// of a real answer.
function ChatSupportWidget({ context = "shop", onFillForm } = {}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: context === "builder"
        ? "Hi! Tell me about your invitation — partner names, the date, ceremony/reception details — and I'll fill it in for you as we go."
        : "Hi! I'm here to help with any questions about eInvite.me — designs, pricing, how it works, anything at all. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const { reply, formData } = await sendChatSupportMessage(nextMessages, context);
      if (formData && onFillForm) onFillForm(formData); // this browser's own React state is what actually gets updated — the Edge Function only extracted the fields
      setMessages((m) => [...m, reply]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't connect just now — please try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200 }}>
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl"
          style={{ width: 320, height: 420, background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, boxShadow: "0 20px 50px -15px rgba(0,0,0,0.6)" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid rgba(201,164,76,0.15)` }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} color={GOLD_SOFT} />
              <span className="text-[13px] font-semibold" style={{ color: IVORY, fontFamily: FONT_BODY }}>Ask us anything</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: MUTED }}><X size={16} /></button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px]"
                  style={{
                    background: m.role === "user" ? GOLD : INK_3,
                    color: m.role === "user" ? INK : IVORY,
                    fontFamily: FONT_BODY,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div className="rounded-2xl px-3 py-2 text-[12.5px]" style={{ background: INK_3, color: MUTED, fontFamily: FONT_BODY }}>…</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-3" style={{ borderTop: `1px solid rgba(201,164,76,0.15)` }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Type your question…"
              className="flex-1 rounded-full px-3 py-2 text-[12.5px] outline-none"
              style={{ background: INK_3, color: IVORY, fontFamily: FONT_BODY }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: GOLD, color: INK, opacity: sending || !input.trim() ? 0.5 : 1 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: GOLD, boxShadow: "0 10px 30px -8px rgba(201,164,76,0.5)", marginLeft: "auto" }}
      >
        {open ? <X size={22} color={INK} /> : <Sparkles size={22} color={INK} />}
      </button>
    </div>
  );
}

function AuthPreview({ users, onSignUp, onExit, onEnterBuilderAs, dataLoaded, prefillEmail = "", skipApproval = false }) {
  const [screen, setScreen] = useState("signup"); // signup | pendingNotice | login | welcome
  const [form, setForm] = useState({ name: "", email: prefillEmail, phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sends the browser to Google's own sign-in screen via Supabase's OAuth
  // endpoint. redirectTo brings them straight back to this same page —
  // Supabase appends the session as a URL fragment (#access_token=...),
  // which the effect below picks up.
  const continueWithGoogle = () => {
    const redirectTo = window.location.origin + window.location.pathname;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  // Runs once on mount — checks whether we just landed back here after a
  // Google sign-in (Supabase puts the session in the URL's hash fragment,
  // not a query param). If so, fetches the Google account's email/name,
  // then either logs into an existing matching account or creates a new
  // one automatically (no password needed — Google already verified them).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;
    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    setGoogleLoading(true);
    // Clean the token out of the visible URL right away — it's sensitive
    // and shouldn't linger in the address bar or browser history.
    window.history.replaceState(null, "", window.location.pathname);

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Couldn't verify the Google account.");
        const googleUser = await res.json();
        const email = googleUser.email;
        const name = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || email.split("@")[0];
        if (!email) throw new Error("Google didn't share an email address.");

        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          if (!dataLoaded) throw new Error("Still loading accounts — please try again in a moment.");
          if (existing.status !== "active") { setError("Your account is still waiting on approval."); setGoogleLoading(false); return; }
          onEnterBuilderAs(existing);
        } else {
          const newUser = onSignUp({ name, email, phone: "", password: `google-oauth-${uid()}` }); // no real password — this account can only ever sign in via Google
          if (skipApproval && newUser) {
            onEnterBuilderAs(newUser);
          } else {
            setScreen("pendingNotice");
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong signing in with Google — please try again.");
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, []);

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
    const newUser = onSignUp({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
    if (skipApproval && newUser) {
      onEnterBuilderAs(newUser); // paid already — go straight into the Builder, no separate approval wait
    } else {
      setScreen("pendingNotice");
    }
  };

  const submitLogin = (e) => {
    e.preventDefault();
    setError("");
    // THE ACTUAL FIX: without this check, trying to log in before the real
    // account list has finished loading from Supabase (still just the
    // initial seed data at that moment) would incorrectly report "wrong
    // password" for a genuinely correct one — self-correcting only once
    // the person tried again after the real data had time to arrive.
    if (!dataLoaded) {
      setError("Still loading account data — please wait a moment and try again.");
      return;
    }
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
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={googleLoading}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium"
              style={{ background: "#FFFFFF", color: "#1F1F1F", fontFamily: FONT_BODY, opacity: googleLoading ? 0.6 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.4 36 26.9 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.6 40.6 16.3 45 24 45z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5C41.5 36.4 45 30.8 45 24c0-1.4-.1-2.5-.4-3.5z" /></svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
              <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>OR</span>
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
            </div>
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
              <GoldButton type="submit" onClick={submitSignUp}>
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
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={googleLoading}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium"
              style={{ background: "#FFFFFF", color: "#1F1F1F", fontFamily: FONT_BODY, opacity: googleLoading ? 0.6 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.4 36 26.9 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.6 40.6 16.3 45 24 45z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5C41.5 36.4 45 30.8 45 24c0-1.4-.1-2.5-.4-3.5z" /></svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
              <span className="text-[10px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>OR</span>
              <div className="h-px flex-1" style={{ background: "rgba(147,166,155,0.2)" }} />
            </div>
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
              <GoldButton type="submit" onClick={submitLogin}>
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

function AppLoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p>
    </div>
  );
}

// A small, floating language switcher shown to GUESTS viewing an
// invitation — previously the displayed language was fixed to whatever
// the couple set as default, with no way for a guest to pick a different
// one of the invitation's own enabled languages themselves.
function GuestLanguageSwitcher({ current, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed right-3 top-3 z-[60]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-semibold"
        style={{ background: "rgba(10,12,10,0.55)", color: "#F4EDE4", backdropFilter: "blur(4px)", fontFamily: FONT_BODY }}
      >
        {LANG_META[current]?.short || current.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-9 overflow-hidden rounded-lg" style={{ background: INK_2, border: "1px solid rgba(201,164,76,0.3)", minWidth: 130 }}>
          {options.map((code) => (
            <button
              key={code}
              onClick={() => { onChange(code); setOpen(false); }}
              className="block w-full px-3 py-2 text-left text-[12px]"
              style={{ color: current === code ? GOLD_SOFT : IVORY, background: current === code ? "rgba(201,164,76,0.12)" : "transparent", fontFamily: FONT_BODY }}
            >
              {LANG_META[code]?.label || code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// A minimal, single-screen RSVP page — separate from the full swipeable
// invitation experience. Shows a photo, a short greeting, and a Yes/No
// choice; picking Yes saves immediately to Supabase and shows the
// check-in QR code right there, no other pages to look at. Built for
// sharing a link straight to this via WhatsApp, when the couple wants
// guests to RSVP in one tap rather than browse the whole invitation.
function QuickRsvpPage({ slug }) {
  const [state, setState] = useState(null); // null=loading, false=not found, { snapshot, matchedUserId }
  const [name, setName] = useState("");
  const [choice, setChoice] = useState(null); // null | "yes" | "no"
  const [submitting, setSubmitting] = useState(false);
  const [checkinToken, setCheckinToken] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const draftRes = await persistentStorage.get("einvite:draft-core", false);
        const draft = draftRes?.value ? JSON.parse(draftRes.value) : { users: [] };
        const matchedUser = (draft.users || []).find((u) => u.invitationSlug === slug);
        if (!matchedUser) { setState(false); return; }

        const snapRes = await persistentStorage.get(`einvite:invitation-${matchedUser.id}`, false);
        const snapshot = snapRes?.value ? JSON.parse(snapRes.value) : { content: { cover: {} }, og: {}, pageBackgrounds: { cover: {} }, guestGroups: [] };
        setState({ snapshot, matchedUserId: matchedUser.id });
      } catch (err) {
        console.error("QuickRsvpPage: failed to load invitation:", err);
        setState(false);
      }
    })();
  }, [slug]);

  const submit = async (status) => {
    if (!state) return;
    setSubmitting(true);
    setError("");
    try {
      const cleanName = name.trim() || "Guest";
      const key = `einvite:invitation-${state.matchedUserId}`;
      const res = await persistentStorage.get(key, false);
      const latest = res?.value ? JSON.parse(res.value) : state.snapshot;
      const newGroup = {
        id: uid(), lastName: "", members: [{ id: uid(), name: cleanName, status }],
        additionalGuests: 0, table: "", phone: "", invitationSent: false, invitationViewed: true, updatedAt: Date.now(),
      };
      const updated = { ...latest, guestGroups: [newGroup, ...(latest.guestGroups || [])] };
      const saveResult = await persistentStorage.set(key, JSON.stringify(updated), false);
      if (!saveResult) throw new Error("Couldn't save your response — please try again.");

      setChoice(status);
      if (status === "yes") {
        const token = await createCheckinToken(slug, newGroup.id, cleanName);
        setCheckinToken(token);
      }
    } catch (err) {
      setError(err.message || "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === null) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p>
      </div>
    );
  }
  if (state === false) {
    return (
      <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>This invitation link couldn't be found.</p>
      </div>
    );
  }

  const c = state.snapshot.content?.cover || {};
  const photo = state.snapshot.og?.image || (hasActiveCustomImage(state.snapshot.pageBackgrounds?.cover) ? state.snapshot.pageBackgrounds.cover.image : null);
  const coupleNames = [c.name1, c.name2].filter(Boolean).join(" & ");

  return (
    <div style={{ minHeight: "100vh", background: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        {photo && (
          <img src={photo} alt="" style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", margin: "0 auto 20px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }} />
        )}
        <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 24, color: IVORY, marginBottom: 8 }}>{coupleNames || "You're Invited"}</h1>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 28 }}>
          {c.intro || "We'd love for you to join us — will you be attending?"}
        </p>

        {choice === "yes" && checkinToken ? (
          <div>
            <CheckCircle2 size={36} color={CHART_COLORS.yes} style={{ margin: "0 auto 10px" }} />
            <p style={{ color: IVORY, fontFamily: FONT_BODY, fontSize: 14, marginBottom: 16 }}>You're confirmed — see you there!</p>
            <div style={{ background: PAPER, borderRadius: 16, padding: 16, display: "inline-block" }}>
              <img src={qrCodeImageUrl(`https://${window.location.host}/checkin/${checkinToken}`, 160)} alt="Check-in QR code" style={{ display: "block" }} />
            </div>
            <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 10.5, marginTop: 10 }}>Show this code at the entrance</p>
          </div>
        ) : choice === "no" ? (
          <div>
            <XCircle size={36} color="#E29B9B" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: IVORY, fontFamily: FONT_BODY, fontSize: 14 }}>Thanks for letting us know — you'll be missed!</p>
          </div>
        ) : (
          <>
            <TextInput value={name} onChange={setName} placeholder="Your name" />
            {error && <p style={{ color: "#E29B9B", fontFamily: FONT_BODY, fontSize: 11.5, marginTop: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => submit("no")}
                disabled={submitting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 999, border: `1.5px solid rgba(226,155,155,0.5)`, color: "#E29B9B", fontFamily: FONT_BODY, fontWeight: 600, background: "transparent", opacity: submitting ? 0.6 : 1 }}
              >
                Not Attending
              </button>
              <button
                onClick={() => submit("yes")}
                disabled={submitting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 999, border: "none", color: INK, fontFamily: FONT_BODY, fontWeight: 700, background: GOLD, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Saving…" : "Attending"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckinPage({ token }) {
  const [checkin, setCheckin] = useState(null); // null=loading, false=invalid, {...}=result
  const [busy, setBusy] = useState(false);

  const load = async () => setCheckin((await getCheckinByToken(token)) ?? false);

  useEffect(() => { load(); }, [token]);

  const doCheckIn = async () => {
    setBusy(true);
    const marked = await markCheckedIn(token);
    // marked is null specifically when it was already checked in by the
    // time this ran (e.g. two people tapped Check In within the same
    // moment) — re-fetch either way so the screen always reflects the
    // real, current state rather than assuming success.
    await load();
    setBusy(false);
  };

  const doUndo = async () => {
    setBusy(true);
    await resetCheckin(token);
    await load();
    setBusy(false);
  };

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

  return (
    <div style={{ minHeight: "100vh", background: INK, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        {checkin.checked_in_at ? (
          <>
            <AlertTriangle size={44} color="#E0B84C" style={{ margin: "0 auto 14px" }} />
            <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: IVORY }}>Already Checked In</h1>
            <p className="mt-2 text-lg" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, fontWeight: 600 }}>{checkin.guest_names}</p>
            <p className="mt-2 text-[12px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Checked in at {new Date(checkin.checked_in_at).toLocaleString()}</p>
            <button
              onClick={doUndo}
              disabled={busy}
              className="mt-5 text-[11.5px] underline"
              style={{ color: MUTED, fontFamily: FONT_BODY }}
            >
              This wasn't a real check-in (scanned early by mistake) — undo it
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 size={48} color="#8FBFA3" style={{ margin: "0 auto 14px" }} />
            <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, color: IVORY }}>{checkin.guest_names}</h1>
            <p className="mt-2 text-[12.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>Not checked in yet. Tap below only once this guest has actually arrived.</p>
            <button
              onClick={doCheckIn}
              disabled={busy}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: GOLD, color: INK, fontFamily: FONT_BODY, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "Checking in…" : "Check In Now"}
            </button>
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
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      const url = await uploadImageToStorage(file, "networking-photos");
      setPhotoUrl(url);
    } catch (err) {
      setError(err.message || "Couldn't upload the photo — please try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setSubmitting(true);
    setError("");
    try {
      const guest = await registerNetworkingGuest(slug, { name, field, interests, linkedin, instagram, optedIn: true, photoUrl });
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
        <label className="mb-3 flex cursor-pointer items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ border: photoUrl ? `2px solid ${GOLD}` : `2px dashed rgba(147,166,155,0.5)`, background: photoUrl ? `url(${photoUrl}) center/cover` : "transparent" }}>
            {!photoUrl && <ImagePlus size={16} style={{ color: MUTED }} />}
          </div>
          <input type="file" accept="image/*" style={VISUALLY_HIDDEN} onChange={onUploadPhoto} disabled={photoUploading} />
          <span className="text-[12px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>{photoUploading ? "Uploading…" : photoUrl ? "Change photo" : "Add a photo (optional)"}</span>
        </label>
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
        <p className="mt-3 text-center text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
          The couple reviews new profiles before they're visible to other guests — you'll show up shortly after joining.
        </p>
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
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: g.photo_url ? `url(${g.photo_url}) center/cover` : INK_3 }}>
                {!g.photo_url && <Users size={15} style={{ color: MUTED }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[14px] font-semibold">{g.name}</div>
                  {g.score > 0 && <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(201,164,76,0.18)", color: GOLD_SOFT }}>Good match</span>}
                </div>
                {g.field && <div className="truncate text-[12px]" style={{ color: MUTED }}>{g.field}</div>}
                {g.interests && <div className="truncate text-[11px]" style={{ color: GOLD_SOFT, marginTop: 2 }}>{g.interests}</div>}
              </div>
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
  // Loads the shared decorative/script fonts used throughout every page
  // type — cover, family, RSVP, etc. — via a real <link rel="stylesheet">
  // tag injected once, here, at the very top of the component, before any
  // of the conditional early returns below (guest view, auth screen,
  // loading states). A useEffect placed here always runs on mount
  // regardless of which return path this component eventually takes,
  // which a <style>@import block sitting inside only ONE of those return
  // paths never did — that's what previously left the guest-facing
  // invitation and the login screen with none of these fonts loaded at
  // all. A real <link> tag is also strictly faster than @import: the
  // browser can start fetching it immediately in parallel with everything
  // else, rather than having to first fetch and parse the CSS that
  // contains the @import before it even discovers there's a font
  // stylesheet to fetch.
  useEffect(() => {
    const id = "einvite-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&family=Parisienne&family=Cairo:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,500&family=Marcellus&family=Great+Vibes&family=Dancing+Script:wght@400;600&family=Montserrat:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;500;600&family=PT+Serif:ital,wght@0,400;1,400&family=Alex+Brush&family=Moontime&family=Lora:ital,wght@0,400;0,600;1,400&family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Serif+Armenian:wght@400;600&display=swap";
    document.head.appendChild(link);
  }, []);

  const [view, setView] = useState("builder");
  const [content, setContent] = useState(defaultContent);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [locations, setLocations] = useState(defaultLocations);
  const [pageBackgrounds, setPageBackgrounds] = useState(defaultPageBackgrounds);
  // THE ACTUAL FIX for "pick a template, it reverts back": the initial page
  // load fetches each of the 10 pages' backgrounds one at a time, from
  // Supabase, sequentially — if the user picks a template (or edits a
  // background manually) before all 10 have finished, whichever ones were
  // still in flight would land AFTER the new choice and silently overwrite
  // it with the old, previously-saved value. This ref tracks whether the
  // user has made a manual change since mount; the load effect's own
  // callbacks check it and skip applying their (now-stale) result once true.
  const userChangedBackgroundsRef = useRef(false);
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
  const [layouts, setLayouts] = useState(() => Object.fromEntries(LANGS.map((l) => [l, DEFAULT_LAYOUTS])));
  const [customBlocks, setCustomBlocks] = useState(() => Object.fromEntries(LANGS.map((l) => [l, emptyCustomBlocks()])));

  // Undo/redo for position/layout edits (dragging, resizing, adding/
  // removing custom blocks). A checkpoint is captured a moment after
  // layouts or customBlocks stop changing — so one whole drag becomes one
  // undo step, not one step per pixel moved. isRestoringRef prevents an
  // undo/redo itself from being captured as a new checkpoint or clearing
  // the redo stack.
  const layoutHistoryRef = useRef([]);
  const layoutRedoRef = useRef([]);
  const isRestoringRef = useRef(false);
  const layoutHistoryTimerRef = useRef(null);
  useEffect(() => {
    if (isRestoringRef.current) { isRestoringRef.current = false; return; }
    layoutRedoRef.current = []; // any real new change invalidates whatever redo history existed
    if (layoutHistoryTimerRef.current) clearTimeout(layoutHistoryTimerRef.current);
    layoutHistoryTimerRef.current = setTimeout(() => {
      layoutHistoryRef.current = [...layoutHistoryRef.current, { layouts, customBlocks }].slice(-20); // cap so this can't grow unbounded over a long session
    }, 500);
    return () => clearTimeout(layoutHistoryTimerRef.current);
  }, [layouts, customBlocks]);
  const undoLayoutChange = () => {
    const history = layoutHistoryRef.current;
    if (history.length < 2) return; // nothing meaningfully earlier to go back to
    const current = history[history.length - 1];
    const target = history[history.length - 2]; // the last entry matches current state, so the one before it is the actual "previous" step
    layoutHistoryRef.current = history.slice(0, -1);
    layoutRedoRef.current = [...layoutRedoRef.current, current].slice(-20);
    isRestoringRef.current = true;
    setLayouts(target.layouts);
    setCustomBlocks(target.customBlocks);
  };
  const redoLayoutChange = () => {
    const redoStack = layoutRedoRef.current;
    if (redoStack.length === 0) return;
    const target = redoStack[redoStack.length - 1];
    layoutRedoRef.current = redoStack.slice(0, -1);
    layoutHistoryRef.current = [...layoutHistoryRef.current, target].slice(-20);
    isRestoringRef.current = true;
    setLayouts(target.layouts);
    setCustomBlocks(target.customBlocks);
  };
  // Admin-managed library of Intro-background options (photos/videos) —
  // set once, shared across every client, who each pick which one (if
  // any) they want as THEIR OWN intro background. Never copied into a
  // client's own saved data; only their choice (introMediaChoiceId,
  // stored per-client in `intro`) is.
  const [introMediaLibrary, setIntroMediaLibrary] = useState([]);
  // Designs the admin has saved directly from the Builder to appear on
  // /shop — same shape as an INVITATION_TEMPLATES entry (id, name, price,
  // coverImage, pageImages, coverNameFont, editOnWebsite: true), but
  // stored in Supabase instead of hardcoded in this file, so a new one
  // shows up on /shop immediately without editing any code.
  const [shopDesigns, setShopDesigns] = useState([]);
  const [globalAssets, setGlobalAssets] = useState([]); // [{ id, url, label }] — admin-uploaded images available to every client, own dedicated key like shopDesigns
  const GLOBAL_ASSETS_KEY = "einvite:global-assets";
  useEffect(() => {
    (async () => {
      try {
        const res = await persistentStorage.get(GLOBAL_ASSETS_KEY, false);
        if (res?.value) setGlobalAssets(JSON.parse(res.value));
      } catch {}
    })();
  }, []);
  // Mirrors globalAssets so saveGlobalAssets can read the up-to-date list
  // synchronously — setGlobalAssets's own updater-fn form runs on React's
  // own schedule, not necessarily before the very next line of code, so
  // capturing its result into a local variable to persist right after
  // calling it was a race: persistentStorage.set could (and, per the report
  // that follows, did) fire with `resolved` still undefined, uploading
  // "undefined" instead of the real list and making every new image vanish
  // on the next load.
  const globalAssetsRef = useRef([]);
  useEffect(() => { globalAssetsRef.current = globalAssets; }, [globalAssets]);
  // Takes either a next array or an updater fn (list) => nextList — the
  // updater form reads the up-to-date list (via the ref) instead of
  // whatever `globalAssets` a caller's closure happened to capture, so two
  // uploads started close together (each awaiting its own upload before
  // saving) can't silently clobber one another's addition.
  const saveGlobalAssets = async (next) => {
    const resolved = typeof next === "function" ? next(globalAssetsRef.current) : next;
    globalAssetsRef.current = resolved;
    setGlobalAssets(resolved);
    try {
      await persistentStorage.set(GLOBAL_ASSETS_KEY, JSON.stringify(resolved), false);
    } catch (err) {
      console.error("Failed to save global assets:", err);
    }
  };
  const addGlobalAsset = async (url, label) => {
    await saveGlobalAssets((list) => [...list, { id: uid(), url, label: label || "Untitled" }]);
  };
  const deleteGlobalAsset = async (id) => {
    await saveGlobalAssets((list) => list.filter((a) => a.id !== id));
  };
  const addGlobalAssetItem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToStorage(file, "global-assets");
      await addGlobalAsset(url, file.name);
    } catch (err) {
      alert(err.message || "Couldn't upload — please try again.");
    }
  };
  const addGlobalAssetToPage = (url) => {
    const stepKey = steps[safeIndex].key;
    const existingImages = customBlocks[activeLang][stepKey].filter((b) => b.type === "image").length;
    const offset = (existingImages % 4) * 8;
    const newBlock = { id: uid(), type: "image", url, x: 50 + offset, y: 50 + offset, width: 40 };
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const [showSaveAsShopDesign, setShowSaveAsShopDesign] = useState(false);
  const [editingShopDesignId, setEditingShopDesignId] = useState(null); // set while the admin is editing an existing shop design's styling directly in the Builder
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
  const [templateSwitching, setTemplateSwitching] = useState(false); // drives the fade overlay during a template switch
  const [swipeDirection, setSwipeDirection] = useState("vertical"); // "vertical" (swipe up) or "horizontal" (swipe left)
  const [transitionStyle, setTransitionStyle] = useState("slide"); // "slide" (current quick fade) or "stack" (slower, card-emerging-from-a-stack feel)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [og, setOg] = useState({ image: null, title: "", description: "" });
  const [guestGroups, setGuestGroups] = useState(seedGuestGroups);
  const [tables, setTables] = useState(seedTables);
  const [venueElements, setVenueElements] = useState([]); // [{ id, type: 'stage'|'danceFloor'|'entrance'|'lounge', x, y, width, height, label }]
  const [rsvpSettings, setRsvpSettings] = useState({ style: "classic", namesRequired: true, namesRequiredWhenDeclining: false, maxGuestsOpenInvite: 5, maxTotalRsvps: 0, showTotalAttending: true, enableGuestVoiceRecorder: true });
  const [openInviteLinks, setOpenInviteLinks] = useState([]); // [{ id, label, maxGuests }] — each is its own separately-tracked open invitation link, independent of the single shared one and of each other
  const addOpenInviteLink = (label, maxGuests) => {
    const newLink = { id: uid(), label: label.trim() || "Untitled link", maxGuests: Number(maxGuests) || 0 };
    setOpenInviteLinks((links) => [...links, newLink]);
  };
  const deleteOpenInviteLink = (id) => setOpenInviteLinks((links) => links.filter((l) => l.id !== id));
  const [integrations, setIntegrations] = useState({
    djUrl: "", djButtonLabel: "Request a Song", djHeading: "Song Requests", djSubtitle: "Have a song you want to hear tonight? Send it straight to the DJ.",
    networkingUrl: "", networkingButtonLabel: "Open Guest Networking", networkingHeading: "Meet the Other Guests", networkingSubtitle: "Discover guests who share your interests, and connect right from your phone.",
    livestreamUrl: "", livestreamButtonLabel: "Watch Live", livestreamHeading: "Join Us Live", livestreamSubtitle: "Can't be there in person? Watch the ceremony live, streamed just for you.",
    livestreamPaid: false, livestreamPrice: "$10", livestreamPaymentUrl: "",
    reminderFeatureUnlocked: false, reminderPaymentUrl: "",
  });
  const updateIntegrations = (patch) => setIntegrations((i) => ({ ...i, ...patch }));
  const [users, setUsers] = useState(seedUsers);
  const [siteDomain, setSiteDomain] = useState("core.einvite.me");
  const [actingAsUser, setActingAsUser] = useState(null);
  const [sessionCheckResolved, setSessionCheckResolved] = useState(false);
  const [coreDataLoaded, setCoreDataLoaded] = useState(false);
  // Separate from coreDataLoaded — every step's page background loads
  // through its own independent, un-awaited fetch (see the loadBg chain
  // below), specifically so the Cover page's background isn't stuck racing
  // nine other pages' images for bandwidth. That's the right way to get the
  // FIRST paint up fast, but it also means coreDataLoaded alone doesn't
  // guarantee every background has actually arrived yet — a builder canvas
  // gated only on it could navigate to, say, page 2 while page 2's own
  // background fetch is still in flight, and land on a blank/wrong-colored
  // page until that resolves a moment later.
  const [backgroundsLoaded, setBackgroundsLoaded] = useState(false);

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
    // THE ACTUAL FIX for "every refresh logs me out": this used to be an
    // independent fixed 6-second timer, completely disconnected from
    // whether the real data load had actually finished. If that load ever
    // took longer than 6 seconds (very plausible now, given how much data
    // this project has accumulated since that number was first chosen),
    // this fired prematurely, permanently gave up on restoring the
    // session, and an actually-still-logged-in client got shown the login
    // screen instead. Now this only ever fires a short grace period AFTER
    // coreDataLoaded has genuinely become true — so it can never give up
    // before the real load attempt has actually settled, no matter how
    // long that takes.
    if (!coreDataLoaded) return;
    const timeout = setTimeout(() => setSessionCheckResolved(true), 1500);
    return () => clearTimeout(timeout);
  }, [coreDataLoaded]);

  useEffect(() => {
    // THE ACTUAL FIX for "stuck on Still loading account data forever":
    // coreDataLoaded is normally set by the main load effect's own
    // try/catch/finally once persistentStorage.get(DRAFT_KEY) settles —
    // but if that fetch hangs indefinitely instead of cleanly resolving
    // or rejecting (a network issue that doesn't time out on its own, for
    // example), that finally block never runs at all, and coreDataLoaded
    // stays false forever. Without this, login would be permanently
    // stuck showing "still loading" with no way out, exactly as reported.
    // This one genuinely does need to be a fixed, independent timer —
    // it's the one thing that has no other signal to wait on.
    const timeout = setTimeout(() => setCoreDataLoaded(true), 12000);
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
    rsvpSettings: { style: "classic", namesRequired: true, namesRequiredWhenDeclining: false, maxGuestsOpenInvite: 5, maxTotalRsvps: 0, showTotalAttending: true, enableGuestVoiceRecorder: true },
    openInviteLinks: [],
    venueElements: [],
    integrations: {
      djUrl: "", djButtonLabel: "Request a Song", djHeading: "Song Requests", djSubtitle: "Have a song you want to hear tonight? Send it straight to the DJ.",
      networkingUrl: "", networkingButtonLabel: "Open Guest Networking", networkingHeading: "Meet the Other Guests", networkingSubtitle: "Discover guests who share your interests, and connect right from your phone.",
      livestreamUrl: "", livestreamButtonLabel: "Watch Live", livestreamHeading: "Join Us Live", livestreamSubtitle: "Can't be there in person? Watch the ceremony live, streamed just for you.",
    livestreamPaid: false, livestreamPrice: "$10", livestreamPaymentUrl: "",
    reminderFeatureUnlocked: false, reminderPaymentUrl: "",
    },
    intro: defaultIntroSettings,
    swipeDirection: "vertical", transitionStyle: "slide",
  });

  const getActiveSnapshot = () => ({
    content, timeline, locations, pageBackgrounds, music, rsvpSchedule, registry, enabledSteps, pageOrder,
    defaultLang, enabledLanguages, layouts, customBlocks, og, guestGroups, tables, rsvpSettings, integrations, intro,
    swipeDirection, transitionStyle, openInviteLinks, venueElements,
  });

  const applySnapshot = (snap) => {
    setContent(mergeContentWithDefaults(snap.content)); setTimeline(snap.timeline); setLocations(snap.locations);
    setPageBackgrounds(snap.pageBackgrounds); setMusic(snap.music); setRsvpSchedule(snap.rsvpSchedule);
    setRegistry(snap.registry); setEnabledSteps(snap.enabledSteps); setPageOrder(snap.pageOrder);
    setDefaultLang(snap.defaultLang); setEnabledLanguages(snap.enabledLanguages || LANGS); setLayouts(mergeLayoutsWithDefaults(snap.layouts)); setCustomBlocks(mergeCustomBlocksWithDefaults(snap.customBlocks));
    setOg(snap.og); setGuestGroups(snap.guestGroups); setTables(snap.tables || []); setRsvpSettings(snap.rsvpSettings);
    setIntegrations(snap.integrations); setIntro(snap.intro);
    setSwipeDirection(snap.swipeDirection || "vertical"); setTransitionStyle(snap.transitionStyle || "slide");
    setOpenInviteLinks(snap.openInviteLinks || []);
    setVenueElements(snap.venueElements || []);
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

  // THE ACTUAL FIX for "hide the last page while viewing it -> white
  // screen": the effect just below corrects activeIndex, but only AFTER a
  // render has already completed — on the very render where steps just
  // shrank (right after toggling a page's visibility), several places
  // read steps[activeIndex] directly and crash immediately, before this
  // effect gets a chance to run. safeIndex is clamped right here, at the
  // same time steps itself is known, so every read below (and every place
  // this gets passed down as a prop) is safe on that very first render —
  // not just eventually, after the effect corrects the underlying state.
  const safeIndex = Math.min(activeIndex, Math.max(0, steps.length - 1));

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
  const SHOP_DESIGNS_KEY = "einvite:shop-designs"; // separate top-level key — /shop fetches this directly, independent of the main draft
  const invitationKey = (id) => `einvite:invitation-${id}`;
  const MUSIC_AUDIO_KEY = "einvite:music-audio";

  const selectStep = (i) => { setActiveIndex(i); setVisited((v) => new Set(v).add(i)); setStarted(true); setSelectedBlockId(null); };
  const previewFromStart = () => { setActiveIndex(0); setStarted(false); };

  const updateContentSection = (stepKey, patch) =>
    setContent((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: { ...c[activeLang][stepKey], ...patch } } }));

  // Applies whatever fields the AI chat widget extracted from the
  // conversation (see ChatSupportWidget's onFillForm) onto this
  // invitation's real, live state — the Edge Function only ever hands
  // back plain extracted data; this is the one place that actually
  // writes it into the Builder.
  const applyAiFormData = (data) => {
    const coverPatch = {};
    if (data.partner1_name) coverPatch.name1 = data.partner1_name;
    if (data.partner2_name) coverPatch.name2 = data.partner2_name;
    if (data.intro_text) coverPatch.intro = data.intro_text;
    if (Object.keys(coverPatch).length) updateContentSection("cover", coverPatch);

    if (data.event_date) setRsvpSchedule((s) => ({ ...s, date: data.event_date }));

    const hasCeremonyInfo = data.ceremony_time || data.ceremony_location_name || data.ceremony_location_address;
    const hasReceptionInfo = data.reception_time || data.reception_location_name || data.reception_location_address;
    if (hasCeremonyInfo || hasReceptionInfo) {
      setLocations((list) => {
        const next = [...list];
        const applyEntry = (index, time, name, address) => {
          const existing = next[index] || { id: uid(), time: "", address: "", title: { en: "", ar: "", fr: "", es: "" } };
          next[index] = {
            ...existing,
            time: time || existing.time,
            address: address || existing.address,
            title: name ? { ...existing.title, [activeLang]: name } : existing.title,
          };
        };
        if (hasCeremonyInfo) applyEntry(0, data.ceremony_time, data.ceremony_location_name, data.ceremony_location_address);
        if (hasReceptionInfo) applyEntry(hasCeremonyInfo ? 1 : 0, data.reception_time, data.reception_location_name, data.reception_location_address);
        return next;
      });
    }
  };

  // Accepts either a next bg object or an updater fn (currentBg) => nextBg
  // — BackgroundPicker's upload needs the updater form so it merges onto
  // whatever bg is current when the (async, possibly slow) upload finishes,
  // not the bg from whenever the upload started.
  const setBgFor = (stepKey) => (bgOrUpdater) => {
    userChangedBackgroundsRef.current = true;
    setPageBackgrounds((p) => ({
      ...p,
      [stepKey]: typeof bgOrUpdater === "function" ? bgOrUpdater(p[stepKey]) : bgOrUpdater,
    }));
  };

  const moveBlock = (stepKey, blockId, pos) =>
    setLayouts((l) => ({ ...l, [activeLang]: { ...l[activeLang], [stepKey]: { ...l[activeLang][stepKey], [blockId]: { ...l[activeLang][stepKey][blockId], ...pos } } } }));

  const updateBlockStyle = (stepKey, blockId, patch) =>
    setLayouts((l) => ({ ...l, [activeLang]: { ...l[activeLang], [stepKey]: { ...l[activeLang][stepKey], [blockId]: { ...l[activeLang][stepKey][blockId], ...patch } } } }));

  // Each location on the Locations slide is independently draggable (its
  // own x/y on the item itself), unlike other slides' single shared "list"
  // block — moving one was moving every location together, which is what
  // was reported as them all being "glued" into one group.
  const moveLocationItem = (id, pos) =>
    setLocations((list) => list.map((it) => (it.id === id ? { ...it, ...pos } : it)));
  const removeLocationItem = (id) => setLocations((list) => list.filter((it) => it.id !== id));
  const duplicateLocationItem = (id) => {
    setLocations((list) => {
      const index = list.findIndex((it) => it.id === id);
      if (index === -1) return list;
      const clone = { ...list[index], id: uid(), x: Math.min(92, (list[index].x ?? 50) + 6), y: Math.min(88, (list[index].y ?? 50) + 6) };
      const next = [...list];
      next.splice(index + 1, 0, clone);
      setSelectedBlockId(`loc:${clone.id}`);
      return next;
    });
  };

  const resetLayout = () => {
    const key = steps[safeIndex].key;
    setLayouts((l) => ({ ...l, [activeLang]: { ...l[activeLang], [key]: { ...DEFAULT_LAYOUTS[key] } } }));
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [key]: [] } }));
    setSelectedBlockId(null);
  };

  // Load any previously saved draft once, on first mount. Uploaded audio/video use
  // blob: URLs that only live for the current browser tab, so they can't be restored
  // here — re-upload after loading a draft. Images are saved as data URLs and do restore.
  useEffect(() => {
    if (!persistentStorage.available()) { setCoreDataLoaded(true); setBackgroundsLoaded(true); return; } // no storage backend at all in this environment — nothing to wait for
    let cancelled = false;
    (async () => {
      try {
        const res = await persistentStorage.get(DRAFT_KEY, false);
        if (cancelled || !res?.value) return;
        const d = JSON.parse(res.value);
        if (d.content) setContent(mergeContentWithDefaults(d.content));
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
        if (d.layouts) setLayouts(mergeLayoutsWithDefaults(d.layouts));
        if (d.customBlocks) setCustomBlocks(mergeCustomBlocksWithDefaults(d.customBlocks));
        if (d.openInviteLinks) setOpenInviteLinks(d.openInviteLinks);
        if (d.venueElements) setVenueElements(d.venueElements);
        if (d.guestGroups) setGuestGroups(d.guestGroups);
        if (d.tables) setTables(d.tables);
        if (d.rsvpSettings) setRsvpSettings((s) => ({ ...s, ...d.rsvpSettings }));
        if (d.integrations) setIntegrations((i) => ({ ...i, ...d.integrations }));
        if (d.swipeDirection) setSwipeDirection(d.swipeDirection);
        if (d.transitionStyle) setTransitionStyle(d.transitionStyle);
        if (Array.isArray(d.invitationIds) && d.invitationIds.length) {
          // Only the ACTIVE client's own snapshot needs to block initial
          // load — it's what corrects potentially-stale values above with
          // whatever was actually saved for them since (see "THE ACTUAL
          // FIX" below). The other clients' snapshots are only needed for
          // the Users list's guest-count badges and for instant switching
          // later, so they load separately in the background further down,
          // without delaying this page becoming usable. Fetching every
          // single client's full snapshot right here, on every load,
          // regardless of which one was even needed yet, was what made a
          // refresh (and the Users list) get slower as the client list grew.
          const activeRes = d.activeInvitationId ? await persistentStorage.get(invitationKey(d.activeInvitationId), false) : null;
          if (!cancelled && activeRes?.value) {
            try {
              const activeSnapshot = JSON.parse(activeRes.value);
              setInvitationsStore((s) => ({ ...s, [d.activeInvitationId]: activeSnapshot }));
              // THE ACTUAL FIX: the main draft payload's own copies of content,
              // customBlocks, pageBackgrounds, layouts, etc. (set from d.xxx
              // above) reflect whatever was active at the moment of the LAST
              // "Save invitation" click — not necessarily the currently active
              // client, since the owner may have switched to a different
              // client's invitation, made edits there (custom images added,
              // text changed, a background swapped), and reloaded or
              // refreshed before clicking Save again. Each client's own data
              // IS already saved correctly, immediately, to its own per-client
              // key (via switchActiveInvitation, addGuestGroup, an RSVP
              // submission, etc.) — so re-applying it here, AFTER the stale
              // main-payload values above, is what makes the active client's
              // real, current data win instead of silently reverting to
              // whichever client happened to be active at the last save.
              if (activeSnapshot.guestGroups) setGuestGroups(activeSnapshot.guestGroups);
              if (activeSnapshot.customBlocks) setCustomBlocks(mergeCustomBlocksWithDefaults(activeSnapshot.customBlocks));
              if (activeSnapshot.openInviteLinks) setOpenInviteLinks(activeSnapshot.openInviteLinks);
              if (activeSnapshot.venueElements) setVenueElements(activeSnapshot.venueElements);
              if (activeSnapshot.content) setContent(mergeContentWithDefaults(activeSnapshot.content));
              if (activeSnapshot.pageBackgrounds) setPageBackgrounds(activeSnapshot.pageBackgrounds);
              if (activeSnapshot.layouts) setLayouts(mergeLayoutsWithDefaults(activeSnapshot.layouts));
              if (activeSnapshot.timeline) setTimeline(activeSnapshot.timeline);
              if (activeSnapshot.locations) setLocations(activeSnapshot.locations);
              if (activeSnapshot.registry) setRegistry(activeSnapshot.registry);
              if (activeSnapshot.tables) setTables(activeSnapshot.tables);
              if (activeSnapshot.rsvpSettings) setRsvpSettings(activeSnapshot.rsvpSettings);
              if (activeSnapshot.integrations) setIntegrations(activeSnapshot.integrations);
              if (activeSnapshot.intro) setIntro(activeSnapshot.intro);
              if (activeSnapshot.og) setOg(activeSnapshot.og);
              if (activeSnapshot.music) setMusic(activeSnapshot.music);
              if (activeSnapshot.rsvpSchedule) setRsvpSchedule(activeSnapshot.rsvpSchedule);
              if (activeSnapshot.enabledSteps) setEnabledSteps(activeSnapshot.enabledSteps);
              if (Array.isArray(activeSnapshot.pageOrder)) setPageOrder(activeSnapshot.pageOrder);
              if (activeSnapshot.defaultLang) setDefaultLang(activeSnapshot.defaultLang);
              if (activeSnapshot.enabledLanguages) setEnabledLanguages(activeSnapshot.enabledLanguages);
              if (activeSnapshot.swipeDirection) setSwipeDirection(activeSnapshot.swipeDirection);
              if (activeSnapshot.transitionStyle) setTransitionStyle(activeSnapshot.transitionStyle);
            } catch {}
          }
          // The rest of the clients — fire-and-forget, populates
          // invitationsStore progressively as each one resolves instead of
          // blocking coreDataLoaded on all of them.
          const otherIds = d.invitationIds.filter((id) => id !== d.activeInvitationId);
          if (otherIds.length) {
            (async () => {
              const results = await Promise.allSettled(otherIds.map((id) => persistentStorage.get(invitationKey(id), false)));
              if (cancelled) return;
              const restored = {};
              otherIds.forEach((id, i) => {
                const r = results[i];
                if (r.status === "fulfilled" && r.value?.value) {
                  try { restored[id] = JSON.parse(r.value.value); } catch {} // skip a corrupted individual entry rather than failing the whole batch
                }
              });
              setInvitationsStore((s) => ({ ...s, ...restored }));
            })();
          }
        }
        if (d.activeInvitationId) setActiveInvitationId(d.activeInvitationId);
        if (d.users) setUsers(d.users);
        if (Array.isArray(d.introMediaLibrary)) setIntroMediaLibrary(d.introMediaLibrary);
        // shopDesigns loads separately below, from its own dedicated key —
        // see SHOP_DESIGNS_KEY — since /shop (a completely separate page
        // mount) needs to fetch the exact same data independently, without
        // loading this whole draft.
        // siteDomain is intentionally no longer loaded from saved data —
        // it's fixed to core.einvite.me (set in useState above) so an old
        // save from before that was the default can't override it.
        if (d.ogText) setOg((o) => ({ ...o, title: d.ogText.title, description: d.ogText.description }));
        if (d.intro) setIntro((i) => ({ ...i, ...d.intro }));
        if (d.musicMeta) setMusic((m) => ({ ...m, enabled: d.musicMeta.enabled, name: d.musicMeta.name }));
      } catch {
        // No saved draft yet — start fresh with the defaults.
      } finally {
        if (!cancelled) setCoreDataLoaded(true);
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
        if (cancelled || userChangedBackgroundsRef.current || !res?.value) return;
        const bg = JSON.parse(res.value);
        setPageBackgrounds((p) => ({ ...p, [key]: bg }));
      } catch {}
    })();
    loadBg(firstStep.key).then(() => {
      Promise.allSettled(restSteps.map(({ key }) => loadBg(key))).then(() => {
        if (!cancelled) setBackgroundsLoaded(true);
      });
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
        const res = await persistentStorage.get(SHOP_DESIGNS_KEY, false);
        if (cancelled || !res?.value) return;
        setShopDesigns(JSON.parse(res.value));
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
    // THE ACTUAL FIX: `users` was being written straight from this
    // browser's own local state on every single content save — not just
    // ones that actually touch the user list. If ANY client (or the
    // owner) signed up a new account in a DIFFERENT browser/tab after
    // this one loaded, this session's local `users` wouldn't know about
    // them — and saving invitation content here would silently overwrite
    // the server's users list with this older, smaller one, permanently
    // losing every account that signed up since. Reading the server's
    // current users list right before saving, and only reconciling this
    // browser's own known edits onto it, is what actually prevents that.
    let usersToSave = users;
    try {
      const res = await persistentStorage.get(DRAFT_KEY, false);
      const latestUsers = res?.value ? JSON.parse(res.value).users : null;
      if (Array.isArray(latestUsers)) {
        const localById = new Map(users.map((u) => [u.id, u]));
        const merged = latestUsers.map((u) => localById.get(u.id) || u); // this browser's own edits to a known user win; anything server-only stays
        const localOnlyNew = users.filter((u) => !latestUsers.some((lu) => lu.id === u.id)); // a user this browser created but the server doesn't have yet
        usersToSave = [...localOnlyNew, ...merged];
      }
    } catch {
      // Couldn't fetch the latest — fall back to this browser's own copy
      // rather than blocking the save entirely.
    }
    const invitationIds = Object.keys({ ...invitationsStore, [activeInvitationId]: true });
    const corePayload = {
      content, timeline, locations, registry, enabledSteps, pageOrder, rsvpSchedule, defaultLang, enabledLanguages, layouts,
      guestGroups, tables, rsvpSettings, users: usersToSave, integrations, siteDomain, swipeDirection, transitionStyle, introMediaLibrary,
      invitationIds, activeInvitationId, // the actual snapshots are saved separately below, one key per client
      ogText: { title: og.title, description: og.description },
      intro: { type: intro.type, icon: intro.icon, animationStyle: intro.animationStyle, sealDesign: intro.sealDesign, introMediaChoiceId: intro.introMediaChoiceId, revealHoldMs: intro.revealHoldMs }, // media (image or video) saved separately below via introBgKey
      musicMeta: { enabled: music.enabled, name: music.name }, // url saved separately below — see MUSIC_AUDIO_KEY
    };
    const imageJobs = [
      persistentStorage.set(DRAFT_KEY, JSON.stringify(corePayload), false),
      ...ALL_STEPS.map(({ key }) => persistentStorage.set(bgKey(key), JSON.stringify(pageBackgrounds[key]), false)),
      // Every language, not just ones with media set — filtering out a lang
      // with no media meant deleting it never actually wrote anything here,
      // so the OLD value already saved under that language's key was never
      // overwritten: reloading the page fetched that stale value right back,
      // making a "removed" background reappear after every refresh.
      ...LANGS.map((lang) => persistentStorage.set(introBgKey(lang), JSON.stringify(intro.media[lang] || null), false)),
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
    const stepKey = steps[safeIndex].key;
    // Staggers each new text block diagonally instead of always spawning at
    // dead center — a second block landing exactly on top of the first (then
    // both snapping back to the same center-guide) made them nearly
    // impossible to grab and separate. Same offset pattern addCustomImage
    // already uses below.
    const existingTextBlocks = customBlocks[activeLang][stepKey].filter((b) => b.type === "text").length;
    const offset = (existingTextBlocks % 4) * 8;
    const newBlock = { id: uid(), type: "text", text: "New text", x: 50 + offset, y: 50 + offset, width: 29, fontFamily: null, color: null, fontSize: 16 };
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const addCustomImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stepKey = steps[safeIndex].key;
    const addBlock = (url) => {
      const existingImages = customBlocks[activeLang][stepKey].filter((b) => b.type === "image").length;
      const offset = (existingImages % 4) * 8; // small staggered offset so new images don't land exactly on top of existing ones
      const newBlock = { id: uid(), type: "image", url, x: 50 + offset, y: 50 + offset, width: 40 };
      setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
      setSelectedBlockId(`custom:${newBlock.id}`);
    };
    try {
      // Uploaded to Storage (not embedded as a base64 data URI) so this
      // block only ever adds a short URL to the saved design, not the whole
      // compressed photo — a design with several of these used to bloat the
      // saved payload by the full size of every one of them, which is what
      // made both saving and loading the whole design slower the more
      // photos accumulated across the template.
      addBlock(await uploadImageToStorage(file, "invitation-photos", 2400, 0.92));
    } catch {
      // Either readImageCompressed couldn't decode this file at all — the
      // browser genuinely can't display this image format (HEIC/HEIF
      // photos straight off an iPhone are the common case) — or the
      // Storage upload itself failed (network, or the "invitation-photos"
      // bucket doesn't exist yet). Embedding the raw, undecodable file as a
      // data URI anyway used to "succeed" silently: it created a block with
      // no error, but nothing ever rendered — invisible on the canvas AND
      // in this panel's own thumbnail, with no visible handle left to
      // select, drag, or delete it by. Failing loudly here is what actually
      // fixes that stuck state.
      alert("Couldn't add that image — either this photo format isn't supported by the browser (common for HEIC/HEIF straight off an iPhone), or the upload failed. Convert it to JPG/PNG, check your connection, and try again.");
    }
  };
  // Admin-only: adds one photo or video to the shared Intro-background
  // library — every client sees this same library and picks (or removes)
  // their own choice from it; nothing here is copied into a client's own
  // saved data, only their choice of which library item to use.
  const addIntroLibraryItem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isGif = file.type === "image/gif";
    try {
      const url = isVideo ? await uploadVideoToStorage(file) : await uploadImageToStorage(file, "site-decorations");
      const posterUrl = isGif ? await uploadGifPosterFrame(file, "site-decorations") : null;
      const newItem = { id: uid(), type: isVideo ? "video" : "image", url, posterUrl, name: file.name };
      setIntroMediaLibrary((list) => [...list, newItem]);
    } catch (err) {
      alert(err.message || "Couldn't upload — please try again.");
    }
  };
  const removeIntroLibraryItem = (id) => {
    setIntroMediaLibrary((list) => list.filter((item) => item.id !== id));
    // A client who had this item picked reverts to no background choice —
    // otherwise they'd be silently left pointing at a URL that no longer
    // exists in the library.
    setIntro((i) => ({
      ...i,
      introMediaChoiceId: i.introMediaChoiceId === id ? null : i.introMediaChoiceId,
    }));
  };
  // Admin-only: captures everything about the CURRENT invitation's visual
  // style — every page's own background image, and the Cover page's name
  // fonts/color if the admin customized them — as a brand new, independent
  // design others can buy on /shop. This never touches or references the
  // admin's own invitation content (names, dates, etc.) going forward; it's
  // a one-time snapshot of the STYLE only. Saved straight to Supabase so
  // /shop (a completely separate page) sees it right away, without
  // depending on a "Save invitation" click.
  const saveCurrentAsShopDesign = async (name, price, canvaUrl) => {
    const pageImages = Object.fromEntries(
      Object.keys(pageBackgrounds)
        .filter((key) => key !== "cover" && hasActiveCustomImage(pageBackgrounds[key]))
        .map((key) => [key, pageBackgrounds[key].image])
    );
    // Captured regardless of whether a real photo is set — this is what
    // lets the shop preview show the invitation's actual color/gradient
    // when there's no uploaded image, instead of a generic placeholder.
    const pagePresets = Object.fromEntries(
      Object.keys(pageBackgrounds).map((key) => [key, pageBackgrounds[key]?.preset || null])
    );
    const namesLayout = layouts?.cover?.names || {};
    const newDesign = {
      id: `shop-${uid()}`,
      name,
      description: "",
      price: Number(price) || 0,
      coverImage: hasActiveCustomImage(pageBackgrounds.cover) ? pageBackgrounds.cover.image : null,
      coverBackdropColor: pageBackgrounds.cover?.backdropColor || null,
      coverPreset: pagePresets.cover,
      pageImages,
      pagePresets,
      coverNameFont: namesLayout.fontFamily || null,
      coverName1Font: namesLayout.name1FontFamily || null,
      coverName2Font: namesLayout.name2FontFamily || null,
      coverAmpersandFont: namesLayout.ampersandFontFamily || null,
      coverNameColor: namesLayout.color || null,
      gateAnimationStyle: intro.animationStyle || "floatingHearts",
      gateIcon: intro.icon || "heart",
      eventTypes: ["wedding", "birthday", "baptism", "babyShower", "quinceanera"],
      editOnWebsite: !canvaUrl,
      canvaTemplateUrl: canvaUrl || null,
      previewVideo: null,
    };
    const nextList = [...shopDesigns, newDesign];
    setShopDesigns(nextList);
    try {
      await persistentStorage.set(SHOP_DESIGNS_KEY, JSON.stringify(nextList), false);
    } catch {
      alert("Saved locally, but couldn't sync to the server — try again in a moment.");
    }
    return newDesign;
  };
  // Attaches a preview video to a specific shop design — same effect as
  // the previewVideo field already set on design-1/3/5, just settable
  // per admin-created design instead of hardcoded.
  const uploadShopDesignVideo = async (designId, file) => {
    if (!file) return;
    try {
      const url = await uploadVideoToStorage(file);
      await updateShopDesign(designId, { previewVideo: url });
    } catch (err) {
      alert(err.message || "Couldn't upload the video — please try again.");
    }
  };
  // and writes it back onto the design being edited (editingShopDesignId),
  // keeping its existing name and price untouched.
  const updateCurrentStylingOnShopDesign = async () => {
    if (!editingShopDesignId) return;
    const pageImages = Object.fromEntries(
      Object.keys(pageBackgrounds)
        .filter((key) => key !== "cover" && hasActiveCustomImage(pageBackgrounds[key]))
        .map((key) => [key, pageBackgrounds[key].image])
    );
    const pagePresets = Object.fromEntries(
      Object.keys(pageBackgrounds).map((key) => [key, pageBackgrounds[key]?.preset || null])
    );
    const namesLayout = layouts?.cover?.names || {};
    await updateShopDesign(editingShopDesignId, {
      coverImage: hasActiveCustomImage(pageBackgrounds.cover) ? pageBackgrounds.cover.image : null,
      coverBackdropColor: pageBackgrounds.cover?.backdropColor || null,
      coverPreset: pagePresets.cover,
      pageImages,
      pagePresets,
      coverNameFont: namesLayout.fontFamily || null,
      coverName1Font: namesLayout.name1FontFamily || null,
      coverName2Font: namesLayout.name2FontFamily || null,
      coverAmpersandFont: namesLayout.ampersandFontFamily || null,
      coverNameColor: namesLayout.color || null,
      gateAnimationStyle: intro.animationStyle || "floatingHearts",
      gateIcon: intro.icon || "heart",
    });
    setEditingShopDesignId(null);
  };
  const updateShopDesign = async (id, patch) => {
    const exists = shopDesigns.some((d) => d.id === id);
    const nextList = exists
      ? shopDesigns.map((d) => (d.id === id ? { ...d, ...patch } : d))
      : (() => {
          // First edit of a hardcoded template — create a Supabase-saved
          // override starting from its hardcoded data, so future loads use
          // this version instead of the original in the code.
          const base = INVITATION_TEMPLATES.find((t) => t.id === id);
          return base ? [...shopDesigns, { ...base, ...patch }] : shopDesigns;
        })();
    setShopDesigns(nextList);
    try {
      await persistentStorage.set(SHOP_DESIGNS_KEY, JSON.stringify(nextList), false);
    } catch {
      alert("Updated locally, but couldn't sync to the server — try again in a moment.");
    }
  };
  const deleteShopDesign = async (id) => {
    const nextList = shopDesigns.filter((d) => d.id !== id);
    setShopDesigns(nextList);
    try {
      await persistentStorage.set(SHOP_DESIGNS_KEY, JSON.stringify(nextList), false);
    } catch {
      alert("Deleted locally, but couldn't sync to the server — try again in a moment.");
    }
  };
  // Loads an existing shop design's styling directly into the CURRENT
  // Builder session (the admin's own invitation) so it can be edited
  // visually exactly like any other invitation — dragging blocks,
  // swapping page backgrounds, adjusting fonts. Nothing here touches the
  // admin's own actual content (names, dates); only the visual styling
  // pieces a shop design is made of. Saving afterward (via the "Update
  // Shop Design" button, shown while editingShopDesignId is set) writes
  // the current styling back onto this same design.
  const loadShopDesignForEditing = (design) => {
    setPageBackgrounds((prev) => {
      const next = { ...prev };
      if (design.coverImage) {
        next.cover = { mode: "photo", preset: prev.cover?.preset, image: design.coverImage, backdropColor: design.coverBackdropColor || null, darken: 0 };
      }
      if (design.pageImages) {
        for (const [key, image] of Object.entries(design.pageImages)) {
          if (image) next[key] = { mode: "photo", preset: prev[key]?.preset, image, backdropColor: null, darken: 0 };
        }
      }
      return next;
    });
    userChangedBackgroundsRef.current = true;
    if (design.coverNameFont || design.coverName1Font || design.coverNameColor) {
      setLayouts((l) => Object.fromEntries(LANGS.map((lg) => [lg, {
        ...l[lg],
        cover: {
          ...l[lg]?.cover,
          names: {
            ...l[lg]?.cover?.names,
            fontFamily: design.coverNameFont || l[lg]?.cover?.names?.fontFamily,
            name1FontFamily: design.coverName1Font || l[lg]?.cover?.names?.name1FontFamily,
            name2FontFamily: design.coverName2Font || l[lg]?.cover?.names?.name2FontFamily,
            ampersandFontFamily: design.coverAmpersandFont || l[lg]?.cover?.names?.ampersandFontFamily,
            color: design.coverNameColor || l[lg]?.cover?.names?.color,
          },
        },
      }])));
    }
    setIntro((i) => ({ ...i, animationStyle: design.gateAnimationStyle || i.animationStyle, icon: design.gateIcon || i.icon }));
    setEditingShopDesignId(design.id);
    setShowSaveAsShopDesign(false);
  };
  const addCustomVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const stepKey = steps[safeIndex].key;
    try {
      const url = await uploadVideoToStorage(file);
      const existingVideos = customBlocks[activeLang][stepKey].filter((b) => b.type === "video").length;
      const offset = (existingVideos % 4) * 8; // small staggered offset so new videos don't land exactly on top of existing ones
      const newBlock = { id: uid(), type: "video", url, x: 50 + offset, y: 50 + offset, width: 80 };
      setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
      setSelectedBlockId(`custom:${newBlock.id}`);
    } catch (err) {
      alert(err.message || "Couldn't upload the video — please try again.");
    }
  };
  const addCustomIcon = (iconKey) => {
    const stepKey = steps[safeIndex].key;
    const newBlock = { id: uid(), type: "icon", icon: iconKey, x: 50, y: 50, iconSize: 32, color: null };
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const addCustomDivider = (orientation = "horizontal") => {
    const stepKey = steps[safeIndex].key;
    const newBlock = { id: uid(), type: "divider", orientation, x: 50, y: 50, width: 40, color: null };
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const addCustomLine = (orientation = "horizontal") => {
    const stepKey = steps[safeIndex].key;
    const newBlock = { id: uid(), type: "line", orientation, x: 50, y: 50, length: 100, thickness: 2, color: null };
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: [...c[activeLang][stepKey], newBlock] } }));
    setSelectedBlockId(`custom:${newBlock.id}`);
  };
  const updateCustomBlock = (stepKey, id, patch) =>
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: c[activeLang][stepKey].map((b) => (b.id === id ? { ...b, ...patch } : b)) } }));
  const moveCustomBlock = (stepKey, id, pos) => updateCustomBlock(stepKey, id, pos);
  const removeCustomBlock = (stepKey, id) => {
    setCustomBlocks((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: c[activeLang][stepKey].filter((b) => b.id !== id) } }));
    setSelectedBlockId((sel) => (sel === `custom:${id}` ? null : sel));
  };
  const duplicateCustomBlock = (stepKey, id) => {
    setCustomBlocks((c) => {
      const list = c[activeLang][stepKey];
      const index = list.findIndex((b) => b.id === id);
      if (index === -1) return c;
      // Small offset so the copy doesn't land exactly on top of the
      // original — same nudge addCustomText/addCustomImage use for new
      // blocks, so a duplicate is immediately visible and grabbable.
      const clone = { ...list[index], id: uid(), x: Math.min(92, (list[index].x ?? 50) + 6), y: Math.min(88, (list[index].y ?? 50) + 6) };
      const next = [...list];
      next.splice(index + 1, 0, clone);
      setSelectedBlockId(`custom:${clone.id}`);
      return { ...c, [activeLang]: { ...c[activeLang], [stepKey]: next } };
    });
  };
  // Custom blocks render in array order (later = drawn on top), so
  // reordering the array IS the layer control. "front"/"back" move the
  // block all the way to one end; "forward"/"backward" swap it one step
  // with its neighbor.
  const reorderCustomBlock = (stepKey, id, action) => {
    setCustomBlocks((c) => {
      const list = c[activeLang][stepKey];
      const index = list.findIndex((b) => b.id === id);
      if (index === -1) return c;
      const reordered = [...list];
      const [item] = reordered.splice(index, 1);
      // "front"/"back" cross all the way past the page's own structural
      // content (titles, icons, the timeline list, etc.), not just past
      // other custom blocks — behindContent is what actually makes that
      // possible; see its render split in PhonePreview. Without it, every
      // custom block always rendered after (so always on top of) every
      // structural block regardless of array position, so "send to back"
      // visibly did nothing once a custom block was layered against page
      // content rather than another custom block.
      if (action === "front") { reordered.push({ ...item, behindContent: false }); }
      else if (action === "back") { reordered.unshift({ ...item, behindContent: true }); }
      else if (action === "forward") reordered.splice(Math.min(index + 1, reordered.length), 0, item);
      else if (action === "backward") reordered.splice(Math.max(index - 1, 0), 0, item);
      return { ...c, [activeLang]: { ...c[activeLang], [stepKey]: reordered } };
    });
  };

  const toggleLayoutEditMode = () => setLayoutEditMode((v) => { if (v) setSelectedBlockId(null); return !v; });

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("That audio file is quite large (over 20MB) — try a shorter clip or a more compressed format (MP3 rather than WAV) for a smoother experience.");
      return;
    }
    try {
      // Uploaded to Storage and referenced by its URL, not read into a base64
      // data URI kept in this invitation's own saved JSON — same fix, same
      // reason, as the intro video/GIF background earlier: a multi-MB base64
      // string got re-sent in full on every single "Save" and re-fetched in
      // full on every page load (a ~1.2MB audio file alone was taking
      // 15-20+ seconds to load from kv_store), which is what was making
      // the whole editor feel slow to open. Reuses the custom-videos bucket
      // (already has the right Storage policies) rather than needing a new
      // bucket + its own RLS setup.
      const url = await uploadVideoToStorage(file);
      setMusic((m) => ({ ...m, url, name: file.name, enabled: true }));
    } catch (err) {
      alert(err.message || "Couldn't upload — please try again.");
    }
  };

  const guestGroupsSaveTimeout = useRef(null);
  /** Debounced save for guestGroups — waits for a short pause in edits before actually writing to Supabase, so typing in a field doesn't trigger a write per keystroke. */
  const saveGuestGroupsDebounced = (newList) => {
    if (guestGroupsSaveTimeout.current) clearTimeout(guestGroupsSaveTimeout.current);
    guestGroupsSaveTimeout.current = setTimeout(async () => {
      if (!persistentStorage.available()) return;
      try {
        const snapshot = { ...getActiveSnapshot(), guestGroups: newList };
        const ok = await persistentStorage.set(invitationKey(activeInvitationId), JSON.stringify(snapshot), false);
        if (!ok) console.error(`saveGuestGroupsDebounced: save returned falsy for invitation "${activeInvitationId}".`);
      } catch (err) {
        console.error(`saveGuestGroupsDebounced: failed to save for invitation "${activeInvitationId}":`, err);
      }
    }, 1200);
  };

  const addGuestGroup = async (g) => {
    const newGuestGroups = [g, ...guestGroups];
    setGuestGroups(newGuestGroups);
    // THE ACTUAL FIX: persist immediately, don't rely on the owner
    // remembering to click "Save invitation" afterward. getActiveSnapshot()
    // isn't used directly here because its guestGroups field wouldn't yet
    // reflect this update — the setGuestGroups call above hasn't committed
    // at this point in execution (React state updates aren't synchronous)
    // — so newGuestGroups is used explicitly instead.
    if (persistentStorage.available()) {
      try {
        const snapshot = { ...getActiveSnapshot(), guestGroups: newGuestGroups };
        const ok = await persistentStorage.set(invitationKey(activeInvitationId), JSON.stringify(snapshot), false);
        if (!ok) console.error(`addGuestGroup: save returned falsy for invitation "${activeInvitationId}".`);
      } catch (err) {
        console.error(`addGuestGroup: failed to save guest to Supabase for invitation "${activeInvitationId}":`, err);
      }
    }
  };
  const updateGuestGroup = (id, patch) => {
    const newList = guestGroups.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g));
    setGuestGroups(newList);
    saveGuestGroupsDebounced(newList);
  };
  const deleteGuestGroup = (id) => {
    const newList = guestGroups.filter((g) => g.id !== id);
    setGuestGroups(newList);
    saveGuestGroupsDebounced(newList);
  };
  const moveGuestGroup = (id, direction) => {
    const i = guestGroups.findIndex((g) => g.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= guestGroups.length) return;
    const newList = [...guestGroups];
    [newList[i], newList[j]] = [newList[j], newList[i]];
    setGuestGroups(newList);
    saveGuestGroupsDebounced(newList);
  };

  const updateRsvpSettings = (patch) => setRsvpSettings((s) => ({ ...s, ...patch }));

  const addTable = (name, capacity, shape = "round") =>
    setTables((list) => [...list, { id: uid(), name: name.trim() || "New table", capacity: Math.max(1, capacity || 8), shape, x: 60 + (list.length % 5) * 90, y: 60 + Math.floor(list.length / 5) * 110 }]);
  const updateTable = (id, patch) => setTables((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const deleteTable = (id) => {
    setTables((list) => list.filter((t) => t.id !== id));
    setGuestGroups((list) => list.map((g) => (g.tableId === id ? { ...g, tableId: null } : g)));
  };
  const assignGuestToTable = (groupId, tableId) => setGuestGroups((list) => list.map((g) => (g.id === groupId ? { ...g, tableId } : g)));

  const VENUE_ELEMENT_DEFAULTS = {
    stage: { label: "Stage", width: 140, height: 60 },
    danceFloor: { label: "Dance Floor", width: 130, height: 130 },
    entrance: { label: "Entrance", width: 90, height: 40 },
    lounge: { label: "Lounge", width: 100, height: 60 },
    ac: { label: "A/C Unit", width: 44, height: 24 },
    staff: { label: "Staff Station", width: 80, height: 50 },
  };
  const addVenueElement = (type) => {
    const preset = VENUE_ELEMENT_DEFAULTS[type] || VENUE_ELEMENT_DEFAULTS.lounge;
    setVenueElements((list) => [...list, { id: uid(), type, label: preset.label, width: preset.width, height: preset.height, x: 40 + (list.length % 4) * 40, y: 20 + Math.floor(list.length / 4) * 40 }]);
  };
  const updateVenueElement = (id, patch) => setVenueElements((list) => list.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  const deleteVenueElement = (id) => setVenueElements((list) => list.filter((el) => el.id !== id));

  // What a guest submits through the actual RSVP form on the invitation itself —
  // separate from the owner's manual "Add a guest family" tool in the Dashboard,
  // though both land in the same guest list. `names` may contain zero, one, or
  // several people (from the "Who's joining us?" modal); anyone not named counts
  // toward additionalGuests as an unnamed slot, same as guests added manually.
  const submitGuestRsvp = async ({ names, status, additionalGuests, existingGroupId, batchId }) => {
    const cleanNames = (names || []).filter((n) => n && n.trim());
    const newMembers = cleanNames.length ? cleanNames.map((n) => ({ id: uid(), name: n, status })) : [{ id: uid(), name: "Guest", status }];
    const existing = existingGroupId ? guestGroups.find((g) => g.id === existingGroupId) : null;

    if (existing) {
      // THE ACTUAL FIX: update the existing entry (the one already on the
      // owner's guest list, matched by the id from this guest's specific
      // link) instead of creating a duplicate — this is what makes their
      // RSVP count correctly under their own name rather than as a
      // separate, unlinked entry. Saved immediately (not the debounced
      // path other edits use) since an RSVP needs prompt, reliable
      // persistence.
      const updatedGroup = { ...existing, members: newMembers.length ? newMembers : existing.members, additionalGuests: status === "yes" ? additionalGuests || 0 : 0, invitationViewed: true, updatedAt: Date.now() };
      const newList = guestGroups.map((g) => (g.id === existing.id ? updatedGroup : g));
      setGuestGroups(newList);
      if (persistentStorage.available()) {
        try {
          const snapshot = { ...getActiveSnapshot(), guestGroups: newList };
          await persistentStorage.set(invitationKey(activeInvitationId), JSON.stringify(snapshot), false);
        } catch (err) {
          console.error(`submitGuestRsvp: failed to save update for existing group "${existing.id}":`, err);
        }
      }
      if (status !== "yes") return null;
      const extra = additionalGuests || 0;
      const displayNames = (updatedGroup.members.map((m) => m.name).join(", ") || "Guest") + (extra > 0 ? ` + ${extra} guest${extra === 1 ? "" : "s"}` : "");
      return await createCheckinToken(slug, existing.id, displayNames);
    }

    const groupId = uid();
    addGuestGroup({
      id: groupId,
      lastName: "",
      members: newMembers,
      additionalGuests: status === "yes" ? additionalGuests || 0 : 0,
      table: "",
      phone: "",
      invitationSent: false, // we don't know if this was reached via a sent link or the open one
      invitationViewed: true, // they just viewed it — they're submitting from the page itself
      inviteBatchId: batchId || null,
      updatedAt: Date.now(),
    });
    if (status !== "yes") return null;
    const extra = additionalGuests || 0;
    const displayNames = (cleanNames.length ? cleanNames.join(", ") : "Guest") + (extra > 0 ? ` + ${extra} guest${extra === 1 ? "" : "s"}` : "");
    return await createCheckinToken(slug, groupId, displayNames);
  };

  // Shared fix for the whole class of bug this keeps surfacing as: local
  // setUsers() alone never reaches Supabase, so any change here only ever
  // existed in this browser until an explicit "Save invitation" — a
  // refresh in between silently reverts it. updateFn is applied to BOTH
  // this browser's local list (for immediate UI feedback) and the freshly
  // re-fetched latest saved data (so this doesn't stomp on a change made
  // elsewhere since this browser last loaded).
  const saveUsersDirectly = async (updateFn) => {
    setUsers(updateFn);
    if (!persistentStorage.available()) return;
    try {
      const res = await persistentStorage.get(DRAFT_KEY, false);
      const latest = res?.value ? JSON.parse(res.value) : {};
      const baseUsers = latest.users || users;
      const updated = { ...latest, users: updateFn(baseUsers) };
      const ok = await persistentStorage.set(DRAFT_KEY, JSON.stringify(updated), false);
      if (!ok) console.error("saveUsersDirectly: save returned falsy — change may revert on refresh.");
    } catch (err) {
      console.error("saveUsersDirectly: failed to save:", err);
    }
  };

  const deleteUser = (id) => saveUsersDirectly((list) => list.filter((u) => u.id !== id));
  const toggleUserStatus = (id) => saveUsersDirectly((list) => list.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u)));
  const approveUser = (id) => {
    saveUsersDirectly((list) => list.map((u) => (u.id === id ? { ...u, status: "active", dashboardAccess: true, canDesign: true } : u)));
    const approvedUser = users.find((u) => u.id === id);
    if (approvedUser) {
      sendApprovalEmail({
        recipientEmail: approvedUser.email,
        recipientName: approvedUser.name,
        invitationLink: approvedUser.invitationSlug ? `https://${siteDomain}/e/${approvedUser.invitationSlug}` : null,
        siteDomain,
      });
    }
  };
  const toggleDashboardAccess = (id) => saveUsersDirectly((list) => list.map((u) => (u.id === id ? { ...u, dashboardAccess: !u.dashboardAccess } : u)));
  const toggleCanDesign = (id) => saveUsersDirectly((list) => list.map((u) => (u.id === id ? { ...u, canDesign: !u.canDesign } : u)));
  const updateUserEmail = (id, email) => saveUsersDirectly((list) => list.map((u) => (u.id === id ? { ...u, email } : u)));
  const signUpUser = (params) => {
    // Shop-purchase signups skip the normal pending-approval wait — the
    // client already paid, so making them wait for a separate manual
    // approval on top of that would be a confusing, redundant step.
    const newUser = { id: uid(), name: params.name, email: params.email, phone: params.phone, password: params.password, role: "normal", status: pendingShopTemplate ? "active" : "pending", dashboardAccess: false, canDesign: false, createdAt: Date.now(), invitationSlug: null, packageTier: null };
    saveUsersDirectly((list) => [newUser, ...list]);
    if (newUser.status === "pending") {
      notifyAdminNewSignup({ userName: newUser.name, userEmail: newUser.email, userPhone: newUser.phone });
    }
    return newUser;
  };
  const [pendingNewUser, setPendingNewUser] = useState(null);
  const [chosenEventType, setChosenEventType] = useState(null);

  // Admin-side: opens/sets up a client's invitation directly, no template
  // step — the admin isn't the one who should be picking a client's
  // design for them. Used for "New invite" on an already-active user, or
  // any other admin action that needs to get into a client's portal.
  const createInvitationFor = (user) => {
    finalizeInvitationCreation(user, null, null, "overview");
  };

  // Shared by finalizeInvitationCreation (first-time creation) and
  // regenerateSlugFromCoupleNames (manual, explicit update later) — same
  // collision-avoidance logic in one place, since two different slugs
  // colliding silently makes one client's link resolve to another
  // client's data.
  const generateUniqueSlug = (base, excludeUserId) => {
    const cleanBase = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invitation";
    const existingSlugs = new Set(users.filter((u) => u.id !== excludeUserId).map((u) => u.invitationSlug).filter(Boolean));
    let candidate = cleanBase;
    let suffix = 2;
    while (existingSlugs.has(candidate)) {
      candidate = `${cleanBase}-${suffix}`;
      suffix++;
    }
    return candidate;
  };

  const finalizeInvitationCreation = async (user, template, eventType, destinationView) => {
    let finalUser = user;
    if (!user.invitationSlug) {
      const slug = generateUniqueSlug(user.name || `guest-${user.id.slice(0, 6)}`, user.id);
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, invitationSlug: slug } : u)));
      finalUser = { ...user, invitationSlug: slug };
    }
    let seeded = null;
    if (template || eventType) {
      seeded = applyTemplateToSnapshot(applyEventTypeToSnapshot(freshInvitationSnapshot(), eventType), template);
      setInvitationsStore((store) => ({ ...store, [finalUser.id]: seeded }));
    }
    await switchActiveInvitation(finalUser.id);
    // THE ACTUAL FIX: switchActiveInvitation just above reads
    // invitationsStore[nextId] from its own closure to decide what to load
    // — but the setInvitationsStore call a few lines up hasn't actually
    // applied to that closure yet (React state updates aren't synchronous),
    // so it silently fell back to a plain, un-customized freshInvitationSnapshot()
    // instead of the event-type/template-seeded one. Re-applying seeded
    // directly here, after switchActiveInvitation has finished, makes sure
    // the customized version wins regardless of that timing.
    if (seeded) {
      applySnapshot(seeded);
      setInvitationsStore((store) => ({ ...store, [finalUser.id]: seeded }));
    }
    setActingAsUser(finalUser);
    window.localStorage.setItem("einvite:acting-as-user-id", finalUser.id);
    setShowAuthPreview(false);
    setView(destinationView);
  };

  // Lets a client re-pick a template AT ANY TIME after they've already
  // started their invitation — not just once at first signup. Reuses
  // applyTemplateToSnapshot directly on the current live state rather than
  // a stored snapshot, since that function only ever touches pageBackgrounds
  // and intro (visual style) and never content — so any names, dates, or
  // other text the client has already typed in is left completely
  // untouched by switching designs this way.
  const switchToTemplate = (template) => {
    userChangedBackgroundsRef.current = true;
    setShowTemplateSwitcher(false);
    setTemplateSwitching(true); // fade-out begins
    setTimeout(() => {
      const result = applyTemplateToSnapshot({ pageBackgrounds, intro, layouts }, template);
      setPageBackgrounds(result.pageBackgrounds);
      setIntro(result.intro);
      if (result.layouts) setLayouts(result.layouts);
      // Applied while still fully hidden behind the fade overlay — this is
      // what actually makes the change look smooth rather than an instant
      // jump: the visual swap itself always happens off-screen, behind
      // opaque cover, regardless of how fast React re-renders it.
      setTimeout(() => setTemplateSwitching(false), 30); // fade back in on the next frame, revealing the new template
    }, 260); // fade-out duration — matches the CSS transition below
  };

  // Persists a confirmed package purchase onto the active client's own
  // user record — this is what actually unlocks their invitation for real
  // use, not just local component state that could revert on refresh.
  const onPackageConfirmed = (newTier) => {
    if (!activeUserRecord) return;
    saveUsersDirectly((list) => list.map((u) => (u.id === activeUserRecord.id ? { ...u, packageTier: newTier } : u)));
    setShowPublishModal(false);
  };

  // Client-side: this is where the CLIENT THEMSELVES lands after logging
  // in on their own device — this is what actually connects the template
  // picker to the right person. Gated on invitationSlug as a stand-in for
  // "has this client already picked a design" — if they haven't, they see
  // the picker now; once chosen, they land straight in their own Builder.
  const enterBuilderAsLoggedInUser = (user) => {
    // The owner/admin logging in goes straight to the admin dashboard —
    // never treated as "acting as" a specific client's invitation, since
    // that mode is for actually working inside ONE client's data, not for
    // the owner's own account.
    if (user.role === "owner") {
      setShowAuthPreview(false);
      setView("users");
      return;
    }
    if (!user.invitationSlug) {
      setPendingNewUser(user);
      return;
    }
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
    const isVideo = file.type.startsWith("video/");
    const isGif = file.type === "image/gif";
    if (isVideo && file.size > 20 * 1024 * 1024) {
      alert("That video is quite large (over 20MB) — try a shorter clip or a more compressed export for a smoother experience.");
      return;
    }
    try {
      // Uploaded to Storage and referenced by its URL — not read into a base64
      // data URI kept in this invitation's own saved JSON. A multi-MB video or
      // GIF embedded that way got re-sent in full on every single "Save",
      // whether or not this field had actually changed, which is what was
      // making saves so slow. uploadImageToStorage already handles GIFs
      // (preserving their animation) the same way it handles any other image.
      const url = isVideo ? await uploadVideoToStorage(file) : await uploadImageToStorage(file, "site-decorations");
      // A GIF also gets a static poster frame uploaded alongside it — see
      // uploadGifPosterFrame — so the gate can show that instead of the
      // animated GIF before the tap.
      const posterUrl = isGif ? await uploadGifPosterFrame(file, "site-decorations") : null;
      setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: { type: isVideo ? "video" : "image", url, posterUrl, name: file.name } } }));
    } catch (err) {
      alert(err.message || "Couldn't upload — please try again.");
    }
  };
  const removeIntroMedia = () => setIntro((i) => ({ ...i, media: { ...i.media, [activeLang]: null } }));
  const handlePickIntroLibraryItem = (item) => {
    setIntro((i) => ({
      ...i,
      introMediaChoiceId: item ? item.id : null,
      media: { ...i.media, [activeLang]: item ? { type: item.type, url: item.url, posterUrl: item.posterUrl, name: item.name } : null },
    }));
  };

  const totalAttending = flattenMembers(guestGroups).filter((m) => m.status === "yes").length;
  const data = { content, timeline, locations, registry, pageBackgrounds, music, rsvpSchedule, layouts, intro, customBlocks, rsvpSettings, totalAttending, integrations };
  const stepKey = steps[safeIndex].key;
  const c = content[activeLang];

  const autoTitle = `${content.en.cover.name1} & ${content.en.cover.name2} — Wedding Invitation`;
  const autoDescription = content.en.cover.intro;
  // The REAL, permanent slug guest links actually route against (matched in
  // the guest-detection effect below via u.invitationSlug === urlSlug) — set
  // once, at invitation-creation time, and never recomputed after. Using
  // anything else here (like deriving a slug fresh from the current cover
  // page names) is what previously caused the link shown in Settings to
  // silently drift away from the actual working guest link the moment
  // someone typed in the couple's real names after signing up under a
  // different one. Falls back to a fresh, name-derived slug only for the
  // owner's own demo slot, which has no invitationSlug record of its own.
  const activeUserRecord = users.find((u) => u.id === activeInvitationId);
  const slug = activeUserRecord?.invitationSlug
    || `${content.en.cover.name1}-${content.en.cover.name2}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invitation";

  // What the slug WOULD be if generated fresh from the couple's current
  // cover-page names — compared against the real, saved slug purely to
  // decide whether to show the "update link to match names" option in
  // Settings. This value itself is never used as the actual slug anywhere.
  const nameBasedSlugPreview = `${content.en.cover.name1}-${content.en.cover.name2}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "invitation";
  const slugMatchesCoupleNames = !activeUserRecord || activeUserRecord.invitationSlug === nameBasedSlugPreview;

  // Explicit, one-time action — never automatic — since an automatic
  // change here would silently break a link already sent to guests. Only
  // regenerates the REAL invitationSlug record itself (so it's stable
  // and permanent from this point on, exactly like a freshly created
  // one), not the per-render display-only value above.
  const regenerateSlugFromCoupleNames = () => {
    if (!activeUserRecord) return;
    const newSlug = generateUniqueSlug(`${content.en.cover.name1}-${content.en.cover.name2}`, activeUserRecord.id);
    saveUsersDirectly((list) => list.map((u) => (u.id === activeUserRecord.id ? { ...u, invitationSlug: newSlug } : u)));
  };

  // ------------------------------------------------------------------ //
  // Guest-link detection — runs once on load. If the URL is /e/:slug,
  // figure out which invitation that slug belongs to (this device's own
  // active one, or another client's from invitationsStore), and — if a
  // ?g=<guest group id> or ?guest=<name> is present — which guest. This
  // does NOT touch the actively-loaded editing state; it's a completely
  // separate, read-only path that short-circuits the whole app below.
  // ------------------------------------------------------------------ //

  const [guestView, setGuestView] = useState(null); // null = checking, false = not a guest link, { ... } = resolved
  const [guestLangOverride, setGuestLangOverride] = useState(null); // null = use the invitation's own default language; set once a guest explicitly picks one via the new language switcher
  const [guestActiveIndex, setGuestActiveIndex] = useState(0);
  const [guestStarted, setGuestStarted] = useState(false);
  const [djDashboardSlug, setDjDashboardSlug] = useState(null); // null = checking, false = not a DJ link, string = the slug
  const [networkingSlug, setNetworkingSlug] = useState(null); // null = checking, false = not a networking link, string = the slug
  const [checkinToken, setCheckinTokenFromUrl] = useState(null); // null = checking, false = not a check-in link, string = the token
  const [quickRsvpSlug, setQuickRsvpSlug] = useState(null); // null = checking, false = not a quick-RSVP link, string = the slug
  const [isAdminPath, setIsAdminPath] = useState(null); // null = checking, true/false = resolved
  const [isShopPath, setIsShopPath] = useState(null); // null = checking, true/false = resolved
  const [isDesignsPath, setIsDesignsPath] = useState(null); // null = checking, true/false = resolved — /designs shows only website-built (editOnWebsite) designs, separate from /shop's real Canva designs
  // Set when this visit came from a completed /shop purchase of an
  // editOnWebsite design (e.g. design-12) — carries which template to
  // apply automatically once the new account finishes signing up, and the
  // email to pre-fill so it's not retyped.
  const [pendingShopTemplate, setPendingShopTemplate] = useState(null);
  const [prefillSignupEmail, setPrefillSignupEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("buildTemplate");
    if (templateId) {
      const tpl = [...INVITATION_TEMPLATES, ...shopDesigns].find((t) => t.id === templateId);
      if (tpl) setPendingShopTemplate(tpl);
      const email = params.get("email");
      if (email) setPrefillSignupEmail(email);
    }
  }, [shopDesigns]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/dj\/([^/]+)\/?$/);
    setDjDashboardSlug(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/checkin\/([^/]+)\/?$/);
    setCheckinTokenFromUrl(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/quick\/([^/]+)\/?$/);
    setQuickRsvpSlug(match ? decodeURIComponent(match[1]) : false);
  }, []);

  useEffect(() => {
    const p = window.location.pathname;
    setIsAdminPath(p === "/admin" || p.startsWith("/admin/"));
  }, []);

  useEffect(() => {
    const p = window.location.pathname;
    setIsShopPath(p === "/shop" || p.startsWith("/shop/"));
  }, []);

  useEffect(() => {
    const p = window.location.pathname;
    setIsDesignsPath(p === "/designs" || p.startsWith("/designs/"));
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
    const batchId = params.get("batch");
    let cancelled = false;

    // This device's own currently-loaded invitation matches directly —
    // reuse the live state, no snapshot lookup needed.
    if (urlSlug === slug) {
      setGuestView({ found: true, ownSlug: true, slug: urlSlug, snapshotGuestGroups: guestGroups, groupId, guestNameParam, batchId });
      return;
    }
    // Otherwise, find which client this slug actually belongs to. Don't
    // decide "not found" until the real data has actually finished
    // loading — otherwise this can run against the initial seed/demo user
    // list and incorrectly conclude a real, valid slug doesn't exist,
    // before self-correcting a moment later once coreDataLoaded flips true
    // and this effect re-runs.
    if (!coreDataLoaded) return;
    const matchedUser = users.find((u) => u.invitationSlug === urlSlug);
    if (!matchedUser) {
      setGuestView({ found: false });
      return;
    }
    const cached = invitationsStore[matchedUser.id];
    if (cached) {
      setGuestView({ found: true, ownSlug: false, slug: urlSlug, userId: matchedUser.id, snapshot: cached, snapshotGuestGroups: cached.guestGroups || [], groupId, guestNameParam, batchId, packageTier: matchedUser.packageTier || null });
      return;
    }
    // THE ACTUAL FIX for "shows default names first, then the real edits
    // appear": this client's own real data was already saved correctly to
    // their own invitationKey the moment their account was created — but
    // this specific browser's local invitationsStore only knows about
    // clients whose id happened to be listed in d.invitationIds at the
    // last full "Save invitation" click, which creating a new client
    // doesn't itself trigger. Rather than immediately falling back to
    // generic default content while waiting for that list to eventually
    // catch up, fetch this client's real data directly, right now — it's
    // already sitting in Supabase regardless of whether their id made it
    // into that list yet.
    (async () => {
      let snapshot = null;
      if (persistentStorage.available()) {
        try {
          const res = await persistentStorage.get(invitationKey(matchedUser.id), false);
          if (res?.value) snapshot = JSON.parse(res.value);
        } catch (err) {
          console.error(`Guest view: failed to directly fetch invitation data for user "${matchedUser.id}":`, err);
        }
      }
      if (cancelled) return;
      const finalSnapshot = snapshot || freshInvitationSnapshot();
      if (snapshot) setInvitationsStore((store) => ({ ...store, [matchedUser.id]: snapshot })); // cache it, so this doesn't need to be re-fetched again this session
      setGuestView({ found: true, ownSlug: false, slug: urlSlug, userId: matchedUser.id, snapshot: finalSnapshot, snapshotGuestGroups: finalSnapshot.guestGroups || [], groupId, guestNameParam, batchId, packageTier: matchedUser.packageTier || null });
    })();

    return () => { cancelled = true; };
    // Re-run once the real saved data finishes loading (it loads
    // asynchronously in a separate effect) — without this, a guest link can
    // get permanently evaluated against the initial seed/demo data instead
    // of the couple's real saved content, since this effect would otherwise
    // only run once, before that async load has had a chance to complete.
  }, [slug, users, invitationsStore, coreDataLoaded]);

  // One-time cleanup, owner sessions only (guestView === false is the
  // confirmed-not-a-guest-link state — a guest browser has no business
  // uploading images or writing a save on the couple's behalf). Every
  // custom image block and page background used to embed its photo
  // directly as a base64 data: URI (addCustomImage/BackgroundPicker's
  // onUpload above now upload to Storage instead and save just the URL),
  // so a design built up over time — one photo at a time — kept growing
  // its OWN saved payload by the full size of each one, which is what made
  // this specific design get slower to load the more it grew, even though
  // nothing was actually broken. This walks whatever's still holding an
  // old data: URI, uploads it to Storage once, swaps in the real URL, and
  // saves the result so the shrink actually sticks instead of re-inflating
  // on every load.
  const migratedInlineImagesRef = useRef(false);
  const [needsSaveAfterImageMigration, setNeedsSaveAfterImageMigration] = useState(false);
  useEffect(() => {
    if (guestView !== false || !coreDataLoaded || !backgroundsLoaded || migratedInlineImagesRef.current) return;
    migratedInlineImagesRef.current = true;
    (async () => {
      let changed = false;
      const nextCustomBlocks = JSON.parse(JSON.stringify(customBlocks));
      for (const lang of LANGS) {
        for (const step of Object.keys(nextCustomBlocks[lang] || {})) {
          for (const block of nextCustomBlocks[lang][step]) {
            if (block.type === "image" && typeof block.url === "string" && block.url.startsWith("data:")) {
              try {
                block.url = await uploadDataUrlToStorage(block.url, "invitation-photos");
                changed = true;
              } catch {} // leave this one embedded for now — it'll simply be retried the next time this loads
            }
          }
        }
      }
      const nextPageBackgrounds = { ...pageBackgrounds };
      for (const step of Object.keys(nextPageBackgrounds)) {
        const bg = nextPageBackgrounds[step];
        if (bg?.image && typeof bg.image === "string" && bg.image.startsWith("data:")) {
          try {
            nextPageBackgrounds[step] = { ...bg, image: await uploadDataUrlToStorage(bg.image, "invitation-photos") };
            changed = true;
          } catch {}
        }
      }
      if (changed) {
        setCustomBlocks(nextCustomBlocks);
        setPageBackgrounds(nextPageBackgrounds);
        // Deliberately NOT just calling saveDraft() here — this render's
        // saveDraft still closes over the PRE-migration customBlocks/
        // pageBackgrounds, so it would save the old, un-shrunk values.
        // Flagging it instead and saving from a separate effect below lets
        // that effect run on the NEXT render, once these two setStates
        // have actually committed, so the saveDraft it calls closes over
        // the migrated data.
        setNeedsSaveAfterImageMigration(true);
      }
    })();
    // Deliberately runs once per load (guarded by the ref above), not on
    // every customBlocks/pageBackgrounds edit — this is a one-time cleanup
    // of whatever was loaded, not a live sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestView, coreDataLoaded, backgroundsLoaded]);
  useEffect(() => {
    if (!needsSaveAfterImageMigration) return;
    setNeedsSaveAfterImageMigration(false);
    saveDraft();
  }, [needsSaveAfterImageMigration]);

  const guestSnapshotData = guestView && guestView.found && !guestView.ownSlug
    ? (() => {
        const allYes = flattenMembers(guestView.snapshotGuestGroups).filter((m) => m.status === "yes");
        if (guestView.batchId) {
          // Scoped to just this one open-invite link — both the count and
          // the cap it's checked against only consider guests who used
          // this same link, completely independent of any other link or
          // the single shared "Open Invitation" link's own total.
          const batchGroups = guestView.snapshotGuestGroups.filter((g) => g.inviteBatchId === guestView.batchId);
          const batchTotalAttending = flattenMembers(batchGroups).filter((m) => m.status === "yes").length;
          const matchingBatch = (guestView.snapshot.openInviteLinks || []).find((l) => l.id === guestView.batchId);
          return {
            ...guestView.snapshot,
            totalAttending: batchTotalAttending,
            rsvpSettings: { ...guestView.snapshot.rsvpSettings, maxTotalRsvps: matchingBatch ? matchingBatch.maxGuests : guestView.snapshot.rsvpSettings.maxTotalRsvps },
          };
        }
        return { ...guestView.snapshot, totalAttending: allYes.length };
      })()
    : null;
  const guestData = guestView && guestView.found ? (guestView.ownSlug ? data : guestSnapshotData) : null;
  const guestSteps = guestView && guestView.found
    ? (guestView.ownSlug
        ? steps
        : (guestView.snapshot.pageOrder || ALL_STEPS.map((s) => s.key))
            .map((k) => ALL_STEPS.find((s) => s.key === k))
            .filter(Boolean)
            .filter((s) => (guestView.snapshot.enabledSteps || {})[s.key])
            // THE ACTUAL GATE: a page not included in the client's purchased
            // package tier is never reachable by a real guest, regardless of
            // enabledSteps — building/editing every page stays unrestricted
            // for the client themselves; this only affects what an actual
            // guest's link can navigate to.
            .filter((s) => guestView.packageTier ? (PACKAGE_TIERS[guestView.packageTier]?.pageKeys || []).includes(s.key) : true))
    : null;
  const guestEnabledLanguages = guestView && guestView.found
    ? (guestView.ownSlug ? enabledLanguages : (guestView.snapshot.enabledLanguages || ["en"]))
    : ["en"];
  const guestLang = guestLangOverride && guestEnabledLanguages.includes(guestLangOverride)
    ? guestLangOverride
    : (guestView && guestView.found ? (guestView.ownSlug ? activeLang : (guestView.snapshot.defaultLang || "en")) : "en");
  const matchedGroup = guestView && guestView.found ? guestView.snapshotGuestGroups.find((g) => g.id === guestView.groupId) : null;
  const resolvedGuestName = matchedGroup?.members?.find((m) => m.status === "yes")?.name || matchedGroup?.members?.[0]?.name || guestView?.guestNameParam || null;

  // Submitting an RSVP from a guest view needs to write into the RIGHT
  // place — the live state if it's this device's own invitation, or the
  // correct client's slot in invitationsStore otherwise (without touching
  // whatever invitation is currently loaded for editing).
  const submitGuestViewRsvp = async ({ names, status, additionalGuests }) => {
    if (!guestView?.found) return null;
    if (guestView.ownSlug) {
      return await submitGuestRsvp({ names, status, additionalGuests, existingGroupId: guestView.groupId, batchId: guestView.batchId });
    }
    const cleanNames = (names || []).filter((n) => n && n.trim());
    const newMembers = cleanNames.length ? cleanNames.map((n) => ({ id: uid(), name: n, status })) : [{ id: uid(), name: "Guest", status }];

    // THE ACTUAL FIX: write straight to Supabase, not just to local
    // invitationsStore state. A guest submitting this is on their OWN
    // device/browser, loading the page fresh via a shared link — their
    // local React state is never seen by the owner's dashboard, which
    // loads its own copy from Supabase on a completely different device.
    // Without this, the RSVP only ever existed in the guest's own browser
    // memory and vanished the moment they closed the tab.
    let savedOk = false;
    let resultGroup = null;
    let latest = null;
    try {
      const res = await persistentStorage.get(invitationKey(guestView.userId), false);
      latest = res?.value ? JSON.parse(res.value) : (guestView.snapshot || freshInvitationSnapshot());
      const existingGroups = latest.guestGroups || [];
      // Match against the freshly-fetched latest data, not
      // guestView.snapshotGuestGroups (loaded once when the page first
      // opened, possibly stale by now) — this is what makes a guest's
      // specific link update their own existing entry instead of creating
      // a duplicate one, correctly counted under their own name.
      const existing = guestView.groupId ? existingGroups.find((g) => g.id === guestView.groupId) : null;

      if (existing) {
        resultGroup = { ...existing, members: newMembers.length ? newMembers : existing.members, additionalGuests: status === "yes" ? additionalGuests || 0 : 0, invitationViewed: true, updatedAt: Date.now() };
        latest = { ...latest, guestGroups: existingGroups.map((g) => (g.id === existing.id ? resultGroup : g)) };
      } else {
        resultGroup = { id: uid(), lastName: "", members: newMembers, additionalGuests: status === "yes" ? additionalGuests || 0 : 0, table: "", phone: "", tableId: null, invitationSent: false, invitationViewed: true, inviteBatchId: guestView.batchId || null, updatedAt: Date.now() };
        latest = { ...latest, guestGroups: [resultGroup, ...existingGroups] };
      }

      const saveRes = await persistentStorage.set(invitationKey(guestView.userId), JSON.stringify(latest), false);
      savedOk = !!saveRes;
      if (!savedOk) console.error("submitGuestViewRsvp: save to Supabase returned falsy — RSVP may not have persisted.");
    } catch (err) {
      console.error("submitGuestViewRsvp: failed to save RSVP to Supabase:", err);
      resultGroup = resultGroup || { id: uid(), lastName: "", members: newMembers, additionalGuests: status === "yes" ? additionalGuests || 0 : 0, table: "", phone: "", tableId: null, invitationSent: false, invitationViewed: true, updatedAt: Date.now() };
    }

    // Also update local state so the UI reflects this immediately without
    // waiting on a re-fetch — but this is now a mirror of what's saved,
    // not the only copy of the data.
    setInvitationsStore((store) => {
      const current = store[guestView.userId] || freshInvitationSnapshot();
      const currentGroups = current.guestGroups || [];
      const alreadyThere = currentGroups.some((g) => g.id === resultGroup.id);
      return { ...store, [guestView.userId]: { ...current, guestGroups: alreadyThere ? currentGroups.map((g) => (g.id === resultGroup.id ? resultGroup : g)) : [resultGroup, ...currentGroups] } };
    });
    if (!savedOk) {
      console.error(`RSVP for "${cleanNames.join(", ") || "Guest"}" (slug: ${guestView.slug}) could not be confirmed as saved to the shared database.`);
    }
    if (status !== "yes") return null;
    const extra = additionalGuests || 0;
    const displayNames = (resultGroup.members.map((m) => m.name).join(", ") || "Guest") + (extra > 0 ? ` + ${extra} guest${extra === 1 ? "" : "s"}` : "");
    return await createCheckinToken(guestView.slug, resultGroup.id, displayNames);
  };

  if (djDashboardSlug === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (djDashboardSlug) {
    return <DjDashboard slug={djDashboardSlug} />;
  }

  if (isShopPath === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (isShopPath) {
    return <TemplateShopPage mode="canva" />;
  }

  if (isDesignsPath === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (isDesignsPath) {
    return <TemplateShopPage mode="website" />;
  }

  if (networkingSlug === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (networkingSlug) {
    return <NetworkingHub slug={networkingSlug} />;
  }

  if (checkinToken === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (checkinToken) {
    return <CheckinPage token={checkinToken} />;
  }

  if (quickRsvpSlug === null) {
    return <AppLoadingScreen />; // still checking the URL
  }
  if (quickRsvpSlug) {
    return <QuickRsvpPage slug={quickRsvpSlug} />;
  }

  if (guestView === null) {
    return <AppLoadingScreen />; // still checking the URL — avoid flashing the homepage/builder first
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
      <div className="relative">
        {guestEnabledLanguages.length > 1 && (
          <GuestLanguageSwitcher
            current={guestLang}
            options={guestEnabledLanguages}
            onChange={setGuestLangOverride}
          />
        )}
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
          onDuplicateCustomBlock={() => {}}
          onMoveLocation={() => {}}
          onSubmitRsvp={submitGuestViewRsvp}
          fullscreen
          slug={guestView.slug}
          siteDomain={siteDomain}
          prefilledGuestName={resolvedGuestName}
          onUpdateRsvpContent={() => {}}
          swipeDirection={swipeDirection}
          transitionStyle={transitionStyle}
        />
      </div>
    );
  }

  if (isAdminPath === null || !sessionCheckResolved) {
    return <AppLoadingScreen />; // still checking the URL / still trying to restore a saved session — showing login here would be premature and could flash it even for an already-logged-in client
  }

  // The actual fix: the site's default landing (anything that isn't /admin
  // and isn't one of the other special paths already handled above) now
  if (pendingNewUser && !chosenEventType) {
    return (
      <div className="min-h-screen" style={{ background: INK }}>
        <EventTypePicker
          onChoose={(eventType) => {
            // In-app template/design selection has been removed — designs
            // are now bought separately via the standalone /shop, not
            // picked here. Straight into the Builder with no template
            // applied (template: null), just the event type's own content
            // wording (see applyEventTypeToSnapshot).
            finalizeInvitationCreation(pendingNewUser, pendingShopTemplate, eventType, "builder");
            setPendingNewUser(null);
          }}
          onCancel={() => setPendingNewUser(null)}
        />
      </div>
    );
  }

  // shows login/signup instead of dropping straight into the builder. A
  // client who's already logged in (actingAsUser, restored from
  // localStorage after a refresh) still goes straight to their own portal
  // — this only gates people who aren't recognized as anything yet.
  if (!isAdminPath && !actingAsUser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-10" style={{ background: INK, fontFamily: FONT_BODY }}>
        <AuthPreview users={users} onSignUp={signUpUser} onExit={null} onEnterBuilderAs={enterBuilderAsLoggedInUser} dataLoaded={coreDataLoaded} prefillEmail={prefillSignupEmail} skipApproval={!!pendingShopTemplate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: INK, fontFamily: FONT_BODY }}>
      <style>{`
        @keyframes slideUpIn { from { transform: translateY(24px); } to { transform: translateY(0); } }
        @keyframes slideDownIn { from { transform: translateY(-24px); } to { transform: translateY(0); } }
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

      <div className="mx-auto max-w-[1400px] px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: GOLD, letterSpacing: "0.2em" }}>eInvite.me</div>
            <h1 className="mt-1 text-2xl" style={{ fontFamily: activeLang === "ar" ? FONT_AR : activeLang === "hy" ? FONT_HY : FONT_DISPLAY, color: IVORY, fontStyle: activeLang === "ar" || activeLang === "hy" ? "normal" : "italic" }}>
              {c.cover.name1 || "—"}{c.cover.name2 ? <> &amp; {c.cover.name2}</> : null}
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

        {!showAuthPreview && <ChatSupportWidget context="builder" onFillForm={applyAiFormData} />}

        {showAuthPreview ? (
          <AuthPreview users={users} onSignUp={signUpUser} onExit={() => setShowAuthPreview(false)} onEnterBuilderAs={enterBuilderAsLoggedInUser} dataLoaded={coreDataLoaded} />
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
              <LogOut size={12} /> {isAdminPath ? "Exit to Admin Dashboard" : "Log Out"}
            </GhostButton>
          </div>
        )}

        {view === "builder" && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr_320px]">
            <div className="rounded-2xl p-6 md:sticky md:top-10 md:self-start" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
              <PagesManager orderedAllSteps={orderedAllSteps} enabledSteps={enabledSteps} onToggle={toggleStepVisibility} onMove={moveStepOrder} />
            </div>
            <div className="rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
              {editingShopDesignId && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: "rgba(201,164,76,0.1)", border: `1px solid rgba(201,164,76,0.3)` }}>
                  <span className="text-[12px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY }}>
                    Editing shop design: {shopDesigns.find((d) => d.id === editingShopDesignId)?.name || "…"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={updateCurrentStylingOnShopDesign} className="rounded-full px-3 py-1.5 text-[11.5px] font-semibold" style={{ background: GOLD, color: INK, fontFamily: FONT_BODY }}>
                      Update Shop Design
                    </button>
                    <button onClick={() => setEditingShopDesignId(null)} className="text-[11.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <LangSwitcher activeLang={activeLang} setActiveLang={setActiveLang} defaultLang={defaultLang} setDefaultLang={setDefaultLang} enabledLanguages={enabledLanguages} onToggleLanguage={toggleLanguage} />
              <div className="mb-4 flex items-center justify-end gap-2">
                {isAdminPath && !actingAsUser && (
                  <button
                    onClick={() => setShowSaveAsShopDesign(true)}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold"
                    style={{ background: "transparent", color: GOLD_SOFT, border: `1px solid rgba(201,164,76,0.4)`, fontFamily: FONT_BODY }}
                  >
                    <Sparkles size={13} /> Save as Shop Design
                  </button>
                )}
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold uppercase"
                  style={{ background: activeUserRecord?.packageTier ? "rgba(143,191,163,0.18)" : GOLD, color: activeUserRecord?.packageTier ? CHART_COLORS.yes : INK, fontFamily: FONT_BODY, letterSpacing: "0.04em" }}
                >
                  {activeUserRecord?.packageTier ? `${PACKAGE_TIERS[activeUserRecord.packageTier]?.name || activeUserRecord.packageTier} — Published` : "Publish"}
                </button>
              </div>
              <StepRail steps={steps} activeIndex={safeIndex} visited={visited} onSelect={selectStep} />

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>{steps[safeIndex].label}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {layoutEditMode && <GhostButton onClick={addCustomText}><Plus size={13} /> Add text</GhostButton>}
                  {layoutEditMode && <GhostUploadButton accept="image/*" onChange={addCustomImage}><ImagePlus size={13} /> Add image</GhostUploadButton>}
                  {layoutEditMode && (
                    <div className="relative">
                      <GhostButton onClick={() => setLibraryPickerOpen((o) => !o)}><ImagePlus size={13} /> Library</GhostButton>
                      {libraryPickerOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg p-2" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, width: 220 }}>
                          <div className="mb-1.5 flex items-center justify-between px-1">
                            <span className="text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em" }}>From our library</span>
                            {isAdminPath && !actingAsUser && (
                              <label className="cursor-pointer text-[10px] underline" style={{ color: GOLD_SOFT }}>
                                + Upload
                                <input type="file" accept="image/*" className="hidden" onChange={addGlobalAssetItem} />
                              </label>
                            )}
                          </div>
                          {globalAssets.length === 0 ? (
                            <p className="px-1 text-[10.5px]" style={{ color: MUTED, fontFamily: FONT_BODY }}>
                              {isAdminPath && !actingAsUser ? "No images uploaded yet — use \"+ Upload\" above." : "No library images yet."}
                            </p>
                          ) : (
                            <div className="grid grid-cols-3 gap-1.5">
                              {globalAssets.map((asset) => (
                                <div key={asset.id} className="group relative">
                                  <button
                                    onClick={() => { addGlobalAssetToPage(asset.url); setLibraryPickerOpen(false); }}
                                    className="block h-14 w-full overflow-hidden rounded-md"
                                    style={{ border: `1px solid rgba(147,166,155,0.25)` }}
                                    title={asset.label}
                                  >
                                    <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />
                                  </button>
                                  {isAdminPath && !actingAsUser && (
                                    <button
                                      onClick={() => deleteGlobalAsset(asset.id)}
                                      title="Remove from library"
                                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                                      style={{ background: INK, color: "#E29B9B", border: `1px solid rgba(226,155,155,0.4)` }}
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {layoutEditMode && <GhostUploadButton accept="video/*" onChange={addCustomVideo}><Film size={13} /> Add video</GhostUploadButton>}
                  {layoutEditMode && (
                    <div className="relative">
                      <GhostButton onClick={() => setIconPickerOpen((o) => !o)}><Sparkles size={13} /> Elements</GhostButton>
                      {iconPickerOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg p-2" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.3)`, width: 200 }}>
                          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em" }}>Icons</div>
                          <div className="mb-2 grid grid-cols-4 gap-1">
                            {Object.entries(DECORATIVE_ICONS).map(([key, { name, icon: Icon }]) => (
                              <button
                                key={key}
                                onClick={() => { addCustomIcon(key); setIconPickerOpen(false); }}
                                title={name}
                                className="flex h-8 w-8 items-center justify-center rounded-md"
                                style={{ color: MUTED, border: `1px solid rgba(147,166,155,0.25)` }}
                              >
                                <Icon size={15} />
                              </button>
                            ))}
                          </div>
                          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em" }}>Dividers</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => { addCustomDivider("horizontal"); setIconPickerOpen(false); }}
                              className="flex h-9 items-center justify-center rounded-md"
                              style={{ color: MUTED, border: `1px solid rgba(147,166,155,0.25)` }}
                              title="Horizontal divider"
                            >
                              <Minus size={16} />
                            </button>
                            <button
                              onClick={() => { addCustomDivider("vertical"); setIconPickerOpen(false); }}
                              className="flex h-9 items-center justify-center rounded-md"
                              style={{ color: MUTED, border: `1px solid rgba(147,166,155,0.25)` }}
                              title="Vertical divider"
                            >
                              <Minus size={16} style={{ transform: "rotate(90deg)" }} />
                            </button>
                          </div>

                          <div className="mb-1.5 mt-3 px-1 text-[10px] font-semibold uppercase" style={{ color: MUTED, letterSpacing: "0.08em" }}>Lines</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => { addCustomLine("horizontal"); setIconPickerOpen(false); }}
                              className="flex h-9 items-center justify-center rounded-md"
                              style={{ color: MUTED, border: `1px solid rgba(147,166,155,0.25)` }}
                              title="Horizontal line"
                            >
                              <div style={{ width: 20, height: 2, background: MUTED }} />
                            </button>
                            <button
                              onClick={() => { addCustomLine("vertical"); setIconPickerOpen(false); }}
                              className="flex h-9 items-center justify-center rounded-md"
                              style={{ color: MUTED, border: `1px solid rgba(147,166,155,0.25)` }}
                              title="Vertical line"
                            >
                              <div style={{ width: 2, height: 20, background: MUTED }} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {layoutEditMode && <GhostButton onClick={undoLayoutChange}><Undo2 size={12} /> Undo</GhostButton>}
                  {layoutEditMode && <GhostButton onClick={redoLayoutChange}><Redo2 size={12} /> Redo</GhostButton>}
                  {layoutEditMode && <GhostButton onClick={resetLayout}>Reset layout</GhostButton>}
                  <GhostButton active={layoutEditMode} onClick={toggleLayoutEditMode}>
                    <Move size={13} /> {layoutEditMode ? "Done positioning" : "Position text"}
                  </GhostButton>
                </div>
              </div>

              {layoutEditMode && selectedBlockId && (() => {
                const isCustom = selectedBlockId.startsWith("custom:");
                const isLocation = selectedBlockId.startsWith("loc:");
                const customId = isCustom ? selectedBlockId.slice(7) : null;
                const locId = isLocation ? selectedBlockId.slice(4) : null;
                const current = isCustom
                  ? customBlocks[activeLang][stepKey].find((b) => b.id === customId) || { fontFamily: null, color: null, fontSize: 16, text: "" }
                  : isLocation
                    // Position lives on the location item itself (independently
                    // draggable per location); everything else — color, card
                    // background, the Get Directions button's styling — stays
                    // shared across every location via the same "list" layout
                    // entry the whole slide already used before each location
                    // could be moved on its own.
                    ? { ...(layouts[activeLang]?.locations?.list || {}), ...(locations.find((it) => it.id === locId) || {}) }
                    : layouts[activeLang]?.[stepKey]?.[selectedBlockId] || { fontFamily: null, color: null, fontSize: null };
                return (
                  <BlockStylePanel
                    isCustom={isCustom}
                    isLocation={isLocation}
                    blockId={isCustom ? null : (isLocation ? "list" : selectedBlockId)}
                    stepKey={stepKey}
                    current={current}
                    onChangeStyle={(patch) => {
                      if (isCustom) { updateCustomBlock(stepKey, customId, patch); return; }
                      if (isLocation) {
                        const { x, y, ...styleRest } = patch;
                        if (x !== undefined || y !== undefined) moveLocationItem(locId, { ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) });
                        if (Object.keys(styleRest).length) updateBlockStyle("locations", "list", styleRest);
                        return;
                      }
                      updateBlockStyle(stepKey, selectedBlockId, patch);
                    }}
                    onChangeText={(v) => updateCustomBlock(stepKey, customId, { text: v })}
                    onDelete={() => (isLocation ? removeLocationItem(locId) : removeCustomBlock(stepKey, customId))}
                    onDuplicate={isCustom ? () => duplicateCustomBlock(stepKey, customId) : (isLocation ? () => duplicateLocationItem(locId) : undefined)}
                    onDeselect={() => setSelectedBlockId(null)}
                    onReorder={isCustom ? (action) => reorderCustomBlock(stepKey, customId, action) : undefined}
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
                  introMediaLibrary={introMediaLibrary}
                  isAdmin={isAdminPath && !actingAsUser}
                  onAddLibraryItem={addIntroLibraryItem}
                  onRemoveLibraryItem={removeIntroLibraryItem}
                  onPickLibraryItem={handlePickIntroLibraryItem}
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
                          The real stream link is kept genuinely hidden — it's stored server-side and only ever sent to a guest's browser after payment is confirmed. It never sits in this invitation's normal saved data, so there's nothing for a guest to find by inspecting the page, copying a link, or sharing it with someone who hasn't paid.
                        </p>
                      </div>
                      <div className="mb-3 rounded-lg p-3" style={{ background: "rgba(143,191,163,0.08)", border: `1px solid rgba(143,191,163,0.25)` }}>
                        <p className="text-[11px] font-semibold" style={{ color: CHART_COLORS.yes, fontFamily: FONT_BODY }}>How each payment is split</p>
                        <p className="mt-1 text-[11px]" style={{ color: MUTED, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
                          Paid Live payments are processed by <strong>credit card via Stripe only</strong>. Of each guest's payment: <strong>80%</strong> goes to you, <strong>15%</strong> is the platform fee, and <strong>5%</strong> goes to an environmental charity. The split happens automatically at checkout — you never need to send anything on manually.
                        </p>
                        <p className="mt-2 text-[10px]" style={{ color: "#E2C97E", fontFamily: FONT_BODY }}>
                          Setup pending: this needs a connected Stripe account before it can actually process a real payment — checkout isn't live yet.
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

            <div className="flex w-full flex-col items-center gap-3 overflow-x-auto md:sticky md:top-10 md:w-auto md:self-start">
              <div className="relative">
                <PhonePreview data={data} steps={steps} activeIndex={safeIndex} onNavigate={selectStep} lang={activeLang} layoutEditMode={layoutEditMode} onMoveBlock={moveBlock} started={started} onStart={() => setStarted(true)} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} onMoveCustomBlock={moveCustomBlock} onRemoveCustomBlock={removeCustomBlock} onDuplicateCustomBlock={duplicateCustomBlock} onMoveLocation={moveLocationItem} onSubmitRsvp={submitGuestRsvp} slug={slug} siteDomain={siteDomain} onUpdateRsvpContent={(patch) => updateContentSection("rsvp", patch)} swipeDirection={swipeDirection} transitionStyle={transitionStyle} />
                {/* Fades to hide the instant background/style swap behind an
                    opaque cover, then fades back in — this is what makes
                    switching templates look like a smooth, medium-speed
                    transition rather than the previous instant jump. Also
                    covers the canvas until the saved design has actually
                    loaded (customBlocks/pageBackgrounds/layouts start out
                    EMPTY and only get filled in once two sequential network
                    fetches resolve) — without this, a refresh briefly (and,
                    on a slow connection or a large heavily-decorated design,
                    not so briefly) rendered every custom icon/line/text block
                    as gone, which read as the whole design having been wiped
                    even though nothing was ever lost. */}
                <div
                  className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-[32px]"
                  style={{ background: INK, opacity: templateSwitching || !coreDataLoaded || !backgroundsLoaded ? 1 : 0, transition: "opacity 0.26s ease" }}
                >
                  {!templateSwitching && (!coreDataLoaded || !backgroundsLoaded) && (
                    <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>Loading your design…</p>
                  )}
                </div>
              </div>
              <GhostButton onClick={previewFromStart}>
                <Mail size={12} /> Preview from start
              </GhostButton>
            </div>
          </div>
        )}

        {view === "settings" && (
          <>
            <SettingsView og={og} setOg={setOg} autoTitle={autoTitle} autoDescription={autoDescription} slug={slug} siteDomain={siteDomain} setSiteDomain={setSiteDomain} slugMatchesCoupleNames={slugMatchesCoupleNames} nameBasedSlugPreview={nameBasedSlugPreview} onRegenerateSlug={regenerateSlugFromCoupleNames} swipeDirection={swipeDirection} setSwipeDirection={setSwipeDirection} transitionStyle={transitionStyle} setTransitionStyle={setTransitionStyle} integrations={integrations} updateIntegrations={updateIntegrations} isAdmin={isAdminPath && !actingAsUser} />
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
            venueElements={venueElements}
            addVenueElement={addVenueElement}
            updateVenueElement={updateVenueElement}
            deleteVenueElement={deleteVenueElement}
            integrations={integrations}
            updateIntegrations={updateIntegrations}
            coupleTitle={`${c.cover.name1} & ${c.cover.name2}`}
            slug={slug}
            siteDomain={siteDomain}
            og={og}
            openInviteLinks={openInviteLinks}
            addOpenInviteLink={addOpenInviteLink}
            deleteOpenInviteLink={deleteOpenInviteLink}
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

        {showPublishModal && activeUserRecord && (
          <PublishPaywallModal
            userId={activeUserRecord.id}
            invitationSlug={slug}
            currentPackageTier={activeUserRecord.packageTier}
            onClose={() => setShowPublishModal(false)}
            onConfirmed={onPackageConfirmed}
          />
        )}

        {showSaveAsShopDesign && (
          <SaveAsShopDesignModal
            onClose={() => setShowSaveAsShopDesign(false)}
            onSave={saveCurrentAsShopDesign}
            existingDesigns={INVITATION_TEMPLATES.map((t) => shopDesigns.find((d) => d.id === t.id) || t).concat(shopDesigns.filter((d) => !INVITATION_TEMPLATES.some((t) => t.id === d.id)))}
            onUpdateDesign={updateShopDesign}
            onDeleteDesign={deleteShopDesign}
            onEditInBuilder={loadShopDesignForEditing}
            onUploadVideo={uploadShopDesignVideo}
          />
        )}
      </div>
    </div>
  );
}
