"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import knowledgeApi, {
  type ChecklistInput,
  type Classification,
  type DocumentInput,
  type KnowledgeQuery,
} from "@/lib/api/knowledge";

/**
 * React Query bindings for Phase 11.
 *
 * Invalidation is scoped to what a change can affect — a tick refreshes one
 * run, an upload refreshes search and stats — so ordinary use stays well under
 * the API's per-minute request limit.
 */
export const knowledgeKeys = {
  all: ["knowledge"] as const,
  capabilities: ["knowledge", "capabilities"] as const,
  search: (q: KnowledgeQuery) => ["knowledge", "search", q] as const,
  searches: ["knowledge", "search"] as const,
  stats: ["knowledge", "stats"] as const,
  document: (id: string) => ["knowledge", "document", id] as const,
  checklists: (documentId?: string) => ["knowledge", "checklists", documentId ?? "all"] as const,
  checklistLists: ["knowledge", "checklists"] as const,
  checklist: (id: string) => ["knowledge", "checklist", id] as const,
  runs: (checklistId: string) => ["knowledge", "runs", checklistId] as const,
  run: (id: string) => ["knowledge", "run", id] as const,
};

export function useKnowledgeCapabilities() {
  return useQuery({ queryKey: knowledgeKeys.capabilities, queryFn: knowledgeApi.capabilities, staleTime: 5 * 60_000 });
}

export function useKnowledgeSearch(q: KnowledgeQuery) {
  return useQuery({ queryKey: knowledgeKeys.search(q), queryFn: () => knowledgeApi.search(q), placeholderData: (prev) => prev });
}

export function useKnowledgeStats() {
  return useQuery({ queryKey: knowledgeKeys.stats, queryFn: knowledgeApi.stats });
}

export function useKnowledgeDocument(id: string) {
  return useQuery({ queryKey: knowledgeKeys.document(id), queryFn: () => knowledgeApi.get(id), enabled: Boolean(id) });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, file }: { input: DocumentInput; file: File }) => knowledgeApi.upload(input, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.searches });
      qc.invalidateQueries({ queryKey: knowledgeKeys.stats });
    },
  });
}

export function useSupersedeDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, file }: { input: DocumentInput; file: File }) => knowledgeApi.supersede(id, input, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: knowledgeKeys.document(id) });
      qc.invalidateQueries({ queryKey: knowledgeKeys.searches });
      qc.invalidateQueries({ queryKey: knowledgeKeys.stats });
    },
  });
}

export function useWithdrawDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => knowledgeApi.withdraw(id, reason),
    onSuccess: (doc) => {
      qc.setQueryData(knowledgeKeys.document(id), doc);
      qc.invalidateQueries({ queryKey: knowledgeKeys.searches });
      qc.invalidateQueries({ queryKey: knowledgeKeys.stats });
    },
  });
}

export function useClassifyDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classification, reason }: { classification: Classification; reason: string }) =>
      knowledgeApi.classify(id, classification, reason),
    onSuccess: (doc) => {
      qc.setQueryData(knowledgeKeys.document(id), doc);
      qc.invalidateQueries({ queryKey: knowledgeKeys.searches });
    },
  });
}

export function useChecklists(documentId?: string) {
  return useQuery({
    queryKey: knowledgeKeys.checklists(documentId),
    queryFn: () => knowledgeApi.checklists(documentId).then((r) => r.data ?? []),
  });
}

export function useChecklist(id: string) {
  return useQuery({ queryKey: knowledgeKeys.checklist(id), queryFn: () => knowledgeApi.checklist(id), enabled: Boolean(id) });
}

export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ChecklistInput) => knowledgeApi.createChecklist(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: knowledgeKeys.checklistLists }),
  });
}

export function useChecklistRuns(checklistId: string) {
  return useQuery({
    queryKey: knowledgeKeys.runs(checklistId),
    queryFn: () => knowledgeApi.runs(checklistId).then((r) => r.data ?? []),
    enabled: Boolean(checklistId),
  });
}

export function useStartRun(checklistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subject: { caseId?: string; firId?: string }) => knowledgeApi.startRun(checklistId, subject),
    onSuccess: () => qc.invalidateQueries({ queryKey: knowledgeKeys.runs(checklistId) }),
  });
}

export function useTickStep(runId: string, checklistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, note }: { stepId: string; note?: string }) => knowledgeApi.tick(runId, stepId, note),
    onSuccess: (run) => {
      qc.setQueryData(knowledgeKeys.run(runId), run);
      qc.invalidateQueries({ queryKey: knowledgeKeys.runs(checklistId) });
    },
  });
}
