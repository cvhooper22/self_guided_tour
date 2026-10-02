import Link from "next/link";
import { getSession, realAdminId } from "@/lib/auth";
import { LogoutButton, StopViewingAs } from "./AuthButtons";

export default async function Nav() {
  const s = await getSession();
  const isAdmin = !!realAdminId(s);
  return (
    <>
      {s?.adminId && (
        <div className="bg-amber-300 px-4 py-1 text-center text-sm text-black">
          Viewing as <b>{s.name}</b> ({s.role}) <StopViewingAs />
        </div>
      )}
      <header className="flex h-12 items-center gap-4 border-b border-black/10 bg-white px-4 text-sm dark:bg-neutral-900 dark:text-white">
        <Link href="/" className="font-bold">🧭 Self-Guided Tour</Link>
        <Link href="/tours">Find a tour</Link>
        {(s?.role === "operator" || isAdmin) && <Link href="/operator">Operator</Link>}
        {isAdmin && <Link href="/admin">Admin</Link>}
        <span className="flex-1" />
        {s ? (
          <>
            <Link href="/account">{s.name}</Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login">Sign in</Link>
        )}
      </header>
    </>
  );
}
