"use client";

import { cn } from "@/lib/utils";

/** Live indicator — a dot with an expanding ring. Used on active feeds. */
export function PulseDot({
  className,
  color = "var(--success)",
  label,
}: {
  className?: string;
  color?: string;
  label?: string;
}) {
  return (
    <span className={cn("relative inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full rounded-full"
          style={{ background: color, animation: "pulseRing 1.8s ease-out infinite" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      {label && <span className="text-xs font-medium text-foreground-muted">{label}</span>}
    </span>
  );
}
