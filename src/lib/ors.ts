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

/**
 * Route a walking line through the given waypoints along real streets/footpaths (OpenRouteService).
 * Returns a path starting and ending on the original first/last waypoints, thinned to `maxPoints`.
 */
export async function snapToStreets(
  points: LatLngTuple[],
  opts: { apiKey?: string; maxPoints?: number; fetchImpl?: typeof fetch } = {},
): Promise<LatLngTuple[]> {
  const key = opts.apiKey ?? process.env.ORS_API_KEY;
  if (!key) throw new SnapError("Street snapping isn't set up (ORS_API_KEY is missing).", 501);
  if (points.length < 2) throw new SnapError("Need at least two points to snap.", 400);
  if (points.length > ORS_MAX_POINTS) throw new SnapError(`Select a shorter section (max ${ORS_MAX_POINTS} points).`, 400);
  const doFetch = opts.fetchImpl ?? fetch;
  const full: LatLngTuple[] = [];
  for (const chunk of chunkWaypoints(points)) {
    const res = await doFetch(ORS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: key },
      body: JSON.stringify({ coordinates: chunk.map(([la, ln]) => [ln, la]), preference: "recommended", instructions: false }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new SnapError("Routing service is busy or the daily limit was hit. Try again later.", 429);
      if (res.status === 404 || res.status === 400) throw new SnapError("Couldn't find a walking route between those points. Move a point closer to a street, or draw that bit by hand.", 422);
      throw new SnapError(`Routing service error (${res.status}).`);
    }
    const body = (await res.json()) as { features?: { geometry?: { coordinates?: [number, number][] } }[] };
    const coords = body.features?.[0]?.geometry?.coordinates;
    if (!coords?.length) throw new SnapError("Routing service returned no route.");
    const seg = coords.map(([ln, la]) => [la, ln] as LatLngTuple);
    full.push(...(full.length ? seg.slice(1) : seg));
  }
  const dense: LatLngTuple[] = [points[0], ...full, points[points.length - 1]];
  return simplifyTo(dense, opts.maxPoints ?? 400).map(([la, ln]) => [+la.toFixed(6), +ln.toFixed(6)] as LatLngTuple);
}
