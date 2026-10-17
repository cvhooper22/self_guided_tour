"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ImgProps = { src: string; alt?: string; className?: string; style?: React.CSSProperties };

/** Image that opens in a full-screen viewer (pinch / wheel / double-tap zoom, drag to pan) when tapped. */
export default function ZoomImage({ src, alt = "", className, style }: ImgProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src} alt={alt} className={`${className ?? ""} cursor-zoom-in`} style={style}
        role="button" tabIndex={0} aria-label={alt ? `View ${alt} full screen` : "View image full screen"}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
      />
      {open && <Viewer src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

const MAX = 6;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function Viewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const lastTap = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("keydown", onKey, true); document.body.style.overflow = prev; };
  }, [onClose]);

  const zoomTo = (s: number) => setView((v) => (s <= 1 ? { s: 1, x: 0, y: 0 } : { ...v, s: clamp(s, 1, MAX) }));

  const dist = () => { const [a, b] = [...pts.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  return createPortal(
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90"
      role="dialog" aria-modal="true" aria-label="Image viewer"
      style={{ touchAction: "none" }}
      onClick={() => { if (!moved.current && view.s === 1) onClose(); }}
      onWheel={(e) => zoomTo(view.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15))}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved.current = false;
        if (pts.current.size === 2) pinch.current = { d: dist(), s: view.s };
      }}
      onPointerMove={(e) => {
        const p = pts.current.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.current.size >= 2 && pinch.current) {
          moved.current = true;
          const s = clamp(pinch.current.s * (dist() / pinch.current.d), 1, MAX);
          setView((v) => (s === 1 ? { s, x: 0, y: 0 } : { ...v, s }));
        } else if (view.s > 1 && (Math.abs(dx) + Math.abs(dy) > 0)) {
          moved.current = true;
          setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
        }
      }}
      onPointerUp={(e) => {
        pts.current.delete(e.pointerId);
        pinch.current = null;
        const now = Date.now();
        if (!moved.current && now - lastTap.current < 300) { zoomTo(view.s > 1 ? 1 : 2.5); lastTap.current = 0; }
        else if (!moved.current) lastTap.current = now;
        if (pts.current.size === 1) moved.current = true; // avoid tap/close after a pinch
      }}
      onPointerCancel={(e) => { pts.current.delete(e.pointerId); pinch.current = null; }}
    >
      <img
        src={src} alt={alt} draggable={false}
        className="max-h-full max-w-full select-none object-contain"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, cursor: view.s > 1 ? "grab" : "zoom-in" }}
      />
      <div className="absolute right-3 top-3 flex gap-2" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Zoom out" className="h-10 w-10 rounded-full bg-white/15 text-xl text-white hover:bg-white/25" onClick={() => zoomTo(view.s / 1.5)}>−</button>
        <button type="button" aria-label="Zoom in" className="h-10 w-10 rounded-full bg-white/15 text-xl text-white hover:bg-white/25" onClick={() => zoomTo(view.s * 1.5)}>+</button>
        <button type="button" aria-label="Close image viewer" className="h-10 w-10 rounded-full bg-white/15 text-xl text-white hover:bg-white/25" onClick={onClose}>✕</button>
      </div>
    </div>,
    document.body,
  );
}
