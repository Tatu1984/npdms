"use client";

import { cn } from "@/lib/utils";

export function GradientText({
  children,
  className,
  from = "var(--accent)",
  to = "var(--ai)",
}: {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{ backgroundImage: `linear-gradient(92deg, ${from}, ${to})` }}
    >
      {children}
    </span>
  );
}
