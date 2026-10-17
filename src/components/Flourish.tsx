import { useId } from "react";

/** An old-fashioned calling-card flourish: a diamond flanked by mirrored curls and tapering rules. Draws in the surrounding text colour. */
export default function Flourish({ className = "" }: { className?: string }) {
  const id = useId();
  const half = (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M134 12 C148 12 152 19 164 19 C175 19 177 9 170 9 C164 9 164 15 170 15" />
      <path d="M178 12 H226" stroke={`url(#${id})`} />
      <path d="M146 8 C150 5 154 5 156 8" strokeWidth="1" opacity=".7" />
      <circle cx="230" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </g>
  );
  return (
    <>
    <svg viewBox="0 0 240 24" role="presentation" aria-hidden className={`orn-curl mx-auto block h-5 w-56 max-w-full opacity-60 ${className}`}>
      <defs>
        <linearGradient id={id} x1="178" x2="226" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {half}
      <g transform="translate(240 0) scale(-1 1)">{half}</g>
      <path d="M120 6 L126 12 L120 18 L114 12 Z" fill="currentColor" />
      <circle cx="108" cy="12" r="1.6" fill="currentColor" />
      <circle cx="132" cy="12" r="1.6" fill="currentColor" />
    </svg>
    {/* Geometric divider for themes with shape.ornament = "deco" (CSS swaps which one shows). Full width; the rules fade out toward the edges. */}
    <div aria-hidden role="presentation" className={`orn-deco items-center gap-2 ${className}`}>
      <span className="orn-rule" />
      <span className="orn-gem orn-gem-sm" />
      <span className="orn-gem orn-gem-lg" />
      <span className="orn-gem orn-gem-sm" />
      <span className="orn-rule orn-rule-r" />
    </div>
    </>
  );
}
