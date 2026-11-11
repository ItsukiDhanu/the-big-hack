import { Link } from "react-router";
import type { Route } from "./+types/rules";
import { PageHead } from "~/components/ui";
import { BRING, ELIGIBILITY, JUDGING, RULES, TRACKS } from "~/data/hack";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "Rules", path: "/rules", description: "Rules for The Big Hack 2.0: the two rounds, tracks, shortlisting, eligibility, building at the event, submissions, judging and conduct." });

function Sect({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 md:grid-cols-[11rem_1fr] md:gap-8">
      <h2 className="font-bold text-fg">{name}</h2>
      <div className="max-w-[70ch] space-y-3 leading-relaxed text-dim">{children}</div>
    </section>
  );
}

function Flag({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-green">{name}</p>
      <p className="mt-1 pl-6">{children}</p>
    </div>
  );
}

export default function Rules() {
  return (
    <>
      <PageHead path="~/rules" cmd="man bighack" title="Rules" intro="The manual. Short version: submit an idea for free, get shortlisted, build what we assign at the event, ship a working demo, be decent." />

      <article className="wrap">
        <div className="pane overflow-hidden">
          <p aria-hidden className="flex justify-between border-b border-line bg-raise px-4 py-2 text-xs text-dim sm:px-8">
            <span>BIGHACK(1)</span><span className="hidden sm:inline">Tech Habba Manual</span><span>BIGHACK(1)</span>
          </p>

          <div className="space-y-10 px-4 py-10 text-sm sm:px-8 sm:text-[15px]">
            <Sect name="NAME">
              <p><span className="text-fg">bighack</span> – Tech Habba 2.0's flagship 24-hour hackathon</p>
            </Sect>

            <Sect name="SYNOPSIS">
              <p className="rounded-[4px] bg-bg px-4 py-3 leading-7 text-fg">
                bighack <span className="text-cyan">--round</span>=<span className="text-magenta">1</span>{" "}
                <span className="text-cyan">--team</span>=<span className="text-magenta">2..4</span>{" "}
                <span className="text-cyan">--track</span>=<span className="text-amber">&lt;track&gt;</span>{" "}
                <span className="text-cyan">--fee</span>=<span className="text-magenta">0</span>{" "}
                <span className="text-cyan">--online</span>
              </p>
              <p className="rounded-[4px] bg-bg px-4 py-3 leading-7 text-fg">
                bighack <span className="text-cyan">--round</span>=<span className="text-magenta">2</span>{" "}
                <span className="text-cyan">--shortlisted</span>{" "}
                <span className="text-cyan">--fee</span>=<span className="text-magenta">800</span>{" "}
                <span className="text-cyan">--duration</span>=<span className="text-magenta">24h</span>{" "}
                <span className="text-cyan">--from</span>=<span className="text-amber">"2026-11-20 13:00 IST"</span>
              </p>
            </Sect>

            <Sect name="TRACKS">
              <p>Pick exactly one. See <Link to="/prizes#tracks" className="text-cyan underline underline-offset-4">prizes(1)</Link>.</p>
              <ul className="space-y-1">
                {TRACKS.map((t) => <li key={t.slug}><span className="text-green">• </span><span className="text-fg">{t.slug}</span>. {t.name}</li>)}
              </ul>
            </Sect>

            <Sect name="ELIGIBILITY">
              <ul className="space-y-1">
                {ELIGIBILITY.map((e) => <li key={e}><span className="text-green">• </span>{e}</li>)}
              </ul>
            </Sect>

            <Sect name="RULES">
              <div className="space-y-5">
                {RULES.filter((r) => r.title !== "Conduct").map((r) => (
                  <Flag key={r.title} name={`--${r.title.toLowerCase().replace(/\s+/g, "-")}`}>{r.body}</Flag>
                ))}
              </div>
            </Sect>

            <Sect name="JUDGING">
              <p>At the end of Round 2, the top teams present their project to the judges, who look at:</p>
              <ul className="space-y-1">
                {JUDGING.map((j) => <li key={j.title}><span className="text-green">• </span><span className="text-fg">{j.title}</span>. {j.body}</li>)}
              </ul>
              <p>Weights will be announced. See <Link to="/prizes" className="text-cyan underline underline-offset-4">prizes(1)</Link>.</p>
            </Sect>

            <Sect name="CONDUCT">
              <p>{RULES.find((r) => r.title === "Conduct")?.body}</p>
            </Sect>

            <Sect name="FILES">
              <p>Things to bring:</p>
              <ul className="space-y-1">
                {BRING.map((b) => <li key={b}><span className="text-green">• </span>{b}</li>)}
              </ul>
              <p>The prize split and final timings are shared with shortlisted teams.</p>
            </Sect>

            <Sect name="SEE ALSO">
              <p>
                <Link to="/faq" className="text-cyan underline underline-offset-4">faq(1)</Link>,{" "}
                <Link to="/schedule" className="text-cyan underline underline-offset-4">schedule(1)</Link>,{" "}
                <Link to="/register" className="text-cyan underline underline-offset-4">register(1)</Link>
              </p>
            </Sect>
          </div>

          <p aria-hidden className="flex justify-between border-t border-line bg-raise px-4 py-2 text-xs text-dim sm:px-8">
            <span>The Big O</span><span>November 2026</span><span>BIGHACK(1)</span>
          </p>
        </div>
        <p className="mt-4 text-xs text-faint">Drafted for the site. Organiser and judge decisions are final.</p>
      </article>
    </>
  );
}
