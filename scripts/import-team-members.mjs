#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

process.loadEnvFile?.(".env.local");
const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--")) ?? "/tmp/bh-team-members.json";
const dryRun = args.includes("--dry-run");
const input = inputPath === "-"
  ? await new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  })
  : readFileSync(inputPath, "utf8");
const chosen = JSON.parse(input);
if (!Array.isArray(chosen) || chosen.length !== 50) throw new Error("Expected 50 extracted team records.");
const correctedTeam = chosen.find((team) => team.slug === "aditya-nayak");
if (!correctedTeam || correctedTeam.members.length < 3) throw new Error("Could not apply the SoCalledEngineers member correction; no records were imported.");
correctedTeam.name = "SoCalledEngineers";
correctedTeam.members[2] = "Navaneeth Shettigar";
const galactusTeam = chosen.find((team) => team.slug === "chirag-m");
if (!galactusTeam) throw new Error("Could not apply the Galactus team name correction; no records were imported.");
galactusTeam.name = "Galactus";
const nitroSparkTeam = chosen.find((team) => team.slug === "nitroxspark");
const sindhuIndex = nitroSparkTeam?.members.findIndex((name) => name.trim().toLocaleLowerCase("en") === "sindhu p") ?? -1;
if (!nitroSparkTeam || sindhuIndex < 0) throw new Error("Could not apply the NitroXSpark member correction; no records were imported.");
nitroSparkTeam.members[sindhuIndex] = "Prince";

const countIssues = chosen.filter((team) => team.declaredSize !== team.members.length);
const duplicates = chosen.filter((team) => team.matchingForms > 1);
console.log(`Matched ${chosen.length}/50 shortlisted teams to original form rows. Using the latest matching submission for ${duplicates.length} teams with repeated registrations.`);
console.log(`Team size field differs from the number of names supplied for ${countIssues.length} teams: ${countIssues.map((team) => `${team.name} (${team.declaredSize ?? "no size"} selected, ${team.members.length} names supplied)`).join("; ") || "none"}.`);
for (const team of chosen) console.log(`${String(team.order).padStart(2, "0")} ${team.name}: ${team.members.length} names (form row ${team.sourceRow})`);

if (dryRun) process.exit(0);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Set it in the untracked .env.local file.");
const sql = neon(process.env.DATABASE_URL);
const existing = await sql`SELECT slug FROM bh_teams`;
const existingSlugs = new Set(existing.map((team) => team.slug));
const missingSlugs = chosen.filter((team) => !existingSlugs.has(team.slug));
if (missingSlugs.length) throw new Error(`No existing team records for: ${missingSlugs.map((team) => team.name).join(", ")}. No records were changed.`);
await sql`ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS team_members JSONB NOT NULL DEFAULT '[]'::jsonb`;
const updates = chosen.map((team) => sql`
  UPDATE bh_teams
  SET team_name = ${team.name}, team_members = ${JSON.stringify(team.members)}::jsonb, updated_at = NOW()
  WHERE slug = ${team.slug}
  RETURNING id
`);
const results = await sql.transaction(updates);
const missing = results.map((result, index) => ({ result, team: chosen[index] })).filter(({ result }) => result.length !== 1);
if (missing.length) throw new Error(`Only ${50 - missing.length} of 50 existing team records were updated: ${missing.map(({ team }) => team.name).join(", ")}.`);
console.log(`Saved registered member names to ${results.length} shortlisted team records in Neon.`);
