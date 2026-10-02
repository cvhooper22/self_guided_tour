import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listToursForOwner } from "@/lib/tours-repo";
import { NewTourButton } from "@/components/editor/NewTourButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operator dashboard" };

export default async function OperatorHome() {
  const s = (await getSession())!;
  const tours = await listToursForOwner(s.uid);
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your tours</h1>
        <NewTourButton />
      </div>
      {tours.length === 0 ? <p>No tours yet. Create your first one.</p> : (
        <ul className="divide-y rounded border border-black/10">
          {tours.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="font-semibold">{t.title}</div>
                <div className="text-sm text-neutral-500">/{t.slug} · {t.city || "no city yet"}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${t.status === "published" ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-700"}`}>{t.status}</span>
              <Link className="underline" href={`/tour/${t.slug}`}>View</Link>
              <Link className="rounded bg-black px-3 py-1 text-white dark:bg-white dark:text-black" href={`/operator/tours/${t.id}`}>Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
