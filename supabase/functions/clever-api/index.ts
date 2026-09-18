// clever-api — the one shared Edge Function the frontend (src/App.jsx) posts
// to for two unrelated things, dispatched by request shape:
//
//   1. AI support chat — sendChatSupportMessage() posts { messages, context }
//      where context is "shop" (public, no account) or "builder" (a logged-in
//      client filling in their invitation). Calls OpenAI, returns
//      { reply: { role: "assistant", content: "..." }, formData?: {...} }.
//      formData is only ever populated for context "builder" — it's whatever
//      invitation fields the model could confidently pull out of the
//      conversation so far (see applyAiFormData in src/App.jsx for the exact
//      shape it reads: partner1_name, partner2_name, intro_text, event_date,
//      ceremony_time, ceremony_location_name, ceremony_location_address,
//      reception_time, reception_location_name, reception_location_address).
//
//   2. WhatsApp send — sendWhatsAppMessage() posts
//      { action: "send-whatsapp", to, templateName, languageCode, variables,
//      headerImageUrl }, expects { sent: true, messageId } back. Uses Meta's
//      WhatsApp Cloud API directly (needs its own token — see the env vars
//      below). If those aren't set, this action responds with a clear error
//      instead of pretending to send anything.
//
//   3. New-signup admin email — notifyAdminNewSignup() posts
//      { action: "notify-admin-signup", userName, userEmail, userPhone } the
//      moment someone creates an account that needs manual approval (see
//      signUpUser in src/App.jsx). Sends a plain notification email to
//      ADMIN_EMAIL via Resend so you know to go approve them in the
//      dashboard's Users tab, instead of only finding out next time you
//      happen to check it. Needs a free Resend account (resend.com) for the
//      RESEND_API_KEY — their test sender (the RESEND_FROM_EMAIL default)
//      works immediately with no domain setup, good enough to try this out.
//
// Deploy (self-hosted Supabase / supabase/docker):
//   1. Copy this whole `clever-api` folder into your self-hosted stack's
//      functions volume, e.g. `supabase/docker/volumes/functions/clever-api/`
//      (same folder structure the official supabase/docker repo expects —
//      one subfolder per function, each with its own index.ts).
//   2. Add OPENAI_API_KEY (required) — plus whichever of these you actually
//      want working: META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID (WhatsApp
//      sending), RESEND_API_KEY / ADMIN_EMAIL / RESEND_FROM_EMAIL (new-signup
//      admin email) — to whatever env file your `functions` (edge-runtime)
//      service reads. In the official supabase/docker compose, that's
//      `supabase/docker/volumes/functions/.env` (or the `environment:` block
//      of the `functions` service in your docker-compose.yml — check which
//      one your stack actually uses).
//   3. Restart just that service: `docker compose restart functions` (or the
//      exact service name in your compose file — sometimes called
//      `edge-runtime`). No need to rebuild/restart the whole stack.
//   4. The frontend already calls it at
//      `${SUPABASE_URL}/functions/v1/clever-api` — nothing to change there.
//   5. Verify: the anon key the frontend sends satisfies the gateway's
//      default JWT check, so you do NOT need `--no-verify-jwt`. If your
//      self-hosted Kong/gateway config strips or blocks the Authorization
//      header before it reaches this function, requests will 401 before
//      this code even runs — check that first if you still get errors after
//      deploying this.

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
const META_WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN");
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
// Resend's own shared test sender — works with no setup, but Resend can
// throttle/flag mail sent from it. Once you've verified your own domain in
// Resend, set RESEND_FROM_EMAIL to something like "notifications@yourdomain"
// for reliable delivery instead.
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

// Wide open (*) since this is called from a browser with only the public
// anon key, the same way every other Storage/REST call from src/App.jsx
// already is — there's no session cookie or user secret at risk here.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SHOP_SYSTEM_PROMPT = `You are the friendly AI support assistant for eInvite.me, a digital wedding/event invitation builder. Answer questions about designs, pricing, how the product works, and anything else a visitor asks — warmly and concisely. You don't have live access to this visitor's account or data; if asked something account-specific, say you can't see their account and suggest they check the dashboard or contact support.

Respond with ONLY a JSON object of this exact shape, no other text:
{"reply": "<your response to the visitor, plain text>"}`;

const BUILDER_SYSTEM_PROMPT = `You are helping someone fill in their wedding invitation by chatting naturally — ask friendly, conversational questions (not a rigid form) about their partner's name, the date, ceremony and reception details, etc., one or two things at a time rather than everything at once.

As you learn details, extract them into a structured formData object using EXACTLY these keys (omit any you don't know yet — never guess or invent a value):
- partner1_name, partner2_name (strings)
- intro_text (a short warm invitation line, e.g. "together with their families, joyfully invite you to celebrate their wedding")
- event_date (ISO format YYYY-MM-DD)
- ceremony_time (e.g. "4:00 PM"), ceremony_location_name, ceremony_location_address
- reception_time (e.g. "5:30 PM"), reception_location_name, reception_location_address

formData must be CUMULATIVE — always include every field you've confidently learned so far in this conversation, not just ones mentioned in the latest message, so nothing already provided gets lost between turns.

Respond with ONLY a JSON object of this exact shape, no other text:
{"reply": "<your conversational response>", "formData": {<only the keys above you're confident about>}}`;

async function handleChat(body: Record<string, unknown>) {
  if (!OPENAI_API_KEY) {
    return jsonResponse({ error: "OPENAI_API_KEY is not set for this function." }, 500);
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "messages array is required." }, 400);
  }
  const context = body.context === "builder" ? "builder" : "shop";
  const systemPrompt = context === "builder" ? BUILDER_SYSTEM_PROMPT : SHOP_SYSTEM_PROMPT;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        // messages already come in as [{ role: "assistant"|"user", content }, ...] —
        // OpenAI's chat completions format directly, so no reshaping needed.
        ...messages,
      ],
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text().catch(() => "");
    console.error("OpenAI request failed:", openaiRes.status, errText);
    return jsonResponse({ error: "The AI service didn't respond — please try again in a moment." }, 502);
  }

  const openaiData = await openaiRes.json();
  const rawContent = openaiData.choices?.[0]?.message?.content;
  if (!rawContent) {
    console.error("OpenAI response missing message content:", JSON.stringify(openaiData));
    return jsonResponse({ error: "The AI service returned an empty response." }, 502);
  }

  let parsed: { reply?: string; formData?: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    console.error("Couldn't parse OpenAI's JSON reply:", rawContent);
    return jsonResponse({ error: "The AI service returned an unexpected response." }, 502);
  }

  if (!parsed.reply) {
    return jsonResponse({ error: "The AI service returned an unexpected response." }, 502);
  }

  return jsonResponse({
    reply: { role: "assistant", content: parsed.reply },
    ...(context === "builder" && parsed.formData ? { formData: parsed.formData } : {}),
  });
}

async function handleWhatsApp(body: Record<string, unknown>) {
  if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
    return jsonResponse(
      { error: "WhatsApp sending isn't configured on this server (META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID not set)." },
      500,
    );
  }
  const { to, templateName, languageCode, variables, headerImageUrl } = body as {
    to?: string;
    templateName?: string;
    languageCode?: string;
    variables?: string[];
    headerImageUrl?: string;
  };
  if (!to || !templateName) {
    return jsonResponse({ error: "to and templateName are required." }, 400);
  }

  const components = [];
  if (headerImageUrl) {
    components.push({ type: "header", parameters: [{ type: "image", image: { link: headerImageUrl } }] });
  }
  if (variables && variables.length > 0) {
    components.push({ type: "body", parameters: variables.map((v) => ({ type: "text", text: v })) });
  }

  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode || "en" },
        components,
      },
    }),
  });

  const metaData = await metaRes.json();
  if (!metaRes.ok) {
    console.error("Meta WhatsApp API request failed:", metaRes.status, JSON.stringify(metaData));
    return jsonResponse({ error: metaData.error?.message || "Couldn't send the WhatsApp message." }, 502);
  }

  return jsonResponse({ sent: true, messageId: metaData.messages?.[0]?.id });
}

async function handleNotifyAdminSignup(body: Record<string, unknown>) {
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    return jsonResponse(
      { error: "Admin signup emails aren't configured on this server (RESEND_API_KEY / ADMIN_EMAIL not set)." },
      500,
    );
  }
  const { userName, userEmail, userPhone } = body as {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
  };
  if (!userEmail) {
    return jsonResponse({ error: "userEmail is required." }, 400);
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `New account awaiting approval — ${userName || userEmail}`,
      html: `
        <p>A new account just signed up and is waiting for approval.</p>
        <ul>
          <li><strong>Name:</strong> ${userName || "(not given)"}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Phone:</strong> ${userPhone || "(not given)"}</li>
        </ul>
        <p>Go to the Users tab in the dashboard to approve them.</p>
      `,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text().catch(() => "");
    console.error("Resend request failed:", resendRes.status, errText);
    return jsonResponse({ error: "The email service didn't accept the request." }, 502);
  }

  return jsonResponse({ sent: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Only POST is supported." }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  try {
    if (body.action === "send-whatsapp") return await handleWhatsApp(body);
    if (body.action === "notify-admin-signup") return await handleNotifyAdminSignup(body);
    return await handleChat(body);
  } catch (err) {
    console.error("clever-api unhandled error:", err);
    return jsonResponse({ error: "Something went wrong — please try again." }, 500);
  }
});
