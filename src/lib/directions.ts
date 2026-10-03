import { z } from "zod";
import type { LatLngTuple } from "./geo";

/** One line of walking directions. `leg` is the index of the stop the step leaves from (leg k = stop k to stop k+1). */
export type RouteStep = { text: string; distanceM: number; at: LatLngTuple; leg: number };
export type RouteDirections = { sig: string; steps: RouteStep[] };
/** A step as returned by the routing service, before it is assigned to a leg. */
export type RawStep = Omit<RouteStep, "leg">;

export const directionsSchema = z
  .object({
    sig: z.string().max(40),
    steps: z.array(z.object({
      text: z.string().trim().min(1).max(300),
      distanceM: z.number().min(0).max(100000),
      at: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
      leg: z.number().int().min(0).max(200),
    })).max(400),
  })
  .nullable()
  .default(null);

/** Fingerprint of what the directions were generated for; if the path or stop order changes they are out of date. */
export function routeSig(path: LatLngTuple[], stopIds: string[]): string {
  const s = JSON.stringify([path, stopIds]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "." + s.length.toString(36);
}

export const directionsFresh = (r: { path: LatLngTuple[]; stopIds: string[]; directions?: RouteDirections | null }) =>
  !!r.directions && r.directions.sig === routeSig(r.path, r.stopIds);

function nearestIndex(base: LatLngTuple[], p: LatLngTuple): number {
  let best = 0, bd = Infinity;
  for (let i = 0; i < base.length; i++) {
    const d = (base[i][0] - p[0]) ** 2 + (base[i][1] - p[1]) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

/** Index in `base` closest to each stop, forced to be non-decreasing so an out-and-back route can't jump backwards. */
export function stopPathIndexes(base: LatLngTuple[], stopPoints: LatLngTuple[]): number[] {
  let floor = 0;
  return stopPoints.map((p) => (floor = Math.max(floor, nearestIndex(base, p))));
}

/** The part of the route line between stop `k` and stop `k+1` (straight line if there is no usable path). */
export function legPath(path: LatLngTuple[], stopPoints: LatLngTuple[], k: number): LatLngTuple[] {
  const a = stopPoints[k], b = stopPoints[k + 1];
  if (!a || !b) return [];
  if (path.length < 2) return [a, b];
  const idx = stopPathIndexes(path, stopPoints);
  return idx[k + 1] > idx[k] ? path.slice(idx[k], idx[k + 1] + 1) : [a, b];
}

/** Assign each step to the stop-to-stop leg it belongs to, by where it falls along the route line. */
export function assignLegs(steps: RawStep[], base: LatLngTuple[], stopPoints: LatLngTuple[]): RouteStep[] {
  if (!base.length) return steps.map((s) => ({ ...s, leg: 0 }));
  const stopIdx = stopPathIndexes(base, stopPoints);
  const lastLeg = Math.max(0, stopPoints.length - 2);
  return steps.map((s) => {
    const p = nearestIndex(base, s.at);
    let leg = 0;
    for (let k = 0; k <= lastLeg; k++) if (stopIdx[k] !== undefined && stopIdx[k] <= p) leg = k;
    return { ...s, leg };
  });
}
