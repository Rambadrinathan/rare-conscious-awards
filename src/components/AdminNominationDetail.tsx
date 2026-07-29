"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AWARD_CATEGORIES,
  awardTitle,
  TOUCHSTONES,
} from "@/lib/touchstones";
import type { NominationRecord } from "@/lib/types";

type Props = {
  nomination: NominationRecord;
  adminKey: string;
};

export function AdminNominationDetail({ nomination, adminKey }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [hotelName, setHotelName] = useState(nomination.hotel_name);
  const [contactName, setContactName] = useState(nomination.contact_name);
  const [contactEmail, setContactEmail] = useState(nomination.contact_email);
  const [contactPhone, setContactPhone] = useState(
    nomination.contact_phone || ""
  );
  const [awardCategory, setAwardCategory] = useState(nomination.award_category);
  const [nomineeName, setNomineeName] = useState(nomination.nominee_name || "");
  const [nomineeRole, setNomineeRole] = useState(nomination.nominee_role || "");
  const [signatureStory, setSignatureStory] = useState(
    nomination.signature_story || ""
  );
  const [sustainabilityLead, setSustainabilityLead] = useState(
    nomination.sustainability_lead || ""
  );
  const [status, setStatus] = useState(nomination.status);
  const [answers, setAnswers] = useState(() =>
    TOUCHSTONES.map((t) => {
      const a = nomination.answers.find((x) => x.touchstone_key === t.key);
      return {
        touchstone_key: t.key,
        not_applicable: a?.not_applicable || false,
        answer_text: a?.answer_text || "",
      };
    })
  );

  const headers = {
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  };

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/nominations/${nomination.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          hotel_name: hotelName.trim(),
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          award_category: awardCategory,
          nominee_name: nomineeName.trim() || null,
          nominee_role: nomineeRole.trim() || null,
          signature_story: signatureStory.trim() || null,
          sustainability_lead: sustainabilityLead.trim() || null,
          status,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Saved.");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Delete nomination for "${nomination.hotel_name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/nominations/${nomination.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push(`/admin?key=${encodeURIComponent(adminKey)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  function updateAnswer(
    key: string,
    patch: Partial<{ not_applicable: boolean; answer_text: string }>
  ) {
    setAnswers((prev) =>
      prev.map((a) => (a.touchstone_key === key ? { ...a, ...patch } : a))
    );
  }

  return (
    <article className="rare-card space-y-5 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {editing ? (
            <input
              className="rare-input text-xl font-extrabold"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
            />
          ) : (
            <h2 className="text-xl font-extrabold text-rare-ink">
              {hotelName}
            </h2>
          )}
          <p className="mt-1 text-sm text-rare-muted">
            {awardTitle(awardCategory)}
            {nomineeName
              ? ` · Nominee: ${nomineeName}${
                  nomineeRole ? ` (${nomineeRole})` : ""
                }`
              : ""}
          </p>
          <p className="mt-2 font-mono text-xs text-rare-muted">
            {nomination.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button
              type="button"
              className="rare-btn rare-btn-primary text-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rare-btn rare-btn-primary text-sm"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="rare-btn rare-btn-ghost text-sm"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                  setMessage(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            className="rare-btn text-sm"
            style={{
              background: "#a33a2f",
              color: "white",
            }}
            onClick={remove}
            disabled={deleting || saving}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-rare-green/30 bg-rare-green/10 px-4 py-3 text-sm text-rare-green-deep">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" editing={editing} value={contactName} onChange={setContactName} />
        <Field label="Email" editing={editing} value={contactEmail} onChange={setContactEmail} />
        <Field label="Phone" editing={editing} value={contactPhone} onChange={setContactPhone} />
        <div>
          <label className="rare-label">Status</label>
          {editing ? (
            <select
              className="rare-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as NominationRecord["status"])}
            >
              <option value="submitted">submitted</option>
              <option value="shortlisted">shortlisted</option>
              <option value="winner">winner</option>
              <option value="withdrawn">withdrawn</option>
            </select>
          ) : (
            <p className="text-sm text-rare-ink">{status}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="rare-label">Award</label>
          {editing ? (
            <select
              className="rare-select"
              value={awardCategory}
              onChange={(e) =>
                setAwardCategory(e.target.value as NominationRecord["award_category"])
              }
            >
              {AWARD_CATEGORIES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-rare-ink">
              {awardTitle(awardCategory)}
            </p>
          )}
        </div>
        <Field label="Nominee name" editing={editing} value={nomineeName} onChange={setNomineeName} />
        <Field label="Nominee role" editing={editing} value={nomineeRole} onChange={setNomineeRole} />
        <Field
          label="Sustainability lead"
          editing={editing}
          value={sustainabilityLead}
          onChange={setSustainabilityLead}
        />
      </div>

      <div>
        <label className="rare-label">Signature story</label>
        {editing ? (
          <textarea
            className="rare-textarea"
            value={signatureStory}
            onChange={(e) => setSignatureStory(e.target.value)}
            rows={3}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-rare-ink">
            {signatureStory || "—"}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {TOUCHSTONES.map((t) => {
          const a = answers.find((x) => x.touchstone_key === t.key)!;
          return (
            <div key={t.key} className="border-t border-rare-border pt-4">
              <h3 className="font-bold text-rare-green-deep">
                {t.number}. {t.name}
              </h3>
              {editing ? (
                <div className="mt-2 space-y-2">
                  {t.allowNa && (
                    <label className="flex items-center gap-2 text-sm text-rare-muted">
                      <input
                        type="checkbox"
                        className="accent-[var(--rare-gold)]"
                        checked={a.not_applicable}
                        onChange={(e) =>
                          updateAnswer(t.key, {
                            not_applicable: e.target.checked,
                          })
                        }
                      />
                      Not applicable
                    </label>
                  )}
                  {!a.not_applicable && (
                    <textarea
                      className="rare-textarea"
                      value={a.answer_text}
                      onChange={(e) =>
                        updateAnswer(t.key, { answer_text: e.target.value })
                      }
                      rows={3}
                    />
                  )}
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-rare-ink">
                  {a.not_applicable
                    ? "Not applicable to destination"
                    : a.answer_text || "—"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Field({
  label,
  editing,
  value,
  onChange,
}: {
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="rare-label">{label}</label>
      {editing ? (
        <input
          className="rare-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-sm text-rare-ink">{value || "—"}</p>
      )}
    </div>
  );
}
