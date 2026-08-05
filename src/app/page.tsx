import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function HomePage() {
  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-16 pt-4">
        <section className="rare-card overflow-hidden">
          <div className="relative border-b border-rare-border/70 bg-gradient-to-br from-rare-cream via-rare-white to-[#f3e9cf] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto mb-6 flex justify-center">
              <Image
                src="/rare-logo.png"
                alt="RARE"
                width={160}
                height={96}
                className="h-20 w-auto object-contain drop-shadow-sm sm:h-24"
                priority
              />
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-rare-green-deep sm:text-4xl">
              RARE Conscious Travel Awards
            </h1>
            <p className="mt-2 text-lg font-semibold text-rare-ink">
              Self Nomination
            </p>
            <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-rare-muted">
              Open to all exhibitors at{" "}
              <strong className="font-semibold text-rare-ink">
                BRIDGES for conscious travel 2026
              </strong>
              . Nominate for{" "}
              <strong className="font-semibold text-rare-ink">
                RARE Sustainability Lighthouse
              </strong>{" "}
              (Hotel / Experience) and/or{" "}
              <strong className="font-semibold text-rare-ink">
                RARE Sustainability Lightkeeper
              </strong>{" "}
              (Individual).
            </p>
            <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-relaxed text-rare-muted">
              Guided by the{" "}
              <strong className="font-semibold text-rare-ink">Pinwheel</strong> —
              RARE&apos;s framework for planet sensitive and community inclusive
              travel.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/nominate" className="rare-btn rare-btn-primary">
                Begin nomination
              </Link>
              <a href="#how-it-works" className="rare-btn rare-btn-ghost">
                How it works
              </a>
            </div>
          </div>

          <div id="how-it-works" className="grid gap-0 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Your hotel",
                d: "Select your Hotel name, add contact details, choose type of Award (Lighthouse or LightKeeper).",
              },
              {
                n: "02",
                t: "Your story",
                d: "Lighthouse: Pinwheel touchstones. Lightkeeper: why this person, accomplishments, achievements, and what they are pushing for.",
              },
              {
                n: "03",
                t: "Evidence & submit",
                d: "Add supporting images and documents, then send. The jury reviews your nomination.",
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

        <div className="mt-12 text-center">
          <Link href="/nominate" className="rare-btn rare-btn-primary">
            Begin nomination
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
