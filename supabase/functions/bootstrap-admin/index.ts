import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigin = "https://lucasrx08.github.io";
Deno.serve((req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string,string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  };
  if (origin === allowedOrigin) headers["Access-Control-Allow-Origin"] = origin;
  if (req.method === "OPTIONS") {
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type";
    return new Response(null, { status: origin === allowedOrigin ? 204 : 403, headers });
  }
  return new Response(JSON.stringify({ error: "Fonction désactivée en V22" }), { status: 410, headers });
});
