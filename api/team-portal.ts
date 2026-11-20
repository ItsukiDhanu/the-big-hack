import { getDb } from "../server/db.js";
import { errorJson, json, requireSession, sameOrigin } from "../server/http.js";
import { portalPayload, type PortalRecord } from "../server/portal.js";
import { getRound2Problem, ROUND2_CHOICES_CONFIGURED } from "../app/data/round2.js";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  const session = requireSession(request, "team");
  if (!session) return errorJson("Sign in to submit this team’s repository.", 401);
  const body = await request.json().catch(() => null) as { url?: unknown; round2Choice?: { trackId?: unknown; problemStatementId?: unknown } } | null;
  if (body?.round2Choice !== undefined) {
    if (!body.round2Choice || typeof body.round2Choice !== "object") return errorJson("Choose a valid track and problem statement.", 400);
    if (!ROUND2_CHOICES_CONFIGURED) return errorJson("Problem statement choices are not configured yet.", 409);
    const trackId = typeof body.round2Choice.trackId === "string" ? body.round2Choice.trackId : "";
    const problemStatementId = typeof body.round2Choice.problemStatementId === "string" ? body.round2Choice.problemStatementId : "";
    const choice = getRound2Problem(trackId, problemStatementId);
    if (!choice) return errorJson("Choose a valid track and problem statement.", 400);
    try {
      const sql = getDb();
      const [team] = await sql`
        UPDATE bh_teams
        SET round2_track_id = ${trackId}, round2_problem_statement_id = ${problemStatementId}, updated_at = NOW()
        WHERE id = ${session.sub} AND stage = 'confirmed'
          AND round2_track_id IS NULL AND round2_problem_statement_id IS NULL
          AND EXISTS (SELECT 1 FROM bh_app_settings WHERE setting_key = 'round2_choices_open' AND enabled = TRUE)
        RETURNING round2_track_id AS "round2TrackId", round2_problem_statement_id AS "round2ProblemStatementId"
      `;
      if (!team) return errorJson("Choices may be closed, this team may not be confirmed, or its selection may already be locked.", 409);
      return json(team);
    } catch {
      return errorJson("Your problem statement choice could not be saved.", 503);
    }
  }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (url.length > 300 || (url && !/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/i.test(url))) {
    return errorJson("Enter a GitHub repository link, such as https://github.com/team/repo.", 400);
  }
  try {
    const sql = getDb();
    const [team] = await sql`
      UPDATE bh_teams
      SET github_repo_url = ${url || null}, updated_at = NOW()
      WHERE id = ${session.sub} AND stage = 'confirmed'
        AND EXISTS (
          SELECT 1 FROM bh_app_settings
          WHERE setting_key = 'github_repo_submission_enabled' AND enabled = TRUE
        )
      RETURNING github_repo_url AS "githubRepoUrl"
    `;
    if (!team) return errorJson("GitHub submissions are closed or this team is not confirmed.", 403);
    return json({ githubRepoUrl: team.githubRepoUrl });
  } catch {
    return errorJson("The GitHub repository link could not be saved.", 503);
  }
}

export async function GET(request: Request) {
  const session = requireSession(request, "team");
  if (!session) return errorJson("Sign in to view this team.", 401);
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  try {
    const sql = getDb();
    const [record] = await sql`
      SELECT t.id, t.slug, t.team_name AS name, t.leader_name AS "leaderName",
             t.team_members AS members, t.stage,
             t.payment_status AS "paymentStatus", t.updated_at AS "updatedAt",
             t.github_repo_url AS "githubRepoUrl",
             t.round2_track_id AS "round2TrackId", t.round2_problem_statement_id AS "round2ProblemStatementId",
             (t.round3_slot IS NOT NULL) AS "round3Qualified",
             (SELECT enabled FROM bh_app_settings WHERE setting_key = 'github_repo_submission_enabled') AS "githubRepoSubmissionEnabled",
             (SELECT enabled FROM bh_app_settings WHERE setting_key = 'round2_choices_open') AS "round2ChoicesOpen",
             p.id AS "proofId", p.review_status AS "proofStatus",
             p.uploaded_at AS "uploadedAt", p.review_note AS "reviewNote"
      FROM bh_teams t
      LEFT JOIN LATERAL (
        SELECT id, review_status, uploaded_at, review_note
        FROM bh_payment_proofs
        WHERE team_id = t.id
        ORDER BY uploaded_at DESC LIMIT 1
      ) p ON TRUE
      WHERE t.id = ${session.sub} AND t.slug = ${slug}
      LIMIT 1
    `;
    if (!record) return errorJson("This team is not available in your session.", 403);
    return json(portalPayload(record as PortalRecord));
  } catch {
    return errorJson("Team details are temporarily unavailable.", 503);
  }
}
