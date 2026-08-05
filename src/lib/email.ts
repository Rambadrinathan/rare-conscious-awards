import { awardTitle, TOUCHSTONES } from "./touchstones";
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

  // A short, human-quotable code rather than a raw UUID.
  const shortRef = id.slice(0, 8).toUpperCase();

  const summaryLine = [
    `Reference ${shortRef}`,
    attachments.length
      ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached`
      : "",
  ]
    .filter(Boolean)
    .join("&nbsp; ·&nbsp; ");

  // Typographic masthead — no bordered box, no filename dump, no UUID.
  const summary = `
    <div style="margin:22px 0 4px;padding:0 0 18px;border-bottom:1px solid #e6ddc9">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#B08A2E;font-weight:700">
        ${esc(award)}
      </p>
      <p style="margin:0;font-size:21px;line-height:1.25;font-weight:700;color:#2f2f28">
        ${esc(payload.hotel_name)}
      </p>
      ${
        payload.nominee_name
          ? `<p style="margin:6px 0 0;font-size:15px;color:#4d7a1f;font-weight:600">
               ${esc(payload.nominee_name)}${
                 payload.nominee_role
                   ? `<span style="color:#8a8a7d;font-weight:400"> — ${esc(
                       payload.nominee_role
                     )}</span>`
                   : ""
               }
             </p>`
          : ""
      }
      <p style="margin:10px 0 0;font-size:12px;color:#8a8a7d">${summaryLine}</p>
    </div>`;

  // Full copy of what they wrote, so the email stands alone as their record.
  const block = (heading: string, body: string, extra = "") =>
    `<div style="margin:0 0 18px">
       <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#4d7a1f">${esc(heading)}</p>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#2f2f28;white-space:pre-wrap">${esc(body)}</p>
       ${extra}
     </div>`;

  let detail = "";
  if (isLightkeeper) {
    detail =
      block("Why this person is chosen", payload.lightkeeper_why || "—") +
      block("What they have accomplished", payload.lightkeeper_accomplishments || "—") +
      block("Key achievements", payload.lightkeeper_achievements || "—") +
      block("What they are pushing for", payload.lightkeeper_pushing_for || "—");
  } else {
    detail = TOUCHSTONES.map((t) => {
      const a = (payload.answers || []).find(
        (x) => x.touchstone_key === t.key
      );
      const body = a?.not_applicable
        ? "Not Applicable"
        : (a?.answer_text || "").trim() || "—";
      const files = (a?.supporting_files || []).map((f) => f.name);
      const bits: string[] = [];
      if (files.length)
        bits.push(`Attached: ${files.map((n) => esc(n)).join(", ")}`);
      if (a?.evidence_url) bits.push(`Link: ${esc(a.evidence_url)}`);
      const extra = bits.length
        ? `<p style="margin:4px 0 0;font-size:12px;color:#8a8a7d">${bits.join(" · ")}</p>`
        : "";
      return block(`${t.number}. ${t.name}`, body, extra);
    }).join("");
  }

  if (payload.signature_story) {
    detail += block("Signature story", payload.signature_story);
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nomination received</title>
</head>
<body style="margin:0;background:#F6F1E6;font-family:'Nunito Sans',Helvetica,Arial,sans-serif;color:#2f2f28">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B08A2E">
      Conscious Travel Awards
    </p>
    <h1 style="margin:0 0 4px;font-size:22px;color:#4d7a1f">Thank you — we have your nomination</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#55554b">
      Dear ${esc(payload.contact_name)}, your nomination has been received. Nothing
      further is needed from you now. Keep this email as your record.
    </p>

    ${summary}

    <h2 style="margin:26px 0 14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a7d;font-weight:700">
      Your submission, as we received it
    </h2>
    ${detail}

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
    `${awardTitle(payload.award_category)}`,
    `${payload.hotel_name}`,
    payload.nominee_name
      ? `${payload.nominee_name}${
          payload.nominee_role ? ` - ${payload.nominee_role}` : ""
        }`
      : "",
    ``,
    `Reference ${id.slice(0, 8).toUpperCase()}`,
    ``,
    `--- YOUR SUBMISSION, AS WE RECEIVED IT ---`,
    ``,
    ...textDetail(payload),
    `If anything needs correcting, reply to this email quoting your reference.`,
    ``,
    `RARE India - ${REPLY_TO}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Plain-text rendering of everything the nominee wrote. */
function textDetail(payload: NominationPayload): string[] {
  const out: string[] = [];
  const isLightkeeper = !payload.answers?.length;

  if (isLightkeeper) {
    const pairs: [string, string | undefined][] = [
      ["Why this person is chosen", payload.lightkeeper_why],
      ["What they have accomplished", payload.lightkeeper_accomplishments],
      ["Key achievements", payload.lightkeeper_achievements],
      ["What they are pushing for", payload.lightkeeper_pushing_for],
    ];
    for (const [h, b] of pairs) out.push(h.toUpperCase(), b || "-", "");
  } else {
    for (const t of TOUCHSTONES) {
      const a = (payload.answers || []).find((x) => x.touchstone_key === t.key);
      out.push(`${t.number}. ${t.name.toUpperCase()}`);
      out.push(
        a?.not_applicable
          ? "Not Applicable"
          : (a?.answer_text || "").trim() || "-"
      );
      const files = (a?.supporting_files || []).map((f) => f.name);
      if (files.length) out.push(`Attached: ${files.join(", ")}`);
      if (a?.evidence_url) out.push(`Link: ${a.evidence_url}`);
      out.push("");
    }
  }

  if (payload.signature_story) {
    out.push("SIGNATURE STORY", payload.signature_story, "");
  }
  return out;
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
