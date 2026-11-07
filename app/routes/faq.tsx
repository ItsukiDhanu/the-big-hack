import type { Route } from "./+types/faq";
import { Btn, PageHead, RegisterBtn } from "~/components/ui";
import { FAQS } from "~/data/hack";
import { seo } from "~/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({ title: "FAQ", path: "/faq", description: "Questions about The Big Hack 2.0: the two rounds, tracks, fees, the shortlist, who can enter, team size, building rules and staying overnight." });

export default function Faq() {
  return (
    <>
      <PageHead path="~/faq" cmd="bighack --faq" title="Questions" intro="The things people usually ask. Still stuck? The event heads are on the register page." />

      <div className="wrap">
        <ul className="pane divide-y divide-line">
          {FAQS.map((f, i) => (
            <li key={f.q}>
              <details className="group" open={i === 0}>
                <summary className="flex min-h-14 list-none items-center gap-4 px-4 py-4 text-[15px] transition-colors hover:bg-raise sm:px-6 sm:text-base [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="w-8 shrink-0 text-faint group-open:text-green">
                    <span className="group-open:hidden">[+]</span>
                    <span className="hidden group-open:inline">[-]</span>
                  </span>
                  <span className="text-fg group-open:text-green">{f.q}</span>
                </summary>
                <p className="max-w-[68ch] px-4 pb-6 pl-16 leading-relaxed text-dim sm:px-6 sm:pl-[4.5rem]">
                  <span aria-hidden className="text-faint">→ </span>{f.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <RegisterBtn />
          <Btn to="/rules" variant="ghost">man bighack</Btn>
        </div>
      </div>
    </>
  );
}
