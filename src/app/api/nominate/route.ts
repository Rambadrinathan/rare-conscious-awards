import { NextResponse } from "next/server";
import { nominationSchema } from "@/lib/validation";
import { saveNomination } from "@/lib/store";
import { sendNominationReceipt } from "@/lib/email";
import type { NominationPayload, SupportingFile } from "@/lib/types";
import type { AwardCategoryId } from "@/lib/touchstones";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.website_honeypot) {
      return NextResponse.json({ id: "ok" });
    }

    const parsed = nominationSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid nomination data";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const supporting_files = (data.supporting_files || []) as SupportingFile[];

    // Soft size guard for serverless body limits. Must count per-touchstone
    // evidence too, or nine upload slots can slip past the ceiling.
    const answerBytes = (data.answers || []).reduce(
      (sum, a) =>
        sum + (a.supporting_files || []).reduce((s, f) => s + f.size, 0),
      0
    );
    const totalBytes =
      supporting_files.reduce((s, f) => s + f.size, 0) + answerBytes;
    if (totalBytes > 4_000_000) {
      return NextResponse.json(
        {
          error:
            "Supporting files are too large in total (max ~4 MB). Please compress images or upload fewer files.",
        },
        { status: 400 }
      );
    }

    const payload: NominationPayload = {
      hotel_name: data.hotel_name,
      hotel_not_listed: data.hotel_not_listed,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || undefined,
      award_category: data.award_category as AwardCategoryId,
      nominee_name: data.nominee_name || undefined,
      nominee_role: data.nominee_role || undefined,
      lightkeeper_why: data.lightkeeper_why || undefined,
      lightkeeper_accomplishments: data.lightkeeper_accomplishments || undefined,
      lightkeeper_achievements: data.lightkeeper_achievements || undefined,
      lightkeeper_pushing_for: data.lightkeeper_pushing_for || undefined,
      signature_story: data.signature_story || undefined,
      sustainability_lead: data.sustainability_lead || undefined,
      evidence_url: data.evidence_url || undefined,
      supporting_files,
      consent: true,
      answers: (data.answers || []).map((a) => ({
        touchstone_key: a.touchstone_key,
        not_applicable: a.not_applicable,
        answer_text: a.answer_text,
        supporting_files: (a.supporting_files || []) as SupportingFile[],
        evidence_url: a.evidence_url || undefined,
      })),
    };

    const result = await saveNomination(payload);

    // Confirmation to the submitter (BCC to RARE). Deliberately after the save
    // and never fatal — a mail outage must not cost someone their nomination.
    const email = await sendNominationReceipt(payload, result.id);
    if (!email.sent) {
      console.warn(
        `[nominate] receipt not sent for ${result.id}: ${email.reason}`
      );
    }

    return NextResponse.json({
      id: result.id,
      storage: result.storage,
      emailed: email.sent,
    });
  } catch (e) {
    console.error("nominate error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
