"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import investigationApi, {
  type Severity,
  type WorkspaceQuery,
  type WorkspaceStatus,
} from "@/lib/api/investigation";

/**
 * React Query bindings for Phase 01.
 *
 * Mutations that can change derived state — gaps recompute when persons,
 * timeline entries, evidence links or tasks change — invalidate the whole
 * workspace subtree rather than patching caches by hand, so the screen never
 * shows a gap list that disagrees with the record.
 */

export const investigationKeys = {
  all: ["investigation"] as const,
  list: (query: WorkspaceQuery) => ["investigation", "list", query] as const,
  workspace: (id: string) => ["investigation", "workspace", id] as const,
  persons: (id: string) => ["investigation", id, "persons"] as const,
  timeline: (id: string) => ["investigation", id, "timeline"] as const,
  contradictions: (id: string) => ["investigation", id, "contradictions"] as const,
  gaps: (id: string) => ["investigation", id, "gaps"] as const,
  tasks: (id: string) => ["investigation", id, "tasks"] as const,
  evidence: (id: string) => ["investigation", id, "evidence"] as const,
  brief: (id: string) => ["investigation", id, "brief"] as const,
};

export function useWorkspaces(query: WorkspaceQuery = {}) {
  return useQuery({
    queryKey: investigationKeys.list(query),
    queryFn: () => investigationApi.list(query),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: investigationKeys.workspace(id),
    queryFn: () => investigationApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: investigationApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useUpdateWorkspace(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title?: string;
      offence?: string;
      sections?: string[];
      status?: WorkspaceStatus;
      priority?: Severity;
      nextCourtDate?: string;
      ioId?: string;
      reassignReason?: string;
    }) => investigationApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* --------------------------------- persons -------------------------------- */

export function usePersons(id: string) {
  return useQuery({
    queryKey: investigationKeys.persons(id),
    queryFn: () => investigationApi.persons.list(id).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof investigationApi.persons.create>[1]) =>
      investigationApi.persons.create(id, body),
    // Adding a witness can open the statement gap — refresh the whole subtree.
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useUpdatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      personId,
      ...body
    }: { personId: string } & Parameters<typeof investigationApi.persons.update>[2]) =>
      investigationApi.persons.update(id, personId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useDeletePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) => investigationApi.persons.remove(id, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* -------------------------------- timeline -------------------------------- */

export function useTimeline(id: string) {
  return useQuery({
    queryKey: investigationKeys.timeline(id),
    queryFn: () => investigationApi.timeline.list(id).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateTimelineEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof investigationApi.timeline.create>[1]) =>
      investigationApi.timeline.create(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useReviewTimelineEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, state }: { entryId: string; state: "accepted" | "rejected" }) =>
      investigationApi.timeline.review(id, entryId, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.timeline(id) }),
  });
}

export function useDeleteTimelineEntry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => investigationApi.timeline.remove(id, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* ----------------------------- contradictions ----------------------------- */

export function useContradictions(id: string) {
  return useQuery({
    queryKey: investigationKeys.contradictions(id),
    queryFn: () => investigationApi.contradictions.list(id).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateContradiction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof investigationApi.contradictions.create>[1]) =>
      investigationApi.contradictions.create(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useReviewContradiction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contradictionId,
      state,
      note,
    }: {
      contradictionId: string;
      state: "accepted" | "rejected";
      note?: string;
    }) => investigationApi.contradictions.review(id, contradictionId, state, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* ----------------------------------- gaps --------------------------------- */

export function useGaps(id: string, includeClosed = false) {
  return useQuery({
    queryKey: [...investigationKeys.gaps(id), includeClosed],
    queryFn: () => investigationApi.gaps.list(id, includeClosed).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useRecomputeGaps(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => investigationApi.gaps.recompute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useCreateGap(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof investigationApi.gaps.create>[1]) =>
      investigationApi.gaps.create(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useSetGapStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gapId, status }: { gapId: string; status: "open" | "closed" | "dismissed" }) =>
      investigationApi.gaps.setStatus(id, gapId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* ---------------------------------- tasks --------------------------------- */

export function useTasks(id: string) {
  return useQuery({
    queryKey: investigationKeys.tasks(id),
    queryFn: () => investigationApi.tasks.list(id).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCreateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof investigationApi.tasks.create>[1]) =>
      investigationApi.tasks.create(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useUpdateTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      ...body
    }: { taskId: string } & Parameters<typeof investigationApi.tasks.update>[2]) =>
      investigationApi.tasks.update(id, taskId, body),
    // Completing a task can close a gap and moves progress — refresh everything.
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useDeleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => investigationApi.tasks.remove(id, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* --------------------------------- evidence ------------------------------- */

export function useWorkspaceEvidence(id: string) {
  return useQuery({
    queryKey: investigationKeys.evidence(id),
    queryFn: () => investigationApi.evidence.list(id).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useLinkEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ evidenceId, note }: { evidenceId: string; note?: string }) =>
      investigationApi.evidence.link(id, evidenceId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

export function useUnlinkEvidence(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (evidenceId: string) => investigationApi.evidence.unlink(id, evidenceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: investigationKeys.all }),
  });
}

/* ----------------------------------- brief -------------------------------- */

export function useBrief(id: string, enabled = true) {
  return useQuery({
    queryKey: investigationKeys.brief(id),
    queryFn: () => investigationApi.brief(id),
    enabled: Boolean(id) && enabled,
  });
}

/* ------------------------- officers and link graph ------------------------ */

/**
 * The assignable-officer directory. Cached for a few minutes: the establishment
 * does not change between keystrokes, and an assignment dialog should not
 * re-query on every render.
 */
export function useOfficers(search?: string, stationId?: string) {
  return useQuery({
    queryKey: ["investigation", "officers", search ?? "", stationId ?? ""],
    queryFn: () => investigationApi.officers(search, stationId).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Relationships recorded on the case, assembled by the server from stored rows. */
export function useLinkGraph(id: string, enabled = true) {
  return useQuery({
    queryKey: ["investigation", id, "links"],
    queryFn: () => investigationApi.links(id),
    enabled: Boolean(id) && enabled,
  });
}
