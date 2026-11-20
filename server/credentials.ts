import { scryptSync, timingSafeEqual } from "node:crypto";

export function verifySecret(secret: string, encoded: string | undefined) {
  if (!encoded) return false;
  const [scheme, salt, expectedHex] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) return false;
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(secret, salt, expected.length, { maxmem: 64 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function verifyTeamEmail(email: string, salt: string, expectedHex: string) {
  if (!/^[a-f0-9]{128}$/i.test(expectedHex)) return false;
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(email.trim().toLowerCase(), salt, expected.length, { maxmem: 64 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}
