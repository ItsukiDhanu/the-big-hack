import { getDb } from "../server/db.js";
import { clearSessionCookie, errorJson, json, requireSession, sameOrigin } from "../server/http.js";
import { ROUND2_CHOICES_CONFIGURED } from "../app/data/round2.js";

export async function GET(request: Request) {
  if (!requireSession(request, "admin")) return json({ authenticated: false, githubRepoSubmissionEnabled: false });
  try {
    const sql = getDb();
    const [settings] = await sql`
      SELECT
        COALESCE(bool_or(enabled) FILTER (WHERE setting_key = 'github_repo_submission_enabled'), FALSE) AS "githubRepoSubmissionEnabled",
        COALESCE(bool_or(enabled) FILTER (WHERE setting_key = 'round2_choices_open'), FALSE) AS "round2ChoicesOpen"
      FROM bh_app_settings
      WHERE setting_key IN ('github_repo_submission_enabled', 'round2_choices_open')
    `;
    return json({ authenticated: true, ...settings });
  } catch {
    return errorJson("Admin settings are temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  if (!requireSession(request, "admin")) return errorJson("Admin sign-in required.", 401);
  const body = await request.json().catch(() => null) as { key?: unknown; enabled?: unknown } | null;
  const settingKey = body?.key === "round2_choices_open" ? "round2_choices_open" : "github_repo_submission_enabled";
  if (typeof body?.enabled !== "boolean" || (body?.key !== undefined && body.key !== "round2_choices_open" && body.key !== "github_repo_submission_enabled")) {
    return errorJson("Choose a valid organiser setting.", 400);
  }
  if (settingKey === "round2_choices_open" && body.enabled && !ROUND2_CHOICES_CONFIGURED) {
    return errorJson("Add the final track and problem statement names before opening choices.", 409);
  }
  try {
    const sql = getDb();
    const [setting] = await sql`
      INSERT INTO bh_app_settings (setting_key, enabled, updated_at)
      VALUES (${settingKey}, ${body.enabled}, NOW())
      ON CONFLICT (setting_key) DO UPDATE
      SET enabled = EXCLUDED.enabled, updated_at = NOW()
      RETURNING enabled
    `;
    return json({ enabled: Boolean(setting.enabled), key: settingKey });
  } catch {
    return errorJson("GitHub submission setting could not be saved.", 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return errorJson("Request origin was not accepted.", 403);
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
