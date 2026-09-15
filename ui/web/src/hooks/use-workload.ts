"use client";

import { useQuery } from "@tanstack/react-query";
import workloadApi, { type TrendInterval, type WorkloadQuery } from "@/lib/api/workload";

/**
 * React Query bindings for Phase 08. Read-only: the workload view aggregates
 * records other modules own, so it has no mutations. No local fallback — a
 * failed request shows as an error, never as figures.
 */

export const workloadKeys = {
  all: ["workload"] as const,
  scopes: () => ["workload", "scopes"] as const,
  summary: (q: WorkloadQuery) => ["workload", "summary", q] as const,
  backlog: (q: WorkloadQuery) => ["workload", "backlog", q] as const,
  sla: (q: WorkloadQuery) => ["workload", "sla", q] as const,
  officers: (q: WorkloadQuery) => ["workload", "officers", q] as const,
  stations: (q: WorkloadQuery) => ["workload", "stations", q] as const,
  trends: (q: WorkloadQuery, interval: TrendInterval) => ["workload", "trends", q, interval] as const,
};

export function useWorkloadScopes() {
  return useQuery({ queryKey: workloadKeys.scopes(), queryFn: workloadApi.scopes });
}

export function useWorkloadSummary(q: WorkloadQuery, enabled = true) {
  return useQuery({ queryKey: workloadKeys.summary(q), queryFn: () => workloadApi.summary(q), enabled });
}

export function useWorkloadBacklog(q: WorkloadQuery, enabled = true) {
  return useQuery({ queryKey: workloadKeys.backlog(q), queryFn: () => workloadApi.backlog(q), enabled });
}

export function useWorkloadSLA(q: WorkloadQuery, enabled = true) {
  return useQuery({ queryKey: workloadKeys.sla(q), queryFn: () => workloadApi.sla(q), enabled });
}

/** Each fetch is audited server-side, so this only runs while its tab is open. */
export function useOfficerWorkload(q: WorkloadQuery, enabled: boolean) {
  return useQuery({
    queryKey: workloadKeys.officers(q),
    queryFn: () => workloadApi.officers(q),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useStationComparison(q: WorkloadQuery, enabled: boolean) {
  return useQuery({ queryKey: workloadKeys.stations(q), queryFn: () => workloadApi.stations(q), enabled });
}

export function useWorkloadTrends(q: WorkloadQuery, interval: TrendInterval, enabled = true) {
  return useQuery({
    queryKey: workloadKeys.trends(q, interval),
    queryFn: () => workloadApi.trends(q, interval),
    enabled,
  });
}
