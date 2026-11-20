# The Big Hack 2.0

Site for The Big Hack 2.0, the 24-hour flagship hackathon of Tech Habba 2.0 (20–21 Nov 2026, AIT Bengaluru).
Terminal-style design (JetBrains Mono, phosphor green, tmux tabs, live status bar, a working command line on the home page).
Pages: `/`, `/schedule`, `/prizes`, `/rules`, `/faq`, `/announcements`, `/teams/shortlisted`, `/teams/confirmed`, and `/register` (event contacts). `/admin` is an unlisted, authenticated organiser page. Number keys 1–8 switch public pages.
Stack: React Router v8 (static prerender), Vite, Tailwind CSS v4, TypeScript.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in build/client
```

## Editing content

Everything the page says lives in `app/data/hack.ts`. Unconfirmed values are `null` and show as "To be announced":

- `FACTS.venue`, `FACTS.deadline`
- Round 2 track and problem statement labels are maintained in `app/data/round2.ts`; choices stay closed until `ROUND2_CHOICES_CONFIGURED` is enabled after the final labels are added.
- Prize split and judging weights are "to be announced" copy in `app/routes/prizes.tsx`
- Terminal commands live in `app/components/Terminal.tsx`

Live at https://the-big-hack.vercel.app (`SITE.url`, used by canonical and OG tags). `vercel deploy --prod` updates it.

The Phase 1 shortlist is shown at `/announcements`; the names are maintained in `PHASE_ONE_TEAMS` in `app/data/hack.ts`. `public/og.png` is the social preview image.

## Team portal

The public team directories show team names and shortlist/confirmation status. A team portal is opened from `/teams`; the leader's registered email is the team credential. Portal data, payment screenshots and admin review records stay in Neon. Screenshot uploads accept PNG, JPEG or WebP up to 3 MB and are stored as PostgreSQL `BYTEA`.

The admin console can enable GitHub repository submissions for confirmed teams and export all team records, including submitted repository links, as CSV. The team portal accepts HTTPS links to `github.com/<owner>/<repository>`; the organisers' toggle controls when teams can submit or update a link.

The admin console can also open Round 2 problem statement choices, group confirmed teams by their selection, and mark up to 10 teams per track for Round 3. Apply `database/005_round2_track_choices.sql` and `database/006_team_judging.sql` to Neon before deploying these features. Judging loads confirmed teams once when the Judging view is first opened; searches stay local, and each team's rubric is saved with one upsert.

Server-only settings are listed in `.env.example`. Keep `.env.local` untracked. To create or refresh the schema and import the first 50 Google Form selections from the provided final lists PDF, run:

```bash
node scripts/seed-teams.mjs /path/to/big_hack_final_lists.pdf
```

The seed script verifies that its first 50 team names match `PHASE_ONE_TEAMS` and stores salted scrypt hashes of the leader emails. The current admin password is kept locally in the ignored `.admin-password` file; its hash and the other production settings are stored in Vercel Environment Variables. To create a new admin hash, run `node scripts/hash-admin-password.mjs`, then replace `ADMIN_PASSWORD_HASH` in Vercel and redeploy.

`BRIEF.md` records the original event brief; check `app/data/hack.ts` and current organiser instructions for current event details.
