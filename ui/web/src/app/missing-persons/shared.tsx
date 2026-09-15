"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";

/** A datetime-local value is local wall time; the API wants RFC 3339. */
export const toApiTime = (local: string) => new Date(local).toISOString();

/** The current local time formatted for a datetime-local input. */
export const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const errorMessage = (err: unknown) => (err instanceof Error && err.message ? err.message : null);

export const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const selectClass =
  "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export function Field({ id, label, wide, children }: { id: string; label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
