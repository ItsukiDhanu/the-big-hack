import { randomUUID } from "node:crypto";
import { getDb } from "../server/db.js";
import { errorJson, json, requireSession, sameOrigin } from "../server/http.js";
import { deliverQueuedConfirmation } from "../server/confirmation-email.mjs";
import type { ConfirmationEmailRecord } from "../server/confirmation-email.mjs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const body = await request.json().catch(() => null) as { teamId?: unknown; proofId?: unknown; decision?: unknown; note?: unknown } | null;
  const teamId = typeof body?.teamId === "string" ? body.teamId : "";
  const proofId = typeof body?.proofId === "string" ? body.proofId : "";
  const decision = body?.decision;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
  if (!teamId || !/^[0-9a-f-]{36}$/i.test(proofId) || (decision !== "confirmed" && decision !== "rejected")) {
    return errorJson("Choose a pending screenshot and a review result.", 400);
  }
  try {
    const sql = getDb();
    const action = decision === "confirmed" ? "confirm_payment" : "reject_payment";
    const [result] = await sql`
      WITH reviewed AS (
        UPDATE bh_payment_proofs
        SET review_status = ${decision}, review_note = ${note || null}, reviewed_at = NOW()
        WHERE id = ${proofId} AND team_id = ${teamId} AND review_status = 'pending'
        RETURNING team_id, id
      ), changed AS (
        UPDATE bh_teams AS t
        SET stage = CASE WHEN ${decision} = 'confirmed' THEN 'confirmed' ELSE 'shortlisted' END,
            payment_status = ${decision}, updated_at = NOW()
        FROM reviewed r WHERE t.id = r.team_id
          AND t.stage = 'shortlisted'
        RETURNING t.id, t.team_name, t.leader_name, t.team_members AS members,
                  t.leader_email_ciphertext AS "leaderEmailCiphertext"
      ), audited AS (
        INSERT INTO bh_admin_audit_log (id, team_id, proof_id, action, note)
        SELECT ${randomUUID()}, ${teamId}, ${proofId}, ${action}, ${note || null}
        WHERE EXISTS (SELECT 1 FROM changed)
        RETURNING id
      ), queued AS (
        INSERT INTO bh_confirmation_emails (proof_id, team_id, status)
        SELECT r.id, c.id, 'queued'
        FROM reviewed r JOIN changed c ON c.id = r.team_id
        WHERE ${decision} = 'confirmed'
        ON CONFLICT (proof_id) DO NOTHING
        RETURNING proof_id
      )
      SELECT c.id AS "teamId", c.team_name AS "teamName", c.leader_name AS "leaderName",
             c.members, c."leaderEmailCiphertext", r.id AS "proofId"
      FROM changed c JOIN reviewed r ON r.team_id = c.id
    `;
    if (!result) return errorJson("That screenshot has already been reviewed.", 409);
    if (decision !== "confirmed") return json({ ok: true, status: decision });
    const delivery = await deliverQueuedConfirmation(sql, result as ConfirmationEmailRecord);
    return json({ ok: true, status: decision, emailStatus: delivery.status });
  } catch {
    return errorJson("The review could not be saved. Try again.", 503);
  }
}
