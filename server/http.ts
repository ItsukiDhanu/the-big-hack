import { createHmac, timingSafeEqual } from "node:crypto";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSessionSecret } from "./db.js";

export type Session = { role: "admin" | "team"; sub: string; exp: number };
const COOKIE = "bh_session";
const SESSION_SECONDS = 60 * 60 * 12;

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorJson(message: string, status: number) {
  return json({ error: message }, status);
}

export function createSession(role: Session["role"], sub: string) {
  const payload = Buffer.from(JSON.stringify({ role, sub, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS } satisfies Session)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function getSession(request: Request): Session | null {
  const raw = request.headers.get("cookie")?.split(";").map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [payload, signature, extra] = raw.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const expected = Buffer.from(createHmac("sha256", getSessionSecret()).update(payload).digest("base64url"));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
    if ((parsed.role !== "admin" && parsed.role !== "team") || typeof parsed.sub !== "string" || typeof parsed.exp !== "number" || parsed.exp <= Date.now() / 1000) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export function requireSession(request: Request, role: Session["role"]) {
  const session = getSession(request);
  return session?.role === role ? session : null;
}

export function digest(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

type Sql = NeonQueryFunction<false, false>;

export function rateLimitHashes(subject: string, ip: string) {
  return { subjectHash: digest(subject), ipHash: digest(ip) };
}

export function isRateLimited(counts: { subjectCount?: number | string | null; ipCount?: number | string | null } | undefined) {
  return Number(counts?.subjectCount ?? 0) >= 8 || Number(counts?.ipCount ?? 0) >= 40;
}

export async function recordFailedAttempt(sql: Sql, hashes: ReturnType<typeof rateLimitHashes>) {
  // The counters are time-bounded, so stale-row cleanup can be sampled instead
  // of scanning and deleting expired rows on every failed sign-in.
  await sql`
    WITH inserted AS (
      INSERT INTO bh_auth_attempts (subject_hash, ip_hash)
      VALUES (${hashes.subjectHash}, ${hashes.ipHash})
      RETURNING id
    ), expired AS (
      DELETE FROM bh_auth_attempts
      WHERE ${Math.random() < 0.01}
        AND attempted_at < NOW() - INTERVAL '1 day'
      RETURNING id
    )
    SELECT (SELECT COUNT(*) FROM inserted) AS inserted_count,
           (SELECT COUNT(*) FROM expired) AS expired_count
  `;
}

export function clientIp(request: Request) {
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
