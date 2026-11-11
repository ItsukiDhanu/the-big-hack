import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CLUB, CONTACTS, FACTS, PAGES, REGISTER_URL, ROUNDS, SCHEDULE, TRACKS } from "~/data/hack";
import { T, phaseAt, tminus } from "~/lib/time";

type Line = { kind: "in" | "out" | "err" | "ok"; text: React.ReactNode };

const HELP: [string, string][] = [
  ["help", "list commands"],
  ["about", "what is The Big Hack 2.0"],
  ["rounds", "how the two rounds work"],
  ["tracks", "the five AI-agent tracks"],
  ["schedule", "the two-day timeline"],
  ["prizes", "prize pool"],
  ["rules", "the short version"],
  ["register", "submit your idea (round 1, free)"],
  ["contact", "event heads"],
  ["date", "time left on the clock"],
  ["ls", "list pages"],
  ["cd <page>", "go to a page"],
  ["git push", "ship your code"],
  ["clear", "clear the screen"],
];

const COMMANDS = [...HELP.map(([c]) => c.split(" ")[0]), "whoami", "coffee", "sudo", "git", "ship", "npm", "exit"];

const SUGGEST = ["help", "rounds", "tracks", "git push", "sudo rm -rf /", "register"];

const WELCOME: Line[] = [
  { kind: "out", text: "the-big-hack dev shell, node 24, branch main" },
  { kind: "out", text: <>Type <b className="text-green">help</b> to see what you can do. Tap a command below if you're on a phone.</> },
];

/** A small fake shell. Commands print event info; `cd` and `register` actually navigate. */
export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  function run(raw: string) {
    const input = raw.trim();
    const echo: Line = { kind: "in", text: input };
    if (!input) return setLines((l) => [...l, echo]);
    setHistory((h) => [input, ...h].slice(0, 50));
    setHIndex(-1);
    const [cmd, ...args] = input.split(/\s+/);
    const out = (kind: Line["kind"], text: React.ReactNode): Line => ({ kind, text });
    let res: Line[] = [];

    switch (cmd.toLowerCase()) {
      case "help":
        res = HELP.map(([c, d]) => out("out", <><span className="inline-block w-28 text-green">{c}</span><span className="text-dim">{d}</span></>));
        break;
      case "about":
        res = [
          out("out", "The Big Hack 2.0 is Tech Habba 2.0's flagship 24-hour hackathon."),
          out("out", `Round 1 is free and online: teams of ${FACTS.teamSize} pick an AI-agent track and submit an idea.`),
          out("out", "Shortlisted teams get a problem statement and track from us and build it over 24 hours at AIT, with meals and a midnight coffee break along the way."),
          out("out", "The top teams pitch to the judges at the end."),
        ];
        break;
      case "rounds":
        res = [
          ...ROUNDS.map((r, i) => out("out", <><span className="text-green">{i + 1}. {r.id.padEnd(17)}</span><span className="text-dim">{r.mode}, {r.when}{r.fee ? `, ${r.fee}` : ""}</span></>)),
          out("out", <span className="text-dim">round 1 is free. you only pay if you're shortlisted.</span>),
        ];
        break;
      case "tracks":
        res = [
          ...TRACKS.map((t) => out("out", <><span className="inline-block w-44 text-cyan">{t.slug}/</span>{t.name}</>)),
          out("out", <span className="text-dim">→ cd prizes for details. pick one when you register.</span>),
        ];
        break;
      case "schedule":
        res = SCHEDULE.flatMap((d) => [
          out("ok", `# ${d.day}, ${d.date}`),
          ...d.slots.map((s) => out("out", <><span className="inline-block w-24 text-dim">{s.time}</span>{s.title}</>)),
        ]);
        res.push(out("out", <span className="text-dim">→ cd schedule for the live log</span>));
        break;
      case "prizes":
        res = [out("ok", `Prize pool: ${FACTS.prizePool}`), out("out", "Split across places and tracks: to be announced.")];
        break;
      case "rules":
        res = [
          out("out", "1. pick a track and submit your idea online by 10 nov (free)"),
          out("out", "2. get shortlisted, then pay ₹800 per team to confirm"),
          out("out", "3. build the problem we assign in 24h at AIT. all code written during the event"),
          out("out", "4. submit repo + README + working demo before hacking ends"),
          out("out", "5. be decent. organiser and judge decisions are final"),
          out("out", <span className="text-dim">→ cd rules for the full manual</span>),
        ];
        break;
      case "register":
        if (Date.now() >= T.regClose) {
          res = [out("err", `round 1 closed on ${FACTS.deadline}. shortlisted? see cd register to confirm your spot.`)];
          break;
        }
        window.open(REGISTER_URL, "_blank", "noopener,noreferrer");
        res = [out("ok", `Opening the round 1 form… free, teams of ${FACTS.teamSize}. Closes ${FACTS.deadline}.`)];
        break;
      case "contact":
        res = [
          ...CONTACTS.map((c) => out("out", `${c.name.padEnd(15)} +91 ${c.phone}  ${c.email}`)),
          out("out", `${"The Big O".padEnd(15)} ${CLUB.email}`),
        ];
        break;
      case "date": {
        const now = Date.now();
        const p = phaseAt(now);
        res = [
          out("out", new Date(now).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }) + " IST"),
          out("ok",
            p === "before" ? `hacking starts in T-${tminus(T.hackStart - now)}`
            : p === "hacking" ? `hacking ends in T-${tminus(T.hackEnd - now)}. keep shipping.`
            : "the clock has stopped. see you next edition."),
        ];
        break;
      }
      case "ls":
        res = [out("out", <span className="text-cyan">{PAGES.map((p) => p.name + "/").join("  ")}</span>)];
        break;
      case "cd": {
        const target = (args[0] ?? "").replace(/^[~./]+/, "").replace(/\/$/, "") || "home";
        const page = PAGES.find((p) => p.name === target.toLowerCase());
        if (page) {
          navigate(page.to);
          return;
        }
        res = [out("err", `cd: ${args[0]}: No such file or directory`)];
        break;
      }
      case "clear":
        setLines([]);
        return;
      case "whoami":
        res = [out("out", "guest. no idea submitted yet. run `register` to fix that.")];
        break;
      case "coffee":
        res = [out("ok", "☕ Midnight coffee is served at 1:00 AM on Saturday.")];
        break;
      case "sudo": {
        const rest = args.join(" ").toLowerCase();
        res =
          rest.startsWith("rm") ? [out("err", "Nice try. The only thing getting deleted here is your sleep schedule.")]
          : rest.startsWith("make") && rest.includes("sandwich") ? [out("ok", "Okay. Dinner is 8:00 PM to 10:00 PM on Friday.")]
          : rest.includes("win") || rest.includes("prize") ? [out("err", `Permission denied. ${FACTS.prizePool} is earned, not sudo'd.`)]
          : [out("err", "guest is not in the sudoers file. This incident will be reported to the judges."), out("out", <span className="text-dim">hint: you don't need root to ship. try <b className="text-green">register</b>.</span>)];
        break;
      }
      case "git":
        res = args[0] === "push"
          ? [out("err", "error: failed to push to 'the-big-hack'. hint: your idea isn't submitted yet."), out("out", <>run <b className="text-green">register</b>, get shortlisted, then push from the venue on 20 Nov.</>)]
          : [out("out", "usage: git push (go on, try it)")];
        break;
      case "ship":
      case "npm":
        res = [
          out("out", "> the-big-hack@1.0.0 build"),
          out("out", "compiling idea… waiting for review (shortlist after 10 nov)"),
          out("ok", "if merged, build resumes 20 nov, 13:00 IST. you have 24h."),
        ];
        break;
      case "exit":
        res = [out("out", "There is no exit. Only ship.")];
        break;
      default:
        res = [out("err", `command not found: ${cmd}. Type 'help'.`)];
    }
    setLines((l) => [...l, echo, ...res]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(value);
      setValue("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(hIndex + 1, history.length - 1);
      if (i >= 0) { setHIndex(i); setValue(history[i]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = hIndex - 1;
      setHIndex(Math.max(i, -1));
      setValue(i >= 0 ? history[i] : "");
    } else if (e.key === "Tab" && value) {
      const match = COMMANDS.find((c) => c.startsWith(value.toLowerCase()));
      if (match) { e.preventDefault(); setValue(match + " "); }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="pane overflow-hidden transition-colors focus-within:border-green/60">
      <div className="flex items-center gap-2 border-b border-line bg-raise px-4 py-2.5 text-xs text-dim">
        <span aria-hidden className="size-2.5 rounded-full bg-red/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-amber/80" />
        <span aria-hidden className="size-2.5 rounded-full bg-green/80" />
        <span className="ml-2">guest@bighack: ~ (try it)</span>
      </div>
      <div
        ref={screenRef}
        onClick={() => inputRef.current?.focus()}
        className="h-[22rem] overflow-y-auto px-4 py-4 text-[13px] leading-relaxed sm:text-sm"
      >
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap break-words ${l.kind === "err" ? "text-red" : l.kind === "ok" ? "text-green" : "text-fg"}`}>
              {l.kind === "in" ? (
                <><span className="text-green">guest@bighack</span><span className="text-dim">:</span><span className="text-cyan">~</span><span className="text-dim">$ </span>{l.text}</>
              ) : l.text}
            </div>
          ))}
        </div>
        <div className="flex items-center">
          <label htmlFor="term-input" className="shrink-0">
            <span className="text-green">guest@bighack</span><span className="text-dim">:</span><span className="text-cyan">~</span><span className="text-dim">$&nbsp;</span>
            <span className="sr-only">Command</span>
          </label>
          <input
            id="term-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent text-fg caret-green outline-none focus-visible:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        {SUGGEST.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { run(s); inputRef.current?.focus({ preventScroll: true }); }}
            className="min-h-10 rounded-[4px] border border-line-hi px-3 text-xs text-dim transition-colors hover:border-green hover:text-green"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
