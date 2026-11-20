import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

function deriveKey(secret) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes to protect team email addresses.");
  }
  return createHmac("sha256", secret).update("the-big-hack:leader-email:v1").digest();
}

export function encryptLeaderEmail(email, secret) {
  const normalized = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Leader email address is invalid.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptLeaderEmail(value, secret) {
  const [version, ivPart, tagPart, encryptedPart, extra] = String(value ?? "").split(".");
  if (version !== "v1" || !ivPart || !tagPart || !encryptedPart || extra) throw new Error("Stored leader email is unavailable.");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const clear = Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clear)) throw new Error("Stored leader email is invalid.");
  return clear;
}
