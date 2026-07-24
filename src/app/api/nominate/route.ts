import { NextResponse } from "next/server";
import { nominationSchema } from "@/lib/validation";
import { saveNomination } from "@/lib/store";
import type { NominationPayload } from "@/lib/types";
import type { AwardCategoryId } from "@/lib/touchstones";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bot trap
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
    const payload: NominationPayload = {
      hotel_name: data.hotel_name,
      hotel_not_listed: data.hotel_not_listed,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || undefined,
      award_category: data.award_category as AwardCategoryId,
      nominee_name: data.nominee_name || undefined,
      nominee_role: data.nominee_role || undefined,
      signature_story: data.signature_story || undefined,
      sustainability_lead: data.sustainability_lead || undefined,
      evidence_url: data.evidence_url || undefined,
      consent: true,
      answers: data.answers.map((a) => ({
        touchstone_key: a.touchstone_key,
        not_applicable: a.not_applicable,
        answer_text: a.answer_text,
      })),
    };

    const result = await saveNomination(payload);

    return NextResponse.json({ id: result.id, storage: result.storage });
  } catch (e) {
    console.error("nominate error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
