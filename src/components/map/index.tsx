"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
export const PatrolMap = dynamic(
  () => import("./PatrolMap").then((mod) => mod.PatrolMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-background-tertiary flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-foreground-muted">Loading map...</p>
        </div>
      </div>
    ),
  }
);
