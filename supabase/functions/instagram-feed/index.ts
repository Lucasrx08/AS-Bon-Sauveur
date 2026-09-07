import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const userId = Deno.env.get("INSTAGRAM_USER_ID");
    const token = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    if (!userId || !token) throw new Error("Instagram non configuré");
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=12&access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || "Erreur Instagram");
    return new Response(JSON.stringify(data), { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
