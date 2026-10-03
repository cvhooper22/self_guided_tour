import { describe, expect, it } from "vitest";
import { directionsUrls, nearestSegmentIndex } from "@/lib/geo";

describe("nearestSegmentIndex", () => {
  const path: [number, number][] = [[0, 0], [0, 10], [10, 10]];
  it("inserts on the nearest segment", () => {
    expect(nearestSegmentIndex(path, [0.1, 5])).toBe(1);
    expect(nearestSegmentIndex(path, [5, 10.1])).toBe(2);
  });
});

describe("directionsUrls", () => {
  it("builds walking links", () => {
    const u = directionsUrls({ lat: 32.07, lng: -81.09 });
    expect(u.google).toContain("destination=32.07,-81.09");
    expect(u.google).toContain("travelmode=walking");
    expect(u.apple).toContain("dirflg=w");
  });
});
