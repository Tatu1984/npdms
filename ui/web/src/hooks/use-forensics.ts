"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import forensicsApi, {
  type Forensic,
  type ForensicChanges,
  type ForensicInput,
  type ForensicQuery,
} from "@/lib/api/forensics";

/**
 * React Query bindings for forensic lab requests.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Every mutation
 * invalidates the whole forensics subtree so lists and stats cannot
 * disagree with the record just changed.
 */

export const forensicKeys = {
  all: ["forensics"] as const,
  list: (query: ForensicQuery) => ["forensics", "list", query] as const,
  detail: (id: string) => ["forensics", "detail", id] as const,
  stats: () => ["forensics", "stats"] as const,
};

export function useForensics(query: ForensicQuery = {}) {
  return useQuery({
    queryKey: forensicKeys.list(query),
    queryFn: () => forensicsApi.list(query),
  });
}

export function useForensic(id: string) {
  return useQuery({
    queryKey: forensicKeys.detail(id),
    queryFn: () => forensicsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useForensicStats() {
  return useQuery({
    queryKey: forensicKeys.stats(),
    queryFn: forensicsApi.stats,
  });
}

export function useCreateForensic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ForensicInput) => forensicsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: forensicKeys.all }),
  });
}

export function useUpdateForensic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ forensic, changes }: { forensic: Forensic; changes: ForensicChanges }) =>
      forensicsApi.update(forensic, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: forensicKeys.all }),
  });
}

export function useCompleteForensic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, summary, findings }: { id: string; summary: string; findings: string }) =>
      forensicsApi.complete(id, summary, findings),
    onSuccess: () => qc.invalidateQueries({ queryKey: forensicKeys.all }),
  });
}
