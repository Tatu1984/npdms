"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import firsApi, {
  FIR_STATUSES,
  type FIR,
  type FIRInput,
  type FIRQuery,
  type FIRStatus,
} from "@/lib/api/firs";

/**
 * React Query bindings for FIRs.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Every mutation
 * invalidates the whole FIR subtree, so the register, counts and timeline
 * cannot disagree with the record just changed.
 */

export const firKeys = {
  all: ["firs"] as const,
  list: (query: FIRQuery) => ["firs", "list", query] as const,
  detail: (id: string) => ["firs", "detail", id] as const,
  timeline: (id: string) => ["firs", "timeline", id] as const,
  count: (status: FIRStatus | "ALL") => ["firs", "count", status] as const,
};

export function useFIRs(query: FIRQuery = {}) {
  return useQuery({
    queryKey: firKeys.list(query),
    queryFn: () => firsApi.list(query),
  });
}

export function useFIR(id: string) {
  return useQuery({
    queryKey: firKeys.detail(id),
    queryFn: () => firsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useFIRTimeline(id: string) {
  return useQuery({
    queryKey: firKeys.timeline(id),
    queryFn: async () => (await firsApi.timeline(id)).timeline ?? [],
    enabled: Boolean(id),
  });
}

/**
 * Register counts. There is no FIR stats endpoint, so each count is the
 * `total` of a one-row page filtered by status — exact, not derived from the
 * rows on screen.
 */
export function useFIRCounts(statuses: FIRStatus[] = FIR_STATUSES) {
  const keys: Array<FIRStatus | "ALL"> = ["ALL", ...statuses];
  const results = useQueries({
    queries: keys.map((status) => ({
      queryKey: firKeys.count(status),
      queryFn: () => firsApi.list({ pageSize: 1, status: status === "ALL" ? undefined : status }),
    })),
  });
  const counts: Partial<Record<FIRStatus | "ALL", number>> = {};
  keys.forEach((status, i) => {
    const total = results[i].data?.total;
    if (total !== undefined) counts[status] = total;
  });
  return {
    counts,
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
  };
}

export function useCreateFIR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FIRInput) => firsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: firKeys.all }),
  });
}

export function useUpdateFIR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fir, changes }: { fir: FIR; changes: Partial<FIRInput> }) => firsApi.update(fir, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: firKeys.all }),
  });
}

export function useSetFIRStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FIRStatus }) => firsApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: firKeys.all }),
  });
}
