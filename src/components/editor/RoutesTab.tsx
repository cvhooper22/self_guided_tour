"use client";
import type { TourDoc } from "@/lib/tours-repo";
import { input } from "./styles";

type Props = { doc: TourDoc; setDoc: (fn: (d: TourDoc) => TourDoc) => void };

export default function RoutesTab({ doc, setDoc }: Props) {
  const upd = (id: string, p: Partial<TourDoc["routes"][number]>) => setDoc((d) => ({ ...d, routes: d.routes.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const name = (id: string) => doc.stops.find((s) => s.id === id)?.title ?? "(deleted)";
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-neutral-500">Routes are suggested orderings of your stops. Travelers pick one in the player.</p>
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
          <select className={input} value="" onChange={(e) => e.target.value && upd(r.id, { stopIds: [...r.stopIds, e.target.value] })} aria-label="Add stop to route">
            <option value="">+ Add stop to route…</option>
            {doc.stops.filter((s) => !r.stopIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      ))}
      <button className="rounded border px-3 py-1.5" onClick={() => setDoc((d) => ({ ...d, routes: [...d.routes, { id: crypto.randomUUID(), name: `Route ${d.routes.length + 1}`, description: "", stopIds: d.stops.map((s) => s.id) }] }))}>+ Add route</button>
    </div>
  );
}
