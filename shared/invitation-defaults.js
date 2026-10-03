// The starting data of a new invitation, shared by the app (src/App.jsx)
// and the server (the ChatGPT plugin in mcp/ creates drafts from it), so a
// draft made either way has exactly the same shape.

const uid = () => Math.random().toString(36).slice(2, 10);

// Same order as ALL_STEPS in src/App.jsx.
export const STEP_KEYS = ["cover", "family", "timeline", "locations", "countdown", "rsvp", "registry", "djRequests", "networking", "livestream"];

export const emptyIntroMedia = () => ({ en: null, ar: null, fr: null, es: null, hy: null }); // each entry: { type: 'image'|'video', url, name }

export const defaultIntroSettings = {
  type: "button",
  icon: "heart",
  animationStyle: "floatingHearts",
  sealDesign: "gold",
  media: emptyIntroMedia(),
  revealHoldMs: null, // null = 700ms (the "Medium" point in REVEAL_SPEED_MS, in CoverStep) — same speed regardless of background media type, until the admin picks a different one
};

export const emptyCustomBlocks = () => ({ cover: [], family: [], timeline: [], locations: [], countdown: [], rsvp: [], registry: [], djRequests: [], networking: [], livestream: [] });

export const LANGS = ["en", "ar", "fr", "es", "hy"];

export const defaultContent = {
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

export const defaultTimeline = [
  { id: uid(), icon: "church", time: "4:00 PM", label: { en: "Ceremony", ar: "حفل الزفاف", fr: "Cérémonie", es: "Ceremonia", hy: "Արարողություն" } },
  { id: uid(), icon: "wine", time: "5:30 PM", label: { en: "Welcome Drinks", ar: "مشروبات الترحيب", fr: "Cocktail de bienvenue", es: "Bienvenida", hy: "Ողջույնի խմիչքներ" } },
  { id: uid(), icon: "utensils", time: "7:00 PM", label: { en: "Dinner", ar: "العشاء", fr: "Dîner", es: "Cena", hy: "Ընթրիք" } },
  { id: uid(), icon: "party", time: "9:00 PM", label: { en: "Party", ar: "الحفلة", fr: "Soirée dansante", es: "Fiesta", hy: "Խնջույք" } },
];

export const defaultLocations = [
  { id: uid(), time: "4:00 PM", address: "St. Augustine Chapel, 12 Rose Ave", title: { en: "The Ceremony", ar: "مراسم الزفاف", fr: "La Cérémonie", es: "La Ceremonia", hy: "Արարողությունը" } },
  { id: uid(), time: "5:30 PM", address: "Willowbrook Estate, 88 Garden Rd", title: { en: "The Reception", ar: "حفل الاستقبال", fr: "La Réception", es: "La Recepción", hy: "Ընդունելությունը" } },
];

export const defaultRegistry = [
  { id: uid(), label: "Amazon Registry", url: "https://www.amazon.com/wedding/registry", note: "" },
  { id: uid(), label: "Honeymoon Fund", url: "", note: "IBAN: XX00 0000 0000 0000 0000 00" },
];

export const defaultPageBackgrounds = {
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

export const DEFAULT_LAYOUTS = {
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

export const freshInvitationData = () => ({
  content: defaultContent, timeline: defaultTimeline, locations: defaultLocations,
  pageBackgrounds: defaultPageBackgrounds, music: { enabled: true, url: null, name: "", icon: "speaker" },
  rsvpSchedule: { date: "2027-06-12", time: "16:00" }, registry: defaultRegistry,
  enabledSteps: Object.fromEntries(STEP_KEYS.map((k) => [k, true])), pageOrder: [...STEP_KEYS],
  defaultLang: "en", enabledLanguages: LANGS, layouts: DEFAULT_LAYOUTS, customBlocks: emptyCustomBlocks(),
  og: { image: null, title: "", description: "" }, guestGroups: [], tables: [],
  rsvpSettings: { style: "classic", namesRequired: true, maxGuestsOpenInvite: 5, maxTotalRsvps: 0, enableGuestVoiceRecorder: true, deadline: null },
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
  swipeDirection: "vertical", tornPhotoEdges: false, viewStyle: "cards",
});
