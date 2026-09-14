"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import warrantsApi, {
  type Warrant,
  type WarrantInput,
  type WarrantQuery,
  type WarrantStatus,
} from "@/lib/api/warrants";

/**
 * React Query bindings for warrants.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Every mutation
 * invalidates the whole warrants subtree so lists and stats cannot disagree
 * with the record just changed.
 */

export const warrantKeys = {
  all: ["warrants"] as const,
  list: (query: WarrantQuery) => ["warrants", "list", query] as const,
  detail: (id: string) => ["warrants", "detail", id] as const,
  stats: () => ["warrants", "stats"] as const,
};

export function useWarrants(query: WarrantQuery = {}) {
  return useQuery({
    queryKey: warrantKeys.list(query),
    queryFn: () => warrantsApi.list(query),
  });
}

export function useWarrant(id: string) {
  return useQuery({
    queryKey: warrantKeys.detail(id),
    queryFn: () => warrantsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useWarrantStats() {
  return useQuery({
    queryKey: warrantKeys.stats(),
    queryFn: warrantsApi.stats,
  });
}

export function useCreateWarrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WarrantInput) => warrantsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantKeys.all }),
  });
}

export function useUpdateWarrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ warrant, changes }: { warrant: Warrant; changes: Partial<WarrantInput> }) =>
      warrantsApi.update(warrant, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantKeys.all }),
  });
}

export function useSetWarrantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, executedBy }: { id: string; status: WarrantStatus; executedBy?: string }) =>
      warrantsApi.setStatus(id, status, executedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: warrantKeys.all }),
  });
}
