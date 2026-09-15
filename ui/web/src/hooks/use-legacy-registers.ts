"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import searchApi, { SEARCH_MIN_LENGTH } from "@/lib/api/search";
import auditApi, { type AuditQuery } from "@/lib/api/audit";
import trafficChallansApi, {
  type ChallanQuery,
  type ChallanStatus,
  type CreateChallanInput,
} from "@/lib/api/traffic-challans";

/**
 * React Query bindings for record search, stations, the audit trail and
 * traffic challans. No fallback data: a failure surfaces as an error.
 */

export function useRecordSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ["search", term],
    queryFn: () => searchApi.search(term),
    enabled: term.length >= SEARCH_MIN_LENGTH,
    staleTime: 15000,
  });
}

export function useStations() {
  return useQuery({ queryKey: ["stations"], queryFn: searchApi.stations, staleTime: 5 * 60 * 1000 });
}

export function useAuditLog(query: AuditQuery, enabled = true) {
  return useQuery({ queryKey: ["audit", "list", query], queryFn: () => auditApi.list(query), enabled });
}

export function useAuditStats(enabled = true) {
  return useQuery({ queryKey: ["audit", "stats"], queryFn: auditApi.stats, enabled });
}

/** Runs only when the officer asks for a verification. */
export function useVerifyAuditChain() {
  return useMutation({ mutationFn: (limit: number) => auditApi.verify(limit) });
}

export const challanKeys = {
  all: ["traffic-challans"] as const,
  list: (q: ChallanQuery) => ["traffic-challans", "list", q] as const,
  detail: (id: string) => ["traffic-challans", "detail", id] as const,
  stats: () => ["traffic-challans", "stats"] as const,
  defaulters: (page: number) => ["traffic-challans", "defaulters", page] as const,
};

export function useViolationTypes() {
  return useQuery({ queryKey: ["traffic-violation-types"], queryFn: trafficChallansApi.violationTypes, staleTime: 10 * 60 * 1000 });
}

export function useChallans(query: ChallanQuery) {
  return useQuery({ queryKey: challanKeys.list(query), queryFn: () => trafficChallansApi.list(query) });
}

export function useChallan(id: string) {
  return useQuery({ queryKey: challanKeys.detail(id), queryFn: () => trafficChallansApi.get(id), enabled: Boolean(id) });
}

export function useChallanStats() {
  return useQuery({ queryKey: challanKeys.stats(), queryFn: trafficChallansApi.stats });
}

export function useDefaulters(page: number) {
  return useQuery({ queryKey: challanKeys.defaulters(page), queryFn: () => trafficChallansApi.defaulters(page) });
}

export function useCreateChallan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChallanInput) => trafficChallansApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traffic-challans", "list"] });
      qc.invalidateQueries({ queryKey: challanKeys.stats() });
    },
  });
}

/** A status change or dispute touches this challan, the lists and the totals. */
function useChallanAction<V>(fn: (v: V) => Promise<unknown>, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: challanKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["traffic-challans", "list"] });
      qc.invalidateQueries({ queryKey: challanKeys.stats() });
      qc.invalidateQueries({ queryKey: ["traffic-challans", "defaulters"] });
    },
  });
}

export function useSetChallanStatus(id: string) {
  return useChallanAction(
    (v: { status: ChallanStatus; reference?: string; note?: string }) =>
      trafficChallansApi.setStatus(id, v.status, v.reference, v.note),
    id,
  );
}

export function useDisputeChallan(id: string) {
  return useChallanAction((reason: string) => trafficChallansApi.dispute(id, reason), id);
}
