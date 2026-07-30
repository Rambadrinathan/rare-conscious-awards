import Link from "next/link";
import { PageShell } from "@/components/PageShell";

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function ThanksPage({ searchParams }: Props) {
  const params = await searchParams;
  const ref = params.ref;

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 pb-16">
        <div className="rare-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rare-green/15 text-2xl text-rare-green">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-rare-green-deep sm:text-3xl">
            Nomination received
          </h1>
          <p className="mt-4 leading-relaxed text-rare-muted">
            Thank you for putting your practices into words. The RARE jury will
            review nominations for the Conscious Travel Awards. We&apos;ll be in
            touch if you are shortlisted.
          </p>
          {ref && (
            <p className="mt-6 rounded-xl bg-rare-cream px-4 py-3 text-sm text-rare-ink">
              Reference{" "}
              <code className="font-mono font-semibold text-rare-green-deep">
                {ref.slice(0, 8).toUpperCase()}
              </code>
            </p>
          )}
          <div className="mt-8">
            <Link href="/" className="rare-btn rare-btn-ghost">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
