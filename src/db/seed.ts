import { eq } from "drizzle-orm";
import { db, schema } from "./client";
import { PRESETS, THEME_SCHEMA_VERSION } from "../lib/themes";
import { chicoGhostTour, chicoGhostRoutes, type SeedStop } from "./chico-ghost-tour";

const { users, themes, tours, stops, stopSources, routes } = schema;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const userRows = [
    { email: adminEmail, name: "Admin", role: "admin" as const },
    { email: "operator@example.com", name: "Olive Operator", role: "operator" as const },
    { email: "traveler@example.com", name: "Terry Traveler", role: "traveler" as const },
  ];
  for (const u of userRows) await db.insert(users).values(u).onConflictDoUpdate({ target: users.email, set: { name: u.name, role: u.role } });
  const op = (await db.select().from(users).where(eq(users.email, "operator@example.com")))[0];

  const themeIds: Record<string, string> = {};
  for (const p of PRESETS) {
    const existing = (await db.select().from(themes).where(eq(themes.name, p.name)))[0];
    if (existing?.isPreset) {
      await db.update(themes).set({ tokens: p.tokens }).where(eq(themes.id, existing.id));
      themeIds[p.key] = existing.id;
    } else {
      const [t] = await db.insert(themes).values({ name: p.name, isPreset: true, tokens: p.tokens, schemaVersion: THEME_SCHEMA_VERSION }).returning();
      themeIds[p.key] = t.id;
    }
  }

  const seedTours: { slug: string; title: string; summary: string; story: string; city: string; lat: number; lng: number; theme: string; stops: (Omit<SeedStop, "key"> & { key?: string })[]; status?: "draft" | "published"; tags?: string[]; routes?: { name: string; description: string; keys: string[] }[] }[] = [
    {
      slug: "savannah-squares", title: "Squares of Savannah", city: "Savannah, GA", lat: 32.0745, lng: -81.0925, theme: "history",
      summary: "A stroll through Oglethorpe's famous city squares and the stories they hold.",
      story: "Savannah was laid out in 1733 around a repeating plan of wards and public squares. This sample tour walks three of them. (Sample content for development.)",
      stops: [
        { title: "Chippewa Square", lat: 32.0764, lng: -81.0925, story: "A square named for a War of 1812 battle, and the setting for a famous film bench scene.", sources: [{ title: "Chippewa Square (Wikipedia)", url: "https://en.wikipedia.org/wiki/Chippewa_Square" }] },
        { title: "Colonial Park Cemetery", lat: 32.0735, lng: -81.0883, tags: ["Verified"], story: "The city's original colonial burial ground, in use from 1750 to 1853.", sources: [{ title: "Colonial Park Cemetery (Wikipedia)", url: "https://en.wikipedia.org/wiki/Colonial_Park_Cemetery" }] },
        { title: "Forsyth Park", lat: 32.068, lng: -81.0963, story: "Thirty acres at the south end of the historic district, anchored by its fountain.", sources: [{ title: "Forsyth Park (Wikipedia)", url: "https://en.wikipedia.org/wiki/Forsyth_Park" }] },
      ],
    },
    {
      slug: "savannah-after-dark", title: "Savannah After Dark", city: "Savannah, GA", lat: 32.0745, lng: -81.0925, theme: "ghost", tags: ["Ghost stories"],
      summary: "Legends and ghost stories from the squares and cemeteries.",
      story: "Said to be one of America's most haunted cities. Come after sunset. (Sample content for development.)",
      stops: [
        { title: "Colonial Park Cemetery", lat: 32.0735, lng: -81.0883, story: "Stories of restless residents and long-ago vandalism of the headstones.", sources: [{ title: "Colonial Park Cemetery (Wikipedia)", url: "https://en.wikipedia.org/wiki/Colonial_Park_Cemetery" }] },
        { title: "Chippewa Square", lat: 32.0764, lng: -81.0925, story: "Late-night tales told around the old theater.", sources: [] },
      ],
    },
    {
      slug: "midtown-holiday-lights", title: "Midtown Holiday Lights", city: "New York, NY", lat: 40.755, lng: -73.981, theme: "christmas",
      summary: "A festive walk past the trees, windows and skating rinks of midtown.",
      story: "Sample content for development.",
      stops: [
        { title: "Rockefeller Center", lat: 40.7587, lng: -73.9787, story: "Home of the famous tree and the ice rink below it.", sources: [{ title: "Rockefeller Center (Wikipedia)", url: "https://en.wikipedia.org/wiki/Rockefeller_Center" }] },
        { title: "Bryant Park", lat: 40.7536, lng: -73.9832, story: "A winter village of shops and a rink behind the library.", sources: [{ title: "Bryant Park (Wikipedia)", url: "https://en.wikipedia.org/wiki/Bryant_Park" }] },
      ],
    },
    {
      slug: "draft-walk", title: "Work-in-progress Walk", city: "Savannah, GA", lat: 32.0809, lng: -81.0912, theme: "history", status: "draft",
      summary: "A draft tour, only visible to its owner and admins.", story: "",
      stops: [{ title: "River Street", lat: 32.0809, lng: -81.0912, story: "TBD", sources: [] }],
    },
    { ...chicoGhostTour, routes: chicoGhostRoutes },
  ];

  for (const t of seedTours) {
    if ((await db.select().from(tours).where(eq(tours.slug, t.slug))).length) continue;
    const [row] = await db.insert(tours).values({ slug: t.slug, title: t.title, summary: t.summary, story: t.story, city: t.city, lat: t.lat, lng: t.lng, ownerId: op.id, themeId: themeIds[t.theme], status: t.status ?? "published", tags: t.tags ?? [] }).returning();
    const ids: string[] = [];
    const idByKey: Record<string, string> = {};
    for (const [i, s] of t.stops.entries()) {
      const [sr] = await db.insert(stops).values({ tourId: row.id, order: i, title: s.title, lat: s.lat, lng: s.lng, radiusM: s.radiusM, story: s.story, tags: s.tags ?? [] }).returning();
      ids.push(sr.id);
      if (s.key) idByKey[s.key] = sr.id;
      for (const src of s.sources) await db.insert(stopSources).values({ stopId: sr.id, kind: src.kind ?? "link", title: src.title, url: src.url, description: src.description ?? "" });
    }
    if (t.routes) {
      for (const r of t.routes) await db.insert(routes).values({ tourId: row.id, name: r.name, description: r.description, stopIds: r.keys.map((k) => idByKey[k]) });
      continue;
    }
    await db.insert(routes).values({ tourId: row.id, name: "Full tour", description: "All stops in order", stopIds: ids });
    if (ids.length > 2) await db.insert(routes).values({ tourId: row.id, name: "Short loop", description: "First and last stop", stopIds: [ids[0], ids[ids.length - 1]] });
  }
  console.log("Seeded.");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
