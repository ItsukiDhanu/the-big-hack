import { getDb } from "../server/db.js";
import { errorJson, json } from "../server/http.js";

export async function GET(request: Request) {
  const stage = new URL(request.url).searchParams.get("stage");
  if (stage !== "shortlisted" && stage !== "confirmed") return errorJson("Unknown team list.", 400);
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT slug, team_name AS name, stage
      FROM bh_teams
      WHERE stage = ${stage}
      ORDER BY selection_order ASC, team_name COLLATE "C" ASC
    `;
    const response = json({ teams: rows });
    response.headers.set("cache-control", "public, max-age=0, s-maxage=30, stale-while-revalidate=30");
    return response;
  } catch {
    return errorJson("The team directory is temporarily unavailable.", 503);
  }
}
