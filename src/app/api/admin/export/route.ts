import { NextResponse } from "next/server";
import { listNominations } from "@/lib/store";
import { awardTitle, TOUCHSTONES } from "@/lib/touchstones";
import { isAdminAuthorized } from "@/lib/admin-auth";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listNominations();

  const headers = [
    "id",
    "created_at",
    "status",
    "hotel",
    "award",
    "contact_name",
    "contact_email",
    "contact_phone",
    "nominee_name",
    "nominee_role",
    "sustainability_lead",
    "signature_story",
    "evidence_url",
    ...TOUCHSTONES.map((t) => t.key),
  ];

  const lines = [headers.join(",")];

  for (const n of rows) {
    const answerMap = Object.fromEntries(
      n.answers.map((a) => [
        a.touchstone_key,
        a.not_applicable ? "[N/A]" : a.answer_text,
      ])
    );
    const cols = [
      n.id,
      n.created_at,
      n.status,
      n.hotel_name,
      awardTitle(n.award_category),
      n.contact_name,
      n.contact_email,
      n.contact_phone || "",
      n.nominee_name || "",
      n.nominee_role || "",
      n.sustainability_lead || "",
      n.signature_story || "",
      n.evidence_url || "",
      ...TOUCHSTONES.map((t) => answerMap[t.key] || ""),
    ].map((c) => csvEscape(String(c)));
    lines.push(cols.join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rare-awards-nominations.csv"`,
    },
  });
}
