import type { RawStep } from "./directions";
import { simplifyTo, type LatLngTuple } from "./geo";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
/** ORS's free tier allows 50 waypoints per directions request. */
export const ORS_MAX_WAYPOINTS = 50;
export const ORS_MAX_POINTS = 200;

export class SnapError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

/** Split into windows of at most `size` points that share their boundary point, so the joined route is continuous. */
export function chunkWaypoints<T>(pts: T[], size = ORS_MAX_WAYPOINTS): T[][] {
  if (pts.length <= size) return [pts];
  const out: T[][] = [];
  for (let i = 0; i < pts.length - 1; i += size - 1) out.push(pts.slice(i, i + size));
  return out;
}

type OrsStep = { instruction?: string; distance?: number; type?: number; name?: string; way_points?: [number, number] };
type OrsBody = { features?: { geometry?: { coordinates?: [number, number][] }; properties?: { segments?: { steps?: OrsStep[] }[] } }[] };
const ARRIVE = 10, DEPART = 11;
const named = (n?: string) => (n && n !== "-" ? n : "");

/**
 * Turn one chunk's ORS steps into plain steps. Waypoints inside the route are drawing points, not stops, so their
 * "arrive"/"head" steps are dropped or merged into the previous step instead of being shown to travelers.
 */
export function parseSteps(body: OrsBody, coords: LatLngTuple[], pos: { first: boolean; last: boolean }, acc: (RawStep & { name: string })[]) {
  const segs = body.features?.[0]?.properties?.segments ?? [];
  segs.forEach((seg, si) => {
    const steps = seg.steps ?? [];
    steps.forEach((st, i) => {
      const text = (st.instruction ?? "").trim();
      const distanceM = Math.round(st.distance ?? 0);
      const at = coords[st.way_points?.[0] ?? 0] ?? coords[0];
      const name = named(st.name);
      const isFirst = pos.first && si === 0 && i === 0;
      const isFinal = pos.last && si === segs.length - 1 && i === steps.length - 1;
      if (!text || !at) return;
      if (st.type === ARRIVE && !isFinal) return;
      if (st.type === DEPART && !isFirst) {
        const prev = acc.at(-1);
        if (prev && (!name || name === prev.name)) { prev.distanceM += distanceM; return; }
        acc.push({ text: name ? `Continue onto ${name}` : text, distanceM, at, name });
        return;
      }
      acc.push({ text, distanceM, at, name });
    });
  });
}

/**
 * Route a walking line through the given waypoints along real streets/footpaths (OpenRouteService).
 * Returns a path starting and ending on the original first/last waypoints, thinned to `maxPoints`.
 */
export async function snapToStreets(
  points: LatLngTuple[],
  opts: { apiKey?: string; maxPoints?: number; fetchImpl?: typeof fetch; steps?: boolean } = {},
): Promise<{ path: LatLngTuple[]; steps: RawStep[] }> {
  const key = opts.apiKey ?? process.env.ORS_API_KEY;
  if (!key) throw new SnapError("Street snapping isn't set up (ORS_API_KEY is missing).", 501);
  if (points.length < 2) throw new SnapError("Need at least two points to snap.", 400);
  if (points.length > ORS_MAX_POINTS) throw new SnapError(`Select a shorter section (max ${ORS_MAX_POINTS} points).`, 400);
  const doFetch = opts.fetchImpl ?? fetch;
  const full: LatLngTuple[] = [];
  const steps: (RawStep & { name: string })[] = [];
  const chunks = chunkWaypoints(points);
  for (const [ci, chunk] of chunks.entries()) {
    const res = await doFetch(ORS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: key },
      body: JSON.stringify({ coordinates: chunk.map(([la, ln]) => [ln, la]), preference: "recommended", instructions: !!opts.steps, ...(opts.steps ? { instructions_format: "text", language: "en" } : {}) }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new SnapError("Routing service is busy or the daily limit was hit. Try again later.", 429);
      if (res.status === 404 || res.status === 400) throw new SnapError("Couldn't find a walking route between those points. Move a point closer to a street, or draw that bit by hand.", 422);
      throw new SnapError(`Routing service error (${res.status}).`);
    }
    const body = (await res.json()) as OrsBody;
    const coords = body.features?.[0]?.geometry?.coordinates;
    if (!coords?.length) throw new SnapError("Routing service returned no route.");
    const seg = coords.map(([ln, la]) => [la, ln] as LatLngTuple);
    full.push(...(full.length ? seg.slice(1) : seg));
    if (opts.steps) parseSteps(body, seg, { first: ci === 0, last: ci === chunks.length - 1 }, steps);
  }
  const dense: LatLngTuple[] = [points[0], ...full, points[points.length - 1]];
  const path = simplifyTo(dense, opts.maxPoints ?? 400).map(([la, ln]) => [+la.toFixed(6), +ln.toFixed(6)] as LatLngTuple);
  // Waypoints that land off-street produce tiny unnamed connector "turns"; fold them into the previous step.
  const tidy = steps.filter((st, i) => {
    if (i === 0 || i === steps.length - 1 || st.name || st.distanceM >= 15) return true;
    steps[i - 1].distanceM += st.distanceM;
    return false;
  });
  return { path, steps: tidy.map(({ text, distanceM, at }) => ({ text, distanceM, at: [+at[0].toFixed(6), +at[1].toFixed(6)] as LatLngTuple })) };
}
