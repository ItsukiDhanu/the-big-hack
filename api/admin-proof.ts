import { getDb } from "../server/db.js";
import { errorJson, requireSession } from "../server/http.js";

export async function GET(request: Request) {
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return errorJson("Payment proof not found.", 404);
  try {
    const sql = getDb();
    const [proof] = await sql`SELECT image_bytes, mime_type FROM bh_payment_proofs WHERE id = ${id} LIMIT 1`;
    if (!proof) return errorJson("Payment proof not found.", 404);
    const imageBytes = proof.image_bytes as Uint8Array;
    const imageBuffer = new ArrayBuffer(imageBytes.byteLength);
    new Uint8Array(imageBuffer).set(imageBytes);
    return new Response(imageBuffer, {
      headers: {
        "content-type": proof.mime_type,
        "content-disposition": "inline",
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
        "x-frame-options": "SAMEORIGIN",
      },
    });
  } catch {
    return errorJson("Payment proof is temporarily unavailable.", 503);
  }
}
