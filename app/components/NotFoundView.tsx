import { useLocation } from "react-router";
import { PAGES } from "~/data/hack";
import { Btn, Prompt } from "./ui";

export default function NotFoundView() {
  const { pathname } = useLocation();
  return (
    <section className="wrap flex min-h-[80vh] flex-col justify-center pt-28 pb-16">
      <Prompt cmd={`cd ${pathname}`} />
      <p className="mt-2 text-sm text-red">bash: cd: {pathname}: No such file or directory</p>
      <h1 className="glow-soft mt-10 text-5xl font-bold sm:text-7xl">404<span aria-hidden className="cursor" /></h1>
      <p className="mt-4 max-w-md text-dim">That page doesn't exist. Try one of these instead:</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <li key={p.to}><Btn to={p.to} variant="ghost">cd {p.name}</Btn></li>
        ))}
      </ul>
    </section>
  );
}
