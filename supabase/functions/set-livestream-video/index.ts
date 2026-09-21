// Saves the real, hidden video (YouTube or Vimeo) for one invitation's paid
// live stream. Never called by a guest — only from the couple's own
// Builder settings (HiddenStreamVideoSetter in src/App.jsx).
//
// Auth model: no shared password across every client's invitation. The
// FIRST save for a given invitationSlug mints a fresh random ownerKey and
// hands it back to the caller, who remembers it locally from then on (see
// setLivestreamVideo in App.jsx). Every save after that must present the
// matching ownerKey or it's rejected. This is intentionally simple — it
// doesn't hook into any real user-auth system, since this app doesn't have
// one for the couple's own login. It's a per-invitation secret, not a
// shared one, which was the actual problem with the previous approach.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

function parseVideoUrl(raw: string): { provider: string; videoId: string } | null {
  try {
    const u = new URL(raw.trim());
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      let videoId: string | null = null;
      if (u.hostname === "youtu.be") videoId = u.pathname.slice(1);
      else if (u.pathname.startsWith("/watch")) videoId = u.searchParams.get("v");
      else if (u.pathname.startsWith("/live/")) videoId = u.pathname.split("/live/")[1];
      else if (u.pathname.startsWith("/embed/")) videoId = u.pathname.split("/embed/")[1];
      videoId = videoId ? videoId.split("?")[0].split("&")[0] : null;
      return videoId ? { provider: "youtube", videoId } : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const match = u.pathname.match(/\/(\d+)/);
      return match ? { provider: "vimeo", videoId: match[1] } : null;
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { invitationSlug, videoUrl, ownerKey } = await req.json();
    if (!invitationSlug || !videoUrl) {
      return jsonResponse({ error: "invitationSlug and videoUrl are required" }, 400);
    }

    const parsed = parseVideoUrl(videoUrl);
    if (!parsed) {
      return jsonResponse({ error: "Couldn't recognize that as a YouTube or Vimeo link" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: existing, error: lookupError } = await supabase
      .from("livestream_secrets")
      .select("owner_key")
      .eq("invitation_slug", invitationSlug)
      .maybeSingle();

    if (lookupError) {
      console.error("set-livestream-video lookup failed:", lookupError);
      return jsonResponse({ error: "Couldn't save — please try again." }, 500);
    }

    let keyToUse = ownerKey as string | undefined;
    if (existing) {
      if (!ownerKey || ownerKey !== existing.owner_key) {
        return jsonResponse({ error: "Not authorized" }, 401);
      }
    } else {
      // First time for this invitation — mint a new key.
      keyToUse = crypto.randomUUID();
    }

    const { error: upsertError } = await supabase.from("livestream_secrets").upsert({
      invitation_slug: invitationSlug,
      provider: parsed.provider,
      video_id: parsed.videoId,
      owner_key: keyToUse,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("set-livestream-video upsert failed:", upsertError);
      return jsonResponse({ error: "Couldn't save — please try again." }, 500);
    }

    return jsonResponse({ ok: true, ownerKey: keyToUse });
  } catch (err) {
    console.error("set-livestream-video threw:", err);
    return jsonResponse({ error: "Something went wrong." }, 500);
  }
});
