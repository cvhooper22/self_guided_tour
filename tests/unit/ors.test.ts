import { describe, expect, it } from "vitest";
import { simplifyTo, type LatLngTuple } from "@/lib/geo";
import { chunkWaypoints, snapToStreets } from "@/lib/ors";

const ok = (coords: [number, number][]) => (async () => new Response(JSON.stringify({ features: [{ geometry: { coordinates: coords } }] }))) as unknown as typeof fetch;

describe("chunkWaypoints", () => {
  it("shares boundary points so the joined route is continuous", () => {
    const pts = Array.from({ length: 120 }, (_, i) => i);
    const chunks = chunkWaypoints(pts, 50);
    expect(chunks.map((c) => c.length)).toEqual([50, 50, 22]);
    expect(chunks[0].at(-1)).toBe(chunks[1][0]);
    expect(chunks.every((c) => c.length <= 50)).toBe(true);
  });
});

describe("snapToStreets", () => {
  const a: LatLngTuple = [32, -81], b: LatLngTuple = [32.01, -81];
  it("refuses without a key", async () => {
    await expect(snapToStreets([a, b], { apiKey: "" })).rejects.toMatchObject({ status: 501 });
  });
  it("keeps the original endpoints and converts lng/lat", async () => {
    const out = await snapToStreets([a, b], { apiKey: "k", fetchImpl: ok([[-81.0001, 32.0002], [-81.0001, 32.005], [-81.0002, 32.0098]]) });
    expect(out[0]).toEqual(a);
    expect(out.at(-1)).toEqual(b);
    expect(out.length).toBeGreaterThanOrEqual(3);
  });
  it("maps routing failures to friendly errors", async () => {
    const f = (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch;
    await expect(snapToStreets([a, b], { apiKey: "k", fetchImpl: f })).rejects.toMatchObject({ status: 422 });
  });
});

describe("simplifyTo", () => {
  it("thins a dense path to the budget", () => {
    const dense: LatLngTuple[] = Array.from({ length: 1000 }, (_, i) => [32 + i * 0.00001, -81 + Math.sin(i / 20) * 0.0005]);
    const out = simplifyTo(dense, 100);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out[0]).toEqual(dense[0]);
    expect(out.at(-1)).toEqual(dense.at(-1));
  });
});
