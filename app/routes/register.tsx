import { Mail, Phone } from "lucide-react";
import type { Route } from "./+types/register";
import Pipeline from "~/components/Pipeline";
import { A, PageHead, Pane, Prompt } from "~/components/ui";
import { CLUB, CONTACTS } from "~/data/hack";
import { T, useNow } from "~/lib/time";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "Registration information", path: "/register", description: "The Big Hack 2026 round status and event head contact details." });

export default function RegistrationInfo() {
  const now = useNow(60_000);
  const roundOneClosed = now !== null && now >= T.regClose;

  return (
    <>
      <PageHead
        path="~/register"
        cmd="cat round-status"
        title="Event contacts"
        intro={roundOneClosed
          ? "Round 1 is closed and both shortlist phases are published. See how shortlisted teams access their portal and confirm a seat."
          : "Round 1 is free and online. Check the Teams page for shortlist updates and announcements for next steps."}
      />

      <div className="wrap mb-10">
        <Pipeline />
      </div>

      <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="updates-h" className="space-y-5">
          <Pane title="phase-status" className="p-6">
            <h2 id="updates-h" className="font-bold text-fg">Shortlist & next steps</h2>
            <p className="mt-3 text-sm leading-relaxed text-dim">
              Shortlisted teams can sign in with the leader’s registered email, submit payment proof and track organiser review in the team portal.
            </p>
            <p className="mt-4"><A to="/teams/confirmed">Browse confirmed teams</A></p>
            <p className="mt-2"><A to="/announcements">How shortlist and payment review work</A></p>
          </Pane>
        </section>

        <section aria-labelledby="contact-h">
          <Prompt path="~/register" cmd="cat CODEOWNERS" />
          <h2 id="contact-h" className="mt-4 text-2xl font-bold">Event contacts</h2>
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
