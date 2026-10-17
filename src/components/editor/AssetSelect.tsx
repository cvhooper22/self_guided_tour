"use client";
import { input } from "./styles";

/** Lets an operator fill a URL field with a file shipped in public/assets/ instead of typing a link. */
export default function AssetSelect({ files, onPick, kind }: { files: string[]; onPick: (path: string) => void; kind?: "image" | "audio" | "video" | "document" | "link" }) {
  if (!files.length) return null;
  const ext: Record<string, RegExp> = { image: /\.(png|jpe?g|gif|webp|svg)$/i, audio: /\.(m4a|mp3|wav|ogg|aac)$/i, video: /\.(mp4|webm|mov)$/i, document: /\.pdf$/i };
  const re = kind ? ext[kind] : undefined;
  const shown = re ? files.filter((f) => re.test(f)) : files;
  return (
    <select className={input} aria-label="Pick from assets" value="" onChange={(e) => e.target.value && onPick(e.target.value)}>
      <option value="">Or pick from assets…</option>
      {shown.map((f) => <option key={f} value={f}>{decodeURIComponent(f.replace("/assets/", ""))}</option>)}
    </select>
  );
}
