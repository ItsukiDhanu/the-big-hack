import { createTransport } from "nodemailer";
import { decryptLeaderEmail } from "./confirmation-email-crypto.mjs";

const EVENT = {
  url: "https://the-big-hack.vercel.app/announcements",
  dates: "20–21 November 2026",
  venue: "Acharya Institute of Technology, Bengaluru",
  organiser: "The Big O",
  contact: "bigo@acharya.ac.in",
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function buildConfirmationEmail(teamName, leaderName, rawMembers) {
  const memberValues = Array.isArray(rawMembers) ? rawMembers : [];
  const roster = [...new Set([leaderName, ...memberValues]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim()).filter(Boolean))];
  const safeTeam = escapeHtml(teamName);
  const safeLeader = escapeHtml(leaderName);
  const safeRoster = roster.map(escapeHtml);
  const subject = `Official Seat Confirmation | ${teamName} — The Big Hack 2.0`;
  const rows = safeRoster.map((name, index) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #26302c;color:#8a9893;font:13px Arial,sans-serif;width:44px;">${String(index + 1).padStart(2, "0")}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #26302c;color:#dce5e1;font:14px Arial,sans-serif;">${name}</td>
    </tr>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 10px;background:#edf1ef;color:#dce5e1;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0e1110;border:1px solid #232b28;border-radius:8px;overflow:hidden;">
    <tr><td style="height:7px;background:#8cff7a;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td style="padding:30px 32px 26px;background:#101613;">
      <div style="font:700 18px 'Courier New',monospace;color:#dce5e1;letter-spacing:.4px;">[ THE BIG HACK 2.0 ]</div>
      <div style="margin-top:8px;font:12px 'Courier New',monospace;letter-spacing:2px;color:#8a9893;">OFFICIAL TEAM COMMUNICATION</div>
      <div style="display:inline-block;margin-top:20px;padding:9px 13px;background:#8cff7a;color:#062b02;font:700 12px 'Courier New',monospace;">&#10003;&nbsp; SEAT CONFIRMED</div>
    </td></tr>
    <tr><td style="padding:26px 32px 12px;border-top:1px solid #26302c;">
      <h1 style="margin:0 0 18px;color:#dce5e1;font:700 25px Arial,sans-serif;line-height:1.3;">Congratulations, ${safeTeam}!</h1>
      <p style="margin:0 0 14px;color:#c3cec9;font:15px/1.7 Arial,sans-serif;">Dear ${safeLeader},</p>
      <p style="margin:0 0 14px;color:#c3cec9;font:15px/1.7 Arial,sans-serif;">We are pleased to confirm that your team’s payment has been reviewed and your seat at The Big Hack 2.0 is officially secured. Congratulations to you and your teammates. We look forward to welcoming you for an exciting 24-hour build.</p>
      <p style="margin:0 0 12px;color:#8cff7a;font:700 12px 'Courier New',monospace;letter-spacing:1.5px;">CONFIRMED TEAM ROSTER</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#141917;border:1px solid #3a4743;">${rows}</table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#141917;border:1px solid #3a4743;">
        <tr><td colspan="2" style="padding:16px 16px 8px;color:#8cff7a;font:700 12px 'Courier New',monospace;letter-spacing:1.5px;">EVENT DETAILS</td></tr>
        <tr><td style="padding:8px 16px;color:#8a9893;font:12px 'Courier New',monospace;width:34%;">EVENT</td><td style="padding:8px 16px;color:#dce5e1;font:14px Arial,sans-serif;font-weight:700;">The Big Hack 2.0</td></tr>
        <tr><td style="padding:8px 16px;color:#8a9893;font:12px 'Courier New',monospace;">DATES</td><td style="padding:8px 16px;color:#dce5e1;font:14px Arial,sans-serif;">${EVENT.dates}</td></tr>
        <tr><td style="padding:8px 16px;color:#8a9893;font:12px 'Courier New',monospace;">VENUE</td><td style="padding:8px 16px;color:#dce5e1;font:14px Arial,sans-serif;">${EVENT.venue}</td></tr>
      </table>
      <p style="margin:0 0 20px;color:#c3cec9;font:14px/1.7 Arial,sans-serif;">Please keep an eye on the official event page for updates and practical information before the event.</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#8cff7a;border-radius:3px;"><a href="${escapeHtml(EVENT.url)}" style="display:inline-block;padding:14px 18px;color:#062b02;text-decoration:none;font:700 13px 'Courier New',monospace;">VIEW EVENT DETAILS &#8599;</a></td></tr></table>
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #26302c;color:#c3cec9;font:13px/1.7 Arial,sans-serif;">With regards,<br><strong style="color:#dce5e1;">Organising Committee · The Big Hack 2.0</strong><br><span style="color:#8a9893;">${EVENT.organiser} · <a href="mailto:${escapeHtml(EVENT.contact)}" style="color:#8a9893;">${EVENT.contact}</a></span></div>
    </td></tr>
  </table>
</body></html>`;
  const text = [
    `Congratulations, ${teamName}!`,
    `Dear ${leaderName},`,
    "",
    "We are pleased to confirm that your team’s payment has been reviewed and your seat at The Big Hack 2.0 is officially secured. Congratulations to you and your teammates. We look forward to welcoming you for an exciting 24-hour build.",
    "",
    "CONFIRMED TEAM ROSTER",
    ...roster.map((name, index) => `${index + 1}. ${name}`),
    "",
    "EVENT DETAILS",
    "The Big Hack 2.0",
    `${EVENT.dates} · ${EVENT.venue}`,
    `Event updates: ${EVENT.url}`,
    "",
    "With regards,",
    "Organising Committee · The Big Hack 2.0",
    `${EVENT.organiser} · ${EVENT.contact}`,
  ].join("\n");
  return { subject, html, text };
}

export async function sendConfirmationEmail(record) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) throw new Error("Confirmation email encryption is not configured.");
  if (!record.leaderEmailCiphertext) throw new Error("This team has no recoverable leader email address yet.");
  const to = decryptLeaderEmail(record.leaderEmailCiphertext, secret);
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!password) throw new Error("Gmail sending is not configured on the server.");
  const from = "The Big Hack 2.0 <dhanushvpshetty@gmail.com>";
  const transporter = createTransport({
    service: "gmail",
    auth: { user: "dhanushvpshetty@gmail.com", pass: password },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 25_000,
  });
  try {
    return await transporter.sendMail({
      from,
      to,
      replyTo: "dhanushvpshetty@gmail.com",
      messageId: `<the-big-hack-confirmation-${record.proofId}@the-big-hack.vercel.app>`,
      ...buildConfirmationEmail(record.teamName, record.leaderName, record.members),
    });
  } finally {
    transporter.close();
  }
}

export async function deliverQueuedConfirmation(sql, record) {
  const [claimed] = await sql`
    UPDATE bh_confirmation_emails
    SET status = 'sending', attempt_count = attempt_count + 1,
        error_code = NULL, updated_at = NOW()
    WHERE proof_id = ${record.proofId} AND status IN ('queued', 'failed')
    RETURNING proof_id
  `;
  if (!claimed) {
    const [current] = await sql`SELECT status FROM bh_confirmation_emails WHERE proof_id = ${record.proofId}`;
    return { status: current?.status ?? "queued", errorCode: null };
  }
  try {
    const result = await sendConfirmationEmail(record);
    await sql`
      UPDATE bh_confirmation_emails
      SET status = 'sent', provider_message_id = ${result.messageId ?? null},
          sent_at = NOW(), error_code = NULL, updated_at = NOW()
      WHERE proof_id = ${record.proofId}
    `;
    return { status: "sent", errorCode: null };
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "";
    const errorCode = reason.includes("no recoverable leader email") ? "missing_recipient"
      : reason.includes("not configured") ? "sender_not_configured" : "delivery_failed";
    await sql`
      UPDATE bh_confirmation_emails
      SET status = 'failed', error_code = ${errorCode}, updated_at = NOW()
      WHERE proof_id = ${record.proofId}
    `;
    return { status: "failed", errorCode };
  }
}
