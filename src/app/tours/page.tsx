import Link from "next/link";
import { listPublishedTags, listPublishedTours } from "@/lib/tours-repo";
import { TourCard } from "@/components/TourCard";
import { NearMe } from "@/components/NearMe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find a tour" };

export default async function ToursPage({ searchParams }: PageProps<"/tours">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const free = sp.free === "1";
  const tag = typeof sp.tag === "string" ? sp.tag : "";
  const [tours, allTags] = await Promise.all([listPublishedTours(q || undefined, free, tag || undefined), listPublishedTags()]);
  const tagHref = (t: string) => `/tours?${new URLSearchParams({ ...(q && { q }), ...(free && { free: "1" }), ...(t && { tag: t }) })}`;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Find a tour</h1>
      <form className="mb-6 flex flex-wrap items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Search by place or topic" className="w-64 rounded border border-black/20 px-3 py-2 dark:bg-neutral-800" />
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="free" value="1" defaultChecked={free} /> Free only</label>
        {tag && <input type="hidden" name="tag" value={tag} />}
        <button className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">Search</button>
      </form>
      {allTags.length > 0 && (
        <nav aria-label="Filter by tag" className="mb-6 flex flex-wrap gap-2">
          {tag && <Link href={tagHref("")} className="rounded-full border border-black/20 px-3 py-1 text-sm no-underline">Clear filter ✕</Link>}
          {allTags.map(({ tag: t, count }) => (
            <Link key={t} href={tagHref(t)} data-testid="tag-filter" aria-current={t.toLowerCase() === tag.toLowerCase() ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-sm no-underline ${t.toLowerCase() === tag.toLowerCase() ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/20"}`}>
              {t} <span className="opacity-60">{count}</span>
            </Link>
          ))}
        </nav>
      )}
      <NearMe tours={tours.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng }))} />
      {tours.length === 0 ? <p>No tours match.</p> : (
        <div id="tour-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => <div key={t.id} data-tour-id={t.id}><TourCard t={t} /></div>)}
        </div>
      )}
    </main>
  );
}
