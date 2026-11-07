import { useLocation } from "react-router";
import { PAGES } from "~/data/hack";
import { T, istClock, phaseAt, tminus, useNow } from "~/lib/time";

/** vim/tmux-style status line pinned to the bottom of the viewport. */
export default function StatusBar() {
  const now = useNow();
  const { pathname } = useLocation();
  const page = PAGES.find((p) => p.to === pathname)?.name ?? "404";
  const phase = now === null ? null : phaseAt(now);

  const status =
    phase === null ? "syncing clock…"
    : phase === "before" ? <>hacking starts in <b className="font-semibold text-fg">T-{tminus(T.hackStart - now!)}</b></>
    : phase === "hacking" ? <>hacking ends in <b className="font-semibold text-fg">T-{tminus(T.hackEnd - now!)}</b></>
    : phase === "pitching" ? "hacking over. pitches and closing today"
    : "event over. thanks for hacking";

  return (
    <div aria-hidden className="fixed inset-x-0 bottom-0 z-50 flex h-8 items-stretch border-t border-line bg-panel text-xs">
      <span className={`flex items-center px-3 font-bold ${phase === "hacking" ? "bg-red text-white" : "bg-green text-green-ink"}`}>
        {phase === "hacking" ? "● LIVE" : "NORMAL"}
      </span>
      <span className="hidden items-center border-r border-line px-3 text-dim sm:flex">{page}</span>
      <span className="flex min-w-0 flex-1 items-center px-3 text-dim"><span className="truncate">{status}</span></span>
      <span className="hidden items-center border-l border-line px-3 text-dim md:flex">20–21 nov 2026</span>
      <span className="hidden items-center border-l border-line px-3 text-dim md:flex">utf-8</span>
      <span className="flex items-center border-l border-line px-3 tabular-nums text-fg">{now === null ? "--:--:--" : istClock(now)} IST</span>
    </div>
  );
}
