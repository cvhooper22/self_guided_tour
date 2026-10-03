import { z } from "zod";

/** Operators drop image files in public/markers/ and ship them with the app. */
export const MARKER_DIR = "/markers";
export const MARKER_IMAGE_RE = /^\/markers\/[\w][\w.-]*\.(png|svg|webp|jpe?g|gif)$/i;
export const MARKER_FILE_RE = /\.(png|svg|webp|jpe?g|gif)$/i;

export const MARKER_PRESETS = ["📍", "🏛️", "⛪", "🏰", "👻", "🕯️", "⚰️", "⚓", "🌳", "🎭", "📜", "☕", "🍽️", "🛏️", "🎄", "⭐"] as const;

export type Marker = { kind: "image"; src: string } | { kind: "glyph"; text: string };

/**
 * A marker is "" (inherit / numbered), an image path under /markers/, or a short glyph such as an emoji.
 * Anything else is rejected, so stored values can never be used to inject URLs or markup.
 */
export function parseMarker(v: unknown): Marker | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (s.startsWith("/")) return MARKER_IMAGE_RE.test(s) ? { kind: "image", src: s } : null;
  return [...s].length <= 4 ? { kind: "glyph", text: s } : null;
}

export const markerIconSchema = z.string().default("").refine((v) => !v.trim() || parseMarker(v) !== null, "Invalid marker");
export const markerColorSchema = z.string().default("").refine((v) => v === "" || /^#[0-9a-f]{6}$/i.test(v), "Invalid color");
