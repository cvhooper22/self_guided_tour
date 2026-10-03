import { distanceM, type LatLng } from "./geo";

export type OrderPoint = LatLng & { id: string };
export type OrderOptions = {
  /** Fix the first stop. Omit to let the algorithm pick the best starting stop. */
  startId?: string;
  /** Count (and optimise for) the walk back to the start. */
  loop?: boolean;
};

/** Length of visiting `order` (indexes into the matrix) in meters. */
export function tourLength(d: number[][], order: number[], loop: boolean): number {
  let t = 0;
  for (let i = 1; i < order.length; i++) t += d[order[i - 1]][order[i]];
  if (loop && order.length > 2) t += d[order[order.length - 1]][order[0]];
  return t;
}

function nearestNeighbour(d: number[][], start: number): number[] {
  const left = new Set(d.map((_, i) => i));
  const order = [start];
  left.delete(start);
  while (left.size) {
    const last = order[order.length - 1];
    let best = -1;
    for (const j of left) if (best < 0 || d[last][j] < d[last][best]) best = j;
    order.push(best);
    left.delete(best);
  }
  return order;
}

/** 2-opt: reverse a section whenever that shortens the walk. `lo` is the first index allowed to move. */
function twoOpt(d: number[][], order: number[], loop: boolean, lo: number): number[] {
  const o = [...order];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = lo; i < o.length - 1; i++) {
      for (let j = i + 1; j < o.length; j++) {
        const cand = [...o.slice(0, i), ...o.slice(i, j + 1).reverse(), ...o.slice(j + 1)];
        if (tourLength(d, cand, loop) + 1e-6 < tourLength(d, o, loop)) { o.splice(0, o.length, ...cand); improved = true; }
      }
    }
  }
  return o;
}

/**
 * Quick shortest-walk ordering by straight-line distance (nearest neighbour + 2-opt).
 * Not guaranteed optimal and ignores streets, rivers and barriers; fine for a first draft.
 */
export function orderStops(points: OrderPoint[], opts: OrderOptions = {}): { ids: string[]; lengthM: number } {
  const n = points.length;
  const loop = !!opts.loop;
  if (n < 3) return { ids: points.map((p) => p.id), lengthM: n === 2 ? distanceM(points[0], points[1]) * (loop ? 2 : 1) : 0 };
  const d = points.map((a) => points.map((b) => distanceM(a, b)));
  const fixed = opts.startId ? points.findIndex((p) => p.id === opts.startId) : -1;
  const starts = fixed >= 0 ? [fixed] : points.map((_, i) => i);
  let best: number[] = [], bestLen = Infinity;
  for (const s of starts) {
    // For a loop the start is arbitrary, so only a fixed start pins index 0.
    const o = twoOpt(d, nearestNeighbour(d, s), loop, fixed >= 0 ? 1 : loop ? 1 : 0);
    const len = tourLength(d, o, loop);
    if (len < bestLen) { best = o; bestLen = len; }
  }
  return { ids: best.map((i) => points[i].id), lengthM: bestLen };
}

export function currentLengthM(points: OrderPoint[], loop = false): number {
  const d = points.map((a) => points.map((b) => distanceM(a, b)));
  return tourLength(d, points.map((_, i) => i), loop);
}
