import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { NominationPayload, NominationRecord } from "./types";

const LOCAL_FILE = path.join(
  // On Vercel the project dir is read-only; /tmp works for short-lived demos.
  // For durable production storage, configure Supabase.
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data"),
  "nominations.json"
);

async function ensureLocalFile(): Promise<void> {
  const dir = path.dirname(LOCAL_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(LOCAL_FILE);
  } catch {
    await fs.writeFile(LOCAL_FILE, "[]", "utf8");
  }
}

async function readLocal(): Promise<NominationRecord[]> {
  await ensureLocalFile();
  const raw = await fs.readFile(LOCAL_FILE, "utf8");
  return JSON.parse(raw) as NominationRecord[];
}

async function writeLocal(rows: NominationRecord[]): Promise<void> {
  await ensureLocalFile();
  await fs.writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function saveNomination(
  payload: NominationPayload
): Promise<{ id: string; storage: "supabase" | "local" }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const baseRow = {
      hotel_name_text: payload.hotel_name,
      hotel_not_listed: payload.hotel_not_listed,
      contact_name: payload.contact_name,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone || null,
      award_category: payload.award_category,
      nominee_name: payload.nominee_name || null,
      nominee_role: payload.nominee_role || null,
      signature_story: payload.signature_story || null,
      sustainability_lead: payload.sustainability_lead || null,
      evidence_url: payload.evidence_url || null,
      consent: payload.consent,
      status: "submitted",
      source: "bridges_exhibitors",
    };

    const extendedRow = {
      ...baseRow,
      lightkeeper_why: payload.lightkeeper_why || null,
      lightkeeper_accomplishments: payload.lightkeeper_accomplishments || null,
      lightkeeper_achievements: payload.lightkeeper_achievements || null,
      lightkeeper_pushing_for: payload.lightkeeper_pushing_for || null,
      // Store file metadata only in DB if column exists; full base64 can be large
      supporting_files: (payload.supporting_files || []).map((f) => ({
        name: f.name,
        mime: f.mime,
        size: f.size,
        kind: f.kind,
        data_base64: f.data_base64,
      })),
    };

    let data: { id: string } | null = null;
    let error: { message: string } | null = null;

    {
      const res = await supabase
        .from("nominations")
        .insert(extendedRow)
        .select("id")
        .single();
      data = res.data;
      error = res.error;
    }

    // Schema not migrated yet — pack new fields into signature_story + admin_notes-safe base insert
    if (error && /column|schema cache|could not find/i.test(error.message)) {
      const packed = [
        payload.signature_story || "",
        payload.lightkeeper_why
          ? `\n\n[Lightkeeper — Why chosen]\n${payload.lightkeeper_why}`
          : "",
        payload.lightkeeper_accomplishments
          ? `\n\n[Lightkeeper — Accomplishments]\n${payload.lightkeeper_accomplishments}`
          : "",
        payload.lightkeeper_achievements
          ? `\n\n[Lightkeeper — Achievements]\n${payload.lightkeeper_achievements}`
          : "",
        payload.lightkeeper_pushing_for
          ? `\n\n[Lightkeeper — Pushing for]\n${payload.lightkeeper_pushing_for}`
          : "",
        payload.supporting_files?.length
          ? `\n\n[Supporting files: ${payload.supporting_files
              .map((f) => f.name)
              .join(", ")}]`
          : "",
      ]
        .join("")
        .trim();

      const res = await supabase
        .from("nominations")
        .insert({
          ...baseRow,
          signature_story: packed || null,
        })
        .select("id")
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error("No nomination id returned");

    if (payload.answers?.length) {
      const answers = payload.answers.map((a) => ({
        nomination_id: data.id,
        touchstone_key: a.touchstone_key,
        not_applicable: a.not_applicable,
        answer_text: a.answer_text || null,
      }));

      const { error: ansError } = await supabase
        .from("nomination_answers")
        .insert(answers);

      if (ansError) throw new Error(ansError.message);
    }

    return { id: data.id, storage: "supabase" };
  }

  const record: NominationRecord = {
    ...payload,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    status: "submitted",
    source: "bridges_exhibitors",
  };

  const rows = await readLocal();
  rows.unshift(record);
  await writeLocal(rows);
  return { id: record.id, storage: "local" };
}

export async function listNominations(): Promise<NominationRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data: noms, error } = await supabase
      .from("nominations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const { data: answers, error: aErr } = await supabase
      .from("nomination_answers")
      .select("*");

    if (aErr) throw new Error(aErr.message);

    return (noms || []).map((n) => ({
      id: n.id,
      created_at: n.created_at,
      status: n.status,
      source: n.source,
      hotel_name: n.hotel_name_text,
      hotel_not_listed: n.hotel_not_listed,
      contact_name: n.contact_name,
      contact_email: n.contact_email,
      contact_phone: n.contact_phone || undefined,
      award_category: n.award_category,
      nominee_name: n.nominee_name || undefined,
      nominee_role: n.nominee_role || undefined,
      lightkeeper_why: n.lightkeeper_why || undefined,
      lightkeeper_accomplishments: n.lightkeeper_accomplishments || undefined,
      lightkeeper_achievements: n.lightkeeper_achievements || undefined,
      lightkeeper_pushing_for: n.lightkeeper_pushing_for || undefined,
      signature_story: n.signature_story || undefined,
      sustainability_lead: n.sustainability_lead || undefined,
      evidence_url: n.evidence_url || undefined,
      supporting_files: n.supporting_files || [],
      consent: n.consent,
      answers: (answers || [])
        .filter((a) => a.nomination_id === n.id)
        .map((a) => ({
          touchstone_key: a.touchstone_key,
          not_applicable: a.not_applicable,
          answer_text: a.answer_text || "",
        })),
    }));
  }

  return readLocal();
}

export async function getNomination(
  id: string
): Promise<NominationRecord | null> {
  const all = await listNominations();
  return all.find((n) => n.id === id) || null;
}

export type NominationUpdate = {
  hotel_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  award_category?: string;
  nominee_name?: string | null;
  nominee_role?: string | null;
  signature_story?: string | null;
  sustainability_lead?: string | null;
  evidence_url?: string | null;
  status?: string;
  answers?: {
    touchstone_key: string;
    not_applicable: boolean;
    answer_text: string;
  }[];
};

export async function updateNomination(
  id: string,
  patch: NominationUpdate
): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.hotel_name !== undefined) row.hotel_name_text = patch.hotel_name;
    if (patch.contact_name !== undefined) row.contact_name = patch.contact_name;
    if (patch.contact_email !== undefined) row.contact_email = patch.contact_email;
    if (patch.contact_phone !== undefined) row.contact_phone = patch.contact_phone;
    if (patch.award_category !== undefined) row.award_category = patch.award_category;
    if (patch.nominee_name !== undefined) row.nominee_name = patch.nominee_name;
    if (patch.nominee_role !== undefined) row.nominee_role = patch.nominee_role;
    if (patch.signature_story !== undefined)
      row.signature_story = patch.signature_story;
    if (patch.sustainability_lead !== undefined)
      row.sustainability_lead = patch.sustainability_lead;
    if (patch.evidence_url !== undefined) row.evidence_url = patch.evidence_url;
    if (patch.status !== undefined) row.status = patch.status;

    const { error } = await supabase.from("nominations").update(row).eq("id", id);
    if (error) throw new Error(error.message);

    if (patch.answers) {
      for (const a of patch.answers) {
        const { error: aErr } = await supabase.from("nomination_answers").upsert(
          {
            nomination_id: id,
            touchstone_key: a.touchstone_key,
            not_applicable: a.not_applicable,
            answer_text: a.answer_text || null,
          },
          { onConflict: "nomination_id,touchstone_key" }
        );
        if (aErr) throw new Error(aErr.message);
      }
    }
    return;
  }

  const rows = await readLocal();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Nomination not found");
  const cur = rows[idx];
  rows[idx] = {
    ...cur,
    hotel_name: patch.hotel_name ?? cur.hotel_name,
    contact_name: patch.contact_name ?? cur.contact_name,
    contact_email: patch.contact_email ?? cur.contact_email,
    contact_phone:
      patch.contact_phone === undefined
        ? cur.contact_phone
        : patch.contact_phone || undefined,
    award_category: (patch.award_category as NominationRecord["award_category"]) ??
      cur.award_category,
    nominee_name:
      patch.nominee_name === undefined
        ? cur.nominee_name
        : patch.nominee_name || undefined,
    nominee_role:
      patch.nominee_role === undefined
        ? cur.nominee_role
        : patch.nominee_role || undefined,
    signature_story:
      patch.signature_story === undefined
        ? cur.signature_story
        : patch.signature_story || undefined,
    sustainability_lead:
      patch.sustainability_lead === undefined
        ? cur.sustainability_lead
        : patch.sustainability_lead || undefined,
    evidence_url:
      patch.evidence_url === undefined
        ? cur.evidence_url
        : patch.evidence_url || undefined,
    status: (patch.status as NominationRecord["status"]) ?? cur.status,
    answers: patch.answers ?? cur.answers,
  };
  await writeLocal(rows);
}

export async function deleteNomination(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    // answers cascade via FK
    const { error } = await supabase.from("nominations").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }

  const rows = await readLocal();
  await writeLocal(rows.filter((r) => r.id !== id));
}
