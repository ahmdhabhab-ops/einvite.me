import React, { useEffect, useState } from "react";
import { Plus, X, Sparkles, Info, RotateCcw, ArrowRight, Printer, Download, Heart, PartyPopper, Crown, Church, Gift, CalendarDays } from "lucide-react";
import foliageA from "./assets/foliage-a.webp";
import foliageB from "./assets/foliage-b.webp";

// The free budget calculator: /cost-calculator lets visitors pick an
// occasion, and /<occasion>-cost-calculator opens that occasion directly.
// Each occasion has its own categories and items; everything typed stays in
// this browser only. Styled to match the home page.

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";

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

const it = (name, perGuest = false) => ({ name, perGuest });
const cat = (title, subtitle, items) => ({ title, subtitle, items });

export const OCCASIONS = [
  {
    id: "wedding", slug: "wedding", name: "Wedding", icon: Heart,
    guestHint: "Catering, drinks and favors use this number automatically.", guestPlaceholder: "e.g. 120",
    categories: [
      cat("Venue & food", "The setting and the menu", [it("Venue rental"), it("Catering", true), it("Drinks", true)]),
      cat("Flowers & décor", "The look of the celebration", [it("Flowers"), it("Décor & lighting")]),
      cat("Photo & video", "The moments you keep", [it("Photographer"), it("Videographer")]),
      cat("Attire & beauty", "Getting ready for the day", [it("Wedding attire"), it("Hair & makeup")]),
      cat("Music & entertainment", "Sound and celebration", [it("DJ or band"), it("Entertainment")]),
      cat("Invitations & details", "The finishing touches", [it("Invitations"), it("Guest favors", true), it("Cake")]),
      cat("Services & extras", "Everything else to plan", [it("Wedding planner"), it("Transport"), it("Other costs")]),
    ],
  },
  {
    id: "birthday", slug: "birthday", name: "Birthday", icon: PartyPopper,
    guestHint: "Food, drinks and party favors use this number automatically.", guestPlaceholder: "e.g. 30",
    categories: [
      cat("Venue & food", "Where you celebrate and what you serve", [it("Venue rental"), it("Food", true), it("Drinks", true)]),
      cat("Cake & sweets", "The sweetest part", [it("Birthday cake"), it("Sweet table")]),
      cat("Decorations", "Setting the party mood", [it("Balloons"), it("Theme décor"), it("Flowers")]),
      cat("Entertainment", "Music, games and fun", [it("DJ or music"), it("Entertainer or activities"), it("Games & rentals")]),
      cat("Photo & video", "Remember the day", [it("Photographer"), it("Photo booth")]),
      cat("Invitations & favors", "Before and after the party", [it("Invitations"), it("Party favors", true)]),
      cat("Extras", "Everything else", [it("Outfit"), it("Party planner"), it("Other costs")]),
    ],
  },
  {
    id: "quinceanera", slug: "quinceanera", name: "Quinceañera", icon: Crown,
    guestHint: "Catering, drinks and favors use this number automatically.", guestPlaceholder: "e.g. 150",
    categories: [
      cat("Venue & food", "The reception and the menu", [it("Venue rental"), it("Catering", true), it("Drinks", true)]),
      cat("Dress & beauty", "Her look for the day", [it("Quinceañera dress"), it("Hair & makeup"), it("Shoes & accessories")]),
      cat("Ceremony & traditions", "Mass and the traditions", [it("Mass / ceremony"), it("Tiara & traditional gifts"), it("Court of honor")]),
      cat("Flowers & décor", "The look of the celebration", [it("Flowers"), it("Décor & lighting")]),
      cat("Music & dance", "The waltz and the party", [it("DJ or band"), it("Waltz choreography")]),
      cat("Photo & video", "The moments you keep", [it("Photographer"), it("Videographer")]),
      cat("Cake, invitations & favors", "The finishing touches", [it("Cake"), it("Invitations"), it("Favors", true)]),
      cat("Extras", "Everything else to plan", [it("Party planner"), it("Transport"), it("Other costs")]),
    ],
  },
  {
    id: "baptism", slug: "baptism", name: "Baptism", icon: Church,
    guestHint: "Food, drinks and favors use this number automatically.", guestPlaceholder: "e.g. 60",
    categories: [
      cat("Church & ceremony", "The baptism itself", [it("Church fees & offering"), it("Candle & baptism set")]),
      cat("Reception venue & food", "Celebrating afterwards", [it("Venue rental"), it("Food", true), it("Drinks", true)]),
      cat("Outfits", "Dressed for the day", [it("Baptism outfit"), it("Family outfits")]),
      cat("Décor & flowers", "The look of the day", [it("Flowers"), it("Décor"), it("Balloons")]),
      cat("Cake & sweets", "Something sweet", [it("Cake"), it("Dragées & favors", true)]),
      cat("Photo & video", "Remember the day", [it("Photographer"), it("Videographer")]),
      cat("Invitations & extras", "Everything else", [it("Invitations"), it("Entertainment"), it("Other costs")]),
    ],
  },
  {
    id: "babyShower", slug: "baby-shower", name: "Baby Shower", icon: Gift,
    guestHint: "Food, drinks and favors use this number automatically.", guestPlaceholder: "e.g. 25",
    categories: [
      cat("Venue & food", "Where you gather and what you serve", [it("Venue rental"), it("Food", true), it("Drinks", true)]),
      cat("Cake & sweets", "The sweet table", [it("Cake"), it("Dessert table")]),
      cat("Decorations", "The theme and the mood", [it("Balloons"), it("Theme décor"), it("Flowers")]),
      cat("Games & activities", "Fun for the guests", [it("Games & prizes"), it("Entertainment")]),
      cat("Photo", "Remember the day", [it("Photographer")]),
      cat("Invitations & favors", "Before and after", [it("Invitations"), it("Favors", true)]),
      cat("Extras", "Everything else", [it("Outfit"), it("Party planner"), it("Other costs")]),
    ],
  },
  {
    id: "party", slug: "party", name: "Party", icon: CalendarDays,
    guestHint: "Food, drinks and favors use this number automatically.", guestPlaceholder: "e.g. 50",
    categories: [
      cat("Venue & food", "Where you celebrate and what you serve", [it("Venue rental"), it("Food", true), it("Drinks", true)]),
      cat("Décor", "Setting the mood", [it("Decorations"), it("Flowers"), it("Lighting")]),
      cat("Music & entertainment", "Sound and fun", [it("DJ or music"), it("Entertainment")]),
      cat("Photo & video", "Remember the night", [it("Photographer"), it("Videographer")]),
      cat("Cake & sweets", "Something sweet", [it("Cake"), it("Sweets")]),
      cat("Invitations & favors", "Before and after", [it("Invitations"), it("Favors", true)]),
      cat("Extras", "Everything else", [it("Rentals"), it("Transport"), it("Other costs")]),
    ],
  },
];

export const occasionPath = (o) => `/${o.slug}-cost-calculator`;
const occasionBySlug = (slug) => OCCASIONS.find((o) => o.slug === slug) || null;
const titleOf = (o) => `${o.name} cost calculator`;

let idCounter = 0;
const newId = () => `c${Date.now().toString(36)}${(idCounter++).toString(36)}`;

const freshState = (o) => ({
  guests: "",
  categories: o.categories.map((c, ci) => ({
    id: `cat${ci}`,
    items: c.items.map((x, ii) => ({ id: `i${ci}-${ii}`, name: x.name, perGuest: x.perGuest, qty: "1", cost: "", custom: false })),
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
        return s && Array.isArray(s.items) ? { id: c.id, items: s.items.filter((i) => i && i.id) } : c;
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
const todayLabel = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// Everything the summary, print sheet and PDF need, in one shape.
function summarize(o, state) {
  const guests = Math.floor(num(state.guests));
  const qtyOf = (x) => (x.perGuest ? guests : num(x.qty));
  const cats = o.categories.map((c, ci) => {
    const items = state.categories[ci].items.map((x) => ({ ...x, q: qtyOf(x), each: num(x.cost), total: qtyOf(x) * num(x.cost) }));
    return { ...c, id: state.categories[ci].id, items, total: items.reduce((s, x) => s + x.total, 0) };
  });
  const total = cats.reduce((s, c) => s + c.total, 0);
  return { guests, cats, total, perGuest: guests > 0 ? total / guests : 0 };
}

async function savePdf(o, sum) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const cols = { qty: W - M - 210, each: W - M - 110, total: W - M };
  let y = 0;
  const footer = () => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(140, 140, 140);
    doc.text("Prices come from you. This is an estimate, not a vendor quote.", M, H - 26);
    doc.text("einvite.me", W - M, H - 26, { align: "right" });
  };
  const newPage = () => { footer(); doc.addPage(); y = M; };
  const room = (h) => { if (y + h > H - 50) newPage(); };

  doc.setFillColor(43, 56, 48); doc.rect(0, 0, W, 104, "F");
  doc.setFont("times", "italic"); doc.setFontSize(20); doc.setTextColor(243, 237, 225);
  doc.text("eInvite", M, 42);
  doc.setTextColor(212, 171, 78); doc.text(".me", M + doc.getTextWidth("eInvite"), 42);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(207, 195, 172);
  doc.text("FREE BUDGET PLANNER", W - M, 42, { align: "right" });
  doc.setFont("times", "normal"); doc.setFontSize(24); doc.setTextColor(243, 237, 225);
  doc.text(titleOf(o), M, 82);

  y = 140;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(110, 110, 110);
  doc.text(`Prepared ${todayLabel()}${sum.guests ? `  ·  ${sum.guests} guests` : ""}`, M, y);
  y += 30;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(150, 118, 40);
  doc.text("ESTIMATED TOTAL", M, y);
  y += 30;
  doc.setFontSize(30); doc.setTextColor(34, 48, 42); doc.text(money(sum.total), M, y);
  if (sum.perGuest) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(110, 110, 110);
    doc.text(`About ${money(Math.round(sum.perGuest))} per guest`, M, y + 18);
    y += 18;
  }
  y += 30;

  const shown = sum.cats.filter((c) => c.total > 0);
  if (!shown.length) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(110, 110, 110);
    doc.text("No prices entered yet.", M, y);
  }
  for (const c of shown) {
    const rows = c.items.filter((x) => x.total > 0);
    room(58 + 22);
    doc.setDrawColor(212, 171, 78); doc.setLineWidth(1); doc.line(M, y, W - M, y);
    y += 22;
    doc.setFont("times", "bold"); doc.setFontSize(14); doc.setTextColor(34, 48, 42);
    doc.text(c.title, M, y);
    doc.text(money(c.total), cols.total, y, { align: "right" });
    y += 20;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140);
    doc.text("ITEM", M, y); doc.text("QTY", cols.qty, y, { align: "right" }); doc.text("COST EACH", cols.each, y, { align: "right" }); doc.text("TOTAL", cols.total, y, { align: "right" });
    y += 6;
    for (const x of rows) {
      room(22);
      y += 16;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(40, 40, 40);
      const name = doc.splitTextToSize(`${x.name || "Other cost"}${x.perGuest ? " (per guest)" : ""}`, cols.qty - M - 40)[0];
      doc.text(name, M, y);
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
    doc.text("Estimated total", M + 12, y + 17);
    doc.text(money(sum.total), cols.total - 12, y + 17, { align: "right" });
  }
  footer();
  doc.save(`einvite-${o.slug}-budget.pdf`);
}

function Header() {
  return (
    <header className="sticky top-0 z-50" style={{ background: "rgba(44,57,49,0.72)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${LP.line}` }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="/" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 21, color: LP.text }}>eInvite<span style={{ color: LP.gold }}>.me</span></a>
        <nav className="flex items-center gap-4 text-[13px] sm:gap-5">
          <a href="/" className="landing-link hidden sm:inline">Home</a>
          <a href="/shop" className="landing-link hidden sm:inline">Designs</a>
          <a href="/" className="rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow }}>Create an invitation</a>
        </nav>
      </div>
    </header>
  );
}

function OccasionPicker({ current, onPick, large }) {
  return (
    <div className={large ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" : "flex flex-wrap gap-2"}>
      {OCCASIONS.map((o) => {
        const Icon = o.icon;
        const active = current?.id === o.id;
        return large ? (
          <button key={o.id} onClick={() => onPick(o)} className="landing-card flex flex-col items-center gap-3 rounded-2xl px-4 py-6 text-center" style={{ background: LP.card, border: `1px solid ${LP.line}` }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(212,171,78,0.12)" }}><Icon size={21} color={LP.gold} strokeWidth={1.6} /></span>
            <span className="text-[14.5px] font-semibold" style={{ color: LP.text }}>{o.name}</span>
          </button>
        ) : (
          <button key={o.id} onClick={() => onPick(o)} aria-pressed={active} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors" style={active ? { background: LP.gold, color: LP.onGold, border: `1px solid ${LP.gold}` } : { background: LP.card, color: LP.text2, border: `1px solid ${LP.line}` }}>
            <Icon size={14} strokeWidth={1.8} /> {o.name}
          </button>
        );
      })}
    </div>
  );
}

function Calculator({ o }) {
  const [state, setState] = useState(() => loadState(o));
  const [pdfBusy, setPdfBusy] = useState(false);
  useEffect(() => {
    try { window.localStorage.setItem(storageKey(o), JSON.stringify(state)); } catch {}
  }, [o, state]);

  const sum = summarize(o, state);
  const updateItem = (catId, itemId, patch) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: c.items.map((x) => (x.id === itemId ? { ...x, ...patch } : x)) })) }));
  const addItem = (catId) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: [...c.items, { id: newId(), name: "", perGuest: false, qty: "1", cost: "", custom: true }] })) }));
  const removeItem = (catId, itemId) =>
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id !== catId ? c : { ...c, items: c.items.filter((x) => x.id !== itemId) })) }));
  const clearAll = () => { if (window.confirm("Clear every price and start over?")) setState(freshState(o)); };
  const onPdf = async () => {
    // The PDF's built-in fonts only cover Latin letters; anything else
    // (e.g. an item named in Arabic) goes through the print dialog, which
    // can also save a PDF.
    const names = sum.cats.flatMap((c) => c.items.map((x) => x.name)).join("");
    if (/[^\x00-\xFF]/.test(names)) { window.print(); return; }
    setPdfBusy(true);
    try { await savePdf(o, sum); } catch (err) { console.error("PDF failed:", err); window.print(); } finally { setPdfBusy(false); }
  };

  const eyebrow = { fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: LP.goldSoft };
  const field = "calc-field w-full rounded-lg px-3 py-2 text-[14px] outline-none";

  const actions = (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button onClick={onPdf} disabled={pdfBusy} className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow, opacity: pdfBusy ? 0.6 : 1 }}>
        <Download size={14} /> {pdfBusy ? "Saving…" : "Save PDF"}
      </button>
      <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}>
        <Printer size={14} /> Print
      </button>
    </div>
  );

  return (
    <>
      <div className="calc-screen mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <section className="flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: "linear-gradient(135deg, rgba(212,171,78,0.16), rgba(212,171,78,0.05))", border: "1px solid rgba(212,171,78,0.3)" }}>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(212,171,78,0.16)", color: LP.gold }}><Sparkles size={20} /></span>
              <div>
                <div className="text-[18px] font-semibold" style={{ color: LP.text }}>Start with your guest count</div>
                <div className="mt-0.5 text-[13.5px]" style={{ color: LP.text2 }}>{o.guestHint}</div>
              </div>
            </div>
            <label className="block sm:w-44">
              <span className="mb-1.5 block text-[12px] font-semibold" style={{ color: LP.goldSoft }}>Number of guests</span>
              <input
                type="text" inputMode="numeric" value={state.guests} placeholder={o.guestPlaceholder}
                onChange={(e) => setState((s) => ({ ...s, guests: e.target.value.replace(/[^\d]/g, "").slice(0, 6) }))}
                className={`${field} py-3 text-[15px]`}
              />
            </label>
          </section>

          <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div style={eyebrow}>Your estimate</div>
              <h2 className="mt-1" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500, fontSize: 30, color: LP.text }}>Plan by category</h2>
            </div>
            <div className="flex items-center gap-4 text-[12.5px]" style={{ color: LP.text2 }}>
              <button onClick={clearAll} className="landing-link inline-flex items-center gap-1"><RotateCcw size={12} /> Clear all</button>
              <span>All amounts in USD</span>
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
                  <div className="text-[18px] font-semibold" style={{ color: LP.goldSoft }}>{money(c.total)}</div>
                </div>

                <div className="hidden grid-cols-[minmax(0,1fr)_88px_120px_96px] gap-3 px-6 pb-2 pt-2 sm:grid" style={{ ...eyebrow, fontSize: 10.5, letterSpacing: "0.14em", color: LP.text2, borderBottom: `1px solid ${LP.line}` }}>
                  <span>Item</span><span className="text-center">Qty</span><span>Cost each</span><span className="text-right">Total</span>
                </div>

                {c.items.map((x) => (
                  <div key={x.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_88px_120px_96px] sm:px-6" style={{ borderBottom: `1px solid ${LP.line}` }}>
                    <div className="col-span-3 flex min-w-0 items-center gap-2 sm:col-span-1">
                      {x.custom ? (
                        <input value={x.name} onChange={(e) => updateItem(c.id, x.id, { name: e.target.value.slice(0, 60) })} placeholder="What's the cost for?" className={field} autoFocus={!x.name} />
                      ) : (
                        <div>
                          <div className="text-[14.5px] font-medium" style={{ color: LP.text }}>{x.name}</div>
                          {x.perGuest && <div className="text-[12px] font-medium" style={{ color: LP.gold }}>per guest</div>}
                        </div>
                      )}
                      {x.custom && (
                        <button onClick={() => removeItem(c.id, x.id)} aria-label="Remove this cost" className="landing-link flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"><X size={14} /></button>
                      )}
                    </div>
                    {x.perGuest ? (
                      <div title="Uses your guest count" className="flex h-[38px] items-center justify-center rounded-lg text-[13.5px]" style={{ background: "rgba(212,171,78,0.08)", border: "1px dashed rgba(212,171,78,0.35)", color: sum.guests ? LP.text : LP.text2 }}>{sum.guests || "Guests"}</div>
                    ) : (
                      <input type="text" inputMode="numeric" value={x.qty} onChange={(e) => updateItem(c.id, x.id, { qty: e.target.value.replace(/[^\d]/g, "").slice(0, 5) })} aria-label={`${x.name || "Cost"} quantity`} className={`${field} text-center`} />
                    )}
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px]" style={{ color: LP.text2 }}>$</span>
                      <input type="text" inputMode="decimal" value={x.cost} placeholder="0" onChange={(e) => updateItem(c.id, x.id, { cost: e.target.value.replace(/[^\d.,]/g, "").slice(0, 12) })} aria-label={`${x.name || "Cost"} cost each`} className={`${field} pl-7`} />
                    </div>
                    <div className="text-right text-[14.5px] font-semibold" style={{ color: LP.text }}>{money(x.total)}</div>
                  </div>
                ))}

                <div className="px-5 py-4 sm:px-6">
                  <button onClick={() => addItem(c.id)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: LP.gold }}><Plus size={14} /> Add a cost</button>
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: LP.cardHi, border: `1px solid ${LP.line}`, boxShadow: "0 30px 60px -40px rgba(0,0,0,0.6)" }}>
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full" style={{ border: "20px solid rgba(212,171,78,0.08)" }} />
            <div className="relative">
              <div className="flex items-center gap-2" style={eyebrow}><span style={{ color: LP.gold, fontSize: 14 }}>✳</span> Live estimate</div>
              <h2 className="mt-5" style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: LP.text }}>Your estimated total</h2>
              <div className="mt-3" style={{ fontWeight: 700, fontSize: "clamp(34px, 4vw, 44px)", color: LP.gold, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{money(sum.total)}</div>
              <p className="mt-2 text-[13px]" style={{ color: LP.text2 }}>
                {sum.total > 0 ? (sum.guests > 0 ? <>About <strong style={{ color: LP.text }}>{money(Math.round(sum.perGuest))}</strong> per guest for {sum.guests} guests.</> : "Add your guest count to see the cost per guest.") : "Enter a price to build your estimate."}
              </p>
              {actions}
              <div className="my-6 h-px" style={{ background: LP.line }} />
              <div className="text-[14px] font-semibold" style={{ color: LP.text }}>By category</div>
              <div className="mt-3 space-y-3.5">
                {sum.cats.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span style={{ color: LP.text2 }}>{c.title}</span>
                      <span className="font-semibold" style={{ color: LP.text }}>{money(c.total)}</span>
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
            Prices come from you. This calculator does not include vendor rates or a final quote.
          </p>
        </aside>
      </div>

      {/* Phones: the running total and the PDF button stay in view. */}
      <div className="calc-screen fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 py-3 lg:hidden" style={{ background: "rgba(38,50,43,0.94)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: `1px solid ${LP.line}` }}>
        <div>
          <div style={{ ...eyebrow, fontSize: 10 }}>Estimated total</div>
          <div className="text-[22px] font-bold" style={{ color: LP.gold, lineHeight: 1.2 }}>{money(sum.total)}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} aria-label="Print" className="flex h-10 w-10 items-center justify-center rounded-full" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}><Printer size={16} /></button>
          <button onClick={onPdf} disabled={pdfBusy} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold" style={{ background: LP.gold, color: LP.onGold }}><Download size={14} /> {pdfBusy ? "…" : "PDF"}</button>
        </div>
      </div>

      {/* What Print (and the browser's "Save as PDF") puts on paper. */}
      <div className="calc-print">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #D4AB4E", paddingBottom: 10 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 20 }}>eInvite<span style={{ color: "#B08A2E" }}>.me</span></div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#777" }}>Free budget planner</div>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 500, margin: "18px 0 4px" }}>{titleOf(o)}</div>
        <div style={{ fontSize: 12, color: "#666" }}>Prepared {todayLabel()}{sum.guests ? ` · ${sum.guests} guests` : ""}</div>
        <div style={{ margin: "18px 0 22px", padding: "14px 16px", background: "#F6F1E4", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A6B22" }}>Estimated total</span>
          <span style={{ fontSize: 26, fontWeight: 700 }}>{money(sum.total)}{sum.perGuest ? <span style={{ fontSize: 12, fontWeight: 400, color: "#666" }}>  ·  about {money(Math.round(sum.perGuest))} per guest</span> : null}</span>
        </div>
        {sum.cats.filter((c) => c.total > 0).map((c) => (
          <table key={c.id} style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: 12, breakInside: "avoid" }}>
            <thead>
              <tr><th colSpan={3} style={{ textAlign: "left", fontFamily: FONT_DISPLAY, fontSize: 15, padding: "4px 0" }}>{c.title}</th><th style={{ textAlign: "right", fontSize: 14, padding: "4px 0" }}>{money(c.total)}</th></tr>
              <tr style={{ color: "#888", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "4px 0", borderBottom: "1px solid #ddd" }}>Item</th>
                <th style={{ textAlign: "right", padding: "4px 0", borderBottom: "1px solid #ddd", width: 60 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "4px 0", borderBottom: "1px solid #ddd", width: 100 }}>Cost each</th>
                <th style={{ textAlign: "right", padding: "4px 0", borderBottom: "1px solid #ddd", width: 100 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {c.items.filter((x) => x.total > 0).map((x) => (
                <tr key={x.id}>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>{x.name || "Other cost"}{x.perGuest ? " (per guest)" : ""}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "right" }}>{x.q}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "right" }}>{money(x.each)}</td>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #eee", textAlign: "right", fontWeight: 700 }}>{money(x.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        {sum.total === 0 && <p style={{ color: "#666" }}>No prices entered yet.</p>}
        <p style={{ marginTop: 24, fontSize: 10, color: "#888" }}>Prices come from you. This is an estimate, not a vendor quote. · einvite.me</p>
      </div>
    </>
  );
}

export default function CostCalculatorPage({ slug = null }) {
  const [occasion, setOccasion] = useState(() => occasionBySlug(slug));

  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/(?:([a-z-]+)-)?cost-calculator\/?$/);
      setOccasion(occasionBySlug(m?.[1] || null));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const title = occasion ? `${occasion.name} Cost Calculator · eInvite.me` : "Free Event Cost Calculator · eInvite.me";
    const description = occasion
      ? `Free ${occasion.name.toLowerCase()} cost calculator: add the prices you've received and see your budget add up as you plan. Print it or save it as a PDF.`
      : "Free cost calculator for weddings, birthdays, quinceañeras, baptisms, baby showers and parties. Add your prices, see the total, print it or save it as a PDF.";
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [occasion]);

  const pick = (o) => {
    if (o.id === occasion?.id) return;
    window.history.pushState(null, "", occasionPath(o));
    setOccasion(o);
    if (!occasion) window.scrollTo({ top: 0 });
  };

  return (
    <div className="calc-root relative min-h-screen w-full" style={{ background: LP.bg, backgroundImage: LP.pageGradient, color: LP.text, fontFamily: FONT_BODY, overflowX: "clip" }}>
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
          .calc-print { display: block !important; color: #222; font-family: ${FONT_BODY}; }
          .calc-root { background: #fff !important; min-height: 0 !important; }
        }
      `}</style>
      <div>
        <div className="calc-page-chrome">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: "overlay" }} />
          <Header />
        </div>

        <div className="relative">
          <div aria-hidden="true" className="calc-page-chrome pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute" style={{ inset: "-120px 0 0 0", background: "radial-gradient(ellipse 55% 45% at 26% 20%, rgba(238,210,158,0.10), transparent 70%)" }} />
            <img src={foliageA} alt="" className="absolute" style={{ top: -150, left: -130, width: 560, opacity: 0.8, maxWidth: "none" }} />
            <img src={foliageB} alt="" className="absolute" style={{ top: 80, right: -210, width: 520, opacity: 0.45, transform: "rotate(180deg)", maxWidth: "none" }} />
          </div>

          <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
            <div className="calc-page-chrome text-center">
              <div className="mb-4 text-[11px] font-semibold uppercase" style={{ color: LP.goldSoft, letterSpacing: "0.2em" }}>Free budget planner</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(34px, 5.2vw, 56px)", lineHeight: 1.15, color: LP.text }}>
                {occasion ? titleOf(occasion) : "What are you planning?"}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px]" style={{ color: LP.text2, lineHeight: 1.7 }}>
                {occasion
                  ? "Add the prices you've received, adjust quantities, and see your total as you plan. Print it or save it as a PDF when you're done."
                  : "Pick your occasion to open its cost calculator. It's free, nothing to sign up for, and you can print it or save it as a PDF."}
              </p>
              <div className={occasion ? "mt-8 flex justify-center" : "mt-10"}>
                <OccasionPicker current={occasion} onPick={pick} large={!occasion} />
              </div>
            </div>

            {occasion && <Calculator key={occasion.id} o={occasion} />}

            <section className="calc-page-chrome calc-screen relative mt-16 overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10" style={{ background: LP.card, border: `1px solid ${LP.line}` }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(24px, 3vw, 32px)", color: LP.text }}>Send the invitation, too</h2>
              <p className="mx-auto mt-3 max-w-lg text-[14.5px]" style={{ color: LP.text2, lineHeight: 1.7 }}>
                A digital invitation guests open on their phone, with your photos, music, directions and RSVP, all in one link you share on WhatsApp.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href="/" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold" style={{ background: LP.gold, color: LP.onGold, boxShadow: LP.goldShadow }}>Create your invitation <ArrowRight size={15} /></a>
                <a href="/shop" className="inline-flex items-center rounded-full px-6 py-3 text-[14px] font-semibold" style={{ color: LP.text, border: `1px solid ${LP.outline}` }}>See the designs</a>
              </div>
            </section>
          </main>
        </div>

        <footer className="calc-page-chrome relative px-4 pb-24 pt-8 sm:px-6 lg:pb-8" style={{ borderTop: `1px solid ${LP.line}` }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[12px]" style={{ color: LP.text2 }}>
            <span>© {new Date().getFullYear()} eInvite.me</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="/" className="landing-link">Home</a>
              <a href="/shop" className="landing-link">Designs</a>
              <a href="/privacy" className="landing-link">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
