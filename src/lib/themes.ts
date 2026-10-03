import { z } from "zod";

export const THEME_SCHEMA_VERSION = 1;

export const FONT_CHOICES = [
  "Inter", "Merriweather", "Playfair Display", "Lora", "Cinzel", "Creepster",
  "Special Elite", "Mountains of Christmas", "Pacifico", "Oswald", "Roboto Slab", "Crimson Text",
] as const;

/** Map looks. All but "custom" are plain OSM tiles with a CSS filter (see .tiles-* in globals.css). */
export const TILE_STYLES = ["light", "dark", "sepia", "ocean", "midnight", "blueprint", "ember", "forest", "noir", "custom"] as const;

const color = z.string().default("#000000");

// Each group has defaults and is passthrough, so new options can be added later
// and unknown/future keys round-trip untouched through the editor and DB.
export const themeTokensSchema = z.looseObject({
  colors: z.looseObject({
    background: color.default("#faf7f2"),
    surface: color.default("#ffffff"),
    text: color.default("#1f1b16"),
    mutedText: color.default("#6b6258"),
    primary: color.default("#7a3e1d"),
    primaryText: color.default("#ffffff"),
    accent: color.default("#c9902b"),
    border: color.default("#e4dccf"),
    link: color.default("#7a3e1d"),
    marker: color.default("#7a3e1d"),
    routeLine: color.default("#c9902b"),
    /** Colour of the highlighted leg to the next stop. Empty = automatic (accent, or hot pink if that matches the route line). */
    highlight: z.string().default(""),
  }).prefault({}),
  typography: z.looseObject({
    headingFont: z.string().default("Merriweather"),
    bodyFont: z.string().default("Inter"),
    fontUrl: z.string().default(""),
    baseSize: z.number().min(12).max(22).default(16),
    headingWeight: z.number().default(700),
    headingTransform: z.enum(["none", "uppercase", "capitalize"]).default("none"),
    headingTracking: z.number().default(0),
  }).prefault({}),
  shape: z.looseObject({
    radius: z.number().min(0).max(40).default(10),
    borderWidth: z.number().min(0).max(6).default(1),
    shadow: z.enum(["none", "soft", "hard"]).default("soft"),
  }).prefault({}),
  map: z.looseObject({
    tileStyle: z.enum(TILE_STYLES).default("light"),
    customTileUrl: z.string().default(""),
    markerShape: z.enum(["pin", "circle", "diamond"]).default("pin"),
    markerIcon: z.string().default(""),
    routeLineStyle: z.enum(["solid", "dashed"]).default("solid"),
  }).prefault({}),
  imagery: z.looseObject({
    heroOverlay: z.number().min(0).max(1).default(0.35),
    patternUrl: z.string().default(""),
  }).prefault({}),
  copy: z.looseObject({
    stopLabel: z.string().default("Stop"),
    startLabel: z.string().default("Start tour"),
    welcome: z.string().default(""),
  }).prefault({}),
  // Reserved for future options (animations, sound, decorative layers, ...).
  extras: z.looseObject({}).default({}),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type PartialTokens = Record<string, unknown>;

export function highlightColor(t: ThemeTokens): string {
  const c = t.colors;
  if (/^#[0-9a-f]{6}$/i.test(c.highlight)) return c.highlight;
  return c.accent.toLowerCase() === c.routeLine.toLowerCase() ? "#ff2d6f" : c.accent;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge(base: PartialTokens, over: PartialTokens): PartialTokens {
  const out: PartialTokens = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k] as PartialTokens, v) : v;
  }
  return out;
}

/** Resolve stored tokens (+ per-tour overrides) into a fully populated, validated token set. */
export function resolveTokens(stored?: PartialTokens | null, overrides?: PartialTokens | null): ThemeTokens {
  const merged = deepMerge(stored ?? {}, overrides ?? {});
  const parsed = themeTokensSchema.safeParse(merged);
  if (parsed.success) return parsed.data;
  // Bad stored data should degrade one group to defaults, not blank the whole theme.
  const bad = new Set(parsed.error.issues.map((i) => i.path[0]));
  const kept = Object.fromEntries(Object.entries(merged).filter(([k]) => !bad.has(k)));
  return themeTokensSchema.parse(kept);
}

const SHADOWS = { none: "none", soft: "0 4px 18px rgba(0,0,0,.12)", hard: "4px 4px 0 rgba(0,0,0,.85)" } as const;

export function googleFontsUrl(t: ThemeTokens): string {
  if (t.typography.fontUrl) return t.typography.fontUrl;
  const names = [...new Set([t.typography.headingFont, t.typography.bodyFont])].filter((n) =>
    (FONT_CHOICES as readonly string[]).includes(n),
  );
  if (!names.length) return "";
  const fam = names.map((n) => `family=${n.replace(/ /g, "+")}:wght@400;700`).join("&");
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}

/** Compile tokens to CSS custom properties. Components must only use these, never hardcoded colors. */
export function tokensToCssVars(t: ThemeTokens): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [k, val] of Object.entries(t.colors)) v[`--t-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`] = String(val);
  v["--t-heading-font"] = `"${t.typography.headingFont}", serif`;
  v["--t-body-font"] = `"${t.typography.bodyFont}", system-ui, sans-serif`;
  v["--t-base-size"] = `${t.typography.baseSize}px`;
  v["--t-heading-weight"] = String(t.typography.headingWeight);
  v["--t-heading-transform"] = t.typography.headingTransform;
  v["--t-heading-tracking"] = `${t.typography.headingTracking}em`;
  v["--t-radius"] = `${t.shape.radius}px`;
  v["--t-border-width"] = `${t.shape.borderWidth}px`;
  v["--t-shadow"] = SHADOWS[t.shape.shadow];
  v["--t-hero-overlay"] = String(t.imagery.heroOverlay);
  v["--t-pattern"] = t.imagery.patternUrl ? `url("${t.imagery.patternUrl.replace(/"/g, "")}")` : "none";
  return v;
}

export function tileConfig(t: ThemeTokens): { url: string; attribution: string; className: string } {
  const osm = { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors" };
  switch (t.map.tileStyle) {
    case "dark":
      // CARTO's basemaps now require an API key, so "dark" is OSM tiles darkened with a CSS filter.
      return { ...osm, className: "tiles-dark" };
    case "custom":
      return t.map.customTileUrl ? { url: t.map.customTileUrl, attribution: "", className: "" } : { ...osm, className: "" };
    case "light":
      return { ...osm, className: "" };
    default:
      return { ...osm, className: `tiles-${t.map.tileStyle}` };
  }
}

export const PRESETS: { key: string; name: string; tokens: PartialTokens }[] = [
  {
    key: "history",
    name: "History",
    tokens: {
      colors: { background: "#f6f0e4", surface: "#fffdf7", text: "#2b2118", mutedText: "#74685a", primary: "#6b3a1e", accent: "#b8862d", border: "#dccfb6", link: "#6b3a1e", marker: "#6b3a1e", routeLine: "#b8862d" },
      typography: { headingFont: "Playfair Display", bodyFont: "Crimson Text", baseSize: 18 },
      shape: { radius: 4, shadow: "soft" },
      map: { tileStyle: "sepia", markerShape: "pin" },
      copy: { stopLabel: "Stop", startLabel: "Begin the tour" },
    },
  },
  {
    key: "ghost",
    name: "Ghost",
    tokens: {
      colors: { background: "#0d0f14", surface: "#171a22", text: "#e6e9ef", mutedText: "#8d95a6", primary: "#7cf2c2", primaryText: "#05110c", accent: "#9b7bff", border: "#262b38", link: "#7cf2c2", marker: "#7cf2c2", routeLine: "#9b7bff" },
      typography: { headingFont: "Cinzel", bodyFont: "Inter", headingTransform: "uppercase", headingTracking: 0.08 },
      shape: { radius: 14, shadow: "soft" },
      map: { tileStyle: "dark", markerShape: "circle", routeLineStyle: "dashed" },
      imagery: { heroOverlay: 0.6 },
      copy: { stopLabel: "Haunt", startLabel: "Enter if you dare" },
    },
  },
  {
    key: "christmas",
    name: "Christmas",
    tokens: {
      colors: { background: "#f7f3ee", surface: "#ffffff", text: "#1d2b22", mutedText: "#5f6f66", primary: "#b3202a", accent: "#1e6b3a", border: "#e6d9d0", link: "#b3202a", marker: "#b3202a", routeLine: "#1e6b3a" },
      typography: { headingFont: "Mountains of Christmas", bodyFont: "Lora", headingWeight: 700, baseSize: 17 },
      shape: { radius: 18, shadow: "soft" },
      map: { tileStyle: "light", markerShape: "diamond" },
      copy: { stopLabel: "Stop", startLabel: "Let's go caroling" },
    },
  },
  {
    key: "ocean",
    name: "Ocean",
    tokens: {
      colors: { background: "#eef7fa", surface: "#ffffff", text: "#0f2a3a", mutedText: "#55738a", primary: "#0e7490", primaryText: "#ffffff", accent: "#f59e0b", border: "#cfe4ec", link: "#0e7490", marker: "#0b3c5d", routeLine: "#f97316" },
      typography: { headingFont: "Pacifico", bodyFont: "Inter", headingWeight: 400 },
      shape: { radius: 16, shadow: "soft" },
      map: { tileStyle: "ocean", markerShape: "pin" },
      copy: { stopLabel: "Stop", startLabel: "Set sail" },
    },
  },
  {
    key: "midnight",
    name: "Midnight",
    tokens: {
      colors: { background: "#0a1020", surface: "#121a2e", text: "#e4ebf7", mutedText: "#8b98b5", primary: "#6ea8ff", primaryText: "#04101f", accent: "#ffd166", border: "#22304f", link: "#8ab8ff", marker: "#ffd166", routeLine: "#5eead4" },
      typography: { headingFont: "Oswald", bodyFont: "Inter", headingTransform: "uppercase", headingTracking: 0.04 },
      shape: { radius: 10, shadow: "soft" },
      map: { tileStyle: "midnight", markerShape: "circle" },
      imagery: { heroOverlay: 0.5 },
      copy: { stopLabel: "Stop", startLabel: "Start the night walk" },
    },
  },
  {
    key: "blueprint",
    name: "Blueprint",
    tokens: {
      colors: { background: "#0c2250", surface: "#14306b", text: "#eaf2ff", mutedText: "#9db8e8", primary: "#ffffff", primaryText: "#0c2250", accent: "#7dd3fc", border: "#2a4a8c", link: "#bfe0ff", marker: "#ffffff", routeLine: "#ffe27a" },
      typography: { headingFont: "Special Elite", bodyFont: "Inter", headingWeight: 400 },
      shape: { radius: 2, borderWidth: 2, shadow: "hard" },
      map: { tileStyle: "blueprint", markerShape: "diamond", routeLineStyle: "dashed" },
      copy: { stopLabel: "Point", startLabel: "Open the plans" },
    },
  },
  {
    key: "ember",
    name: "Ember",
    tokens: {
      colors: { background: "#140808", surface: "#231010", text: "#f6e7e4", mutedText: "#b08a85", primary: "#ff5a4d", primaryText: "#1a0504", accent: "#ffb36b", border: "#3a1b18", link: "#ff8a7a", marker: "#fff1e0", routeLine: "#ffd166" },
      typography: { headingFont: "Playfair Display", bodyFont: "Lora", headingTransform: "uppercase", headingTracking: 0.06 },
      shape: { radius: 8, shadow: "soft" },
      map: { tileStyle: "ember", markerShape: "pin" },
      imagery: { heroOverlay: 0.6 },
      copy: { stopLabel: "Stop", startLabel: "Light the way" },
    },
  },
  {
    key: "forest",
    name: "Forest",
    tokens: {
      colors: { background: "#f1f6ee", surface: "#ffffff", text: "#1c2b1f", mutedText: "#5c705f", primary: "#2f6b3f", primaryText: "#ffffff", accent: "#b7791f", border: "#d5e2d0", link: "#2f6b3f", marker: "#1f4d2b", routeLine: "#b7791f" },
      typography: { headingFont: "Merriweather", bodyFont: "Lora", baseSize: 17 },
      shape: { radius: 12, shadow: "soft" },
      map: { tileStyle: "forest", markerShape: "pin" },
      copy: { stopLabel: "Waypoint", startLabel: "Hit the trail" },
    },
  },
  {
    key: "noir",
    name: "Noir",
    tokens: {
      colors: { background: "#f4f4f4", surface: "#ffffff", text: "#111111", mutedText: "#666666", primary: "#111111", primaryText: "#ffffff", accent: "#d00000", border: "#d9d9d9", link: "#111111", marker: "#111111", routeLine: "#d00000" },
      typography: { headingFont: "Roboto Slab", bodyFont: "Inter", headingTransform: "uppercase", headingTracking: 0.02 },
      shape: { radius: 0, borderWidth: 2, shadow: "hard" },
      map: { tileStyle: "noir", markerShape: "circle" },
      copy: { stopLabel: "Scene", startLabel: "Begin the case" },
    },
  },
];

/** Dropdown options for enum-like tokens, keyed by "group.key". Anything not listed is edited by value type. */
export const TOKEN_OPTIONS: Record<string, readonly string[]> = {
  "typography.headingTransform": ["none", "uppercase", "capitalize"],
  "shape.shadow": ["none", "soft", "hard"],
  "map.tileStyle": TILE_STYLES,
  "map.markerShape": ["pin", "circle", "diamond"],
  "map.routeLineStyle": ["solid", "dashed"],
};
/** Free-text tokens that get a suggestions list. */
export const TOKEN_SUGGESTIONS: Record<string, readonly string[]> = {
  "typography.headingFont": FONT_CHOICES,
  "typography.bodyFont": FONT_CHOICES,
};

export function setPath(obj: PartialTokens, path: string[], value: unknown): PartialTokens {
  const [k, ...rest] = path;
  const child = isPlainObject(obj[k]) ? (obj[k] as PartialTokens) : {};
  return { ...obj, [k]: rest.length ? setPath(child, rest, value) : value };
}
