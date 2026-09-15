"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import cyberFraudApi, {
  type ComplaintInput,
  type ComplaintQuery,
  type ComplaintStatus,
  type DraftFreezeInput,
  type EntityType,
  type FreezeTransition,
  type RecordEntityInput,
  type RecordRecoveryInput,
  type RecordTransactionInput,
} from "@/lib/api/cyber-fraud";

/**
 * React Query bindings for Phase 05. No fallback: a failed request is an
 * error on screen, never local data.
 */

export const cyberKeys = {
  all: ["cyber"] as const,
  list: (q: ComplaintQuery) => ["cyber", "list", q] as const,
  dashboard: () => ["cyber", "dashboard"] as const,
  clusters: () => ["cyber", "clusters"] as const,
  entitySearch: (type: string, q: string) => ["cyber", "entity-search", type, q] as const,
  complaint: (id: string) => ["cyber", "complaint", id] as const,
  entities: (id: string) => ["cyber", id, "entities"] as const,
  transactions: (id: string) => ["cyber", id, "transactions"] as const,
  freezes: (id: string) => ["cyber", id, "freezes"] as const,
  recoveries: (id: string) => ["cyber", id, "recoveries"] as const,
  network: (id: string) => ["cyber", id, "network"] as const,
};

export function useComplaints(q: ComplaintQuery) {
  return useQuery({ queryKey: cyberKeys.list(q), queryFn: () => cyberFraudApi.list(q) });
}

export function useFraudDashboard() {
  return useQuery({ queryKey: cyberKeys.dashboard(), queryFn: cyberFraudApi.dashboard });
}

export function useComplaintClusters(enabled = true) {
  return useQuery({ queryKey: cyberKeys.clusters(), queryFn: cyberFraudApi.clusters, enabled });
}

export function useEntitySearch(type: EntityType | "", q: string, enabled = true) {
  return useQuery({
    queryKey: cyberKeys.entitySearch(type, q),
    queryFn: () => cyberFraudApi.searchEntities(type, q),
    enabled,
  });
}

export function useComplaint(id: string) {
  return useQuery({ queryKey: cyberKeys.complaint(id), queryFn: () => cyberFraudApi.get(id), enabled: Boolean(id) });
}

export function useComplaintEntities(id: string) {
  return useQuery({ queryKey: cyberKeys.entities(id), queryFn: () => cyberFraudApi.entities(id), enabled: Boolean(id) });
}

export function useTransactions(id: string) {
  return useQuery({
    queryKey: cyberKeys.transactions(id),
    queryFn: () => cyberFraudApi.transactions(id),
    enabled: Boolean(id),
  });
}

export function useFreezeRequests(id: string) {
  return useQuery({ queryKey: cyberKeys.freezes(id), queryFn: () => cyberFraudApi.freezeRequests(id), enabled: Boolean(id) });
}

export function useRecoveries(id: string) {
  return useQuery({ queryKey: cyberKeys.recoveries(id), queryFn: () => cyberFraudApi.recoveries(id), enabled: Boolean(id) });
}

export function useFraudNetwork(id: string, enabled = true) {
  return useQuery({ queryKey: cyberKeys.network(id), queryFn: () => cyberFraudApi.network(id), enabled: Boolean(id) && enabled });
}

type KeyOf = readonly unknown[];

/**
 * Each mutation refreshes only what it can change. Invalidating the whole
 * cyber subtree after every step multiplied reads enough to trip the API's
 * per-address rate limit during ordinary use of one complaint.
 */
function useCyberMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>, affected: (vars: TVars) => KeyOf[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_result, vars) =>
      Promise.all(affected(vars).map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

const totals = (id: string): KeyOf[] => [cyberKeys.complaint(id), ["cyber", "list"], cyberKeys.dashboard()];

export const useRegisterComplaint = () =>
  useCyberMutation((input: ComplaintInput) => cyberFraudApi.register(input), () => [["cyber", "list"], cyberKeys.dashboard()]);

export const useUpdateComplaint = () =>
  useCyberMutation(
    ({ id, input }: { id: string; input: ComplaintInput }) => cyberFraudApi.update(id, input),
    ({ id }) => [...totals(id), cyberKeys.clusters()],
  );

export const useSetComplaintStatus = () =>
  useCyberMutation(
    ({ id, status }: { id: string; status: ComplaintStatus }) => cyberFraudApi.setStatus(id, status),
    ({ id }) => totals(id),
  );

export const useRecordEntity = () =>
  useCyberMutation(
    ({ id, input }: { id: string; input: RecordEntityInput }) => cyberFraudApi.recordEntity(id, input),
    ({ id }) => [...totals(id), cyberKeys.entities(id), cyberKeys.network(id), cyberKeys.clusters()],
  );

export const useRemoveEntity = () =>
  useCyberMutation(
    ({ id, linkId }: { id: string; linkId: string }) => cyberFraudApi.removeEntity(id, linkId),
    ({ id }) => [...totals(id), cyberKeys.entities(id), cyberKeys.network(id), cyberKeys.clusters()],
  );

export const useRecordTransaction = () =>
  useCyberMutation(
    ({ id, input }: { id: string; input: RecordTransactionInput }) => cyberFraudApi.recordTransaction(id, input),
    ({ id }) => [cyberKeys.transactions(id), cyberKeys.network(id)],
  );

export const useDraftFreeze = () =>
  useCyberMutation(
    ({ id, input }: { id: string; input: DraftFreezeInput }) => cyberFraudApi.draftFreeze(id, input),
    ({ id }) => [cyberKeys.freezes(id), cyberKeys.dashboard()],
  );

export const useTransitionFreeze = () =>
  useCyberMutation(
    ({ id, freezeId, step }: { id: string; freezeId: string; step: FreezeTransition }) =>
      cyberFraudApi.transitionFreeze(id, freezeId, step),
    ({ id }) => [cyberKeys.freezes(id), ...totals(id)],
  );

export const useRecordRecovery = () =>
  useCyberMutation(
    ({ id, input }: { id: string; input: RecordRecoveryInput }) => cyberFraudApi.recordRecovery(id, input),
    ({ id }) => [cyberKeys.recoveries(id), ...totals(id)],
  );
