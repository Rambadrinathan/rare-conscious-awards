# CLAUDE HANDOVER — RARE Conscious Travel Awards

**Date:** 2026-07-30  
**Owner context:** Rambadrinathan / RARE India · Bridges · Conscious Travel Awards  
**Purpose:** Self-nomination portal for exhibitors at BRIDGES for conscious travel 2026  

Use this file as the session bootstrap. Read it before changing code or deploying.

---

## 1. What this product is

Standalone Next.js site for **self-nominations** to:

| Award | For | Form style |
|-------|-----|------------|
| **Sustainability Lighthouse** | Hotel / Experience (property) | Full **Pinwheel** (9 touchstones) + evidence uploads |
| **Sustainability Lightkeeper** | **Individual** at a property | **Different form** — why chosen, accomplishments, achievements, what they are pushing for — **no** 9 touchstones + evidence uploads |

**One award per submission.** If both awards, submit twice.

**Not built yet:** three separate **vote-based** awards (Pandanast-style) — separate form later; do not mix into this Pinwheel flow.

**Open to:** all exhibitors at BRIDGES for conscious travel 2026 (hotel dropdown from Bridges participating list).

---

## 2. Live URLs & repos

| Item | Value |
|------|--------|
| **Production** | https://rare-conscious-awards.vercel.app |
| **Nominate** | https://rare-conscious-awards.vercel.app/nominate |
| **Admin** | https://rare-conscious-awards.vercel.app/admin (`?key=` if `ADMIN_KEY` set) |
| **GitHub** | https://github.com/Rambadrinathan/rare-conscious-awards |
| **Branch** | `master` (deploy with `npx vercel --prod`) |
| **Local path** | `E:\RareIndia\rare-conscious-awards` |
| **Vercel project** | `ram-badrinathans-projects/rare-conscious-awards` |

**Contact on site footer:** `shobhanaj@rareindia.com` (was `bridges@rareindia.com`; changed per feedback).

---

## 3. Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind 4  
- **Supabase** (optional but configured in `.env.local`) — nominations table  
- Fallback: local `data/nominations.json` (or `/tmp` on Vercel if no Supabase)  
- Brand: cream `#F6F1E6`, green `#74A942`, gold `#D4A13D`, Nunito Sans  

Env vars (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_KEY
```

---

## 4. Key files (surgical edit only — do not regenerate whole app)

| Path | Role |
|------|------|
| `src/lib/touchstones.ts` | Pinwheel 9 prompts + **AWARD_CATEGORIES** + legacy award title map |
| `src/lib/validation.ts` | Zod: Lighthouse requires touchstone answers; Lightkeeper requires narrative fields |
| `src/lib/types.ts` | Payload types incl. `supporting_files`, lightkeeper fields |
| `src/lib/store.ts` | save/list/update/delete; Supabase + local; graceful fallback if new DB columns missing |
| `src/data/hotels.json` | Bridges hotel dropdown (82 entries) |
| `scripts/build_hotels.py` | Rebuild hotels from Excel |
| `Participating Hotels Status BRIDGES July 20.xlsx` | Source hotel list |
| `src/components/NominationForm.tsx` | 3-step form; branches Lighthouse vs Lightkeeper |
| `src/components/EvidenceUploader.tsx` | Max **5 images** (~800KB) + **3 docs** (~1MB) |
| `src/components/HotelCombobox.tsx` | Hotel search + “My hotel isn't listed yet…” |
| `src/components/TouchstoneIcon.tsx` | Official icons under `public/icons/ts-*.png` |
| `src/components/PinwheelBackground.tsx` | Subtle pinwheel watermark all pages |
| `src/components/PageShell.tsx` | Header + watermark + footer wrapper |
| `src/app/page.tsx` | Homepage copy (no nine-touchstones marketing grid) |
| `src/app/api/nominate/route.ts` | POST nomination JSON |
| `supabase/schema.sql` | Schema + **commented ALTERs** for new columns |
| `30thJuneFeedback/` | Source brand assets from client feedback |

---

## 5. Award IDs (do not casually rename)

```
sustainability_lighthouse   → Sustainability Lighthouse
sustainability_lightkeeper  → Sustainability Lightkeeper
```

Legacy (old nominations may still have these):

```
heros_journey_hotel
heros_journey_individual
```

Display via `awardTitle()` in `touchstones.ts`.

---

## 6. Form UX (locked product decisions)

### Step 1 — Identity
- Hotel combobox (Bridges list)  
- Contact name / email / phone  
- Award type radio  
- Lightkeeper only: nominee name + role  

### Step 2 — Story
- **Lighthouse:** 9 Pinwheel touchstones (cardinals required; ordinals may N/A) with extracted icons  
- **Lightkeeper:** four narrative fields (min ~20 chars each):  
  - Why chosen  
  - Accomplishments  
  - Achievements  
  - What they are pushing for  

### Step 3 — Evidence & submit
- Supporting **images** (≤5) + **documents** (≤3) for **both** awards  
- Optional signature story, sustainability lead, link  
- Consent checkbox  

### Homepage copy (current)
- Open to all exhibitors at **BRIDGES for conscious travel 2026**  
- Lighthouse (Hotel / Experience) and/or Lightkeeper (Individual)  
- Pinwheel = planet sensitive and community inclusive travel  
- **Removed:** “About 12 minutes · 9 short touchstone prompts…”  
- **Removed:** homepage “nine touchstones” card grid  

### Logo
- Primary: `public/rare-logo.png` (from `30thJuneFeedback/RARE-Logo-Colored.png`)  
- Watermark: `public/pinwheel-bg.jpeg`, `public/pinwheel-mark.png`  

---

## 7. ⚠️ CRITICAL: Where uploads go today

**This was asked explicitly and is incomplete for production.**

Current behaviour:

1. Browser reads files → **base64** in JSON payload as `supporting_files[]`.  
2. API accepts them (total soft limit ~4 MB).  
3. `store.ts` tries to insert into Supabase column `supporting_files` (jsonb).  
4. **If that column does not exist** (schema not migrated), store **falls back** to packing only **file names** (not bytes) into `signature_story` text.  
5. Without Supabase: full base64 lands in local `nominations.json` (ephemeral on Vercel).

**Not implemented:**
- Supabase Storage bucket  
- Google Drive upload  
- Email attachments to Shobhana  
- Public/private download URLs for jury  

**Recommended next work:**
1. Run SQL in Supabase (from `supabase/schema.sql` comments):

```sql
alter table nominations add column if not exists lightkeeper_why text;
alter table nominations add column if not exists lightkeeper_accomplishments text;
alter table nominations add column if not exists lightkeeper_achievements text;
alter table nominations add column if not exists lightkeeper_pushing_for text;
alter table nominations add column if not exists supporting_files jsonb not null default '[]'::jsonb;
```

2. Better: create private Storage bucket `nomination-evidence`, upload files, store only paths/URLs on the row.  
3. Admin UI to list/download evidence.  
4. Optional notify `shobhanaj@rareindia.com`.

---

## 8. Hotels list

- Source Excel: `Participating Hotels Status BRIDGES July 20.xlsx`  
- Rebuild:

```bash
cd E:\RareIndia\rare-conscious-awards
python scripts/build_hotels.py
```

- NGO partners at bottom of sheet are **excluded**  
- “My hotel isn't listed yet” escape hatch kept (list may change)  
- ~82 names in `src/data/hotels.json` with `name`, `state`, `country` (strings)

---

## 9. Deploy protocol (this project)

```bash
cd E:\RareIndia\rare-conscious-awards
npm run build
git add -A && git commit -m "…" && git push origin master
npx vercel --prod --yes
```

Production alias: `https://rare-conscious-awards.vercel.app`  

GitHub push alone may **not** always redeploy; CLI prod deploy has been used when needed.

---

## 10. Feedback source (30 July 2026)

Folder: `E:\RareIndia\rare-conscious-awards\30thJuneFeedback\` (name is historical; content used for 30 July updates)

Assets used:
- Logo → `RARE-Logo-Colored.png`  
- Pinwheel watermark → `Pinwsheeltansparatentinbackgroundjpeg.jpeg`  
- Icons extracted from `rare-touchstones-2021-2220x1569.jpg` → `public/icons/ts-*.png`  

---

## 11. Known gaps / backlog

1. **Proper file storage** (Storage bucket) — highest priority after handover  
2. **DB migration** for lightkeeper + supporting_files columns (run in Supabase SQL editor)  
3. **Admin** should show lightkeeper narratives + file list/download (partially legacy UI)  
4. **CSV export** may not include new lightkeeper / file columns fully  
5. **Three vote awards** — separate form when copy arrives  
6. Hotel list may change (add/remove Bridges exhibitors)  
7. Base64-in-JSON is fragile for large uploads; enforce smaller limits or Storage  

---

## 12. Do / don’t

**Do**
- Surgical edits only when user freezes approved items  
- Keep Lighthouse vs Lightkeeper form split  
- Bridges-only hotel list unless told otherwise  
- Footer email: `shobhanaj@rareindia.com`  
- Confirm before prod-sensitive ops; prod deploy has been explicitly requested for this site  

**Don’t**
- Bring back “Hero’s Journey” naming  
- Put 9 touchstones on Lightkeeper path  
- Put vote awards into this same form without a separate route  
- Claim uploads go to Drive/email unless you implement that  
- Force-regenerate whole app for copy tweaks  

---

## 13. Quick verify checklist

```bash
cd E:\RareIndia\rare-conscious-awards
npm run build
npm run dev
```

- [ ] Home: new logo, BRIDGES 2026 copy, no 12-min line, no nine-touchstones grid, pinwheel watermark  
- [ ] Footer: shobhanaj@rareindia.com  
- [ ] Nominate Lighthouse: 9 icons + touchstones + uploads  
- [ ] Nominate Lightkeeper: 4 narrative fields + uploads, no pinwheel step  
- [ ] Hotel list search works  
- [ ] Submit returns `/thanks?ref=…`  
- [ ] Admin list loads with `?key=`  

---

## 14. Recent commits (context)

```
cb7e076 Point OG image to new RARE logo PNG.
a888302 Update awards site from 30 June feedback.
2cb94ca Add bridges@rareindia.com contact in site footer.  # superseded by shobhanaj
94c2248 Rename awards to Sustainability Lighthouse and Lightkeeper.
10a9648 Ship RARE Conscious Travel Awards nomination portal.
```

---

## 15. First task if continuing from here

**User last asked:** where do uploaded images/documents go?  
**Answer given:** base64 on nomination record / Supabase jsonb if column exists; **not** a file host.  

**Suggested implement next:** Supabase Storage + schema ALTERs + admin download links.

When in doubt: read this file, then `src/lib/touchstones.ts` + `NominationForm.tsx` + `store.ts`.
