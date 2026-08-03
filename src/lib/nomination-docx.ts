import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { awardTitle, TOUCHSTONES } from "./touchstones";
import type { NominationRecord, SupportingFile } from "./types";
import {
  RARE_LOGO_HEIGHT,
  RARE_LOGO_PNG_BASE64,
  RARE_LOGO_WIDTH,
} from "./brand-assets";

/**
 * Jury-ready Word export of a single nomination, with photographs embedded.
 *
 * Design notes: RARE palette, Calibri throughout (universally available, so
 * the file looks the same on every juror's machine), ginkgo wordmark in the
 * header, contact details in the footer of every page.
 */

const GREEN = "74A942";
const GREEN_DEEP = "4D7A1F";
const GOLD = "D4A13D";
const GOLD_DEEP = "8A6A1F";
const INK = "2F2F28";
const MUTED = "6B6B60";
const CREAM = "F6F1E6";
const RULE = "E6DDC9";

const FONT = "Calibri";

/** Max width for an embedded photo, in points (6.5in content width = 468pt). */
const PHOTO_MAX_W = 420;
const PHOTO_MAX_H = 300;

function b64ToUint8(b64: string): Uint8Array {
  const bin = Buffer.from(b64, "base64");
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);
}

/** Fit an image inside the content box, preserving aspect ratio. */
function fit(w: number, h: number, maxW = PHOTO_MAX_W, maxH = PHOTO_MAX_H) {
  if (!w || !h) return { width: maxW, height: Math.round(maxW * 0.66) };
  const s = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

/**
 * Read pixel dimensions straight from the PNG/JPEG bytes. Avoids guessing an
 * aspect ratio, which would distort every photo.
 */
function imageSize(bytes: Uint8Array): { w: number; h: number } {
  // PNG: IHDR at offset 16
  if (
    bytes.length > 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { w: dv.getUint32(16), h: dv.getUint32(20) };
  }
  // JPEG: walk the segment markers to SOFn
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        return { w, h };
      }
      if (len <= 0) break;
      i += 2 + len;
    }
  }
  return { w: 0, h: 0 };
}

const text = (
  t: string,
  o: {
    bold?: boolean;
    size?: number;
    color?: string;
    italics?: boolean;
    caps?: boolean;
    spacing?: number;
  } = {}
) =>
  new TextRun({
    text: o.caps ? t.toUpperCase() : t,
    bold: o.bold,
    italics: o.italics,
    size: (o.size ?? 10.5) * 2, // docx uses half-points
    color: o.color ?? INK,
    font: FONT,
    ...(o.spacing ? { characterSpacing: o.spacing } : {}),
  });

const para = (
  runs: TextRun[],
  o: {
    after?: number;
    before?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    shading?: string;
    indent?: number;
    keepNext?: boolean;
  } = {}
) =>
  new Paragraph({
    children: runs,
    alignment: o.align,
    keepNext: o.keepNext,
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
    ...(o.indent ? { indent: { left: o.indent } } : {}),
    ...(o.shading
      ? { shading: { type: ShadingType.CLEAR, fill: o.shading } }
      : {}),
  });

/** Thin gold rule used to separate sections. */
const rule = (color = RULE) =>
  new Paragraph({
    spacing: { after: 160, before: 40 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
  });

function metaTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              verticalAlign: VerticalAlign.TOP,
              children: [
                para([text(k, { size: 8.5, color: MUTED, caps: true, spacing: 12 })], {
                  after: 0,
                }),
              ],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [
                para([text(v || "—", { size: 10.5, bold: true })], { after: 0 }),
              ],
            }),
          ],
        })
    ),
  });
}

/** Embedded photographs plus a list of any non-image attachments. */
function attachmentBlocks(files: SupportingFile[]): Paragraph[] {
  const out: Paragraph[] = [];
  const images = files.filter((f) => f.kind === "image");
  const docs = files.filter((f) => f.kind !== "image");

  for (const f of images) {
    try {
      const bytes = b64ToUint8(f.data_base64);
      const { w, h } = imageSize(bytes);
      const size = fit(w, h);
      out.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new ImageRun({
              data: bytes,
              transformation: size,
              type: f.mime?.includes("png") ? "png" : "jpg",
            }),
          ],
        })
      );
      out.push(
        para([text(f.name, { size: 8.5, color: MUTED, italics: true })], {
          after: 140,
        })
      );
    } catch {
      out.push(
        para(
          [text(`[could not render ${f.name}]`, { size: 9, color: MUTED })],
          { after: 80 }
        )
      );
    }
  }

  if (docs.length) {
    out.push(
      para(
        [
          text("Documents:  ", { size: 9, color: MUTED, bold: true }),
          text(
            docs
              .map((d) => `${d.name} (${Math.round((d.size || 0) / 1000)} KB)`)
              .join("   ·   "),
            { size: 9, color: INK }
          ),
        ],
        { after: 120 }
      )
    );
  }
  return out;
}

export async function buildNominationDocx(
  n: NominationRecord
): Promise<Buffer> {
  const isLightkeeper = !n.answers?.some(
    (a) => a.answer_text || a.not_applicable
  );
  const submitted = new Date(n.created_at).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const body: (Paragraph | Table)[] = [];

  // ---- title block -------------------------------------------------------
  body.push(
    para(
      [
        text("Conscious Travel Awards", {
          size: 9,
          color: GOLD_DEEP,
          bold: true,
          caps: true,
          spacing: 40,
        }),
      ],
      { after: 60 }
    )
  );
  body.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 40 },
      children: [
        text(awardTitle(n.award_category), {
          size: 20,
          bold: true,
          color: GREEN_DEEP,
        }),
      ],
    })
  );
  body.push(
    para([text(n.hotel_name, { size: 14, bold: true, color: INK })], {
      after: 40,
    })
  );
  body.push(
    para(
      [text("Nomination for jury review", { size: 10, italics: true, color: MUTED })],
      { after: 200 }
    )
  );

  // ---- who / what --------------------------------------------------------
  const meta: [string, string][] = [
    ["Award", awardTitle(n.award_category)],
    ["Property", n.hotel_name],
  ];
  if (n.nominee_name)
    meta.push([
      "Nominee",
      n.nominee_role ? `${n.nominee_name} — ${n.nominee_role}` : n.nominee_name,
    ]);
  meta.push(["Submitted by", `${n.contact_name} · ${n.contact_email}`]);
  if (n.contact_phone) meta.push(["Phone", n.contact_phone]);
  if (n.sustainability_lead) meta.push(["Sustainability lead", n.sustainability_lead]);
  meta.push(["Submitted on", submitted]);
  meta.push(["Status", n.status]);
  meta.push(["Reference", n.id]);
  body.push(metaTable(meta));

  // ---- the submission ----------------------------------------------------
  body.push(
    new Paragraph({
      spacing: { before: 400, after: 0 },
      children: [
        text(isLightkeeper ? "The Lightkeeper" : "The Pinwheel", {
          size: 13.5,
          bold: true,
          color: GREEN_DEEP,
        }),
      ],
      keepNext: true,
    })
  );
  body.push(rule(GOLD));

  if (isLightkeeper) {
    const blocks: [string, string | undefined][] = [
      ["Why this person is chosen", n.lightkeeper_why],
      ["What they have accomplished", n.lightkeeper_accomplishments],
      ["Key achievements", n.lightkeeper_achievements],
      ["What they are pushing for", n.lightkeeper_pushing_for],
    ];
    for (const [h, v] of blocks) {
      body.push(
        para([text(h, { size: 11, bold: true, color: GREEN_DEEP })], {
          before: 160,
          after: 60,
          keepNext: true,
        })
      );
      for (const line of (v || "—").split(/\n+/)) {
        body.push(para([text(line, { size: 10.5 })], { after: 80 }));
      }
    }
  } else {
    for (const t of TOUCHSTONES) {
      const a = n.answers.find((x) => x.touchstone_key === t.key);
      const isCardinal = t.kind === "cardinal";

      // heading: number badge + name, tinted by cardinal/ordinal
      body.push(
        new Paragraph({
          spacing: { before: 240, after: 40 },
          keepNext: true,
          shading: { type: ShadingType.CLEAR, fill: CREAM },
          children: [
            text(`  ${String(t.number).padStart(2, "0")}   `, {
              size: 10,
              bold: true,
              color: isCardinal ? GREEN : GOLD,
            }),
            text(`${t.name}  `, { size: 11.5, bold: true, color: INK }),
            text(isCardinal ? "Cardinal" : "Ordinal", {
              size: 8,
              color: MUTED,
              caps: true,
              spacing: 20,
            }),
          ],
        })
      );
      body.push(
        para([text(t.definition, { size: 9, italics: true, color: MUTED })], {
          after: 100,
          keepNext: true,
        })
      );

      if (a?.not_applicable) {
        body.push(
          para([text("Not Applicable", { size: 10.5, italics: true, color: GOLD_DEEP })], {
            after: 100,
          })
        );
      } else {
        const answer = (a?.answer_text || "").trim() || "—";
        for (const line of answer.split(/\n+/)) {
          body.push(para([text(line, { size: 10.5 })], { after: 80 }));
        }
      }

      if (a?.evidence_url) {
        body.push(
          para(
            [
              text("Link:  ", { size: 9, bold: true, color: MUTED }),
              text(a.evidence_url, { size: 9, color: GREEN_DEEP }),
            ],
            { after: 80 }
          )
        );
      }
      body.push(...attachmentBlocks(a?.supporting_files || []));
    }
  }

  // ---- signature story ---------------------------------------------------
  if (n.signature_story) {
    body.push(
      new Paragraph({
        spacing: { before: 400, after: 0 },
        children: [
          text("Signature story", { size: 13.5, bold: true, color: GREEN_DEEP }),
        ],
        keepNext: true,
      })
    );
    body.push(rule(GOLD));
    for (const line of n.signature_story.split(/\n+/)) {
      body.push(para([text(line, { size: 10.5 })], { after: 80 }));
    }
  }

  // ---- evidence for the whole nomination ---------------------------------
  const nomFiles = n.supporting_files || [];
  if (nomFiles.length || n.evidence_url) {
    body.push(
      new Paragraph({
        spacing: { before: 400, after: 0 },
        children: [
          text("Supporting evidence", {
            size: 13.5,
            bold: true,
            color: GREEN_DEEP,
          }),
        ],
        keepNext: true,
      })
    );
    body.push(rule(GOLD));
    if (n.evidence_url) {
      body.push(
        para(
          [
            text("Link:  ", { size: 9, bold: true, color: MUTED }),
            text(n.evidence_url, { size: 9, color: GREEN_DEEP }),
          ],
          { after: 120 }
        )
      );
    }
    body.push(...attachmentBlocks(nomFiles));
  }

  // ---- document ----------------------------------------------------------
  const logo = fit(RARE_LOGO_WIDTH, RARE_LOGO_HEIGHT, 58, 58);

  const doc = new Document({
    creator: "RARE India",
    title: `${awardTitle(n.award_category)} — ${n.hotel_name}`,
    description: "RARE Conscious Travel Awards — nomination for jury review",
    styles: {
      default: {
        document: { run: { font: FONT, size: 21, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1100, right: 1000, bottom: 1000, left: 1000 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new ImageRun({
                    data: b64ToUint8(RARE_LOGO_PNG_BASE64),
                    transformation: logo,
                    type: "png",
                  }),
                  text("     RARE India", {
                    size: 9,
                    bold: true,
                    color: GREEN_DEEP,
                    caps: true,
                    spacing: 30,
                  }),
                  text("     ·     Conscious Travel Awards", {
                    size: 9,
                    color: GOLD_DEEP,
                    caps: true,
                    spacing: 30,
                  }),
                ],
              }),
              rule(),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              rule(),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [
                  text("rareindia.com", { size: 8.5, color: GREEN_DEEP, bold: true }),
                  text("     ·     ", { size: 8.5, color: RULE }),
                  text("shobhanaj@rareindia.com", { size: 8.5, color: GREEN_DEEP }),
                  text("     ·     ", { size: 8.5, color: RULE }),
                  text("In a Regular World, Be RARE", {
                    size: 8.5,
                    italics: true,
                    color: MUTED,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: MUTED,
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/** Safe, descriptive filename for the download. */
export function docxFilename(n: NominationRecord): string {
  const slug = (s: string) =>
    s.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
  const kind = awardTitle(n.award_category).replace(/^RARE /, "");
  return `${slug(n.hotel_name)}-${slug(kind)}.docx`;
}
