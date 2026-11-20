export const ROUND2_TRACKS = [
  {
    id: "track-1",
    name: "Finance",
    rule: "Every submission must be a working prototype. Synthetic data is allowed when real data is unavailable; label real and synthetic data clearly.",
    problems: [
      { id: "track-1-ps-1", name: "F1 · The irregular income problem" },
      { id: "track-1-ps-2", name: "F2 · Credit for the credit-invisible" },
      { id: "track-1-ps-3", name: "F3 · Signal versus noise for retail investors" },
    ],
  },
  {
    id: "track-2",
    name: "Cybersecurity and blockchain",
    rule: "Blockchain must be a core part of the solution. Public, permissioned, testnet, and local blockchains are allowed; a solution that works the same without blockchain does not meet the rule.",
    problems: [
      { id: "track-2-ps-1", name: "B1 · Know what you're signing" },
      { id: "track-2-ps-2", name: "B2 · Fair tickets" },
      { id: "track-2-ps-3", name: "B3 · Logs the attacker can't erase" },
    ],
  },
  {
    id: "track-3",
    name: "AI research",
    rule: "Include a 1–2 sentence hypothesis or method, compare results with a baseline, and analyse failures. Properly measured negative results count. Do not only prompt a hosted model; test only code and apps you own or have permission to test.",
    problems: [
      { id: "track-3-ps-1", name: "R1 · Vibe-coded and vulnerable" },
      { id: "track-3-ps-2", name: "R2 · Jailbreaks speak Kannada too" },
      { id: "track-3-ps-3", name: "R3 · The token tax" },
    ],
  },
] as const;

export const ROUND2_CHOICES_CONFIGURED = true;

export const JUDGING_CRITERIA = [
  { id: "innovation", name: "Innovation", max: 25, description: "How original the idea and the approach are." },
  { id: "technicalDepth", name: "Technical depth", max: 25, description: "How well the solution is built and how well it handles difficult cases." },
  { id: "evidence", name: "Evidence", max: 20, description: "How convincingly you show that the solution works." },
  { id: "impact", name: "Impact", max: 15, description: "How much the solution would help real users in India." },
  { id: "presentation", name: "Presentation", max: 15, description: "How clear the demo and the pitch are." },
] as const;

export type JudgingScores = { innovation: number; technicalDepth: number; evidence: number; impact: number; presentation: number };

export function getRound2Problem(trackId: string | null, problemId: string | null) {
  const track = ROUND2_TRACKS.find((item) => item.id === trackId);
  const problem = track?.problems.find((item) => item.id === problemId);
  return track && problem ? { track, problem } : null;
}
