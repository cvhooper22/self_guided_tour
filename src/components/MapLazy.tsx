"use client";
import dynamic from "next/dynamic";

// Leaflet touches `window`, so the map is client-only.
export const TourMap = dynamic(() => import("./TourMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/10" />,
});
