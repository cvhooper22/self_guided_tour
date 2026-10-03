import { and, asc, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db/client";
import { markerColorSchema, markerIconSchema } from "./markers";
import { resolveTokens, type ThemeTokens } from "./themes";

const { tours, stops, stopSources, routes, themes, users } = schema;

export type TourBundle = {
  tour: typeof tours.$inferSelect;
  tokens: ThemeTokens;
  themeName: string | null;
  stops: (typeof stops.$inferSelect & { sources: (typeof stopSources.$inferSelect)[] })[];
  routes: (typeof routes.$inferSelect)[];
};

async function loadBundle(tour: typeof tours.$inferSelect): Promise<TourBundle> {
  const [stopRows, routeRows, theme] = await Promise.all([
    db.select().from(stops).where(eq(stops.tourId, tour.id)).orderBy(asc(stops.order)),
    db.select().from(routes).where(eq(routes.tourId, tour.id)),
    tour.themeId ? db.select().from(themes).where(eq(themes.id, tour.themeId)).then((r) => r[0]) : Promise.resolve(undefined),
  ]);
  const sources = stopRows.length
    ? await db.select().from(stopSources).where(inArray(stopSources.stopId, stopRows.map((s) => s.id)))
    : [];
  return {
    tour,
    tokens: resolveTokens(theme?.tokens, tour.themeOverrides),
    themeName: theme?.name ?? null,
    stops: stopRows.map((s) => ({ ...s, sources: sources.filter((x) => x.stopId === s.id) })),
    routes: routeRows,
  };
}

export type Viewer = { uid: string; isAdmin: boolean } | null;

/** Published tours are public. Drafts are visible to their owner and to admins. */
export async function getTourBySlug(slug: string, viewer: Viewer = null): Promise<TourBundle | null> {
  const [t] = await db.select().from(tours).where(and(eq(tours.slug, slug), isNull(tours.deletedAt)));
  if (!t) return null;
  if (t.status !== "published" && !(viewer && (viewer.isAdmin || viewer.uid === t.ownerId))) return null;
  return loadBundle(t);
}

/** Unfiltered by status/deletion: for editors and admin tools (callers must authorize). */
export async function getTourById(tourId: string): Promise<TourBundle | null> {
  const [t] = await db.select().from(tours).where(eq(tours.id, tourId));
  return t ? loadBundle(t) : null;
}

/** Distinct tags (case-insensitive, first spelling wins) on published tours or their stops, with how many tours use each. */
export async function listPublishedTags() {
  const rows = await db.select({ id: tours.id, tags: tours.tags }).from(tours).where(and(eq(tours.status, "published"), isNull(tours.deletedAt)));
  const stopRows = rows.length ? await db.select({ tourId: stops.tourId, tags: stops.tags }).from(stops).where(inArray(stops.tourId, rows.map((r) => r.id))) : [];
  const counts = new Map<string, { tag: string; count: number }>();
  for (const row of rows) {
    const own = new Set<string>();
    for (const tag of [...row.tags, ...stopRows.filter((s) => s.tourId === row.id).flatMap((s) => s.tags)]) {
      if (own.has(tag.toLowerCase())) continue;
      own.add(tag.toLowerCase());
      const e = counts.get(tag.toLowerCase());
      if (e) e.count++;
      else counts.set(tag.toLowerCase(), { tag, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function listPublishedTours(q?: string, freeOnly = false, tag?: string) {
  const conds = [eq(tours.status, "published"), isNull(tours.deletedAt)];
  if (freeOnly) conds.push(eq(tours.isFree, true));
  if (tag) {
    const t = tag.toLowerCase();
    conds.push(or(
      sql`exists (select 1 from json_each(${tours.tags}) where lower(value) = ${t})`,
      sql`exists (select 1 from ${stops}, json_each(${stops.tags}) where ${stops.tourId} = ${tours.id} and lower(value) = ${t})`,
    )!);
  }
  if (q) conds.push(or(like(tours.title, `%${q}%`), like(tours.city, `%${q}%`), like(tours.summary, `%${q}%`))!);
  const rows = await db.select().from(tours).where(and(...conds)).orderBy(desc(tours.createdAt));
  return withThemes(rows);
}

async function withThemes(rows: (typeof tours.$inferSelect)[]) {
  const ids = [...new Set(rows.map((r) => r.themeId).filter(Boolean))] as string[];
  const ts = ids.length ? await db.select().from(themes).where(inArray(themes.id, ids)) : [];
  return rows.map((r) => ({ ...r, tokens: resolveTokens(ts.find((t) => t.id === r.themeId)?.tokens, r.themeOverrides) }));
}

export const listToursForOwner = (ownerId: string) =>
  db.select().from(tours).where(and(eq(tours.ownerId, ownerId), isNull(tours.deletedAt))).orderBy(desc(tours.createdAt));

/** Admin: everything, including drafts and soft-deleted, with owner info. */
export async function listAllTours() {
  const rows = await db
    .select({ tour: tours, ownerName: users.name, ownerEmail: users.email })
    .from(tours)
    .leftJoin(users, eq(users.id, tours.ownerId))
    .orderBy(desc(tours.createdAt));
  const stopCounts = await db.select({ tourId: stops.tourId }).from(stops);
  return rows.map((r) => ({ ...r, stopCount: stopCounts.filter((s) => s.tourId === r.tour.id).length }));
}

export const listThemesFor = (ownerId: string | null, all = false) =>
  all
    ? db.select().from(themes).orderBy(desc(themes.isPreset), asc(themes.name))
    : db.select().from(themes).where(or(eq(themes.isPreset, true), ownerId ? eq(themes.ownerId, ownerId) : undefined)).orderBy(desc(themes.isPreset), asc(themes.name));

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "tour";

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  for (let i = 2; (await db.select({ id: tours.id }).from(tours).where(eq(tours.slug, slug))).length; i++) slug = `${slugify(base)}-${i}`;
  return slug;
}

export async function createTour(ownerId: string, title: string) {
  const [preset] = await db.select().from(themes).where(eq(themes.isPreset, true)).limit(1);
  const [t] = await db.insert(tours).values({ ownerId, title, slug: await uniqueSlug(title), themeId: preset?.id }).returning();
  return t;
}

// ---- Whole-document save used by the operator editor ----
const sourceDoc = z.object({
  id: z.string().min(1),
  kind: z.enum(["link", "image", "document", "audio", "video"]),
  title: z.string().min(1),
  url: z.string().min(1),
  description: z.string().default(""),
});
const pathSchema = z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).max(500).default([]);
const tagList = z.array(z.string().trim().min(1).max(30)).max(10).transform((t) => t.filter((x, i) => t.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i));
export const tourDocSchema = z.object({
  tour: z.object({
    title: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    summary: z.string(),
    story: z.string(),
    coverUrl: z.string().nullable(),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
    tags: tagList,
    isFree: z.boolean(),
    themeId: z.string().nullable(),
    themeOverrides: z.record(z.string(), z.unknown()),
  }),
  stops: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    radiusM: z.number().int().min(5).max(1000),
    story: z.string(),
    tags: tagList,
    markerIcon: markerIconSchema,
    markerColor: markerColorSchema,
    sources: z.array(sourceDoc),
  })),
  routes: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), description: z.string(), stopIds: z.array(z.string()), path: pathSchema })),
});
export type TourDoc = z.infer<typeof tourDocSchema>;

export async function saveTourDoc(tourId: string, doc: TourDoc) {
  const clash = await db.select({ id: tours.id }).from(tours).where(and(eq(tours.slug, doc.tour.slug)));
  if (clash.some((c) => c.id !== tourId)) throw new Error("That URL slug is already in use");
  const stopIds = new Set(doc.stops.map((s) => s.id));
  await db.transaction(async (tx) => {
    await tx.update(tours).set(doc.tour).where(eq(tours.id, tourId));
    const existing = await tx.select({ id: stops.id }).from(stops).where(eq(stops.tourId, tourId));
    const gone = existing.map((e) => e.id).filter((id) => !stopIds.has(id));
    if (gone.length) await tx.delete(stops).where(inArray(stops.id, gone));
    for (const [i, s] of doc.stops.entries()) {
      // A client-supplied id must never take over a stop belonging to another tour.
      const owner = await tx.select({ t: stops.tourId }).from(stops).where(eq(stops.id, s.id));
      if (owner[0] && owner[0].t !== tourId) throw new Error("Invalid stop id");
      const row = { tourId, order: i, title: s.title, lat: s.lat, lng: s.lng, radiusM: s.radiusM, story: s.story, tags: s.tags, markerIcon: s.markerIcon, markerColor: s.markerColor };
      await tx.insert(stops).values({ id: s.id, ...row }).onConflictDoUpdate({ target: stops.id, set: row, setWhere: eq(stops.tourId, tourId) });
      await tx.delete(stopSources).where(eq(stopSources.stopId, s.id));
      if (s.sources.length) await tx.insert(stopSources).values(s.sources.map((x) => ({ kind: x.kind, title: x.title, url: x.url, description: x.description, stopId: s.id })));
    }
    await tx.delete(routes).where(eq(routes.tourId, tourId));
    if (doc.routes.length)
      await tx.insert(routes).values(doc.routes.map((r) => ({ ...r, tourId, stopIds: r.stopIds.filter((id) => stopIds.has(id)) })));
  });
}
