"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import complaintsApi, { type ComplaintIntake, type ComplaintQuery } from "@/lib/api/complaints";

/**
 * React Query bindings for the Phase 09 complaint register.
 *
 * Every action can change counts, history and the citizen-visible record at
 * once, so each mutation invalidates the whole complaints subtree.
 */

export const complaintKeys = {
  all: ["complaints"] as const,
  list: (q: ComplaintQuery) => ["complaints", "list", q] as const,
  item: (id: string) => ["complaints", "item", id] as const,
  duplicates: (id: string) => ["complaints", "duplicates", id] as const,
  stats: ["complaints", "stats"] as const,
  targets: ["complaints", "routing-targets"] as const,
};

export function useComplaints(query: ComplaintQuery) {
  return useQuery({ queryKey: complaintKeys.list(query), queryFn: () => complaintsApi.list(query) });
}

export function useComplaintStats() {
  return useQuery({ queryKey: complaintKeys.stats, queryFn: complaintsApi.stats });
}

export function useComplaint(id: string | null) {
  return useQuery({
    queryKey: complaintKeys.item(id ?? ""),
    queryFn: () => complaintsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useDuplicateCandidates(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: complaintKeys.duplicates(id ?? ""),
    queryFn: () => complaintsApi.duplicateCandidates(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useRoutingTargets(enabled: boolean) {
  return useQuery({
    queryKey: complaintKeys.targets,
    queryFn: complaintsApi.routingTargets,
    enabled,
    staleTime: 5 * 60_000,
  });
}

// Invalidate only what an action can change — the item acted on, the list
// and the counts — never routing targets or other items' duplicate lists,
// which would add requests against the per-minute rate limit.
function useInvalidating<TArgs extends object, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, args) => {
      const id = (args as { id?: string }).id;
      if (id) qc.invalidateQueries({ queryKey: complaintKeys.item(id) });
      const original = (args as { originalId?: string }).originalId;
      if (original) qc.invalidateQueries({ queryKey: complaintKeys.item(original) });
      qc.invalidateQueries({ queryKey: ["complaints", "list"] });
      qc.invalidateQueries({ queryKey: complaintKeys.stats });
    },
  });
}

export const useRecordComplaint = () => useInvalidating((input: ComplaintIntake) => complaintsApi.record(input));

export const useCategoriseComplaint = () =>
  useInvalidating((a: { id: string; category: Parameters<typeof complaintsApi.categorise>[1]; priority: Parameters<typeof complaintsApi.categorise>[2] }) =>
    complaintsApi.categorise(a.id, a.category, a.priority),
  );

export const useRouteComplaint = () =>
  useInvalidating((a: { id: string } & Parameters<typeof complaintsApi.route>[1]) => {
    const { id, ...body } = a;
    return complaintsApi.route(id, body);
  });

export const useSetComplaintStatus = () =>
  useInvalidating((a: { id: string } & Parameters<typeof complaintsApi.setStatus>[1]) => {
    const { id, ...body } = a;
    return complaintsApi.setStatus(id, body);
  });

export const useAddComplaintNote = () =>
  useInvalidating((a: { id: string; note: string }) => complaintsApi.addNote(a.id, a.note));

export const useLinkDuplicate = () =>
  useInvalidating((a: { id: string; originalId: string; note: string }) =>
    complaintsApi.linkDuplicate(a.id, a.originalId, a.note),
  );

export const useLinkComplaintFIR = () =>
  useInvalidating((a: { id: string; firId: string }) => complaintsApi.linkFIR(a.id, a.firId));

export const useDraftResponse = () =>
  useInvalidating((a: { id: string; body: string }) => complaintsApi.draftResponse(a.id, a.body));

export const useReviewResponse = () =>
  useInvalidating((a: { id: string; responseId: string; approve: boolean; note?: string | null }) =>
    complaintsApi.reviewResponse(a.id, a.responseId, a.approve, a.note),
  );
