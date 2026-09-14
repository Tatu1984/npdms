import type { LookoutPriority, LookoutStatus, LookoutType } from "@/lib/api/lookouts";

/** Display labels shared by the lookout list and detail pages. */

export const lookoutTypeLabel: Record<LookoutType, string> = {
  WANTED: "Wanted",
  MISSING: "Missing Person",
  STOLEN_VEHICLE: "Stolen Vehicle",
  SUSPECT: "Suspect",
  WITNESS: "Witness Sought",
};

export const lookoutStatusConfig: Record<LookoutStatus, { label: string; variant: "error" | "success" | "secondary" }> = {
  ACTIVE: { label: "Active", variant: "error" },
  LOCATED: { label: "Located", variant: "success" },
  CLOSED: { label: "Closed", variant: "secondary" },
};

export const priorityVariant: Record<LookoutPriority, "critical" | "high" | "normal" | "low"> = {
  CRITICAL: "critical",
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low",
};
