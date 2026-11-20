import { getDb } from "../server/db.js";
import { deliverQueuedConfirmation } from "../server/confirmation-email.mjs";
import type { ConfirmationEmailRecord } from "../server/confirmation-email.mjs";
import { errorJson, json, requireSession, sameOrigin } from "../server/http.js";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const body = await request.json().catch(() => null) as { proofId?: unknown } | null;
  const proofId = typeof body?.proofId === "string" ? body.proofId : "";
  if (!/^[0-9a-f-]{36}$/i.test(proofId)) return errorJson("Choose a confirmed team's payment record.", 400);
  try {
    const sql = getDb();
    const [record] = await sql`
      SELECT p.id AS "proofId", t.id AS "teamId", t.team_name AS "teamName",
             t.leader_name AS "leaderName", t.team_members AS members,
             t.leader_email_ciphertext AS "leaderEmailCiphertext", ce.status AS "emailStatus"
      FROM bh_confirmation_emails ce
      JOIN bh_payment_proofs p ON p.id = ce.proof_id AND p.review_status = 'confirmed'
      JOIN bh_teams t ON t.id = ce.team_id AND t.stage = 'confirmed' AND t.payment_status = 'confirmed'
      WHERE ce.proof_id = ${proofId}
    `;
    if (!record) return errorJson("No confirmed seat email is waiting to be sent.", 404);
    if (record.emailStatus === "sent") return json({ ok: true, emailStatus: "sent" });
    if (record.emailStatus === "sending") return errorJson("This confirmation email is already being sent.", 409);
    const delivery = await deliverQueuedConfirmation(sql, record as ConfirmationEmailRecord);
    return json({ ok: delivery.status === "sent", emailStatus: delivery.status });
  } catch {
    return errorJson("The confirmation email could not be sent. Try again.", 503);
  }
}
