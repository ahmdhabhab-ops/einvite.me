// AI Bridal Studio: try on an existing dress (fal.ai virtual try-on, run
// on the server), plus the admin panel for dress shops and usage.
// "Design a new dress" is a separate, later feature: the try-on model only
// dresses a person in a dress from a photo, it doesn't design dresses.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Upload, Link2, Store, Download, RefreshCw, Shirt, Trash2, ExternalLink, ShieldCheck, Check, X, Image as ImageIcon, ArrowLeft, Plus, Pencil, LogIn } from "lucide-react";

const C = {
  bg: "#F5F0E7", card: "#FFFFFF", soft: "#FBF8F2", text: "#1C3B33", text2: "#55635B", muted: "#7B877F",
  gold: "#BF914A", goldDark: "#A87B38", green: "#1C3B33", line: "rgba(28,59,51,0.13)", error: "#A33A3A", errorBg: "#FBECEC", okBg: "#EAF3EE",
};
const SERIF = "'Playfair Display', 'Fraunces', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";

const T = {
  en: {
    dir: "ltr", brand: "AI Bridal Studio", tagline: "See yourself in a dress before you go to the shop.",
    tryTab: "Try on a dress", designTab: "Design a new dress", soon: "Coming later",
    designText: "Designing a brand-new dress from your ideas is a separate feature we're preparing. It will use a design model, not the try-on model below, which can only show you in a dress that already exists.",
    step1: "Your photo", step1Tips: ["One person, full length, head to feet", "Standing straight, facing the camera", "Simple, fitted everyday clothes", "Good light, plain background if you can"],
    choosePhoto: "Choose your photo", change: "Change",
    step2: "The dress", fromShop: "From a shop", uploadDress: "Upload a photo", pasteLink: "Paste a link",
    noShops: "No dress shops have been added yet. Upload a photo of the dress instead.", pickShop: "Choose a shop", pickDress: "Choose a dress", backToShops: "All shops",
    dressTip: "A clear photo where the whole dress is visible, ideally on a plain background.", chooseDress: "Choose the dress photo",
    linkLabel: "Link to the dress page", linkPh: "https://shop.example/dress/…", findDress: "Find the dress", finding: "Looking…",
    useThis: "Use this dress", supportedSites: "Supported sites", noSupported: "No sites support links yet.", uploadInstead: "Upload a photo instead",
    privacyTitle: "Your photos and privacy",
    privacy: (d) => [
      "To make the preview, your photo and the dress photo are sent to fal.ai, the AI service we use. We don't keep your original photo.",
      `The preview is private: only you can see it. We keep it for ${d} days, then delete it. You can delete it at any time.`,
      "This is an AI visual preview only. It isn't a measurement and doesn't guarantee how the dress will fit.",
    ],
    consent: "I agree to send my photo and the dress photo to fal.ai to make this preview.",
    used: (a, b) => `${a} of ${b} previews used today`,
    create: "Create my preview", creating: "Creating your preview…",
    waiting: ["Preparing your photo…", "Fitting the dress…", "Adjusting the details…", "Almost ready…"],
    waitNote: "This usually takes 15–40 seconds. Please keep this page open.",
    resultTitle: "Your preview",
    disclaimer: "AI visual preview, not a measurement or a guarantee that the dress will fit. The real dress, fabric and size may look different.",
    download: "Download", tryAgain: "Try again", another: "Try another dress",
    seeOnShop: "See the dress on the shop's website", from: "From",
    myPreviews: "My previews", none: "No previews yet.", del: "Delete", delAll: "Delete all", confirmDelAll: "Delete all your previews?", keptUntil: "Kept until",
    loginTitle: "Log in to use AI Bridal Studio", loginText: "AI Bridal Studio is part of your eInvite.me account. Log in, then come back to this page.", login: "Log in",
    notReady: "AI Bridal Studio is being set up. Please check back soon.",
    networkError: "Couldn't reach eInvite.me. Check your connection and try again.",
    readError: "Couldn't read that photo. Please choose a JPEG or PNG photo.",
    lang: "عربي",
  },
  ar: {
    dir: "rtl", brand: "استوديو العروس بالذكاء الاصطناعي", tagline: "شوفي حالك بالفستان قبل ما تروحي على المحل.",
    tryTab: "جرّبي فستان موجود", designTab: "صمّمي فستان جديد", soon: "قريباً",
    designText: "تصميم فستان جديد من أفكارك ميزة منفصلة عم نحضّرها، وبتستعمل موديل تصميم. موديل التجربة هون بس بيورجيكي حالك بفستان موجود، وما بيصمّم فساتين.",
    step1: "صورتك", step1Tips: ["إنتِ لحالك بالصورة، من الراس للإجرين", "واقفة مستقيمة ووجّك للكاميرا", "لبس عادي وبسيط على جسمك", "ضو منيح، وخلفية سادة إذا فيكي"],
    choosePhoto: "اختاري صورتك", change: "غيّري",
    step2: "الفستان", fromShop: "من محل", uploadDress: "ارفعي صورة", pasteLink: "حطّي رابط",
    noShops: "ما في محلات مضافة بعد. ارفعي صورة الفستان.", pickShop: "اختاري المحل", pickDress: "اختاري الفستان", backToShops: "كل المحلات",
    dressTip: "صورة واضحة للفستان كلّه، والأفضل على خلفية سادة.", chooseDress: "اختاري صورة الفستان",
    linkLabel: "رابط صفحة الفستان", linkPh: "https://shop.example/dress/…", findDress: "لاقي الفستان", finding: "عم دوّر…",
    useThis: "استعملي هالفستان", supportedSites: "المواقع المدعومة", noSupported: "ما في مواقع مدعومة للروابط بعد.", uploadInstead: "ارفعي صورة بدالها",
    privacyTitle: "صورك وخصوصيتك",
    privacy: (d) => [
      "لنعمل المعاينة، صورتك وصورة الفستان بينبعتوا لخدمة fal.ai للذكاء الاصطناعي. ما منحتفظ بصورتك الأصلية.",
      `المعاينة خاصة، إنتِ بس فيكي تشوفيها. منحتفظ فيها ${d} يوم وبعدين منمحيها، وفيكي تمحيها بأي وقت.`,
      "هيدي معاينة بصرية بالذكاء الاصطناعي، مش قياسات وما بتضمن إنّو الفستان رح يجي مظبوط عليكي.",
    ],
    consent: "بوافق إنّو صورتي وصورة الفستان ينبعتوا لـfal.ai لتنعمل المعاينة.",
    used: (a, b) => `استعملتِ ${a} من ${b} معاينات اليوم`,
    create: "اعمليلي المعاينة", creating: "عم نحضّر المعاينة…",
    waiting: ["عم نحضّر صورتك…", "عم نلبّسك الفستان…", "عم نظبط التفاصيل…", "تقريباً جاهزة…"],
    waitNote: "بتاخد عادةً بين 15 و40 ثانية. خلّي الصفحة مفتوحة.",
    resultTitle: "المعاينة",
    disclaimer: "معاينة بصرية بالذكاء الاصطناعي، مش قياسات ولا ضمان إنّو الفستان رح يجي مظبوط. الفستان الحقيقي وقماشه ومقاسه ممكن يبيّنوا غير.",
    download: "نزّليها", tryAgain: "جرّبي مرة تانية", another: "جرّبي فستان تاني",
    seeOnShop: "شوفي الفستان على موقع المحل", from: "من",
    myPreviews: "معايناتي", none: "ما في معاينات بعد.", del: "امحي", delAll: "امحي الكل", confirmDelAll: "بدّك تمحي كل معايناتك؟", keptUntil: "محفوظة لـ",
    loginTitle: "سجّلي دخول لتستعملي استوديو العروس", loginText: "استوديو العروس جزء من حسابك على eInvite.me. سجّلي دخول وارجعي على هالصفحة.", login: "تسجيل الدخول",
    notReady: "استوديو العروس عم يتجهّز. ارجعي جرّبي قريباً.",
    networkError: "ما قدرنا نوصل لـeInvite.me. تأكدي من الإنترنت وجرّبي مرة تانية.",
    readError: "ما قدرنا نقرأ هالصورة. اختاري صورة JPEG أو PNG.",
    lang: "English",
  },
};

// Downsizes a photo in the browser before upload (keeps uploads small and
// strips the original file's metadata, like GPS).
export async function photoToDataUri(file, maxDim = 1600, quality = 0.9) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(path, { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("network");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

const price = (d) => (d.price != null ? `${Number(d.price).toLocaleString("en-US")} ${d.currency || ""}`.trim() : "");

function Btn({ children, onClick, disabled, kind = "primary", type = "button", style, ...rest }) {
  const kinds = {
    primary: { background: C.green, color: "#fff", border: `1px solid ${C.green}` },
    gold: { background: C.gold, color: "#fff", border: `1px solid ${C.gold}` },
    ghost: { background: "transparent", color: C.text, border: `1px solid ${C.line}` },
    danger: { background: "transparent", color: C.error, border: `1px solid rgba(163,58,58,0.35)` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-opacity" style={{ ...kinds[kind], opacity: disabled ? 0.45 : 1, cursor: disabled ? "default" : "pointer", fontFamily: SANS, ...style }} {...rest}>
      {children}
    </button>
  );
}

// A link that looks like Btn (a button inside a link isn't valid HTML).
function LinkBtn({ href, children, kind = "primary", ...rest }) {
  const look = kind === "gold" ? { background: C.gold, color: "#fff", border: `1px solid ${C.gold}` } : { background: C.green, color: "#fff", border: `1px solid ${C.green}` };
  return <a href={href} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold" style={{ ...look, fontFamily: SANS }} {...rest}>{children}</a>;
}

function Card({ children, style }) {
  return <div className="rounded-3xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 24px 50px -36px rgba(28,59,51,0.35)", ...style }}>{children}</div>;
}

function StepTitle({ n, children }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: C.gold, color: "#fff" }}>{n}</span>
      <h2 className="text-[19px]" style={{ fontFamily: SERIF, color: C.text }}>{children}</h2>
    </div>
  );
}

function FilePick({ label, onPick, icon: Icon = Upload }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onPick(f); }} />
      <button type="button" onClick={() => ref.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl px-4 py-7 text-[14px] font-semibold" style={{ border: `1.5px dashed ${C.gold}`, background: C.soft, color: C.goldDark, fontFamily: SANS }}>
        <Icon size={22} /> {label}
      </button>
    </>
  );
}

function ErrorBox({ children }) {
  return <div role="alert" className="mt-3 rounded-2xl px-4 py-3 text-[13.5px]" style={{ background: C.errorBg, color: C.error, fontFamily: SANS }}>{children}</div>;
}

export default function BridalStudioPage() {
  const [lang, setLang] = useState(() => (typeof navigator !== "undefined" && /^ar/i.test(navigator.language || "") ? "ar" : "en"));
  const t = T[lang];
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState("try");
  const [person, setPerson] = useState(null); // data URI
  const [dressTab, setDressTab] = useState("shop");
  const [dress, setDress] = useState(null); // { type, ..., preview, name, shopName }
  const [shops, setShops] = useState([]);
  const [openShop, setOpenShop] = useState(null);
  const [link, setLink] = useState("");
  const [linkState, setLinkState] = useState(null); // { loading } | result of resolve-link | { error }
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waitStep, setWaitStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [previews, setPreviews] = useState([]);
  const resultRef = useRef(null);

  const loadConfig = () => fetch("/api/bridal/config", { credentials: "same-origin" }).then((r) => r.json()).then(setConfig).catch(() => setConfig({ enabled: false }));
  const loadPreviews = () => api("/api/bridal/results").then((d) => setPreviews(d.results || [])).catch(() => {});
  useEffect(() => {
    loadConfig();
    api("/api/bridal/shops").then((d) => setShops(d.shops || [])).catch(() => {});
  }, []);
  useEffect(() => { if (config?.signedIn) loadPreviews(); }, [config?.signedIn]);
  useEffect(() => {
    if (!busy) return;
    setWaitStep(0);
    const id = setInterval(() => setWaitStep((s) => Math.min(s + 1, 3)), 9000);
    return () => clearInterval(id);
  }, [busy]);
  useEffect(() => { document.title = `${T[lang].brand} · eInvite.me`; }, [lang]);

  const readPhoto = async (file, set) => {
    setError("");
    try { set(await photoToDataUri(file)); } catch { setError(t.readError); }
  };

  const findLink = async () => {
    setLinkState({ loading: true });
    try { setLinkState(await api("/api/bridal/resolve-link", { method: "POST", body: { url: link } })); } catch (e) { setLinkState({ error: e.message === "network" ? t.networkError : e.message }); }
  };

  const generate = async () => {
    setError(""); setResult(null); setBusy(true);
    try {
      const body = { consent: true, personImage: person, dress: dress.type === "upload" ? { type: "upload", image: dress.image } : dress.type === "catalog" ? { type: "catalog", shopId: dress.shopId, dressId: dress.dressId } : { type: "link", token: dress.token } };
      const { jobId } = await api("/api/bridal/try-on", { method: "POST", body });
      for (let i = 0; i < 150; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const j = await api(`/api/bridal/jobs/${jobId}`);
        if (j.status === "done") { setResult(j.result); loadPreviews(); break; }
        if (j.status === "failed") { setError(j.error); break; }
      }
    } catch (e) {
      setError(e.message === "network" ? t.networkError : e.message);
    } finally {
      setBusy(false);
      loadConfig();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const del = async (id) => { await api(`/api/bridal/results/${id}`, { method: "DELETE" }).catch(() => {}); if (result?.id === id) setResult(null); loadPreviews(); };
  const delAll = async () => { if (!window.confirm(t.confirmDelAll)) return; await api("/api/bridal/results", { method: "DELETE" }).catch(() => {}); setResult(null); loadPreviews(); };
  const anotherDress = () => { setDress(null); setResult(null); setError(""); setLinkState(null); setLink(""); setOpenShop(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const shop = useMemo(() => shops.find((s) => s.id === openShop) || null, [shops, openShop]);
  const ready = !!person && !!dress && consent && !busy;
  const supportedShops = shops.filter((s) => s.linkImport);

  const shell = (inner) => (
    <div dir={t.dir} className="min-h-screen pb-16" style={{ background: C.bg, color: C.text, fontFamily: lang === "ar" ? "'Tajawal', 'Cairo', " + SANS : SANS }}>
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <a href="/" className="text-[13px] font-semibold tracking-[0.18em]" style={{ color: C.goldDark }}>EINVITE.ME</a>
          <button type="button" onClick={() => setLang(lang === "en" ? "ar" : "en")} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ border: `1px solid ${C.line}`, color: C.text }}>{t.lang}</button>
        </div>
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(191,145,74,0.14)", color: C.gold }}><Sparkles size={22} /></div>
          <h1 className="text-[30px] leading-tight sm:text-[40px]" style={{ fontFamily: lang === "ar" ? "inherit" : SERIF, fontWeight: lang === "ar" ? 700 : 500 }}>{t.brand}</h1>
          <p className="mx-auto mt-2 max-w-md text-[15px]" style={{ color: C.text2 }}>{t.tagline}</p>
        </div>
        {inner}
      </div>
    </div>
  );

  if (!config) return shell(<div className="py-20 text-center" style={{ color: C.muted }}>…</div>);
  if (!config.enabled || !config.ready) return shell(<Card style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}><p style={{ color: C.text2 }}>{t.notReady}</p></Card>);
  if (!config.signedIn) {
    return shell(
      <Card style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <h2 className="mb-2 text-[20px]" style={{ fontFamily: SERIF }}>{t.loginTitle}</h2>
        <p className="mb-5 text-[14.5px]" style={{ color: C.text2 }}>{t.loginText}</p>
        <LinkBtn href="/"><LogIn size={16} /> {t.login}</LinkBtn>
      </Card>
    );
  }

  return shell(
    <>
      {/* The two features are kept apart on purpose. */}
      <div className="mx-auto mb-6 flex max-w-md rounded-full p-1" style={{ background: "#EDE5D8" }} role="tablist">
        {[["try", t.tryTab], ["design", t.designTab]].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={mode === k} type="button" onClick={() => setMode(k)} className="flex-1 rounded-full px-3 py-2.5 text-[13.5px] font-semibold" style={{ background: mode === k ? C.card : "transparent", color: mode === k ? C.text : C.muted, boxShadow: mode === k ? "0 4px 14px -8px rgba(28,59,51,0.4)" : "none" }}>
            {label}{k === "design" && <span className="ms-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(191,145,74,0.18)", color: C.goldDark }}>{t.soon}</span>}
          </button>
        ))}
      </div>

      {mode === "design" ? (
        <Card style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <Pencil size={22} style={{ color: C.gold, margin: "0 auto 10px" }} />
          <p className="text-[15px] leading-relaxed" style={{ color: C.text2 }}>{t.designText}</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Card>
              <StepTitle n={1}>{t.step1}</StepTitle>
              {person ? (
                <div className="flex items-center gap-4">
                  <img src={person} alt="" className="h-40 w-28 rounded-2xl object-cover" style={{ border: `1px solid ${C.line}` }} />
                  <Btn kind="ghost" onClick={() => setPerson(null)} disabled={busy}><RefreshCw size={15} /> {t.change}</Btn>
                </div>
              ) : (
                <>
                  <ul className="mb-3 grid gap-1.5 text-[13.5px]" style={{ color: C.text2 }}>
                    {t.step1Tips.map((tip) => <li key={tip} className="flex items-start gap-2"><Check size={15} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />{tip}</li>)}
                  </ul>
                  <FilePick label={t.choosePhoto} onPick={(f) => readPhoto(f, setPerson)} />
                </>
              )}
            </Card>

            <Card>
              <StepTitle n={2}>{t.step2}</StepTitle>
              {dress ? (
                <div className="flex items-center gap-4">
                  <img src={dress.preview} alt="" className="h-40 w-28 rounded-2xl object-cover" style={{ border: `1px solid ${C.line}`, background: C.soft }} />
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold">{dress.name}</div>
                    {dress.shopName && <div className="text-[13px]" style={{ color: C.muted }}>{t.from} {dress.shopName}{dress.price ? ` · ${dress.price}` : ""}</div>}
                    <div className="mt-3"><Btn kind="ghost" onClick={() => { setDress(null); setLinkState(null); }} disabled={busy}><RefreshCw size={15} /> {t.change}</Btn></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl p-1" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
                    {[["shop", t.fromShop, Store], ["upload", t.uploadDress, Upload], ["link", t.pasteLink, Link2]].map(([k, label, Icon]) => (
                      <button key={k} type="button" onClick={() => setDressTab(k)} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[12px] font-semibold sm:flex-row sm:justify-center sm:text-[13px]" style={{ background: dressTab === k ? C.card : "transparent", color: dressTab === k ? C.text : C.muted, boxShadow: dressTab === k ? "0 3px 10px -6px rgba(28,59,51,0.4)" : "none" }}>
                        <Icon size={15} /> {label}
                      </button>
                    ))}
                  </div>

                  {dressTab === "shop" && (
                    !shops.length ? <p className="text-[14px]" style={{ color: C.text2 }}>{t.noShops}</p> :
                    !shop ? (
                      <>
                        <div className="mb-2 text-[13px] font-semibold" style={{ color: C.muted }}>{t.pickShop}</div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {shops.map((s) => (
                            <button key={s.id} type="button" onClick={() => setOpenShop(s.id)} className="flex items-center gap-2.5 rounded-2xl p-3 text-start" style={{ border: `1px solid ${C.line}`, background: C.soft }}>
                              {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "#EDE5D8" }}><Store size={16} /></span>}
                              <span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{s.name}</span><span className="text-[12px]" style={{ color: C.muted }}>{s.dresses.length}</span></span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setOpenShop(null)} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: C.goldDark }}><ArrowLeft size={14} style={{ transform: lang === "ar" ? "scaleX(-1)" : "none" }} /> {t.backToShops}</button>
                        <div className="mb-2 text-[13px] font-semibold" style={{ color: C.muted }}>{shop.name} · {t.pickDress}</div>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {shop.dresses.map((d) => (
                            <button key={d.id} type="button" onClick={() => setDress({ type: "catalog", shopId: shop.id, dressId: d.id, preview: d.imageUrl, name: d.name, shopName: shop.name, price: price(d), productUrl: d.productUrl })} className="overflow-hidden rounded-2xl text-start" style={{ border: `1px solid ${C.line}`, background: C.soft }}>
                              <img src={d.imageUrl} alt={d.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                              <div className="p-2"><div className="truncate text-[13px] font-semibold">{d.name}</div>{d.price != null && <div className="text-[12px]" style={{ color: C.muted }}>{price(d)}</div>}</div>
                            </button>
                          ))}
                        </div>
                      </>
                    )
                  )}

                  {dressTab === "upload" && (
                    <>
                      <p className="mb-3 text-[13.5px]" style={{ color: C.text2 }}>{t.dressTip}</p>
                      <FilePick label={t.chooseDress} icon={Shirt} onPick={(f) => readPhoto(f, (img) => setDress({ type: "upload", image: img, preview: img, name: lang === "ar" ? "فستانك" : "Your dress" }))} />
                    </>
                  )}

                  {dressTab === "link" && (
                    <>
                      <label className="mb-1.5 block text-[13px] font-semibold" htmlFor="dress-link">{t.linkLabel}</label>
                      <div className="flex gap-2">
                        <input id="dress-link" dir="ltr" type="url" inputMode="url" value={link} onChange={(e) => { setLink(e.target.value); setLinkState(null); }} placeholder={t.linkPh} className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-[14px] outline-none" style={{ border: `1px solid ${C.line}`, background: C.soft, color: C.text }} />
                        <Btn onClick={findLink} disabled={!link.trim() || linkState?.loading}>{linkState?.loading ? t.finding : t.findDress}</Btn>
                      </div>
                      {linkState?.error && <ErrorBox>{linkState.error}</ErrorBox>}
                      {linkState?.supported === false && (
                        <div className="mt-3 rounded-2xl p-4 text-[13.5px]" style={{ background: C.soft, border: `1px solid ${C.line}`, color: C.text2 }}>
                          <p>{linkState.message}</p>
                          <p className="mt-2 font-semibold" style={{ color: C.text }}>{t.supportedSites}:</p>
                          <p>{linkState.supportedShops?.length ? linkState.supportedShops.map((s) => `${s.name} (${s.domains[0]})`).join(" · ") : t.noSupported}</p>
                          <div className="mt-3"><Btn kind="ghost" onClick={() => setDressTab("upload")}><Upload size={15} /> {t.uploadInstead}</Btn></div>
                        </div>
                      )}
                      {linkState?.supported && linkState.dress && (
                        <div className="mt-3 flex items-center gap-4 rounded-2xl p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
                          <img src={linkState.dress.preview || linkState.dress.imageUrl} alt="" className="h-32 w-24 rounded-xl object-cover" />
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold">{linkState.dress.name}</div>
                            <div className="mb-2 text-[12.5px]" style={{ color: C.muted }}>{t.from} {linkState.shop.name}</div>
                            <Btn kind="gold" onClick={() => {
                              const d = linkState.dress;
                              setDress(d.source === "catalog"
                                ? { type: "catalog", shopId: d.shopId, dressId: d.dressId, preview: d.imageUrl, name: d.name, shopName: linkState.shop.name, productUrl: d.productUrl }
                                : { type: "link", token: d.token, preview: d.preview, name: d.name, shopName: linkState.shop.name, productUrl: d.productUrl });
                            }}><Check size={15} /> {t.useThis}</Btn>
                          </div>
                        </div>
                      )}
                      {!linkState && supportedShops.length > 0 && <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>{t.supportedSites}: {supportedShops.map((s) => s.name).join(" · ")}</p>}
                    </>
                  )}
                </>
              )}
            </Card>

            <Card>
              <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><ShieldCheck size={17} style={{ color: C.gold }} /> {t.privacyTitle}</div>
              <ul className="mb-3 grid gap-1.5 text-[13px] leading-relaxed" style={{ color: C.text2 }}>
                {t.privacy(config.retentionDays).map((p) => <li key={p}>• {p}</li>)}
              </ul>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl p-3 text-[13.5px]" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ accentColor: C.green }} />
                <span>{t.consent}</span>
              </label>
              {config.used && !config.isAdmin && <p className="mt-3 text-[12.5px]" style={{ color: C.muted }}>{t.used(config.used.today, config.limits.daily)}</p>}
              <Btn onClick={generate} disabled={!ready} style={{ width: "100%", marginTop: 12, padding: "13px 18px", fontSize: 15 }}>
                <Sparkles size={17} /> {busy ? t.creating : t.create}
              </Btn>
            </Card>
          </div>

          <div ref={resultRef} className="flex flex-col gap-5">
            <Card style={{ minHeight: 320 }}>
              <h2 className="mb-3 text-[19px]" style={{ fontFamily: lang === "ar" ? "inherit" : SERIF }}>{t.resultTitle}</h2>
              {busy ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-center" aria-live="polite">
                  <div className="relative h-56 w-40 overflow-hidden rounded-3xl" style={{ background: "linear-gradient(110deg, #EFE7DA 30%, #F8F3EA 50%, #EFE7DA 70%)", backgroundSize: "200% 100%", animation: "bridal-shimmer 1.6s linear infinite" }}>
                    <Sparkles size={26} className="absolute inset-0 m-auto" style={{ color: C.gold }} />
                  </div>
                  <div className="text-[15px] font-semibold">{t.waiting[waitStep]}</div>
                  <div className="max-w-xs text-[12.5px]" style={{ color: C.muted }}>{t.waitNote}</div>
                  <style>{"@keyframes bridal-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}"}</style>
                </div>
              ) : result ? (
                <>
                  <img src={result.imageUrl} alt={t.resultTitle} className="w-full rounded-2xl" style={{ border: `1px solid ${C.line}` }} />
                  <p className="mt-3 rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed" style={{ background: C.soft, color: C.text2, border: `1px solid ${C.line}` }}>{t.disclaimer}</p>
                  {result.dress?.shopName && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3" style={{ background: C.okBg }}>
                      <div className="text-[13.5px]"><span style={{ color: C.muted }}>{t.from}</span> <b>{result.dress.shopName}</b> · {result.dress.name}{result.dress.price != null ? ` · ${price(result.dress)}` : ""}</div>
                      {result.dress.productUrl && <LinkBtn kind="gold" href={result.dress.productUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> {t.seeOnShop}</LinkBtn>}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LinkBtn href={result.downloadUrl}><Download size={15} /> {t.download}</LinkBtn>
                    <Btn kind="ghost" onClick={generate} disabled={!ready}><RefreshCw size={15} /> {t.tryAgain}</Btn>
                    <Btn kind="ghost" onClick={anotherDress}><Shirt size={15} /> {t.another}</Btn>
                    <Btn kind="danger" onClick={() => del(result.id)}><Trash2 size={15} /> {t.del}</Btn>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center" style={{ color: C.muted }}>
                  <ImageIcon size={30} />
                  <p className="max-w-xs text-[13.5px]">{t.disclaimer}</p>
                </div>
              )}
              {error && <ErrorBox>{error}{person && dress && <div className="mt-2"><Btn kind="ghost" onClick={generate} disabled={!ready}><RefreshCw size={15} /> {t.tryAgain}</Btn></div>}</ErrorBox>}
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[17px]" style={{ fontFamily: lang === "ar" ? "inherit" : SERIF }}>{t.myPreviews}</h2>
                {previews.length > 0 && <button type="button" onClick={delAll} className="text-[12.5px] font-semibold underline" style={{ color: C.error }}>{t.delAll}</button>}
              </div>
              {!previews.length ? <p className="text-[13.5px]" style={{ color: C.muted }}>{t.none}</p> : (
                <div className="grid grid-cols-3 gap-2.5">
                  {previews.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
                      <button type="button" onClick={() => setResult(p)} className="block w-full"><img src={p.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" /></button>
                      <div className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px]" style={{ color: C.muted }}>
                        <span className="truncate">{t.keptUntil} {new Date(p.expiresAt).toLocaleDateString(lang === "ar" ? "ar-LB" : undefined, { day: "numeric", month: "short" })}</span>
                        <button type="button" onClick={() => del(p.id)} aria-label={t.del} style={{ color: C.error }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Admin: dress shops, catalogs and usage.
// ---------------------------------------------------------------------------
const emptyShop = { name: "", website: "", logoUrl: "", linkImport: false, linkDomains: "", active: true };
const emptyDress = { name: "", imageUrl: "", productUrl: "", price: "", currency: "USD", active: true };

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold" style={{ color: C.text }}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px]" style={{ color: C.muted }}>{hint}</span>}
    </label>
  );
}
const inputStyle = { border: `1px solid ${C.line}`, background: C.soft, color: C.text, fontFamily: SANS };
const Input = (props) => <input {...props} className="w-full rounded-xl px-3 py-2 text-[13.5px] outline-none" style={inputStyle} />;

function ImageField({ label, value, onChange, setError }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (file) => {
    setUploading(true);
    try {
      const image = await photoToDataUri(file, 1800, 0.9);
      const { url } = await api("/api/bridal/admin/upload", { method: "POST", body: { image } });
      onChange(url);
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  };
  const ref = useRef(null);
  return (
    <Field label={label} hint="Upload, or paste an https link to the image.">
      <div className="flex items-center gap-2">
        {value ? <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover" /> : null}
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
        <Btn kind="ghost" onClick={() => ref.current?.click()} disabled={uploading} style={{ padding: "8px 12px", fontSize: 13 }}><Upload size={14} /> {uploading ? "…" : "Upload"}</Btn>
      </div>
    </Field>
  );
}

function DressForm({ initial, onSave, onCancel, setError }) {
  const [d, setD] = useState({ ...emptyDress, ...initial, price: initial?.price ?? "" });
  return (
    <div className="grid gap-3 rounded-2xl p-4 sm:grid-cols-2" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
      <Field label="Dress name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Product page link"><Input value={d.productUrl || ""} onChange={(e) => setD({ ...d, productUrl: e.target.value })} placeholder="https://…" /></Field>
      <div className="sm:col-span-2"><ImageField label="Dress photo" value={d.imageUrl} onChange={(v) => setD({ ...d, imageUrl: v })} setError={setError} /></div>
      <Field label="Price (optional)"><Input type="number" min="0" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} /></Field>
      <Field label="Currency"><Input value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Shown to brides</label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={() => onSave(d)}><Check size={15} /> Save dress</Btn>
      </div>
    </div>
  );
}

function ShopForm({ initial, onSave, onCancel, setError }) {
  const [s, setS] = useState({ ...emptyShop, ...initial, linkDomains: Array.isArray(initial?.linkDomains) ? initial.linkDomains.join(", ") : initial?.linkDomains || "" });
  return (
    <div className="grid gap-3 rounded-2xl p-4 sm:grid-cols-2" style={{ background: C.soft, border: `1px solid ${C.line}` }}>
      <Field label="Shop name"><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field>
      <Field label="Website"><Input value={s.website || ""} onChange={(e) => setS({ ...s, website: e.target.value })} placeholder="https://…" /></Field>
      <div className="sm:col-span-2"><ImageField label="Logo" value={s.logoUrl || ""} onChange={(v) => setS({ ...s, logoUrl: v })} setError={setError} /></div>
      <label className="flex items-start gap-2 text-[13px] sm:col-span-2">
        <input type="checkbox" checked={s.linkImport} onChange={(e) => setS({ ...s, linkImport: e.target.checked })} className="mt-0.5" />
        <span><b>Brides may paste links from this shop's site.</b> Only turn this on when the shop allowed using its product photos for try-on.</span>
      </label>
      {s.linkImport && <div className="sm:col-span-2"><Field label="Extra domains for links and photos (optional)" hint="The website's own domain is always included. Add e.g. the shop's image CDN, comma-separated."><Input value={s.linkDomains} onChange={(e) => setS({ ...s, linkDomains: e.target.value })} placeholder="cdn.shop.com, shop.myshopify.com" /></Field></div>}
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={s.active} onChange={(e) => setS({ ...s, active: e.target.checked })} /> Shown to brides</label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={() => onSave(s)}><Check size={15} /> Save shop</Btn>
      </div>
    </div>
  );
}

export function BridalAdminPanel() {
  const [shops, setShops] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");
  const [error, setError] = useState("");
  const [editingShop, setEditingShop] = useState(null); // "new" | id
  const [editingDress, setEditingDress] = useState(null); // { shopId, id | "new" }
  const [openShop, setOpenShop] = useState(null);
  const load = () => {
    api("/api/bridal/admin/shops").then((d) => setShops(d.shops)).catch((e) => setError(e.message === "network" ? "Couldn't reach the server." : e.message));
    api("/api/bridal/admin/usage").then((u) => { setUsage(u); setUsageError(""); }).catch((e) => setUsageError(e.message === "network" ? "Couldn't reach the server." : e.message));
  };
  useEffect(load, []);
  const run = async (fn) => { setError(""); try { await fn(); load(); return true; } catch (e) { setError(e.message); return false; } };

  if (error && !shops) return <Card><p style={{ color: C.text2 }}>AI Bridal Studio is off on this server (set BRIDAL_STUDIO_ENABLED=1), or: {error}</p></Card>;
  if (!shops) return <Card><p style={{ color: C.muted }}>Loading…</p></Card>;
  const m = usage ? usage.months?.[new Date().toISOString().slice(0, 7)] : null;

  return (
    <div className="flex flex-col gap-5" style={{ color: C.text, fontFamily: SANS }}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px]" style={{ fontFamily: SERIF }}>AI Bridal Studio</h2>
            <p className="text-[13px]" style={{ color: C.text2 }}>Try-on with fal.ai{usage?.model ? ` (${usage.model})` : ""}. Page: <a href="/bridal-studio" target="_blank" rel="noreferrer" className="underline">/bridal-studio</a></p>
          </div>
          {usage && <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: usage.ready ? C.okBg : C.errorBg, color: usage.ready ? C.green : C.error }}>{usage.ready ? `fal.ai connected (${usage.keySetting})` : "FAL_KEY missing"}</span>}
        </div>
        {usage && !usage.ready && <p className="mt-3 rounded-2xl px-3.5 py-2.5 text-[12.5px]" style={{ background: C.errorBg, color: C.error }}>The server doesn't see the fal.ai key. In Dokploy, open this app (einvite.me) → Environment and add a line FAL_KEY=… with your fal.ai key, Save, then Redeploy. The key must be on this same app, not on another app or in Supabase.</p>}
        {usageError && <ErrorBox>Couldn't load usage: {usageError}</ErrorBox>}
        {usage && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[["This month's attempts", m?.attempts || 0], ["Previews made", m?.succeeded || 0], ["Failed", m?.failed || 0], ["Cost this month", `$${(m?.costUsd || 0).toFixed(2)}`]].map(([l, v]) => (
              <div key={l} className="rounded-2xl p-3" style={{ background: C.soft, border: `1px solid ${C.line}` }}><div className="text-[11.5px]" style={{ color: C.muted }}>{l}</div><div className="text-[20px] font-semibold">{v}</div></div>
            ))}
          </div>
        )}
        {usage && <p className="mt-3 text-[12px]" style={{ color: C.muted }}>Limits: {usage.settings.dailyLimit}/day and {usage.settings.monthlyLimit}/month per person, {usage.settings.globalDailyLimit}/day for everyone. Cost is counted at ${usage.settings.priceUsd} per preview (fal's listed price); compare with fal's billing using the request ids below. Previews are kept {usage.settings.retentionDays} days.</p>}
        {usage?.recent?.length > 0 && (
          <div className="mt-3 max-h-64 overflow-auto rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
            <table className="w-full text-[12px]">
              <thead style={{ background: C.soft, color: C.muted }}><tr>{["When", "Who", "Result", "Dress", "Seconds", "Cost", "fal request"].map((h) => <th key={h} className="px-2 py-1.5 text-start font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {usage.recent.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="px-2 py-1.5">{new Date(r.at).toLocaleString()}</td><td className="px-2 py-1.5">{r.owner}</td>
                    <td className="px-2 py-1.5" style={{ color: r.ok ? C.green : C.error }}>{r.ok ? "made" : `failed${r.billable ? " (billed)" : ""}`}</td>
                    <td className="px-2 py-1.5">{r.dress || ""}</td><td className="px-2 py-1.5">{r.seconds ?? ""}{r.inferenceSeconds ? ` (${r.inferenceSeconds})` : ""}</td>
                    <td className="px-2 py-1.5">${(r.costUsd || 0).toFixed(2)}</td><td className="px-2 py-1.5 font-mono text-[11px]">{r.requestId || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[17px]" style={{ fontFamily: SERIF }}>Dress shops</h3>
          {editingShop !== "new" && <Btn onClick={() => setEditingShop("new")}><Plus size={15} /> Add shop</Btn>}
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        {editingShop === "new" && <div className="mb-3"><ShopForm onCancel={() => setEditingShop(null)} setError={setError} onSave={async (s) => { if (await run(() => api("/api/bridal/admin/shops", { method: "POST", body: s }))) setEditingShop(null); }} /></div>}
        {!shops.length && editingShop !== "new" && <p className="text-[13.5px]" style={{ color: C.muted }}>No shops yet. Add a shop, then add its dresses by hand. Importing from a shop's CSV file, product feed or API can be added later; each dress already records where it came from.</p>}
        <div className="flex flex-col gap-3">
          {shops.map((s) => (
            <div key={s.id} className="rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
              {editingShop === s.id ? (
                <div className="p-3"><ShopForm initial={s} onCancel={() => setEditingShop(null)} setError={setError} onSave={async (v) => { if (await run(() => api(`/api/bridal/admin/shops/${s.id}`, { method: "PATCH", body: v }))) setEditingShop(null); }} /></div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <button type="button" onClick={() => setOpenShop(openShop === s.id ? null : s.id)} className="flex min-w-0 items-center gap-3 text-start">
                    {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#EDE5D8" }}><Store size={17} /></span>}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{s.name}{s.active === false && <span className="ms-2 text-[11px]" style={{ color: C.error }}>hidden</span>}</span>
                      <span className="block truncate text-[12px]" style={{ color: C.muted }}>{(s.dresses || []).length} dresses · {s.website || "no website"}{s.linkImport ? ` · links: ${s.linkDomains.join(", ")}` : ""}</span>
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <Btn kind="ghost" onClick={() => setEditingShop(s.id)} style={{ padding: "7px 12px", fontSize: 13 }}><Pencil size={13} /> Edit</Btn>
                    <Btn kind="danger" onClick={() => window.confirm(`Delete ${s.name} and its dresses?`) && run(() => api(`/api/bridal/admin/shops/${s.id}`, { method: "DELETE" }))} style={{ padding: "7px 12px", fontSize: 13 }}><Trash2 size={13} /></Btn>
                  </div>
                </div>
              )}
              {openShop === s.id && editingShop !== s.id && (
                <div className="border-t p-3" style={{ borderColor: C.line }}>
                  <div className="mb-3 flex justify-end">{!(editingDress?.shopId === s.id && editingDress.id === "new") && <Btn kind="gold" onClick={() => setEditingDress({ shopId: s.id, id: "new" })} style={{ padding: "7px 12px", fontSize: 13 }}><Plus size={14} /> Add dress</Btn>}</div>
                  {editingDress?.shopId === s.id && editingDress.id === "new" && <div className="mb-3"><DressForm onCancel={() => setEditingDress(null)} setError={setError} onSave={async (d) => { if (await run(() => api(`/api/bridal/admin/shops/${s.id}/dresses`, { method: "POST", body: d }))) setEditingDress(null); }} /></div>}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(s.dresses || []).map((d) => editingDress?.shopId === s.id && editingDress.id === d.id ? (
                      <div key={d.id} className="col-span-2 sm:col-span-4"><DressForm initial={d} onCancel={() => setEditingDress(null)} setError={setError} onSave={async (v) => { if (await run(() => api(`/api/bridal/admin/shops/${s.id}/dresses/${d.id}`, { method: "PATCH", body: v }))) setEditingDress(null); }} /></div>
                    ) : (
                      <div key={d.id} className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}`, opacity: d.active === false ? 0.5 : 1 }}>
                        <img src={d.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
                        <div className="p-2">
                          <div className="truncate text-[13px] font-semibold">{d.name}</div>
                          <div className="text-[11.5px]" style={{ color: C.muted }}>{price(d) || "no price"} · {d.source}</div>
                          <div className="mt-1.5 flex gap-1.5">
                            <button type="button" onClick={() => setEditingDress({ shopId: s.id, id: d.id })} className="text-[12px] underline">Edit</button>
                            <button type="button" onClick={() => window.confirm(`Delete ${d.name}?`) && run(() => api(`/api/bridal/admin/shops/${s.id}/dresses/${d.id}`, { method: "DELETE" }))} className="text-[12px] underline" style={{ color: C.error }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
