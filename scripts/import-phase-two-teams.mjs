#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { encryptLeaderEmail } from "../server/confirmation-email-crypto.mjs";

process.loadEnvFile?.(".env.local");

const inputPath = process.argv[2] ?? "/tmp/bh-phase2-teams.json";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Set it in the untracked .env.local file.");
}
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is missing. Set it in the untracked .env.local file.");

const records = JSON.parse(readFileSync(inputPath, "utf8"));
if (!Array.isArray(records) || records.length !== 40) {
  throw new Error("Expected 40 Phase 2 team records.");
}

const source = readFileSync("app/data/hack.ts", "utf8");
const phaseTwoBlock = source.match(/export const PHASE_TWO_TEAMS = \[([\s\S]*?)\] as const;/)?.[1];
const expectedNames = [...(phaseTwoBlock ?? "").matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)]
  .map((match) => match[1]);
if (expectedNames.length !== 40 || records.some((record, index) => record.name !== expectedNames[index])) {
  throw new Error("The 40 import rows must match the public Phase 2 list in order.");
}

const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
const slugs = records.map((record) => slugify(record.name));
if (new Set(slugs).size !== records.length) {
  throw new Error("Duplicate team slugs found; no records were imported.");
}

const prepared = records.map((record, index) => {
  if (typeof record.leaderName !== "string" || !record.leaderName.trim()
      || typeof record.leaderEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.leaderEmail.trim())
      || !Array.isArray(record.members) || !record.members.length
      || record.members.some((member) => typeof member !== "string" || !member.trim())) {
    throw new Error(`Invalid private roster or leader sign-in for Phase 2 team ${index + 1}.`);
  }
  const salt = randomBytes(16).toString("hex");
  const emailHash = scryptSync(record.leaderEmail.trim().toLowerCase(), salt, 64, {
    maxmem: 64 * 1024 * 1024,
  }).toString("hex");
  const emailCiphertext = encryptLeaderEmail(record.leaderEmail, process.env.SESSION_SECRET);
  return {
    id: slugs[index],
    slug: slugs[index],
    team_name: record.name,
    selection_order: 51 + index,
    leader_name: record.leaderName.trim(),
    team_members: record.members.map((member) => member.trim()),
    leader_email_salt: salt,
    leader_email_hash: emailHash,
    leader_email_ciphertext: emailCiphertext,
  };
});

const sql = neon(process.env.DATABASE_URL);
const emailMigration = readFileSync("database/002_confirmation_emails.sql", "utf8");
for (const statement of emailMigration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);
const githubMigration = readFileSync("database/004_github_repositories.sql", "utf8");
for (const statement of githubMigration.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(statement);
const slugNames = prepared.map(({ slug, team_name }) => ({ slug, team_name }));
const existing = await sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${JSON.stringify(slugNames)}::jsonb)
      AS i(slug text, team_name text)
  )
  SELECT t.slug, t.team_name
  FROM bh_teams t
  JOIN incoming i ON i.slug = t.slug
`;
const existingBySlug = new Map(existing.map((team) => [team.slug, team.team_name]));
const conflicts = prepared.filter((team) => existingBySlug.has(team.slug)
  && existingBySlug.get(team.slug) !== team.team_name);
if (conflicts.length) {
  throw new Error(`Existing team slugs conflict with Phase 2 names: ${conflicts.map((team) => team.slug).join(", ")}.`);
}

const missing = prepared.filter((team) => !existingBySlug.has(team.slug));

const inserted = await sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${JSON.stringify(missing)}::jsonb)
      AS i(
        id text,
        slug text,
        team_name text,
        selection_order integer,
        leader_name text,
        team_members jsonb,
        leader_email_salt text,
        leader_email_hash text,
        leader_email_ciphertext text
      )
  )
  INSERT INTO bh_teams (
    id, slug, team_name, selection_order, leader_name, team_members,
    leader_email_salt, leader_email_hash, leader_email_ciphertext, stage, payment_status
  )
  SELECT id, slug, team_name, selection_order, leader_name, team_members,
         leader_email_salt, leader_email_hash, leader_email_ciphertext, 'shortlisted', 'not_submitted'
  FROM incoming
  RETURNING slug
`;
if (inserted.length !== missing.length) {
  throw new Error(`Imported ${inserted.length} of ${missing.length} missing Phase 2 records.`);
}
await sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${JSON.stringify(prepared.map(({ slug, leader_email_ciphertext }) => ({ slug, leader_email_ciphertext })))}::jsonb)
      AS i(slug text, leader_email_ciphertext text)
  )
  UPDATE bh_teams AS t
  SET leader_email_ciphertext = COALESCE(t.leader_email_ciphertext, i.leader_email_ciphertext)
  FROM incoming i WHERE t.slug = i.slug
`;
process.stdout.write(`Imported ${inserted.length} Phase 2 team records.\n`);
