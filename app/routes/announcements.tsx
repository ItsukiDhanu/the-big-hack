import type { Route } from "./+types/announcements";
import { ArrowRight, CheckCircle2, Clock3, CreditCard, MailCheck, Upload } from "lucide-react";
import { A, Btn, PageHead, Pane } from "~/components/ui";
import { FACTS, PHASE_ONE_TEAMS, PHASE_TWO_TEAMS } from "~/data/hack";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({
    title: "Updates & next steps",
    path: "/announcements",
    description: "How shortlist updates, team sign-in, payment review and seat confirmation work for The Big Hack 2026.",
  });

const STEPS = [
  {
    number: "01",
    icon: ArrowRight,
    title: "Open your team portal",
    body: "Open your team portal using your team’s existing link and sign in with the team leader’s registered email. The portal shows your roster and current status.",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Pay the team fee",
    body: "Pay ₹800 per team through the payment link in your portal. Enter your team name in the payment reference so organisers can match the transaction.",
  },
  {
    number: "03",
    icon: Upload,
    title: "Upload payment proof",
    body: "Upload a clear PNG, JPEG or WebP screenshot of the successful payment. Your status will show as pending while organisers review it.",
  },
  {
    number: "04",
    icon: MailCheck,
    title: "Get your seat confirmed",
    body: "After organisers verify the payment, your status changes to confirmed and the team leader receives an official confirmation email.",
  },
];

export default function Announcements() {
  return (
    <>
      <PageHead
        path="~/announcements"
        cmd="cat announcements/next-steps.txt"
        title="Updates & next steps"
        intro="Round 1 is closed. Here’s how shortlist updates, team access and seat confirmation work."
      />

      <div className="wrap space-y-8 pb-16">
        <section aria-label="Event status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Pane title="round-1" className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-faint">Submissions</p>
            <p className="mt-2 text-lg font-bold text-fg">Closed</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">Organisers have reviewed the submitted ideas and published the shortlists.</p>
          </Pane>
          <Pane title="shortlisting" className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-faint">Selection</p>
            <p className="mt-2 text-lg font-bold text-fg">{PHASE_ONE_TEAMS.length} + {PHASE_TWO_TEAMS.length} teams</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">The shortlist was released in two phases. Names and live seat status are on the Teams page.</p>
          </Pane>
          <Pane title="event-window" className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-faint">Round 2</p>
            <p className="mt-2 text-lg font-bold text-fg">{FACTS.dates}</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">The in-person 24-hour hackathon at Acharya Institute of Technology.</p>
          </Pane>
          <Pane title="build-format" className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-faint">At the event</p>
            <p className="mt-2 text-lg font-bold text-fg">Build for 24 hours</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">Organisers assign each team a problem and track. Submit a repository, README and working demo before hacking ends.</p>
          </Pane>
        </section>

        <section aria-labelledby="next-steps-title">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-green">for shortlisted teams</p>
            <h2 id="next-steps-title" className="mt-2 text-2xl font-bold text-fg">How to confirm your seat</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map(({ number, icon: Icon, title, body }) => (
              <Pane key={number} title={`step-${number}`} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center border border-green/30 bg-green/5 text-green">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-fg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
                  </div>
                </div>
              </Pane>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Btn to="/teams/confirmed">View confirmed teams</Btn>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <Pane title="status-guide" className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-fg">What each status means</h2>
            <dl className="mt-4 divide-y divide-line/70">
              <div className="py-3 sm:flex sm:gap-6">
                <dt className="w-40 shrink-0 text-sm font-semibold text-green">Shortlisted</dt>
                <dd className="mt-1 text-sm leading-relaxed text-dim sm:mt-0">Your team is selected for Round 2. Complete payment and submit its screenshot to request a seat.</dd>
              </div>
              <div className="py-3 sm:flex sm:gap-6">
                <dt className="w-40 shrink-0 text-sm font-semibold text-amber">Pending review</dt>
                <dd className="mt-1 text-sm leading-relaxed text-dim sm:mt-0">The organisers are checking your payment proof. Your seat is not confirmed yet.</dd>
              </div>
              <div className="py-3 sm:flex sm:gap-6">
                <dt className="w-40 shrink-0 text-sm font-semibold text-amber">Needs an update</dt>
                <dd className="mt-1 text-sm leading-relaxed text-dim sm:mt-0">If the screenshot is rejected, read the organiser’s note and upload corrected proof from your portal.</dd>
              </div>
              <div className="py-3 sm:flex sm:gap-6">
                <dt className="w-40 shrink-0 text-sm font-semibold text-green">Confirmed</dt>
                <dd className="mt-1 text-sm leading-relaxed text-dim sm:mt-0">Payment is verified and your seat is confirmed. The team leader is sent an official email.</dd>
              </div>
            </dl>
          </Pane>

          <Pane title="help-and-updates" className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center border border-cyan/30 bg-cyan/5 text-cyan">
                <Clock3 aria-hidden className="size-4" />
              </span>
              <div>
                <h2 className="font-bold text-fg">Need help?</h2>
                <p className="mt-2 text-sm leading-relaxed text-dim">If a payment is rejected, read the organiser’s note in your team portal and upload a corrected screenshot. For other issues, contact the organisers.</p>
                <p className="mt-3 text-sm"><A href="mailto:bigo@acharya.ac.in">bigo@acharya.ac.in</A></p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3 border-t border-line pt-5">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-green" />
              <p className="text-xs leading-relaxed text-faint">A submitted screenshot means your payment is under review. Only the confirmed status secures your seat.</p>
            </div>
          </Pane>
        </section>
      </div>
    </>
  );
}
