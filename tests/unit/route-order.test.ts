import { describe, expect, it } from "vitest";
import { currentLengthM, orderStops } from "@/lib/route-order";

// Stops along a line, listed out of order.
const pts = [0, 3, 1, 4, 2].map((k) => ({ id: `s${k}`, lat: 32 + k * 0.001, lng: -81 }));

describe("orderStops", () => {
  it("orders a line of stops end to end when the first stop is fixed", () => {
    const { ids } = orderStops(pts, { startId: "s0" });
    expect(ids).toEqual(["s0", "s1", "s2", "s3", "s4"]);
  });
  it("is never longer than the given order", () => {
    const { lengthM } = orderStops(pts);
    expect(lengthM).toBeLessThan(currentLengthM(pts));
  });
  it("keeps the fixed start and includes every stop once", () => {
    const { ids } = orderStops(pts, { startId: "s3", loop: true });
    expect(ids[0]).toBe("s3");
    expect([...ids].sort()).toEqual(["s0", "s1", "s2", "s3", "s4"]);
  });
  it("handles tiny inputs", () => {
    expect(orderStops([]).ids).toEqual([]);
    expect(orderStops(pts.slice(0, 2)).ids).toHaveLength(2);
  });
});
