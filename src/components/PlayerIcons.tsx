import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

/** Glyph arrows and ✕ sit off-centre in most fonts; these are drawn on the icon box so buttons center them exactly. */
export const ChevronIcon = ({ dir, ...p }: { dir: "left" | "right" } & SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d={dir === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"} /></svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 6 L18 18 M18 6 L6 18" /></svg>
);
/** A "?" set in a diamond: the factoid marker. */
export const FactIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} strokeWidth={1.8} width="1.25em" height="1.25em" {...p}>
    <path d="M12 1.8 L22.2 12 L12 22.2 L1.8 12 Z" />
    <path d="M9.4 9.6 A2.7 2.7 0 1 1 13.6 11.8 C12.7 12.4 12 12.9 12 14.1" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const LocateIcon = ({ on, ...p }: { on: boolean } & SVGProps<SVGSVGElement>) => (
  <svg {...base} fill={on ? "currentColor" : "none"} strokeWidth={2.2} strokeLinecap="butt" {...p}>
    <path d="M12 3 L21 12 L12 21 L3 12 Z" />
    <circle cx="12" cy="12" r="2.2" fill={on ? "var(--t-background)" : "currentColor"} stroke="none" />
  </svg>
);
