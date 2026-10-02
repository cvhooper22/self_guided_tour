"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ThemeScope } from "./ThemeScope";
import { TourMap } from "./MapLazy";
import { SourcesPanel, StopStory } from "./StopDetail";
import { distanceM } from "@/lib/geo";
import type { TourBundle } from "@/lib/tours-repo";

// The player is deliberately client-only and talks to /api/tours/[slug], so it can be extracted into its own app later.
type Bundle = Omit<TourBundle, "tour"> & { tour: Omit<TourBundle["tour"], never> };
const cacheKey = (slug: string) => `tour-bundle:${slug}`;
const visitedKey = (id: string) => `tour-visited:${id}`;

export default function Player({ slug, initialStopId }: { slug: string; initialStopId?: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [routeId, setRouteId] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(initialStopId ?? null);
  const [visited, setVisited] = useState<string[]>([]);
  const [geo, setGeo] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const autoOpened = useRef(new Set<string>());

  useEffect(() => {
    let live = true;
    fetch(`/api/tours/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Tour not found" : "Could not load tour");
        const b = (await r.json()) as Bundle;
        try { localStorage.setItem(cacheKey(slug), JSON.stringify(b)); } catch {}
        if (live) setBundle(b);
      })
      .catch((e: Error) => {
        // Spotty signal outdoors: fall back to the last copy we saw.
        try {
          const c = localStorage.getItem(cacheKey(slug));
          if (c && live) { setBundle(JSON.parse(c)); setOffline(true); return; }
        } catch {}
        if (live) setError(e.message);
      });
    return () => { live = false; };
  }, [slug]);

  const tourId = bundle?.tour.id;
  useEffect(() => {
    if (!tourId) return;
    let local: string[] = [];
    try { local = JSON.parse(localStorage.getItem(visitedKey(tourId)) ?? "[]"); } catch {}
    let live = true;
    (async () => {
      let remote: string[] = [];
      try { remote = (await (await fetch(`/api/progress?tourId=${tourId}`)).json()).visitedStopIds ?? []; } catch {}
      if (live) setVisited([...new Set([...local, ...remote])]);
    })();
    return () => { live = false; };
  }, [tourId]);

  const markVisited = useCallback((id: string) => {
    if (!tourId) return;
    setVisited((v) => {
      if (v.includes(id)) return v;
      const n = [...v, id];
      try { localStorage.setItem(visitedKey(tourId), JSON.stringify(n)); } catch {}
      fetch("/api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ tourId, visitedStopIds: n }) }).catch(() => {});
      return n;
    });
  }, [tourId]);

  const route = bundle?.routes.find((r) => r.id === routeId);
  const stops = useMemo(() => {
    if (!bundle) return [];
    if (!route) return bundle.stops;
    const by = new Map(bundle.stops.map((s) => [s.id, s]));
    return route.stopIds.map((id) => by.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  }, [bundle, route]);

  const stop = stops.find((s) => s.id === selected) ?? null;
  const next = stops.find((s) => !visited.includes(s.id));

  // Geolocation: open a stop's story automatically when the visitor walks into its radius.
  useEffect(() => {
    if (!geo) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { setGeoMsg(""); setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      (e) => { setGeoMsg(e.code === 1 ? "Location permission denied." : "Couldn't get your location."); setGeo(false); },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [geo]);

  function toggleGeo() {
    if (geo) return setGeo(false);
    if (!navigator.geolocation) return setGeoMsg("Location isn't available on this device.");
    setGeoMsg("Finding you…");
    setGeo(true);
  }

  useEffect(() => {
    if (!geo || !pos) return;
    const hit = stops.find((s) => !autoOpened.current.has(s.id) && distanceM(pos, s) <= s.radiusM);
    if (hit) { autoOpened.current.add(hit.id); setSelected(hit.id); markVisited(hit.id); }
  }, [geo, pos, stops, markVisited]);

  if (error) return <div className="p-8 text-center"><p className="mb-4">{error}</p><Link className="underline" href="/tours">Browse tours</Link></div>;
  if (!bundle) return <div className="p-8 text-center">Loading tour…</div>;

  const label = String(bundle.tokens.copy.stopLabel);
  const mapStops = stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, visited: visited.includes(s.id) }));
  const center: [number, number] = stops[0] ? [stops[0].lat, stops[0].lng] : [bundle.tour.lat, bundle.tour.lng];

  return (
    <ThemeScope tokens={bundle.tokens} className="flex h-[calc(100dvh-3rem)] flex-col md:flex-row">
      <div className="relative h-1/2 md:h-full md:flex-1">
        <TourMap tokens={bundle.tokens} center={center} stops={mapStops} selectedId={selected} routeIds={stops.map((s) => s.id)} user={pos} onSelect={(id) => setSelected(id)} fitKey={`${bundle.tour.id}:${routeId}`} />
        <button className="t-btn absolute right-3 top-3 z-[1000]" aria-pressed={geo} onClick={toggleGeo}>
          {geo ? "📍 Location on" : "📍 Use my location"}
        </button>
        {geoMsg && <div className="t-card absolute left-3 top-3 z-[1000] px-3 py-1 text-sm">{geoMsg}</div>}
      </div>

      <aside className="h-1/2 overflow-y-auto p-4 md:h-full md:w-[26rem]" aria-live="polite">
        {offline && <p className="t-chip mb-2 inline-block">Offline copy</p>}
        {!stop ? (
          <>
            <Link href={`/tour/${slug}`} className="text-sm">← Overview</Link>
            <h1 className="mb-1 mt-1 text-2xl">{bundle.tour.title}</h1>
            <p className="t-muted mb-3 text-sm">{visited.length} of {bundle.stops.length} visited</p>
            {bundle.routes.length > 0 && (
              <label className="mb-3 block text-sm">Route
                <select className="t-card mt-1 block w-full p-2" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                  <option value="all">All stops</option>
                  {bundle.routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            )}
            {route?.description && <p className="t-muted mb-3 text-sm">{route.description}</p>}
            {next && <button className="t-btn mb-3 w-full" onClick={() => setSelected(next.id)}>Next: {next.title}</button>}
            <ol className="space-y-2">
              {stops.map((s, i) => (
                <li key={s.id}>
                  <button className="t-card flex w-full items-center gap-3 p-3 text-left" onClick={() => setSelected(s.id)}>
                    <span className="t-chip">{i + 1}</span>
                    <span className="flex-1">{s.title}</span>
                    {visited.includes(s.id) && <span aria-label="Visited">✓</span>}
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <article>
            <button className="t-btn-ghost mb-3" onClick={() => setSelected(null)}>← All {label.toLowerCase()}s</button>
            <p className="t-muted text-sm">{label} {stops.indexOf(stop) + 1} of {stops.length}</p>
            <h2 className="mb-3 text-2xl">{stop.title}</h2>
            <StopStory story={stop.story} />
            <SourcesPanel sources={stop.sources} />
            <div className="mt-5 flex gap-2">
              <button className="t-btn-ghost" onClick={() => markVisited(stop.id)} disabled={visited.includes(stop.id)}>{visited.includes(stop.id) ? "✓ Visited" : "Mark visited"}</button>
              {stops[stops.indexOf(stop) + 1] && <button className="t-btn" onClick={() => { markVisited(stop.id); setSelected(stops[stops.indexOf(stop) + 1].id); }}>Next {label.toLowerCase()} →</button>}
            </div>
          </article>
        )}
      </aside>
    </ThemeScope>
  );
}
