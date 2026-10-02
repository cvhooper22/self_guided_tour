# Self-Guided Tour

Map-based self-guided tours: travelers get a map, stops with stories, and primary sources; operators edit and theme tours; admins can see and fix everything.

## Run locally
```bash
npm install
npm run db:setup   # creates ./dev.db and seeds demo data
npm run dev        # http://localhost:3000
```
Demo sign-ins (no password locally): `traveler@example.com`, `operator@example.com`, `admin@example.com`.

## Screens
| Route | Who | What |
|---|---|---|
| `/tours` | anyone | marketplace: search, free filter, sort by near me |
| `/tour/[slug]` | anyone | server-rendered overview with link-preview metadata; the direct link to share |
| `/play/[slug]` | anyone | client-only player: map, routes, stops, sources, geolocation auto-open, progress |
| `/operator`, `/operator/tours/[id]` | operator, admin | dashboard and editor (details, stops on map, sources, routes, theme, publish) |
| `/admin/*` | admin | all tours incl. drafts/deleted, raw JSON, restore/unpublish, users + "view as", audit log |

## Theming
Themes are token sets (`src/lib/themes.ts`): colors, typography, shape, map, imagery, copy, plus a reserved `extras` group. Presets (History, Ghost, Christmas) are seeded rows; operators tweak any token, save as their own theme, or edit raw JSON. Unknown keys are preserved, so new options need no migration: add the field to the zod schema and the editor form picks it up.

## Auth (mock)
Email sign-in with roles `traveler | operator | admin`, in `src/lib/auth.ts`. Every API handler checks authorization itself; `src/proxy.ts` is only a first line of defence. In production, operator/admin sign-in requires `ADMIN_PASSCODE`. Replace before real users arrive.

## Deploy (Vercel Hobby + Turso, free)
Vercel's Hobby plan is non-commercial; move to Pro before charging for tours.
1. Create a Turso database; note its URL and token.
2. `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:setup` to create tables and seed.
3. Import the repo in Vercel and set the variables from `.env.example`.

Map tiles use the public OpenStreetMap server, fine for development; for production traffic use a tile provider (see OSM tile usage policy).

## Tests
`npm test` (unit), `npm run e2e` (Playwright, uses local Chrome and starts the dev server), `npm run typecheck`.
