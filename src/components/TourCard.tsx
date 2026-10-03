import Link from "next/link";
import { ThemeScope } from "./ThemeScope";
import type { ThemeTokens } from "@/lib/themes";

type T = { slug: string; title: string; summary: string; city: string; isFree: boolean; tags: string[]; coverUrl: string | null; tokens: ThemeTokens };

/** Each card previews its own tour's theme. */
export function TourCard({ t }: { t: T }) {
  return (
    <Link href={`/tour/${t.slug}`} className="block no-underline" data-testid="tour-card">
      <ThemeScope tokens={t.tokens} className="t-card h-full overflow-hidden">
        <div className="t-hero h-24" style={t.coverUrl ? { backgroundImage: `url("${t.coverUrl.replace(/"/g, "")}")` } : { background: "var(--t-primary)" }} />
        <div className="p-4">
          <h3 className="text-lg">{t.title}</h3>
          <p className="t-muted text-sm">{t.city}</p>
          <p className="mt-2 text-sm">{t.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="t-chip">{t.isFree ? "Free" : "Paid"}</span>
            {t.tags.map((x) => <span key={x} className="t-chip" data-testid="tour-tag">{x}</span>)}
          </div>
        </div>
      </ThemeScope>
    </Link>
  );
}
