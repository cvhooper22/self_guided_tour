"use client";
import { useMemo, useState } from "react";
import { TourMap } from "../MapLazy";
import { resolveTokens } from "@/lib/themes";
import type { TourDoc } from "@/lib/tours-repo";
import { input } from "./styles";
import AssetSelect from "./AssetSelect";
import SortableList from "../SortableList";
import type { ThemeRow } from "./ThemeTab";

type Props = { doc: TourDoc; setDoc: (fn: (d: TourDoc) => TourDoc) => void; themes: ThemeRow[]; assetFiles: string[] };
type Fact = TourDoc["facts"][number];

/** Fun facts for the in-between moments: tour-wide by default, optionally pinned to a spot or to the walk from a stop. */
export default function FactsTab({ doc, setDoc, themes, assetFiles }: Props) {
  const [sel, setSel] = useState<string | null>(doc.facts[0]?.id ?? null);
  const [pinning, setPinning] = useState(false);
  const [bump, setBump] = useState(0);
  const tokens = useMemo(() => resolveTokens(themes.find((t) => t.id === doc.tour.themeId)?.tokens, doc.tour.themeOverrides), [themes, doc.tour]);
  const fact = doc.facts.find((f) => f.id === sel);
  const patch = (id: string, p: Partial<Fact>) => setDoc((d) => ({ ...d, facts: d.facts.map((f) => (f.id === id ? { ...f, ...p } : f)) }));
  const pin = (id: string, lat: number, lng: number) => patch(id, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) });

  const mapStops = useMemo(() => {
    void bump; // a fresh array re-renders markers, snapping back a stop that was dragged by accident
    return [
      ...doc.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, icon: s.markerIcon, color: s.markerColor })),
      ...doc.facts.filter((f) => f.lat !== null && f.lng !== null).map((f) => ({ id: f.id, lat: f.lat!, lng: f.lng!, label: f.text.slice(0, 40), icon: "💡", color: "" })),
    ];
  }, [doc.stops, doc.facts, bump]);

  function add() {
    const id = crypto.randomUUID();
    setDoc((d) => ({ ...d, facts: [...d.facts, { id, text: "", imageUrl: "", lat: null, lng: null, radiusM: 60, nearStopId: null, inPool: false }] }));
    setSel(id);
  }
  const scope = (f: Fact) => (f.lat !== null ? "📍 pinned" : f.nearStopId ? "🚶 near a stop" : "🌐 tour-wide") + (f.inPool && (f.lat !== null || f.nearStopId) ? " + 🌐 swipeable" : "");

  return (
    <div className="grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
      <div className="min-w-0">
        <p className="mb-2 max-w-2xl text-sm text-neutral-500">
          Short asides travelers can pull up anywhere, like a guide talking on the walk between stops. Leave a fact unscoped for the tour-wide pool, pin it to a spot to surface it when travelers pass, or tie it to a stop to show it on the walk to or from there.
        </p>
        <div className="mb-2 flex items-center gap-3 text-sm">
          <button className="rounded bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black" onClick={add}>+ Add fact</button>
          <span className="text-neutral-500">{doc.facts.length} fact{doc.facts.length === 1 ? "" : "s"}</span>
        </div>
        <div className={`h-[22rem] overflow-hidden rounded border ${pinning ? "cursor-crosshair" : ""}`}>
          <TourMap tokens={tokens} center={[doc.stops[0]?.lat ?? doc.tour.lat, doc.stops[0]?.lng ?? doc.tour.lng]} stops={mapStops} selectedId={fact && fact.lat !== null ? fact.id : null}
            onSelect={(id) => { if (doc.facts.some((f) => f.id === id)) setSel(id); }}
            onMapClick={pinning && fact ? (lat, lng) => { pin(fact.id, lat, lng); setPinning(false); } : undefined}
            onMarkerDrag={(id, lat, lng) => { if (doc.facts.some((f) => f.id === id)) pin(id, lat, lng); else setBump((b) => b + 1); }}
            fitKey="facts" />
        </div>
        <SortableList
          label="fact" items={doc.facts} getId={(x) => x.id} onReorder={(facts) => setDoc((d) => ({ ...d, facts }))}
          itemClassName={(x) => `flex items-center gap-2 rounded border p-2 ${x.id === sel ? "border-black bg-black/5 dark:border-white" : ""}`}
          renderItem={(x, i, handle) => (
            <>
              {handle}
              <button className="min-w-0 flex-1 text-left" onClick={() => setSel(x.id)}>
                <span className="block truncate">{i + 1}. {x.text || <em className="text-neutral-500">Empty fact</em>}</span>
                <span className="text-xs text-neutral-500">{scope(x)}</span>
              </button>
            </>
          )}
          footer={doc.facts.length === 0 && <li className="text-sm text-neutral-500">No facts yet. Use “Add fact”.</li>}
        />
      </div>

      <div className="min-w-0 min-[900px]:sticky min-[900px]:top-4 min-[900px]:max-h-[calc(100vh-2rem)] min-[900px]:self-start min-[900px]:overflow-y-auto">
        {!fact ? <p className="text-sm text-neutral-500">Select a fact to edit it.</p> : (
          <div className="grid gap-3">
            <label>Fact (markdown)<textarea className={`${input} text-sm`} rows={6} maxLength={2000} value={fact.text} onChange={(e) => patch(fact.id, { text: e.target.value })} /></label>
            <label>Image URL (optional)<input className={input} value={fact.imageUrl} placeholder="https://…" onChange={(e) => patch(fact.id, { imageUrl: e.target.value })} /><AssetSelect files={assetFiles} kind="image" onPick={(imageUrl) => patch(fact.id, { imageUrl })} /></label>
            <label>Show while walking to or from
              <select className={input} value={fact.nearStopId ?? ""} onChange={(e) => patch(fact.id, { nearStopId: e.target.value || null })}>
                <option value="">Anywhere (tour-wide)</option>
                {doc.stops.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>)}
              </select>
            </label>
            {(fact.lat !== null || fact.nearStopId) ? (
              <label className="flex items-start gap-2 rounded border p-2">
                <input type="checkbox" className="mt-1" checked={fact.inPool} onChange={(e) => patch(fact.id, { inPool: e.target.checked })} />
                <span><span className="font-semibold">Also include in the tour-wide swipe-through</span><br /><span className="text-sm text-neutral-500">It still shows first in its own area; this keeps it available everywhere else too.</span></span>
              </label>
            ) : <span className="text-sm text-neutral-500">Tour-wide facts are always in the swipe-through.</span>}
            <div className="grid gap-2 rounded border p-2">
              <span className="font-semibold">Pin to a spot (optional)</span>
              {fact.lat === null ? <span className="text-sm text-neutral-500">Not pinned. It can show anywhere, or anywhere its stop applies.</span>
                : <span className="text-sm text-neutral-500">{fact.lat}, {fact.lng}. Drag the 💡 on the map to adjust.</span>}
              <div className="flex gap-2">
                <button className={`rounded px-3 py-1.5 ${pinning ? "bg-amber-400 text-black" : "border"}`} onClick={() => setPinning((v) => !v)}>{pinning ? "Click the map…" : fact.lat === null ? "Pin on map" : "Move pin"}</button>
                {fact.lat !== null && <button className="rounded border px-3 py-1.5" onClick={() => patch(fact.id, { lat: null, lng: null })}>Unpin</button>}
              </div>
              {fact.lat !== null && <label>Trigger radius (m)<input type="number" className={input} value={fact.radiusM} onChange={(e) => patch(fact.id, { radiusM: Math.max(10, Math.min(1000, Number(e.target.value) || 60)) })} /></label>}
            </div>
            <button className="mt-2 self-start text-sm text-red-700 underline" onClick={() => { if (!confirm("Delete this fact?")) return; setDoc((d) => ({ ...d, facts: d.facts.filter((f) => f.id !== fact.id) })); setSel(null); }}>Delete fact</button>
          </div>
        )}
      </div>
    </div>
  );
}
