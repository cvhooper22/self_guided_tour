"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewTourButton() {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black" onClick={async () => {
      const title = window.prompt("Tour title?");
      if (!title) return;
      setBusy(true);
      const res = await fetch("/api/operator/tours", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) });
      if (res.ok) r.push(`/operator/tours/${(await res.json()).id}`);
      else { setBusy(false); alert((await res.json()).error ?? "Could not create tour"); }
    }}>+ New tour</button>
  );
}
