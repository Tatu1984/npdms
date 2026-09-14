"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import personnelApi, {
  type Personnel,
  type PersonnelChanges,
  type PersonnelInput,
  type PersonnelQuery,
} from "@/lib/api/personnel";

/**
 * React Query bindings for personnel.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * officers or a write that only happened in the browser. Every mutation
 * invalidates the whole personnel subtree so the roster, counts and detail
 * cannot disagree with the record just changed.
 */

export const personnelKeys = {
  all: ["personnel"] as const,
  list: (query: PersonnelQuery) => ["personnel", "list", query] as const,
  detail: (id: string) => ["personnel", "detail", id] as const,
};

export function usePersonnel(query: PersonnelQuery = {}) {
  return useQuery({
    queryKey: personnelKeys.list(query),
    queryFn: () => personnelApi.list(query),
  });
}

export function usePersonnelById(id: string) {
  return useQuery({
    queryKey: personnelKeys.detail(id),
    queryFn: () => personnelApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreatePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonnelInput) => personnelApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: personnelKeys.all }),
  });
}

export function useUpdatePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ person, changes }: { person: Personnel; changes: PersonnelChanges }) =>
      personnelApi.update(person, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: personnelKeys.all }),
  });
}

export function useAssignDuty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, duty, shift }: { id: string; duty: string; shift: string }) =>
      personnelApi.assignDuty(id, duty, shift),
    onSuccess: () => qc.invalidateQueries({ queryKey: personnelKeys.all }),
  });
}

export function useDeletePersonnel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personnelApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: personnelKeys.all }),
  });
}
