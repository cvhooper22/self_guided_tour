import { listPublishedTours } from "@/lib/tours-repo";
import { TourCard } from "@/components/TourCard";
import { NearMe } from "@/components/NearMe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find a tour" };

export default async function ToursPage({ searchParams }: PageProps<"/tours">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const free = sp.free === "1";
  const tours = await listPublishedTours(q || undefined, free);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Find a tour</h1>
      <form className="mb-6 flex flex-wrap items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Search by place or topic" className="w-64 rounded border border-black/20 px-3 py-2 dark:bg-neutral-800" />
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="free" value="1" defaultChecked={free} /> Free only</label>
        <button className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">Search</button>
      </form>
      <NearMe tours={tours.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng }))} />
      {tours.length === 0 ? <p>No tours match.</p> : (
        <div id="tour-list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => <div key={t.id} data-tour-id={t.id}><TourCard t={t} /></div>)}
        </div>
      )}
    </main>
  );
}
