"use client";
import { useMemo, useState } from "react";
import { ThemeScope } from "../ThemeScope";
import { TourMap } from "../MapLazy";
import { TOKEN_OPTIONS, TOKEN_SUGGESTIONS, deepMerge, isPlainObject, resolveTokens, setPath, themeTokensSchema, type PartialTokens } from "@/lib/themes";
import type { TourDoc } from "@/lib/tours-repo";
import { input } from "./styles";

export type ThemeRow = { id: string; name: string; isPreset: boolean; ownerId: string | null; tokens: PartialTokens };
type Props = { doc: TourDoc; setDoc: (fn: (d: TourDoc) => TourDoc) => void; themes: ThemeRow[]; setThemes: (t: ThemeRow[]) => void; meId: string; isAdmin: boolean };

const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function ThemeTab({ doc, setDoc, themes, setThemes, meId, isAdmin }: Props) {
  const [msg, setMsg] = useState("");
  const [raw, setRaw] = useState<string | null>(null);
  const base = themes.find((t) => t.id === doc.tour.themeId);
  const overrides = doc.tour.themeOverrides as PartialTokens;
  const tokens = useMemo(() => resolveTokens(base?.tokens, overrides), [base, overrides]);
  const hasOverrides = Object.keys(overrides).length > 0;
  const setOverrides = (o: PartialTokens) => setDoc((d) => ({ ...d, tour: { ...d.tour, themeOverrides: o } }));
  const setToken = (path: string[], v: unknown) => setOverrides(setPath(overrides, path, v));

  async function saveAsTheme(update: boolean) {
    const full = deepMerge(base?.tokens ?? {}, overrides);
    const name = update && base ? base.name : window.prompt("Name for your theme?", `${base?.name ?? "My"} (custom)`);
    if (!name) return;
    const res = update && base
      ? await fetch(`/api/operator/themes/${base.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, tokens: full }) })
      : await fetch("/api/operator/themes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, tokens: full }) });
    if (!res.ok) return setMsg((await res.json()).error ?? "Could not save theme");
    if (update && base) {
      setThemes(themes.map((t) => (t.id === base.id ? { ...t, tokens: full } : t)));
    } else {
      const t = await res.json();
      setThemes([...themes, { id: t.id, name, isPreset: false, ownerId: meId, tokens: full }]);
      setDoc((d) => ({ ...d, tour: { ...d.tour, themeId: t.id } }));
    }
    setOverrides({});
    setMsg("Theme saved");
  }

  const canUpdateBase = base && !base.isPreset && (base.ownerId === meId || isAdmin);

  function field(group: string, key: string, value: unknown) {
    const path = `${group}.${key}`, id = `tok-${path}`;
    const common = { id, "aria-label": label(key) };
    let control;
    if (TOKEN_OPTIONS[path]) control = <select {...common} className={input} value={String(value)} onChange={(e) => setToken([group, key], e.target.value)}>{TOKEN_OPTIONS[path].map((o) => <option key={o}>{o}</option>)}</select>;
    else if (group === "colors") control = <div className="flex gap-2"><input {...common} type="color" className="h-10 w-12" value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#000000"} onChange={(e) => setToken([group, key], e.target.value)} /><input className={input} aria-label={`${label(key)} hex`} value={String(value)} onChange={(e) => setToken([group, key], e.target.value)} /></div>;
    else if (typeof value === "number") control = <input {...common} type="number" step="any" className={input} value={value} onChange={(e) => setToken([group, key], Number(e.target.value))} />;
    else if (typeof value === "boolean") control = <input {...common} type="checkbox" checked={value} onChange={(e) => setToken([group, key], e.target.checked)} />;
    else control = <><input {...common} list={TOKEN_SUGGESTIONS[path] ? `${id}-list` : undefined} className={input} value={String(value ?? "")} onChange={(e) => setToken([group, key], e.target.value)} />{TOKEN_SUGGESTIONS[path] && <datalist id={`${id}-list`}>{TOKEN_SUGGESTIONS[path].map((o) => <option key={o} value={o} />)}</datalist>}</>;
    return <div key={path}><label htmlFor={id} className="mb-1 block text-xs text-neutral-500">{label(key)}</label>{control}</div>;
  }

  const t = tokens as unknown as Record<string, unknown>;
  const groups = Object.keys(t).filter((g) => isPlainObject(t[g]) && Object.keys(t[g] as object).length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="space-y-4">
        <label className="block">Base theme
          <select className={input} value={doc.tour.themeId ?? ""} onChange={(e) => setDoc((d) => ({ ...d, tour: { ...d.tour, themeId: e.target.value || null, themeOverrides: {} } }))}>
            <option value="">(none — defaults)</option>
            {themes.map((x) => <option key={x.id} value={x.id}>{x.name}{x.isPreset ? " (preset)" : ""}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="rounded border px-2 py-1" onClick={() => saveAsTheme(false)}>Save as new theme</button>
          {canUpdateBase && <button className="rounded border px-2 py-1" onClick={() => saveAsTheme(true)}>Update “{base.name}”</button>}
          {hasOverrides && <button className="rounded border px-2 py-1" onClick={() => setOverrides({})}>Reset tweaks</button>}
        </div>
        {msg && <p role="status" className="text-sm text-green-700">{msg}</p>}
        <p className="text-xs text-neutral-500">Tweaks apply to this tour only until you save them as a theme. Presets are never modified.</p>
        {groups.map((g) => (
          <details key={g} open={g === "colors"} className="rounded border p-3">
            <summary className="cursor-pointer font-semibold">{label(g)}</summary>
            <div className="mt-3 grid gap-3">{Object.entries(t[g] as Record<string, unknown>).map(([k, v]) => field(g, k, v))}</div>
          </details>
        ))}
        <details className="rounded border p-3">
          <summary className="cursor-pointer font-semibold">Advanced: raw JSON</summary>
          <textarea className={`${input} mt-3 font-mono text-xs`} rows={10} value={raw ?? JSON.stringify(deepMerge(base?.tokens ?? {}, overrides), null, 2)} onChange={(e) => setRaw(e.target.value)} />
          <button className="mt-2 rounded border px-2 py-1 text-sm" onClick={() => {
            try {
              const parsed = JSON.parse(raw ?? "{}");
              if (!isPlainObject(parsed)) throw new Error();
              themeTokensSchema.parse(parsed);
              setOverrides(parsed); setRaw(null); setMsg("Applied");
            } catch { setMsg("Invalid theme JSON"); }
          }}>Apply JSON</button>
        </details>
      </div>

      <div aria-label="Live preview" className="min-w-0">
        <ThemeScope tokens={tokens} className="overflow-hidden rounded border">
          <div className="t-hero px-6 py-10 text-center">
            <h2 className="text-3xl">{doc.tour.title}</h2>
            <p className="t-muted mt-1">{doc.tour.city}</p>
            {tokens.copy.welcome && <p className="mt-2">{tokens.copy.welcome}</p>}
            <span className="t-btn mt-4">{tokens.copy.startLabel} →</span>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div className="h-56 overflow-hidden" style={{ borderRadius: "var(--t-radius)" }}>
              <TourMap tokens={tokens} center={[doc.stops[0]?.lat ?? doc.tour.lat, doc.stops[0]?.lng ?? doc.tour.lng]} stops={doc.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.title }))} routeIds={doc.stops.map((s) => s.id)} fitKey="preview" />
            </div>
            <div className="t-card p-4">
              <p className="t-muted text-sm">{tokens.copy.stopLabel} 1</p>
              <h3 className="text-xl">{doc.stops[0]?.title ?? "Sample stop"}</h3>
              <p className="mt-2 text-sm">The story text appears here with <a href="#preview">a link</a> and <span className="t-accent">an accent color</span>.</p>
              <div className="mt-3 flex gap-2"><span className="t-btn">Primary</span><span className="t-btn-ghost">Secondary</span><span className="t-chip">Chip</span></div>
            </div>
          </div>
        </ThemeScope>
      </div>
    </div>
  );
}
