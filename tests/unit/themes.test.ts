import { describe, expect, it } from "vitest";
import { PRESETS, deepMerge, resolveTokens, setPath, themeTokensSchema, tileConfig, tokensToCssVars } from "@/lib/themes";

describe("theme tokens", () => {
  it("fills defaults for an empty theme", () => {
    const t = resolveTokens({});
    expect(t.colors.primary).toBeTruthy();
    expect(t.copy.stopLabel).toBe("Stop");
  });

  it("applies per-tour overrides on top of the base theme without mutating it", () => {
    const base = { colors: { primary: "#111111", accent: "#222222" } };
    const t = resolveTokens(base, { colors: { primary: "#abcdef" } });
    expect(t.colors.primary).toBe("#abcdef");
    expect(t.colors.accent).toBe("#222222");
    expect(base.colors.primary).toBe("#111111");
  });

  it("preserves unknown future keys", () => {
    const t = resolveTokens({ colors: { glow: "#fff" }, sound: { ambient: "x.mp3" } });
    expect((t.colors as Record<string, unknown>).glow).toBe("#fff");
    expect((t as Record<string, unknown>).sound).toEqual({ ambient: "x.mp3" });
  });

  it("falls back to defaults rather than throwing on invalid stored data", () => {
    expect(() => resolveTokens({ shape: { radius: "huge" } })).not.toThrow();
    expect(resolveTokens({ shape: { radius: "huge" } }).shape.radius).toBe(10);
  });

  it("rejects invalid values on save validation", () => {
    expect(themeTokensSchema.safeParse({ map: { tileStyle: "neon" } }).success).toBe(false);
  });

  it("compiles tokens to CSS variables", () => {
    const v = tokensToCssVars(resolveTokens({ colors: { mutedText: "#123456" } }));
    expect(v["--t-muted-text"]).toBe("#123456");
    expect(v["--t-radius"]).toMatch(/px$/);
  });

  it("every seeded preset is valid and distinct", () => {
    const primaries = PRESETS.map((p) => {
      expect(themeTokensSchema.safeParse(p.tokens).success).toBe(true);
      return resolveTokens(p.tokens).colors.primary;
    });
    expect(new Set(primaries).size).toBe(PRESETS.length);
  });

  it("deepMerge and setPath are non-mutating", () => {
    const a = { x: { y: 1 } };
    expect(setPath(a, ["x", "z"], 2)).toEqual({ x: { y: 1, z: 2 } });
    expect(deepMerge(a, { x: { y: 3 } })).toEqual({ x: { y: 3 } });
    expect(a).toEqual({ x: { y: 1 } });
  });

  it("maps tile styles without needing an API key", () => {
    for (const s of ["light", "dark", "sepia"] as const) expect(tileConfig(resolveTokens({ map: { tileStyle: s } })).url).toContain("openstreetmap.org");
  });
});
