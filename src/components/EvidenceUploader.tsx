"use client";

import { useRef } from "react";
import type { SupportingFile } from "@/lib/types";

const MAX_IMAGES = 5;
const MAX_DOCS = 3;
const MAX_IMAGE_BYTES = 800_000;
const MAX_DOC_BYTES = 1_000_000;

type Props = {
  files: SupportingFile[];
  onChange: (files: SupportingFile[]) => void;
  error?: string;
};

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

export function EvidenceUploader({ files, onChange, error }: Props) {
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

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

    for (const file of picked) {
      if (file.size > maxBytes) {
        alert(
          `"${file.name}" is too large (max ${Math.round(maxBytes / 1000)} KB).`
        );
        continue;
      }
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
      const data_base64 = await readAsBase64(file);
      next.push({
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        data_base64,
        kind,
      });
    }
    onChange(next);
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
        <p className="rare-hint mb-2">
          Up to {MAX_IMAGES} images (JPG/PNG, max ~800 KB each). Photos of
          practice, team, or place help the jury.
        </p>
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
          disabled={images.length >= MAX_IMAGES}
        >
          Add images ({images.length}/{MAX_IMAGES})
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
        <p className="rare-hint mb-2">
          Up to {MAX_DOCS} files (PDF / Word / Excel, max ~1 MB each).
        </p>
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
          disabled={docs.length >= MAX_DOCS}
        >
          Add documents ({docs.length}/{MAX_DOCS})
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
