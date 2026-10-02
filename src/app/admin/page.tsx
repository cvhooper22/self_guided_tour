import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { assertAdminPage } from "@/lib/auth";
import { db, schema } from "@/db/client";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHome() {
  await assertAdminPage();
  const [[u], [t], recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(schema.users),
    db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`coalesce(sum(case when ${schema.tours.status}='published' and ${schema.tours.deletedAt} is null then 1 else 0 end),0)`,
      drafts: sql<number>`coalesce(sum(case when ${schema.tours.status}='draft' and ${schema.tours.deletedAt} is null then 1 else 0 end),0)`,
      deleted: sql<number>`coalesce(sum(case when ${schema.tours.deletedAt} is not null then 1 else 0 end),0)`,
    }).from(schema.tours),
    db.select({ log: schema.auditLog, actor: schema.users.name }).from(schema.auditLog).leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorId)).orderBy(desc(schema.auditLog.at)).limit(10),
  ]);
  const stat = (l: string, n: number) => <div className="rounded border p-4"><div className="text-2xl font-bold">{n}</div><div className="text-sm text-neutral-500">{l}</div></div>;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Admin</h1>
      <AdminNav />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stat("Users", u.n)}{stat("Tours", t.total)}{stat("Published", t.published)}{stat("Drafts", t.drafts)}{stat("Deleted", t.deleted)}
      </div>
      <h2 className="mb-2 font-semibold">Recent activity <Link className="ml-2 text-sm underline" href="/admin/audit">all</Link></h2>
      <ul className="space-y-1 text-sm">
        {recent.map((r) => <li key={r.log.id}>{new Date(r.log.at).toLocaleString()} — <b>{r.actor ?? "system"}</b> {r.log.action} {r.log.entity}</li>)}
        {recent.length === 0 && <li className="text-neutral-500">Nothing yet.</li>}
      </ul>
    </main>
  );
}
