import Markdown from "react-markdown";
import { safeUrl } from "@/lib/geo";
import ZoomImage from "./ZoomImage";

export type SourceView = { id: string; kind: string; title: string; url: string; description: string };

const ICON: Record<string, string> = { link: "🔗", image: "🖼️", document: "📄", audio: "🎧", video: "🎞️" };

export function SourcesPanel({ sources }: { sources: SourceView[] }) {
  if (!sources.length) return null;
  return (
    <details className="t-card mt-5 p-3">
      <summary className="cursor-pointer font-semibold">Sources &amp; extras ({sources.length})</summary>
      <ul className="mt-3 space-y-3">
        {sources.map((s) => {
          const url = safeUrl(s.url);
          return (
            <li key={s.id} className="t-card p-3">
              <div className="font-semibold">{ICON[s.kind] ?? "🔗"} {url ? <a href={url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</div>
              {s.description && <p className="t-muted mt-1 text-sm">{s.description}</p>}
              {url && s.kind === "image" && <ZoomImage src={url} alt={s.title} className="mt-2 max-h-64 rounded" style={{ borderRadius: "var(--t-radius)" }} />}
              {url && s.kind === "audio" && <audio controls src={url} className="mt-2 w-full" />}
              {url && s.kind === "video" && <video controls src={url} className="mt-2 w-full" />}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** Image sources shown under the stop title: one image at 175px, or a scroll-snap carousel at half that. */
export function StopImages({ sources }: { sources: SourceView[] }) {
  const imgs = sources.flatMap((s) => { const url = s.kind === "image" ? safeUrl(s.url) : null; return url ? [{ id: s.id, url, title: s.title }] : []; });
  if (!imgs.length) return null;
  const solo = imgs.length === 1;
  const h = solo ? "h-[175px]" : "h-[88px]";
  return (
    <div className={`mb-3 flex gap-2 ${solo ? "" : "snap-x snap-mandatory overflow-x-auto pb-1"}`} data-testid="stop-images">
      {imgs.map((i) => (
        <ZoomImage key={i.id} src={i.url} alt={i.title} className={`${h} shrink-0 snap-start object-cover ${solo ? "w-full" : "w-auto max-w-[70%]"}`} style={{ borderRadius: "var(--t-radius)" }} />
      ))}
    </div>
  );
}

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return <div className="t-tags mb-3 flex flex-wrap gap-1">{tags.map((x) => <span key={x} className="t-chip" data-testid="stop-tag">{x}</span>)}</div>;
}

export function StopStory({ story }: { story: string }) {
  return (
    <div className="t-story space-y-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-current/40 [&_blockquote]:pl-4 [&_blockquote]:italic">
      <Markdown>{story || "_No story yet._"}</Markdown>
    </div>
  );
}
