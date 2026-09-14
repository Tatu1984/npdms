"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bailApi, { type Bail, type BailInput, type BailQuery, type BailStatus } from "@/lib/api/bail";

/**
 * React Query bindings for bail applications.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Every mutation
 * invalidates the whole bail subtree so lists and stats cannot disagree with
 * the record just changed.
 */

export const bailKeys = {
  all: ["bail"] as const,
  list: (query: BailQuery) => ["bail", "list", query] as const,
  detail: (id: string) => ["bail", "detail", id] as const,
  stats: () => ["bail", "stats"] as const,
  accused: (caseId: string) => ["bail", "accused", caseId] as const,
};

export function useBail(query: BailQuery = {}) {
  return useQuery({
    queryKey: bailKeys.list(query),
    queryFn: () => bailApi.list(query),
  });
}

export function useBailById(id: string) {
  return useQuery({
    queryKey: bailKeys.detail(id),
    queryFn: () => bailApi.get(id),
    enabled: Boolean(id),
  });
}

export function useBailStats() {
  return useQuery({
    queryKey: bailKeys.stats(),
    queryFn: bailApi.stats,
  });
}

export function useAccusedForCase(caseId: string | null | undefined) {
  return useQuery({
    queryKey: bailKeys.accused(caseId ?? ""),
    queryFn: () => bailApi.accusedForCase(caseId!),
    enabled: Boolean(caseId),
  });
}

export function useCreateBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BailInput) => bailApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: bailKeys.all }),
  });
}

export function useUpdateBail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bail, changes }: { bail: Bail; changes: Partial<BailInput> }) =>
      bailApi.update(bail, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: bailKeys.all }),
  });
}

export function useSetBailStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: BailStatus; reason?: string }) =>
      bailApi.setStatus(id, status, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: bailKeys.all }),
  });
}
