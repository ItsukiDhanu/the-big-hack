# The Big Hack 2.0

Site for The Big Hack 2.0, the 24-hour flagship hackathon of Tech Habba 2.0 (20–21 Nov 2026, AIT Bengaluru).
Terminal-style design (JetBrains Mono, phosphor green, tmux tabs, live status bar, a working command line on the home page).
Pages: `/`, `/schedule`, `/prizes`, `/rules`, `/faq`, `/register`. Number keys 1–6 switch pages.
Stack: React Router v8 (static prerender), Vite, Tailwind CSS v4, TypeScript.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in build/client
```

## Editing content

Everything the page says lives in `app/data/hack.ts`. Unconfirmed values are `null` and show as "To be announced":

- `FACTS.venue`, `FACTS.deadline`
- Prize split, problem statements/tracks and judging weights are "to be announced" copy in `app/routes/prizes.tsx`
- Terminal commands live in `app/components/Terminal.tsx`

Live at https://the-big-hack.vercel.app (`SITE.url`, used by canonical and OG tags). `vercel deploy --prod` updates it.

Registration closes at `TIMES.registrationCloses` (10 Nov 2026, 11:59 PM IST); after that every register button switches to "registration closed" on its own. `public/og.png` is the social preview image.

See `BRIEF.md` for the full handoff brief and open questions for the organisers.
