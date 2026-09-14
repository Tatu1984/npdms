"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cursor-tracking spotlight for hero and command-centre panels.
 * Pure CSS radial gradient positioned from pointer coordinates.
 */
export function Spotlight({
  children,
  className,
  color = "color-mix(in oklab, var(--accent) 22%, transparent)",
  size = 380,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [active, setActive] = useState(false);

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
