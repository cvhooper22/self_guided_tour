export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters. */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Only http(s) and same-site paths may be rendered as links/media (blocks javascript: etc). */
export function safeUrl(u: string): string | null {
  const t = u.trim();
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  try {
    const p = new URL(t);
    return p.protocol === "http:" || p.protocol === "https:" ? p.toString() : null;
  } catch {
    return null;
  }
}

/** Walking-directions deep links; they open the traveler's own maps app, so no API key or quota is involved. */
export function directionsUrls({ lat, lng }: LatLng) {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`,
  };
}

/** Index at which a point on a polyline click should be inserted: after the nearest segment's start. */
export function nearestSegmentIndex(path: [number, number][], p: [number, number]): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ay, ax] = path[i], [by, bx] = path[i + 1];
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((p[1] - ax) * dx + (p[0] - ay) * dy) / len)) : 0;
    const d = (ax + t * dx - p[1]) ** 2 + (ay + t * dy - p[0]) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best + 1;
}

export type LatLngTuple = [number, number];

export function pathLengthM(path: LatLngTuple[]): number {
  let t = 0;
  for (let i = 1; i < path.length; i++) t += distanceM({ lat: path[i - 1][0], lng: path[i - 1][1] }, { lat: path[i][0], lng: path[i][1] });
  return t;
}

/** Douglas-Peucker on a local flat projection; keeps the endpoints. */
export function simplifyPath(path: LatLngTuple[], toleranceM: number): LatLngTuple[] {
  if (path.length < 3) return path;
  const k = Math.cos((path[0][0] * Math.PI) / 180), m = 111320;
  const xy = path.map(([la, ln]) => [ln * m * k, la * m] as const);
  const keep = new Uint8Array(path.length);
  keep[0] = keep[path.length - 1] = 1;
  const stack: [number, number][] = [[0, path.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = xy[a], [bx, by] = xy[b];
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    let far = -1, farD = toleranceM;
    for (let i = a + 1; i < b; i++) {
      const t = len ? Math.max(0, Math.min(1, ((xy[i][0] - ax) * dx + (xy[i][1] - ay) * dy) / len)) : 0;
      const d = Math.hypot(ax + t * dx - xy[i][0], ay + t * dy - xy[i][1]);
      if (d > farD) { farD = d; far = i; }
    }
    if (far >= 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return path.filter((_, i) => keep[i]);
}

/** Simplify with growing tolerance until the path has at most `max` points. */
export function simplifyTo(path: LatLngTuple[], max: number, startM = 1.5): LatLngTuple[] {
  let out = path, tol = startM;
  while (out.length > max && tol < 500) { tol *= 1.6; out = simplifyPath(path, tol); }
  return out.length > max ? out.filter((_, i) => i % Math.ceil(out.length / max) === 0 || i === out.length - 1).slice(0, max) : out;
}
