import { verifyTeamEmail } from "../server/credentials.js";
import { getDb } from "../server/db.js";
import { clientIp, createSession, errorJson, isRateLimited, json, rateLimitHashes, recordFailedAttempt, sameOrigin, sessionCookie } from "../server/http.js";
import { portalPayload, type PortalRecord } from "../server/portal.js";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  const body = await request.json().catch(() => null) as { slug?: unknown; email?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug.toLowerCase() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[a-z0-9-]{1,100}$/.test(slug) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorJson("Enter the leader email for this team.", 400);
  }
  try {
    const sql = getDb();
    const subject = `team:${slug}`;
    const ip = clientIp(request);
    const hashes = rateLimitHashes(subject, ip);
    const [team] = await sql`
      SELECT t.id, t.slug, t.team_name AS name, t.leader_name AS "leaderName",
        t.team_members AS members, t.stage, t.payment_status AS "paymentStatus",
        t.updated_at AS "updatedAt", t.github_repo_url AS "githubRepoUrl",
        t.round2_track_id AS "round2TrackId", t.round2_problem_statement_id AS "round2ProblemStatementId",
        (t.round3_slot IS NOT NULL) AS "round3Qualified",
        (SELECT enabled FROM bh_app_settings WHERE setting_key = 'github_repo_submission_enabled') AS "githubRepoSubmissionEnabled",
        (SELECT enabled FROM bh_app_settings WHERE setting_key = 'round2_choices_open') AS "round2ChoicesOpen",
        t.leader_email_salt, t.leader_email_hash,
        p.id AS "proofId", p.review_status AS "proofStatus",
        p.uploaded_at AS "uploadedAt", p.review_note AS "reviewNote",
        (SELECT COUNT(*)::int FROM bh_auth_attempts
         WHERE subject_hash = ${hashes.subjectHash} AND attempted_at > NOW() - INTERVAL '15 minutes') AS "subjectCount",
        (SELECT COUNT(*)::int FROM bh_auth_attempts
         WHERE ip_hash = ${hashes.ipHash} AND attempted_at > NOW() - INTERVAL '15 minutes') AS "ipCount"
      FROM (SELECT 1) AS input_row
      LEFT JOIN bh_teams t ON t.slug = ${slug}
      LEFT JOIN LATERAL (
        SELECT id, review_status, uploaded_at, review_note
        FROM bh_payment_proofs
        WHERE team_id = t.id
        ORDER BY uploaded_at DESC LIMIT 1
      ) p ON TRUE
    `;
    if (isRateLimited(team)) return errorJson("Too many attempts. Try again in 15 minutes.", 429);
    if (!team?.id || !verifyTeamEmail(email, team.leader_email_salt, team.leader_email_hash)) {
      await recordFailedAttempt(sql, hashes);
      return errorJson("That email could not access this team.", 401);
    }
    const token = createSession("team", team.id);
    return json({ ok: true, ...portalPayload(team as PortalRecord) }, 200, { "set-cookie": sessionCookie(token) });
  } catch {
    return errorJson("Team sign-in is temporarily unavailable.", 503);
  }
}
