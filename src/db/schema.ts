import type { RouteDirections } from "../lib/directions";
import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export type Role = "traveler" | "operator" | "admin";
export type TourStatus = "draft" | "published";
export type SourceKind = "link" | "image" | "document" | "audio" | "video";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => integer("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now());

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<Role>().notNull().default("traveler"),
  createdAt: now(),
});

// Theme tokens are free-form JSON validated in lib/themes.ts so new options need no migration.
export const themes = sqliteTable("themes", {
  id: id(),
  ownerId: text("owner_id").references(() => users.id),
  name: text("name").notNull(),
  isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
  tokens: text("tokens", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  schemaVersion: integer("schema_version").notNull().default(1),
  createdAt: now(),
});

export const tours = sqliteTable("tours", {
  id: id(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  story: text("story").notNull().default(""),
  coverUrl: text("cover_url"),
  city: text("city").notNull().default(""),
  lat: real("lat").notNull().default(0),
  lng: real("lng").notNull().default(0),
  status: text("status").$type<TourStatus>().notNull().default("draft"),
  // Operator-defined free-form labels (e.g. "Local favorite"), shown to travelers and filterable.
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  isFree: integer("is_free", { mode: "boolean" }).notNull().default(true),
  themeId: text("theme_id").references(() => themes.id),
  themeOverrides: text("theme_overrides", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  deletedAt: integer("deleted_at", { mode: "number" }),
  createdAt: now(),
});

export const stops = sqliteTable("stops", {
  id: id(),
  tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  title: text("title").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  radiusM: integer("radius_m").notNull().default(40),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  story: text("story").notNull().default(""),
  // "" = inherit the tour default; see lib/markers.ts for the accepted formats.
  markerIcon: text("marker_icon").notNull().default(""),
  markerColor: text("marker_color").notNull().default(""),
});

export const stopSources = sqliteTable("stop_sources", {
  id: id(),
  stopId: text("stop_id").notNull().references(() => stops.id, { onDelete: "cascade" }),
  kind: text("kind").$type<SourceKind>().notNull().default("link"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description").notNull().default(""),
});

export const routes = sqliteTable("routes", {
  id: id(),
  tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  stopIds: text("stop_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
  // Operator-drawn walking line as [lat, lng] points. Empty = straight lines between stops.
  path: text("path", { mode: "json" }).$type<[number, number][]>().notNull().default([]),
  // Generated (and operator-editable) step-by-step walking directions; stale once `sig` no longer matches path + stop order.
  directions: text("directions", { mode: "json" }).$type<RouteDirections | null>(),
});

export const progress = sqliteTable(
  "progress",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
    visitedStopIds: text("visited_stop_ids", { mode: "json" }).$type<string[]>().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tourId] })],
);

export const auditLog = sqliteTable("audit_log", {
  id: id(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  details: text("details", { mode: "json" }).$type<Record<string, unknown>>(),
  at: now(),
});
