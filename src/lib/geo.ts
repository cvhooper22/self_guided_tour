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
