import type { Route } from "./+types/schedule";
import { PageHead, Pane, RegisterBtn } from "~/components/ui";
import { SCHEDULE, TIMES, WINDOW_BREAKS, type Slot } from "~/data/hack";
import { T, phaseAt, useNow } from "~/lib/time";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "Schedule", path: "/schedule", description: "The Big Hack 2.0 timeline: Round 1 ideas due 10 Nov, then the shortlist, then Round 2 from 20 Nov 9:00 AM to 21 Nov 6:00 PM, with a 24-hour hacking window from 1:00 PM Friday to 1:00 PM Saturday." });

/** Parse "1:00 PM" on a given day (20 or 21 Nov) into a timestamp. */
function at(day: 20 | 21, time: string) {
  const [, h, m, ap] = time.match(/(\d+):(\d+) (AM|PM)/)!;
  const hh = (Number(h) % 12) + (ap === "PM" ? 12 : 0);
  return Date.parse(`2026-11-${day}T${String(hh).padStart(2, "0")}:${m}:00+05:30`);
}

const TAG: Record<NonNullable<Slot["kind"]> | "round" | "none", { tag: string; cls: string }> = {
  round: { tag: "round", cls: "text-magenta" },
  milestone: { tag: "git", cls: "text-green" },
  meal: { tag: "food", cls: "text-amber" },
  ceremony: { tag: "stage", cls: "text-cyan" },
  none: { tag: "break", cls: "text-faint" },
};

/** Where a row sits on the graph. `gap` and `through` draw lines only (day headers). */
type Role = "main" | "fork" | "branch" | "merge" | "gap" | "through";

const HACK_START = Date.parse(TIMES.hackStart);
const HACK_END = Date.parse(TIMES.hackEnd);

/** Round 1 and the shortlist, on main before the event. */
const PRE = [
  { day: "Round 1, online", time: "Now", end: "10 Nov", title: "Round 1: pick a track, submit your idea (free)", kind: "round" as const, startAt: 0, endAt: T.regClose, role: "main" as Role },
  { day: "Round 1, online", time: "10 Nov, 11:59 PM", title: "Round 1 closes", kind: "round" as const, startAt: T.regClose, endAt: T.regClose + 60_000, role: "main" as Role },
  { day: "Round 1, online", time: "After 10 Nov", title: "Shortlist out, shortlisted teams pay ₹800", kind: "round" as const, startAt: T.regClose + 60_000, endAt: T.start, role: "main" as Role },
];

const EVENT = SCHEDULE.flatMap((d, di) =>
  d.slots.map((s) => {
    const day = (di === 0 ? 20 : 21) as 20 | 21;
    const startAt = at(day, s.time);
    const endAt = s.end ? at(day, s.end) : startAt + 15 * 60_000;
    const role: Role =
      s.kind === "milestone" && startAt === HACK_START ? "fork"
      : s.kind === "milestone" && startAt === HACK_END ? "merge"
      : startAt > HACK_START && startAt < HACK_END ? "branch"
      : "main";
    return { ...s, day: di === 0 ? "Round 2, Day 1, Friday 20 November" : "Round 2, Day 2, Saturday 21 November", startAt, endAt, role };
  }),
);

const ENTRIES = [...PRE, ...EVENT];

/* Lane x positions in px: main and the hack/24h branch. */
const L1 = 14;
const L2 = 42;

function Lanes({ role, first, last }: { role: Role; first?: boolean; last?: boolean }) {
  const v = "absolute w-px";
  const branchFull = role === "branch" || role === "through";
  return (
    <span aria-hidden className="relative block w-14 shrink-0 self-stretch">
      <span className={`${v} bg-line-hi`} style={{ left: L1, top: first ? "50%" : 0, bottom: last ? "50%" : 0 }} />
      {branchFull && <span className={`${v} bg-green/60`} style={{ left: L2, top: 0, bottom: 0 }} />}
      {(role === "fork" || role === "merge") && (
        <>
          <span className={`${v} bg-green/60`} style={{ left: L2, top: role === "fork" ? "50%" : 0, bottom: role === "fork" ? 0 : "50%" }} />
          <span className="absolute h-px bg-green/60" style={{ left: L1, width: L2 - L1, top: "50%" }} />
        </>
      )}
      {role !== "gap" && role !== "through" && (
        <span
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
            role === "fork" || role === "merge" ? "size-3.5 border-green bg-green"
            : role === "branch" ? "size-3 border-amber bg-bg"
            : "size-3 border-cyan bg-bg"
          }`}
          style={{ left: (role === "branch" || role === "fork" ? L2 : L1) + 0.5 }}
        />
      )}
    </span>
  );
}

export default function Schedule() {
  const now = useNow(30_000);
  const nextIdx = now === null ? -1 : ENTRIES.findIndex((e) => e.endAt > now);

  return (
    <>
      <PageHead
        path="~/schedule"
        cmd="git log --graph --all"
        title="Schedule"
        intro={<>Round 1 runs online until 10 November. Then, for shortlisted teams, two days and one continuous build: at 1:00 PM Friday the <span className="text-green">hack/24h</span> branch forks off main, and it merges back at 1:00 PM Saturday. Final timings are shared with shortlisted teams.</>}
      />

      <div className="wrap space-y-14">
        <Progress now={now} />

        <Pane title="git log --graph" className="pt-4">
          <h2 className="sr-only">Full timeline</h2>
          <div aria-hidden className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line px-4 pb-3 text-xs sm:px-6">
            <span className="flex items-center gap-2 text-dim"><span className="size-2.5 rounded-full border-2 border-cyan" /> main</span>
            <span className="flex items-center gap-2 text-dim"><span className="size-2.5 rounded-full border-2 border-amber" /> hack/24h</span>
            <span className="flex items-center gap-2 text-dim"><span className="size-2.5 rounded-full bg-green" /> fork and merge</span>
          </div>
          <ol className="text-[13px] sm:text-sm">
            {ENTRIES.map((e, i) => {
              const tag = TAG[e.kind ?? "none"];
              const live = now !== null && e.startAt <= now && now < e.endAt;
              const isNext = i === nextIdx && !live;
              const past = now !== null && e.endAt <= now;
              const header = i === 0 || ENTRIES[i - 1].day !== e.day;
              const prevInBranch = i > 0 && (ENTRIES[i - 1].role === "branch" || ENTRIES[i - 1].role === "fork");
              return (
                <li key={e.day + e.title}>
                  {header && (
                    <div className="flex items-stretch border-b border-line/60 bg-raise/60 px-4 sm:px-6">
                      <Lanes role={prevInBranch ? "through" : "gap"} first={i === 0} />
                      <p className="py-2 pl-2 text-xs text-dim">── {e.day} ──</p>
                    </div>
                  )}
                  <div className={`flex items-stretch border-b border-line/40 px-4 sm:px-6 ${live ? "bg-green/10" : ""}`}>
                    <Lanes role={e.role} last={i === ENTRIES.length - 1} />
                    <div className={`grid flex-1 gap-x-4 gap-y-0.5 py-3.5 pl-2 sm:grid-cols-[10.5rem_3.5rem_1fr_auto] sm:items-center ${past ? "opacity-45" : ""}`}>
                      <span className="tabular-nums text-dim">
                        <time>{e.time}</time>{e.end && <> – <time>{e.end}</time></>}
                      </span>
                      <span className={`hidden sm:block ${tag.cls}`}>{tag.tag}</span>
                      <span className={e.role === "fork" || e.role === "merge" ? "font-bold text-green" : "text-fg"}>
                        {e.title}
                        {e.role === "fork" && <span className="ml-2 inline-block rounded-[3px] border border-green/50 px-1.5 text-[11px] font-normal">git checkout -b hack/24h</span>}
                        {e.role === "merge" && <span className="ml-2 inline-block rounded-[3px] border border-green/50 px-1.5 text-[11px] font-normal">git merge hack/24h</span>}
                      </span>
                      <span className="text-xs sm:text-right">
                        {live && <span className="text-green">◀ happening now</span>}
                        {isNext && <span className="text-amber">◀ up next</span>}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Pane>

        <div className="flex flex-wrap items-center gap-4">
          <RegisterBtn />
          <p className="text-sm text-dim">Round 2 venue to be announced. Times are IST.</p>
        </div>
      </div>
    </>
  );
}

/** The 24-hour window as a build progress bar: █ built, ▒ break, ░ still to go. */
function Progress({ now }: { now: number | null }) {
  const phase = now === null ? "before" : phaseAt(now);
  const elapsedH = now === null ? 0 : Math.min(24, Math.max(0, (now - T.hackStart) / 3_600_000));
  const cells = Array.from({ length: 24 }, (_, h) => {
    const isBreak = WINDOW_BREAKS.some((b) => h < b.to && h + 1 > b.from);
    if (h < Math.floor(elapsedH)) return { ch: "█", cls: "text-green" };
    if (isBreak) return { ch: "▒", cls: "text-amber/70" };
    return { ch: "░", cls: "text-faint" };
  });
  const pct = Math.round((elapsedH / 24) * 100);
  const state =
    phase === "before" ? "queued: starts 20 nov 13:00 IST"
    : phase === "hacking" ? `building… ${pct}%`
    : "✓ build complete";

  return (
    <Pane as="figure" title="npm run hack" className="px-4 pt-8 pb-6 sm:px-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-fg">24-hour build</span>
        <span className={phase === "hacking" ? "text-green" : "text-dim"}>{state}</span>
      </figcaption>
      <div aria-hidden className="mt-6 overflow-hidden whitespace-nowrap text-[clamp(15px,4.4vw,38px)] leading-none">
        <span className="text-faint">[</span>
        {cells.map((c, i) => <span key={i} className={c.cls}>{c.ch}</span>)}
        <span className="text-faint">]</span>
        <span className="ml-3 text-[0.55em] text-dim tabular-nums">{pct}%</span>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-dim">
        <span><span className="text-green">FRI 13:00</span> fork</span>
        <span>1:00 AM midnight coffee</span>
        <span>merge <span className="text-green">SAT 13:00</span></span>
      </div>
      <ul className="mt-6 grid gap-2 border-t border-line pt-5 text-xs text-dim sm:grid-cols-3">
        <li><span className="text-green">█</span> built</li>
        <li><span className="text-amber/70">▒</span> food or coffee break</li>
        <li><span className="text-faint">░</span> still to go</li>
      </ul>
      <p className="sr-only">Hacking runs from {TIMES.hackStart} to {TIMES.hackEnd}. Breaks: {WINDOW_BREAKS.map((b) => b.label).join(", ")}.</p>
    </Pane>
  );
}
