"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dispatchApi, {
  type CreateIncidentInput,
  type IncidentOutcome,
  type IncidentQuery,
  type IncidentSeverity,
  type UnitKind,
} from "@/lib/api/dispatch";

/**
 * React Query bindings for Phase 07.
 *
 * The board is live state, so reads refetch on an interval rather than
 * waiting for a focus change. Every mutation invalidates the whole dispatch
 * subtree: an assignment changes the incident, the unit list and the counts
 * together, and none of them may disagree with the others.
 */

const LIVE_MS = 30_000;

export const dispatchKeys = {
  all: ["dispatch"] as const,
  policy: () => ["dispatch-policy"] as const,
  stats: () => ["dispatch", "stats"] as const,
  incidents: (query: IncidentQuery) => ["dispatch", "incidents", query] as const,
  incident: (id: string) => ["dispatch", "incident", id] as const,
  events: (id: string) => ["dispatch", "events", id] as const,
  units: (incidentId?: string) => ["dispatch", "units", incidentId ?? "all"] as const,
  analytics: (from: string, to: string) => ["dispatch", "analytics", from, to] as const,
};

export function useDispatchPolicy() {
  return useQuery({ queryKey: dispatchKeys.policy(), queryFn: dispatchApi.policy, staleTime: Infinity });
}

export function useDispatchStats() {
  return useQuery({ queryKey: dispatchKeys.stats(), queryFn: dispatchApi.stats, refetchInterval: LIVE_MS });
}

export function useIncidents(query: IncidentQuery) {
  return useQuery({
    queryKey: dispatchKeys.incidents(query),
    queryFn: () => dispatchApi.incidents(query),
    refetchInterval: LIVE_MS,
  });
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: dispatchKeys.incident(id ?? ""),
    queryFn: () => dispatchApi.incident(id as string),
    enabled: Boolean(id),
    refetchInterval: LIVE_MS,
  });
}

export function useIncidentEvents(id: string | null) {
  return useQuery({
    queryKey: dispatchKeys.events(id ?? ""),
    queryFn: () => dispatchApi.events(id as string),
    enabled: Boolean(id),
    refetchInterval: LIVE_MS,
  });
}

export function useDispatchUnits(incidentId?: string, enabled = true) {
  return useQuery({
    queryKey: dispatchKeys.units(incidentId),
    queryFn: () => dispatchApi.units(incidentId),
    enabled,
    refetchInterval: LIVE_MS,
  });
}

export function useDispatchAnalytics(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: dispatchKeys.analytics(from, to),
    queryFn: () => dispatchApi.analytics(from, to),
    enabled,
  });
}

/**
 * Refetch only the open incident, its timeline and its unit list at once. The
 * board lists and counts are marked stale and pick the change up on their next
 * interval, so one action costs three requests rather than a refetch of every
 * dispatch query (which trips the API's per-minute limit in normal use).
 */
function useDispatchMutation<TVars extends object, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result, vars) => {
      // An assignment carries incidentId; an incident is its own id.
      const r = result as { incidentId?: string; incidentNumber?: string; id?: string };
      const incidentId = r.incidentId ?? (r.incidentNumber ? r.id : (vars as { id?: string }).id);
      if (incidentId) {
        qc.invalidateQueries({ queryKey: dispatchKeys.incident(incidentId) });
        qc.invalidateQueries({ queryKey: dispatchKeys.events(incidentId) });
        qc.invalidateQueries({ queryKey: dispatchKeys.units(incidentId) });
      }
      qc.invalidateQueries({ queryKey: ["dispatch", "incidents"], refetchType: "none" });
      qc.invalidateQueries({ queryKey: dispatchKeys.stats(), refetchType: "none" });
      qc.invalidateQueries({ queryKey: dispatchKeys.units(), refetchType: "none" });
    },
  });
}

export const useIntakeIncident = () => useDispatchMutation((input: CreateIncidentInput) => dispatchApi.intake(input));

export const useClassifyIncident = () =>
  useDispatchMutation((v: { id: string; incidentType: string; severity: IncidentSeverity }) =>
    dispatchApi.classify(v.id, v.incidentType, v.severity),
  );

export const useAssignUnit = () =>
  useDispatchMutation((v: { id: string; kind: UnitKind; unitId: string }) => dispatchApi.assign(v.id, v.kind, v.unitId));

export const useUnitStep = () =>
  useDispatchMutation((v: { assignmentId: string; step: "acknowledge" | "onScene" | "clear" }) =>
    dispatchApi[v.step](v.assignmentId),
  );

export const useStandDown = () =>
  useDispatchMutation((v: { assignmentId: string; reason: string }) => dispatchApi.standDown(v.assignmentId, v.reason));

export const useEscalateIncident = () =>
  useDispatchMutation((v: { id: string; reason: string }) => dispatchApi.escalate(v.id, v.reason));

export const useCloseIncident = () =>
  useDispatchMutation((v: { id: string; outcome: IncidentOutcome; note: string; firId?: string | null }) =>
    dispatchApi.close(v.id, v.outcome, v.note, v.firId),
  );
