"use client";

import { useRef, useState } from "react";
import type { SupportingFile } from "@/lib/types";

const MAX_IMAGE_BYTES = 800_000;
const MAX_DOC_BYTES = 1_000_000;

/**
 * Total attachment bytes allowed across one nomination. Files travel
 * base64-encoded inside the JSON payload (~1.37x overhead), so this keeps the
 * request under the API's ~4 MB ceiling with room to spare.
 */
export const TOTAL_UPLOAD_BUDGET = 2_600_000;
const TOTAL_BUDGET_KB = TOTAL_UPLOAD_BUDGET / 1000;

type Props = {
  files: SupportingFile[];
  onChange: (files: SupportingFile[]) => void;
  error?: string;
  /** Per-block caps. Touchstone blocks run tighter than the main evidence step. */
  maxImages?: number;
  maxDocs?: number;
  /** Compact chrome for the inline per-touchstone blocks. */
  compact?: boolean;
  /** Bytes still available across the whole submission; blocks adds that would overflow. */
  budgetBytes?: number;
};

/** Longest edge we keep. Plenty for jury review; kills phone-camera bloat. */
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscale + re-encode an image in the browser so a 4 MB phone photo becomes
 * a few hundred KB. Nominees never have to compress anything themselves.
 * Returns base64 (no data: prefix) plus the resulting byte size.
 * Falls back to the original bytes if the image can't be decoded.
 */
async function compressImage(
  file: File
): Promise<{ base64: string; size: number; mime: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    // white matte so transparent PNGs don't turn black as JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1] || "";
    const size = Math.round((base64.length * 3) / 4);

    // Keep the original if compression somehow made it bigger.
    if (size >= file.size) {
      return { base64: await readAsBase64(file), size: file.size, mime: file.type };
    }
    return { base64, size, mime: "image/jpeg" };
  } catch {
    return { base64: await readAsBase64(file), size: file.size, mime: file.type };
  }
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function EvidenceUploader({
  files,
  onChange,
  error,
  maxImages = 5,
  maxDocs = 3,
  compact = false,
  budgetBytes = Number.POSITIVE_INFINITY,
}: Props) {
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const MAX_IMAGES = maxImages;
  const MAX_DOCS = maxDocs;

  const images = files.filter((f) => f.kind === "image");
  const docs = files.filter((f) => f.kind === "document");

  async function addFiles(
    list: FileList | null,
    kind: "image" | "document"
  ) {
    if (!list?.length) return;
    const maxCount = kind === "image" ? MAX_IMAGES : MAX_DOCS;
    const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
    const current = files.filter((f) => f.kind === kind);
    const remaining = maxCount - current.length;
    if (remaining <= 0) return;

    const next: SupportingFile[] = [...files];
    const picked = Array.from(list).slice(0, remaining);
    let spent = 0;

    setBusy(true);
    try {
      for (const file of picked) {
        if (kind === "image" && !file.type.startsWith("image/")) {
          alert(`"${file.name}" is not an image.`);
          continue;
        }
        if (
          kind === "document" &&
          ![
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
          ].includes(file.type) &&
          !/\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name)
        ) {
          alert(`"${file.name}" must be PDF, Word, Excel, or text.`);
          continue;
        }

        // Images are shrunk here, so a big camera photo is fine to pick.
        // Documents can't be compressed in the browser, so they keep a cap.
        let data_base64: string;
        let size: number;
        let mime: string;

        if (kind === "image") {
          const out = await compressImage(file);
          data_base64 = out.base64;
          size = out.size;
          mime = out.mime;
        } else {
          if (file.size > maxBytes) {
            alert(
              `"${file.name}" is ${Math.round(file.size / 1000)} KB — too large ` +
                `(max ${Math.round(maxBytes / 1000)} KB per document). ` +
                `Please compress the PDF, or share it using the link field instead.`
            );
            continue;
          }
          data_base64 = await readAsBase64(file);
          size = file.size;
          mime = file.type || "application/octet-stream";
        }

        if (size > budgetBytes - spent) {
          alert(
            `"${file.name}" does not fit in what's left of the ` +
              `${Math.round(TOTAL_BUDGET_KB)} KB total upload allowance for this ` +
              `nomination. Remove a file elsewhere, or share this one using the ` +
              `link field instead.`
          );
          continue;
        }

        spent += size;
        next.push({ name: file.name, mime, size, data_base64, kind });
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  function remove(indexInKind: number, kind: "image" | "document") {
    let seen = 0;
    onChange(
      files.filter((f) => {
        if (f.kind !== kind) return true;
        const keep = seen !== indexInKind;
        seen += 1;
        return keep;
      })
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="rare-label">Supporting images</p>
        {!compact && (
          <p className="rare-hint mb-2">
            Up to {MAX_IMAGES}{" "}images (JPG/PNG). Photos of practice, team, or
            place help the jury. Large photos are resized automatically — you
            don&apos;t need to compress them yourself.
          </p>
        )}
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="rare-btn rare-btn-ghost"
          onClick={() => imageRef.current?.click()}
          disabled={busy || images.length >= MAX_IMAGES}
        >
          {busy ? "Processing…" : `Add images (${images.length}/${MAX_IMAGES})`}
        </button>
        {images.length > 0 && (
          <ul className="mt-3 space-y-2">
            {images.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-rare-border bg-rare-white px-3 py-2 text-sm"
              >
                <span className="truncate text-rare-ink">{f.name}</span>
                <button
                  type="button"
                  className="ml-3 shrink-0 text-rare-muted underline"
                  onClick={() => remove(i, "image")}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="rare-label">Supporting documents</p>
        {!compact && (
          <p className="rare-hint mb-2">
            Up to {MAX_DOCS} files (PDF / Word / Excel, max ~1 MB each).
            Documents cannot be resized automatically — please compress large
            PDFs, or share them using the link field.
          </p>
        )}
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files, "document");
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="rare-btn rare-btn-ghost"
          onClick={() => docRef.current?.click()}
          disabled={busy || docs.length >= MAX_DOCS}
        >
          {busy ? "Processing…" : `Add documents (${docs.length}/${MAX_DOCS})`}
        </button>
        {docs.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docs.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-rare-border bg-rare-white px-3 py-2 text-sm"
              >
                <span className="truncate text-rare-ink">{f.name}</span>
                <button
                  type="button"
                  className="ml-3 shrink-0 text-rare-muted underline"
                  onClick={() => remove(i, "document")}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="rare-error">{error}</p>}
    </div>
  );
}
