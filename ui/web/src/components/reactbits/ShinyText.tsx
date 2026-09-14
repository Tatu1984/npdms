"use client";

import { cn } from "@/lib/utils";

/**
 * reactbits-style shiny text — a light sweep across the glyphs.
 * Used sparingly: platform wordmark and "live" command-centre headings.
 */
export function ShinyText({
  text,
  className,
  speed = 4,
  disabled = false,
}: {
  text: string;
  className?: string;
  speed?: number;
  disabled?: boolean;
}) {
  if (disabled) return <span className={className}>{text}</span>;

  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage:
          "linear-gradient(110deg, currentColor 35%, color-mix(in oklab, currentColor 25%, white) 50%, currentColor 65%)",
        backgroundSize: "200% 100%",
        animation: `shimmer ${speed}s linear infinite`,
        color: "inherit",
      }}
    >
      {text}
    </span>
  );
}
