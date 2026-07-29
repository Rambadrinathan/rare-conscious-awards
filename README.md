# RARE Conscious Travel Awards — Self Nomination

Standalone, branded nomination portal for Bridges exhibitors of The RARE Collection.

Guided by the **Pinwheel** (9 touchstones). Simple for proprietors. Jury-ready export for RARE.

## Stack

- Next.js (App Router) + Tailwind
- Supabase (optional) — falls back to local `data/nominations.json` if unset
- No ops systems. No hotel data centre.

## Local development

```bash
cd E:\RareIndia\rare-conscious-awards
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- Public form: `/nominate`
- Admin: `/admin` (add `?key=` if `ADMIN_KEY` is set)
- CSV: `/api/admin/export`

## Supabase

1. Create a project
2. Run `supabase/schema.sql` in the SQL editor
3. Copy `.env.example` → `.env.local` and fill keys
4. Redeploy / restart

Without Supabase, submissions still work and are stored in `data/nominations.json` (gitignored).

## Brand

- Cream `#F6F1E6` · Green `#74A942` · Gold `#D4A13D`
- Font: Nunito Sans (Avenir alternative)
- Logo: `public/rare-logo.jpeg`

## Award categories (self-nomination form)

Defined in `src/lib/touchstones.ts`:

1. **Sustainability Lighthouse** — hotel / property award for best sustainability practices  
2. **Sustainability Lightkeeper** — individual within a hotel driving sustainability forward  

Participating hotels: Bridges list only (`src/data/hotels.json`), rebuilt from  
`Participating Hotels Status BRIDGES July 20.xlsx` via `scripts/build_hotels.py`.

**Vote-based awards** (three separate awards, separate form — not in this nomination flow yet).

## Updating the hotel list

```bash
python scripts/build_hotels.py
```
