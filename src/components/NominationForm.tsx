"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import hotels from "@/data/hotels.json";
import {
  AWARD_CATEGORIES,
  TOUCHSTONES,
  type AwardCategoryId,
} from "@/lib/touchstones";
import type { HotelSeed } from "@/lib/types";
import { HotelCombobox } from "./HotelCombobox";
import { TouchstoneIcon } from "./TouchstoneIcon";

type AnswerState = {
  touchstone_key: string;
  not_applicable: boolean;
  answer_text: string;
};

const hotelList = hotels as HotelSeed[];

const initialAnswers: AnswerState[] = TOUCHSTONES.map((t) => ({
  touchstone_key: t.key,
  not_applicable: false,
  answer_text: "",
}));

export function NominationForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [hotelName, setHotelName] = useState("");
  const [hotelNotListed, setHotelNotListed] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [awardCategory, setAwardCategory] =
    useState<AwardCategoryId>("sustainability_lighthouse");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRole, setNomineeRole] = useState("");
  const [answers, setAnswers] = useState<AnswerState[]>(initialAnswers);
  const [signatureStory, setSignatureStory] = useState("");
  const [sustainabilityLead, setSustainabilityLead] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const award = AWARD_CATEGORIES.find((a) => a.id === awardCategory)!;

  const completedCount = useMemo(() => {
    return answers.filter((a) => {
      const ts = TOUCHSTONES.find((t) => t.key === a.touchstone_key)!;
      if (a.not_applicable && ts.allowNa) return true;
      return a.answer_text.trim().length >= 20;
    }).length;
  }, [answers]);

  function updateAnswer(key: string, patch: Partial<AnswerState>) {
    setAnswers((prev) =>
      prev.map((a) => (a.touchstone_key === key ? { ...a, ...patch } : a))
    );
  }

  function validateIdentity(): boolean {
    const errs: Record<string, string> = {};
    if (hotelName.trim().length < 2) errs.hotel = "Please select or enter your hotel";
    if (contactName.trim().length < 2) errs.contact_name = "Your name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errs.contact_email = "A valid email is required";
    if (award.needsNominee && nomineeName.trim().length < 2)
      errs.nominee_name = "Nominee name is required for this award";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateTouchstones(): boolean {
    for (const ts of TOUCHSTONES) {
      const a = answers.find((x) => x.touchstone_key === ts.key)!;
      if (a.not_applicable && ts.allowNa) continue;
      if (a.not_applicable && !ts.allowNa) {
        setFormError(`${ts.name} cannot be marked not applicable.`);
        return false;
      }
      if (a.answer_text.trim().length < 20) {
        setFormError(
          `Please write a short answer (a few sentences) for ${ts.name}.`
        );
        return false;
      }
    }
    setFormError(null);
    return true;
  }

  async function handleSubmit() {
    if (!consent) {
      setFormError("Please confirm that this submission is accurate.");
      return;
    }
    if (!validateTouchstones()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_name: hotelName.trim(),
          hotel_not_listed: hotelNotListed,
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || undefined,
          award_category: awardCategory,
          nominee_name: nomineeName.trim() || undefined,
          nominee_role: nomineeRole.trim() || undefined,
          signature_story: signatureStory.trim() || undefined,
          sustainability_lead: sustainabilityLead.trim() || undefined,
          evidence_url: evidenceUrl.trim() || undefined,
          consent: true,
          website_honeypot: honeypot,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit nomination");
      }

      router.push(`/thanks?ref=${encodeURIComponent(data.id)}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20">
      {/* Progress */}
      <div className="mb-8 rare-card p-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-rare-ink">
            {step === 1 && "Step 1 · Your property"}
            {step === 2 && "Step 2 · Your Pinwheel"}
            {step === 3 && "Step 3 · Review & submit"}
          </span>
          <span className="text-rare-muted">
            {step === 2
              ? `${completedCount} of ${TOUCHSTONES.length} touchstones`
              : `Step ${step} of 3`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {TOUCHSTONES.map((t, i) => {
            const a = answers[i];
            const done =
              (a.not_applicable && t.allowNa) ||
              a.answer_text.trim().length >= 20;
            return (
              <div
                key={t.key}
                className={`blade-dot ${done ? "done" : ""} ${
                  step === 2 && !done ? "active" : ""
                }`}
                title={t.name}
              />
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <section className="rare-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Your property
            </h2>
            <p className="rare-hint mt-2">
              Open to Bridges participating hotels. Choose{" "}
              <strong>Sustainability Lighthouse</strong> (property) or{" "}
              <strong>Sustainability Lightkeeper</strong> (individual). About 12
              minutes for the full form.
            </p>
          </div>

          <HotelCombobox
            hotels={hotelList}
            value={hotelName}
            notListed={hotelNotListed}
            onChange={(name, notListed) => {
              setHotelName(name);
              setHotelNotListed(notListed);
            }}
            error={fieldErrors.hotel}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="rare-label" htmlFor="contact_name">
                Your name
              </label>
              <input
                id="contact_name"
                className="rare-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
              />
              {fieldErrors.contact_name && (
                <p className="rare-error">{fieldErrors.contact_name}</p>
              )}
            </div>
            <div>
              <label className="rare-label" htmlFor="contact_email">
                Email
              </label>
              <input
                id="contact_email"
                type="email"
                className="rare-input"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@hotel.com"
              />
              {fieldErrors.contact_email && (
                <p className="rare-error">{fieldErrors.contact_email}</p>
              )}
            </div>
          </div>

          <div>
            <label className="rare-label" htmlFor="contact_phone">
              Phone / WhatsApp{" "}
              <span className="font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              id="contact_phone"
              className="rare-input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 …"
            />
          </div>

          <div>
            <p className="rare-label">Award category</p>
            <div className="mt-2 space-y-3">
              {AWARD_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    awardCategory === cat.id
                      ? "border-rare-green bg-rare-cream"
                      : "border-rare-border bg-rare-white hover:border-rare-gold"
                  }`}
                >
                  <input
                    type="radio"
                    name="award"
                    className="mt-1 accent-[var(--rare-green)]"
                    checked={awardCategory === cat.id}
                    onChange={() => setAwardCategory(cat.id)}
                  />
                  <span>
                    <span className="block font-bold text-rare-ink">
                      {cat.title}
                    </span>
                    <span className="mt-1 block text-sm text-rare-muted">
                      {cat.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {award.needsNominee && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="rare-label" htmlFor="nominee_name">
                  Nominee name
                </label>
                <input
                  id="nominee_name"
                  className="rare-input"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="Person being nominated"
                />
                {fieldErrors.nominee_name && (
                  <p className="rare-error">{fieldErrors.nominee_name}</p>
                )}
              </div>
              <div>
                <label className="rare-label" htmlFor="nominee_role">
                  Nominee role
                </label>
                <input
                  id="nominee_role"
                  className="rare-input"
                  value={nomineeRole}
                  onChange={(e) => setNomineeRole(e.target.value)}
                  placeholder="e.g. General Manager, Owner"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="rare-btn rare-btn-primary"
              onClick={() => {
                if (validateIdentity()) setStep(2);
              }}
            >
              Continue to Pinwheel
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <div className="rare-card p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Your Pinwheel
            </h2>
            <p className="rare-hint mt-2">
              Nine short prompts — one for each touchstone. A few sentences of{" "}
              <em>real practice</em> is perfect. No jargon. No audit paperwork.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wider">
              <span className="rounded-full bg-rare-green/15 px-3 py-1 text-rare-green-deep">
                Green · Cardinal (all hotels)
              </span>
              <span className="rounded-full bg-rare-gold/20 px-3 py-1 text-[#8a6a1f]">
                Gold · Ordinal (place-specific)
              </span>
            </div>
          </div>

          {TOUCHSTONES.map((ts) => {
            const a = answers.find((x) => x.touchstone_key === ts.key)!;
            return (
              <article
                key={ts.key}
                className="rare-card overflow-hidden"
                id={`ts-${ts.key}`}
              >
                <div className="flex gap-4 border-b border-rare-border/70 p-5 sm:p-6">
                  <TouchstoneIcon
                    touchstoneKey={ts.key}
                    kind={ts.kind}
                    className="h-12 w-12 shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-rare-muted">
                        {ts.number.toString().padStart(2, "0")}
                      </span>
                      <h3 className="text-xl font-extrabold text-rare-ink">
                        {ts.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-rare-muted">
                      {ts.definition}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-5 sm:p-6">
                  <p className="text-sm font-semibold text-rare-ink">
                    What we&apos;re looking for
                  </p>
                  <p className="text-[0.95rem] leading-relaxed text-rare-ink/90">
                    {ts.prompt}
                  </p>
                  {ts.allowNa && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-rare-muted">
                      <input
                        type="checkbox"
                        className="accent-[var(--rare-gold)]"
                        checked={a.not_applicable}
                        onChange={(e) =>
                          updateAnswer(ts.key, {
                            not_applicable: e.target.checked,
                            answer_text: e.target.checked ? "" : a.answer_text,
                          })
                        }
                      />
                      Not relevant to our destination
                    </label>
                  )}
                  {!a.not_applicable && (
                    <textarea
                      className="rare-textarea"
                      value={a.answer_text}
                      onChange={(e) =>
                        updateAnswer(ts.key, { answer_text: e.target.value })
                      }
                      placeholder="2–5 sentences is perfect…"
                      rows={4}
                    />
                  )}
                </div>
              </article>
            );
          })}

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="rare-btn rare-btn-ghost"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="button"
              className="rare-btn rare-btn-primary"
              onClick={() => {
                if (validateTouchstones()) setStep(3);
              }}
            >
              Review submission
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rare-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Review & submit
            </h2>
            <p className="rare-hint mt-2">
              A last optional note for the jury, then confirm and send.
            </p>
          </div>

          <div className="rounded-xl bg-rare-cream px-4 py-4 text-sm leading-relaxed text-rare-ink">
            <p>
              <strong>{hotelName}</strong>
            </p>
            <p className="mt-1 text-rare-muted">
              {award.title}
              {award.needsNominee && nomineeName
                ? ` · ${nomineeName}${nomineeRole ? `, ${nomineeRole}` : ""}`
                : ""}
            </p>
            <p className="mt-1 text-rare-muted">
              {contactName} · {contactEmail}
            </p>
            <p className="mt-2 font-semibold text-rare-green-deep">
              {completedCount} / {TOUCHSTONES.length} touchstones complete
            </p>
          </div>

          <div>
            <label className="rare-label" htmlFor="signature">
              Signature story{" "}
              <span className="font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <p className="rare-hint mb-2">
              If the jury remembers one thing about you, what should it be?
            </p>
            <textarea
              id="signature"
              className="rare-textarea"
              value={signatureStory}
              onChange={(e) => setSignatureStory(e.target.value)}
              rows={3}
              placeholder="Your most distinctive contribution…"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="rare-label" htmlFor="lead">
                Sustainability lead{" "}
                <span className="font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                id="lead"
                className="rare-input"
                value={sustainabilityLead}
                onChange={(e) => setSustainabilityLead(e.target.value)}
                placeholder="Name / role who owns this work"
              />
            </div>
            <div>
              <label className="rare-label" htmlFor="evidence">
                Evidence link{" "}
                <span className="font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                id="evidence"
                className="rare-input"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rare-border p-4">
            <input
              type="checkbox"
              className="mt-1 accent-[var(--rare-green)]"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="text-sm leading-relaxed text-rare-ink">
              I confirm this nomination is accurate and submitted on behalf of
              the property named above.
            </span>
          </label>

          {/* Honeypot */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="rare-btn rare-btn-ghost"
              onClick={() => setStep(2)}
              disabled={submitting}
            >
              Back to answers
            </button>
            <button
              type="button"
              className="rare-btn rare-btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit nomination"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
