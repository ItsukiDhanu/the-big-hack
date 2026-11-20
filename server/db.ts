import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedUrl: string | undefined;
let cachedSql: NeonQueryFunction<false, false> | undefined;

export function getDb(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (cachedSql && cachedUrl === url) return cachedSql;
  cachedUrl = url;
  cachedSql = neon(url);
  return cachedSql;
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes");
  }
  return secret;
}
