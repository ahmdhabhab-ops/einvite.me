import React, { useEffect, useRef, useState } from "react";
import { Plus, X, Sparkles, Info, RotateCcw, ArrowRight, Printer, Download, Heart, PartyPopper, Crown, Church, Gift, CalendarDays, Globe, Check } from "lucide-react";
import foliageA from "./assets/foliage-a.webp";
import foliageB from "./assets/foliage-b.webp";
import { LANDING_LANGS, LANDING_LANG_NAMES } from "./landingText.js";
import { CALC_TEXT } from "./calculatorText.js";

// The free budget calculator: /cost-calculator lets visitors pick an
// occasion, and /<occasion>-cost-calculator opens that occasion directly.
// Each occasion has its own categories and items; everything typed stays in
// this browser only. Styled like the home page, in the same five languages
// (all text is in calculatorText.js), sharing the home page's language choice.

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_AR = "'Cairo', sans-serif";
const FONT_HY = "'Noto Serif Armenian', serif";
const fontsFor = (lang) =>
  lang === "ar" ? { display: FONT_AR, body: FONT_AR, headingStyle: "normal" }
  : lang === "hy" ? { display: FONT_HY, body: "'Inter', 'Noto Serif Armenian', sans-serif", headingStyle: "normal" }
  : { display: FONT_DISPLAY, body: FONT_BODY, headingStyle: "italic" };

// Same palette as the home page (LP in App.jsx).
const LP = {
  bg: "#2B3830",
  pageGradient: "linear-gradient(180deg, #313F36 0%, #2C3931 18%, #2A3730 55%, #26322B 100%)",
  text: "#F3EDE1",
  text2: "#CFC3AC",
  gold: "#D4AB4E",
  goldSoft: "#E2C88E",
  onGold: "#22302A",
  card: "rgba(243,237,225,0.045)",
  cardHi: "rgba(243,237,225,0.075)",
  line: "rgba(243,237,225,0.11)",
  outline: "rgba(243,237,225,0.28)",
  goldShadow: "0 10px 28px -12px rgba(212,171,78,0.55)",
};
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.93 0 0 0 0 0.88 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// Each occasion's shape: which items are "per guest" (1) in each category.
// The names for every language are in calculatorText.js, in the same order.
export const OCCASIONS = [
  { id: "wedding", slug: "wedding", icon: Heart, placeholder: 120, perGuest: [[0, 1, 1], [0, 0], [0, 0], [0, 0], [0, 0], [0, 1, 0], [0, 0, 0]] },
  { id: "birthday", slug: "birthday", icon: PartyPopper, placeholder: 30, perGuest: [[0, 1, 1], [0, 0], [0, 0, 0], [0, 0, 0], [0, 0], [0, 1], [0, 0, 0]] },
  { id: "quinceanera", slug: "quinceanera", icon: Crown, placeholder: 150, perGuest: [[0, 1, 1], [0, 0, 0], [0, 0, 0], [0, 0], [0, 0], [0, 0], [0, 0, 1], [0, 0, 0]] },
  { id: "baptism", slug: "baptism", icon: Church, placeholder: 60, perGuest: [[0, 0], [0, 1, 1], [0, 0], [0, 0, 0], [0, 1], [0, 0], [0, 0, 0]] },
  { id: "babyShower", slug: "baby-shower", icon: Gift, placeholder: 25, perGuest: [[0, 1, 1], [0, 0], [0, 0, 0], [0, 0], [0], [0, 1], [0, 0, 0]] },
  { id: "party", slug: "party", icon: CalendarDays, placeholder: 50, perGuest: [[0, 1, 1], [0, 0, 0], [0, 0], [0, 0], [0, 0], [0, 1], [0, 0, 0]] },
];
export const occasionPath = (o) => `/${o.slug}-cost-calculator`;
const occasionBySlug = (slug) => OCCASIONS.find((o) => o.slug === slug) || null;

// Shares the home page's language choice (same key as LANDING_LANG_KEY in App.jsx).
const LANG_KEY = "einvite:landing-lang";
function initialLang() {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (LANDING_LANGS.includes(saved)) return saved;
  } catch {}
  const prefs = typeof navigator !== "undefined" ? (navigator.languages || [navigator.language]) : [];
  for (const pref of prefs) {
    const code = String(pref || "").slice(0, 2).toLowerCase();
    if (LANDING_LANGS.includes(code)) return code;
  }
  return "en";
}

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));

let idCounter = 0;
const newId = () => `c${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// Built-in items are stored without a name (it comes from the current
// language); only the costs someone adds carry their own.
const freshState = (o) => ({
  guests: "",
  categories: o.perGuest.map((flags, ci) => ({
    id: `cat${ci}`,
    items: flags.map((pg, ii) => ({ id: `i${ci}-${ii}`, qty: "1", cost: "", custom: false })),
  })),
});
const storageKey = (o) => `einvite:cost-calculator-${o.id}`;
function loadState(o) {
  const fresh = freshState(o);
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(o)) || "null");
    if (!saved || !Array.isArray(saved.categories)) return fresh;
    return {
      guests: typeof saved.guests === "string" ? saved.guests : "",
      categories: fresh.categories.map((c) => {
        const s = saved.categories.find((x) => x?.id === c.id);
        if (!s || !Array.isArray(s.items)) return c;
        const known = new Set(c.items.map((i) => i.id));
        const items = s.items.filter((i) => i && i.id && (i.custom || known.has(i.id)));
        // Keep any built-in item a saved list is missing.
        for (const base of c.items) if (!items.some((i) => i.id === base.id)) items.push(base);
        return { id: c.id, items };
      }),
    };
  } catch {
    return fresh;
  }
}

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const dateLabel = (lang) => {
  try { return new Date().toLocaleDateString(lang === "hy" ? "hy-AM" : lang, { year: "numeric", month: "long", day: "numeric" }); } catch { return new Date().toDateString(); }
};

// Everything the page, print sheet and PDF need, in one shape.
function summarize(o, text, state) {
  const guests = Math.floor(num(state.guests));
  const cats = o.perGuest.map((flags, ci) => {
    const [title, subtitle, names] = text.cats[ci];
    const items = state.categories[ci].items.map((x) => {
      const builtIn = !x.custom && /^i\d+-(\d+)$/.exec(x.id);
      const ii = builtIn ? Number(builtIn[1]) : -1;
      const perGuest = ii >= 0 && !!flags[ii];
      const q = perGuest ? guests : num(x.qty);
      return { ...x, name: ii >= 0 ? names[ii] : x.name || "", perGuest, q, each: num(x.cost), total: q * num(x.cost) };
    });
    return { id: state.categories[ci].id, title, subtitle, items, total: items.reduce((s, x) => s + x.total, 0) };
  });
  const total = cats.reduce((s, c) => s + c.total, 0);
  return { guests, cats, total, perGuest: guests > 0 ? total / guests : 0 };
}

// A text PDF, drawn with the PDF's built-in fonts (Latin letters only).
async function saveTextPdf(o, text, ui, lang, sum) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const cols = { qty: W - M - 210, each: W - M - 110, total: W - M };
  let y = 0;
  const footer = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(140, 140, 140);
    doc.text(ui.pdfNote, M, H - 26);
    doc.text("einvite.me", W - M, H - 26, { align: "right" });
  };
  const room = (h) => { if (y + h > H - 50) { footer(); doc.addPage(); y = M; } };

  doc.setFillColor(43, 56, 48); doc.rect(0, 0, W, 104, "F");
  doc.setFont("times", "italic"); doc.setFontSize(20); doc.setTextColor(243, 237, 225);
  doc.text("eInvite", M, 42);
  doc.setTextColor(212, 171, 78); doc.text(".me", M + doc.getTextWidth("eInvite"), 42);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(207, 195, 172);
  doc.text(ui.eyebrow.toUpperCase(), W - M, 42, { align: "right" });
  doc.setFont("times", "normal"); doc.setFontSize(24); doc.setTextColor(243, 237, 225);
  doc.text(text.title, M, 82);

  y = 140;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(110, 110, 110);
  doc.text(`${fill(ui.prepared, { date: dateLabel(lang) })}${sum.guests ? `  ·  ${fill(ui.guestsN, { n: sum.guests })}` : ""}`, M, y);
  y += 30;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(150, 118, 40);
  doc.text(ui.estimatedTotal.toUpperCase(), M, y);
  y += 30;
  doc.setFontSize(30); doc.setTextColor(34, 48, 42); doc.text(money(sum.total), M, y);
  if (sum.perGuest) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(110, 110, 110);
    doc.text(fill(ui.aboutPerGuest, { amount: money(Math.round(sum.perGuest)) }), M, y + 18);
    y += 18;
  }
  y += 30;

  const shown = sum.cats.filter((c) => c.total > 0);
  if (!shown.length) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(110, 110, 110);
    doc.text(ui.noPrices, M, y);
  }
  for (const c of shown) {
    room(80);
    doc.setDrawColor(212, 171, 78); doc.setLineWidth(1); doc.line(M, y, W - M, y);
    y += 22;
    doc.setFont("times", "bold"); doc.setFontSize(14); doc.setTextColor(34, 48, 42);
    doc.text(c.title, M, y);
    doc.text(money(c.total), cols.total, y, { align: "right" });
    y += 20;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
    doc.text(ui.item.toUpperCase(), M, y); doc.text(ui.qty.toUpperCase(), cols.qty, y, { align: "right" }); doc.text(ui.costEach.toUpperCase(), cols.each, y, { align: "right" }); doc.text(ui.total.toUpperCase(), cols.total, y, { align: "right" });
    y += 6;
    for (const x of c.items.filter((i) => i.total > 0)) {
      room(22);
      y += 16;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(40, 40, 40);
      doc.text(doc.splitTextToSize(`${x.name || ui.otherCost}${x.perGuest ? ` (${ui.perGuest})` : ""}`, cols.qty - M - 40)[0], M, y);
      doc.setTextColor(90, 90, 90);
      doc.text(String(x.q), cols.qty, y, { align: "right" });
      doc.text(money(x.each), cols.each, y, { align: "right" });
      doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "bold");
      doc.text(money(x.total), cols.total, y, { align: "right" });
      y += 6;
      doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.5); doc.line(M, y, W - M, y);
    }
    y += 26;
  }
  if (shown.length) {
    room(40);
    doc.setFillColor(246, 241, 228); doc.rect(M, y - 4, W - 2 * M, 34, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(34, 48, 42);
    doc.text(ui.estimatedTotal, M + 12, y + 17);
    doc.text(money(sum.total), cols.total - 12, y + 17, { align: "right" });
  }
  footer();
  doc.save(`einvite-${o.slug}-budget.pdf`);
}

// Any script (Arabic, Armenian…): the browser draws the print sheet, and the
// PDF holds that picture, split into A4 pages between rows.
async function saveImagePdf(sheet, filename) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff;padding:56px 60px;box-sizing:border-box;";
  const clone = sheet.cloneNode(true);
  clone.style.display = "block";
  holder.appendChild(clone);
  document.body.appendChild(holder);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const scale = 2;
    const canvas = await html2canvas(holder, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const top = holder.getBoundingClientRect().top;
    const breaks = [...holder.querySelectorAll("[data-pdf-row]")].map((el) => Math.round((el.getBoundingClientRect().bottom - top) * scale));
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const pxPerPt = canvas.width / W;
    const pageH = Math.floor(H * pxPerPt);
    let start = 0;
    let first = true;
    while (start < canvas.height - 2) {
      // Pages after the first start at a row, below a small top margin.
      const room = first ? pageH : pageH - Math.round(36 * pxPerPt);
      let end = Math.min(start + room, canvas.height);
      if (end < canvas.height) {
        const fit = breaks.filter((b) => b > start + room * 0.3 && b <= end);
        if (fit.length) end = fit[fit.length - 1];
      }
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = end - start;
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
      if (!first) doc.addPage();
      doc.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, first ? 0 : 36, W, slice.height / pxPerPt);
      first = false;
      start = end;
    }
    doc.save(filename);
  } finally {
    holder.remove();
  }
}

function LangSwitcher({ lang, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="landing-link flex items-center gap-1 text-[12.5px] font-semibold" aria-label={label} aria-expanded={open}>
        <Globe size={15} /> {lang.toUpperCase()}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[150px] overflow-hidden rounded-xl py-1" style={{ background: "#26322B", border: `1px solid ${LP.line}`, boxShadow: "0 20px 40px -20px rgba(0,0,0,0.6)" }}>
          {LANDING_LANGS.map((code) => (
            <button
              key={code}
              onClick={() => { onChange(code); setOpen(false); }}
              dir={code === "ar" ? "rtl" : "ltr"}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-[13.5px]"
              style={{ color: code === lang ? LP.gold : LP.text, background: code === lang ? "rgba(212,171,78,0.08)" : "transparent", fontFamily: fontsFor(code).body }}
            >
              {LANDING_LANG_NAMES[code]}
              {code === lang && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OccasionPicker({ current, onPick, large, texts }) {
  return (
    <div className={large ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" : "flex flex-wrap justify-center gap-2"}>
      {OCCASIONS.map((o) => {
        const Icon = o.icon;
        const active = current?.id === o.id;
        const name = texts[o.id].name;
        return large ? (
          <button key={o.id} onClick={() => onPick(o)} className="landing-card flex flex-col items-center gap-3 rounded-2xl px-4 py-6 text-center" style={{ background: LP.card, border: `1px solid ${LP.line}` }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(212,171,78,0.12)" }}><Icon size={21} color={LP.gold} strokeWidth={1.6} /></span>
            <span className="text-[14.5px] font-semibold" style={{ color: LP.text }}>{name}</span>
          </button>
        ) : (
          <button key={o.id} onClick={() => onPick(o)} aria-pressed={active} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors" style={active ? { background: LP.gold, color: LP.onGold, border: `1px solid ${LP.gold}` } : { background: LP.card, color: LP.text2, border: `1px solid ${LP.line}` }}>
            <Icon size={14} strokeWidth={1.8} /> {name}
          </button>
        );
      })}
    </div>
  );
}

function Calculator({ o, lang, fonts }) {
  const T = CALC_TEXT[lang] || CALC_TEXT.en;
  const ui = T.ui;
  const text = T.occasions[o.id];
  const rtl = lang === "ar";
  const [state, setState] = useState(() => loadState(o));
  const [pdfBusy, setPdfBusy] = useState(false);
  const sheetRef = useRef(null);
  useEffect(() => {
    try { window.localStorage.setItem(storageKey(o), JSON.stringify(state)); } catch {}
  }, [o, state]);

  const sum = summarize(o, text, state);
  const updateItem = (catId, itemId, patch) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: c.items.map((x) => (x.id === itemId ? { ...x, ...patch } : x)) })) }));
  const addItem = (catId) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: [...c.items, { id: newId(), name: "", qty: "1", cost: "", custom: true }] })) }));
  const removeItem = (catId, itemId) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: c.items.filter((x) => x.id !== itemId) })) }));
  const clearAll = () => { if (window.confirm(ui.clearConfirm)) setState(freshState(o)); };

  const onPdf = async () => {
    setPdfBusy(true);
    try {
      // Everything the text PDF would draw; anything beyond Latin letters
      // goes through the picture version instead.
      const used = [text.title, ui.eyebrow, ui.prepared, dateLabel(lang), ui.guestsN, ui.estimatedTotal, ui.aboutPerGuest, ui.noPrices, ui.pdfNote, ui.item, ui.qty, ui.costEach, ui.total, ui.perGuest, ui.otherCost,
        ...sum.cats.flatMap((c) => [c.title, ...c.items.map((x) => x.name)])].join("");
      if (/[^\x00-\xFF]/.test(used)) await saveImagePdf(sheetRef.current, `einvite-${o.slug}-budget.pdf`);
      else await saveTextPdf(o, text, ui, lang, sum);
    } catch (err) {
      console.error("PDF failed:", err);
      window.print();
    } finally {
      setPdfBusy(false);
    }
  };

  const eyebrow = { fontSize: 11, fontWeight: 600, letterSpacing: rtl ? 0 : "0.2em", textTransform: "uppercase", color: LP.goldSoft };
  const heading = (size) => ({ fontFamily: fonts.display, fontStyle: fonts.headingStyle, fontWeight: 500, fontSize: size, color: LP.text, lineHeight: rtl ? 1.4 : 1.2 });
  const field = "calc-field w-full rounded-lg px-3 py-2 text-[14px] outline-none";
  const Money = ({ value }) => <bdi dir="ltr">{money(value)}</bdi>;

  return (
    <>
      <div className="calc-screen mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <section className="flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: "linear-gradient(135deg, rgba(212,171,78,0.16), rgba(212,171,78,0.05))", border: "1px solid rgba(212,171,78,0.3)" }}>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(212,171,78,0.16)", color: LP.gold }}><Sparkles size={20} /></span>
              <div>
                <div className="text-[18px] font-semibold" style={{ color: LP.text }}>{ui.guestTitle}</div>
                <div className="mt-0.5 text-[13.5px]" style={{ color: LP.text2 }}>{ui.guestHint}</div>
              </div>
            </div>
            <label className="block flex-shrink-0 sm:w-44">
              <span className="mb-1.5 block text-[12px] font-semibold" style={{ color: LP.goldSoft }}>{ui.guestLabel}</span>
              <input
                type="text" inputMode="numeric" dir="ltr" value={state.guests} placeholder={`${ui.eg} ${o.placeholder}`}
                onChange={(e) => setState((s) => ({ ...s, guests: e.target.value.replace(/[^\d]/g, "").slice(0, 6) }))}
                className={`${field} py-3 text-[15px] ${rtl ? "text-right" : ""}`}
              />
            </label>
          </section>

          <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div style={eyebrow}>{ui.yourEstimate}</div>
              <h2 className="mt-1" style={heading(30)}>{ui.planByCategory}</h2>
            </div>
            <div className="flex items-center gap-4 text-[12.5px]" style={{ color: LP.text2 }}>
              <button onClick={clearAll} className="landing-link inline-flex items-center gap-1"><RotateCcw size={12} /> {ui.clearAll}</button>
              <span>{ui.amountsIn}</span>
            </div>
          </div>

          <div className="space-y-5">
            {sum.cats.map((c, ci) => (
              <section key={c.id} className="overflow-hidden rounded-3xl" style={{ background: LP.card, border: `1px solid ${LP.line}` }}>
                <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(212,171,78,0.1)", border: "1px solid rgba(212,171,78,0.28)", fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 15, color: LP.goldSoft }}>{String(ci + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-[17px] font-semibold" style={{ color: LP.text }}>{c.title}</h3>
                      <div className="text-[13px]" style={{ color: LP.text2 }}>{c.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-[18px] font-semibold" style={{ color: LP.goldSoft }}><Money value={c.total} /></div>
                </div>

                <div className="hidden grid-cols-[minmax(0,1fr)_88px_120px_96px] gap-3 px-6 pb-2 pt-2 sm:grid" style={{ ...eyebrow, fontSize: 10.5, letterSpacing: rtl ? 0 : "0.14em", color: LP.text2, borderBottom: `1px solid ${LP.line}` }}>
                  <span>{ui.item}</span><span className="text-center">{ui.qty}</span><span>{ui.costEach}</span><span className="text-end">{ui.total}</span>
                </div>

                {c.items.map((x) => (
                  <div key={x.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_88px_120px_96px] sm:px-6" style={{ borderBottom: `1px solid ${LP.line}` }}>
                    <div className="col-span-3 flex min-w-0 items-center gap-2 sm:col-span-1">
                      {x.custom ? (
                        <input value={x.name} onChange={(e) => updateItem(c.id, x.id, { name: e.target.value.slice(0, 60) })} placeholder={ui.customPh} className={field} autoFocus={!x.name} />
                      ) : (
                        <div>
                          <div className="text-[14.5px] font-medium" style={{ color: LP.text }}>{x.name}</div>
                          {x.perGuest && <div className="text-[12px] font-medium" style={{ color: LP.gold }}>{ui.perGuest}</div>}
                        </div>
                      )}
                      {x.custom && (
                        <button onClick={() => removeItem(c.id, x.id)} aria-label={ui.remove} className="landing-link flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"><X size={14} /></button>
                      )}
                    </div>
                    {x.perGuest ? (
                      <div title={ui.usesGuestCount} className="flex h-[38px] items-center justify-center rounded-lg text-[13.5px]" style={{ background: "rgba(212,171,78,0.08)", border: "1px dashed rgba(212,171,78,0.35)", color: sum.guests ? LP.text : LP.text2 }}>{sum.guests || ui.guestsPill}</div>
                    ) : (
                      <input type="text" inputMode="numeric" dir="ltr" value={x.qty} onChange={(e) => updateItem(c.id, x.id, { qty: e.target.value.replace(/[^\d]/g, "").slice(0, 5) })} aria-label={`${x.name || ui.otherCost} · ${ui.qty}`} className={`${field} text-center`} />
                    )}
                    <div className="relative" dir="ltr">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px]" style={{ color: LP.text2 }}>$</span>
                      <input type="text" inputMode="decimal" value={x.cost} placeholder="0" onChange={(e) => updateItem(c.id, x.id, { cost: e.target.value.replace(/[^\d.,]/g, "").slice(0, 12) })} aria-label={`${x.name || ui.otherCost} · ${ui.costEach}`} className={`${field} pl-7`} />
                    </div>
                    <div className="text-end text-[14.5px] font-semibold" style={{ color: LP.text }}><Money value={x.total} /></div>
                  </div>
                ))}

                <div className="px-5 py-4 sm:px-6">
                  <button onClick={() => addItem(c.id)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: LP.gold }}><Plus size={14} /> {ui.addCost}</button>
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: LP.cardHi, border: `1px solid ${LP.line}`, boxShadow: "0 30px 60px -40px rgba(0,0,0,0.6)" }}>
            <div aria-hidden className="pointer-events-none absolute -end-20 -top-20 h-44 w-44 rounded-full" style={{ border: "20px solid rgba(212,171,78,0.08)" }} />
            <div className="relative">
              <div className="flex items-center gap-2" style={eyebrow}><span style={{ color: LP.gold, fontSize: 14 }}>✳</span> {ui.liveEstimate}</div>
              <h2 className="mt-5" style={heading(24)}>{ui.yourTotal}</h2>
              <div className="mt-3" style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: "clamp(34px, 4vw, 44px)", color: LP.gold, letterSpacing: "-0.02em", lineHeight: 1.1 }}><Money value={sum.total} /></div>
              <p className="mt-2 text-[13px]" style={{ color: LP.text2 }}>
                {sum.total > 0
                  ? (sum.guests > 0 ? fill(ui.perGuestFor, { amount: money(Math.round(sum.perGuest)), n: sum.guests }) : ui.addGuestsHint)
                  : ui.enterPrice}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={onPdf} disabled={pdfBusy} className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow, opacity: pdfBusy ? 0.6 : 1 }}>
                  <Download size={14} className="flex-shrink-0" /> {pdfBusy ? ui.saving : ui.savePdf}
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[13px] font-semibold" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}>
                  <Printer size={14} className="flex-shrink-0" /> {ui.print}
                </button>
              </div>
              <div className="my-6 h-px" style={{ background: LP.line }} />
              <div className="text-[14px] font-semibold" style={{ color: LP.text }}>{ui.byCategory}</div>
              <div className="mt-3 space-y-3.5">
                {sum.cats.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span style={{ color: LP.text2 }}>{c.title}</span>
                      <span className="font-semibold" style={{ color: LP.text }}><Money value={c.total} /></span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: "rgba(243,237,225,0.08)" }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: sum.total > 0 ? `${(c.total / sum.total) * 100}%` : 0, background: LP.gold }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 flex gap-2 px-2 text-[12.5px]" style={{ color: LP.text2, lineHeight: 1.55 }}>
            <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: LP.gold }} />
            {ui.disclaimer}
          </p>
        </aside>
      </div>

      {/* Phones: the running total and the PDF button stay in view. */}
      <div className="calc-screen fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 py-3 lg:hidden" style={{ background: "rgba(38,50,43,0.94)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: `1px solid ${LP.line}` }}>
        <div>
          <div style={{ ...eyebrow, fontSize: 10 }}>{ui.estimatedTotal}</div>
          <div className="text-[22px] font-bold" style={{ color: LP.gold, lineHeight: 1.2, fontFamily: FONT_BODY }}><Money value={sum.total} /></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} aria-label={ui.print} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}><Printer size={16} /></button>
          <button onClick={onPdf} disabled={pdfBusy} aria-label={ui.savePdf} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold }}><Download size={14} /> {pdfBusy ? "…" : "PDF"}</button>
        </div>
      </div>

      {/* What Print puts on paper, and what the PDF pictures for non-Latin languages. */}
      <div ref={sheetRef} className="calc-print" dir={rtl ? "rtl" : "ltr"} style={{ color: "#222", fontFamily: fonts.body }}>
        <div data-pdf-row style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #D4AB4E", paddingBottom: 10 }}>
          <div dir="ltr" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 20 }}>eInvite<span style={{ color: "#B08A2E" }}>.me</span></div>
          <div style={{ fontSize: 10, letterSpacing: rtl ? 0 : "0.16em", textTransform: "uppercase", color: "#777" }}>{ui.eyebrow}</div>
        </div>
        <div data-pdf-row>
          <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 500, margin: "18px 0 4px" }}>{text.title}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{fill(ui.prepared, { date: dateLabel(lang) })}{sum.guests ? ` · ${fill(ui.guestsN, { n: sum.guests })}` : ""}</div>
        </div>
        <div data-pdf-row style={{ margin: "18px 0 22px", padding: "14px 16px", background: "#F6F1E4", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: rtl ? 0 : "0.14em", textTransform: "uppercase", color: "#8A6B22" }}>{ui.estimatedTotal}</span>
          <span style={{ fontSize: 26, fontWeight: 700, fontFamily: FONT_BODY }}>
            <bdi dir="ltr">{money(sum.total)}</bdi>
            {sum.perGuest ? <span style={{ fontSize: 12, fontWeight: 400, color: "#666", fontFamily: fonts.body }}>{"  ·  "}{fill(ui.aboutPerGuest, { amount: money(Math.round(sum.perGuest)) })}</span> : null}
          </span>
        </div>
        {sum.cats.filter((c) => c.total > 0).map((c) => (
          <table key={c.id} style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: 12, breakInside: "avoid" }}>
            <thead>
              <tr data-pdf-row><th colSpan={3} style={{ textAlign: "start", fontFamily: fonts.display, fontSize: 15, padding: "4px 0" }}>{c.title}</th><th style={{ textAlign: "end", fontSize: 14, padding: "4px 0" }}><bdi dir="ltr">{money(c.total)}</bdi></th></tr>
              <tr data-pdf-row style={{ color: "#888", fontSize: 9.5, letterSpacing: rtl ? 0 : "0.12em", textTransform: "uppercase" }}>
                <th style={{ textAlign: "start", padding: "4px 0", borderBottom: "1px solid #ddd" }}>{ui.item}</th>
                <th style={{ textAlign: "end", padding: "4px 0", borderBottom: "1px solid #ddd", width: 60 }}>{ui.qty}</th>
                <th style={{ textAlign: "end", padding: "4px 0", borderBottom: "1px solid #ddd", width: 110 }}>{ui.costEach}</th>
                <th style={{ textAlign: "end", padding: "4px 0", borderBottom: "1px solid #ddd", width: 100 }}>{ui.total}</th>
              </tr>
            </thead>
            <tbody>
              {c.items.filter((x) => x.total > 0).map((x) => (
                <tr key={x.id} data-pdf-row>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>{x.name || ui.otherCost}{x.perGuest ? ` (${ui.perGuest})` : ""}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "end" }}>{x.q}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "end" }}><bdi dir="ltr">{money(x.each)}</bdi></td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "end", fontWeight: 700 }}><bdi dir="ltr">{money(x.total)}</bdi></td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {sum.total === 0 && <p data-pdf-row style={{ color: "#666" }}>{ui.noPrices}</p>}
        <p data-pdf-row style={{ marginTop: 24, fontSize: 10, color: "#888" }}>{ui.pdfNote} · einvite.me</p>
      </div>
    </>
  );
}

export default function CostCalculatorPage({ slug = null }) {
  const [occasion, setOccasion] = useState(() => occasionBySlug(slug));
  const [lang, setLang] = useState(initialLang);
  const T = CALC_TEXT[lang] || CALC_TEXT.en;
  const ui = T.ui;
  const fonts = fontsFor(lang);
  const rtl = lang === "ar";
  const changeLang = (code) => {
    setLang(code);
    try { window.localStorage.setItem(LANG_KEY, code); } catch {}
  };

  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/(?:([a-z-]+)-)?cost-calculator\/?$/);
      setOccasion(occasionBySlug(m?.[1] || null));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const title = occasion ? T.occasions[occasion.id].title : ui.pickPageTitle;
    document.title = `${title} · eInvite.me`;
    document.documentElement.lang = lang;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", occasion ? fill(ui.metaOccasion, { title }) : ui.metaPick);
  }, [occasion, lang, T, ui]);

  const pick = (o) => {
    if (o.id === occasion?.id) return;
    window.history.pushState(null, "", occasionPath(o));
    setOccasion(o);
    if (!occasion) window.scrollTo({ top: 0 });
  };

  return (
    <div lang={lang} dir={rtl ? "rtl" : "ltr"} className="calc-root relative min-h-screen w-full" style={{ background: LP.bg, backgroundImage: LP.pageGradient, color: LP.text, fontFamily: fonts.body, overflowX: "clip" }}>
      <style>{`
        .landing-link { color: ${LP.text2}; transition: color .2s; }
        .landing-link:hover { color: ${LP.text}; }
        .landing-card { transition: transform .25s, border-color .25s, background-color .25s; }
        .landing-card:hover { transform: translateY(-3px); border-color: rgba(212,171,78,0.4) !important; }
        .calc-field { background: rgba(243,237,225,0.06); border: 1px solid ${LP.line}; color: ${LP.text}; transition: border-color .2s, background-color .2s; }
        .calc-field::placeholder { color: rgba(207,195,172,0.55); }
        .calc-field:focus { border-color: rgba(212,171,78,0.6); background: rgba(243,237,225,0.09); }
        .calc-print { display: none; }
        @media print {
          @page { margin: 14mm; }
          html, body { background: #fff !important; }
          .calc-page-chrome, .calc-screen { display: none !important; }
          .calc-print { display: block !important; }
          .calc-root { background: #fff !important; min-height: 0 !important; }
        }
      `}</style>
      <div className="calc-page-chrome">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: "overlay" }} />
        <header className="sticky top-0 z-50" style={{ background: "rgba(44,57,49,0.72)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${LP.line}` }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <a href="/" dir="ltr" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 21, color: LP.text }}>eInvite<span style={{ color: LP.gold }}>.me</span></a>
            <nav className="flex items-center gap-4 text-[13px] sm:gap-5">
              <a href="/" className="landing-link hidden sm:inline">{ui.home}</a>
              <a href="/shop" className="landing-link hidden sm:inline">{ui.designs}</a>
              <LangSwitcher lang={lang} onChange={changeLang} label={ui.language} />
              <a href="/" className="rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow }}>{ui.create}</a>
            </nav>
          </div>
        </header>
      </div>

      <div className="relative">
        <div aria-hidden="true" className="calc-page-chrome pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute" style={{ inset: "-120px 0 0 0", background: "radial-gradient(ellipse 55% 45% at 26% 20%, rgba(238,210,158,0.10), transparent 70%)" }} />
          <img src={foliageA} alt="" className="absolute" style={{ top: -150, left: -130, width: 560, opacity: 0.8, maxWidth: "none" }} />
          <img src={foliageB} alt="" className="absolute" style={{ top: 80, right: -210, width: 520, opacity: 0.45, transform: "rotate(180deg)", maxWidth: "none" }} />
        </div>

        <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
          <div className="calc-page-chrome text-center">
            <div className="mb-4 text-[11px] font-semibold uppercase" style={{ color: LP.goldSoft, letterSpacing: rtl ? 0 : "0.2em" }}>{ui.eyebrow}</div>
            <h1 style={{ fontFamily: fonts.display, fontStyle: fonts.headingStyle, fontWeight: 500, fontSize: "clamp(32px, 5.2vw, 56px)", lineHeight: rtl ? 1.4 : 1.15, color: LP.text }}>
              {occasion ? T.occasions[occasion.id].title : ui.pickTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px]" style={{ color: LP.text2, lineHeight: 1.7 }}>{occasion ? ui.intro : ui.pickBody}</p>
            <div className={occasion ? "mt-8" : "mt-10"}>
              <OccasionPicker current={occasion} onPick={pick} large={!occasion} texts={T.occasions} />
            </div>
          </div>

          {occasion && <Calculator key={occasion.id} o={occasion} lang={lang} fonts={fonts} />}

          <section className="calc-page-chrome calc-screen relative mt-16 overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10" style={{ background: LP.card, border: `1px solid ${LP.line}` }}>
            <h2 style={{ fontFamily: fonts.display, fontStyle: fonts.headingStyle, fontWeight: 500, fontSize: "clamp(24px, 3vw, 32px)", color: LP.text }}>{ui.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px]" style={{ color: LP.text2, lineHeight: 1.7 }}>{ui.ctaBody}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow }}>{ui.ctaCreate} <ArrowRight size={15} className={rtl ? "rotate-180" : ""} /></a>
              <a href="/shop" className="inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}>{ui.ctaDesigns}</a>
            </div>
          </section>
        </main>
      </div>

      <footer className="calc-page-chrome relative px-4 pb-24 pt-8 sm:px-6 lg:pb-8" style={{ borderTop: `1px solid ${LP.line}` }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[12px]" style={{ color: LP.text2 }}>
          <span>© {new Date().getFullYear()} eInvite.me</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/" className="landing-link">{ui.home}</a>
            <a href="/shop" className="landing-link">{ui.designs}</a>
            <a href="/privacy" className="landing-link">{ui.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
