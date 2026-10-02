@AGENTS.md

# Self-Guided Tour

Map-based self-guided tour app. Travelers browse/open tours and walk them with a map, stories and primary sources; operators edit and theme tours; admins can see and fix everything. See `README.md` for screens and deploy steps.

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind 4, Drizzle ORM + libSQL (local `dev.db`, Turso in prod), Leaflet/OpenStreetMap, zod, jose, Vitest, Playwright. Deploy target: Vercel Hobby + Turso.

Next 16 differs from older versions: `middleware` is now `src/proxy.ts`, `params`/`searchParams`/`cookies()` are async, and route prop types come from `PageProps<"/route">` (run `npx next typegen` if they're missing). Check `node_modules/next/dist/docs/` before using unfamiliar APIs.

## Commands
- `npm run db:setup` create/seed `dev.db` (`db:push` schema only, `db:seed` seed only; seed is idempotent)
- `npm run dev` / `npm run build`
- `npm test` unit tests, `npm run e2e` Playwright (uses local Chrome, starts dev server on :3100), `npm run typecheck`, `npm run lint`

## Architecture rules
- **Data access** goes through `src/lib/tours-repo.ts`; routes and pages shouldn't build ad-hoc tour queries, so the backing store stays swappable. Schema is `src/db/schema.ts`.
- **Auth** is mock (email sign-in, roles `traveler|operator|admin`) and lives only in `src/lib/auth.ts` (+ edge-safe `auth-edge.ts` for the proxy). Replace there, not at call sites.
- **Authorization is enforced in every API handler** (`requireRole`, `requireAdmin`, `canEditTour`) and in each admin page (`assertAdminPage`). `src/proxy.ts` is only a first line of defence; never rely on it or on layouts. Draft/deleted tours are visible only to owner and admins (`getTourBySlug`).
- **Admin "view as"** keeps `adminId` on the session; use `realAdminId(session)` to check admin power, and `audit()` for admin/operator mutations.
- **API handlers** are wrapped with `handle()` from `src/lib/api.ts`, which maps `HttpError`/`ZodError` to JSON responses.
- **The player (`/play/[slug]`) is client-only** and reads only `GET /api/tours/[slug]`, so it can be extracted into its own app later. Keep server-only imports out of it. Leaflet touches `window`: load the map via `MapLazy` (`dynamic`, `ssr: false`).
- **Editor saves the whole tour document** via `PUT /api/operator/tours/[id]` (`saveTourDoc`, validated by `tourDocSchema`).
- **Theming**: tokens are validated by `themeTokensSchema` in `src/lib/themes.ts` (zod 4: use `.prefault({})`, not `.default({})`, for nested groups). Components must use only `--t-*` CSS variables set by `ThemeScope`, never hardcoded colors inside themed areas. To add a theme option, add it to the schema; the editor form is generated from the resolved tokens (add dropdown options to `TOKEN_OPTIONS`).
- **User-supplied URLs** (sources, covers) must go through `safeUrl()` before rendering as links or media.
- Uploads are intentionally disabled in this cut (links/local assets only).

## Testing notes
- E2E tests must not mutate seeded data: create throwaway tours via the API (see `newTour` in `tests/e2e/smoke.spec.ts`).
- Don't use CARTO basemap tiles (now require an API key); dark/sepia maps are OSM tiles with CSS filters.
