"use client";
import { useRouter } from "next/navigation";

export function TourActions({ id, status, deleted }: { id: string; status: string; deleted: boolean }) {
  const r = useRouter();
  const act = async (action: string) => {
    if (action === "delete" && !confirm("Soft-delete this tour? It can be restored.")) return;
    const res = await fetch(`/api/admin/tours/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    if (!res.ok) alert((await res.json()).error ?? "Failed");
    r.refresh();
  };
  const b = "rounded border px-2 py-0.5 text-xs";
  return (
    <span className="flex gap-1">
      {deleted ? <button className={b} onClick={() => act("restore")}>Restore</button> : (
        <>
          {status === "published" ? <button className={b} onClick={() => act("unpublish")}>Unpublish</button> : <button className={b} onClick={() => act("publish")}>Publish</button>}
          <button className={`${b} text-red-700`} onClick={() => act("delete")}>Delete</button>
        </>
      )}
    </span>
  );
}

export function UserActions({ id, role, isSelf }: { id: string; role: string; isSelf: boolean }) {
  const r = useRouter();
  return (
    <span className="flex items-center gap-2">
      <select aria-label="Role" defaultValue={role} disabled={isSelf} className="rounded border px-1 py-0.5 dark:bg-neutral-800" onChange={async (e) => {
        const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: e.target.value }) });
        if (!res.ok) alert((await res.json()).error);
        r.refresh();
      }}>
        <option>traveler</option><option>operator</option><option>admin</option>
      </select>
      {!isSelf && <button className="rounded border px-2 py-0.5 text-xs" onClick={async () => {
        await fetch("/api/admin/impersonate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: id }) });
        r.push("/"); r.refresh();
      }}>View as</button>}
    </span>
  );
}
