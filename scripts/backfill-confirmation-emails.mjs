#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { encryptLeaderEmail } from "../server/confirmation-email-crypto.mjs";

process.loadEnvFile?.(".env.local");
const pdfPath = process.argv[2] ?? "/home/itsuki/Downloads/big_hack_final_lists.pdf";
const phaseTwoPath = process.argv[3] ?? "/tmp/bh-phase2-teams.json";
if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) throw new Error("DATABASE_URL and SESSION_SECRET are required in .env.local.");

const source = readFileSync("app/data/hack.ts", "utf8");
function readNames(constantName) {
  const block = source.match(new RegExp(`export const ${constantName} = \\[([\\s\\S]*?)\\] as const;`))?.[1];
  return [...(block ?? "").matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)].map((match) => match[1]);
}
const phaseOneNames = readNames("PHASE_ONE_TEAMS");
const phaseTwoNames = readNames("PHASE_TWO_TEAMS");
if (phaseOneNames.length !== 50 || phaseTwoNames.length !== 40) throw new Error("Expected the published 50 Phase 1 and 40 Phase 2 team lists.");

const pdfText = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
const pdfRows = [];
for (const line of pdfText.split(/\r?\n/)) {
  const match = line.match(/^\s*(\d{1,2})\s{2,}(.*?)\s{2,}(.*?)\s{2,}([^\s@]+@[^\s]+)\s*$/);
  if (!match) continue;
  const number = Number(match[1]);
  if (number < 1 || number > 50) continue;
  pdfRows.push({ number, teamName: match[2].replace(/[■□◆●†*]+$/g, "").trim(), leaderEmail: match[4].trim().toLowerCase() });
}
const firstFifty = pdfRows.filter((row, index) => row.number === index + 1);
const normalize = (value) => value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const formNames = phaseOneNames.map((name) => name === "SoCalledEngineers" ? "Aditya Nayak" : name === "Galactus" ? "chirag M" : name);
if (firstFifty.length !== 50 || firstFifty.some((row, index) => normalize(row.teamName) !== normalize(formNames[index]))) {
  throw new Error("The PDF shortlist no longer matches Phase 1; no email addresses were changed.");
}

const phaseTwo = JSON.parse(readFileSync(phaseTwoPath, "utf8"));
if (!Array.isArray(phaseTwo) || phaseTwo.length !== 40 || phaseTwo.some((row, index) => row.name !== phaseTwoNames[index])) {
  throw new Error("The Phase 2 source does not match the published list; no email addresses were changed.");
}
const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
const candidates = [
  ...firstFifty.map((row) => ({ slug: slugify(row.teamName), email: row.leaderEmail })),
  ...phaseTwo.map((row) => ({ slug: slugify(row.name), email: String(row.leaderEmail ?? "").trim().toLowerCase() })),
];
if (candidates.some((row) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
    || new Set(candidates.map((row) => row.slug)).size !== candidates.length) {
  throw new Error("A duplicate team or invalid leader address was found; no email addresses were changed.");
}

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync("database/002_confirmation_emails.sql", "utf8");
for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);
const teams = await sql`SELECT slug, leader_email_salt, leader_email_hash FROM bh_teams`;
const bySlug = new Map(teams.map((team) => [team.slug, team]));
const prepared = candidates.map(({ slug, email }) => {
  const team = bySlug.get(slug);
  if (!team) throw new Error("A published team is missing from the database; no email addresses were changed.");
  const computed = scryptSync(email, team.leader_email_salt, 64, { maxmem: 64 * 1024 * 1024 });
  const expected = Buffer.from(team.leader_email_hash, "hex");
  if (computed.length !== expected.length || !timingSafeEqual(computed, expected)) {
    throw new Error("A source email did not match its team's sign-in credential; no email addresses were changed.");
  }
  return { slug, ciphertext: encryptLeaderEmail(email, process.env.SESSION_SECRET) };
});

const updated = await sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${JSON.stringify(prepared)}::jsonb)
      AS i(slug text, ciphertext text)
  )
  UPDATE bh_teams AS t
  SET leader_email_ciphertext = COALESCE(t.leader_email_ciphertext, i.ciphertext)
  FROM incoming i WHERE t.slug = i.slug
  RETURNING t.slug
`;
if (updated.length !== candidates.length) throw new Error("Not all selected team records received an encrypted contact address.");
process.stdout.write(`Backfilled encrypted leader contact addresses for ${updated.length} teams.\n`);
