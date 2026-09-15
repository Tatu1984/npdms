import type { StatusTone } from "@/components/platform/primitives";
import type { IncidentSeverity, IncidentStatus } from "@/lib/api/dispatch";

export const STATUS_TONE: Record<IncidentStatus, StatusTone> = {
  NEW: "danger",
  CLASSIFIED: "warning",
  DISPATCHED: "info",
  ON_SCENE: "info",
  CLEARED: "success",
  CLOSED: "neutral",
};

export const SEVERITY_TONE: Record<IncidentSeverity, StatusTone> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
};

export function severityLevel(s: IncidentSeverity) {
  return s.toLowerCase() as "critical" | "high" | "medium" | "low";
}

/** Clock time for control-room display; the date only when it is not today. */
export function formatClock(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${time}`;
}

/** Seconds as "1m 05s" for response intervals. */
export function formatSeconds(s: number | null) {
  if (s === null) return "—";
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return m > 0 ? `${m}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
}
