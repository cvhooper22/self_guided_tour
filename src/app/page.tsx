import Link from "next/link";
import { listPublishedTours } from "@/lib/tours-repo";
import { TourCard } from "@/components/TourCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tours = (await listPublishedTours()).slice(0, 3);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-4xl font-bold">Walk through the story.</h1>
      <p className="mt-3 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">Self-guided tours with a map, the story at every stop, and the primary sources behind it. Open one by link, or find a tour near you.</p>
      <Link href="/tours" className="mt-5 inline-block rounded bg-black px-5 py-2 font-semibold text-white dark:bg-white dark:text-black">Find a tour</Link>
      <h2 className="mb-3 mt-12 text-xl font-semibold">Featured</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tours.map((t) => <TourCard key={t.id} t={t} />)}</div>
    </main>
  );
}
