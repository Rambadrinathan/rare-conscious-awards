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
            src="/rare-logo.png"
            alt="RARE"
            width={compact ? 56 : 72}
            height={compact ? 40 : 52}
            className="h-auto w-auto max-h-12 object-contain sm:max-h-14"
            priority
          />
        </Link>
        <div className="text-right text-xs uppercase tracking-[0.14em] text-rare-muted">
          Conscious Travel Awards
        </div>
      </div>
    </header>
  );
}
