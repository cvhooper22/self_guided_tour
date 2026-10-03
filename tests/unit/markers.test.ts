import { describe, expect, it } from "vitest";
import { markerIconSchema, parseMarker } from "@/lib/markers";

describe("parseMarker", () => {
  it("treats empty as inherit", () => expect(parseMarker("  ")).toBeNull());
  it("accepts emoji and short text", () => {
    expect(parseMarker("👻")).toEqual({ kind: "glyph", text: "👻" });
    expect(parseMarker("🕯️")).toEqual({ kind: "glyph", text: "🕯️" });
  });
  it("accepts images only under /markers/", () => {
    expect(parseMarker("/markers/lantern.png")).toEqual({ kind: "image", src: "/markers/lantern.png" });
    for (const bad of ["/markers/../x.png", "/other/x.png", "//evil.com/x.png", "/markers/x.html", "https://evil.com/x.png"]) expect(parseMarker(bad)).toBeNull();
  });
  it("rejects long text", () => expect(parseMarker("<script>alert(1)</script>")).toBeNull());
  it("schema rejects invalid values", () => {
    expect(markerIconSchema.safeParse("/markers/a.svg").success).toBe(true);
    expect(markerIconSchema.safeParse("https://x.com/a.png").success).toBe(false);
  });
});
