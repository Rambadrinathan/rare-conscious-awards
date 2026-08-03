import { NextResponse } from "next/server";
import { getNomination } from "@/lib/store";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { buildNominationDocx, docxFilename } from "@/lib/nomination-docx";

export const runtime = "nodejs";
// Embedding photographs makes this heavier than a JSON response.
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const nomination = await getNomination(id);
  if (!nomination) {
    return NextResponse.json({ error: "Nomination not found" }, { status: 404 });
  }

  const buffer = await buildNominationDocx(nomination);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${docxFilename(nomination)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
