import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { PAGES, REGISTER_URL } from "~/data/hack";
import { useRegistrationOpen } from "~/lib/time";
import { RegisterBtn } from "./ui";

/** tmux-style tab bar. Number keys 1–6 switch pages when you're not typing. */
export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const regOpen = useRegistrationOpen();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") return setOpen(false);
      const page = PAGES.find((p) => p.key === e.key);
      if (page) navigate(page.to);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const current = PAGES.find((p) => p.to === pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav aria-label="Main" className="wrap flex h-14 items-center gap-3">
        <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2 pr-2" aria-label="The Big Hack 2.0, home">
          <img src="/images/bigo.svg" alt="" width={28} height={24} className="h-6 w-auto" />
          <span className="bg-green px-1.5 py-0.5 text-xs font-bold text-green-ink">[bighack 2.0]</span>
        </Link>

        <ul className="hidden flex-1 items-center lg:flex">
          {PAGES.map((p) => (
            <li key={p.to}>
              <NavLink
                to={p.to}
                end
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center px-2.5 text-[13px] transition-colors ${isActive ? "text-green" : "text-dim hover:text-fg"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? "text-green" : "text-faint"}>{p.key}:</span>
                    {p.name}
                    <span aria-hidden className="w-2 text-green">{isActive ? "*" : ""}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <span className="flex-1 truncate text-sm text-dim lg:hidden">~/{current?.name === "home" ? "" : current?.name ?? ""}</span>

        {regOpen ? (
          <a
            href={REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-10 items-center gap-1.5 rounded-[4px] bg-green px-3.5 text-[13px] font-semibold text-green-ink transition-shadow hover:shadow-[0_0_20px_rgb(140_255_122/0.4)] sm:inline-flex"
          >
            ./submit
            <ArrowUpRight aria-hidden className="size-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span className="hidden min-h-10 items-center rounded-[4px] border border-line-hi px-3.5 text-[13px] text-faint sm:inline-flex">round 1 closed</span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="min-h-11 rounded-[4px] border border-line-hi px-3 text-[13px] text-fg lg:hidden"
        >
          {open ? "[x] close" : "[≡] menu"}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-14 bottom-0 overflow-y-auto border-t border-line bg-bg px-4 pt-6 pb-24 lg:hidden">
          <p className="text-sm text-dim">$ ls ~</p>
          <ul className="mt-4">
            {PAGES.map((p) => (
              <li key={p.to}>
                <NavLink
                  to={p.to}
                  end
                  className={({ isActive }) => `flex min-h-14 items-center gap-3 border-b border-line text-2xl ${isActive ? "text-green" : "text-fg"}`}
                >
                  <span className="text-base text-faint">{p.key}</span>
                  cd {p.name}
                </NavLink>
              </li>
            ))}
          </ul>
          <RegisterBtn className="mt-8 flex min-h-12 w-full" />
        </div>
      )}
    </header>
  );
}
