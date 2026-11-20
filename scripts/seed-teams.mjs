#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { encryptLeaderEmail } from "../server/confirmation-email-crypto.mjs";

process.loadEnvFile?.(".env.local");
const pdfPath = process.argv[2] ?? "/home/itsuki/Downloads/big_hack_final_lists.pdf";
if (!existsSync(pdfPath)) throw new Error("Pass the final lists PDF as the first argument.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Put it in the untracked .env.local file.");
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is missing. Put it in the untracked .env.local file.");

const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
const rows = [];
for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^\s*(\d{1,2})\s{2,}(.*?)\s{2,}(.*?)\s{2,}([^\s@]+@[^\s]+)\s*$/);
  if (!match) continue;
  const number = Number(match[1]);
  if (number < 1 || number > 50) continue;
  const teamName = match[2].replace(/[■□◆●†*]+$/g, "").trim();
  const leaderName = match[3].trim();
  const email = match[4].trim().toLowerCase();
  if (teamName && leaderName && email) rows.push({ number, teamName, leaderName, email });
}
const firstFifty = rows.filter((row, index) => row.number === index + 1);
if (firstFifty.length !== 50) throw new Error(`Expected 50 consecutive Google Form entries; found ${firstFifty.length}.`);

const source = readFileSync("app/data/hack.ts", "utf8");
const listBlock = source.match(/export const PHASE_ONE_TEAMS = \[([\s\S]*?)\] as const;/)?.[1];
const expectedNames = [...(listBlock ?? "").matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)].map((match) => match[1]);
const formNames = expectedNames.map((name) => name === "SoCalledEngineers" ? "Aditya Nayak" : name === "Galactus" ? "chirag M" : name);
const normalize = (value) => value.toLocaleLowerCase("en").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
if (expectedNames.length !== 50 || firstFifty.some((row, index) => normalize(row.teamName) !== normalize(formNames[index]))) {
  throw new Error("The first 50 PDF team names do not match the public Phase 1 list; no records were imported.");
}

const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
const slugs = firstFifty.map((row) => slugify(row.teamName));
if (new Set(slugs).size !== 50) throw new Error("Duplicate team slugs found; no records were imported.");

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync("database/001_team_portal.sql", "utf8");
for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);
const emailMigration = readFileSync("database/002_confirmation_emails.sql", "utf8");
for (const statement of emailMigration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);
const githubMigration = readFileSync("database/004_github_repositories.sql", "utf8");
for (const statement of githubMigration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);

for (const [index, row] of firstFifty.entries()) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(row.email, salt, 64, { maxmem: 64 * 1024 * 1024 }).toString("hex");
  const emailCiphertext = encryptLeaderEmail(row.email, process.env.SESSION_SECRET);
  const slug = slugs[index];
  const teamName = expectedNames[index];
  await sql`
    INSERT INTO bh_teams (id, slug, team_name, selection_order, leader_name, leader_email_salt, leader_email_hash, leader_email_ciphertext)
    VALUES (${slug}, ${slug}, ${teamName}, ${row.number}, ${row.leaderName}, ${salt}, ${hash}, ${emailCiphertext})
    ON CONFLICT (slug) DO UPDATE SET
      team_name = EXCLUDED.team_name,
      selection_order = EXCLUDED.selection_order,
      leader_name = EXCLUDED.leader_name,
      leader_email_salt = EXCLUDED.leader_email_salt,
      leader_email_hash = EXCLUDED.leader_email_hash,
      leader_email_ciphertext = EXCLUDED.leader_email_ciphertext,
      updated_at = NOW()
  `;
}
process.stdout.write("Database schema is ready; imported 50 Phase 1 team records.\n");
