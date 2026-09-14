"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import casesApi, {
  type AccusedInput,
  type Case,
  type CaseInput,
  type CaseQuery,
  type CaseStatus,
  type WitnessInput,
} from "@/lib/api/cases";

/**
 * React Query bindings for cases, their accused and witnesses.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * records or a write that only happened in the browser. Mutations invalidate
 * the whole cases subtree so lists, details and counts stay consistent.
 */

export const caseKeys = {
  all: ["cases"] as const,
  list: (query: CaseQuery) => ["cases", "list", query] as const,
  detail: (id: string) => ["cases", "detail", id] as const,
  accused: (id: string) => ["cases", id, "accused"] as const,
  witnesses: (id: string) => ["cases", id, "witnesses"] as const,
};

export function useCases(query: CaseQuery = {}) {
  return useQuery({
    queryKey: caseKeys.list(query),
    queryFn: () => casesApi.list(query),
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCaseAccused(caseId: string) {
  return useQuery({
    queryKey: caseKeys.accused(caseId),
    queryFn: () => casesApi.accused(caseId),
    enabled: Boolean(caseId),
  });
}

export function useCaseWitnesses(caseId: string) {
  return useQuery({
    queryKey: caseKeys.witnesses(caseId),
    queryFn: () => casesApi.witnesses(caseId),
    enabled: Boolean(caseId),
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CaseInput) => casesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseKeys.all }),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ current, changes }: { current: Case; changes: Partial<CaseInput> & { status?: CaseStatus } }) =>
      casesApi.update(current, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseKeys.all }),
  });
}

export function useAddCaseAccused() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: AccusedInput }) => casesApi.addAccused(caseId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseKeys.all }),
  });
}

export function useAddCaseWitness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, input }: { caseId: string; input: WitnessInput }) => casesApi.addWitness(caseId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: caseKeys.all }),
  });
}
