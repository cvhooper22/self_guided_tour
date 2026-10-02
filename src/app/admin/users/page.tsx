import { asc } from "drizzle-orm";
import { assertAdminPage } from "@/lib/auth";
import { db, schema } from "@/db/client";
import { AdminNav } from "@/components/AdminNav";
import { UserActions } from "@/components/AdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Users" };

export default async function AdminUsers() {
  const s = await assertAdminPage();
  const rows = await db.select().from(schema.users).orderBy(asc(schema.users.email));
  const me = s.adminId ?? s.uid;
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      <AdminNav />
      <p className="mb-3 text-sm text-neutral-500">“View as” signs you in as that user (with an admin banner) so you can reproduce what they see. It is recorded in the audit log.</p>
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b"><th className="p-2">Name</th><th>Email</th><th>Role / actions</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className="border-b"><td className="p-2">{u.name}</td><td>{u.email}</td><td><UserActions id={u.id} role={u.role} isSelf={u.id === me} /></td></tr>)}</tbody>
      </table>
    </main>
  );
}
