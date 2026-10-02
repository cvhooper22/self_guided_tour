import { desc, eq } from "drizzle-orm";
import { assertAdminPage } from "@/lib/auth";
import { db, schema } from "@/db/client";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Audit log" };

export default async function Audit() {
  await assertAdminPage();
  const rows = await db.select({ log: schema.auditLog, actor: schema.users.name }).from(schema.auditLog).leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorId)).orderBy(desc(schema.auditLog.at)).limit(200);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Audit log</h1>
      <AdminNav />
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b"><th className="p-2">When</th><th>Who</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{rows.map(({ log, actor }) => <tr key={log.id} className="border-b align-top"><td className="p-2 whitespace-nowrap">{new Date(log.at).toLocaleString()}</td><td>{actor ?? "system"}</td><td>{log.action}</td><td>{log.entity} <span className="text-xs text-neutral-500">{log.entityId?.slice(0, 8)}</span></td><td className="font-mono text-xs">{log.details ? JSON.stringify(log.details) : ""}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
