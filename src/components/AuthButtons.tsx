"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const r = useRouter();
  return (
    <button className="underline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); r.push("/"); r.refresh(); }}>
      Sign out
    </button>
  );
}

export function StopViewingAs() {
  const r = useRouter();
  return (
    <button className="ml-2 underline" onClick={async () => { await fetch("/api/admin/impersonate", { method: "DELETE" }); r.push("/admin/users"); r.refresh(); }}>
      Stop viewing as
    </button>
  );
}
