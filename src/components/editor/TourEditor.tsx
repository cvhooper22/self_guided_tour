"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TourDoc } from "@/lib/tours-repo";
import { slugify } from "@/lib/slug";
import StopsTab from "./StopsTab";
import RoutesTab from "./RoutesTab";
import ThemeTab, { type ThemeRow } from "./ThemeTab";

type Tab = "details" | "stops" | "routes" | "theme" | "publish";
const TABS: [Tab, string][] = [["details", "Details"], ["stops", "Stops & sources"], ["routes", "Routes"], ["theme", "Theme"], ["publish", "Publish"]];
import { input } from "./styles";

type Props = { tourId: string; initialDoc: TourDoc; status: "draft" | "published"; deleted: boolean; themes: ThemeRow[]; meId: string; isAdmin: boolean };

export default function TourEditor(p: Props) {
  const r = useRouter();
  const [doc, setDocRaw] = useState(p.initialDoc);
  const [themes, setThemes] = useState(p.themes);
  const [tab, setTab] = useState<Tab>("details");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [status, setStatus] = useState(p.status);
  const [saving, setSaving] = useState(false);

  const setDoc = (fn: (d: TourDoc) => TourDoc) => { setDocRaw(fn); setDirty(true); setMsg(null); };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(): Promise<boolean> {
    setSaving(true);
    const res = await fetch(`/api/operator/tours/${p.tourId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(doc) });
    setSaving(false);
    if (res.ok) { setDirty(false); setMsg({ ok: true, text: "Saved" }); return true; }
    const e = await res.json().catch(() => ({}));
    setMsg({ ok: false, text: e.error === "Invalid input" ? "Some fields are invalid (check titles, slug, URLs)" : (e.error ?? "Save failed") });
    return false;
  }

  async function setPublished(next: "draft" | "published") {
    if (dirty && !(await save())) return;
    const res = await fetch(`/api/operator/tours/${p.tourId}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (res.ok) setStatus(next); else setMsg({ ok: false, text: (await res.json()).error });
  }

  const t = doc.tour;
  const setTour = (patch: Partial<TourDoc["tour"]>) => setDoc((d) => ({ ...d, tour: { ...d.tour, ...patch } }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/operator" className="text-sm underline">← Tours</Link>
        <h1 className="flex-1 text-xl font-bold">{t.title}</h1>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-800">{p.deleted ? "deleted" : status}</span>
        {msg && <span role="status" className={msg.ok ? "text-green-700" : "text-red-600"}>{msg.text}</span>}
        <button onClick={save} disabled={!dirty || saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black">{saving ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
      </div>
      <nav className="mb-5 flex gap-1 border-b" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm ${tab === k ? "border-b-2 border-black font-semibold dark:border-white" : "text-neutral-500"}`}>{l}</button>)}
      </nav>

      {tab === "details" && (
        <div className="grid max-w-2xl gap-3">
          <label>Title<input className={input} value={t.title} onChange={(e) => setTour({ title: e.target.value })} /></label>
          <label>URL slug<input className={input} value={t.slug} onChange={(e) => setTour({ slug: slugify(e.target.value) })} /><span className="text-xs text-neutral-500">/tour/{t.slug}</span></label>
          <label>Summary<textarea className={input} rows={2} value={t.summary} onChange={(e) => setTour({ summary: e.target.value })} /></label>
          <label>Story (markdown)<textarea className={`${input} font-mono text-sm`} rows={8} value={t.story} onChange={(e) => setTour({ story: e.target.value })} /></label>
          <label>City / area<input className={input} value={t.city} onChange={(e) => setTour({ city: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label>Latitude<input type="number" step="any" className={input} value={t.lat} onChange={(e) => setTour({ lat: Number(e.target.value) })} /></label>
            <label>Longitude<input type="number" step="any" className={input} value={t.lng} onChange={(e) => setTour({ lng: Number(e.target.value) })} /></label>
          </div>
          <label>Cover image URL<input className={input} value={t.coverUrl ?? ""} placeholder="https://… (uploads coming soon)" onChange={(e) => setTour({ coverUrl: e.target.value || null })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={t.isFree} onChange={(e) => setTour({ isFree: e.target.checked })} /> Free tour</label>
        </div>
      )}
      {tab === "stops" && <StopsTab doc={doc} setDoc={setDoc} themes={themes} />}
      {tab === "routes" && <RoutesTab doc={doc} setDoc={setDoc} />}
      {tab === "theme" && <ThemeTab doc={doc} setDoc={setDoc} themes={themes} setThemes={setThemes} meId={p.meId} isAdmin={p.isAdmin} />}
      {tab === "publish" && (
        <div className="max-w-xl space-y-4">
          <p>Status: <b>{status}</b>. Published tours appear in the marketplace and are readable by anyone with the link.</p>
          {doc.stops.length === 0 && <p className="text-amber-700">Add at least one stop before publishing.</p>}
          {status === "draft"
            ? <button disabled={doc.stops.length === 0} onClick={() => setPublished("published")} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-40">Publish tour</button>
            : <button onClick={() => setPublished("draft")} className="rounded border px-4 py-2">Unpublish</button>}
          <div className="flex gap-4 text-sm"><Link className="underline" href={`/tour/${t.slug}`} target="_blank">Open overview ↗</Link><Link className="underline" href={`/play/${t.slug}`} target="_blank">Open player ↗</Link></div>
          <hr />
          <button className="text-sm text-red-700 underline" onClick={async () => {
            if (!confirm("Delete this tour? An admin can restore it.")) return;
            await fetch(`/api/operator/tours/${p.tourId}`, { method: "DELETE" });
            setDirty(false); r.push("/operator");
          }}>Delete tour</button>
        </div>
      )}
    </main>
  );
}
