import { PageShell } from "@/components/PageShell";
import { NominationForm } from "@/components/NominationForm";

export const metadata = {
  title: "Nominate — RARE Conscious Travel Awards",
};

export default function NominatePage() {
  return (
    <PageShell compactHeader>
      <main className="flex-1 pt-2">
        <div className="mx-auto mb-6 max-w-3xl px-5 text-center">
          <h1 className="text-2xl font-extrabold text-rare-green-deep sm:text-3xl">
            Self nomination
          </h1>
          <p className="mt-2 text-rare-muted">
            Lighthouse for hotels &amp; experiences · Lightkeeper for
            individuals
          </p>
        </div>
        <NominationForm />
      </main>
    </PageShell>
  );
}
