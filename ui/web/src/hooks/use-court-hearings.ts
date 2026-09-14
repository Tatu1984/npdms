"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courtApi, { type CourtHearing, type HearingInput, type HearingQuery } from "@/lib/api/court";

/**
 * React Query bindings for court hearings.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Mutations invalidate
 * the whole court subtree, because hearing changes move the stats too.
 */

export const courtKeys = {
  all: ["court"] as const,
  stats: () => ["court", "stats"] as const,
};

export const courtHearingKeys = {
  all: ["court", "hearings"] as const,
  list: (query: HearingQuery) => ["court", "hearings", "list", query] as const,
  detail: (id: string) => ["court", "hearings", "detail", id] as const,
};

export function useCourtHearings(query: HearingQuery = {}) {
  return useQuery({
    queryKey: courtHearingKeys.list(query),
    queryFn: () => courtApi.hearings(query),
  });
}

export function useCourtHearing(id: string) {
  return useQuery({
    queryKey: courtHearingKeys.detail(id),
    queryFn: () => courtApi.hearing(id),
    enabled: Boolean(id),
  });
}

export function useCourtStats() {
  return useQuery({
    queryKey: courtKeys.stats(),
    queryFn: courtApi.stats,
  });
}

export function useCreateCourtHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HearingInput) => courtApi.createHearing(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: courtKeys.all }),
  });
}

export function useUpdateCourtHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hearing, changes }: { hearing: CourtHearing; changes: Partial<HearingInput> }) =>
      courtApi.updateHearing(hearing, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: courtKeys.all }),
  });
}
