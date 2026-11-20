export type PortalRecord = {
  id: string;
  slug: string;
  name: string;
  leaderName: string;
  members: unknown;
  stage: string;
  paymentStatus: string;
  githubRepoUrl: string | null;
  githubRepoSubmissionEnabled: boolean;
  round2ChoicesOpen: boolean;
  round2TrackId: string | null;
  round2ProblemStatementId: string | null;
  round3Qualified: boolean;
  updatedAt: string | Date;
  proofId: string | null;
  proofStatus: string | null;
  uploadedAt: string | Date | null;
  reviewNote: string | null;
};

export function portalPayload(record: PortalRecord) {
  const canSubmitPayment = record.stage === "shortlisted"
    && record.paymentStatus !== "pending"
    && record.paymentStatus !== "confirmed";
  const paymentUrl = canSubmitPayment
    ? `upi://pay?${new URLSearchParams({
      pa: "sinhaaditya3008@oksbi",
      pn: "The Big Hack",
      am: "800.00",
      cu: "INR",
      tn: `Team: ${record.name} | Leader: ${record.leaderName}`,
    }).toString()}`
    : null;
  return {
    team: {
      id: record.id,
      slug: record.slug,
      name: record.name,
      leaderName: record.leaderName,
      members: Array.isArray(record.members) ? record.members : [],
      stage: record.stage,
      paymentStatus: record.paymentStatus,
      githubRepoUrl: record.githubRepoUrl,
      round2TrackId: record.round2TrackId,
      round2ProblemStatementId: record.round2ProblemStatementId,
      round3Qualified: Boolean(record.round3Qualified),
      updatedAt: record.updatedAt,
    },
    githubRepoSubmissionEnabled: Boolean(record.githubRepoSubmissionEnabled),
    round2ChoicesOpen: Boolean(record.round2ChoicesOpen),
    proof: record.proofId ? {
      id: record.proofId,
      status: record.proofStatus,
      uploadedAt: record.uploadedAt,
      note: record.reviewNote,
    } : null,
    paymentUrl,
    paymentAmount: 800,
  };
}
