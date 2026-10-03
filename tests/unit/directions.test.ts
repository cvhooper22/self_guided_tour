import { describe, expect, it } from "vitest";
import { assignLegs, directionsFresh, routeSig } from "@/lib/directions";
import type { LatLngTuple } from "@/lib/geo";

const base: LatLngTuple[] = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
const stops: LatLngTuple[] = [[0, 0], [0, 2], [0, 4]];

describe("assignLegs", () => {
  it("assigns steps to the stop-to-stop leg they fall on", () => {
    const steps = [0, 1, 2, 3, 4].map((x) => ({ text: `s${x}`, distanceM: 1, at: [0, x] as LatLngTuple }));
    expect(assignLegs(steps, base, stops).map((s) => s.leg)).toEqual([0, 0, 1, 1, 1]);
  });
});

describe("routeSig", () => {
  it("changes when the path or stop order changes", () => {
    const a = routeSig(base, ["a", "b"]);
    expect(routeSig(base, ["a", "b"])).toBe(a);
    expect(routeSig(base, ["b", "a"])).not.toBe(a);
    expect(routeSig([...base, [1, 1]], ["a", "b"])).not.toBe(a);
  });
  it("marks directions stale after an edit", () => {
    const r = { path: base, stopIds: ["a", "b"], directions: { sig: routeSig(base, ["a", "b"]), steps: [] } };
    expect(directionsFresh(r)).toBe(true);
    expect(directionsFresh({ ...r, path: base.slice(1) })).toBe(false);
    expect(directionsFresh({ ...r, directions: null })).toBe(false);
  });
});
