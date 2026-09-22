// Looks up the real, hidden video (YouTube or Vimeo) for one invitation's
// paid live stream. Called by a guest's browser once they actually open
// the Live Stream page — this is the ONLY place that video ever reaches
// the browser; it's never part of the invitation's normal saved data, so
// it's absent from "View Page Source" and from the one big snapshot fetch
// every guest's browser makes on load.
//
// No payment check yet (see LivestreamSlide's own comment in src/App.jsx)
// — this step is only about keeping the link out of the page's static
// data. A real payment/auth check belongs right here, before the SELECT
// below, once that's built.
//
// An optional ownerKey lets the couple's OWN Builder (HiddenStreamVideoSetter)
// see the real, human-readable videoUrl again (e.g. after a refresh) —
// only when it matches the invitation's stored owner_key. Any other
// caller (a guest, or a wrong/missing key) never gets videoUrl back, only
// provider/videoId — just enough to build the embed, never the plain link.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { invitationSlug, ownerKey } = await req.json();
    if (!invitationSlug) {
      return jsonResponse({ error: "invitationSlug is required" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase
      .from("livestream_secrets")
      .select("provider, video_id, video_url, owner_key")
      .eq("invitation_slug", invitationSlug)
      .maybeSingle();

    if (error) {
      console.error("get-livestream-video failed:", error);
      return jsonResponse({ error: "Couldn't load." }, 500);
    }

    const isOwner = !!ownerKey && !!data?.owner_key && ownerKey === data.owner_key;
    return jsonResponse({
      provider: data?.provider || null,
      videoId: data?.video_id || null,
      videoUrl: isOwner ? data?.video_url || null : undefined,
    });
  } catch (err) {
    console.error("get-livestream-video threw:", err);
    return jsonResponse({ error: "Something went wrong." }, 500);
  }
});
