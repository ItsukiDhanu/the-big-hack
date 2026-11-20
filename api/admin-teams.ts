import { decryptLeaderEmail } from "../server/confirmation-email-crypto.mjs";
import { getDb, getSessionSecret } from "../server/db.js";
import { errorJson, json, requireSession, sameOrigin } from "../server/http.js";
import { getRound2Problem } from "../app/data/round2.js";

function csvCell(value: unknown) {
  let text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value) ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportTeamsCsv() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, slug, team_name AS "teamName", leader_name AS "leaderName",
           leader_email_ciphertext AS "leaderEmailCiphertext", leader_phone AS "leaderPhone",
           team_members AS members, member_contacts AS "memberContacts", stage,
           payment_status AS "paymentStatus", github_repo_url AS "githubRepoUrl",
           round2_track_id AS "round2TrackId", round2_problem_statement_id AS "round2ProblemStatementId",
           (round3_slot IS NOT NULL) AS "round3Qualified",
           selection_order AS "selectionOrder", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM bh_teams
    ORDER BY selection_order ASC, team_name COLLATE "C" ASC
  `;
  const columns = ["Team ID", "Slug", "Team Name", "Leader Name", "Leader Email", "Leader Phone", "Team Members", "Member Contacts", "Stage", "Payment Status", "GitHub Repository", "Round 2 Track", "Problem Statement", "Round 3 Qualified", "Selection Order", "Created At", "Updated At"];
  const lines = [columns.map(csvCell).join(","), ...rows.map((row) => [
    row.id, row.slug, row.teamName, row.leaderName,
    decryptLeaderEmail(row.leaderEmailCiphertext, getSessionSecret()),
    row.leaderPhone, row.members, row.memberContacts, row.stage, row.paymentStatus,
    row.githubRepoUrl,
    getRound2Problem(row.round2TrackId, row.round2ProblemStatementId)?.track.name ?? row.round2TrackId,
    getRound2Problem(row.round2TrackId, row.round2ProblemStatementId)?.problem.name ?? row.round2ProblemStatementId,
    row.round3Qualified ? "yes" : "no", row.selectionOrder, row.createdAt, row.updatedAt,
  ].map(csvCell).join(","))];
  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="the-big-hack-teams.csv"',
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const view = new URL(request.url).searchParams.get("view") ?? "pending";
  if (view === "export") {
    try { return await exportTeamsCsv(); }
    catch { return errorJson("The team export could not be generated.", 503); }
  }
  if (view !== "pending" && view !== "all" && view !== "choices" && view !== "judging") return errorJson("Unknown review queue view.", 400);
  try {
    const sql = getDb();
    if (view === "judging") {
      const teams = await sql`
        SELECT t.id, t.slug, t.team_name AS name, t.leader_name AS "leaderName",
               t.round2_track_id AS "round2TrackId",
               t.round2_problem_statement_id AS "round2ProblemStatementId",
               j.innovation, j.technical_depth AS "technicalDepth", j.evidence,
               j.impact, j.presentation, j.notes AS "judgingNotes",
               j.updated_at AS "judgedAt"
        FROM bh_teams t
        LEFT JOIN bh_team_judgements j ON j.team_id = t.id
        WHERE t.stage = 'confirmed'
        ORDER BY t.round2_track_id NULLS LAST, t.team_name COLLATE "C" ASC
      `;
      return json({ teams });
    }
    if (view === "choices") {
      const teams = await sql`
        SELECT id, slug, team_name AS name, leader_name AS "leaderName",
               round2_track_id AS "round2TrackId",
               round2_problem_statement_id AS "round2ProblemStatementId",
               (round3_slot IS NOT NULL) AS "round3Qualified"
        FROM bh_teams
        WHERE stage = 'confirmed'
        ORDER BY round2_track_id NULLS LAST, round2_problem_statement_id NULLS LAST, team_name COLLATE "C" ASC
      `;
      return json({ teams });
    }
    const teams = await sql`
      SELECT t.id, t.slug, t.team_name AS name, t.leader_name AS "leaderName",
             t.stage, t.payment_status AS "paymentStatus",
             p.id AS "proofId", p.review_status AS "proofStatus",
             p.mime_type AS "proofType", p.uploaded_at AS "uploadedAt",
             ce.status AS "emailStatus"
      FROM bh_teams t
      LEFT JOIN LATERAL (
        SELECT id, review_status, mime_type, uploaded_at
        FROM bh_payment_proofs
        WHERE team_id = t.id
        ORDER BY uploaded_at DESC LIMIT 1
      ) p ON TRUE
      LEFT JOIN bh_confirmation_emails ce ON ce.proof_id = p.id
      WHERE t.stage <> 'standby'
        AND (${view === "all"} OR t.payment_status = 'pending')
      ORDER BY CASE WHEN t.payment_status = 'pending' THEN 0 ELSE 1 END,
               t.selection_order ASC, t.team_name COLLATE "C" ASC
    `;
    return json({ teams });
  } catch {
    return errorJson("Review queue is temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const body = await request.json().catch(() => null) as {
    teamId?: unknown;
    qualified?: unknown;
    scores?: { innovation?: unknown; technicalDepth?: unknown; evidence?: unknown; impact?: unknown; presentation?: unknown };
    notes?: unknown;
  } | null;
  const teamId = typeof body?.teamId === "string" ? body.teamId : "";
  if (!teamId || teamId.length > 100) return errorJson("Choose a team.", 400);
  if (body?.scores) {
    const scores = body.scores;
    const bounds = [[scores.innovation, 25], [scores.technicalDepth, 25], [scores.evidence, 20], [scores.impact, 15], [scores.presentation, 15]] as const;
    if (bounds.some(([score, max]) => !Number.isInteger(score) || Number(score) < 0 || Number(score) > max)
      || typeof body.notes !== "string" || body.notes.length > 2000) {
      return errorJson("Enter valid whole-number scores within each criterion limit.", 400);
    }
    try {
      const sql = getDb();
      const [saved] = await sql`
        INSERT INTO bh_team_judgements (team_id, innovation, technical_depth, evidence, impact, presentation, notes)
        SELECT t.id, ${scores.innovation as number}, ${scores.technicalDepth as number}, ${scores.evidence as number},
               ${scores.impact as number}, ${scores.presentation as number}, ${body.notes}
        FROM bh_teams t WHERE t.id = ${teamId} AND t.stage = 'confirmed'
        ON CONFLICT (team_id) DO UPDATE SET
          innovation = EXCLUDED.innovation, technical_depth = EXCLUDED.technical_depth,
          evidence = EXCLUDED.evidence, impact = EXCLUDED.impact,
          presentation = EXCLUDED.presentation, notes = EXCLUDED.notes, updated_at = NOW()
        RETURNING updated_at AS "judgedAt"
      `;
      if (!saved) return errorJson("Only confirmed teams can be judged.", 404);
      return json({ ok: true, judgedAt: saved.judgedAt });
    } catch {
      return errorJson("Judging scores could not be saved.", 503);
    }
  }
  if (typeof body?.qualified !== "boolean") return errorJson("Choose a team and its Round 3 status.", 400);
  try {
    const sql = getDb();
    const [team] = await sql`
      WITH target AS MATERIALIZED (
        SELECT round2_track_id
        FROM bh_teams
        WHERE id = ${teamId} AND stage = 'confirmed' AND round2_track_id IS NOT NULL
      ), next_slot AS MATERIALIZED (
        SELECT slots.slot
        FROM generate_series(1, 10) AS slots(slot)
        WHERE NOT EXISTS (
          SELECT 1 FROM bh_teams t
          WHERE t.round2_track_id = (SELECT round2_track_id FROM target)
            AND t.round3_slot = slots.slot
        )
        ORDER BY slots.slot LIMIT 1
      ), updated AS (
        UPDATE bh_teams AS t
        SET round3_slot = CASE
              WHEN NOT ${body.qualified} THEN NULL
              WHEN t.round3_slot IS NOT NULL THEN t.round3_slot
              ELSE (SELECT slot FROM next_slot)
            END,
            updated_at = NOW()
        WHERE t.id = ${teamId} AND t.stage = 'confirmed'
          AND EXISTS (SELECT 1 FROM target)
          AND EXISTS (SELECT 1 FROM bh_app_settings WHERE setting_key = 'round2_choices_open' AND enabled = FALSE)
          AND (${!body.qualified} OR t.round3_slot IS NOT NULL OR EXISTS (SELECT 1 FROM next_slot))
        RETURNING id, (round3_slot IS NOT NULL) AS qualified
      )
      SELECT id, qualified FROM updated
    `;
    if (!team) return errorJson("Close the choice window first, or this track already has 10 Round 3 teams.", 409);
    return json({ ok: true, qualified: Boolean(team.qualified) });
  } catch (cause) {
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return errorJson("This track has reached its 10-team Round 3 limit. Refresh the list.", 409);
    return errorJson("Round 3 status could not be saved.", 503);
  }
}
