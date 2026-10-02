import Link from "next/link";
import { notFound } from "next/navigation";
import { assertAdminPage } from "@/lib/auth";
import { getTourById } from "@/lib/tours-repo";
import { AdminNav } from "@/components/AdminNav";
import { TourActions } from "@/components/AdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Raw tour" };

export default async function RawTour({ params }: PageProps<"/admin/tours/[id]/raw">) {
  await assertAdminPage();
  const b = await getTourById((await params).id);
  if (!b) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{b.tour.title} <span className="text-base font-normal text-neutral-500">raw</span></h1>
      <AdminNav />
      <div className="mb-4 flex items-center gap-4 text-sm">
        <TourActions id={b.tour.id} status={b.tour.status} deleted={!!b.tour.deletedAt} />
        <Link className="underline" href={`/operator/tours/${b.tour.id}`}>Open in editor</Link>
        <Link className="underline" href={`/tour/${b.tour.slug}`}>Overview</Link>
        <Link className="underline" href={`/play/${b.tour.slug}`}>Player</Link>
        <a className="underline" href={`/api/admin/tours/${b.tour.id}`}>JSON API</a>
      </div>
      <pre className="overflow-auto rounded border bg-neutral-50 p-4 text-xs dark:bg-neutral-900">{JSON.stringify(b, null, 2)}</pre>
    </main>
  );
}
