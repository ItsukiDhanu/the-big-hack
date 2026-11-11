/**
 * Everything the site says about The Big Hack 2.0 lives here.
 * Values the organisers haven't confirmed yet are `null` and render as "To be announced".
 */

export const SITE = {
  name: "The Big Hack 2.0",
  url: "https://the-big-hack.vercel.app",
  mainSite: "https://tech-habba26.vercel.app",
};

/** Round 1 idea submission (free). */
export const REGISTER_URL = "https://forms.gle/LzqdD5BMMw4rEb2m6";

/** All instants in IST (+05:30). */
export const TIMES = {
  start: "2026-11-20T09:00:00+05:30",
  hackStart: "2026-11-20T13:00:00+05:30",
  hackEnd: "2026-11-21T13:00:00+05:30",
  end: "2026-11-21T18:00:00+05:30",
  /** Round 1 (online idea submission) closes at the end of 10 Nov. */
  registrationCloses: "2026-11-10T23:59:59+05:30",
};

export const FACTS = {
  dates: "20–21 Nov 2026",
  hours: 24,
  teamSize: "2–4 people",
  fee: "Free to enter. ₹800 per team if shortlisted",
  round1Fee: "Free",
  round2Fee: "₹800 per team",
  prizePool: "₹50,000",
  venue: null as string | null,
  deadline: "10 Nov 2026, 11:59 PM IST" as string | null,
  host: "Acharya Institute of Technology, Bengaluru",
};

/**
 * Round 2 details, filled in by the organisers once the shortlist is out.
 * Setting `paymentUrl` turns on the "confirm your spot" button on the register page (needs a redeploy).
 */
export const ROUND2 = {
  shortlistDate: null as string | null,
  shortlistUrl: null as string | null,
  paymentUrl: null as string | null,
  paymentDeadline: null as string | null,
};

/** The pipeline every team goes through. */
export const ROUNDS = [
  { id: "round-1/idea", name: "Round 1: idea", mode: "online", fee: "free", when: "now → 10 Nov", note: "Pick a track, submit your idea" },
  { id: "review/shortlist", name: "Shortlist", mode: "review", fee: null, when: "a few days after 10 Nov", note: "Organisers review every idea" },
  { id: "round-2/build", name: "Round 2: build", mode: "offline, AIT", fee: "₹800 / team", when: "20–21 Nov", note: "Build an assigned problem in 24h" },
];

/** Round 1 ideas pick one track; in Round 2 organisers assign each team a problem statement and track. Blurbs are drafts for the organisers to confirm. */
export const TRACKS = [
  { slug: "autonomous", name: "Autonomous AI Agents", blurb: "Agents that plan, use tools and finish multi-step tasks on their own.", color: "green" },
  { slug: "voice-multimodal", name: "Voice & Multimodal AI Agents", blurb: "Agents that listen, speak and see: voice, images, video and documents.", color: "cyan" },
  { slug: "healthcare", name: "Healthcare AI Agents", blurb: "Agents that help patients, doctors and clinics: triage, records, care and access.", color: "red" },
  { slug: "mobility", name: "Smart Mobility & Infrastructure AI Agents", blurb: "Agents for traffic, transport, cities, energy and the systems we rely on every day.", color: "amber" },
  { slug: "cybersecurity", name: "Cybersecurity AI Agents", blurb: "Agents that detect, investigate and respond to threats, or keep other agents safe.", color: "magenta" },
] as const;

export type Slot = { time: string; end?: string; title: string; kind?: "milestone" | "meal" | "ceremony" };

export const SCHEDULE: { day: string; date: string; slots: Slot[] }[] = [
  {
    day: "Day 1",
    date: "Friday, 20 November",
    slots: [
      { time: "9:00 AM", end: "12:00 PM", title: "Inauguration and briefing", kind: "ceremony" },
      { time: "12:00 PM", end: "1:00 PM", title: "Break" },
      { time: "1:00 PM", title: "Hacking begins", kind: "milestone" },
      { time: "5:30 PM", end: "6:30 PM", title: "Evening snacks", kind: "meal" },
      { time: "8:00 PM", end: "10:00 PM", title: "Dinner", kind: "meal" },
    ],
  },
  {
    day: "Day 2",
    date: "Saturday, 21 November",
    slots: [
      { time: "1:00 AM", end: "2:00 AM", title: "Midnight coffee", kind: "meal" },
      { time: "8:00 AM", end: "9:30 AM", title: "Breakfast", kind: "meal" },
      { time: "1:00 PM", title: "Hacking ends, top projects pitch", kind: "milestone" },
      { time: "1:00 PM", end: "2:00 PM", title: "Lunch", kind: "meal" },
      { time: "3:00 PM", end: "6:00 PM", title: "Valedictory and closing", kind: "ceremony" },
    ],
  },
];

/** Breaks inside the 24-hour hacking window, as hour offsets from 1:00 PM on day 1. */
export const WINDOW_BREAKS = [
  { label: "Evening snacks", from: 4.5, to: 5.5 },
  { label: "Dinner", from: 7, to: 9 },
  { label: "Midnight coffee", from: 12, to: 13 },
  { label: "Breakfast", from: 19, to: 20.5 },
];

export const RULES = [
  { title: "Round 1", body: "Free and online. Pick one of the five tracks and submit your team's idea through the form by 10 November, 11:59 PM IST." },
  { title: "Shortlisting", body: "The organisers review every idea and announce the shortlist a few days after Round 1 closes. Only shortlisted teams go to Round 2." },
  { title: "Round 2", body: "Offline at AIT, 20–21 November. Shortlisted teams confirm their spot by paying ₹800 per team, then build a problem statement and track the organisers assign. It won't be their Round 1 idea." },
  { title: "Build at the event", body: "You'll get your problem statement from the organisers, and no code can exist before the event. All project code is written during the 24 hours. Open-source libraries, frameworks and APIs are allowed." },
  { title: "Submission", body: "Submit a code repository, a short README and a working demo before hacking ends. Late submissions are not judged." },
  { title: "Conduct", body: "Be respectful to other teams, mentors and organisers. Organiser and judge decisions are final." },
];

export const ELIGIBILITY = [
  "Open to students from any college",
  "Teams of 2 to 4 participants",
  "A college ID card for every member",
];

export const JUDGING = [
  { title: "Problem fit", body: "Does it fit your track and solve a real problem for the people it's meant for?" },
  { title: "Technical execution", body: "Does it work, and how well is it built?" },
  { title: "Design and usability", body: "Can someone pick it up and use it without a walkthrough?" },
  { title: "Presentation", body: "How clearly you explain the problem, the solution and what you built." },
];

export const BRING = ["Laptops", "Chargers", "Extension boards", "College ID cards"];

export const FAQS = [
  { q: "How does it work?", a: "Two rounds. Round 1 is free and online: pick a track and submit your idea by 10 November. Shortlisted teams go to Round 2, the 24-hour offline hackathon at AIT on 20–21 November." },
  { q: "How much does it cost?", a: "Round 1 is free. Only shortlisted teams pay, ₹800 per team (not per person), to confirm their Round 2 spot. That covers evening snacks, dinner, midnight coffee, breakfast and lunch." },
  { q: "What are the tracks?", a: "Five, all about AI agents: Autonomous AI Agents, Voice & Multimodal AI Agents, Healthcare AI Agents, Smart Mobility & Infrastructure AI Agents, and Cybersecurity AI Agents. Pick one when you submit." },
  { q: "What do we submit in Round 1?", a: "Your team details, your track and your idea: the problem, how your agent solves it and what you plan to build it with. It's all in the one Google Form." },
  { q: "When does Round 1 close?", a: "10 November 2026 at 11:59 PM IST. After that the form closes and the submit buttons on this site switch off." },
  { q: "When is the shortlist announced, and how do we pay?", a: "A few days after Round 1 closes. Shortlisted teams are told directly, and the payment link to confirm your spot goes live on the register page." },
  { q: "What if we're not shortlisted?", a: "You don't pay anything. There are twelve other Tech Habba 2.0 events from 19 to 21 November you can still join." },
  { q: "Who can take part?", a: "Any college student. You don't need to be from AIT. Every team member needs a valid college ID card at check-in." },
  { q: "How big can a team be?", a: "Two to four people. Solo entries aren't accepted, so find at least one teammate before you submit." },
  { q: "Do we build our Round 1 idea in Round 2?", a: "No. Round 1 is how we shortlist. In Round 2 the organisers give each team its problem statement and track, and that's what you build." },
  { q: "Can we start building before the event?", a: "Plan as much as you like, but all project code has to be written during the 24 hours. You can use open-source libraries, frameworks and public APIs." },
  { q: "What do we have to submit?", a: "A code repository, a short README and a working demo, before hacking ends at 1:00 PM on 21 November. Late submissions are not judged." },
  { q: "Do we stay overnight?", a: "Yes. Hacking runs straight through from 1:00 PM on Friday to 1:00 PM on Saturday, with a midnight coffee break at 1:00 AM." },
];

export const CONTACTS = [
  { name: "Aditya Sinha", role: "Event head", phone: "7779818130", email: "adityal2.24.beis@acharya.ac.in" },
  { name: "Shubham Kumar", role: "Event head", phone: "9334590992", email: "shubhams.24.beis@acharya.ac.in" },
];

export const CLUB = {
  name: "The Big O",
  email: "bigo@acharya.ac.in",
  socials: [
    { platform: "Instagram", url: "https://www.instagram.com/thebigo_ait" },
    { platform: "LinkedIn", url: "https://www.linkedin.com/groups/10014219/" },
    { platform: "GitHub", url: "https://github.com/thisisthebigo" },
    { platform: "X", url: "https://x.com/codethebigo" },
    { platform: "WhatsApp", url: "https://chat.whatsapp.com/BF1rNw5lEFBLYX7q0vNVzi" },
  ],
};

/** Listed as Tech Habba partners (previous edition); not yet confirmed as Big Hack sponsors. */
export const PARTNERS = [
  { name: "AMD", role: "Global computing and semiconductor partner", logo: "/images/sponsors/amd.svg" },
  { name: "IBM", role: "Enterprise cloud and cognitive solutions partner", logo: "/images/sponsors/ibm.svg" },
  { name: "Devfolio", role: "Hackathon platform partner", logo: "/images/sponsors/devfolio.svg" },
  { name: "CodeChef", role: "Competitive programming partner", logo: "/images/sponsors/codechef.svg" },
  { name: "IEEE Acharya Student Branch", role: "Technical accreditation and chapter partner", logo: "/images/sponsors/ieee.svg" },
];

/** The other Tech Habba events, linked to their pages on the main site. */
export const OTHER_EVENTS = [
  { slug: "ai-agents-masterclass", title: "AI Agents Masterclass", day: "19 Nov", time: "11:30 AM" },
  { slug: "ctf", title: "Capture The Flag", day: "19 Nov", time: "11:30 AM" },
  { slug: "tech-debate", title: "Tech Debate", day: "19 Nov", time: "11:00 AM" },
  { slug: "campus-hunt", title: "Campus Hunt", day: "19 Nov", time: "2:00 PM" },
  { slug: "ideathon", title: "Ideathon", day: "20 Nov", time: "9:30 AM" },
  { slug: "design-challenge", title: "Logo Design", day: "20 Nov", time: "10:00 AM" },
  { slug: "valorant", title: "Valorant", day: "20 Nov", time: "2:00 PM" },
  { slug: "competitive-programming", title: "Competitive Programming", day: "20 Nov", time: "4:30 PM" },
  { slug: "prompt-to-product", title: "Prompt to Product", day: "21 Nov", time: "9:00 AM" },
  { slug: "free-fire", title: "Free Fire", day: "21 Nov", time: "10:00 AM" },
  { slug: "chess", title: "Chess", day: "21 Nov", time: "1:00 PM" },
  { slug: "tech-quiz-championship", title: "IT Quiz", day: "21 Nov", time: "2:00 PM" },
];

/** Site pages, in tab order. The key is the tmux-style shortcut. */
export const PAGES = [
  { key: "1", to: "/", name: "home", label: "Home" },
  { key: "2", to: "/schedule", name: "schedule", label: "Schedule" },
  { key: "3", to: "/prizes", name: "prizes", label: "Prizes & tracks" },
  { key: "4", to: "/rules", name: "rules", label: "Rules" },
  { key: "5", to: "/faq", name: "faq", label: "FAQ" },
  { key: "6", to: "/register", name: "register", label: "Register" },
];
