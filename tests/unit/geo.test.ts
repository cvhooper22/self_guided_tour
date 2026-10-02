import { describe, expect, it } from "vitest";
import { distanceM, safeUrl } from "@/lib/geo";

describe("distanceM", () => {
  it("is 0 for the same point and ~111km per degree of latitude", () => {
    expect(distanceM({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
    expect(distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeGreaterThan(110000);
    expect(distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeLessThan(112000);
  });
});

describe("safeUrl", () => {
  it("allows http(s) and site-relative paths", () => {
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeUrl("/assets/a.png")).toBe("/assets/a.png");
  });
  it("blocks script and protocol-relative URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,x")).toBeNull();
    expect(safeUrl("//evil.com")).toBeNull();
    expect(safeUrl("not a url")).toBeNull();
  });
});
