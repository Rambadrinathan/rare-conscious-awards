"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import hotels from "@/data/hotels.json";
import {
  AWARD_CATEGORIES,
  TOUCHSTONES,
  type AwardCategoryId,
} from "@/lib/touchstones";
import type { HotelSeed, SupportingFile } from "@/lib/types";
import { HotelCombobox } from "./HotelCombobox";
import { TouchstoneIcon } from "./TouchstoneIcon";
import { EvidenceUploader, TOTAL_UPLOAD_BUDGET } from "./EvidenceUploader";
import { normalizeUrl } from "@/lib/url";

type AnswerState = {
  touchstone_key: string;
  not_applicable: boolean;
  answer_text: string;
  /** Optional per-touchstone evidence — never required to submit. */
  supporting_files: SupportingFile[];
  evidence_url: string;
};

const hotelList = hotels as HotelSeed[];

const initialAnswers: AnswerState[] = TOUCHSTONES.map((t) => ({
  touchstone_key: t.key,
  not_applicable: false,
  answer_text: "",
  supporting_files: [],
  evidence_url: "",
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
  const [lightkeeperWhy, setLightkeeperWhy] = useState("");
  const [lightkeeperAccomplishments, setLightkeeperAccomplishments] =
    useState("");
  const [lightkeeperAchievements, setLightkeeperAchievements] = useState("");
  const [lightkeeperPushingFor, setLightkeeperPushingFor] = useState("");
  const [answers, setAnswers] = useState<AnswerState[]>(initialAnswers);
  const [signatureStory, setSignatureStory] = useState("");
  const [sustainabilityLead, setSustainabilityLead] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<SupportingFile[]>([]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const award = AWARD_CATEGORIES.find((a) => a.id === awardCategory)!;
  const isLightkeeper = award.formStyle === "lightkeeper";

  const completedCount = useMemo(() => {
    return answers.filter((a) => {
      const ts = TOUCHSTONES.find((t) => t.key === a.touchstone_key)!;
      if (a.not_applicable && ts.allowNa) return true;
      return a.answer_text.trim().length >= 20;
    }).length;
  }, [answers]);

  /** Bytes already claimed by attachments anywhere in the form. */
  const usedBytes = useMemo(() => {
    const inTouchstones = answers.reduce(
      (sum, a) => sum + a.supporting_files.reduce((s, f) => s + f.size, 0),
      0
    );
    const inEvidence = supportingFiles.reduce((s, f) => s + f.size, 0);
    return inTouchstones + inEvidence;
  }, [answers, supportingFiles]);

  const remainingBytes = Math.max(0, TOTAL_UPLOAD_BUDGET - usedBytes);

  function updateAnswer(key: string, patch: Partial<AnswerState>) {
    setAnswers((prev) =>
      prev.map((a) => (a.touchstone_key === key ? { ...a, ...patch } : a))
    );
  }

  function validateIdentity(): boolean {
    const errs: Record<string, string> = {};
    if (hotelName.trim().length < 2)
      errs.hotel = "Please select or enter your hotel";
    if (contactName.trim().length < 2)
      errs.contact_name = "Your name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errs.contact_email = "A valid email is required";
    if (isLightkeeper && nomineeName.trim().length < 2)
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

  function validateLightkeeper(): boolean {
    const errs: Record<string, string> = {};
    if (lightkeeperWhy.trim().length < 20)
      errs.lightkeeper_why =
        "Please explain why this person is chosen (a few sentences).";
    if (lightkeeperAccomplishments.trim().length < 20)
      errs.lightkeeper_accomplishments =
        "Please describe what they have accomplished.";
    if (lightkeeperAchievements.trim().length < 20)
      errs.lightkeeper_achievements = "Please share their key achievements.";
    if (lightkeeperPushingFor.trim().length < 20)
      errs.lightkeeper_pushing_for =
        "Please describe what they are pushing for.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please complete all Lightkeeper narrative fields.");
      return false;
    }
    setFormError(null);
    return true;
  }

  async function handleSubmit() {
    if (!consent) {
      setFormError("Please confirm that this submission is accurate.");
      return;
    }
    if (isLightkeeper) {
      if (!validateLightkeeper()) return;
    } else if (!validateTouchstones()) {
      return;
    }

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
          lightkeeper_why: isLightkeeper ? lightkeeperWhy.trim() : undefined,
          lightkeeper_accomplishments: isLightkeeper
            ? lightkeeperAccomplishments.trim()
            : undefined,
          lightkeeper_achievements: isLightkeeper
            ? lightkeeperAchievements.trim()
            : undefined,
          lightkeeper_pushing_for: isLightkeeper
            ? lightkeeperPushingFor.trim()
            : undefined,
          signature_story: signatureStory.trim() || undefined,
          sustainability_lead: sustainabilityLead.trim() || undefined,
          evidence_url: evidenceUrl.trim() || undefined,
          supporting_files: supportingFiles,
          consent: true,
          website_honeypot: honeypot,
          answers: isLightkeeper
            ? []
            : answers.map((a) => ({
                touchstone_key: a.touchstone_key,
                not_applicable: a.not_applicable,
                answer_text: a.answer_text,
                supporting_files: a.supporting_files,
                evidence_url: a.evidence_url.trim() || undefined,
              })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit nomination");
      }

      router.push(
        `/thanks?ref=${encodeURIComponent(data.id)}${
          data.emailed ? "&emailed=1" : ""
        }`
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20">
      <div className="mb-8 rare-card p-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-rare-ink">
            {step === 1 && "Step 1 · Your hotel"}
            {step === 2 &&
              (isLightkeeper
                ? "Step 2 · The Lightkeeper"
                : "Step 2 · Your Pinwheel")}
            {step === 3 && "Step 3 · Evidence & submit"}
          </span>
          <span className="text-rare-muted">
            {step === 2 && !isLightkeeper
              ? `${completedCount} of ${TOUCHSTONES.length} touchstones`
              : `Step ${step} of 3`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 flex-1 rounded-full ${
                step >= n ? "bg-rare-green" : "bg-rare-border"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <section className="rare-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Your hotel
            </h2>
            <p className="rare-hint mt-2">
              Select your Hotel name, add contact details, choose type of Award
              (Lighthouse or LightKeeper).
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
            <p className="rare-label">Type of Award</p>
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

          {isLightkeeper && (
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
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 2 && !isLightkeeper && (
        <section className="space-y-5">
          <div className="rare-card p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Your Pinwheel
            </h2>
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
                    className="h-14 w-14 shrink-0"
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
                    Not Applicable
                  </label>
                  {!a.not_applicable && (
                    <textarea
                      className="rare-textarea"
                      value={a.answer_text}
                      onChange={(e) =>
                        updateAnswer(ts.key, { answer_text: e.target.value })
                      }
                      placeholder="Tell us about your practice…"
                      rows={4}
                    />
                  )}

                  {!a.not_applicable && (
                    <details className="rounded-xl border border-rare-border/70 bg-rare-white/60">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-rare-green-deep">
                        Add supporting images, documents or a link
                        <span className="ml-1 font-normal text-rare-muted">
                          (optional)
                        </span>
                        {(a.supporting_files.length > 0 ||
                          a.evidence_url.trim()) && (
                          <span className="ml-2 rounded-full bg-rare-green/15 px-2 py-0.5 text-xs text-rare-green-deep">
                            {a.supporting_files.length +
                              (a.evidence_url.trim() ? 1 : 0)}{" "}
                            attached
                          </span>
                        )}
                      </summary>
                      <div className="space-y-4 border-t border-rare-border/70 p-4">
                        <EvidenceUploader
                          compact
                          maxImages={3}
                          maxDocs={2}
                          budgetBytes={remainingBytes}
                          files={a.supporting_files}
                          onChange={(next) =>
                            updateAnswer(ts.key, { supporting_files: next })
                          }
                        />
                        <div>
                          <label
                            className="rare-label"
                            htmlFor={`link-${ts.key}`}
                          >
                            Link
                          </label>
                          <input
                            id={`link-${ts.key}`}
                            className="rare-input"
                            value={a.evidence_url}
                            onChange={(e) =>
                              updateAnswer(ts.key, {
                                evidence_url: e.target.value,
                              })
                            }
                            onBlur={(e) =>
                              updateAnswer(ts.key, {
                                evidence_url: String(
                                  normalizeUrl(e.target.value)
                                ),
                              })
                            }
                            placeholder="www.example.com"
                          />
                        </div>
                        <p className="rare-hint">
                          Photos are resized automatically. All attachments
                          across this nomination share a{" "}
                          {Math.round(
                            TOTAL_UPLOAD_BUDGET / 1000
                          ).toLocaleString()}{" "}
                          KB total limit —{" "}
                          {Math.round(remainingBytes / 1000).toLocaleString()}{" "}
                          KB left.
                        </p>
                      </div>
                    </details>
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
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 2 && isLightkeeper && (
        <section className="rare-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              The Lightkeeper
            </h2>
            <p className="rare-hint mt-2">
              This award is about the person — why they are chosen, what they
              have accomplished, their achievements, and what they are pushing
              for.
            </p>
            {nomineeName && (
              <p className="mt-3 rounded-xl bg-rare-cream px-4 py-3 text-sm font-semibold text-rare-ink">
                Nominating: {nomineeName}
                {nomineeRole ? ` · ${nomineeRole}` : ""}
              </p>
            )}
          </div>

          <div>
            <label className="rare-label" htmlFor="lk_why">
              Why is this person chosen?
            </label>
            <textarea
              id="lk_why"
              className="rare-textarea"
              value={lightkeeperWhy}
              onChange={(e) => setLightkeeperWhy(e.target.value)}
              rows={4}
              placeholder="What makes them the Lightkeeper for your hotel?"
            />
            {fieldErrors.lightkeeper_why && (
              <p className="rare-error">{fieldErrors.lightkeeper_why}</p>
            )}
          </div>

          <div>
            <label className="rare-label" htmlFor="lk_acc">
              What have they accomplished?
            </label>
            <textarea
              id="lk_acc"
              className="rare-textarea"
              value={lightkeeperAccomplishments}
              onChange={(e) => setLightkeeperAccomplishments(e.target.value)}
              rows={4}
              placeholder="Concrete work, programmes, changes they led…"
            />
            {fieldErrors.lightkeeper_accomplishments && (
              <p className="rare-error">
                {fieldErrors.lightkeeper_accomplishments}
              </p>
            )}
          </div>

          <div>
            <label className="rare-label" htmlFor="lk_ach">
              Key achievements
            </label>
            <textarea
              id="lk_ach"
              className="rare-textarea"
              value={lightkeeperAchievements}
              onChange={(e) => setLightkeeperAchievements(e.target.value)}
              rows={4}
              placeholder="Outcomes, recognition, measurable impact…"
            />
            {fieldErrors.lightkeeper_achievements && (
              <p className="rare-error">{fieldErrors.lightkeeper_achievements}</p>
            )}
          </div>

          <div>
            <label className="rare-label" htmlFor="lk_push">
              What are they pushing for?
            </label>
            <textarea
              id="lk_push"
              className="rare-textarea"
              value={lightkeeperPushingFor}
              onChange={(e) => setLightkeeperPushingFor(e.target.value)}
              rows={4}
              placeholder="The next horizon — practices, culture, community, planet…"
            />
            {fieldErrors.lightkeeper_pushing_for && (
              <p className="rare-error">{fieldErrors.lightkeeper_pushing_for}</p>
            )}
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
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="button"
              className="rare-btn rare-btn-primary"
              onClick={() => {
                if (validateLightkeeper()) setStep(3);
              }}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rare-card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-extrabold text-rare-green-deep">
              Evidence & submit
            </h2>
            <p className="rare-hint mt-2">
              Add supporting images and documents, then confirm and send.
            </p>
          </div>

          <div className="rounded-xl bg-rare-cream px-4 py-4 text-sm leading-relaxed text-rare-ink">
            <p>
              <strong>{hotelName}</strong>
            </p>
            <p className="mt-1 text-rare-muted">
              {award.title}
              {isLightkeeper && nomineeName
                ? ` · ${nomineeName}${nomineeRole ? `, ${nomineeRole}` : ""}`
                : ""}
            </p>
            <p className="mt-1 text-rare-muted">
              {contactName} · {contactEmail}
            </p>
            {!isLightkeeper && (
              <p className="mt-2 font-semibold text-rare-green-deep">
                {completedCount} / {TOUCHSTONES.length} touchstones complete
              </p>
            )}
          </div>

          <div className="rounded-xl border border-rare-gold/50 bg-rare-gold/10 px-4 py-3 text-sm leading-relaxed text-rare-ink">
            <p className="font-semibold">
              Please keep all attachments under{" "}
              {Math.round(TOTAL_UPLOAD_BUDGET / 1000).toLocaleString()} KB
              (~2.6 MB) in total
            </p>
            <p className="mt-1 text-rare-ink/80">
              This is the combined limit for everything you attach — here and
              against individual touchstones. Photos are resized automatically,
              so add them freely. Large PDFs must be compressed before
              uploading, or shared using a link instead.
            </p>
          </div>

          <EvidenceUploader
            files={supportingFiles}
            onChange={setSupportingFiles}
            budgetBytes={remainingBytes}
          />

          {usedBytes > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-rare-muted">
                <span>
                  {Math.round(usedBytes / 1000).toLocaleString()} KB of{" "}
                  {Math.round(TOTAL_UPLOAD_BUDGET / 1000).toLocaleString()} KB
                  used
                </span>
                <span>
                  {Math.round(remainingBytes / 1000).toLocaleString()} KB left
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-rare-border">
                <div
                  className={`h-full rounded-full transition-all ${
                    usedBytes / TOTAL_UPLOAD_BUDGET > 0.85
                      ? "bg-rare-gold"
                      : "bg-rare-green"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (usedBytes / TOTAL_UPLOAD_BUDGET) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="rare-label" htmlFor="signature">
              Signature story{" "}
              <span className="font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <p className="rare-hint mb-2">
              If the jury remembers one thing, what should it be?
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
                Additional link{" "}
                <span className="font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                id="evidence"
                className="rare-input"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                onBlur={(e) => setEvidenceUrl(String(normalizeUrl(e.target.value)))}
                placeholder="www.example.com"
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
              the hotel named above.
            </span>
          </label>

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
              Back
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
