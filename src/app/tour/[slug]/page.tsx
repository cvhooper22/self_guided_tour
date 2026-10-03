import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, realAdminId } from "@/lib/auth";
import { getTourBySlug } from "@/lib/tours-repo";
import { ThemeScope } from "@/components/ThemeScope";
import { StopStory } from "@/components/StopDetail";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const s = await getSession();
  return getTourBySlug(slug, s ? { uid: s.uid, isAdmin: !!realAdminId(s) } : null);
}

// Server-rendered so shared links get a real title/description/image preview.
export async function generateMetadata({ params }: PageProps<"/tour/[slug]">): Promise<Metadata> {
  const b = await load((await params).slug);
  if (!b) return { title: "Tour not found" };
  const images = b.tour.coverUrl ? [b.tour.coverUrl] : undefined;
  return { title: b.tour.title, description: b.tour.summary, openGraph: { title: b.tour.title, description: b.tour.summary, type: "website", images }, twitter: { card: images ? "summary_large_image" : "summary", title: b.tour.title, description: b.tour.summary } };
}

export default async function TourOverview({ params }: PageProps<"/tour/[slug]">) {
  const { slug } = await params;
  const b = await load(slug);
  if (!b) notFound();
  const { tour, tokens } = b;
  return (
    <ThemeScope tokens={tokens} className="flex-1">
      <div className="t-hero px-4 py-14 text-center" style={tour.coverUrl ? { backgroundImage: `url("${tour.coverUrl.replace(/"/g, "")}")` } : undefined}>
        {tour.status !== "published" && <p className="t-chip mb-3 inline-block">Draft — only you and admins can see this</p>}
        <h1 className="text-4xl">{tour.title}</h1>
        <p className="t-muted mt-2">{tour.city} · {b.stops.length} stops · {tour.isFree ? "Free" : "Paid"}</p>
        {tour.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {tour.tags.map((x) => <Link key={x} href={`/tours?${new URLSearchParams({ tag: x })}`} className="t-chip no-underline" data-testid="tour-tag">{x}</Link>)}
          </div>
        )}
        {tokens.copy.welcome && <p className="mx-auto mt-3 max-w-xl">{tokens.copy.welcome}</p>}
        <Link href={`/play/${tour.slug}`} className="t-btn mt-6">{tokens.copy.startLabel} →</Link>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-lg">{tour.summary}</p>
        <StopStory story={tour.story} />
        {b.routes.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl">Suggested routes</h2>
            <ul className="space-y-3">
              {b.routes.map((r) => (
                <li key={r.id} className="t-card p-4">
                  <div className="font-semibold">{r.name} <span className="t-chip ml-2">{r.stopIds.length} {tokens.copy.stopLabel.toLowerCase()}s</span></div>
                  <p className="t-muted text-sm">{r.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ThemeScope>
  );
}
