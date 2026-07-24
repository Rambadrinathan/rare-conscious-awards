# Supabase setup (do this once — you control the project)

Contact for this campaign: **bridges@soulitudes.in**

Without Supabase, the form UI still works on Vercel but **submissions are not durable**. Connect Supabase before you mail the link to hotels.

---

## 1. Create project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project**
   - Name suggestion: `rare-conscious-awards`
   - Region: closest to you (e.g. Mumbai / Singapore)
   - Set a strong DB password (save it)
3. Wait until the project is ready

---

## 2. Run the SQL schema

1. In the project: **SQL Editor → New query**
2. Paste **all** of `supabase/schema.sql` from this repo (also below)
3. Click **Run**

You should get two tables:

- `nominations`
- `nomination_answers`

### Full SQL (copy-paste)

```sql
create extension if not exists "pgcrypto";

create table if not exists nominations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'shortlisted', 'winner', 'withdrawn')),
  hotel_name_text text not null,
  hotel_not_listed boolean not null default false,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  award_category text not null,
  nominee_name text,
  nominee_role text,
  signature_story text,
  sustainability_lead text,
  evidence_url text,
  consent boolean not null default false,
  source text not null default 'bridges_exhibitors',
  admin_notes text
);

create table if not exists nomination_answers (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  touchstone_key text not null,
  not_applicable boolean not null default false,
  answer_text text,
  unique (nomination_id, touchstone_key)
);

create index if not exists nominations_created_at_idx on nominations (created_at desc);
create index if not exists nomination_answers_nomination_id_idx on nomination_answers (nomination_id);

alter table nominations enable row level security;
alter table nomination_answers enable row level security;
```

**RLS note:** The app inserts via **service role key** on the server. You do **not** need public insert policies for the anon key. Leave RLS on with no open policies — service role bypasses RLS.

---

## 3. Copy three keys

In Supabase: **Project Settings → API**

| What you need | Where | Env var name on Vercel |
|---------------|--------|-------------------------|
| Project URL | `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `service_role` **secret** | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ Never put `service_role` in frontend code or commit it to git. Only Vercel env / server.

---

## 4. Add keys on Vercel

Project: **rare-conscious-awards**  
[Vercel → Project → Settings → Environment Variables](https://vercel.com/ram-badrinathans-projects/rare-conscious-awards/settings/environment-variables)

Add for **Production** (and Preview if you want):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`ADMIN_KEY` is already set on the project.

Then **Redeploy** (Deployments → … → Redeploy) so the new env vars load.

Or tell me once the three values are ready and I can set them + redeploy.

---

## 5. Quick verify

1. Open https://rare-conscious-awards.vercel.app/nominate  
2. Submit a test nomination  
3. In Supabase **Table Editor** → `nominations` — new row  
4. Open admin (see live links doc) — row appears  
5. Export CSV works  

---

## Optional: invite bridges@soulitudes.in

In Supabase: **Project Settings → General** or team members — invite `bridges@soulitudes.in` as a project member so that mailbox can open the dashboard and read tables without using the admin web UI.
