import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Sparkles, Info, RotateCcw, ArrowRight } from "lucide-react";

// Stand-alone budget calculators at /wedding-cost-calculator and
// /birthday-cost-calculator. Each occasion has its own categories, items and
// colours; everything the visitor types stays in this browser only.

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Inter', sans-serif";

const item = (name, opts = {}) => ({ name, perGuest: !!opts.perGuest });

export const CALCULATORS = {
  wedding: {
    path: "/wedding-cost-calculator",
    navLabel: "Wedding budget planner",
    title: "Wedding cost calculator",
    pageTitle: "Wedding Cost Calculator · eInvite.me",
    metaDescription: "Free wedding cost calculator: add the prices you've received for the venue, catering, photographer, flowers and more, and see your wedding budget add up as you plan.",
    intro: "Add the prices you've received, adjust quantities, and see your total as you plan.",
    guestHint: "Catering, drinks, and favors use this number automatically.",
    guestPlaceholder: "e.g. 120",
    ctaTitle: "Your invitations, sorted too",
    ctaBody: "Send a digital wedding invitation on WhatsApp, with your photos, music, directions and RSVP, and watch the replies come into your guest list.",
    colors: { accent: "#5E3A5C", accentText: "#7A4A6F", pink: "#B56B92", tint: "#F8EEF3", tintLine: "#EFDCE6", bg: "#FBF8F7", line: "#EFE6EA", text: "#2D2230", muted: "#6E6470" },
    categories: [
      { title: "Venue & food", subtitle: "The setting and the menu", items: [item("Venue rental"), item("Catering", { perGuest: true }), item("Drinks", { perGuest: true })] },
      { title: "Flowers & décor", subtitle: "The look of the celebration", items: [item("Flowers"), item("Décor & lighting")] },
      { title: "Photo & video", subtitle: "The moments you keep", items: [item("Photographer"), item("Videographer")] },
      { title: "Attire & beauty", subtitle: "Getting ready for the day", items: [item("Wedding attire"), item("Hair & makeup")] },
      { title: "Music & entertainment", subtitle: "Sound and celebration", items: [item("DJ or band"), item("Entertainment")] },
      { title: "Invitations & details", subtitle: "The finishing touches", items: [item("Invitations"), item("Guest favors", { perGuest: true }), item("Cake")] },
      { title: "Services & extras", subtitle: "Everything else to plan", items: [item("Wedding planner"), item("Transport"), item("Other costs")] },
    ],
  },
  birthday: {
    path: "/birthday-cost-calculator",
    navLabel: "Birthday party planner",
    title: "Birthday cost calculator",
    pageTitle: "Birthday Party Cost Calculator · eInvite.me",
    metaDescription: "Free birthday party cost calculator: add the prices for the venue, food, cake, balloons, entertainment and party favors, and see your party budget add up as you plan.",
    intro: "Add the prices for the party, adjust quantities, and see your total as you plan.",
    guestHint: "Food, drinks, and party favors use this number automatically.",
    guestPlaceholder: "e.g. 30",
    ctaTitle: "Send the party invitation too",
    ctaBody: "Make a digital birthday invitation guests open on their phone, with music, the party details, directions and RSVP, all in one WhatsApp link.",
    colors: { accent: "#A4452E", accentText: "#B4533A", pink: "#E07A5F", tint: "#FDF0EA", tintLine: "#F6DDD2", bg: "#FFFAF6", line: "#F3E6DE", text: "#2F221D", muted: "#72635C" },
    categories: [
      { title: "Venue & food", subtitle: "Where you celebrate and what you serve", items: [item("Venue rental"), item("Food", { perGuest: true }), item("Drinks", { perGuest: true })] },
      { title: "Cake & sweets", subtitle: "The sweetest part", items: [item("Birthday cake"), item("Sweet table")] },
      { title: "Decorations", subtitle: "Setting the party mood", items: [item("Balloons"), item("Theme décor"), item("Flowers")] },
      { title: "Entertainment", subtitle: "Music, games and fun", items: [item("DJ or music"), item("Entertainer or activities"), item("Games & rentals")] },
      { title: "Photo & video", subtitle: "Remember the day", items: [item("Photographer"), item("Photo booth")] },
      { title: "Invitations & favors", subtitle: "Before and after the party", items: [item("Invitations"), item("Party favors", { perGuest: true })] },
      { title: "Extras", subtitle: "Everything else", items: [item("Outfit"), item("Party planner"), item("Other costs")] },
    ],
  },
};

let idCounter = 0;
const newId = () => `c${Date.now().toString(36)}${(idCounter++).toString(36)}`;

const freshState = (config) => ({
  guests: "",
  categories: config.categories.map((c, ci) => ({
    id: `cat${ci}`,
    items: c.items.map((it, ii) => ({ id: `i${ci}-${ii}`, name: it.name, perGuest: it.perGuest, qty: "1", cost: "", custom: false })),
  })),
});

const storageKey = (kind) => `einvite:cost-calculator-${kind}`;

function loadState(kind, config) {
  const fresh = freshState(config);
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(kind)) || "null");
    if (!saved || !Array.isArray(saved.categories)) return fresh;
    // Keep the saved entries, but only for categories this page still has.
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

function Logo({ c }) {
  return (
    <a href="/" className="flex items-center gap-2" aria-label="eInvite.me home">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: c.accent, color: "#fff", fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 22, lineHeight: 1 }}>e</span>
      <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 21, color: c.accent, letterSpacing: "-0.02em" }}>Invite<span style={{ color: c.pink, fontWeight: 500 }}>.me</span></span>
    </a>
  );
}

export default function CostCalculatorPage({ kind = "wedding" }) {
  const config = CALCULATORS[kind] || CALCULATORS.wedding;
  const c = config.colors;
  const [state, setState] = useState(() => loadState(kind, config));

  useEffect(() => {
    document.title = config.pageTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", config.metaDescription);
  }, [config]);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey(kind), JSON.stringify(state)); } catch {}
  }, [kind, state]);

  const guests = Math.floor(num(state.guests));
  const qtyOf = (it) => (it.perGuest ? guests : num(it.qty));
  const catTotals = state.categories.map((cat) => cat.items.reduce((sum, it) => sum + qtyOf(it) * num(it.cost), 0));
  const total = catTotals.reduce((a, b) => a + b, 0);

  const updateItem = (catId, itemId, patch) =>
    setState((s) => ({ ...s, categories: s.categories.map((cat) => (cat.id !== catId ? cat : { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) })) }));
  const addItem = (catId) =>
    setState((s) => ({ ...s, categories: s.categories.map((cat) => (cat.id !== catId ? cat : { ...cat, items: [...cat.items, { id: newId(), name: "", perGuest: false, qty: "1", cost: "", custom: true }] })) }));
  const removeItem = (catId, itemId) =>
    setState((s) => ({ ...s, categories: s.categories.map((cat) => (cat.id !== catId ? cat : { ...cat, items: cat.items.filter((it) => it.id !== itemId) })) }));
  const clearAll = () => {
    if (window.confirm("Clear every price and start over?")) setState(freshState(config));
  };

  const inputBase = "w-full rounded-lg px-3 py-2 text-[14px] outline-none transition-shadow focus:ring-2";
  const inputStyle = { background: "#fff", border: `1px solid ${c.tintLine}`, color: c.text, fontFamily: FONT_BODY, "--tw-ring-color": `${c.pink}40` };
  const eyebrow = { fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accentText };

  const estimateCard = (
    <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: "#fff", border: `1px solid ${c.line}`, boxShadow: "0 24px 48px -32px rgba(60,30,50,0.35)" }}>
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full" style={{ border: `22px solid ${c.tint}` }} />
      <div className="relative">
        <div className="flex items-center gap-2" style={eyebrow}><span style={{ color: c.pink, fontSize: 14 }}>✳</span> Live estimate</div>
        <h2 className="mt-5" style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 400, color: c.text }}>Your estimated total</h2>
        <div className="mt-3" style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: "clamp(34px, 4vw, 44px)", color: c.accent, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{money(total)}</div>
        <p className="mt-2 text-[13px]" style={{ color: c.muted }}>
          {total > 0 ? (guests > 0 ? <>About <strong style={{ color: c.text }}>{money(Math.round(total / guests))}</strong> per guest for {guests} guests.</> : "Add your guest count above to see the cost per guest.") : "Enter a price below to build your estimate."}
        </p>
        <div className="my-6 h-px" style={{ background: c.line }} />
        <div className="text-[14px] font-semibold" style={{ color: c.text }}>By category</div>
        <div className="mt-3 space-y-3.5">
          {config.categories.map((cat, i) => (
            <div key={cat.title}>
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: c.text }}>{cat.title}</span>
                <span className="font-semibold" style={{ color: c.text }}>{money(catTotals[i])}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: c.tint }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: total > 0 ? `${(catTotals[i] / total) * 100}%` : 0, background: c.pink }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full" style={{ background: c.bg, color: c.text, fontFamily: FONT_BODY }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${c.line}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo c={c} />
          <span className="hidden sm:inline" style={{ ...eyebrow, color: c.muted, letterSpacing: "0.14em" }}>{config.navLabel}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div style={eyebrow}>Plan with clarity</div>
            <h1 className="mt-3" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(36px, 6vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: c.text }}>
              {config.title}<span style={{ color: c.pink }}>.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px]" style={{ color: c.muted, lineHeight: 1.6 }}>{config.intro}</p>
          </div>
          <div aria-hidden className="hidden h-24 w-24 flex-shrink-0 items-center justify-center rounded-full md:flex" style={{ border: `1px solid ${c.tintLine}`, background: `radial-gradient(circle, ${c.tint} 0%, transparent 70%)`, color: c.pink, fontSize: 34 }}>✳</div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <section className="flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: c.accent, color: "#fff", boxShadow: "0 24px 40px -28px rgba(40,20,35,0.6)" }}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.14)" }}><Sparkles size={20} /></span>
                <div>
                  <div className="text-[18px] font-semibold" style={{ letterSpacing: "-0.01em" }}>Start with your guest count</div>
                  <div className="mt-0.5 text-[13.5px]" style={{ color: "rgba(255,255,255,0.8)" }}>{config.guestHint}</div>
                </div>
              </div>
              <label className="block sm:w-44">
                <span className="mb-1.5 block text-[12px] font-semibold">Number of guests</span>
                <input
                  type="number" min="0" inputMode="numeric" value={state.guests} placeholder={config.guestPlaceholder}
                  onChange={(e) => setState((s) => ({ ...s, guests: e.target.value.replace(/[^\d]/g, "").slice(0, 6) }))}
                  className="w-full rounded-lg px-3.5 py-3 text-[15px] outline-none focus:ring-2"
                  style={{ background: "#fff", color: c.text, border: "none", "--tw-ring-color": "rgba(255,255,255,0.5)" }}
                />
              </label>
            </section>

            <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div style={eyebrow}>Your estimate</div>
                <h2 className="mt-1" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 30, color: c.text }}>Plan by category</h2>
              </div>
              <div className="flex items-center gap-4 text-[12.5px]" style={{ color: c.muted }}>
                <button onClick={clearAll} className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><RotateCcw size={12} /> Clear all</button>
                <span>All amounts in USD</span>
              </div>
            </div>

            <div className="space-y-5">
              {config.categories.map((catConfig, ci) => {
                const cat = state.categories[ci];
                return (
                  <section key={cat.id} className="overflow-hidden rounded-3xl" style={{ background: "#fff", border: `1px solid ${c.line}` }}>
                    <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: c.tint, border: `1px solid ${c.tintLine}`, fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 15, color: c.accentText }}>{String(ci + 1).padStart(2, "0")}</span>
                        <div>
                          <h3 className="text-[18px] font-semibold" style={{ color: c.text, letterSpacing: "-0.01em" }}>{catConfig.title}</h3>
                          <div className="text-[13px]" style={{ color: c.muted }}>{catConfig.subtitle}</div>
                        </div>
                      </div>
                      <div className="text-[18px] font-semibold" style={{ color: c.accent }}>{money(catTotals[ci])}</div>
                    </div>

                    <div className="hidden grid-cols-[minmax(0,1fr)_88px_120px_96px] gap-3 px-6 pb-2 pt-2 sm:grid" style={{ ...eyebrow, fontSize: 10.5, letterSpacing: "0.14em", color: c.muted, borderBottom: `1px solid ${c.line}` }}>
                      <span>Item</span><span className="text-center">Qty</span><span>Cost each</span><span className="text-right">Total</span>
                    </div>

                    {cat.items.map((it) => (
                      <div key={it.id} className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_88px_120px_96px] sm:px-6" style={{ borderBottom: `1px solid ${c.line}` }}>
                        <div className="col-span-3 flex min-w-0 items-center gap-2 sm:col-span-1">
                          {it.custom ? (
                            <input value={it.name} onChange={(e) => updateItem(cat.id, it.id, { name: e.target.value.slice(0, 60) })} placeholder="What's the cost for?" className={inputBase} style={inputStyle} autoFocus={!it.name} />
                          ) : (
                            <div>
                              <div className="text-[14.5px] font-medium" style={{ color: c.text }}>{it.name}</div>
                              {it.perGuest && <div className="text-[12px] font-medium" style={{ color: c.pink }}>per guest</div>}
                            </div>
                          )}
                          {it.custom && (
                            <button onClick={() => removeItem(cat.id, it.id)} aria-label="Remove this cost" className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ color: c.muted }}><X size={14} /></button>
                          )}
                        </div>
                        {it.perGuest ? (
                          <div title="Uses your guest count" className="flex h-[38px] items-center justify-center rounded-lg text-[13.5px]" style={{ background: c.tint, border: `1px dashed ${c.tintLine}`, color: guests ? c.text : c.muted }}>{guests || "Guests"}</div>
                        ) : (
                          <input type="number" min="0" inputMode="numeric" value={it.qty} onChange={(e) => updateItem(cat.id, it.id, { qty: e.target.value.replace(/[^\d]/g, "").slice(0, 5) })} aria-label={`${it.name || "Cost"} quantity`} className={`${inputBase} text-center`} style={inputStyle} />
                        )}
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px]" style={{ color: c.muted }}>$</span>
                          <input type="text" inputMode="decimal" value={it.cost} placeholder="0" onChange={(e) => updateItem(cat.id, it.id, { cost: e.target.value.replace(/[^\d.,]/g, "").slice(0, 12) })} aria-label={`${it.name || "Cost"} cost each`} className={`${inputBase} pl-7`} style={inputStyle} />
                        </div>
                        <div className="text-right text-[14.5px] font-semibold" style={{ color: c.text }}>{money(qtyOf(it) * num(it.cost))}</div>
                      </div>
                    ))}

                    <div className="px-5 py-4 sm:px-6">
                      <button onClick={() => addItem(cat.id)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: c.accentText }}><Plus size={14} /> Add a cost</button>
                    </div>
                  </section>
                );
              })}
            </div>

            <section className="mt-10 flex flex-col gap-5 rounded-3xl p-7 sm:flex-row sm:items-center sm:justify-between" style={{ background: c.tint, border: `1px solid ${c.tintLine}` }}>
              <div className="max-w-md">
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 24, color: c.text }}>{config.ctaTitle}</h2>
                <p className="mt-2 text-[14px]" style={{ color: c.muted, lineHeight: 1.6 }}>{config.ctaBody}</p>
              </div>
              <div className="flex flex-shrink-0 flex-col gap-2">
                <a href="/" className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold" style={{ background: c.accent, color: "#fff" }}>Create your invitation <ArrowRight size={15} /></a>
                <a href="/shop" className="text-center text-[13px] font-medium underline-offset-2 hover:underline" style={{ color: c.accentText }}>See the designs</a>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {estimateCard}
            <p className="mt-4 flex gap-2 px-2 text-[12.5px]" style={{ color: c.muted, lineHeight: 1.55 }}>
              <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: c.pink }} />
              Prices come from you. This calculator does not include vendor rates or a final quote.
            </p>
          </aside>
        </div>
      </main>

      {/* Phones: the running total stays in view while scrolling the categories. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-4 py-3 lg:hidden" style={{ background: "#fff", borderTop: `1px solid ${c.line}`, boxShadow: "0 -10px 30px -20px rgba(40,20,35,0.4)" }}>
        <div>
          <div style={{ ...eyebrow, fontSize: 10 }}>Estimated total</div>
          <div className="text-[22px] font-bold" style={{ color: c.accent, lineHeight: 1.2 }}>{money(total)}</div>
        </div>
        {guests > 0 && total > 0 && <div className="text-right text-[12px]" style={{ color: c.muted }}>{money(Math.round(total / guests))}<br />per guest</div>}
      </div>

      <footer className="px-4 pb-24 pt-8 sm:px-6 lg:pb-8" style={{ borderTop: `1px solid ${c.line}` }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-[12.5px]" style={{ color: c.muted }}>
          <span>© {new Date().getFullYear()} eInvite.me</span>
          <div className="flex gap-5">
            <a href="/" className="hover:underline">Home</a>
            <a href="/shop" className="hover:underline">Designs</a>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
