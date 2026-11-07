import { SITE } from "~/data/hack";

/** meta() array for a route: title, description, Open Graph and canonical. */
export function seo({ title, description, path = "/" }: { title?: string; description: string; path?: string }) {
  const full = title ? `${title} | The Big Hack 2.0` : "The Big Hack 2.0 | Tech Habba";
  const url = SITE.url + (path === "/" ? "" : path);
  return [
    { title: full },
    { name: "description", content: description },
    { property: "og:title", content: full },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: `${SITE.url}/og.png` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "The Big Hack 2.0: 24-hour hackathon, 20–21 Nov 2026, AIT Bengaluru, ₹50,000 prize pool. Round 1 is free: submit by 10 Nov" },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}
