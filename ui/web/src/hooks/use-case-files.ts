"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import caseFilesApi, { type AddEntryInput, type CaseFileStatus } from "@/lib/api/case-files";

/**
 * React Query bindings for Phase 12.
 *
 * Invalidation is scoped to the panels a change can affect — refetching the
 * whole file after every action trips the API's per-minute rate limit. Every
 * change also bumps the file's version, so the header and version history are
 * always included.
 */

export const caseFileKeys = {
  all: ["case-files"] as const,
  list: (q: unknown) => ["case-files", "list", q] as const,
  file: (id: string) => ["case-files", id, "file"] as const,
  sources: (id: string) => ["case-files", id, "sources"] as const,
  entries: (id: string) => ["case-files", id, "entries"] as const,
  evidence: (id: string) => ["case-files", id, "evidence-matrix"] as const,
  witnesses: (id: string) => ["case-files", id, "witness-matrix"] as const,
  completeness: (id: string) => ["case-files", id, "completeness"] as const,
  versions: (id: string) => ["case-files", id, "versions"] as const,
  version: (id: string, v: number) => ["case-files", id, "version", v] as const,
  packs: (id: string) => ["case-files", id, "packs"] as const,
  pack: (id: string, packId: string) => ["case-files", id, "pack", packId] as const,
};

type Part = "entries" | "evidence" | "witnesses" | "completeness" | "packs";

function useInvalidate(id: string) {
  const qc = useQueryClient();
  return (...parts: Part[]) => {
    qc.invalidateQueries({ queryKey: caseFileKeys.file(id) });
    qc.invalidateQueries({ queryKey: caseFileKeys.versions(id) });
    for (const p of parts) qc.invalidateQueries({ queryKey: caseFileKeys[p](id) });
  };
}

export function useCaseFiles(query: { search?: string; status?: CaseFileStatus; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: caseFileKeys.list(query), queryFn: () => caseFilesApi.list(query) });
}

export function useCaseFile(id: string) {
  return useQuery({ queryKey: caseFileKeys.file(id), queryFn: () => caseFilesApi.get(id), enabled: Boolean(id) });
}

export function useCreateCaseFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => caseFilesApi.create(workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case-files", "list"] }),
  });
}

export function useCaseFileSources(id: string, enabled = true) {
  return useQuery({ queryKey: caseFileKeys.sources(id), queryFn: () => caseFilesApi.sources(id), enabled: Boolean(id) && enabled });
}

export function useCaseFileEntries(id: string) {
  return useQuery({ queryKey: caseFileKeys.entries(id), queryFn: () => caseFilesApi.entries(id), enabled: Boolean(id) });
}

export function useAddEntry(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (input: AddEntryInput) => caseFilesApi.addEntry(id, input),
    onSuccess: () => invalidate("entries", "completeness", "witnesses"),
  });
}

export function useUploadEntry(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ input, file }: { input: Omit<AddEntryInput, "sourceKind">; file: File }) =>
      caseFilesApi.uploadEntry(id, input, file),
    onSuccess: () => invalidate("entries", "completeness", "witnesses"),
  });
}

export function useRemoveEntry(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ entryId, reason }: { entryId: string; reason: string }) => caseFilesApi.removeEntry(id, entryId, reason),
    onSuccess: () => invalidate("entries", "completeness", "witnesses", "packs"),
  });
}

export function useEvidenceMatrix(id: string) {
  return useQuery({ queryKey: caseFileKeys.evidence(id), queryFn: () => caseFilesApi.evidenceMatrix(id), enabled: Boolean(id) });
}

export function useAddCharge(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ section, description }: { section: string; description?: string }) =>
      caseFilesApi.addCharge(id, section, description),
    onSuccess: () => invalidate("evidence", "completeness"),
  });
}

export function useRemoveCharge(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (chargeId: string) => caseFilesApi.removeCharge(id, chargeId),
    onSuccess: () => invalidate("evidence", "completeness"),
  });
}

export function useLinkEvidence(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ chargeId, evidenceId, note }: { chargeId: string; evidenceId: string; note?: string }) =>
      caseFilesApi.linkEvidence(id, chargeId, evidenceId, note),
    onSuccess: () => invalidate("evidence", "completeness"),
  });
}

export function useUnlinkEvidence(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ chargeId, evidenceId }: { chargeId: string; evidenceId: string }) =>
      caseFilesApi.unlinkEvidence(id, chargeId, evidenceId),
    onSuccess: () => invalidate("evidence", "completeness"),
  });
}

export function useWitnessMatrix(id: string) {
  return useQuery({ queryKey: caseFileKeys.witnesses(id), queryFn: () => caseFilesApi.witnessMatrix(id), enabled: Boolean(id) });
}

export function useAddWitnessFact(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: ({ personId, fact, statementEntryId }: { personId: string; fact: string; statementEntryId?: string }) =>
      caseFilesApi.addWitnessFact(id, personId, fact, statementEntryId),
    onSuccess: () => invalidate("witnesses"),
  });
}

export function useRemoveWitnessFact(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (factId: string) => caseFilesApi.removeWitnessFact(id, factId),
    onSuccess: () => invalidate("witnesses"),
  });
}

export function useCompleteness(id: string) {
  return useQuery({ queryKey: caseFileKeys.completeness(id), queryFn: () => caseFilesApi.completeness(id), enabled: Boolean(id) });
}

export function useVersions(id: string) {
  return useQuery({ queryKey: caseFileKeys.versions(id), queryFn: () => caseFilesApi.versions(id), enabled: Boolean(id) });
}

export function useVersion(id: string, version: number | null) {
  return useQuery({
    queryKey: caseFileKeys.version(id, version ?? 0),
    queryFn: () => caseFilesApi.version(id, version!),
    enabled: Boolean(id) && version !== null,
  });
}

export function usePacks(id: string) {
  return useQuery({ queryKey: caseFileKeys.packs(id), queryFn: () => caseFilesApi.packs(id), enabled: Boolean(id) });
}

export function usePack(id: string, packId: string | null) {
  return useQuery({
    queryKey: caseFileKeys.pack(id, packId ?? ""),
    queryFn: () => caseFilesApi.pack(id, packId!),
    enabled: Boolean(id) && Boolean(packId),
  });
}

export function useSubmitPack(id: string) {
  const invalidate = useInvalidate(id);
  return useMutation({ mutationFn: () => caseFilesApi.submit(id), onSuccess: () => invalidate("packs") });
}

export function useDecidePack(id: string) {
  const invalidate = useInvalidate(id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, approve, reason }: { packId: string; approve: boolean; reason?: string }) =>
      approve ? caseFilesApi.approve(id, packId) : caseFilesApi.returnPack(id, packId, reason ?? ""),
    onSuccess: (_, v) => {
      invalidate("packs");
      qc.invalidateQueries({ queryKey: caseFileKeys.pack(id, v.packId) });
    },
  });
}
