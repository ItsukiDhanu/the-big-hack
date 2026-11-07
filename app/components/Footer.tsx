import { Link } from "react-router";
import { CLUB, PAGES, SITE } from "~/data/hack";
import { A } from "./ui";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-8">
      <div className="wrap py-12">
        <p aria-hidden className="text-xs text-faint">── EOF ─────────────────────────────────────────</p>
        <div className="mt-8 grid gap-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-fg">The Big Hack 2.0</p>
            <p className="mt-2 max-w-[44ch] leading-relaxed text-dim">
              The flagship 24-hour hackathon of <A href={SITE.mainSite}>Tech Habba 2.0</A>, built and run by {CLUB.name}, the
              coding and cybersecurity club of Acharya Institute of Technology, Bengaluru.
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="text-faint">pages/</p>
            <ul className="mt-2">
              {PAGES.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="inline-flex min-h-9 items-center text-dim hover:text-green">./{p.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-faint">the-big-o/</p>
            <ul className="mt-2">
              {CLUB.socials.map((s) => (
                <li key={s.platform}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-dim hover:text-green">
                    {s.platform.toLowerCase()} ↗<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${CLUB.email}`} className="inline-flex min-h-9 items-center text-dim hover:text-green">{CLUB.email}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Tech Habba. Acharya Institutes × The Big O. Press 1–6 to switch pages.</p>
          <p>
            <span className="text-faint">// git blame:</span>{" "}
            <a href="mailto:dhanushvpshetty@gmail.com" className="inline-flex min-h-9 items-center text-dim hover:text-green">dhanushvpshetty@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
