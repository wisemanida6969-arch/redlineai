"use client";
import { useEffect, useRef } from "react";

/**
 * Purely decorative: a soft light spotlight that follows the mouse.
 * Fixed + pointer-events-none, so it never intercepts clicks or affects layout.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--gx", `${e.clientX}px`);
      el.style.setProperty("--gy", `${e.clientY}px`);
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 0.3s ease",
        background:
          "radial-gradient(800px circle at var(--gx, 50%) var(--gy, 50%), rgba(229,62,62,0.30), rgba(229,62,62,0.08) 40%, transparent 70%)",
      }}
    />
  );
}
