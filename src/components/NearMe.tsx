"use client";
import { useState } from "react";
import { distanceM } from "@/lib/geo";

/** Reorders the server-rendered list by distance and annotates each card. Purely progressive enhancement. */
export function NearMe({ tours }: { tours: { id: string; lat: number; lng: number }[] }) {
  const [msg, setMsg] = useState("");
  function go() {
    if (!navigator.geolocation) return setMsg("Location isn't available.");
    setMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const me = { lat: p.coords.latitude, lng: p.coords.longitude };
        const list = document.getElementById("tour-list");
        if (!list) return;
        const ranked = tours.map((t) => ({ id: t.id, km: distanceM(me, t) / 1000 })).sort((a, b) => a.km - b.km);
        for (const r of ranked) {
          const el = list.querySelector<HTMLElement>(`[data-tour-id="${r.id}"]`);
          if (!el) continue;
          list.appendChild(el);
          el.dataset.km = r.km.toFixed(0);
        }
        setMsg(`Sorted by distance (nearest: ${ranked[0] ? ranked[0].km.toFixed(0) + " km" : "n/a"})`);
      },
      () => setMsg("Couldn't get your location."),
    );
  }
  return (
    <div className="mb-4 text-sm">
      <button className="underline" onClick={go}>📍 Sort by near me</button> <span>{msg}</span>
    </div>
  );
}
