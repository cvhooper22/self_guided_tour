import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="mb-6 flex gap-4 border-b pb-2 text-sm">
      <Link href="/admin">Overview</Link>
      <Link href="/admin/tours">All tours</Link>
      <Link href="/admin/users">Users</Link>
      <Link href="/admin/audit">Audit log</Link>
    </nav>
  );
}
