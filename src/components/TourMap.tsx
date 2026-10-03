"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { nearestSegmentIndex } from "@/lib/geo";
import { parseMarker } from "@/lib/markers";
import { highlightColor, tileConfig, type ThemeTokens } from "@/lib/themes";

export type MapStop = { id: string; lat: number; lng: number; label: string; visited?: boolean; icon?: string; color?: string };

type Props = {
  tokens: ThemeTokens;
  center: [number, number];
  stops: MapStop[];
  selectedId?: string | null;
  routeIds?: string[];
  /** Operator-drawn line; replaces the straight lines between stops when it has 2+ points. */
  path?: [number, number][];
  /** When set, path vertices are draggable (dblclick removes) and clicking the line inserts a point. */
  onPathChange?: (path: [number, number][]) => void;
  /** Path-editing: click a vertex to select it; selected indexes are highlighted and the span between two is emphasised. */
  onVertexClick?: (index: number) => void;
  selection?: number[];
  /** A stretch of route to emphasise (e.g. the walk from the open stop to the next one). */
  highlight?: [number, number][];
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
  const defaultIcon = p.tokens.map.markerIcon;
  const routeKey = (p.routeIds ?? []).join(",");
  useEffect(() => {
    const g = layers.current;
    if (!g) return;
    g.clearLayers();
    const byId = new Map(p.stops.map((s) => [s.id, s]));
    const drawn = p.path && p.path.length > 1 ? p.path : null;
    const line = drawn ?? (p.routeIds ?? []).map((id) => byId.get(id)).filter(Boolean).map((s) => [s!.lat, s!.lng] as [number, number]);
    if (line.length > 1) {
      const pl = L.polyline(line, { color: String(p.tokens.colors.routeLine), weight: 4, dashArray: p.tokens.map.routeLineStyle === "dashed" ? "8 8" : undefined, interactive: !!cb.current.onPathChange }).addTo(g);
      pl.on("click", (e) => {
        if (!drawn || !cb.current.onPathChange) return;
        L.DomEvent.stopPropagation(e);
        const at: [number, number] = [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)];
        const next = [...drawn];
        next.splice(nearestSegmentIndex(drawn, at), 0, at);
        cb.current.onPathChange(next);
      });
    }
    if (p.highlight && p.highlight.length > 1) {
      // A pale casing under a bright core keeps the leg readable on any tile style and next to the base route line.
      L.polyline(p.highlight, { color: "#ffffff", weight: 12, opacity: 0.9, lineCap: "round", interactive: false }).addTo(g);
      L.polyline(p.highlight, { color: highlightColor(p.tokens), weight: 7, opacity: 1, lineCap: "round", interactive: false }).addTo(g);
    }
    const sel = p.selection ?? [];
    if (p.path && sel.length === 2 && drawn) {
      const [a, b] = [Math.min(...sel), Math.max(...sel)];
      L.polyline(p.path.slice(a, b + 1), { color: String(p.tokens.colors.accent), weight: 10, opacity: 0.55, interactive: false }).addTo(g);
    }
    if (p.path && cb.current.onPathChange)
      p.path.forEach((pt, i) => {
        const cls = `tm-vertex${sel.includes(i) ? " sel" : ""}${i === 0 ? " first" : ""}${i === p.path!.length - 1 ? " last" : ""}`;
        const v = L.marker(pt, { draggable: true, zIndexOffset: sel.includes(i) ? 1000 : 0, title: `Point ${i + 1}: click to select, drag to move`, icon: L.divIcon({ className: "", html: `<div class="${cls}" data-i="${i}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(g);
        v.on("click", (e) => { L.DomEvent.stopPropagation(e); cb.current.onVertexClick?.(i); });
        v.on("dragend", () => { const ll = v.getLatLng(); cb.current.onPathChange?.(p.path!.map((q, j) => (j === i ? [+ll.lat.toFixed(6), +ll.lng.toFixed(6)] : q))); });
      });
    p.stops.forEach((s, i) => {
      const m = parseMarker(s.icon) ?? parseMarker(defaultIcon);
      const state = `${s.visited ? " visited" : ""}${s.id === p.selectedId ? " selected" : ""}`;
      const el = document.createElement("div");
      if (m?.kind === "image") {
        el.className = `tm-marker-img${state}`;
        const img = document.createElement("img");
        img.src = m.src; img.alt = ""; img.draggable = false;
        el.append(img);
      } else {
        el.className = `tm-marker ${shape}${state}`;
        const label = document.createElement("span");
        label.textContent = m ? m.text : String(i + 1);
        el.append(label);
        if (s.color && /^#[0-9a-f]{6}$/i.test(s.color)) el.style.setProperty("--t-marker", s.color);
      }
      const big = m?.kind === "image";
      const icon = L.divIcon({ className: "", html: el, iconSize: big ? [40, 40] : [26, 26], iconAnchor: big ? [20, 20] : [13, 13] });
      const mk = L.marker([s.lat, s.lng], { icon, title: s.label, draggable: !!cb.current.onMarkerDrag }).addTo(g);
      mk.on("click", (e) => { L.DomEvent.stopPropagation(e); cb.current.onSelect?.(s.id); });
      mk.on("dragend", () => { const ll = mk.getLatLng(); cb.current.onMarkerDrag?.(s.id, ll.lat, ll.lng); });
    });
    if (p.user) L.marker([p.user.lat, p.user.lng], { icon: L.divIcon({ className: "", html: '<div class="tm-user"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false }).addTo(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.stops, p.selectedId, p.user, p.path, (p.highlight ?? []).join(";"), (p.selection ?? []).join(","), shape, defaultIcon, routeKey, p.tokens.colors.routeLine, p.tokens.colors.accent, p.tokens.colors.highlight, p.tokens.map.routeLineStyle]);

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
