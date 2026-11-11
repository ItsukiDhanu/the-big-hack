import { useState } from "react";
import { Link } from "react-router";
import { Mail, Phone } from "lucide-react";
import type { Route } from "./+types/register";
import Pipeline from "~/components/Pipeline";
import { A, Btn, PageHead, Pane, Prompt, RegisterBtn, Tba } from "~/components/ui";
import { CLUB, CONTACTS, FACTS, ROUND2 } from "~/data/hack";
import { T, useNow } from "~/lib/time";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "Register", path: "/register", description: "Submit your idea for The Big Hack 2.0. Round 1 is free and online, closing 10 Nov. Shortlisted teams pay ₹800 per team for the 24-hour Round 2 at AIT." });

const CHECKS = [
  { id: "team", label: "Team of 2 to 4 people, ready to go" },
  { id: "track", label: <>Picked one of the <Link to="/prizes#tracks" className="text-cyan underline underline-offset-4">five tracks</Link></> },
  { id: "idea", label: "Idea written up: the problem, your agent, your stack" },
  { id: "id", label: "Every member has a college ID card" },
  { id: "rules", label: <>Read the <Link to="/rules" className="text-cyan underline underline-offset-4">rules</Link></> },
];

export default function Register() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = CHECKS.filter((c) => done[c.id]).length;
  const all = count === CHECKS.length;
  const now = useNow(60_000);
  const closed = now !== null && now >= T.regClose;
  const daysLeft = now === null ? null : Math.ceil((T.regClose - now) / 86_400_000);

  return (
    <>
      <PageHead
        path="~/register"
        cmd={'gh pr create --title "our idea"'}
        title="Submit your idea"
        intro={closed
          ? "Round 1 closed on 10 November 2026. The shortlist is announced a few days later; shortlisted teams confirm their spot below."
          : <>Round 1 is <span className="text-green">free</span> and online: one form per team, closing 10 November at 11:59 PM IST. Think of it as opening a pull request. If it's merged (shortlisted), you pay {FACTS.round2Fee} and build a problem statement we assign, at AIT.</>}
      />

      <div className="wrap mb-10">
        <Pipeline />
      </div>

      <div className="wrap grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-10">
          <Pane title="round-1 · PULL_REQUEST_TEMPLATE.md" className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-fg"><span className="text-green">## </span>Round 1: before you submit <span className="text-sm font-normal text-faint">({count}/{CHECKS.length})</span></h2>
            <ul className="mt-6 space-y-1">
              {CHECKS.map((c) => (
                <li key={c.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[4px] px-2 hover:bg-raise">
                    <input
                      type="checkbox"
                      checked={!!done[c.id]}
                      onChange={(e) => setDone((d) => ({ ...d, [c.id]: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <span aria-hidden className="shrink-0 text-faint peer-checked:text-green peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-green">
                      {done[c.id] ? "[x]" : "[ ]"}
                    </span>
                    <span className={done[c.id] ? "text-fg" : "text-dim"}>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <p className={`mt-6 text-sm ${closed ? "text-red" : all ? "text-green" : "text-faint"}`} aria-live="polite">
              {closed ? "> round 1 is closed. the form no longer accepts ideas." : all ? "✓ all checks passed. ready to open your PR." : "> tick the boxes, or skip straight to the form."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-8">
              <RegisterBtn className={all ? "shadow-[0_0_28px_rgb(140_255_122/0.45)]" : ""} />
              <span className="text-sm text-dim"><span className="text-green">Free.</span> Teams of {FACTS.teamSize}.</span>
            </div>
            <dl className="mt-8 grid gap-2 text-sm sm:grid-cols-[11rem_1fr]">
              <dt className="text-faint">round 1 closes</dt>
              <dd>
                <Tba value={FACTS.deadline} />
                {daysLeft !== null && !closed && <span className="ml-2 text-amber">({daysLeft === 1 ? "last day" : `${daysLeft} days left`})</span>}
                {closed && <span className="ml-2 text-red">(closed)</span>}
              </dd>
            </dl>
          </Pane>

          <Pane title="round-2 · merge" className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-fg"><span className="text-green">## </span>Round 2: shortlisted teams</h2>
            <p className="mt-4 leading-relaxed text-dim">
              If your idea is shortlisted, confirm your spot by paying <span className="text-amber">{FACTS.round2Fee}</span>.
              That gets your team into the 24-hour build at AIT on 20–21 November, meals and midnight coffee included.
              Not shortlisted? You pay nothing.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-8">
              {ROUND2.paymentUrl ? (
                <Btn href={ROUND2.paymentUrl}>./confirm --pay 800</Btn>
              ) : (
                <span aria-disabled="true" className="inline-flex min-h-11 cursor-not-allowed items-center rounded-[4px] border border-line-hi px-4 text-sm font-semibold text-faint">
                  ./confirm --pay 800
                </span>
              )}
              <span className="text-sm text-dim">{ROUND2.paymentUrl ? "Shortlisted teams only." : "Opens when the shortlist is announced."}</span>
            </div>
            <dl className="mt-8 grid gap-2 text-sm sm:grid-cols-[11rem_1fr]">
              <dt className="text-faint">shortlist</dt>
              <dd>
                {ROUND2.shortlistUrl ? <A href={ROUND2.shortlistUrl}>{ROUND2.shortlistDate ?? "see the list"}</A> : <Tba value={ROUND2.shortlistDate} />}
              </dd>
              <dt className="text-faint">pay by</dt>
              <dd><Tba value={ROUND2.paymentDeadline} /></dd>
              <dt className="text-faint">venue</dt>
              <dd><Tba value={FACTS.venue} /></dd>
            </dl>
          </Pane>
        </div>

        <section aria-labelledby="contact-h">
          <Prompt path="~/register" cmd="cat CODEOWNERS" />
          <h2 id="contact-h" className="mt-4 text-2xl font-bold">Questions? Ping a maintainer.</h2>
          <ul className="mt-6 space-y-4">
            {CONTACTS.map((c) => (
              <li key={c.name}>
                <Pane className="p-5 text-sm">
                  <p className="text-xs text-faint">@{c.name.split(" ")[0].toLowerCase()}</p>
                  <p className="mt-1 text-lg text-fg">{c.name}</p>
                  <p className="text-dim">{c.role}</p>
                  <div className="mt-3 flex flex-col">
                    <a href={`tel:+91${c.phone}`} className="inline-flex min-h-11 items-center gap-3 text-dim hover:text-green">
                      <Phone aria-hidden className="size-4" /> <span className="tabular-nums">+91 {c.phone.slice(0, 5)} {c.phone.slice(5)}</span>
                    </a>
                    <a href={`mailto:${c.email}`} className="inline-flex min-h-11 items-center gap-3 break-all text-dim hover:text-green">
                      <Mail aria-hidden className="size-4 shrink-0" /> {c.email}
                    </a>
                  </div>
                </Pane>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-dim">
            Or write to {CLUB.name} at <A href={`mailto:${CLUB.email}`}>{CLUB.email}</A>, or join the{" "}
            <A href={CLUB.socials.find((s) => s.platform === "WhatsApp")!.url}>WhatsApp community</A>.
          </p>
        </section>
      </div>
    </>
  );
}
