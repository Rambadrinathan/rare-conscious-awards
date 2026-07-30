-- RARE Conscious Travel Awards — nomination schema
-- Run in Supabase SQL editor, then set env vars on the app.

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
  lightkeeper_why text,
  lightkeeper_accomplishments text,
  lightkeeper_achievements text,
  lightkeeper_pushing_for text,
  signature_story text,
  sustainability_lead text,
  evidence_url text,
  supporting_files jsonb not null default '[]'::jsonb,
  consent boolean not null default false,
  source text not null default 'bridges_exhibitors',
  admin_notes text
);

-- If the table already exists, run these alters once:
-- alter table nominations add column if not exists lightkeeper_why text;
-- alter table nominations add column if not exists lightkeeper_accomplishments text;
-- alter table nominations add column if not exists lightkeeper_achievements text;
-- alter table nominations add column if not exists lightkeeper_pushing_for text;
-- alter table nominations add column if not exists supporting_files jsonb not null default '[]'::jsonb;


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

-- Public insert for nominations (use service role from API for production control)
-- If using anon key from browser directly, allow insert only:
-- create policy "anon_insert_nominations" on nominations for insert to anon with check (true);
-- Prefer: API route with SUPABASE_SERVICE_ROLE_KEY (no public insert policies needed).

-- Admin read via authenticated role (optional):
-- create policy "auth_read_nominations" on nominations for select to authenticated using (true);
-- create policy "auth_read_answers" on nomination_answers for select to authenticated using (true);
