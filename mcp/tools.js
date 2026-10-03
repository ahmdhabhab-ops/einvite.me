// The eInvite.me ChatGPT plugin: an MCP server (Streamable HTTP, stateless)
// at <base>/mcp with four tools. Every call is made as the account the
// access token belongs to; an invitation is looked up only through that
// account's own record, so one account can never read or change another's.
//
// Out of scope for this first version: sending WhatsApp messages,
// publishing, deleting and payments. A draft is saved the same way the
// Builder saves one; publishing and payment stay in the eInvite.me app.

import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { freshInvitationData, LANGS } from "../shared/invitation-defaults.js";

export const PLUGIN_INFO = {
  name: "eInvite.me",
  description: "Create and edit digital wedding and event invitation drafts on eInvite.me, and check who has replied (RSVP).",
};

const LANG_NAMES = { en: "English", ar: "Arabic", fr: "French", es: "Spanish", hy: "Armenian" };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const uid = () => Math.random().toString(36).slice(2, 10);
const validDate = (d) => DATE_RE.test(d) && !Number.isNaN(new Date(`${d}T00:00:00Z`).getTime()) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

const locationSchema = z.object({
  title: z.string().min(1).max(120).describe('What happens there, e.g. "Ceremony" or "Reception".'),
  address: z.string().max(300).optional().describe("Venue name and/or address."),
  time: z.string().max(40).optional().describe('Start time as guests should read it, e.g. "4:00 PM" or "16:00".'),
});

// Who replied, from the invitation's guest list (same rules as the app's
// Dashboard): a family is coming once anyone in it said yes, declined once
// everyone said no, and waiting otherwise.
export function rsvpSummary(snapshot) {
  const groups = Array.isArray(snapshot?.guestGroups) ? snapshot.guestGroups : [];
  const out = {
    families: { total: groups.length, attending: 0, declined: 0, no_reply: 0 },
    people: { attending: 0, declined: 0, no_reply: 0 },
    attending_families: [], declined_families: [], no_reply_families: [],
  };
  for (const g of groups) {
    const ms = Array.isArray(g?.members) ? g.members : [];
    const yes = ms.filter((m) => m?.status === "yes").length;
    const no = ms.filter((m) => m?.status === "no").length;
    const waiting = ms.length - yes - no;
    const label = clean(g?.name || g?.lastName || ms.map((m) => m?.name).filter((n) => n && n !== "Guest").slice(0, 4).join(", ") || "Guest", 120);
    if (yes > 0) {
      const extra = Math.max(0, Number(g?.additionalGuests) || 0);
      out.families.attending++; out.people.attending += yes + extra;
      out.attending_families.push({ name: label, coming: yes + extra });
    } else if (ms.length && no === ms.length) {
      out.families.declined++;
      out.declined_families.push({ name: label });
    } else {
      out.families.no_reply++;
      out.no_reply_families.push({ name: label });
    }
    out.people.declined += no;
    out.people.no_reply += waiting;
  }
  return out;
}

function describe(user, snapshot, siteUrl) {
  const lang = snapshot?.defaultLang || "en";
  const cover = snapshot?.content?.[lang]?.cover || {};
  const names = [cover.name1, cover.name2].map((n) => clean(n, 80)).filter(Boolean);
  const s = rsvpSummary(snapshot);
  return {
    invitation_id: user.invitationSlug,
    title: names.join(" & ") || "Untitled invitation",
    event_date: snapshot?.rsvpSchedule?.date || null,
    event_time: snapshot?.rsvpSchedule?.time || null,
    main_language: lang,
    languages: Array.isArray(snapshot?.enabledLanguages) ? snapshot.enabledLanguages : [lang],
    locations: (Array.isArray(snapshot?.locations) ? snapshot.locations : []).map((l) => ({ title: clean(l?.title?.[lang] || Object.values(l?.title || {})[0] || "", 120), address: clean(l?.address, 300), time: clean(l?.time, 40) })),
    status: user.packageTier ? "published" : "draft",
    preview_url: `${siteUrl}/e/${encodeURIComponent(user.invitationSlug)}`,
    edit_in_app_url: `${siteUrl}/`,
    families_invited: s.families.total,
  };
}

export function createMcpHandler({ siteUrl, verifyAccessToken, wwwAuthenticate, findUser, userAllowed, readUsersDraft, writeUsersDraft, kvRead, kvWrite, uniqueSlug }) {
  const invitationKey = (userId) => `einvite:invitation-${userId}`;

  // The signed-in account, re-read on every call so a frozen or removed
  // account stops working at once.
  async function account(extra) {
    const userId = extra?.authInfo?.extra?.userId;
    const user = userId ? await findUser(userId) : null;
    if (!user || userAllowed(user) !== true) throw new ToolError("This eInvite.me account can't be used right now. Sign in again from ChatGPT's plugin settings.");
    return user;
  }
  const needScope = (extra, scope) => {
    if (!(extra?.authInfo?.scopes || []).includes(scope)) throw new ToolError(`This connection wasn't given permission (${scope}). Reconnect the plugin and allow it.`);
  };
  async function ownInvitation(user, invitationId) {
    // Only ever the caller's own record decides which invitation is theirs;
    // any other id is answered exactly like one that doesn't exist.
    if (!user.invitationSlug || (invitationId && invitationId !== user.invitationSlug)) throw new ToolError("No invitation with that id in your account. Use list_invitations to see yours.");
    const raw = await kvRead(invitationKey(user.id));
    if (!raw) throw new ToolError("Your invitation hasn't been saved yet. Open it once in the eInvite.me app.");
    return JSON.parse(raw);
  }

  const ok = (text, structuredContent) => ({ content: [{ type: "text", text }], structuredContent });
  const wrap = (fn) => async (args, extra) => {
    try { return await fn(args, extra); } catch (e) {
      if (!(e instanceof ToolError)) console.error("mcp tool failed:", e.message);
      return { isError: true, content: [{ type: "text", text: e instanceof ToolError ? e.message : "Something went wrong on eInvite.me. Please try again." }] };
    }
  };
  const securityMeta = (scopes) => ({ securitySchemes: [{ type: "oauth2", scopes }] });

  function buildServer() {
    const server = new McpServer({ name: "einvite-me", title: PLUGIN_INFO.name, version: "1.0.0" }, { instructions: `${PLUGIN_INFO.description} Invitations are drafts until the couple publishes and pays in the eInvite.me app; these tools never publish, pay, delete or send messages.` });

    server.registerTool("list_invitations", {
      title: "List my invitations",
      description: "Lists the invitations in the signed-in eInvite.me account, with their id, couple names, date, languages, status (draft or published) and preview link.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: securityMeta(["invitations:read"]),
    }, wrap(async (_args, extra) => {
      needScope(extra, "invitations:read");
      const user = await account(extra);
      const raw = user.invitationSlug ? await kvRead(invitationKey(user.id)) : null;
      const invitations = raw ? [describe(user, JSON.parse(raw), siteUrl)] : [];
      return ok(invitations.length ? `You have ${invitations.length} invitation: ${invitations.map((i) => `${i.title} (${i.status}) ${i.preview_url}`).join("; ")}` : "You don't have an invitation yet. I can create a draft for you.", { invitations });
    }));

    server.registerTool("create_invitation_draft", {
      title: "Create an invitation draft",
      description: "Creates a new invitation as a DRAFT in the signed-in account from the couple's names, the date, the places and the language, and returns its preview link. It doesn't publish, pay or send anything. An account has one invitation; if it already has one, use update_invitation_draft instead.",
      inputSchema: {
        partner1_name: z.string().min(1).max(80).describe("First name shown on the cover, e.g. the bride."),
        partner2_name: z.string().max(80).optional().describe("Second name, e.g. the groom. Leave out for a single-name event."),
        event_date: z.string().describe("Event date as YYYY-MM-DD."),
        event_time: z.string().optional().describe("Start time as HH:MM (24h). Used by the countdown."),
        language: z.enum(LANGS).default("en").describe("Language of the invitation: en (English), ar (Arabic), fr (French), es (Spanish) or hy (Armenian)."),
        locations: z.array(locationSchema).min(1).max(6).describe("The places of the event, in order."),
        intro_text: z.string().max(300).optional().describe("Optional sentence under the names, e.g. \"invite you to celebrate their wedding\"."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: securityMeta(["invitations:write"]),
    }, wrap(async (args, extra) => {
      needScope(extra, "invitations:write");
      const user = await account(extra);
      if (!validDate(args.event_date)) throw new ToolError("event_date must be a real date written as YYYY-MM-DD.");
      if (args.event_time && !TIME_RE.test(args.event_time)) throw new ToolError("event_time must be HH:MM (24h), e.g. 18:30.");
      // A saved invitation without a link can only be this plugin's own
      // half-finished earlier try, which may be redone.
      const existingRaw = await kvRead(invitationKey(user.id));
      const leftover = existingRaw && !user.invitationSlug && JSON.parse(existingRaw)?.createdVia === "chatgpt-plugin";
      if (user.invitationSlug || (existingRaw && !leftover)) throw new ToolError("This account already has an invitation. Use update_invitation_draft to change it (list_invitations shows its id).");

      const lang = args.language || "en";
      const name1 = clean(args.partner1_name, 80), name2 = clean(args.partner2_name, 80);
      const snap = structuredClone(freshInvitationData());
      for (const l of LANGS) {
        snap.content[l].cover = { ...snap.content[l].cover, name1, name2 };
        // The template's sample family names and gift list aren't the couple's.
        snap.content[l].family = { ...snap.content[l].family, side1Names: "", side2Names: "" };
      }
      if (args.intro_text) snap.content[lang].cover.intro = clean(args.intro_text, 300);
      snap.defaultLang = lang;
      snap.enabledLanguages = [lang];
      snap.rsvpSchedule = { date: args.event_date, time: args.event_time || snap.rsvpSchedule.time };
      snap.locations = args.locations.map((l) => ({ id: uid(), time: clean(l.time, 40), address: clean(l.address, 300), title: Object.fromEntries(LANGS.map((x) => [x, clean(l.title, 120)])) }));
      snap.registry = [];
      // Pages that need details the couple hasn't given yet start hidden;
      // they can switch them on in the Builder.
      for (const k of ["family", "timeline", "registry", "djRequests", "networking", "livestream"]) snap.enabledSteps[k] = false;
      snap.og = { ...snap.og, title: [name1, name2].filter(Boolean).join(" & ") };
      snap.createdVia = "chatgpt-plugin";

      // Same link rules as the app (unique, never the admin preview slug).
      const draft = await readUsersDraft();
      const slug = uniqueSlug(draft.users, [name1, name2].filter(Boolean).join("-") || user.name, user.id);
      await kvWrite(invitationKey(user.id), JSON.stringify(snap));
      const fresh = await readUsersDraft();
      const mine = fresh.users.find((u) => u?.id === user.id);
      if (!mine) throw new ToolError("Your account couldn't be found.");
      if (mine.invitationSlug) throw new ToolError("This account already has an invitation. Use update_invitation_draft to change it.");
      // Recheck the link against the latest list right before saving it.
      const finalSlug = fresh.users.some((u) => u?.id !== user.id && u?.invitationSlug === slug) ? uniqueSlug(fresh.users, slug, user.id) : slug;
      await writeUsersDraft({
        ...fresh.draft,
        users: fresh.users.map((u) => (u?.id === user.id ? { ...u, invitationSlug: finalSlug } : u)),
        invitationIds: [...new Set([...(fresh.draft.invitationIds || []), user.id])],
      });
      const info = describe({ ...user, invitationSlug: finalSlug }, snap, siteUrl);
      return ok(`Draft created: ${info.title}, ${info.event_date}. Preview: ${info.preview_url}. It is a draft: sign in at ${info.edit_in_app_url} to choose a design, add guests and publish.`, { invitation: info });
    }));

    server.registerTool("update_invitation_draft", {
      title: "Update an invitation draft",
      description: "Changes details of a DRAFT invitation in the signed-in account: names, date, time, places or intro sentence. Only the fields you pass change; passing locations replaces the whole list of places. Published invitations can't be changed here.",
      inputSchema: {
        invitation_id: z.string().min(1).max(100).describe("The invitation_id from list_invitations."),
        language: z.enum(LANGS).optional().describe("Which language's text to change. Defaults to the invitation's main language."),
        partner1_name: z.string().min(1).max(80).optional(),
        partner2_name: z.string().max(80).optional().describe("Pass an empty string to remove the second name."),
        event_date: z.string().optional().describe("YYYY-MM-DD"),
        event_time: z.string().optional().describe("HH:MM (24h)"),
        locations: z.array(locationSchema).min(1).max(6).optional().describe("Replaces the whole list of places."),
        intro_text: z.string().max(300).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false, idempotentHint: true },
      _meta: securityMeta(["invitations:write"]),
    }, wrap(async (args, extra) => {
      needScope(extra, "invitations:write");
      const user = await account(extra);
      await ownInvitation(user, args.invitation_id);
      if (user.packageTier) throw new ToolError("This invitation is published, so it can only be changed in the eInvite.me app.");
      if (args.event_date !== undefined && !validDate(args.event_date)) throw new ToolError("event_date must be a real date written as YYYY-MM-DD.");
      if (args.event_time !== undefined && !TIME_RE.test(args.event_time)) throw new ToolError("event_time must be HH:MM (24h), e.g. 18:30.");
      const fields = ["partner1_name", "partner2_name", "event_date", "event_time", "locations", "intro_text"].filter((k) => args[k] !== undefined);
      if (!fields.length) throw new ToolError("Nothing to change: pass at least one field.");

      // Re-read right before saving so guest replies that just arrived
      // aren't lost; only the fields asked for change.
      const snap = JSON.parse(await kvRead(invitationKey(user.id)));
      const lang = args.language || snap.defaultLang || "en";
      const enabled = Array.isArray(snap.enabledLanguages) ? snap.enabledLanguages : [snap.defaultLang || "en"];
      if (!enabled.includes(lang)) throw new ToolError(`This invitation isn't in ${LANG_NAMES[lang]}. Its languages: ${enabled.map((l) => LANG_NAMES[l] || l).join(", ")}.`);
      snap.content = snap.content || {};
      snap.content[lang] = snap.content[lang] || {};
      const cover = { ...(snap.content[lang].cover || {}) };
      if (args.partner1_name !== undefined) cover.name1 = clean(args.partner1_name, 80);
      if (args.partner2_name !== undefined) cover.name2 = clean(args.partner2_name, 80);
      if (args.intro_text !== undefined) cover.intro = clean(args.intro_text, 300);
      snap.content[lang].cover = cover;
      if (args.event_date !== undefined || args.event_time !== undefined) {
        snap.rsvpSchedule = { ...(snap.rsvpSchedule || {}), ...(args.event_date !== undefined ? { date: args.event_date } : {}), ...(args.event_time !== undefined ? { time: args.event_time } : {}) };
      }
      if (args.locations) {
        const old = Array.isArray(snap.locations) ? snap.locations : [];
        snap.locations = args.locations.map((l, i) => {
          const title = { ...(old[i]?.title || {}) };
          for (const x of LANGS) if (!title[x]) title[x] = clean(l.title, 120);
          title[lang] = clean(l.title, 120);
          return { ...(old[i] || {}), id: old[i]?.id || uid(), time: clean(l.time, 40), address: clean(l.address, 300), title };
        });
      }
      if ((args.partner1_name !== undefined || args.partner2_name !== undefined) && lang === (snap.defaultLang || "en")) {
        snap.og = { ...(snap.og || {}), title: [cover.name1, cover.name2].filter(Boolean).join(" & ") };
      }
      const latest = JSON.parse((await kvRead(invitationKey(user.id))) || "{}");
      snap.guestGroups = latest.guestGroups ?? snap.guestGroups;
      await kvWrite(invitationKey(user.id), JSON.stringify(snap));
      const info = describe(user, snap, siteUrl);
      return ok(`Updated ${fields.join(", ")}. Preview: ${info.preview_url}`, { invitation: info, changed: fields });
    }));

    server.registerTool("get_rsvp_summary", {
      title: "RSVP summary",
      description: "Shows who has replied to an invitation in the signed-in account: how many families and people are coming, declined, or haven't replied, with the family names in each group (no phone numbers).",
      inputSchema: {
        invitation_id: z.string().max(100).optional().describe("The invitation_id from list_invitations. Defaults to your invitation."),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: securityMeta(["invitations:read"]),
    }, wrap(async (args, extra) => {
      needScope(extra, "invitations:read");
      const user = await account(extra);
      const snap = await ownInvitation(user, args.invitation_id);
      const s = rsvpSummary(snap);
      const cap = (list) => list.slice(0, 200);
      const summary = { invitation_id: user.invitationSlug, ...s, attending_families: cap(s.attending_families), declined_families: cap(s.declined_families), no_reply_families: cap(s.no_reply_families) };
      return ok(`${s.people.attending} people coming (${s.families.attending} families), ${s.people.declined} declined, ${s.people.no_reply} haven't replied (${s.families.no_reply} families). ${s.families.total} families invited.`, summary);
    }));

    return server;
  }

  // --- HTTP -------------------------------------------------------------
  const router = express.Router();
  router.use("/mcp", (req, res, next) => {
    res.set({ "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id", "access-control-expose-headers": "www-authenticate, mcp-session-id", "access-control-allow-methods": "GET, POST, DELETE, OPTIONS" });
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });
  // No token, a bad one or an expired one: 401 with where to sign in.
  const auth = async (req, res, next) => {
    const m = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization || ""));
    const info = m ? verifyAccessToken(m[1]) : null;
    if (!info) {
      res.set("www-authenticate", wwwAuthenticate(m ? "invalid_token" : undefined));
      return res.status(401).json({ error: m ? "invalid_token" : "unauthorized", error_description: "Sign in to eInvite.me." });
    }
    req.auth = { token: m[1], clientId: info.clientId, scopes: info.scopes, expiresAt: info.expiresAt, extra: { userId: info.userId } };
    next();
  };
  router.post("/mcp", auth, express.json({ limit: "1mb" }), async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error("mcp request failed:", e.message);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  });
  // Stateless server: no server-sent stream and no sessions to end.
  router.get("/mcp", auth, (_req, res) => res.status(405).set("allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
  router.delete("/mcp", auth, (_req, res) => res.status(405).set("allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
  return router;
}

class ToolError extends Error {}
