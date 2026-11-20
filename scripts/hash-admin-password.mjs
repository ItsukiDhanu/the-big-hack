#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomBytes, scryptSync } from "node:crypto";
import { spawnSync } from "node:child_process";

if (!stdin.isTTY) throw new Error("Run this command in an interactive terminal.");
const echoOff = spawnSync("stty", ["-echo"], { stdio: "inherit" });
if (echoOff.status !== 0) throw new Error("Could not hide terminal input.");
const rl = createInterface({ input: stdin, output: stdout, terminal: false });
try {
  stdout.write("Admin password (hidden): ");
  const password = await rl.question("");
  if (password.length < 14) throw new Error("Use at least 14 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { maxmem: 64 * 1024 * 1024 }).toString("hex");
  stdout.write(`ADMIN_PASSWORD_HASH=scrypt$${salt}$${hash}\n`);
} finally {
  rl.close();
  spawnSync("stty", ["echo"], { stdio: "inherit" });
  stdout.write("\n");
}
