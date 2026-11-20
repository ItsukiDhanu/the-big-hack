import type { NeonQueryFunction } from "@neondatabase/serverless";

export type ConfirmationEmailRecord = {
  proofId: string;
  teamId: string;
  teamName: string;
  leaderName: string;
  members: unknown;
  leaderEmailCiphertext: string | null;
};

export function buildConfirmationEmail(teamName: string, leaderName: string, members: unknown): { subject: string; html: string; text: string };
export function sendConfirmationEmail(record: ConfirmationEmailRecord): Promise<{ messageId?: string }>;
export function deliverQueuedConfirmation(sql: NeonQueryFunction<false, false>, record: ConfirmationEmailRecord): Promise<{ status: string; errorCode: string | null }>;
