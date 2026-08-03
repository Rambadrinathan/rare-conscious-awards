import { awardTitle } from "./touchstones";
import type { NominationPayload } from "./types";

/**
 * Confirmation email to whoever submitted a nomination.
 *
 * Uses the Resend REST API directly over fetch — no SDK, no extra dependency.
 * Entirely optional: with no RESEND_API_KEY set, this no-ops and returns a
 * reason, so a missing key can never break a submission.
 */

const FROM = process.env.NOMINATION_EMAIL_FROM || "RARE India <awards@rareindia.com>";
const REPLY_TO = process.env.NOMINATION_EMAIL_REPLY_TO || "shobhanaj@rareindia.com";
/** RARE's own copy of every nomination. Set to "" to disable. */
const BCC =
  process.env.NOMINATION_EMAIL_BCC === ""
    ? ""
    : process.env.NOMINATION_EMAIL_BCC || "shobhanaj@rareindia.com";

export type EmailResult =
  | { sent: true; id?: string }
  | { sent: false; reason: string };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(payload: NominationPayload, id: string): string {
  const award = awardTitle(payload.award_category);
  const isLightkeeper = !payload.answers?.length;

  const attachments = [
    ...(payload.supporting_files || []).map((f) => f.name),
    ...(payload.answers || []).flatMap((a) =>
      (a.supporting_files || []).map((f) => f.name)
    ),
  ];

  const rows: string[] = [
    `<tr><td style="padding:6px 0;color:#6b6b60">Award</td><td style="padding:6px 0;font-weight:600">${esc(award)}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#6b6b60">Property</td><td style="padding:6px 0;font-weight:600">${esc(payload.hotel_name)}</td></tr>`,
  ];
  if (payload.nominee_name) {
    rows.push(
      `<tr><td style="padding:6px 0;color:#6b6b60">Nominee</td><td style="padding:6px 0;font-weight:600">${esc(
        payload.nominee_name
      )}${payload.nominee_role ? ` — ${esc(payload.nominee_role)}` : ""}</td></tr>`
    );
  }
  rows.push(
    `<tr><td style="padding:6px 0;color:#6b6b60">Reference</td><td style="padding:6px 0;font-family:monospace;font-size:13px">${esc(
      id
    )}</td></tr>`
  );
  if (!isLightkeeper) {
    const answered = (payload.answers || []).filter(
      (a) => !a.not_applicable && (a.answer_text || "").trim()
    ).length;
    const na = (payload.answers || []).filter((a) => a.not_applicable).length;
    rows.push(
      `<tr><td style="padding:6px 0;color:#6b6b60">Touchstones</td><td style="padding:6px 0;font-weight:600">${answered} answered${
        na ? `, ${na} marked not applicable` : ""
      }</td></tr>`
    );
  }
  if (attachments.length) {
    rows.push(
      `<tr><td style="padding:6px 0;color:#6b6b60;vertical-align:top">Attachments</td><td style="padding:6px 0">${attachments
        .map((n) => esc(n))
        .join("<br>")}</td></tr>`
    );
  }

  return `<!doctype html>
<html><body style="margin:0;background:#F6F1E6;font-family:'Nunito Sans',Helvetica,Arial,sans-serif;color:#2f2f28">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08A2E">
      Conscious Travel Awards
    </p>
    <h1 style="margin:0 0 4px;font-size:22px;color:#4d7a1f">Thank you — we have your nomination</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#55554b">
      Dear ${esc(payload.contact_name)}, your nomination has been received. Nothing
      further is needed from you now. Keep this email as your record.
    </p>

    <table style="width:100%;border-collapse:collapse;background:#fffdf8;border:1px solid #e6ddc9;border-radius:12px;padding:8px">
      <tbody style="font-size:14px">${rows.join("")}</tbody>
    </table>

    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#55554b">
      If anything needs correcting, reply to this email quoting your reference
      and we will update it for you.
    </p>

    <p style="margin:26px 0 0;font-size:12px;color:#8a8a7d;border-top:1px solid #e6ddc9;padding-top:14px">
      RARE India · <a href="mailto:${esc(REPLY_TO)}" style="color:#4d7a1f">${esc(REPLY_TO)}</a><br>
      <em>In a Regular World, Be RARE</em>
    </p>
  </div>
</body></html>`;
}

function buildText(payload: NominationPayload, id: string): string {
  return [
    `Thank you - we have your nomination`,
    ``,
    `Dear ${payload.contact_name}, your nomination has been received.`,
    `Nothing further is needed from you now. Keep this email as your record.`,
    ``,
    `Award:     ${awardTitle(payload.award_category)}`,
    `Property:  ${payload.hotel_name}`,
    payload.nominee_name
      ? `Nominee:   ${payload.nominee_name}${
          payload.nominee_role ? ` - ${payload.nominee_role}` : ""
        }`
      : "",
    `Reference: ${id}`,
    ``,
    `If anything needs correcting, reply to this email quoting your reference.`,
    ``,
    `RARE India - ${REPLY_TO}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendNominationReceipt(
  payload: NominationPayload,
  id: string
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY not configured" };
  if (!payload.contact_email) return { sent: false, reason: "no contact email" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.contact_email],
        ...(BCC ? { bcc: [BCC] } : {}),
        reply_to: REPLY_TO,
        subject: `Nomination received — ${awardTitle(payload.award_category)}`,
        html: buildHtml(payload, id),
        text: buildText(payload, id),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, reason: `resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send failed" };
  }
}
