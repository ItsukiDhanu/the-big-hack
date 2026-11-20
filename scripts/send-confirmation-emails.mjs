#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { deliverQueuedConfirmation } from "../server/confirmation-email.mjs";

process.loadEnvFile?.(".env.local");
if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error("DATABASE_URL, SESSION_SECRET, and GMAIL_APP_PASSWORD must be set in .env.local.");
}

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync("database/002_confirmation_emails.sql", "utf8");
for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);

await sql`
  WITH latest_confirmed AS (
    SELECT DISTINCT ON (team_id) team_id, id
    FROM bh_payment_proofs
    WHERE review_status = 'confirmed'
    ORDER BY team_id, reviewed_at DESC NULLS LAST, uploaded_at DESC
  )
  INSERT INTO bh_confirmation_emails (proof_id, team_id, status)
  SELECT p.id, t.id, 'queued'
  FROM bh_teams t
  JOIN latest_confirmed p ON p.team_id = t.id
  LEFT JOIN bh_confirmation_emails existing ON existing.proof_id = p.id
  WHERE t.stage = 'confirmed' AND t.payment_status = 'confirmed' AND existing.proof_id IS NULL
  ON CONFLICT (proof_id) DO NOTHING
`;

const queued = await sql`
  SELECT p.id AS "proofId", t.id AS "teamId", t.team_name AS "teamName",
         t.leader_name AS "leaderName", t.team_members AS members,
         t.leader_email_ciphertext AS "leaderEmailCiphertext"
  FROM bh_confirmation_emails ce
  JOIN bh_payment_proofs p ON p.id = ce.proof_id AND p.review_status = 'confirmed'
  JOIN bh_teams t ON t.id = ce.team_id AND t.stage = 'confirmed' AND t.payment_status = 'confirmed'
  WHERE ce.status = 'queued'
  ORDER BY t.selection_order, t.team_name COLLATE "C"
`;

let sent = 0;
let failed = 0;
for (const record of queued) {
  const result = await deliverQueuedConfirmation(sql, record);
  if (result.status === "sent") {
    sent += 1;
    process.stdout.write(`Sent confirmation to ${record.teamName}.\n`);
  } else {
    failed += 1;
    process.stdout.write(`Could not send confirmation to ${record.teamName} (${result.errorCode ?? result.status}).\n`);
  }
}
process.stdout.write(`Finished: ${sent} sent, ${failed} failed.\n`);
