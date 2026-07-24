import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="w-full">
      <div
        className={`mx-auto flex max-w-3xl items-center justify-between px-5 ${
          compact ? "py-5" : "py-8"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/rare-logo.jpeg"
            alt="RARE"
            width={compact ? 48 : 56}
            height={compact ? 48 : 56}
            className="rounded-full object-cover shadow-sm"
            priority
          />
          <div className="leading-tight">
            <div
              className="text-lg font-extrabold tracking-[0.22em] text-rare-green"
              style={{ letterSpacing: "0.22em" }}
            >
              RARE
            </div>
            {!compact && (
              <div className="text-xs text-rare-muted">
                Creating Shared Value
              </div>
            )}
          </div>
        </Link>
        <div className="text-right text-xs uppercase tracking-[0.14em] text-rare-muted">
          Conscious Travel Awards
        </div>
      </div>
    </header>
  );
}
