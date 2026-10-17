"use client";
import Flourish from "./Flourish";
import CompassLogo from "./CompassLogo";
import ZoomImage from "./ZoomImage";
import { ChevronIcon, CloseIcon, FactIcon, LocateIcon } from "./PlayerIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ThemeScope } from "./ThemeScope";
import NavTheme from "./NavTheme";
import { TourMap } from "./MapLazy";
import { buildFactDeck } from "@/lib/fact-deck";
import Markdown from "react-markdown";
import { SourcesPanel, StopImages, StopStory, TagChips } from "./StopDetail";
import { directionsFresh, legPath } from "@/lib/directions";
import { directionsUrls, distanceM, pathLengthM, safeUrl } from "@/lib/geo";
import type { TourBundle } from "@/lib/tours-repo";

// The player is deliberately client-only and talks to /api/tours/[slug], so it can be extracted into its own app later.
type Bundle = Omit<TourBundle, "tour"> & { tour: Omit<TourBundle["tour"], never> };
const cacheKey = (slug: string) => `tour-bundle:${slug}`;
const visitedKey = (id: string) => `tour-visited:${id}`;
const factsKey = (id: string) => `tour-facts-seen:${id}`;

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
  // Mobile only: the map is the main view while navigating; the stop/list panel is a bottom sheet over it.
  const [sheet, setSheet] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inset, setInset] = useState(0);
  // Stop we just left while walking to the next one (mobile): directions stay docked at the bottom until "I'm there".
  const [walkFrom, setWalkFrom] = useState<string | null>(null);
  const [walkAt, setWalkAt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

    useEffect(() => {
    const h = root.current?.clientHeight ?? 0;
    setInset(!mobile ? 0 : sheet ? Math.round(h * (selected ? 1 : 0.6)) : walkFrom ? Math.round(h * 0.4) : 96);
  }, [mobile, sheet, bundle, selected, walkFrom]);

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

  // Fun facts: shown on demand ("Did you know?") or surfaced when the walker passes a pinned one.
  const [factId, setFactId] = useState<string | null>(null);
  const [seenFacts, setSeenFacts] = useState<string[]>([]);
  const [deck, setDeck] = useState<string[]>([]);
  const [factWide, setFactWide] = useState(false);
  const swipeX = useRef<number | null>(null);
  useEffect(() => {
    if (!tourId) return;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(factsKey(tourId)) ?? "[]"); } catch {}
    Promise.resolve().then(() => setSeenFacts(seen));
  }, [tourId]);
  const showFact = useCallback((id: string) => {
    setFactId(id);
    setSeenFacts((v) => {
      const n = [...v.filter((x) => x !== id), id];
      if (tourId) try { localStorage.setItem(factsKey(tourId), JSON.stringify(n.slice(-200))); } catch {}
      return n;
    });
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

  // Open the fact card on a swipeable deck built from where the walker is (see lib/fact-deck.ts); `first` picks the card to land on.
  function openFact(first?: string | null) {
    if (!bundle) return;
    const wi = walkFrom && mobile ? stops.findIndex((s) => s.id === walkFrom) : -1;
    const here = (wi >= 0 ? [walkFrom, stops[wi + 1]?.id] : [(stop ?? next)?.id]).filter((x): x is string => !!x);
    const d = buildFactDeck(bundle.facts, { pos, here, seen: seenFacts, first });
    if (!d.length) return;
    setDeck(d);
    showFact(d[0]);
  }
  function stepFact(dir: 1 | -1) {
    const at = deck.indexOf(factId ?? "");
    if (deck.length > 1 && at >= 0) showFact(deck[(at + dir + deck.length) % deck.length]);
  }

  // Passing a pinned fact for the first time surfaces it (unless the details sheet is covering the map).
  const onPos = useRef((_at: { lat: number; lng: number }) => {});
  useEffect(() => {
    onPos.current = (at) => {
      if (factId || (mobile && sheet)) return;
      const hit = bundle?.facts.find((f) => f.lat !== null && f.lng !== null && !seenFacts.includes(f.id) && distanceM(at, { lat: f.lat, lng: f.lng }) <= f.radiusM);
      if (hit) openFact(hit.id);
    };
  });

  // Geolocation: open a stop's story automatically when the visitor walks into its radius.
  useEffect(() => {
    if (!geo) return;
    const id = navigator.geolocation.watchPosition(
      (p) => { setGeoMsg(""); const at = { lat: p.coords.latitude, lng: p.coords.longitude }; setPos(at); onPos.current(at); },
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
    if (hit) { autoOpened.current.add(hit.id); setSelected(hit.id); setSheet(true); setWalkFrom(null); markVisited(hit.id); }
  }, [geo, pos, stops, markVisited]);

  // Pick a stop from the map-first flow: on mobile, drop back to the map so the walk to it is visible.
  function go(id: string | null) {
    setSelected(id);
    if (id) setSheet(false);
  }

  if (error) return <div className="p-8 text-center"><p className="mb-4">{error}</p><Link className="underline" href="/tours">Browse tours</Link></div>;
  if (!bundle) return <div className="p-8 text-center">Loading tour…</div>;

  const label = String(bundle.tokens.copy.stopLabel);
  // The walk from the open stop to the next one; drawn on top of the route while its step-by-step section is open.
  const stopIdx = stop ? stops.indexOf(stop) : -1;
  const leg = stopIdx >= 0 ? legPath(route?.path ?? [], stops.map((s) => [s.lat, s.lng] as [number, number]), stopIdx) : [];
  const walkIdx = walkFrom ? stops.findIndex((s) => s.id === walkFrom) : -1;
  const walkTo = mobile && walkIdx >= 0 ? stops[walkIdx + 1] : undefined;
  const walkLeg = walkTo ? legPath(route?.path ?? [], stops.map((s) => [s.lat, s.lng] as [number, number]), walkIdx) : [];
  const walkSteps = walkTo && route && directionsFresh(route) ? route.directions!.steps.filter((s) => s.leg === walkIdx) : [];
  const walkDist = walkSteps.length > 0 ? walkSteps.reduce((n, st) => n + st.distanceM, 0) : Math.max(10, Math.round(pathLengthM(walkLeg) / 10) * 10);
  const walkMin = Math.max(1, Math.ceil(walkDist / 80));
  const fmt = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
  const fact = bundle.facts.find((f) => f.id === factId);
  const factImg = fact?.imageUrl ? safeUrl(fact.imageUrl) : null;
  const hasFacts = bundle.facts.length > 0;
  const mapStops = stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, visited: visited.includes(s.id), icon: s.markerIcon, color: s.markerColor }));
  const center: [number, number] = stops[0] ? [stops[0].lat, stops[0].lng] : [bundle.tour.lat, bundle.tour.lng];

  return (
    <ThemeScope tokens={bundle.tokens} className="relative flex h-[calc(100dvh-3rem)] flex-col overflow-hidden md:flex-row">
      <NavTheme tokens={bundle.tokens} />
      <div ref={root} className="player-map absolute inset-0 z-0 md:relative md:inset-auto md:h-full md:flex-1">
        <TourMap tokens={bundle.tokens} center={center} stops={mapStops} selectedId={selected} routeIds={stops.map((s) => s.id)} path={route?.path} highlight={walkTo ? walkLeg : stop && stepsOpenFor === stop.id ? leg : undefined} user={pos} onSelect={(id) => { setSelected(id); setSheet(false); }} fitKey={`${bundle.tour.id}:${routeId}`} bottomInset={inset} />
        <header className="t-card absolute inset-x-3 top-3 z-[500] flex items-center gap-2 p-2">
          <Link href={`/tour/${slug}`} className="t-btn-ghost t-icon" aria-label="Back to tour overview"><ChevronIcon dir="left" /></Link>
          <div className="min-w-0 flex-1 text-center">
            <span className="t-heading block truncate text-lg leading-tight">{bundle.tour.title}</span>
            <span className="t-muted t-label t-label-c block text-xs">{stop ? `${label} ${stopIdx + 1} of ${stops.length}` : `${visited.length} of ${bundle.stops.length} visited`}</span>
          </div>
          <button className="t-btn-ghost t-icon" aria-pressed={geo} aria-label={geo ? "Location on" : "Use my location"} title={geo ? "Location on" : "Use my location"} onClick={toggleGeo}><LocateIcon on={geo} /></button>
        </header>
        {geoMsg && <div className="t-card absolute inset-x-3 top-[4.75rem] z-[500] px-3 py-1 text-center text-sm">{geoMsg}</div>}
        {mobile && !sheet && walkTo && walkSteps[0] && (
          <div className="t-card absolute inset-x-3 top-[4.75rem] z-[400] flex items-center gap-3 p-3" role="status">
            <span className="t-num" data-state="now" aria-hidden>→</span>
            <span className="min-w-0 flex-1">
              <span className="t-label t-accent block text-xs font-semibold">{walkSteps[0].distanceM > 0 ? `In ${fmt(walkSteps[0].distanceM)}` : "Next"}</span>
              <span className="block text-base font-semibold leading-snug">{walkSteps[0].text}</span>
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1100] flex flex-col items-start gap-2 md:bottom-6 md:left-4 md:right-auto md:w-[24rem]" hidden={mobile && sheet}>
          {fact ? (
            <div
              className={`t-card pointer-events-auto flex w-full touch-pan-y flex-col overflow-hidden p-3 ${factWide ? "max-h-[80dvh]" : "max-h-[45dvh]"}`}
              style={{ animation: "sheet-in .2s ease-out" }} role="note" aria-label="Fun fact"
              onPointerDown={(e) => { swipeX.current = e.clientX; }}
              onPointerUp={(e) => { const x = swipeX.current; swipeX.current = null; if (x !== null && Math.abs(e.clientX - x) > 50) stepFact(e.clientX < x ? 1 : -1); }}
              onPointerCancel={() => { swipeX.current = null; }}
            >
              <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
                <span className="t-chip t-chip-icon">Did you know?</span>
                <button className="t-btn-ghost t-icon" aria-label="Close fact" onClick={() => { setFactId(null); setFactWide(false); }}><CloseIcon /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {factImg && <ZoomImage src={factImg} alt="" className="mb-2 max-h-48 w-full object-cover" style={{ borderRadius: "var(--t-radius)" }} />}
                <div className="space-y-2 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"><Markdown>{fact.text}</Markdown></div>
              </div>
              <div className="mt-3 flex shrink-0 items-center justify-between gap-2">
                {deck.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <button className="t-btn-ghost t-icon" aria-label="Previous fact" onClick={() => stepFact(-1)}><ChevronIcon dir="left" /></button>
                    <span className="t-muted t-heading text-sm" aria-live="polite">{deck.indexOf(fact.id) + 1} / {deck.length}</span>
                    <button className="t-btn-ghost t-icon" aria-label="Next fact" onClick={() => stepFact(1)}><ChevronIcon dir="right" /></button>
                  </div>
                ) : <span />}
                <button className="t-btn-ghost t-btn-sm" aria-expanded={factWide} onClick={() => setFactWide((v) => !v)}>{factWide ? "Collapse ▾" : "Expand ▴"}</button>
              </div>
            </div>
          ) : hasFacts && (
            <button className="t-btn t-btn-sm pointer-events-auto gap-2 shadow-lg" onClick={() => openFact()}>Did you know?</button>
          )}
        {mobile && !sheet && walkTo && (
          <div className="t-card pointer-events-auto flex max-h-[44dvh] w-full flex-col gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" style={{ animation: "sheet-in .2s ease-out" }}>
            <div className="text-center">
              <span className="t-muted t-label t-label-c block text-xs">Walking to {label.toLowerCase()} {walkIdx + 2} of {stops.length}</span>
              <span className="t-heading block truncate text-2xl leading-tight">{walkTo.title}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-center" aria-label="Walk summary">
              <div><span className="t-stat block">{fmt(walkDist)}</span><span className="t-muted t-label t-label-c block text-[0.65rem]">Distance</span></div>
              <span className="t-stat-sep" aria-hidden />
              <div><span className="t-stat block">{walkMin} min</span><span className="t-muted t-label t-label-c block text-[0.65rem]">On foot</span></div>
              <span className="t-stat-sep" aria-hidden />
              <div><span className="t-stat block">{walkAt ? new Date(walkAt + walkMin * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</span><span className="t-muted t-label t-label-c block text-[0.65rem]">Arrive</span></div>
            </div>
            <details className="text-sm">
              <summary className="t-label t-label-c cursor-pointer text-center text-xs font-semibold">{walkSteps.length > 0 ? `All ${walkSteps.length} steps` : "Directions"}</summary>
              <ol className="mt-2 max-h-[18dvh] list-decimal space-y-1 overflow-y-auto overscroll-contain pl-5">
                {walkSteps.length > 0
                  ? walkSteps.map((s, i) => <li key={i}>{s.text}{s.distanceM > 0 && <span className="t-muted"> ({fmt(s.distanceM)})</span>}</li>)
                  : <li>Follow the highlighted line to {walkTo.title}</li>}
              </ol>
            </details>
            <div className="flex gap-2">
              <button className="t-btn-ghost t-icon" aria-label="Stop walking" onClick={() => setWalkFrom(null)}><CloseIcon /></button>
              <button className="t-btn t-btn-lg flex-1" onClick={() => { markVisited(walkTo.id); setWalkFrom(null); setSelected(walkTo.id); setSheet(true); }}>I’m there</button>
            </div>
          </div>
        )}

        {mobile && !sheet && !walkTo && (
          <div className="t-card pointer-events-auto flex w-full items-center gap-2 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" style={{ animation: "sheet-in .2s ease-out" }}>
            <button className="t-btn-ghost t-icon" aria-label="Previous stop" disabled={stopIdx <= 0} onClick={() => go(stops[stopIdx - 1].id)}><ChevronIcon dir="left" /></button>
            <button className="min-w-0 flex-1 overflow-hidden text-center" onClick={() => setSheet(true)} aria-label="Open details">
              <span className="t-muted t-label t-label-c block whitespace-nowrap text-[0.65rem]">{stop ? `${label} ${stopIdx + 1} of ${stops.length}` : next ? `Up next · ${visited.length}/${bundle.stops.length}` : "Tour complete"}</span>
              <span className="t-heading line-clamp-2 block text-base leading-tight">{(stop ?? next)?.title ?? bundle.tour.title}</span>
            </button>
            <button className="t-btn-ghost t-icon" aria-label="Next stop" disabled={!stop ? !next : stopIdx >= stops.length - 1} onClick={() => go(stop ? stops[stopIdx + 1].id : next!.id)}><ChevronIcon dir="right" /></button>
            <button className="t-btn t-btn-sm" onClick={() => setSheet(true)}>{stop ? "Details" : "Stops"}</button>
          </div>
        )}
        </div>
      </div>

      <aside
        className={`t-sheet z-[700] overflow-y-auto overscroll-contain bg-[var(--t-background)] p-4 pt-0 transition-transform duration-300 ease-out max-md:absolute max-md:inset-x-0 max-md:bottom-0 ${stop ? "max-md:h-full" : "max-md:h-[62%] max-md:rounded-t-2xl"} max-md:pb-[calc(1rem+env(safe-area-inset-bottom))] max-md:shadow-[0_-8px_24px_rgba(0,0,0,.25)] md:h-full md:w-[26rem] md:pt-4 md:!translate-y-0`}
        style={{ transform: mobile && !sheet ? "translateY(105%)" : undefined, visibility: mobile && !sheet ? "hidden" : undefined, transitionProperty: "transform, visibility" }}
        aria-live="polite"
        aria-hidden={mobile && !sheet}
      >
        {mobile && (
          <div
            className="sticky top-0 z-10 -mx-4 mb-2 flex touch-none items-center justify-between bg-[var(--t-background)] px-4 pb-2 pt-2"
            onPointerDown={(e) => { drag.current = e.clientY; }}
            onPointerUp={(e) => { if (drag.current !== null && e.clientY - drag.current > 50) setSheet(false); drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            <span className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-current opacity-30" aria-hidden />
            <button className="t-btn-ghost t-btn-sm mt-3 inline-flex items-center gap-1.5" aria-label="Map" onClick={() => setSheet(false)}><span aria-hidden className="inline-flex"><CompassLogo size={18} /></span> Map ▾</button>
            {stop && <span className="t-muted t-label mt-3 text-[0.65rem]">{label} {stops.indexOf(stop) + 1} of {stops.length}</span>}
          </div>
        )}
        {offline && <p className="t-chip mb-2 inline-block">Offline copy</p>}
        {!stop ? (
          <>
            <Link href={`/tour/${slug}`} className="text-sm">← Overview</Link>
            <h1 className="mb-1 mt-1 text-2xl">{bundle.tour.title}</h1>
            <Flourish className="t-orn-title mb-2" />
            <p className="t-muted t-label mb-3 text-sm">{visited.length} of {bundle.stops.length} visited</p>
            {bundle.routes.length > 0 && (
              <label className="mb-3 block text-sm">Route
                <select className="t-card mt-1 block w-full p-2" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                  <option value="all">All stops</option>
                  {bundle.routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            )}
            {route?.description && <p className="t-muted mb-3 text-sm">{route.description}</p>}
            {next && <button className="t-btn mb-3 w-full" onClick={() => go(next.id)}>Next: {next.title}</button>}
            <ol className="space-y-2">
              {stops.map((s, i) => (
                <li key={s.id}>
                  <button className="t-card flex w-full items-center gap-3 p-3 text-left" onClick={() => go(s.id)}>
                    <span className="t-num" data-state={visited.includes(s.id) ? "done" : s.id === next?.id ? "now" : "todo"}>{i + 1}</span>
                    <span className="flex-1">{s.title}</span>
                    {visited.includes(s.id) && <span aria-label="Visited">✓</span>}
                  </button>
                </li>
              ))}
            </ol>
            {hasFacts && (
              <details className="t-card mt-4 p-3">
                <summary className="cursor-pointer font-semibold">💡 View all facts ({bundle.facts.length})</summary>
                <ul className="mt-3">
                  {bundle.facts.map((f, i) => {
                    const img = f.imageUrl ? safeUrl(f.imageUrl) : null;
                    return (
                      <li key={f.id} className={i > 0 ? "mt-3" : ""}>
                        {i > 0 && <Flourish className="mb-3" />}
                        {img && <ZoomImage src={img} alt="" className="mb-2 max-h-48 w-full object-cover" style={{ borderRadius: "var(--t-radius)" }} />}
                        <div className="space-y-2 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"><Markdown>{f.text}</Markdown></div>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </>
        ) : (
          <article>
            <button className="t-btn-ghost mb-3" onClick={() => setSelected(null)}>← All {label.toLowerCase()}s</button>
            <div className="t-stop-head">
              {!mobile && <p className="t-muted t-label t-label-c text-sm">{label} {stops.indexOf(stop) + 1} of {stops.length}</p>}
              <h2 className="t-stop-title mb-2">{stop.title}</h2>
              <Flourish className="t-orn-title mb-3" />
              <StopImages sources={stop.sources} />
              <TagChips tags={stop.tags} />
            </div>
            <StopStory story={stop.story} />
            <SourcesPanel sources={stop.sources} />
            {route && directionsFresh(route) && stops[stopIdx + 1] && (() => {
              const next = stops[stopIdx + 1];
              const steps = route.directions!.steps.filter((s) => s.leg === stopIdx);
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="t-btn-ghost flex-1 whitespace-nowrap" onClick={() => markVisited(stop.id)} disabled={visited.includes(stop.id)}>{visited.includes(stop.id) ? "✓ Visited" : "Mark visited"}</button>
              {stops[stops.indexOf(stop) + 1] && <button className="t-btn flex-1 whitespace-nowrap" onClick={() => { markVisited(stop.id); const nx = stops[stops.indexOf(stop) + 1]; if (mobile && stepsOpenFor === stop.id) { setWalkFrom(stop.id); setWalkAt(Date.now()); setStepsOpenFor(null); } go(nx.id); }}>Next {label.toLowerCase()} →</button>}
            </div>
          </article>
        )}
      </aside>
    </ThemeScope>
  );
}
