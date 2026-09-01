import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart, Users, Clock, MapPin, CalendarClock, ChevronUp, ChevronDown,
  Plus, Trash2, Upload, Navigation2,
  Church, Wine, UtensilsCrossed, PartyPopper, Sparkles, Check, X, Music2, Star,
  Settings, BarChart3, Copy, Link2, ImagePlus, Search, CheckCircle2, XCircle, Move, Mail, Film,
  ChevronsUp, Volume2, VolumeX, Share2, Disc3, Headphones, Feather, MessageCircle,
  FilePlus2, Lock, Unlock, ShieldCheck, LogOut, UserPlus, LogIn, Eye, EyeOff, ArrowLeft,
  ThumbsUp, ThumbsDown, CalendarDays, Pencil, Gift, ExternalLink, Handshake, Video,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

/* ---------------------------------------------------------------------- */
/* Tokens                                                                 */
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

const emptyIntroMedia = () => ({ en: null, ar: null, fr: null, es: null });

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

const PHONE_IMAGE_MAX_HEIGHT_PCT = 73;
const clampXForImageWidth = (x, widthPercent) => {
  const halfWidthPct = Math.min(50, widthPercent / 2);
  return Math.min(100 - halfWidthPct, Math.max(halfWidthPct, x));
};

const emptyCustomBlocks = () => ({ cover: [], family: [], timeline: [], locations: [], countdown: [], rsvp: [], registry: [], djRequests: [], networking: [], livestream: [] });

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
const REQUIRED_STEP_KEY = "cover";

const uid = () => Math.random().toString(36).slice(2, 10);

const SUPABASE_URL = "https://tahbjwbmigoodfrfjpri.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85PWR75Vq5WcSWvgos6pmg_4JwG0_iM";
const supabaseConfigured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// ---------------------------------------------------------------------- //
// Persistent Storage adjusted to use table "invitations"                   //
// ---------------------------------------------------------------------- //
const persistentStorage = {
  async get(key) {
    if (supabaseConfigured) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/invitations?slug=eq.${encodeURIComponent(key)}&select=data`, { headers: supabaseHeaders });
        if (!res.ok) return null;
        const rows = await res.json();
        return rows[0] ? { key, value: JSON.stringify(rows[0].data), shared: false } : null;
      } catch {
        return null;
      }
    }
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage?.getItem(key);
      return raw !== null && raw !== undefined ? { key, value: raw, shared: false } : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    if (supabaseConfigured) {
      try {
        const parsedData = JSON.parse(value);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/invitations`, {
          method: "POST",
          headers: { ...supabaseHeaders, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ slug: key, data: parsedData, updated_at: new Date().toISOString() }),
        });
        if (!res.ok) return null;
        return { key, value, shared: false };
      } catch {
        return null;
      }
    }
    if (typeof window === "undefined") return null;
    try {
      window.localStorage?.setItem(key, value);
      return { key, value, shared: false };
    } catch {
      return null;
    }
  },
  available() {
    if (supabaseConfigured) return true;
    if (typeof window === "undefined") return false;
    try { window.localStorage?.setItem("__probe__", "1"); window.localStorage?.removeItem("__probe__"); return true; }
    catch { return false; }
  },
};

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
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

function readImageCompressed(file, maxDim = 1400, quality = 0.78) {
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
        ctx.drawImage(img, 0, 0, width, height);
        resolve(preserveTransparency ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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
  cover: { names: { x: 50, y: 68 }, intro: { x: 50, y: 83 } },
  family: { greeting: { x: 50, y: 34 }, quote: { x: 50, y: 52 }, names: { x: 50, y: 76 } },
  timeline: { heading: { x: 50, y: 13 }, list: { x: 50, y: 58 } },
  locations: { heading: { x: 50, y: 11 }, list: { x: 50, y: 55 } },
  countdown: { heading: { x: 50, y: 30 }, countdown: { x: 50, y: 58 } },
  rsvp: { heading: { x: 50, y: 22 }, buttons: { x: 50, y: 55 } },
  registry: { heading: { x: 50, y: 13 }, list: { x: 50, y: 55 } },
  djRequests: { heading: { x: 50, y: 32 }, button: { x: 50, y: 58 } },
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

function LangSwitcher({ activeLang, setActiveLang, defaultLang, setDefaultLang, enabledLanguages, onToggleLanguage }) {
  const [showAdd, setShowAdd] = useState(false);
  const disabledLangs = LANGS.filter((l) => !enabledLanguages.includes(l));

  const removeLanguage = (l) => {
    if (enabledLanguages.length <= 1) return;
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
              title={`Remove ${LANG_META[l].short}`}
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
    </div>
  );
}

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
            type="range" min={0} max={100} value={bg.darken ?? 55}
            onChange={(e) => onChange({ ...bg, darken: Number(e.target.value) })}
            className="w-full" style={{ accentColor: GOLD }}
          />
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
                <button onClick={() => onToggle(step.key)} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: isOn ? GOLD_SOFT : MUTED, fontFamily: FONT_BODY }}>
                  {isOn ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
              <button onClick={onRemoveAudio} className="ml-1" style={{ color: "#E29B9B" }}><X size={12} /></button>
            </span>
          )}
        </div>
      )}
      <Divider />
      <FieldLabel>Intro type</FieldLabel>
      <Select
        value={intro.type}
        onChange={(v) => updateIntro({ type: v })}
        options={[{ value: "button", label: "Tap to start button" }, { value: "animation", label: "Animation" }, { value: "seal", label: "Wax seal envelope" }]}
      />
      <div className="mt-4">
        <FieldLabel>Tap to start text ({LANG_META[activeLang].short})</FieldLabel>
        <TextInput value={c.tapText} onChange={(v) => updateContent({ tapText: v })} placeholder="TAP TO START" />
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
        <TextArea value={c.quote} onChange={(v) => updateContent({ quote: v })} rows={2} placeholder="Add a verse or quote" />
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
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}><Trash2 size={15} /></button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <TextInput value={item.label[activeLang] || ""} onChange={(v) => setLabel(item.id, v)} placeholder={`Event name`} />
              </div>
              <TextInput value={item.time} onChange={(v) => setItem(item.id, { time: v })} placeholder="4:00 PM" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}><Plus size={13} /> Add timeline event</GhostButton>
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
                <TextInput value={item.title[activeLang] || ""} onChange={(v) => setTitle(item.id, v)} placeholder={`Venue title`} />
              </div>
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}><Trash2 size={15} /></button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <TextInput value={item.address} onChange={(v) => setItem(item.id, { address: v })} placeholder="Address" />
              </div>
              <TextInput value={item.time} onChange={(v) => setItem(item.id, { time: v })} placeholder="Time" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}><Plus size={13} /> Add location</GhostButton>
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
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function RsvpStep({ c, updateContent, bg, setBg, rsvpSettings, updateRsvpSettings }) {
  return (
    <div>
      <FieldLabel>RSVP style</FieldLabel>
      <div className="flex gap-3">
        <button onClick={() => updateRsvpSettings({ style: "classic" })} className="flex-1 rounded-xl p-3 text-left" style={{ background: INK_3, border: `1.5px solid ${rsvpSettings.style === "classic" ? GOLD : "rgba(147,166,155,0.25)"}` }}>
          <div className="mb-1.5 text-[9px] font-semibold uppercase" style={{ color: GOLD_SOFT }}>Classic</div>
        </button>
        <button onClick={() => updateRsvpSettings({ style: "stacked" })} className="flex-1 rounded-xl p-3 text-left" style={{ background: INK_3, border: `1.5px solid ${rsvpSettings.style === "stacked" ? GOLD : "rgba(147,166,155,0.25)"}` }}>
          <div className="mb-1.5 text-[9px] font-semibold uppercase" style={{ color: GOLD_SOFT }}>Stacked</div>
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
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function IntegrationStep({ label, helpText, projectHint, url, setUrl, buttonLabel, setButtonLabel, heading, setHeading, subtitle, setSubtitle, bg, setBg, dashboardFileName, dashboardLabel, guestFileName = "guest.html", placeholderUrl, urlHelpText }) {
  return (
    <div>
      <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(201,164,76,0.08)", border: `1px solid rgba(201,164,76,0.2)` }}>
        <p className="text-[11.5px]" style={{ color: GOLD_SOFT, fontFamily: FONT_BODY, lineHeight: 1.5 }}>{helpText}</p>
      </div>
      <FieldLabel>{label} link (for guests)</FieldLabel>
      <TextInput value={url} onChange={setUrl} placeholder={placeholderUrl || `https://your-${projectHint}.example.com/${guestFileName}`} />
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
              <button onClick={() => removeItem(item.id)} style={{ color: "#E29B9B" }}><Trash2 size={15} /></button>
            </div>
            <div className="mt-2">
              <TextInput value={item.url} onChange={(v) => setItem(item.id, { url: v })} placeholder="https://..." />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <GhostButton onClick={addItem}><Plus size={13} /> Add registry</GhostButton>
      </div>
      <BackgroundPicker bg={bg} onChange={setBg} />
    </div>
  );
}

function DraggableBlock({ id, pos, editMode, onMove, label, light, children, selected, onSelect, noMaxWidth, widthPercent, maxHeightPercent }) {
  const ref = useRef(null);
  const draggingRef = useRef(false);

  const computeFromPoint = (clientX, clientY) => {
    const parent = ref.current?.parentElement;
    if (!parent) return null;
    const rect = parent.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    if (widthPercent) {
      x = clampXForImageWidth(x, widthPercent);
    } else {
      x = Math.min(92, Math.max(8, x));
    }
    y = Math.min(94, Math.max(6, y));
    return { x, y };
  };

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

  const onMoveRef = useRef(onMove);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onMoveRef.current = onMove; onSelectRef.current = onSelect; });

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

  return (
    <div
      ref={ref}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
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

  const commitText = () => {
    onMove({ text: draft });
    setEditingText(false);
  };

  if (block.type === "image") {
    const img = (
      <img src={block.url} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }} />
    );
    return (
      <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom image" light={light} selected={selected} onSelect={onSelect} noMaxWidth widthPercent={block.width || 40} maxHeightPercent={PHONE_IMAGE_MAX_HEIGHT_PCT}>
        {img}
      </DraggableBlock>
    );
  }
  return (
    <DraggableBlock id={block.id} pos={{ x: block.x, y: block.y }} editMode={editMode} onMove={onMove} label="Custom text" light={light} selected={selected} onSelect={onSelect}>
      <p
        className="text-center"
        style={{
          fontFamily: block.fontFamily || FONT_BODY,
          color: block.color || (light ? PAPER : EMERALD),
          fontSize: `${block.fontSize || 16}px`,
          lineHeight: 1.4,
        }}
      >
        {block.text || "New text"}
      </p>
    </DraggableBlock>
  );
}

function StoryPage({ bg, children }) {
  const isPhoto = bg.mode === "photo";
  const background = isPhoto ? (bg.image ? `url(${bg.image}) center/cover` : BG_PRESETS[bg.preset].css) : PAPER;
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
              <Sparkles size={16} style={{ color: GOLD_SOFT, margin: "0 auto 10px" }} />
              <div style={{ fontFamily: namesStyle.fontFamily || fontScript, fontSize: namesStyle.fontSize ? `${namesStyle.fontSize}px` : 40, color: namesStyle.color || (light ? PAPER : EMERALD), lineHeight: 1.1 }}>
                {content.name1 || "—"} <span style={{ color: light ? GOLD_SOFT : ROSE }}>&</span> {content.name2 || "—"}
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
              <Sparkles size={14} style={{ color: light ? GOLD_SOFT : GOLD, margin: "0 auto 10px" }} />
              <p style={{ fontFamily: gs.fontFamily || fontDisplay, fontStyle: "italic", fontSize: gs.fontSize ? `${gs.fontSize}px` : 16, color: gs.color || (light ? PAPER : EMERALD), lineHeight: 1.5 }}>{content.greeting}</p>
            </div>
          </DraggableBlock>
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
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY }}>{t.countingDownTo}</div>
              <div style={{ fontFamily: hs.fontFamily || fontScript, fontSize: hs.fontSize ? `${hs.fontSize}px` : 26, color: hs.color || (light ? PAPER : EMERALD), margin: "4px 0 4px" }}>{t.celebrationWord}</div>
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

function RsvpSlide({ content, bg, fontDisplay, fontScript, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, rsvpSettings, totalAttending, onSubmitRsvp }) {
  const hs = layout.heading, bs = layout.buttons;
  const style = rsvpSettings.style || "classic";
  const [choice, setChoice] = useState(null);
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    onSubmitRsvp({ status: choice, names: name.trim() ? [name.trim()] : [], additionalGuests: 0 });
    setSubmitted(true);
  };

  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center">
              <div className="font-semibold" style={{ fontFamily: hs.fontFamily || fontDisplay, fontSize: hs.fontSize ? `${hs.fontSize}px` : 22, color: hs.color || (light ? PAPER : EMERALD) }}>RSVP</div>
            </div>
          </DraggableBlock>
          <DraggableBlock id="buttons" pos={bs} editMode={editMode} onMove={(p) => onMoveBlock("buttons", p)} label="RSVP form" light={light} selected={selectedBlock === "buttons"} onSelect={() => onSelectBlock("buttons")}>
            <div style={{ width: 230 }}>
              {submitted ? (
                <div className="text-center">
                  <CheckCircle2 size={22} color={light ? PAPER : EMERALD} style={{ margin: "0 auto 6px" }} />
                  <p style={{ color: light ? PAPER : EMERALD, fontFamily: fontDisplay, fontStyle: "italic", fontSize: 14 }}>Thank you!</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setChoice("yes")} className="rounded-full px-3 py-2 text-[11px] font-medium" style={{ background: light ? "rgba(255,255,255,0.1)" : PAPER_2, color: light ? PAPER : EMERALD }}>
                      {content.yesLabel}
                    </button>
                    <button onClick={() => setChoice("no")} className="rounded-full px-3 py-2 text-[11px] font-medium" style={{ background: light ? "rgba(255,255,255,0.1)" : PAPER_2, color: light ? PAPER : EMERALD }}>
                      {content.noLabel}
                    </button>
                  </div>
                  {choice && (
                    <div className="mt-3">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-full px-3 py-2 text-center text-[12px] outline-none" style={{ background: light ? "rgba(255,255,255,0.12)" : PAPER_2, color: light ? PAPER : EMERALD }} />
                    </div>
                  )}
                  <button onClick={submit} disabled={!choice} className="mt-3 w-full rounded-full py-2.5 text-[11px] font-bold uppercase" style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER }}>
                    Submit RSVP
                  </button>
                </>
              )}
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function RegistrySlide({ items, bg, fontDisplay, t, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock }) {
  const hs = layout.heading, ls = layout.list;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 230 }}>
              <div className="font-semibold uppercase" style={{ color: light ? GOLD_SOFT : ROSE, letterSpacing: "0.15em", fontFamily: FONT_BODY, fontSize: 10 }}>{t.giftRegistry}</div>
            </div>
          </DraggableBlock>
          <DraggableBlock id="list" pos={ls} editMode={editMode} onMove={(p) => onMoveBlock("list", p)} label="Registry list" light={light} selected={selectedBlock === "list"} onSelect={() => onSelectBlock("list")}>
            <div className="flex flex-col gap-3" style={{ width: 220 }}>
              {items.map((item) => (
                <div key={item.id} className="rounded-xl p-3 text-center" style={{ background: light ? "rgba(255,255,255,0.12)" : PAPER_2 }}>
                  <div className="font-medium" style={{ color: light ? PAPER : EMERALD, fontFamily: fontDisplay, fontSize: 13 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function IntegrationSlide({ icon: Icon, heading, subtitle, buttonLabel, url, bg, fontDisplay, layout, editMode, onMoveBlock, selectedBlock, onSelectBlock, paid, price, paymentUrl }) {
  const hs = layout.heading, bs = layout.button;
  return (
    <StoryPage bg={bg}>
      {(light) => (
        <div className="relative h-full w-full">
          <DraggableBlock id="heading" pos={hs} editMode={editMode} onMove={(p) => onMoveBlock("heading", p)} label="Heading" light={light} selected={selectedBlock === "heading"} onSelect={() => onSelectBlock("heading")}>
            <div className="text-center" style={{ width: 220 }}>
              <Icon size={26} color={light ? GOLD_SOFT : EMERALD} style={{ margin: "0 auto 10px" }} />
              <div className="font-semibold" style={{ fontFamily: fontDisplay, fontStyle: "italic", fontSize: 18, color: light ? PAPER : EMERALD }}>{heading}</div>
            </div>
          </DraggableBlock>
          <DraggableBlock id="button" pos={bs} editMode={editMode} onMove={(p) => onMoveBlock("button", p)} label="Button" light={light} selected={selectedBlock === "button"} onSelect={() => onSelectBlock("button")}>
            <span className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-semibold" style={{ background: light ? GOLD : EMERALD, color: light ? INK : PAPER }}>
              {buttonLabel}
            </span>
          </DraggableBlock>
        </div>
      )}
    </StoryPage>
  );
}

function WaxSealGate({ tapText, design }) {
  const d = ENVELOPE_STYLES[design] || ENVELOPE_STYLES.kraftGold;
  const EngraveIcon = d.engrave;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: d.envelopeBg }}>
      <div className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full" style={{ width: 112, height: 112, transform: "translate(-50%, -50%)", background: d.waxOuter }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 86, height: 86, background: d.waxInner }}>
          {EngraveIcon && <EngraveIcon size={34} color={d.engraveColor} strokeWidth={1.3} />}
        </div>
      </div>
      <div className="absolute inset-x-0 z-10" style={{ bottom: "17%" }}>
        <p className="text-center text-[12px] font-semibold uppercase" style={{ color: "#F3E6C8", letterSpacing: "0.35em", fontFamily: FONT_BODY }}>{tapText}</p>
      </div>
    </div>
  );
}

function PhonePreview({ data, steps, activeIndex, onNavigate, lang, layoutEditMode, onMoveBlock, started, onStart, selectedBlockId, onSelectBlock, onMoveCustomBlock, onRemoveCustomBlock, onSubmitRsvp, fullscreen }) {
  const [playing, setPlaying] = useState(false);
  const cardRef = useRef(null);
  const [fsScale, setFsScale] = useState(1);
  const [gateClosing, setGateClosing] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => setAnimKey((k) => k + 1), [activeIndex]);

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

  const gateImage = data.pageBackgrounds.cover.image;
  const gateBackground = gateImage ? `url(${gateImage}) center/cover` : BG_PRESETS[data.pageBackgrounds.cover.preset].css;
  const tapText = data.content[lang].cover.tapText || t.tapToStart;

  const renderSlide = (key) => {
    const layout = data.layouts[key] || DEFAULT_LAYOUTS[key];
    const bg = data.pageBackgrounds[key];
    const onMove = (id, p) => onMoveBlock(key, id, p);
    const common = { editMode: layoutEditMode, selectedBlock: selectedBlockId, onSelectBlock };
    switch (key) {
      case "cover": return <CoverSlide content={data.content[lang].cover} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} layout={layout} onMoveBlock={onMove} {...common} />;
      case "family": return <FamilySlide content={data.content[lang].family} bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common} />;
      case "timeline": return <TimelineSlide items={data.timeline} lang={lang} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      case "locations": return <LocationsSlide items={data.locations} lang={lang} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      case "countdown": return <CountdownSlide schedule={data.rsvpSchedule} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} locale={LANG_META[lang].locale} layout={layout} onMoveBlock={onMove} {...common} />;
      case "rsvp": return <RsvpSlide content={data.content[lang].rsvp} bg={bg} fontDisplay={fontDisplay} fontScript={fontScript} t={t} layout={layout} onMoveBlock={onMove} rsvpSettings={data.rsvpSettings} totalAttending={data.totalAttending} onSubmitRsvp={onSubmitRsvp} {...common} />;
      case "registry": return <RegistrySlide items={data.registry} bg={bg} fontDisplay={fontDisplay} t={t} layout={layout} onMoveBlock={onMove} {...common} />;
      default: return <IntegrationSlide icon={Video} heading="Live" subtitle="" buttonLabel="Open" url="" bg={bg} fontDisplay={fontDisplay} layout={layout} onMoveBlock={onMove} {...common} />;
    }
  };

  return (
    <div className={fullscreen ? "flex flex-col items-center justify-center" : "flex flex-col items-center"} style={fullscreen ? { width: "100%", minHeight: "100vh", background: INK } : undefined}>
      <div ref={cardRef} className="relative flex-shrink-0" style={{ width: 292, height: 600, background: "#000", borderRadius: 42, padding: 10, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
        <div className="relative overflow-hidden" style={{ borderRadius: 32, background: PAPER, height: "100%", width: "100%" }} dir={dir}>
          <div key={animKey} className="h-full w-full" style={{ animation: `${direction > 0 ? "slideUpIn" : "slideDownIn"} 0.35s ease` }}>
            {renderSlide(stepKey)}
          </div>
          {(!started || gateClosing) && (
            <div className="absolute inset-0 z-40 overflow-hidden">
              <button
                onClick={() => {
                  if (gateClosing) return;
                  setGateClosing(true);
                  setTimeout(() => { onStart(); setGateClosing(false); }, 480);
                }}
                className="absolute inset-0"
              >
                <WaxSealGate tapText={tapText} design={data.intro.sealDesign} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsView({ og, setOg, autoTitle, autoDescription, slug, siteDomain, setSiteDomain }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>Site domain</h2>
      <TextInput value={siteDomain} onChange={setSiteDomain} placeholder="your-project.vercel.app" />
    </div>
  );
}

function RsvpSettingsView({ rsvpSettings, updateRsvpSettings }) {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
      <h2 className="mb-1 text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>RSVP configuration</h2>
    </div>
  );
}

function DashboardView({ guestGroups, addGuestGroup, updateGuestGroup, deleteGuestGroup, tables, addTable, updateTable, deleteTable, assignGuestToTable }) {
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-xl" style={{ color: IVORY }}>Guests & RSVP</h2>
    </div>
  );
}

function UsersView({ users }) {
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-xl" style={{ color: IVORY }}>Users Management</h2>
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
    if (key === REQUIRED_STEP_KEY) return;
    setPageOrder((order) => {
      const i = order.indexOf(key);
      const j = i + direction;
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
    djUrl: "", djButtonLabel: "Request a Song", djHeading: "Song Requests", djSubtitle: "Have a song you want to hear tonight?",
    networkingUrl: "", networkingButtonLabel: "Open Guest Networking", networkingHeading: "Meet the Other Guests", networkingSubtitle: "Discover guests.",
    livestreamUrl: "", livestreamButtonLabel: "Watch Live", livestreamHeading: "Join Us Live", livestreamSubtitle: "Streamed just for you.",
    livestreamPaid: false, livestreamPrice: "$10", livestreamPaymentUrl: "",
  });
  const updateIntegrations = (patch) => setIntegrations((i) => ({ ...i, ...patch }));
  const [users, setUsers] = useState(seedUsers);
  const [siteDomain, setSiteDomain] = useState("einvite.me");
  const [actingAsUser, setActingAsUser] = useState(null);
  const [intro, setIntro] = useState(defaultIntroSettings);

  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));

  const [saveStatus, setSaveStatus] = useState("idle");

  const selectStep = (i) => { setActiveIndex(i); setVisited((v) => new Set(v).add(i)); setStarted(true); setSelectedBlockId(null); };

  const updateContentSection = (stepKey, patch) =>
    setContent((c) => ({ ...c, [activeLang]: { ...c[activeLang], [stepKey]: { ...c[activeLang][stepKey], ...patch } } }));

  const setBgFor = (stepKey) => (bg) => setPageBackgrounds((p) => ({ ...p, [stepKey]: bg }));

  const moveBlock = (stepKey, blockId, pos) =>
    setLayouts((l) => ({ ...l, [stepKey]: { ...l[stepKey], [blockId]: { ...l[stepKey][blockId], ...pos } } }));

  // ------------------------------------------------------------------ //
  // Load & Save using the "invitations" table via Supabase REST API      //
  // ------------------------------------------------------------------ //
  const currentSlug = `${content.en.cover.name1}-${content.en.cover.name2}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-wedding";

  useEffect(() => {
    if (!persistentStorage.available()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await persistentStorage.get(currentSlug);
        if (cancelled || !res?.value) return;
        const d = JSON.parse(res.value);
        if (d.content) setContent(d.content);
        if (d.timeline) setTimeline(d.timeline);
        if (d.locations) setLocations(d.locations);
        if (d.registry) setRegistry(d.registry);
        if (d.guestGroups) setGuestGroups(d.guestGroups);
        if (d.tables) setTables(d.tables);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [currentSlug]);

  const saveDraft = async () => {
    if (!persistentStorage.available()) {
      setSaveStatus("unavailable");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    setSaveStatus("saving");
    const payload = {
      content, timeline, locations, registry, enabledSteps, pageOrder, rsvpSchedule, defaultLang, enabledLanguages, layouts, customBlocks,
      guestGroups, tables, rsvpSettings, users, integrations, siteDomain, ogText: { title: og.title, description: og.description }, intro
    };
    try {
      const res = await persistentStorage.set(currentSlug, JSON.stringify(payload));
      if (res) setSaveStatus("saved");
      else setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 3200);
  };

  const submitGuestRsvp = ({ names, status, additionalGuests }) => {
    const cleanNames = (names || []).filter((n) => n && n.trim());
    setGuestGroups((list) => [
      {
        id: uid(),
        lastName: "",
        members: cleanNames.length ? cleanNames.map((n) => ({ id: uid(), name: n, status })) : status === "no" ? [{ id: uid(), name: "Guest", status }] : [],
        additionalGuests: status === "yes" ? additionalGuests || 0 : 0,
        table: "",
        phone: "",
        invitationSent: false,
        invitationViewed: true,
        updatedAt: Date.now(),
      },
      ...list,
    ]);
  };

  const totalAttending = flattenMembers(guestGroups).filter((m) => m.status === "yes").length;
  const data = { content, timeline, locations, registry, pageBackgrounds, music, rsvpSchedule, layouts, intro, customBlocks, rsvpSettings, totalAttending, integrations };
  const stepKey = steps[activeIndex].key;
  const c = content[activeLang];

  const autoTitle = `${content.en.cover.name1} & ${content.en.cover.name2} — Wedding Invitation`;
  const autoDescription = content.en.cover.intro;

  return (
    <div className="min-h-screen w-full" style={{ background: INK, fontFamily: FONT_BODY }}>
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase" style={{ color: GOLD, letterSpacing: "0.2em" }}>eInvite.me</div>
            <h1 className="mt-1 text-2xl" style={{ fontFamily: activeLang === "ar" ? FONT_AR : FONT_DISPLAY, color: IVORY, fontStyle: activeLang === "ar" ? "normal" : "italic" }}>
              {c.cover.name1 || "—"} & {c.cover.name2 || "—"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && <span className="text-[11px]" style={{ color: GOLD_SOFT }}>Saved ✓</span>}
            {saveStatus === "error" && <span className="text-[11px]" style={{ color: "#E29B9B" }}>Couldn't save — try again</span>}
            <GoldButton onClick={saveDraft}>
              <Check size={14} /> {saveStatus === "saving" ? "Saving…" : "Save invitation"}
            </GoldButton>
          </div>
        </div>

        <TabBar view={view} setView={setView} isClientPortal={!!actingAsUser} />

        {view === "builder" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl p-6" style={{ background: INK_2, border: `1px solid rgba(201,164,76,0.12)` }}>
              <LangSwitcher activeLang={activeLang} setActiveLang={setActiveLang} defaultLang={defaultLang} setDefaultLang={setDefaultLang} enabledLanguages={enabledLanguages} onToggleLanguage={toggleLanguage} />
              <StepRail steps={steps} activeIndex={activeIndex} visited={visited} onSelect={selectStep} />

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", color: IVORY }}>{steps[activeIndex].label}</h2>
              </div>

              {stepKey === "cover" && (
                <CoverStep
                  c={c.cover}
                  updateContent={(p) => updateContentSection("cover", p)}
                  bg={pageBackgrounds.cover}
                  setBg={setBgFor("cover")}
                  music={music}
                  updateMusic={(p) => setMusic((m) => ({ ...m, ...p }))}
                  onUploadAudio={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setMusic((m) => ({ ...m, url: URL.createObjectURL(file), name: file.name }));
                  }}
                  onRemoveAudio={() => setMusic((m) => ({ ...m, url: null, name: "" }))}
                  intro={intro}
                  updateIntro={(p) => setIntro((i) => ({ ...i, ...p }))}
                  activeLang={activeLang}
                />
              )}
              {stepKey === "family" && <FamilyStep c={c.family} updateContent={(p) => updateContentSection("family", p)} bg={pageBackgrounds.family} setBg={setBgFor("family")} />}
              {stepKey === "timeline" && <TimelineStep items={timeline} update={setTimeline} activeLang={activeLang} bg={pageBackgrounds.timeline} setBg={setBgFor("timeline")} />}
              {stepKey === "locations" && <LocationsStep items={locations} update={setLocations} activeLang={activeLang} bg={pageBackgrounds.locations} setBg={setBgFor("locations")} />}
              {stepKey === "countdown" && <CountdownStep schedule={rsvpSchedule} setSchedule={(p) => setRsvpSchedule((s) => ({ ...s, ...p }))} bg={pageBackgrounds.countdown} setBg={setBgFor("countdown")} />}
              {stepKey === "rsvp" && <RsvpStep c={c.rsvp} updateContent={(p) => updateContentSection("rsvp", p)} bg={pageBackgrounds.rsvp} setBg={setBgFor("rsvp")} rsvpSettings={rsvpSettings} updateRsvpSettings={(p) => setRsvpSettings((s) => ({ ...s, ...p }))} />}
              {stepKey === "registry" && <RegistryStep items={registry} update={setRegistry} activeLang={activeLang} bg={pageBackgrounds.registry} setBg={setBgFor("registry")} />}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "rgba(147,166,155,0.15)" }}>
                <GhostButton onClick={() => selectStep(Math.max(0, activeIndex - 1))}>
                  <ChevronDown size={13} /> Back
                </GhostButton>
                {activeIndex < steps.length - 1 ? (
                  <GoldButton onClick={() => selectStep(activeIndex + 1)}>Next <ChevronUp size={14} /></GoldButton>
                ) : (
                  <GoldButton onClick={saveDraft}><Check size={14} /> Finish & Save</GoldButton>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3 lg:sticky lg:top-10 lg:w-auto lg:self-start">
              <PhonePreview
                data={data}
                steps={steps}
                activeIndex={activeIndex}
                onNavigate={selectStep}
                lang={activeLang}
                layoutEditMode={layoutEditMode}
                onMoveBlock={moveBlock}
                started={started}
                onStart={() => setStarted(true)}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onMoveCustomBlock={() => {}}
                onRemoveCustomBlock={() => {}}
                onSubmitRsvp={submitGuestRsvp}
              />
              <div className="w-full">
                <PagesManager orderedAllSteps={orderedAllSteps} enabledSteps={enabledSteps} onToggle={toggleStepVisibility} onMove={moveStepOrder} />
              </div>
            </div>
          </div>
        )}

        {view === "settings" && <SettingsView og={og} setOg={setOg} autoTitle={autoTitle} autoDescription={autoDescription} slug={currentSlug} siteDomain={siteDomain} setSiteDomain={setSiteDomain} />}
        {view === "dashboard" && <DashboardView guestGroups={guestGroups} tables={tables} />}
        {view === "users" && <UsersView users={users} />}
      </div>
    </div>
  );
}
