import { randomUUID } from "node:crypto";
import { getDb } from "../server/db.js";
import { errorJson, json, requireSession, sameOrigin } from "../server/http.js";

const MAX_BYTES = 3 * 1024 * 1024;

function imageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  const session = requireSession(request, "team");
  if (!session) return errorJson("Sign in to upload payment proof.", 401);
  let form: FormData;
  try { form = await request.formData(); } catch { return errorJson("Choose a screenshot to upload.", 400); }
  const file = form.get("proof");
  if (!(file instanceof File)) return errorJson("Choose a screenshot to upload.", 400);
  if (file.size < 1 || file.size > MAX_BYTES) return errorJson("The screenshot must be up to 3 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = imageType(bytes);
  if (!mime) return errorJson("Upload a PNG, JPEG, or WebP screenshot.", 415);

  try {
    const sql = getDb();
    const id = randomUUID();
    const [proof] = await sql`
      WITH eligible AS (
        UPDATE bh_teams
        SET payment_status = 'pending', updated_at = NOW()
        WHERE id = ${session.sub} AND stage = 'shortlisted'
          AND payment_status NOT IN ('confirmed', 'pending')
        RETURNING id
      ), saved AS (
        INSERT INTO bh_payment_proofs (id, team_id, image_bytes, mime_type, original_name)
        SELECT ${id}, eligible.id, ${bytes}, ${mime}, ${file.name.slice(0, 200) || "payment-proof"}
        FROM eligible
        RETURNING id, uploaded_at AS "uploadedAt"
      )
      SELECT id, "uploadedAt" FROM saved
    `;
    if (!proof) return errorJson("A payment screenshot is already pending or this seat is confirmed.", 409);
    return json({
      ok: true,
      status: "pending",
      proof: { id: proof.id, status: "pending", uploadedAt: proof.uploadedAt, note: null },
    }, 201);
  } catch {
    return errorJson("Upload failed. Please try again.", 503);
  }
}
