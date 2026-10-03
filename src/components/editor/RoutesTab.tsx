"use client";
import { useMemo, useState } from "react";
import PathEditor from "./PathEditor";
import { resolveTokens } from "@/lib/themes";
import { routeSig } from "@/lib/directions";
import { currentLengthM, orderStops } from "@/lib/route-order";
import type { TourDoc } from "@/lib/tours-repo";
import { input } from "./styles";
import type { ThemeRow } from "./ThemeTab";

type Props = { doc: TourDoc; setDoc: (fn: (d: TourDoc) => TourDoc) => void; themes: ThemeRow[] };

export default function RoutesTab({ doc, setDoc, themes }: Props) {
  const [drawing, setDrawing] = useState<string | null>(null);
  const [keepFirst, setKeepFirst] = useState(true);
  const [loop, setLoop] = useState(false);
  const [orderMsg, setOrderMsg] = useState<{ id: string; text: string } | null>(null);
  const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
  function suggestOrder(r: TourDoc["routes"][number]) {
    const pts = r.stopIds.map((sid) => doc.stops.find((s) => s.id === sid)).filter((s): s is NonNullable<typeof s> => !!s);
    if (pts.length < 3) return setOrderMsg({ id: r.id, text: "Add at least three stops to suggest an order." });
    const before = currentLengthM(pts, loop);
    const { ids, lengthM } = orderStops(pts, { startId: keepFirst ? pts[0].id : undefined, loop });
    if (ids.every((x, i) => x === pts[i].id)) return setOrderMsg({ id: r.id, text: `Already the shortest order I can find (${km(before)}).` });
    if (r.path.length && !confirm("Reordering will clear this route's drawn path. Continue?")) return;
    upd(r.id, { stopIds: ids, path: [] });
    setOrderMsg({ id: r.id, text: `Straight-line walk ${km(before)} → ${km(lengthM)}. Draw or snap the path again to follow streets.` });
  }
  const tokens = useMemo(() => resolveTokens(themes.find((t) => t.id === doc.tour.themeId)?.tokens, doc.tour.themeOverrides), [themes, doc.tour]);
  const upd = (id: string, p: Partial<TourDoc["routes"][number]>) => setDoc((d) => ({ ...d, routes: d.routes.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const name = (id: string) => doc.stops.find((s) => s.id === id)?.title ?? "(deleted)";
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-neutral-500">Routes are suggested orderings of your stops. Travelers pick one in the player. Use “Suggest shortest order” for a first draft, then draw or snap the walking path.</p>
      {doc.routes.map((r) => (
        <div key={r.id} className="grid gap-2 rounded border p-3">
          <div className="flex gap-2">
            <input className={input} aria-label="Route name" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} />
            <button onClick={() => confirm("Delete route?") && setDoc((d) => ({ ...d, routes: d.routes.filter((x) => x.id !== r.id) }))}>✕</button>
          </div>
          <input className={input} aria-label="Route description" placeholder="Description" value={r.description} onChange={(e) => upd(r.id, { description: e.target.value })} />
          <ol className="space-y-1">
            {r.stopIds.map((sid, i) => (
              <li key={`${sid}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{i + 1}. {name(sid)}</span>
                <button aria-label="Up" disabled={i === 0} onClick={() => { const a = [...r.stopIds]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; upd(r.id, { stopIds: a }); }}>↑</button>
                <button aria-label="Down" disabled={i === r.stopIds.length - 1} onClick={() => { const a = [...r.stopIds]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; upd(r.id, { stopIds: a }); }}>↓</button>
                <button aria-label="Remove" onClick={() => upd(r.id, { stopIds: r.stopIds.filter((_, j) => j !== i) })}>✕</button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button className="rounded border px-3 py-1.5" onClick={() => suggestOrder(r)}>Suggest shortest order</button>
            <label className="flex items-center gap-1"><input type="checkbox" checked={keepFirst} onChange={(e) => setKeepFirst(e.target.checked)} /> Keep first stop first</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop back to start</label>
          </div>
          {orderMsg?.id === r.id && <p className="text-sm text-neutral-500" role="status">{orderMsg.text}</p>}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button className={`rounded px-3 py-1.5 ${drawing === r.id ? "bg-amber-400 text-black" : "border"}`} onClick={() => setDrawing(drawing === r.id ? null : r.id)}>{drawing === r.id ? "Close path editor" : r.path.length ? "Edit walking path" : "Draw walking path"}</button>
          </div>
          {drawing === r.id && (() => {
            const routeStops = r.stopIds.map((sid) => doc.stops.find((s) => s.id === sid)).filter((s): s is NonNullable<typeof s> => !!s);
            return (
              <PathEditor
                key={r.id} tokens={tokens} fitKey={`route-${r.id}`}
                center={[doc.stops[0]?.lat ?? doc.tour.lat, doc.stops[0]?.lng ?? doc.tour.lng]}
                stops={routeStops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title, icon: s.markerIcon, color: s.markerColor }))}
                routeIds={r.stopIds} stopPoints={routeStops.map((s) => [s.lat, s.lng] as [number, number])}
                stopTitles={routeStops.map((s) => s.title)}
                path={r.path} onChange={(path) => upd(r.id, { path })}
                sig={routeSig(r.path, r.stopIds)} directions={r.directions} onDirections={(directions) => upd(r.id, { directions })}
              />
            );
          })()}
          <select className={input} value="" onChange={(e) => e.target.value && upd(r.id, { stopIds: [...r.stopIds, e.target.value] })} aria-label="Add stop to route">
            <option value="">+ Add stop to route…</option>
            {doc.stops.filter((s) => !r.stopIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      ))}
      <button className="rounded border px-3 py-1.5" onClick={() => setDoc((d) => ({ ...d, routes: [...d.routes, { id: crypto.randomUUID(), name: `Route ${d.routes.length + 1}`, description: "", stopIds: d.stops.map((s) => s.id), path: [], directions: null }] }))}>+ Add route</button>
    </div>
  );
}
