import { bannerRows } from "~/lib/ascii";

const TOP = bannerRows("THE BIG");
const HACK = bannerRows("HACK");
const EDITION = bannerRows(" 2.0");

/** Block-letter title, with the "2.0" edition in cyan. The real heading text is for screen readers. */
export default function AsciiTitle({ bootIndex = 0 }: { bootIndex?: number }) {
  return (
    <h1 className="boot-title relative w-fit select-none" style={{ "--i": bootIndex } as React.CSSProperties}>
      <span className="sr-only">The Big Hack 2.0</span>
      <pre aria-hidden className="glow-title m-0 whitespace-pre font-mono text-[clamp(6px,2.4vw,24px)] leading-[1.05] text-green">
        {TOP.join("\n")}
        {"\n"}
        {HACK.map((row, i) => (
          <span key={i}>
            {row}
            <span className="text-cyan">{EDITION[i]}</span>
            {i < HACK.length - 1 ? "\n" : ""}
          </span>
        ))}
      </pre>
    </h1>
  );
}
