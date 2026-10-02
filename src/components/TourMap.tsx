"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { tileConfig, type ThemeTokens } from "@/lib/themes";

export type MapStop = { id: string; lat: number; lng: number; label: string; visited?: boolean };

type Props = {
  tokens: ThemeTokens;
  center: [number, number];
  stops: MapStop[];
  selectedId?: string | null;
  routeIds?: string[];
  user?: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerDrag?: (id: string, lat: number, lng: number) => void;
  fitKey?: string;
  className?: string;
};

export default function TourMap(p: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const cb = useRef(p);
  useEffect(() => { cb.current = p; });

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true }).setView(p.center, 15);
    map.current = m;
    layers.current = L.layerGroup().addTo(m);
    m.on("click", (e) => cb.current.onMapClick?.(e.latlng.lat, e.latlng.lng));
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tile = tileConfig(p.tokens);
  useEffect(() => {
    if (!map.current) return;
    tiles.current?.remove();
    tiles.current = L.tileLayer(tile.url, { attribution: tile.attribution, maxZoom: 19, className: tile.className }).addTo(map.current);
  }, [tile.url, tile.attribution, tile.className]);

  const shape = p.tokens.map.markerShape;
  const routeKey = (p.routeIds ?? []).join(",");
  useEffect(() => {
    const g = layers.current;
    if (!g) return;
    g.clearLayers();
    const byId = new Map(p.stops.map((s) => [s.id, s]));
    const line = (p.routeIds ?? []).map((id) => byId.get(id)).filter(Boolean).map((s) => [s!.lat, s!.lng] as [number, number]);
    if (line.length > 1)
      L.polyline(line, { color: String(p.tokens.colors.routeLine), weight: 4, dashArray: p.tokens.map.routeLineStyle === "dashed" ? "8 8" : undefined }).addTo(g);
    p.stops.forEach((s, i) => {
      const cls = `tm-marker ${shape}${s.visited ? " visited" : ""}${s.id === p.selectedId ? " selected" : ""}`;
      const icon = L.divIcon({ className: "", html: `<div class="${cls}"><span>${i + 1}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
      const mk = L.marker([s.lat, s.lng], { icon, title: s.label, draggable: !!cb.current.onMarkerDrag }).addTo(g);
      mk.on("click", (e) => { L.DomEvent.stopPropagation(e); cb.current.onSelect?.(s.id); });
      mk.on("dragend", () => { const ll = mk.getLatLng(); cb.current.onMarkerDrag?.(s.id, ll.lat, ll.lng); });
    });
    if (p.user) L.marker([p.user.lat, p.user.lng], { icon: L.divIcon({ className: "", html: '<div class="tm-user"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false }).addTo(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.stops, p.selectedId, p.user, shape, routeKey, p.tokens.colors.routeLine, p.tokens.map.routeLineStyle]);

  // Re-fit only when the caller changes fitKey (e.g. route switch), so dragging doesn't jump the view.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const pts = p.stops.map((s) => [s.lat, s.lng] as [number, number]);
    if (pts.length > 1) m.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
    else if (pts.length === 1) m.setView(pts[0], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fitKey]);

  useEffect(() => {
    const s = p.stops.find((x) => x.id === p.selectedId);
    if (s && map.current) map.current.panTo([s.lat, s.lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.selectedId]);

  return <div ref={el} className={p.className ?? "h-full w-full"} role="application" aria-label="Tour map" />;
}
