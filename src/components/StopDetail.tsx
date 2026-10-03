import Markdown from "react-markdown";
import { safeUrl } from "@/lib/geo";

export type SourceView = { id: string; kind: string; title: string; url: string; description: string };

const ICON: Record<string, string> = { link: "🔗", image: "🖼️", document: "📄", audio: "🎧", video: "🎞️" };

export function SourcesPanel({ sources }: { sources: SourceView[] }) {
  if (!sources.length) return null;
  return (
    <section aria-label="Primary sources and extras" className="mt-5">
      <h3 className="mb-2 text-lg">Sources &amp; extras</h3>
      <ul className="space-y-3">
        {sources.map((s) => {
          const url = safeUrl(s.url);
          return (
            <li key={s.id} className="t-card p-3">
              <div className="font-semibold">{ICON[s.kind] ?? "🔗"} {url ? <a href={url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</div>
              {s.description && <p className="t-muted mt-1 text-sm">{s.description}</p>}
              {url && s.kind === "image" && <img src={url} alt={s.title} className="mt-2 max-h-64 rounded" style={{ borderRadius: "var(--t-radius)" }} />}
              {url && s.kind === "audio" && <audio controls src={url} className="mt-2 w-full" />}
              {url && s.kind === "video" && <video controls src={url} className="mt-2 w-full" />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return <div className="mb-3 flex flex-wrap gap-1">{tags.map((x) => <span key={x} className="t-chip" data-testid="stop-tag">{x}</span>)}</div>;
}

export function StopStory({ story }: { story: string }) {
  return (
    <div className="space-y-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
      <Markdown>{story || "_No story yet._"}</Markdown>
    </div>
  );
}
