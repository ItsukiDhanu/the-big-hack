import { verifySecret } from "../server/credentials.js";
import { getDb } from "../server/db.js";
import { clientIp, createSession, errorJson, isRateLimited, json, rateLimitHashes, recordFailedAttempt, sameOrigin, sessionCookie } from "../server/http.js";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 1024) return errorJson("Enter the admin password.", 400);
  try {
    const sql = getDb();
    const subject = "admin";
    const ip = clientIp(request);
    const hashes = rateLimitHashes(subject, ip);
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM bh_auth_attempts
         WHERE subject_hash = ${hashes.subjectHash} AND attempted_at > NOW() - INTERVAL '15 minutes') AS "subjectCount",
        (SELECT COUNT(*)::int FROM bh_auth_attempts
         WHERE ip_hash = ${hashes.ipHash} AND attempted_at > NOW() - INTERVAL '15 minutes') AS "ipCount"
    `;
    if (isRateLimited(counts)) return errorJson("Too many attempts. Try again in 15 minutes.", 429);
    if (!verifySecret(password, process.env.ADMIN_PASSWORD_HASH)) {
      await recordFailedAttempt(sql, hashes);
      return errorJson("Password not accepted.", 401);
    }
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(createSession("admin", "admin")) });
  } catch {
    return errorJson("Admin sign-in is not configured yet.", 503);
  }
}
