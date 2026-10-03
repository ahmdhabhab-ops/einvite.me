// "Edit text in image" in the invitation Builder: the server side.
//
// The Builder sends a small piece of the image (the box the couple drew
// around some English text) and gets back:
//   POST /api/image-text/ocr    the text in that box, read by OpenAI's
//                               vision model (OPENAI_API_KEY, already used
//                               for translations and guest-list photos),
//                               plus hints for its color, weight and
//                               alignment.
//   POST /api/image-text/erase  the same piece with the text removed by
//                               Stability AI's Erase (STABILITY_API_KEY).
//                               This one is paid per image and stays off
//                               until IMAGE_TEXT_AI_ERASE=1.
//   GET  /api/image-text/config what's switched on, for the Builder.
//
// Removing the text for free (filling it in from the colors around it)
// happens in the browser and never reaches this server. Either way, the
// Builder only ever replaces the pixels inside the box.
//
// IMAGE_TEXT_EDIT_ENABLED: "1" = every signed-in client, "admin" = only the
// admin (for trying it on the live site first), anything else = off. The
// keys are only read here and are never sent to the browser or logged.

import express from "express";

const USAGE_KEY = "einvite:image-text-usage";
const MAX_PIECE_CHARS = 6_000_000; // base64 data URI of the piece, ~4.5 MB
const OCR_PER_HOUR = 60;
const ERASE_PER_HOUR = 20;
const ERASE_PER_DAY = 40;
// Stability AI's price for one Erase, in US dollars (5 credits at $0.01).
// Only used for the admin's running total; the real bill is on Stability.
const ERASE_COST_USD = Number(process.env.STABILITY_ERASE_COST_USD) || 0.05;
const OCR_COST_USD = 0.001;
const stabilityEraseUrl = () => `${process.env.STABILITY_BASE_URL || "https://api.stability.ai"}/v2beta/stable-image/edit/erase`;

const DATA_URI = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

export function imageTextMode() {
  const v = String(process.env.IMAGE_TEXT_EDIT_ENABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" ? "all" : v === "admin" ? "admin" : "off";
}
const aiEraseOn = () => process.env.IMAGE_TEXT_AI_ERASE === "1" && !!process.env.STABILITY_API_KEY;

// requestRole(req) -> { role: "admin" | "client" | "anon", userId? }
export function createImageTextRoutes({ requestRole, kvRead, kvWrite, fetchImpl = fetch, now = () => Date.now() }) {
  const router = express.Router();
  const hits = new Map(); // `${kind}:${who}` -> [timestamps]

  const who = (req) => requestRole(req);
  const allowed = (role) => {
    const mode = imageTextMode();
    if (mode === "off") return false;
    if (role.role === "admin") return true;
    return mode === "all" && role.role === "client";
  };
  const gate = (req, res, next) => {
    const role = who(req);
    if (role.role === "anon") return res.status(401).json({ error: "Please log in to use this." });
    if (!allowed(role)) return res.status(404).json({ error: "This isn't switched on." });
    req.imageTextRole = role;
    next();
  };
  // At most `perHour` (and `perDay`) uses in a rolling window for a client.
  // The admin isn't limited.
  const limit = (kind, perHour, perDay) => (req, res, next) => {
    const role = req.imageTextRole;
    if (role.role === "admin") return next();
    const key = `${kind}:${role.userId}`;
    const t = now();
    const list = (hits.get(key) || []).filter((at) => t - at < 86_400_000);
    const lastHour = list.filter((at) => t - at < 3_600_000).length;
    if (lastHour >= perHour || (perDay && list.length >= perDay)) {
      hits.set(key, list);
      return res.status(429).json({ error: "You've used this a lot today — please try again a bit later." });
    }
    list.push(t);
    hits.set(key, list);
    next();
  };

  // Running count and estimated cost per month, for the admin. Best effort:
  // a failure here never fails the request. One write at a time, so two
  // requests finishing together don't lose a count.
  let usageChain = Promise.resolve();
  const recordUsage = (kind, role) => { usageChain = usageChain.then(() => writeUsage(kind, role)); };
  const writeUsage = async (kind, role) => {
    try {
      const month = new Date(now()).toISOString().slice(0, 7);
      const raw = await kvRead(USAGE_KEY);
      const usage = raw ? JSON.parse(raw) : {};
      const m = usage[month] || { ocr: 0, erase: 0, costUsd: 0, byUser: {} };
      m[kind] = (m[kind] || 0) + 1;
      m.costUsd = Math.round(((m.costUsd || 0) + (kind === "erase" ? ERASE_COST_USD : OCR_COST_USD)) * 1000) / 1000;
      const u = role.role === "admin" ? "admin" : role.userId;
      m.byUser[u] = { ...(m.byUser[u] || {}), [kind]: (m.byUser[u]?.[kind] || 0) + 1 };
      usage[month] = m;
      // Keep the last 12 months only.
      const months = Object.keys(usage).sort().slice(-12);
      await kvWrite(USAGE_KEY, JSON.stringify(Object.fromEntries(months.map((k) => [k, usage[k]]))));
    } catch (err) {
      console.error("image-text usage not recorded:", err.message);
    }
  };

  router.get("/config", async (req, res) => {
    const role = who(req);
    if (!allowed(role)) return res.json({ enabled: false });
    const out = { enabled: true, ocr: !!process.env.OPENAI_API_KEY, aiErase: aiEraseOn(), aiEraseCostUsd: ERASE_COST_USD };
    if (role.role === "admin") {
      out.mode = imageTextMode();
      out.stabilityKeySet = !!process.env.STABILITY_API_KEY;
      try {
        const raw = await kvRead(USAGE_KEY);
        out.usage = raw ? JSON.parse(raw) : {};
      } catch {
        out.usage = null;
      }
    }
    res.json(out);
  });

  router.post("/ocr", gate, limit("ocr", OCR_PER_HOUR), express.json({ limit: "8mb" }), async (req, res) => {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Reading text isn't switched on yet: OPENAI_API_KEY needs to be set on the app in Dokploy." });
    const image = String(req.body?.image || "");
    if (!DATA_URI.test(image) || image.length > MAX_PIECE_CHARS) return res.status(400).json({ error: "Please select a part of a JPG or PNG image." });
    try {
      const r = await fetchImpl(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You read the text printed in a cropped part of an invitation design (wedding, birthday, event). " +
                "Return the English text exactly as it appears: same spelling, same capital letters, same punctuation, one line of the design per line (join lines with \\n). " +
                "Do not translate, correct or add anything. Ignore decorations, logos and anything that isn't text. " +
                "If there is no text, or the text isn't English (Latin letters), return an empty text and set notEnglish to true when it's another script. " +
                "Also describe how the text looks: color = the main text color as a #rrggbb hex; weight = \"normal\" or \"bold\"; italic = true/false; " +
                "align = \"left\", \"center\" or \"right\" (how the lines line up with each other; \"center\" for a single line); " +
                "style = one of \"serif\", \"sans\", \"script\" (handwriting/calligraphy), \"display\" (decorative). " +
                "Reply with only JSON: {\"text\": \"\", \"notEnglish\": false, \"color\": \"#000000\", \"weight\": \"normal\", \"italic\": false, \"align\": \"center\", \"style\": \"serif\"}.",
            },
            { role: "user", content: [{ type: "text", text: "Here is the part of the design." }, { type: "image_url", image_url: { url: image, detail: "high" } }] },
          ],
        }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}`);
      const data = await r.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      recordUsage("ocr", req.imageTextRole);
      const text = String(parsed.text ?? "")
        .replace(/\r/g, "")
        .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n")
        .slice(0, 1000);
      const color = /^#[0-9a-f]{6}$/i.test(parsed.color || "") ? parsed.color.toLowerCase() : null;
      res.json({
        text,
        notEnglish: !!parsed.notEnglish && !text,
        color,
        weight: parsed.weight === "bold" ? "bold" : "normal",
        italic: parsed.italic === true,
        align: ["left", "center", "right"].includes(parsed.align) ? parsed.align : "center",
        style: ["serif", "sans", "script", "display"].includes(parsed.style) ? parsed.style : "serif",
      });
    } catch (err) {
      console.error("image text: reading failed:", err.message);
      res.status(502).json({ error: "Couldn't read the text — please try again, or type it in yourself." });
    }
  });

  router.post("/erase", gate, (req, res, next) => {
    if (!aiEraseOn()) return res.status(503).json({ error: "AI erase isn't switched on. Use the free \"Quick fill\" instead." });
    next();
  }, limit("erase", ERASE_PER_HOUR, ERASE_PER_DAY), express.json({ limit: "16mb" }), async (req, res) => {
    const image = DATA_URI.exec(String(req.body?.image || ""));
    const mask = DATA_URI.exec(String(req.body?.mask || ""));
    if (!image || !mask || req.body.image.length > MAX_PIECE_CHARS || req.body.mask.length > MAX_PIECE_CHARS) {
      return res.status(400).json({ error: "Please select a part of a JPG or PNG image." });
    }
    try {
      const form = new FormData();
      form.append("image", new Blob([Buffer.from(image[2], "base64")], { type: `image/${image[1]}` }), `piece.${image[1] === "jpeg" ? "jpg" : image[1]}`);
      form.append("mask", new Blob([Buffer.from(mask[2], "base64")], { type: `image/${mask[1]}` }), `mask.${mask[1] === "jpeg" ? "jpg" : mask[1]}`);
      form.append("output_format", "png");
      // The Builder already widens the mask a little around the letters.
      form.append("grow_mask", "3");
      const r = await fetchImpl(stabilityEraseUrl(), {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, Accept: "application/json" },
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const why = Array.isArray(data?.errors) ? data.errors.join("; ") : data?.name || "";
        throw new Error(`Stability ${r.status} ${String(why).slice(0, 160)}`);
      }
      if (data.finish_reason === "CONTENT_FILTERED") return res.status(422).json({ error: "The AI service refused this image. Use \"Quick fill\" instead." });
      if (typeof data.image !== "string" || !data.image) throw new Error("Stability returned no image");
      recordUsage("erase", req.imageTextRole);
      res.json({ image: `data:image/png;base64,${data.image}` });
    } catch (err) {
      console.error("image text: AI erase failed:", err.message);
      res.status(502).json({ error: "The AI erase didn't work this time — please try again, or use \"Quick fill\"." });
    }
  });

  return router;
}
