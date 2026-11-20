import { clearSessionCookie, json, sameOrigin } from "../server/http.js";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
