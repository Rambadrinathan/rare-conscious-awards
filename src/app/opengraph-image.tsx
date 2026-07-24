import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const alt = "RARE Conscious Travel Awards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let logoSrc: string | undefined;
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public", "rare-logo.jpeg")
    );
    logoSrc = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    logoSrc = undefined;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F1E6",
          fontFamily: "sans-serif",
        }}
      >
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            width={220}
            height={220}
            style={{
              borderRadius: 110,
              objectFit: "cover",
              boxShadow: "0 8px 32px rgba(58,52,44,0.12)",
            }}
          />
        ) : null}
        <div
          style={{
            marginTop: 36,
            fontSize: 48,
            fontWeight: 800,
            color: "#5a8532",
            letterSpacing: "0.06em",
            textAlign: "center",
            padding: "0 48px",
          }}
        >
          RARE Conscious Travel Awards
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            color: "#7a7268",
            textAlign: "center",
          }}
        >
          Self Nomination · The RARE Collection
        </div>
      </div>
    ),
    { ...size }
  );
}
