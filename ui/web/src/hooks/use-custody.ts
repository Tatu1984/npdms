"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import custodyApi, { type IntegrityState } from "@/lib/api/custody";

/**
 * React Query bindings for Phase 02.
 *
 * Verification and transfer both change an item's recorded state, so they
 * invalidate the whole custody subtree rather than patching caches by hand —
 * an integrity badge that disagrees with the verification history would be
 * worse than a brief spinner.
 */

export const custodyKeys = {
  all: ["custody"] as const,
  list: (query: unknown) => ["custody", "list", query] as const,
  item: (id: string) => ["custody", "item", id] as const,
  chain: (id: string) => ["custody", id, "chain"] as const,
  accessLog: (id: string) => ["custody", id, "access-log"] as const,
  verifications: (id: string) => ["custody", id, "verifications"] as const,
  court: (id: string) => ["custody", id, "court"] as const,
  stats: ["custody", "stats"] as const,
};

export function useEvidenceRegister(query: {
  search?: string;
  integrity?: IntegrityState;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: custodyKeys.list(query),
    queryFn: () => custodyApi.list(query),
  });
}

export function useCustodyStats() {
  return useQuery({
    queryKey: custodyKeys.stats,
    queryFn: () => custodyApi.stats(),
  });
}

export function useEvidenceItem(id: string) {
  return useQuery({
    queryKey: custodyKeys.item(id),
    queryFn: () => custodyApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCustodyChain(id: string, enabled = true) {
  return useQuery({
    queryKey: custodyKeys.chain(id),
    queryFn: () => custodyApi.chain(id).then((r) => r.data),
    enabled: Boolean(id) && enabled,
  });
}

export function useAccessLog(id: string, enabled = true) {
  return useQuery({
    queryKey: custodyKeys.accessLog(id),
    queryFn: () => custodyApi.accessLog(id).then((r) => r.data),
    enabled: Boolean(id) && enabled,
  });
}

export function useVerificationHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: custodyKeys.verifications(id),
    queryFn: () => custodyApi.verifications(id).then((r) => r.data),
    enabled: Boolean(id) && enabled,
  });
}

export function useCourtVerification(id: string, enabled = true) {
  return useQuery({
    queryKey: custodyKeys.court(id),
    queryFn: () => custodyApi.courtVerification(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useVerifyEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => custodyApi.verify(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: custodyKeys.all }),
  });
}

export function useTransferCustody(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof custodyApi.transfer>[1]) =>
      custodyApi.transfer(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: custodyKeys.all }),
  });
}

export function useAttachEvidenceFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => custodyApi.attachFile(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: custodyKeys.all }),
  });
}
