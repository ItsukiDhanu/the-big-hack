import type { Route } from "./+types/prizes";
import { PageHead, Pane, Prompt, RegisterBtn, TrackLabel } from "~/components/ui";
import { FACTS, JUDGING, TRACKS } from "~/data/hack";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "Prizes and tracks", path: "/prizes", description: "₹50,000 prize pool at The Big Hack 2.0. Five AI-agent tracks: autonomous, voice and multimodal, healthcare, smart mobility and infrastructure, and cybersecurity. How projects are judged." });

const RELEASES = [
  { tag: "v1.0.0", name: "1st place" },
  { tag: "v0.9.0", name: "2nd place" },
  { tag: "v0.8.0", name: "3rd place" },
  { tag: "track/*", name: "Special tracks" },
];

/** Amber hollow dot, like a pending CI check. */
const Pending = () => <span aria-hidden className="inline-block size-3 shrink-0 rounded-full border-2 border-amber border-t-transparent motion-safe:animate-spin" />;

export default function Prizes() {
  return (
    <>
      <PageHead
        path="~/prizes"
        cmd="gh release list"
        title="Prizes and tracks"
        intro="What you're building for, what you'll build and how it's judged."
      />

      <div className="wrap space-y-20">
        <section aria-labelledby="pool-h" className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Pane title="prize_pool" className="flex flex-col justify-between gap-10 p-6 sm:p-10">
            <div>
              <h2 id="pool-h" className="text-sm text-dim">Total prize pool</h2>
              <p className="glow mt-4 text-[clamp(3.5rem,13vw,8rem)] font-extrabold leading-none tracking-tight text-green tabular-nums">
                {FACTS.prizePool}
              </p>
            </div>
            <RegisterBtn className="w-fit" />
          </Pane>

          <Pane title="releases" className="p-6 sm:p-8">
            <h2 className="text-sm text-dim">How it's split</h2>
            <ul className="mt-5 divide-y divide-line/60">
              {RELEASES.map((r, i) => (
                <li key={r.tag} className="flex items-center justify-between gap-4 py-4">
                  <span className="flex items-center gap-3">
                    <span className={`rounded-[3px] border px-1.5 text-xs ${i === 0 ? "border-green/50 text-green" : "border-line-hi text-dim"}`}>{r.tag}</span>
                    <span className="text-fg">{r.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-amber"><Pending /> to be announced</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-dim">The split is announced here and shared with shortlisted teams.</p>
          </Pane>
        </section>

        <section id="tracks" aria-labelledby="ps-h" className="grid scroll-mt-24 gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Prompt path="~/prizes" cmd="gh issue list --label track" />
            <h2 id="ps-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Five tracks, all AI agents</h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-dim">
              Pick one when you submit your Round 1 idea. In Round 2 the organisers give each shortlisted team its
              problem statement and track to build at AIT. Every track is about agents: software that doesn't just answer, but acts.
            </p>
          </div>

          <Pane className="overflow-hidden">
            <div className="flex items-center gap-5 border-b border-line bg-raise px-5 py-3 text-xs">
              <span className="text-fg">◉ {TRACKS.length} open</span>
              <span className="text-faint">✓ 0 closed</span>
              <span className="ml-auto text-dim">round 1 closes 10 Nov</span>
            </div>
            <ul className="divide-y divide-line/60">
              {TRACKS.map((t, i) => (
                <li key={t.slug} id={t.slug} className="flex scroll-mt-24 gap-4 px-5 py-4">
                  <span className="pt-0.5 text-sm text-faint">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="font-bold text-fg">{t.name}</h3>
                      <TrackLabel track={t} />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-dim">{t.blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Pane>
        </section>

        <section aria-labelledby="judge-h" className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Prompt path="~/prizes" cmd="gh pr checks" />
            <h2 id="judge-h" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">How projects are judged</h2>
            <p className="mt-4 max-w-[46ch] leading-relaxed text-dim">
              After hacking ends in Round 2, the top teams pitch to the judges. Think of it as the review your project has to
              pass. Weights will be announced.
            </p>
          </div>
          <Pane className="overflow-hidden">
            <p className="flex items-center gap-3 border-b border-line bg-raise px-5 py-3 text-sm">
              <Pending />
              <span className="text-fg">{JUDGING.length} checks</span>
              <span className="text-faint">waiting for your pitch</span>
            </p>
            <ul className="divide-y divide-line/60">
              {JUDGING.map((j) => (
                <li key={j.title} className="flex gap-4 px-5 py-4">
                  <span className="pt-1"><Pending /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="font-bold text-fg">{j.title}</h3>
                      <span className="text-xs text-faint">weight: TBA</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-dim">{j.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Pane>
        </section>
      </div>
    </>
  );
}
