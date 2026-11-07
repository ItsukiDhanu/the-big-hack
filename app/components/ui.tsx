import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { REGISTER_URL, TRACKS } from "~/data/hack";
import { useRegistrationOpen } from "~/lib/time";

const isExternal = (href: string) => /^https?:/.test(href);

const base =
  "group inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[4px] px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px";
const variants = {
  primary: "bg-green text-green-ink hover:shadow-[0_0_0_3px_rgb(140_255_122/0.25),0_0_24px_rgb(140_255_122/0.35)]",
  ghost: "border border-line-hi bg-bg text-fg hover:border-green hover:text-green",
};

/** Button-styled link. External links open in a new tab and carry ↗. */
export function Btn({ to, href, variant = "primary", className = "", children }: { to?: string; href?: string; variant?: keyof typeof variants; className?: string; children: React.ReactNode }) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href && isExternal(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <ArrowUpRight aria-hidden className="-mr-1 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return <a href={href} className={cls}>{children}</a>;
}

/** Inline link; external ones get ↗ and open in a new tab. */
export function A({ href, to, children, className = "" }: { href?: string; to?: string; children: React.ReactNode; className?: string }) {
  const cls = `text-cyan underline decoration-cyan/40 underline-offset-4 hover:decoration-cyan ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href && isExternal(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} inline-flex items-center gap-0.5`}>
        {children}
        <ArrowUpRight aria-hidden className="size-3.5" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return <a href={href} className={cls}>{children}</a>;
}

/** Shell prompt: guest@bighack:~/path$ command */
export function Prompt({ path = "~", cmd, className = "" }: { path?: string; cmd?: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm ${className}`}>
      <span className="text-green">guest@bighack</span>
      <span className="text-dim">:</span>
      <span className="text-cyan">{path}</span>
      <span className="text-dim">$ </span>
      {cmd && <span className="text-fg">{cmd}</span>}
    </p>
  );
}

/** Top of every inner page: the command that "produced" it, then the real heading. */
export function PageHead({ path, cmd, title, intro }: { path: string; cmd: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <header className="wrap pt-28 pb-10 md:pt-36 md:pb-14">
      <Prompt path={path} cmd={cmd} />
      <h1 className="glow-soft mt-6 text-4xl font-bold tracking-tight text-fg sm:text-6xl">
        {title}
        <span aria-hidden className="cursor" />
      </h1>
      {intro && <div className="mt-5 max-w-[62ch] leading-relaxed text-dim">{intro}</div>}
    </header>
  );
}

/** TUI pane with its title in the top border. */
export function Pane({ title, children, className = "", as: Tag = "div" }: { title?: React.ReactNode; children: React.ReactNode; className?: string; as?: "div" | "section" | "figure" }) {
  return (
    <Tag className={`pane ${className}`}>
      {title && <span className="pane-title">{title}</span>}
      {children}
    </Tag>
  );
}

/** Value, or a "null // TBA" marker for unconfirmed details. */
export function Tba({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="text-faint">null <span className="text-dim">// to be announced</span></span>;
}

/** The Round 1 submit button. After the deadline it turns into a disabled "round 1 closed" label. */
export function RegisterBtn({ className = "", label = "./submit --idea" }: { className?: string; label?: string }) {
  const open = useRegistrationOpen();
  if (open) return <Btn href={REGISTER_URL} className={className}>{label}</Btn>;
  return (
    <span aria-disabled="true" className={`inline-flex min-h-11 cursor-not-allowed items-center justify-center whitespace-nowrap rounded-[4px] border border-line-hi px-4 text-sm font-semibold text-faint ${className}`}>
      round 1 closed
    </span>
  );
}

const TRACK_CLS: Record<(typeof TRACKS)[number]["color"], string> = {
  green: "border-green/50 text-green",
  cyan: "border-cyan/50 text-cyan",
  red: "border-red/50 text-red",
  amber: "border-amber/50 text-amber",
  magenta: "border-magenta/50 text-magenta",
};

/** GitHub-style `track:` label for one of the five tracks. */
export function TrackLabel({ track, className = "" }: { track: (typeof TRACKS)[number]; className?: string }) {
  return <span className={`inline-block rounded-[3px] border px-1.5 text-xs ${TRACK_CLS[track.color]} ${className}`}>track:{track.slug}</span>;
}
