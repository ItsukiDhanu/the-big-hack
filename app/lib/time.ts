import { useEffect, useState } from "react";
import { TIMES } from "~/data/hack";

export const T = {
  start: Date.parse(TIMES.start),
  hackStart: Date.parse(TIMES.hackStart),
  hackEnd: Date.parse(TIMES.hackEnd),
  end: Date.parse(TIMES.end),
  regClose: Date.parse(TIMES.registrationCloses),
};

/** Current time, ticking every `ms`. Null until hydrated so prerendered HTML never shows a stale clock. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export type Phase = "before" | "hacking" | "pitching" | "over";

export function phaseAt(now: number): Phase {
  if (now < T.hackStart) return "before";
  if (now < T.hackEnd) return "hacking";
  if (now < T.end) return "pitching";
  return "over";
}

/** Milliseconds → { d, h, m, s }. */
export function split(ms: number) {
  const t = Math.max(0, ms);
  return {
    d: Math.floor(t / 86_400_000),
    h: Math.floor(t / 3_600_000) % 24,
    m: Math.floor(t / 60_000) % 60,
    s: Math.floor(t / 1000) % 60,
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");

/** "T-32d 18:19:58" style countdown string. */
export function tminus(ms: number) {
  const { d, h, m, s } = split(ms);
  return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function istClock(now: number) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
}

/** Whether Round 1 (idea submission) is still open. Treated as open until hydrated, then re-checked every minute. */
export function useRegistrationOpen() {
  const now = useNow(60_000);
  return now === null || now < T.regClose;
}
