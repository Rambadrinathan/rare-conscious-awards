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

## Award categories

Provisional placeholders in `src/lib/touchstones.ts` — update when official copy is locked:

1. A Hero's Journey — Hotel  
2. A Hero's Journey — Individual Crusader  
