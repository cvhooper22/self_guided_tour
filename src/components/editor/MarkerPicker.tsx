"use client";
import { MARKER_PRESETS, parseMarker } from "@/lib/markers";
import { input } from "./styles";

type Props = {
  value: string;
  onChange: (v: string) => void;
  images: string[];
  /** Label for the "" option, e.g. "Numbered" or "Tour default". */
  emptyLabel: string;
  color?: { value: string; onChange: (v: string) => void; fallback: string };
};

const cell = (on: boolean) => `flex h-9 min-w-9 items-center justify-center rounded border px-2 text-lg ${on ? "border-black bg-black/10 dark:border-white" : ""}`;

export default function MarkerPicker({ value, onChange, images, emptyLabel, color }: Props) {
  const custom = parseMarker(value)?.kind === "glyph" && !(MARKER_PRESETS as readonly string[]).includes(value) ? value : "";
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={`${cell(!value)} !text-xs`} onClick={() => onChange("")}>{emptyLabel}</button>
        {MARKER_PRESETS.map((e) => <button type="button" key={e} aria-label={`Marker ${e}`} className={cell(value === e)} onClick={() => onChange(e)}>{e}</button>)}
        {images.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <button type="button" key={src} aria-label={`Marker image ${src.split("/").pop()}`} title={src.split("/").pop()} className={cell(value === src)} onClick={() => onChange(src)}><img src={src} alt="" className="h-6 w-6 object-contain" /></button>
        ))}
      </div>
      <input className={input} aria-label="Custom marker text" placeholder="Or type your own emoji / short text" value={custom} maxLength={8} onChange={(e) => onChange(parseMarker(e.target.value) ? e.target.value.trim() : "")} />
      {images.length === 0 && <p className="text-xs text-neutral-500">Add image files to <code>public/markers/</code> to offer them here.</p>}
      {color && (
        <div className="flex items-center gap-2 text-sm">
          <input type="color" aria-label="Marker color" className="h-9 w-12" value={color.value || color.fallback} onChange={(e) => color.onChange(e.target.value)} />
          <span className="text-neutral-500">{color.value ? "Custom color" : "Theme color"}</span>
          {color.value && <button type="button" className="underline" onClick={() => color.onChange("")}>Reset</button>}
        </div>
      )}
    </div>
  );
}
