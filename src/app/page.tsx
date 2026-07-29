import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TOUCHSTONES } from "@/lib/touchstones";

export default function HomePage() {
  return (
    <div className="paper-grain flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-16 pt-4">
        <section className="rare-card overflow-hidden">
          <div className="relative border-b border-rare-border/70 bg-gradient-to-br from-rare-cream via-rare-white to-[#f3e9cf] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto mb-6 flex justify-center">
              <Image
                src="/rare-logo.jpeg"
                alt="RARE Ginkgo"
                width={72}
                height={72}
                className="rounded-full shadow-md"
                priority
              />
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-rare-gold">
              Bridges · The RARE Collection
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-rare-green-deep sm:text-4xl">
              RARE Conscious Travel Awards
            </h1>
            <p className="mt-2 text-lg font-semibold text-rare-ink">
              Self Nomination
            </p>
            <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-rare-muted">
              Open to{" "}
              <strong className="font-semibold text-rare-ink">
                Bridges participating hotels
              </strong>
              . Nominate for{" "}
              <strong className="font-semibold text-rare-ink">
                Sustainability Lighthouse
              </strong>{" "}
              (property) or{" "}
              <strong className="font-semibold text-rare-ink">
                Sustainability Lightkeeper
              </strong>{" "}
              (individual). Guided by the{" "}
              <strong className="font-semibold text-rare-ink">Pinwheel</strong> —
              RARE&apos;s framework for responsible, respectful, and
              place-relevant travel.
            </p>
            <p className="mt-4 text-sm font-medium text-rare-ink/80">
              About 12 minutes · 9 short touchstone prompts · No audit paperwork
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/nominate" className="rare-btn rare-btn-primary">
                Begin nomination
              </Link>
              <a
                href="#how-it-works"
                className="rare-btn rare-btn-ghost"
              >
                How it works
              </a>
            </div>
          </div>

          <div id="how-it-works" className="grid gap-0 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Your property",
                d: "Choose your Bridges hotel, contact details, and award (Lighthouse or Lightkeeper).",
              },
              {
                n: "02",
                t: "Your Pinwheel",
                d: "Nine simple prompts — one for each touchstone. Real practice, few sentences.",
              },
              {
                n: "03",
                t: "Submit",
                d: "Optional signature story, then send. The jury reviews your nomination.",
              },
            ].map((item) => (
              <div
                key={item.n}
                className="border-t border-rare-border/70 p-6 sm:border-t-0 sm:border-l sm:first:border-l-0"
              >
                <div className="text-xs font-bold tracking-[0.18em] text-rare-gold">
                  {item.n}
                </div>
                <h2 className="mt-2 font-extrabold text-rare-ink">{item.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-rare-muted">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-rare-muted">
            The nine touchstones
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOUCHSTONES.map((t) => (
              <div
                key={t.key}
                className="flex items-start gap-3 rounded-2xl border border-rare-border bg-rare-white/80 px-4 py-3"
              >
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    t.kind === "cardinal" ? "bg-rare-green" : "bg-rare-gold"
                  }`}
                />
                <div>
                  <div className="font-bold text-rare-ink">{t.name}</div>
                  <div className="text-sm text-rare-muted line-clamp-2">
                    {t.definition}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/nominate" className="rare-btn rare-btn-primary">
            Begin nomination
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
