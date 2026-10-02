import Link from "next/link";
import { assertAdminPage } from "@/lib/auth";
import { listAllTours } from "@/lib/tours-repo";
import { AdminNav } from "@/components/AdminNav";
import { TourActions } from "@/components/AdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · All tours" };

export default async function AdminTours({ searchParams }: PageProps<"/admin/tours">) {
  await assertAdminPage();
  const q = (typeof (await searchParams).q === "string" ? ((await searchParams).q as string) : "").toLowerCase();
  const rows = (await listAllTours()).filter((r) => !q || [r.tour.title, r.tour.slug, r.ownerEmail ?? "", r.tour.city].some((x) => x.toLowerCase().includes(q)));
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">All tours</h1>
      <AdminNav />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Filter by title, slug, owner, city" className="w-80 rounded border px-3 py-2 dark:bg-neutral-800" /></form>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b"><th className="p-2">Tour</th><th>Owner</th><th>Status</th><th>Stops</th><th>Links</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(({ tour: t, ownerName, ownerEmail, stopCount }) => (
            <tr key={t.id} className={`border-b ${t.deletedAt ? "opacity-50" : ""}`} data-testid="admin-tour-row">
              <td className="p-2"><div className="font-semibold">{t.title}</div><div className="text-xs text-neutral-500">/{t.slug}</div></td>
              <td>{ownerName}<div className="text-xs text-neutral-500">{ownerEmail}</div></td>
              <td>{t.deletedAt ? "deleted" : t.status}</td>
              <td>{stopCount}</td>
              <td className="space-x-2"><Link className="underline" href={`/operator/tours/${t.id}`}>Edit</Link><Link className="underline" href={`/tour/${t.slug}`}>View</Link><Link className="underline" href={`/admin/tours/${t.id}/raw`}>Raw</Link></td>
              <td><TourActions id={t.id} status={t.status} deleted={!!t.deletedAt} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
