#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { encryptLeaderEmail } from "../server/confirmation-email-crypto.mjs";

process.loadEnvFile?.(".env.local");

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
if (!inputPath) throw new Error("Pass the tab-separated registration export as the first argument.");
if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  throw new Error("DATABASE_URL and SESSION_SECRET must be set in .env.local.");
}

function parseTsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === "\t") {
      row.push(field);
      field = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error("The registration export has an unclosed quoted field.");
  return rows;
}

const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
const normalize = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const unusableName = (value) => !value || /^(?:n\/?a|na|none)$/i.test(value.trim());
const rows = parseTsv(readFileSync(inputPath, "utf8"));
const incoming = [];
for (const [index, row] of rows.entries()) {
  const name = row[0]?.trim();
  if (!name) continue;
  const leaderName = row[1]?.trim();
  const leaderEmail = row[2]?.trim().toLowerCase();
  if (!leaderName || !isEmail(leaderEmail)) {
    throw new Error(`Registration row ${index + 1} has no valid leader or email.`);
  }
  const declaredSize = Number.parseInt(row[8]?.trim().match(/^\d+/)?.[0] ?? "", 10);
  const rosterSlotsAreAligned = Number.isInteger(declaredSize) && declaredSize >= 2 && declaredSize <= 4;
  const memberNames = rosterSlotsAreAligned ? [9, 11, 13].map((column) => row[column]?.trim() ?? "") : [];
  const members = [...new Set([leaderName, ...memberNames].filter((member) => !unusableName(member)))];
  incoming.push({ name, slug: slugify(name), leaderName, leaderEmail, members, declaredSize, rosterSlotsAreAligned, rowNumber: index + 1 });
}
if (!incoming.length) throw new Error("No standby registration rows were found.");
if (new Set(incoming.map(({ slug }) => slug)).size !== incoming.length) {
  throw new Error("Duplicate team slugs found in the standby file.");
}

const sql = neon(process.env.DATABASE_URL);
const existing = await sql`SELECT slug, team_name AS name, leader_name AS "leaderName", stage FROM bh_teams`;
const existingBySlug = new Map(existing.map((team) => [team.slug, team]));
const existingByName = new Map();
for (const team of existing) {
  const key = normalize(team.name);
  existingByName.set(key, [...(existingByName.get(key) ?? []), team]);
}
const prepared = [];
const skipped = [];
for (const team of incoming) {
  const sameSlug = existingBySlug.get(team.slug);
  const nameMatches = existingByName.get(normalize(team.name)) ?? [];
  const sameLeader = nameMatches.find((candidate) => normalize(candidate.leaderName) === normalize(team.leaderName));
  if (sameSlug || sameLeader) {
    const current = sameSlug ?? sameLeader;
    if (current.stage === "standby") skipped.push(`${team.name} (same leader, already standby)`);
    else skipped.push(`${team.name} (same leader, already ${current.stage}; left unchanged)`);
    continue;
  }
  const slug = nameMatches.length ? `${team.slug}-${slugify(team.leaderName)}` : team.slug;
  if (existingBySlug.has(slug) || prepared.some((candidate) => candidate.slug === slug)) {
    throw new Error(`Cannot assign a unique standby slug to ${team.name} / ${team.leaderName}.`);
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(team.leaderEmail, salt, 64, { maxmem: 64 * 1024 * 1024 }).toString("hex");
  prepared.push({
    id: slug,
    slug,
    team_name: team.name,
    selection_order: 1000 + team.rowNumber,
    leader_name: team.leaderName,
    team_members: team.members,
    leader_email_salt: salt,
    leader_email_hash: hash,
    leader_email_ciphertext: encryptLeaderEmail(team.leaderEmail, process.env.SESSION_SECRET),
  });
}

if (dryRun) {
  process.stdout.write(`Dry run: ${prepared.length} new standby teams are ready to import.\n`);
  for (const team of prepared) {
    const source = incoming.find((record) => record.slug === team.slug);
    process.stdout.write(`· ${team.team_name}: ${team.team_members.length} names${source?.rosterSlotsAreAligned ? "" : " (source roster columns need review)"}\n`);
  }
  process.stdout.write("No records were added.\n");
  process.exit(0);
}

const inserted = prepared.length ? await sql`
  WITH incoming AS (
    SELECT * FROM jsonb_to_recordset(${JSON.stringify(prepared)}::jsonb)
      AS i(id text, slug text, team_name text, selection_order integer, leader_name text,
           team_members jsonb, leader_email_salt text, leader_email_hash text,
           leader_email_ciphertext text)
  )
  INSERT INTO bh_teams (
    id, slug, team_name, selection_order, leader_name, team_members,
    leader_email_salt, leader_email_hash, leader_email_ciphertext, stage, payment_status
  )
  SELECT id, slug, team_name, selection_order, leader_name, team_members,
         leader_email_salt, leader_email_hash, leader_email_ciphertext, 'standby', 'not_submitted'
  FROM incoming
  ON CONFLICT (slug) DO NOTHING
  RETURNING team_name
` : [];

process.stdout.write(`Imported ${inserted.length} standby teams.\n`);
for (const team of inserted) process.stdout.write(`+ ${team.team_name}\n`);
for (const name of skipped) process.stdout.write(`Skipped ${name}.\n`);
