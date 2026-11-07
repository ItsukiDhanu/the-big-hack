import { ROUND2, ROUNDS } from "~/data/hack";
import { T, useNow } from "~/lib/time";

type Status = "queued" | "running" | "passed";

/** Status of each stage at `now`. Before hydration it assumes Round 1 is still open. */
function statuses(now: number | null): Status[] {
  const t = now ?? 0;
  const stage = (from: number, to: number): Status => (t < from ? "queued" : t < to ? "running" : "passed");
  return [
    stage(-Infinity, T.regClose),
    ROUND2.shortlistUrl && t >= T.regClose ? "passed" : stage(T.regClose, T.start),
    stage(T.start, T.end),
  ];
}

const ICON: Record<Status, { ch: string; cls: string; label: string }> = {
  queued: { ch: "○", cls: "text-faint", label: "queued" },
  running: { ch: "●", cls: "text-amber motion-safe:animate-pulse", label: "running" },
  passed: { ch: "✓", cls: "text-green", label: "passed" },
};

/** The two-round format as a CI pipeline: idea → shortlist → build. */
export default function Pipeline({ className = "" }: { className?: string }) {
  const now = useNow(60_000);
  const st = statuses(now);

  return (
    <div className={`pane overflow-hidden ${className}`}>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-raise px-5 py-3 text-xs">
        <span className="text-fg">bighack.yml</span>
        <span className="text-faint">pipeline · 3 stages</span>
        <span className="ml-auto text-dim">round 1 is free · pay only if shortlisted</span>
      </p>
      <ol className="grid md:grid-cols-3">
        {ROUNDS.map((r, i) => {
          const s = ICON[st[i]];
          return (
            <li key={r.id} className="relative border-line px-5 py-5 not-last:border-b md:not-last:border-r md:not-last:border-b-0">
              {i > 0 && <span aria-hidden className="absolute top-1/2 -left-2.5 hidden -translate-y-1/2 bg-panel text-faint md:block">▶</span>}
              <p className="flex items-center gap-2 text-sm">
                <span aria-hidden className={s.cls}>{s.ch}</span>
                <span className="font-bold text-fg">{r.id}</span>
                <span className="sr-only">({s.label})</span>
              </p>
              <p className="mt-2 text-sm text-dim">{r.note}</p>
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div className="flex gap-1.5"><dt className="text-faint">where</dt><dd className="text-cyan">{r.mode}</dd></div>
                <div className="flex gap-1.5"><dt className="text-faint">when</dt><dd className="text-fg">{r.when}</dd></div>
                {r.fee && <div className="flex gap-1.5"><dt className="text-faint">fee</dt><dd className={r.fee === "free" ? "text-green" : "text-amber"}>{r.fee}</dd></div>}
              </dl>
              <p aria-hidden className={`mt-3 text-[11px] ${s.cls.split(" ")[0]}`}>{s.label}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
