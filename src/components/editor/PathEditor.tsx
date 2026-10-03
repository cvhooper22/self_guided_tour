"use client";
import { useState } from "react";
import { TourMap } from "../MapLazy";
import type { MapStop } from "../TourMap";
import { assignLegs, type RouteDirections } from "@/lib/directions";
import { pathLengthM, simplifyTo, type LatLngTuple } from "@/lib/geo";
import type { ThemeTokens } from "@/lib/themes";

const MAX_POINTS = 500;
const btn = "rounded border px-2 py-1 disabled:opacity-40";
const round = (n: number) => +n.toFixed(6);

type Props = {
  tokens: ThemeTokens;
  center: [number, number];
  stops: MapStop[];
  routeIds: string[];
  /** Stop coordinates in route order, used to seed or snap an empty path. */
  stopPoints: LatLngTuple[];
  /** Stop names in route order, for labelling the directions. */
  stopTitles: string[];
  path: LatLngTuple[];
  onChange: (path: LatLngTuple[]) => void;
  /** Fingerprint of the current path + stop order; directions are only valid while theirs matches. */
  sig: string;
  directions: RouteDirections | null;
  onDirections: (d: RouteDirections | null) => void;
  fitKey: string;
};

/**
 * Edit a route's walking line. Select one vertex (or two to select the span between them),
 * then redraw, straighten, cut or snap that part, with undo/redo for everything.
 */
export default function PathEditor({ tokens, center, stops, routeIds, stopPoints, stopTitles, path, onChange, sig, directions, onDirections, fitKey }: Props) {
  const [sel, setSel] = useState<number[]>([]);
  // Where the next map click inserts a point; null = not drawing.
  const [at, setAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hist, setHist] = useState<{ past: LatLngTuple[][]; future: LatLngTuple[][] }>({ past: [], future: [] });

  const [a, b] = sel.length === 2 ? [Math.min(...sel), Math.max(...sel)] : [sel[0] ?? -1, -1];
  const hasSpan = sel.length === 2;

  function commit(next: LatLngTuple[], keepSel = false) {
    setHist((h) => ({ past: [...h.past.slice(-49), path], future: [] }));
    onChange(next);
    if (!keepSel) setSel([]);
    setMsg("");
  }
  function undo() {
    const prev = hist.past.at(-1);
    if (!prev) return;
    setHist({ past: hist.past.slice(0, -1), future: [...hist.future, path] });
    onChange(prev); setSel([]); setAt(null);
  }
  function redo() {
    const nxt = hist.future.at(-1);
    if (!nxt) return;
    setHist({ past: [...hist.past, path], future: hist.future.slice(0, -1) });
    onChange(nxt); setSel([]); setAt(null);
  }

  function clickVertex(i: number) {
    if (at !== null) return;
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : s.length < 2 ? [...s, i] : [i]));
  }
  function mapClick(lat: number, lng: number) {
    if (at === null) return;
    const pt: LatLngTuple = [round(lat), round(lng)];
    if (path.length >= MAX_POINTS) return setMsg(`A route can have at most ${MAX_POINTS} points. Snap to streets to thin it out.`);
    const i = Math.min(at, path.length);
    commit([...path.slice(0, i), pt, ...path.slice(i)]);
    setAt(i + 1);
  }

  async function snap(from: number, to: number, pts: LatLngTuple[]) {
    const room = MAX_POINTS - (path.length - (to - from + 1));
    if (room < 10) return setMsg("This route is too full to add detail. Remove some points elsewhere first.");
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/operator/route-snap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ points: pts, maxPoints: room }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(body.error ?? "Could not snap to streets");
      const snapped = body.path as LatLngTuple[];
      commit(path.length ? [...path.slice(0, from), ...snapped, ...path.slice(to + 1)] : snapped);
      setMsg(`Snapped to streets (${snapped.length} points, about ${Math.round(pathLengthM(snapped))} m).`);
    } catch {
      setMsg("Could not reach the routing service.");
    } finally { setBusy(false); }
  }
  const snapTarget = (): [number, number, LatLngTuple[]] | null => {
    if (hasSpan) return [a, b, path.slice(a, b + 1)];
    if (path.length > 1) return [0, path.length - 1, path];
    return stopPoints.length > 1 ? [0, -1, stopPoints] : null;
  };
  const target = snapTarget();

  async function generateDirections() {
    const base = path.length > 1 ? path : stopPoints;
    if (base.length < 2) return;
    setBusy(true); setMsg("");
    try {
      // The routing service takes at most ~200 waypoints; thinning keeps the walk on the same streets.
      const res = await fetch("/api/operator/route-snap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ points: simplifyTo(base, 100, 3), maxPoints: 2, steps: true }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(body.error ?? "Could not get directions");
      onDirections({ sig, steps: assignLegs(body.steps ?? [], base, stopPoints) });
      setMsg("Directions generated.");
    } catch {
      setMsg("Could not reach the routing service.");
    } finally { setBusy(false); }
  }
  const fresh = !!directions && directions.sig === sig;
  const legs = directions ? [...new Set(directions.steps.map((s) => s.leg))].sort((x, y) => x - y) : [];

  const status = at !== null
    ? `Drawing: click the map to add points${at < path.length ? ` (they go in after point ${at}, before point ${at + 1})` : " at the end of the route"}.`
    : hasSpan ? `Points ${a + 1} → ${b + 1} selected (${b - a - 1} in between).`
    : sel.length === 1 ? `Point ${a + 1} selected. Click a second point to select the part between.`
    : "Click a point to select it, or click two points to select the part between them.";

  return (
    <div className="grid gap-2">
      <p className="text-sm text-neutral-500" aria-live="polite">{at !== null ? "✏️ " : ""}{status}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Path tools">
        <button className={btn} disabled={!hist.past.length} onClick={undo}>↶ Undo</button>
        <button className={btn} disabled={!hist.future.length} onClick={redo}>↷ Redo</button>
        <span className="mx-1 h-5 border-l" />
        {at !== null
          ? <button className="rounded bg-amber-400 px-2 py-1 text-black" onClick={() => { setAt(null); setSel([]); }}>Done drawing</button>
          : <button className={btn} onClick={() => { setSel([]); setAt(path.length); }}>＋ Add points at end</button>}
        {at === null && sel.length === 1 && <>
          <button className={btn} onClick={() => setAt(a + 1)}>Add points after #{a + 1}</button>
          <button className={btn} disabled={a === 0 && path.length === 1} onClick={() => commit(path.filter((_, i) => i !== a))}>Remove #{a + 1}</button>
          <button className={btn} disabled={a === path.length - 1} onClick={() => commit(path.slice(0, a + 1))}>Cut everything after #{a + 1}</button>
          <button className={btn} disabled={a === 0} onClick={() => commit(path.slice(a))}>Cut everything before #{a + 1}</button>
        </>}
        {at === null && hasSpan && <>
          <button className="rounded bg-black px-2 py-1 text-white disabled:opacity-40 dark:bg-white dark:text-black" onClick={() => { commit([...path.slice(0, a + 1), ...path.slice(b)]); setAt(a + 1); }}>Redraw between #{a + 1} and #{b + 1}</button>
          <button className={btn} disabled={b - a < 2} onClick={() => commit([...path.slice(0, a + 1), ...path.slice(b)])}>Straighten</button>
          <button className={btn} onClick={() => commit([...path.slice(0, a), ...path.slice(a, b + 1).reverse(), ...path.slice(b + 1)])}>Reverse part</button>
        </>}
        {at === null && target && (
          <button className={btn} disabled={busy} onClick={() => snap(target[0], target[1], target[2])}>
            {busy ? "Snapping…" : hasSpan ? "Snap part to streets" : path.length > 1 ? "Snap whole route to streets" : "Route stops along streets"}
          </button>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500">More</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {path.length === 0 && stopPoints.length > 1 && <button className={btn} onClick={() => commit(stopPoints)}>Start from stops (straight lines)</button>}
          <button className={btn} disabled={path.length < 3} onClick={() => commit([...path, path[0]])}>Close loop</button>
          <button className={btn} disabled={path.length < 2} onClick={() => commit([...path].reverse())}>Reverse whole route</button>
          <button className={btn} disabled={!path.length} onClick={() => confirm("Clear the whole path?") && commit([])}>Clear path</button>
        </div>
      </details>
      {msg && <p className="text-sm text-amber-700 dark:text-amber-400" aria-live="polite">{msg}</p>}
      <div className={`h-[26rem] overflow-hidden rounded border ${at !== null ? "cursor-crosshair" : ""}`}>
        <TourMap
          tokens={tokens} center={center} stops={stops} routeIds={routeIds} path={path}
          selection={sel} onVertexClick={clickVertex}
          onPathChange={(p) => commit(p, true)}
          onMapClick={at !== null ? mapClick : undefined}
          fitKey={fitKey}
        />
      </div>
      <section className="grid gap-2 rounded border p-3 text-sm" aria-label="Walking directions">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold">Step-by-step directions</h4>
          {directions && <span className={`rounded px-2 py-0.5 text-xs ${fresh ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>{fresh ? "Up to date" : "Out of date: path or stop order changed"}</span>}
          <button className={btn} disabled={busy || (path.length < 2 && stopPoints.length < 2)} onClick={generateDirections}>{busy ? "Working…" : directions ? "Regenerate directions" : "Generate directions"}</button>
          {directions && <button className={btn} onClick={() => onDirections(null)}>Remove</button>}
        </div>
        {!directions && <p className="text-neutral-500">Creates text turn-by-turn steps for travelers, following the streets between your stops. Travelers only see them while they&apos;re up to date.</p>}
        {directions && !fresh && <p className="text-neutral-500">Travelers don&apos;t see these until you regenerate them.</p>}
        {legs.map((k) => (
          <div key={k}>
            <p className="font-medium">{stopTitles[k] ?? `Stop ${k + 1}`} → {stopTitles[k + 1] ?? `Stop ${k + 2}`}</p>
            <ol className="ml-5 list-decimal text-neutral-600 dark:text-neutral-300">
              {directions!.steps.filter((s) => s.leg === k).map((s, i) => <li key={i}>{s.text}{s.distanceM > 0 ? ` (${s.distanceM} m)` : ""}</li>)}
            </ol>
          </div>
        ))}
      </section>
      <p className="text-xs text-neutral-500">{path.length} points{path.length > 1 ? `, about ${Math.round(pathLengthM(path))} m` : ""}. Drag points to move them; click the line to add a point in the middle. Green is the start, red is the end.</p>
    </div>
  );
}
