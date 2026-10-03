"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ThemeScope } from "./ThemeScope";
import { TourMap } from "./MapLazy";
import { SourcesPanel, StopStory, TagChips } from "./StopDetail";
import { directionsFresh, legPath } from "@/lib/directions";
import { directionsUrls, distanceM, pathLengthM } from "@/lib/geo";
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
  // Stop whose "Step-by-step" section is expanded; its leg is only highlighted on the map while open.
  const [stepsOpenFor, setStepsOpenFor] = useState<string | null>(null);
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
        if (live) {
          setBundle(b);
          // Open on a route that covers every stop (e.g. "Full tour") so its drawn path and directions show by default.
          const all = new Set(b.stops.map((s) => s.id));
          const full = b.routes.filter((r) => r.stopIds.length === all.size && r.stopIds.every((id) => all.has(id)));
          const pick = full.find((r) => directionsFresh(r)) ?? full.find((r) => r.path.length > 1);
          if (pick) setRouteId(pick.id);
        }
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
  // The walk from the open stop to the next one; drawn on top of the route while its step-by-step section is open.
  const stopIdx = stop ? stops.indexOf(stop) : -1;
  const leg = stopIdx >= 0 ? legPath(route?.path ?? [], stops.map((s) => [s.lat, s.lng] as [number, number]), stopIdx) : [];
  const mapStops = stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, visited: visited.includes(s.id), icon: s.markerIcon, color: s.markerColor }));
  const center: [number, number] = stops[0] ? [stops[0].lat, stops[0].lng] : [bundle.tour.lat, bundle.tour.lng];

  return (
    <ThemeScope tokens={bundle.tokens} className="flex h-[calc(100dvh-3rem)] flex-col md:flex-row">
      <div className="relative h-1/2 md:h-full md:flex-1">
        <TourMap tokens={bundle.tokens} center={center} stops={mapStops} selectedId={selected} routeIds={stops.map((s) => s.id)} path={route?.path} highlight={stop && stepsOpenFor === stop.id ? leg : undefined} user={pos} onSelect={(id) => setSelected(id)} fitKey={`${bundle.tour.id}:${routeId}`} />
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
            <TagChips tags={stop.tags} />
            <StopStory story={stop.story} />
            <SourcesPanel sources={stop.sources} />
            {route && directionsFresh(route) && stops[stopIdx + 1] && (() => {
              const next = stops[stopIdx + 1];
              const steps = route.directions!.steps.filter((s) => s.leg === stopIdx);
              const fmt = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
              return (
                <details className="t-card mt-5 p-3" open={stepsOpenFor === stop.id} onToggle={(e) => { const open = e.currentTarget.open; setStepsOpenFor((cur) => (open ? stop.id : cur === stop.id ? null : cur)); }}>
                  <summary className="cursor-pointer font-semibold">Step-by-step to {next.title}</summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                    {steps.length > 0
                      ? steps.map((s, i) => <li key={i}>{s.text}{s.distanceM > 0 && <span className="t-muted"> ({fmt(s.distanceM)})</span>}</li>)
                      // Short legs often have no steps of their own; the highlighted line on the map shows the way.
                      : <li>Continue to {next.title}<span className="t-muted"> (about {fmt(Math.max(10, Math.round(pathLengthM(leg) / 10) * 10))})</span></li>}
                  </ol>
                </details>
              );
            })()}
            <p className="t-muted mt-5 text-sm">
              Walking directions:{" "}
              <a href={directionsUrls(stop).google} target="_blank" rel="noopener noreferrer">Google Maps</a>
              {" · "}
              <a href={directionsUrls(stop).apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>
            </p>
            <div className="mt-3 flex gap-2">
              <button className="t-btn-ghost" onClick={() => markVisited(stop.id)} disabled={visited.includes(stop.id)}>{visited.includes(stop.id) ? "✓ Visited" : "Mark visited"}</button>
              {stops[stops.indexOf(stop) + 1] && <button className="t-btn" onClick={() => { markVisited(stop.id); setSelected(stops[stops.indexOf(stop) + 1].id); }}>Next {label.toLowerCase()} →</button>}
            </div>
          </article>
        )}
      </aside>
    </ThemeScope>
  );
}
