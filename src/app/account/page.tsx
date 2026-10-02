import Link from "next/link";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function Account() {
  const s = (await getSession())!;
  const rows = await db.select({ tour: schema.tours, visited: schema.progress.visitedStopIds }).from(schema.progress).innerJoin(schema.tours, eq(schema.tours.id, schema.progress.tourId)).where(eq(schema.progress.userId, s.uid));
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">{s.name}</h1>
      <p className="mb-6 text-sm text-neutral-500">Role: {s.role}</p>
      <h2 className="mb-2 text-lg font-semibold">Your tours</h2>
      {rows.length === 0 ? <p>No tours started yet. <Link className="underline" href="/tours">Find one</Link>.</p> : (
        <ul className="space-y-2">{rows.map((r) => <li key={r.tour.id}><Link className="underline" href={`/play/${r.tour.slug}`}>{r.tour.title}</Link> — {r.visited.length} stops visited</li>)}</ul>
      )}
    </main>
  );
}
