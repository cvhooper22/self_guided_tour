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
    const { path: out } = await snapToStreets([a, b], { apiKey: "k", fetchImpl: ok([[-81.0001, 32.0002], [-81.0001, 32.005], [-81.0002, 32.0098]]) });
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

describe("directions steps", () => {
  const coords: [number, number][] = [[-81, 32], [-81, 32.001], [-80.999, 32.001], [-80.999, 32.002]];
  const step = (instruction: string, type: number, name: string, distance: number, wp: [number, number]) => ({ instruction, type, name, distance, way_points: wp });
  const body = (segments: unknown[]) => (async () => new Response(JSON.stringify({ features: [{ geometry: { coordinates: coords }, properties: { segments } }] }))) as unknown as typeof fetch;
  const a: LatLngTuple = [32, -81], b: LatLngTuple = [32.002, -80.999];

  it("returns text steps, dropping interior arrive/depart noise", async () => {
    const segments = [
      { steps: [step("Head north on Bull Street", 11, "Bull Street", 111, [0, 1]), step("Arrive at your via point", 10, "-", 0, [1, 1])] },
      { steps: [step("Head north on Bull Street", 11, "Bull Street", 50, [1, 1]), step("Turn right onto Taylor Street", 1, "Taylor Street", 90, [1, 2]), step("Arrive at your destination", 10, "-", 0, [3, 3])] },
    ];
    const { steps } = await snapToStreets([a, b], { apiKey: "k", steps: true, fetchImpl: body(segments) });
    expect(steps.map((s) => s.text)).toEqual(["Head north on Bull Street", "Turn right onto Taylor Street", "Arrive at your destination"]);
    expect(steps[0].distanceM).toBe(161); // via-point depart merged into the previous step
    expect(steps[1].at).toEqual([32.001, -81]);
  });
  it("says 'Continue onto' when a via point starts on a different street", async () => {
    const segments = [
      { steps: [step("Head north on Bull Street", 11, "Bull Street", 111, [0, 1])] },
      { steps: [step("Head east on Taylor Street", 11, "Taylor Street", 80, [1, 2]), step("Arrive at your destination", 10, "-", 0, [3, 3])] },
    ];
    const { steps } = await snapToStreets([a, b], { apiKey: "k", steps: true, fetchImpl: body(segments) });
    expect(steps.map((s) => s.text)).toEqual(["Head north on Bull Street", "Continue onto Taylor Street", "Arrive at your destination"]);
  });
  it("omits steps unless asked", async () => {
    const { steps } = await snapToStreets([a, b], { apiKey: "k", fetchImpl: body([]) });
    expect(steps).toEqual([]);
  });
});
