import { useId, useState } from "react";
import { FACTS, TRACKS } from "~/data/hack";

/* Token helpers for hand-highlighted code. */
const K = ({ c }: { c: string }) => <span className="text-magenta">{c}</span>;
const F = ({ c }: { c: string }) => <span className="text-cyan">{c}</span>;
const S = ({ c }: { c: string }) => <span className="text-amber">{c}</span>;
const N = ({ c }: { c: string | number }) => <span className="text-magenta">{c}</span>;
const C = ({ c }: { c: string }) => <span className="text-faint">{c}</span>;
const P = ({ c }: { c: string }) => <span className="text-dim">{c}</span>;

type File = { name: string; lang: string; lines: React.ReactNode[] };

const FILES: File[] = [
  {
    name: "hack.ts",
    lang: "TypeScript",
    lines: [
      <><C c="// The Big Hack 2.0, in 12 lines." /></>,
      <><K c="const" /> team = <K c="await" /> <F c="form" />({"{"} size: [<N c={2} />, <N c={4} />], college: <S c='"any"' /> {"}"});</>,
      <><K c="const" /> idea = <K c="await" /> team.<F c="submit" />(<F c="pick" />(tracks)); <C c="// round 1, free" /></>,
      <><K c="if" /> (!(<K c="await" /> <F c="shortlisted" />(idea))) <K c="return" />; <C c="// ₹800 if you are" /></>,
      <><F c="clock" />.<F c="start" />(<S c='"2026-11-20T13:00+05:30"' />, {"{"} hours: <N c={24} /> {"}"});</>,
      <><K c="while" /> (clock.remaining {">"} <N c={0} />) {"{"}</>,
      <>  <F c="build" />(idea); <C c="// an AI agent" /></>,
      <>  <K c="if" /> (clock.<F c="is" />(<S c='"01:00"' />)) <F c="coffee" />(); <C c="// midnight coffee" /></>,
      <>{"}"}</>,
      <></>,
      <><F c="ship" />({"{"} repo, readme, demo {"}"}); <C c="// before 13:00 Saturday" /></>,
      <><F c="pitch" />(judges); <C c={`// ${FACTS.prizePool} on the line`} /></>,
    ],
  },
  {
    name: "README.md",
    lang: "Markdown",
    lines: [
      <><span className="font-bold text-green"># The Big Hack 2.0</span></>,
      <></>,
      <><P c="Tech Habba 2.0's flagship hackathon. Round 1 is free and" /></>,
      <><P c="online: pick an AI-agent track and pitch an idea. If you're" /></>,
      <><P c="shortlisted, build a " /><span className="text-fg">working</span><P c=" agent in 24 hours at AIT." /></>,
      <></>,
      <><span className="font-bold text-green">## When the clock stops</span></>,
      <></>,
      <><P c="The top teams pitch to the judges: problem fit, technical" /></>,
      <><P c="execution, design, and how well you explain it." /></>,
      <></>,
      <><span className="text-green">- </span><P c="Any college. Teams of 2–4. College IDs required." /></>,
      <><span className="text-green">- </span><P c="All code written at the event. Open-source libraries are fine." /></>,
    ],
  },
  {
    name: "event.json",
    lang: "JSON",
    lines: [
      <P c="{" />,
      <>  <F c='"name"' /><P c=": " /><S c='"The Big Hack 2.0"' /><P c="," /></>,
      <>  <F c='"edition"' /><P c=": " /><S c='"Tech Habba 2.0"' /><P c="," /></>,
      <>  <F c='"hacking"' /><P c=": " /><S c='"Fri 20 Nov 13:00 → Sat 21 Nov 13:00 IST"' /><P c="," /></>,
      <>  <F c='"team_size"' /><P c=": [" /><N c={2} /><P c=", " /><N c={4} /><P c="]," /></>,
      <>  <F c='"rounds"' /><P c=": [" /></>,
      <>    <P c="{ " /><F c='"online"' /><P c=": " /><K c="true" /><P c=", " /><F c='"fee_inr"' /><P c=": " /><N c={0} /><P c=" }," /> <C c="// round 1" /></>,
      <>    <P c="{ " /><F c='"online"' /><P c=": " /><K c="false" /><P c=", " /><F c='"fee_inr"' /><P c=": " /><N c={800} /><P c=" }" /> <C c="// shortlisted, per team" /></>,
      <>  <P c="]," /></>,
      <>  <F c='"tracks"' /><P c=": [" /></>,
      ...TRACKS.map((t, i) => <>    <S c={`"${t.slug}"`} />{i < TRACKS.length - 1 && <P c="," />}</>),
      <>  <P c="]," /></>,
      <>  <F c='"prize_pool_inr"' /><P c=": " /><N c={50000} /><P c="," /></>,
      <>  <F c='"open_to"' /><P c=": " /><S c='"any college"' /><P c="," /></>,
      <>  <F c='"host"' /><P c=": " /><S c='"AIT Bengaluru"' /><P c="," /></>,
      <>  <F c='"venue"' /><P c=": " />{FACTS.venue ? <S c={`"${FACTS.venue}"`} /> : <><span className="text-faint">null</span><P c=", " /><C c="// to be announced" /></>}</>,
      <>  <F c='"round_1_closes"' /><P c=": " />{FACTS.deadline ? <S c={`"${FACTS.deadline}"`} /> : <><span className="text-faint">null</span> <C c="// to be announced" /></>}</>,
      <P c="}" />,
    ],
  },
];

/** A small IDE window: explorer, file tabs and highlighted code. Tabs are real tabs. */
export default function Editor() {
  const [active, setActive] = useState(0);
  const id = useId();
  const file = FILES[active];

  return (
    <div className="pane overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-raise px-4 py-2.5 text-xs text-dim">
        <span aria-hidden className="size-2.5 rounded-full bg-red/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-amber/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-green/80" />
        <span className="ml-2 truncate">the-big-hack, branch main</span>
      </div>
      <div className="grid xl:grid-cols-[10rem_1fr]">
        <div className="hidden border-r border-line bg-bg/50 py-3 text-xs xl:block">
          <p className="px-4 pb-2 text-faint">EXPLORER</p>
          <p className="px-4 py-1 text-dim">▾ the-big-hack</p>
          {FILES.map((f, i) => (
            <button
              key={f.name}
              type="button"
              tabIndex={-1}
              onClick={() => setActive(i)}
              className={`block w-full py-1 pl-8 text-left ${i === active ? "bg-green/10 text-green" : "text-dim hover:text-fg"}`}
            >
              {f.name}
            </button>
          ))}
          <p className="px-4 pt-1 text-faint">▸ src</p>
          <p className="px-4 py-1 text-faint">▸ demo</p>
        </div>

        <div className="min-w-0">
          <div role="tablist" aria-label="Files" className="flex overflow-x-auto border-b border-line text-xs">
            {FILES.map((f, i) => (
              <button
                key={f.name}
                role="tab"
                id={`${id}-t${i}`}
                aria-selected={i === active}
                aria-controls={`${id}-p`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const next = (active + (e.key === "ArrowRight" ? 1 : FILES.length - 1)) % FILES.length;
                    setActive(next);
                    document.getElementById(`${id}-t${next}`)?.focus();
                  }
                }}
                className={`min-h-11 shrink-0 border-r border-line px-4 ${i === active ? "border-t-2 border-t-green bg-panel text-fg" : "bg-bg/40 text-dim hover:text-fg"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <div id={`${id}-p`} role="tabpanel" aria-labelledby={`${id}-t${active}`} tabIndex={0} className="overflow-x-auto py-4 text-[12.5px] leading-6 sm:text-[13px] sm:leading-7">
            <ol className="min-w-max">
              {file.lines.map((l, i) => (
                <li key={i} className="flex whitespace-pre pr-6">
                  <span aria-hidden className="w-12 shrink-0 select-none pr-4 text-right text-faint/70">{i + 1}</span>
                  <span className="text-fg">{l}</span>
                </li>
              ))}
            </ol>
          </div>
          <div aria-hidden className="flex justify-between border-t border-line bg-raise px-4 py-1.5 text-[11px] text-faint">
            <span>⎇ main  ✓ 0 problems</span>
            <span>{file.lang}  UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
