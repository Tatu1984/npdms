import type { StatusTone } from "@/components/platform/primitives";
import type { ComplaintStatus, FreezeStatus } from "@/lib/api/cyber-fraud";

export const selectClass =
  "h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const statusTone: Record<ComplaintStatus, StatusTone> = {
  REPORTED: "neutral",
  ANALYZING: "info",
  INVESTIGATING: "warning",
  ESCALATED: "danger",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const freezeTone: Record<FreezeStatus, StatusTone> = {
  DRAFTED: "neutral",
  SENT: "info",
  ACKNOWLEDGED: "warning",
  FROZEN: "success",
  REJECTED: "danger",
};
