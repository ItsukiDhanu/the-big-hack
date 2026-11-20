import { Link } from "react-router";
import type { Route } from "./+types/home";
import AsciiTitle from "~/components/AsciiTitle";
import Terminal from "~/components/Terminal";
import Editor from "~/components/Editor";
import Pipeline from "~/components/Pipeline";
import { A, Btn, Pane, Prompt, TrackLabel } from "~/components/ui";
import { FACTS, FAQS, OTHER_EVENTS, PARTNERS, SCHEDULE, SITE, TRACKS } from "~/data/hack";
import { T, pad, phaseAt, split, useNow } from "~/lib/time";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ description: "The Big Hack 2026 shortlist, team portal, payment review steps and event information. Hosted by Tech Habba 2.0 at Acharya Institute of Technology, Bengaluru." });

const BOOT = [
  { s: "✓", t: "scaffolding team ......... 2–4 members", c: "text-green" },
  { s: "✓", t: "installing ideas ......... 5 AI-agent tracks", c: "text-green" },
  { s: "✓", t: "provisioning prize pool .. ₹50,000", c: "text-green" },
  { s: "!", t: "peer dep: tea ............ refill 01:00", c: "text-amber" },
  { s: "→", t: "ready. build starts 20 nov 13:00 IST", c: "text-cyan" },
];

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <Rounds />
      <Overview />
      <GitLog />
      <Shell />
      <Directory />
      <Partners />
      <MoreEvents />
    </>
  );
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="dots absolute inset-0" />
      <div className="wrap relative flex min-h-[100svh] flex-col justify-center pt-24 pb-16">
        <div aria-hidden className="text-xs leading-6 sm:text-[13px]">
          <Prompt cmd="npx create-hackathon bighack" className="boot" />
          {BOOT.map((b, n) => (
            <p key={b.t} className="boot text-dim" style={i(n + 1)}><span className={`inline-block w-5 ${b.c}`}>{b.s}</span>{b.t}</p>
          ))}
        </div>

        <div className="mt-8">
          <AsciiTitle bootIndex={BOOT.length + 1} />
        </div>

        <div className="boot mt-8 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end" style={i(BOOT.length + 3)}>
          <div>
            <p className="max-w-[54ch] text-lg leading-relaxed text-fg sm:text-xl">
              <span className="text-green">&gt;</span> 24 hours. 2–4 hackers. One working demo.
              <br />
              <span className="text-dim">Tech Habba 2.0's flagship hackathon. 20–21 Nov 2026, AIT Bengaluru.</span>
            </p>
            <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-dim">
              <span className="text-green">Both shortlist phases are published.</span> Browse the teams, check your status and see how payment review confirms your seat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn to="/teams/confirmed" variant="ghost">confirmed teams</Btn>
              <Btn to="/announcements" variant="ghost">how it works</Btn>
              <Btn to="/register" variant="ghost">event contacts</Btn>
            </div>
          </div>
          <Countdown />
        </div>
      </div>
    </section>
  );
}

function Countdown() {
  const now = useNow();
  const phase = now === null ? "before" : phaseAt(now);
  const target = phase === "hacking" ? T.hackEnd : T.hackStart;
  const parts = now === null ? null : split(target - now);

  if (phase === "pitching" || phase === "over") {
    return (
      <Pane title="clock" className="px-5 py-6">
        <p className="text-green">{phase === "pitching" ? "hacking over. pitches and closing today." : "that's a wrap. see you next edition."}</p>
      </Pane>
    );
  }

  const cells = [
    { k: "days", v: parts?.d },
    { k: "hrs", v: parts?.h },
    { k: "min", v: parts?.m },
    { k: "sec", v: parts?.s },
  ];
  return (
    <Pane title={phase === "hacking" ? "● live: hacking ends in" : "hacking starts in"} className="w-fit px-5 pt-6 pb-4">
      <p className="sr-only">
        {parts ? `${parts.d} days, ${parts.h} hours and ${parts.m} minutes ${phase === "hacking" ? "until hacking ends" : "until hacking starts"}` : ""}
      </p>
      <div aria-hidden className="flex items-start">
        <span className="pt-0.5 pr-2 text-2xl text-faint sm:text-4xl">T-</span>
        {cells.map((c, n) => (
          <div key={c.k} className="flex items-start">
            {n > 0 && <span className="px-1 text-2xl text-faint sm:text-4xl">:</span>}
            <div className="text-center">
              <span className="glow block w-[2ch] text-3xl font-bold tabular-nums text-green sm:text-5xl">{c.v === undefined ? "--" : pad(c.v)}</span>
              <span className="mt-1 block text-[11px] text-dim">{c.k}</span>
            </div>
          </div>
        ))}
      </div>
    </Pane>
  );
}

/* -------------------------------------------------------------- ticker */

const TICKER = ["phase 1: 50 teams", "phase 2: 40 teams", "shortlisted teams pay ₹800/team", "5 AI-agent tracks", `${FACTS.prizePool} prize pool`, "teams of 2–4", "open to every college", "20–21 nov 2026", "midnight tea at 1 AM", "morning tea at 5 AM"];

function Ticker() {
  const run = [...TICKER, ...TICKER];
  return (
    <div aria-hidden className="ticker overflow-hidden border-y border-line bg-green py-2.5 text-sm font-bold text-green-ink">
      <div className="ticker-track flex w-max">
        {run.map((t, n) => (
          <span key={n} className="flex items-center whitespace-nowrap uppercase">
            <span className="px-5">{t}</span>
            <span>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- rounds */

function Rounds() {
  return (
    <section aria-labelledby="rounds-h" className="wrap py-20 md:py-28">
      <Prompt cmd="cat .github/workflows/bighack.yml" />
      <h2 id="rounds-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Two rounds. The first one's free.</h2>
      <p className="mt-4 max-w-[60ch] leading-relaxed text-dim">
        Round 1 was free and online. The two shortlist phases are published: 50 teams in Phase 1 and 40 in Phase 2.
        Shortlisted teams can check their status and payment review in the team portal.
      </p>
      <Pipeline className="mt-10" />
      <div className="mt-10">
        <Prompt cmd="ls tracks/" />
        <ul className="mt-4 flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <li key={t.slug}>
              <Link to={`/prizes#${t.slug}`} className="flex min-h-11 items-center gap-2 rounded-[4px] border border-line px-3 text-sm text-fg transition-colors hover:border-line-hi hover:bg-raise">
                <TrackLabel track={t} />
                <span className="hidden sm:inline">{t.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ overview */

function Overview() {
  return (
    <section aria-labelledby="overview-h" className="wrap grid gap-10 border-t border-line py-20 md:py-28 lg:grid-cols-[1fr_2.1fr] lg:items-center">
      <div>
        <Prompt cmd="code ." />
        <h2 id="overview-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Idea at lunch. Demo by lunch.</h2>
        <p className="mt-4 max-w-[42ch] leading-relaxed text-dim">
          Shortlisted teams of 2–4 get a problem statement and track from us and turn it into a working AI agent over 24 hours. Then they ship
          the repo, a README and a live demo, and pitch it.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-line bg-line text-sm">
          {[
            { k: "build time", v: "24h" },
            { k: "team", v: FACTS.teamSize },
            { k: "round 1", v: "free, online" },
            { k: "round 2", v: "₹800 / team" },
            { k: "prize pool", v: FACTS.prizePool },
            { k: "tracks", v: `${TRACKS.length} AI-agent tracks` },
          ].map((f) => (
            <div key={f.k} className="bg-bg px-4 py-3">
              <dt className="text-xs text-faint">{f.k}</dt>
              <dd className="mt-1 text-fg">{f.v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Btn to="/rules" variant="ghost">read the rules</Btn>
          <Btn to="/faq" variant="ghost">faq</Btn>
        </div>
      </div>
      <Editor />
    </section>
  );
}

/* -------------------------------------------------------------- git log */

/** Illustrative commit history of a team's 24 hours, pinned to the real schedule. */
const COMMITS = [
  { h: "a1f3c9e", t: "fri 13:04", m: "chore: init repo, assigned problem checked out", tag: "HEAD~11" },
  { h: "b72d014", t: "fri 14:30", m: "feat: wireframes and data model" },
  { h: "c0e88a1", t: "fri 17:00", m: "chore: Google Form + snacks", meal: true },
  { h: "d41f6b2", t: "fri 19:15", m: "feat: core flow works end to end" },
  { h: "e9a0c33", t: "fri 20:00", m: "chore: dinner", meal: true },
  { h: "f15be77", t: "fri 21:30", m: "test: Round 1 evaluation" },
  { h: "0a7d2c8", t: "sat 01:00", m: "chore: midnight tea", meal: true },
  { h: "1bc93fe", t: "sat 05:00", m: "chore: morning tea", meal: true },
  { h: "2d5e019", t: "sat 11:00", m: "test: Round 2 evaluation" },
  { h: "3f08ab4", t: "sat 12:58", m: "release: v1.0.0, submitted", tag: "HEAD", win: true },
];

function GitLog() {
  return (
    <section aria-labelledby="gitlog-h" className="border-t border-line py-20 md:py-28">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.7fr]">
        <div>
          <Prompt cmd="git log --graph --oneline" />
          <h2 id="gitlog-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">What 24 hours looks like</h2>
          <p className="mt-4 max-w-[40ch] leading-relaxed text-dim">
            An example team's commit history. The meal breaks are real; the bugs are up to you.
          </p>
          <div className="mt-8"><Btn to="/schedule" variant="ghost">see the real schedule</Btn></div>
        </div>
        <Pane title="example-team/main" className="py-6">
          <div className="overflow-x-auto px-4 sm:px-6">
          <ol className="relative min-w-max text-[13px] sm:text-sm">
            <span aria-hidden className="absolute top-5 bottom-5 left-[7.5px] w-px bg-line-hi" />
            {COMMITS.map((c) => (
              <li key={c.h} className="relative flex items-center gap-4 py-2">
                <span aria-hidden className="relative flex w-4 shrink-0 justify-center">
                  <span className={`size-2.5 rounded-full border-2 ${c.win ? "border-green bg-green" : c.meal ? "border-amber bg-panel" : "border-cyan bg-panel"}`} />
                </span>
                <span className="text-amber/80">{c.h}</span>
                <span className="w-20 text-faint">{c.t}</span>
                <span className={c.win ? "font-bold text-green" : c.meal ? "text-dim" : "text-fg"}>{c.m}</span>
                {c.tag && <span className={`rounded-[3px] border px-1.5 text-[11px] ${c.win ? "border-green/50 text-green" : "border-line-hi text-faint"}`}>{c.tag}</span>}
              </li>
            ))}
          </ol>
          </div>
        </Pane>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- shell */

function Shell() {
  return (
    <section aria-labelledby="shell-h" className="border-t border-line py-20 md:py-28">
      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-center">
        <div>
          <Prompt cmd="bash" />
          <h2 id="shell-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Don't want to read? Ask the shell.</h2>
          <p className="mt-4 max-w-[40ch] leading-relaxed text-dim">
            Type <span className="text-green">help</span>, <span className="text-green">schedule</span> or{" "}
            <span className="text-green">tracks</span>. <span className="text-green">cd teams</span> lists shortlisted teams;{" "}
            <span className="text-green">cd announcements</span> explains team access, payment review and seat confirmation. Tab completes and ↑ recalls history.
          </p>
        </div>
        <Terminal />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- directory */

const DIRS = [
  { to: "/schedule", name: "schedule/", desc: "Live log of both days and the 24-hour clock", meta: `${SCHEDULE.reduce((n, d) => n + d.slots.length, 0)} entries` },
  { to: "/prizes", name: "prizes/", desc: "₹50,000 pool, the 5 tracks and judging", meta: `${TRACKS.length} tracks` },
  { to: "/rules", name: "rules/", desc: "The manual: eligibility, rules, submission", meta: "man page" },
  { to: "/faq", name: "faq/", desc: "Rounds, tracks, fees, shortlist, overnight", meta: `${FAQS.length} answers` },
  { to: "/announcements", name: "announcements/", desc: "Shortlist, payment review and seat confirmation", meta: "how it works" },
  { to: "/register", name: "contacts/", desc: "Event head contact details and round information", meta: "event info" },
];

function Directory() {
  return (
    <section aria-labelledby="dir-h" className="border-t border-line py-20 md:py-28">
      <div className="wrap">
        <Prompt cmd="ls -l ~" />
        <h2 id="dir-h" className="sr-only">Pages</h2>
        <ul className="mt-6 border-t border-line">
          {DIRS.map((d) => (
            <li key={d.to}>
              <Link to={d.to} className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 border-b border-line py-5 transition-colors hover:bg-raise sm:grid-cols-[7rem_12rem_1fr_auto] sm:px-3">
                <span className="hidden text-xs text-faint sm:block">drwxr-xr-x</span>
                <span className="text-xl font-bold text-cyan group-hover:text-green sm:text-2xl">{d.name}</span>
                <span className="col-span-2 text-sm text-dim sm:col-span-1">{d.desc}</span>
                <span className="col-start-2 row-start-1 text-right text-xs text-faint sm:col-start-auto sm:row-start-auto">
                  {d.meta} <span className="text-green">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ partners */

function Partners() {
  return (
    <section aria-labelledby="partners-h" className="border-t border-line py-20 md:py-28">
      <div className="wrap">
        <Prompt cmd="ls ../tech-habba/partners" />
        <h2 id="partners-h" className="mt-4 text-3xl font-bold sm:text-4xl">Tech Habba partners</h2>
        <p className="mt-3 text-sm text-dim">Partners of Tech Habba, the fest The Big Hack 2.0 is part of.</p>
        <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
          {PARTNERS.map((p) => (
            <li key={p.name} className="flex min-h-36 flex-col justify-between gap-6 bg-bg p-5">
              <img src={p.logo} alt={p.name} loading="lazy" className="h-8 w-auto max-w-[8rem] object-contain object-left opacity-85" />
              <span className="text-xs leading-snug text-faint">{p.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- more events */

function MoreEvents() {
  return (
    <section aria-labelledby="more-h" className="border-t border-line py-20 md:py-28">
      <div className="wrap">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Prompt cmd="ls -la ../tech-habba/events" />
            <h2 id="more-h" className="mt-4 text-3xl font-bold sm:text-4xl">More at Tech Habba 2.0</h2>
            <p className="mt-3 text-sm text-dim">Twelve more events from 19 to 21 November. Each link opens its page on the main site.</p>
          </div>
          <A href={SITE.mainSite} className="shrink-0 text-sm">tech-habba26.vercel.app</A>
        </div>
        <ul className="mt-8 text-sm">
          {OTHER_EVENTS.map((e) => (
            <li key={e.slug}>
              <a
                href={`${SITE.mainSite}/events/${e.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-11 items-center gap-4 border-b border-line/60 py-2 whitespace-nowrap hover:bg-raise sm:px-3"
              >
                <span className="hidden text-faint md:inline">drwxr-xr-x</span>
                <span className="hidden text-faint md:inline">thebigo</span>
                <span className="w-14 shrink-0 text-dim">{e.day.toLowerCase()}</span>
                <span className="hidden w-20 shrink-0 text-dim tabular-nums sm:inline">{e.time}</span>
                <span className="truncate text-cyan group-hover:text-green">{e.slug}/</span>
                <span aria-hidden className="ml-auto text-faint group-hover:text-green">↗</span>
                <span className="sr-only">{e.title} (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
