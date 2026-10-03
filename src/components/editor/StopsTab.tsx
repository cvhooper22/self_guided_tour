"use client";
import { useMemo, useState } from "react";
import { TourMap } from "../MapLazy";
import { resolveTokens } from "@/lib/themes";
import type { TourDoc } from "@/lib/tours-repo";
import { input } from "./styles";
import MarkerPicker from "./MarkerPicker";
import TagsField from "./TagsField";
import type { ThemeRow } from "./ThemeTab";

type Props = { doc: TourDoc; setDoc: (fn: (d: TourDoc) => TourDoc) => void; themes: ThemeRow[]; markerImages: string[] };
const KINDS = ["link", "image", "document", "audio", "video"] as const;

export default function StopsTab({ doc, setDoc, themes, markerImages }: Props) {
  const [sel, setSel] = useState<string | null>(doc.stops[0]?.id ?? null);
  const [placing, setPlacing] = useState(false);
  const tokens = useMemo(() => resolveTokens(themes.find((t) => t.id === doc.tour.themeId)?.tokens, doc.tour.themeOverrides), [themes, doc.tour]);
  const stop = doc.stops.find((s) => s.id === sel);
  const patch = (id: string, p: Partial<TourDoc["stops"][number]>) => setDoc((d) => ({ ...d, stops: d.stops.map((s) => (s.id === id ? { ...s, ...p } : s)) }));

  function addAt(lat: number, lng: number) {
    const id = crypto.randomUUID();
    setDoc((d) => ({ ...d, stops: [...d.stops, { id, title: `Stop ${d.stops.length + 1}`, lat, lng, radiusM: 40, story: "", tags: [], markerIcon: "", markerColor: "", sources: [] }] }));
    setSel(id); setPlacing(false);
  }
  function move(i: number, dir: -1 | 1) {
    setDoc((d) => { const a = [...d.stops]; const j = i + dir; if (j < 0 || j >= a.length) return d; [a[i], a[j]] = [a[j], a[i]]; return { ...d, stops: a }; });
  }
  function remove(id: string) {
    if (!confirm("Delete this stop?")) return;
    setDoc((d) => ({ ...d, stops: d.stops.filter((s) => s.id !== id), routes: d.routes.map((r) => ({ ...r, stopIds: r.stopIds.filter((x) => x !== id) })) }));
    setSel(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <div>
        <div className="mb-2 flex items-center gap-3 text-sm">
          <button className={`rounded px-3 py-1.5 ${placing ? "bg-amber-400 text-black" : "bg-black text-white dark:bg-white dark:text-black"}`} onClick={() => setPlacing((v) => !v)}>{placing ? "Click the map to place…" : "+ Add stop on map"}</button>
          <span className="text-neutral-500">Drag a marker to move it.</span>
        </div>
        <div className={`h-[28rem] overflow-hidden rounded border ${placing ? "cursor-crosshair" : ""}`}>
          <TourMap tokens={tokens} center={[doc.stops[0]?.lat ?? doc.tour.lat, doc.stops[0]?.lng ?? doc.tour.lng]} stops={doc.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, icon: s.markerIcon, color: s.markerColor }))} selectedId={sel} routeIds={doc.stops.map((s) => s.id)} onSelect={setSel} onMapClick={placing ? addAt : undefined} onMarkerDrag={(id, lat, lng) => patch(id, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) })} fitKey="stops" />
        </div>
        <ol className="mt-3 space-y-1">
          {doc.stops.map((s, i) => (
            <li key={s.id} className={`flex items-center gap-2 rounded border p-2 ${s.id === sel ? "border-black bg-black/5 dark:border-white" : ""}`}>
              <button className="flex-1 text-left" onClick={() => setSel(s.id)}>{i + 1}. {s.title}</button>
              <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button aria-label="Move down" disabled={i === doc.stops.length - 1} onClick={() => move(i, 1)}>↓</button>
            </li>
          ))}
          {doc.stops.length === 0 && <li className="text-sm text-neutral-500">No stops yet. Use “Add stop on map”.</li>}
        </ol>
      </div>

      <div>
        {!stop ? <p className="text-sm text-neutral-500">Select a stop to edit it.</p> : (
          <div className="grid gap-3">
            <label>Title<input className={input} value={stop.title} onChange={(e) => patch(stop.id, { title: e.target.value })} /></label>
            <label>Story (markdown)<textarea className={`${input} font-mono text-sm`} rows={8} value={stop.story} onChange={(e) => patch(stop.id, { story: e.target.value })} /></label>
            <TagsField tags={stop.tags} onChange={(tags) => patch(stop.id, { tags })} />
            <div>
              <span className="mb-1 block">Map marker</span>
              <MarkerPicker value={stop.markerIcon} onChange={(markerIcon) => patch(stop.id, { markerIcon })} images={markerImages} emptyLabel="Tour default" color={{ value: stop.markerColor, onChange: (markerColor) => patch(stop.id, { markerColor }), fallback: String(tokens.colors.marker) }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label>Lat<input type="number" step="any" className={input} value={stop.lat} onChange={(e) => patch(stop.id, { lat: Number(e.target.value) })} /></label>
              <label>Lng<input type="number" step="any" className={input} value={stop.lng} onChange={(e) => patch(stop.id, { lng: Number(e.target.value) })} /></label>
              <label>Radius (m)<input type="number" className={input} value={stop.radiusM} onChange={(e) => patch(stop.id, { radiusM: Math.max(5, Math.min(1000, Number(e.target.value) || 40)) })} /></label>
            </div>
            <h3 className="mt-2 font-semibold">Sources &amp; extras</h3>
            {stop.sources.map((x, i) => {
              const upd = (p: Partial<typeof x>) => patch(stop.id, { sources: stop.sources.map((y, j) => (j === i ? { ...y, ...p } : y)) });
              return (
                <div key={x.id} className="grid gap-2 rounded border p-2">
                  <div className="flex gap-2">
                    <select className={input} value={x.kind} onChange={(e) => upd({ kind: e.target.value as typeof x.kind })} aria-label="Kind">{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
                    <button aria-label="Remove source" onClick={() => patch(stop.id, { sources: stop.sources.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                  <input className={input} placeholder="Title" value={x.title} onChange={(e) => upd({ title: e.target.value })} />
                  <input className={input} placeholder="https://… link to primary source" value={x.url} onChange={(e) => upd({ url: e.target.value })} />
                  <input className={input} placeholder="Short description (optional)" value={x.description} onChange={(e) => upd({ description: e.target.value })} />
                </div>
              );
            })}
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1.5" onClick={() => patch(stop.id, { sources: [...stop.sources, { id: crypto.randomUUID(), kind: "link", title: "", url: "", description: "" }] })}>+ Add link</button>
              <button className="rounded border px-3 py-1.5 opacity-50" disabled title="Uploads are coming soon">Upload file (soon)</button>
            </div>
            <button className="mt-2 self-start text-sm text-red-700 underline" onClick={() => remove(stop.id)}>Delete stop</button>
          </div>
        )}
      </div>
    </div>
  );
}
