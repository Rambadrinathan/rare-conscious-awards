import Link from "next/link";
import { listNominations } from "@/lib/store";
import { awardTitle } from "@/lib/touchstones";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminNominationDetail } from "@/components/AdminNominationDetail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — RARE Conscious Travel Awards",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; id?: string }>;
}) {
  const params = await searchParams;
  const adminKey = process.env.ADMIN_KEY?.trim();
  if (adminKey && params.key?.trim() !== adminKey) {
    return (
      <div className="paper-grain flex min-h-screen flex-col">
        <SiteHeader compact />
        <main className="mx-auto max-w-md flex-1 px-5 py-20 text-center">
          <div className="rare-card p-8">
            <h1 className="text-xl font-bold text-rare-ink">Admin access</h1>
            <p className="mt-3 text-sm text-rare-muted">
              Open the admin link with your key, or add{" "}
              <code className="font-mono">?key=…</code> to the URL.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const nominations = await listNominations();
  const selected = params.id
    ? nominations.find((n) => n.id === params.id)
    : null;
  const keyValue = adminKey || "";
  const keyQ = adminKey ? `?key=${encodeURIComponent(adminKey)}` : "";
  const keyAmp = adminKey ? `&key=${encodeURIComponent(adminKey)}` : "";

  return (
    <div className="paper-grain flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-rare-green-deep">
              Nominations
            </h1>
            <p className="text-sm text-rare-muted">
              {nominations.length} submission
              {nominations.length === 1 ? "" : "s"} · edit or delete any entry
            </p>
          </div>
          <a
            href={`/api/admin/export${keyQ}`}
            className="rare-btn rare-btn-primary text-sm"
          >
            Export CSV
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="rare-card divide-y divide-rare-border overflow-hidden">
              {nominations.length === 0 && (
                <p className="p-6 text-sm text-rare-muted">
                  No nominations yet.
                </p>
              )}
              {nominations.map((n) => (
                <Link
                  key={n.id}
                  href={`/admin?id=${n.id}${keyAmp}`}
                  className={`block px-4 py-4 no-underline transition hover:bg-rare-cream ${
                    selected?.id === n.id ? "bg-rare-cream" : ""
                  }`}
                >
                  <div className="font-bold text-rare-ink">{n.hotel_name}</div>
                  <div className="mt-0.5 text-xs text-rare-muted">
                    {awardTitle(n.award_category)}
                  </div>
                  <div className="mt-1 text-xs text-rare-muted">
                    {new Date(n.created_at).toLocaleString()} ·{" "}
                    {n.contact_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <AdminNominationDetail
                key={selected.id}
                nomination={selected}
                adminKey={keyValue}
              />
            ) : (
              <div className="rare-card p-8 text-sm text-rare-muted">
                Select a nomination on the left to view, edit, or delete it.
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
