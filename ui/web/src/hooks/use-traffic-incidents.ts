"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, {
  type CameraInput,
  type ChildKind,
  type FactInput,
  type IncidentInput,
  type PersonInput,
  type PlateReadInput,
  type SignalPhaseInput,
  type TrafficIncidentQuery,
  type VehicleInput,
} from "@/lib/api/traffic-incidents";

/**
 * React Query bindings for Phase 06. No local fallback. Any write invalidates
 * the whole subtree: an attached record changes the incident's counts, the
 * timeline, the report draft and whether an approved report has drifted.
 */

export const trafficKeys = {
  all: ["traffic-incidents"] as const,
  list: (query: TrafficIncidentQuery) => ["traffic-incidents", "list", query] as const,
  stats: () => ["traffic-incidents", "stats"] as const,
  detail: (id: string) => ["traffic-incidents", "detail", id] as const,
};

export function useTrafficIncidents(query: TrafficIncidentQuery) {
  return useQuery({ queryKey: trafficKeys.list(query), queryFn: () => api.list(query) });
}

export function useTrafficIncidentStats() {
  return useQuery({ queryKey: trafficKeys.stats(), queryFn: api.stats });
}

/**
 * The incident screen reads one workspace response rather than a query per
 * panel: after a write only this refetches, which keeps an officer recording
 * a scene well inside the API's per-minute request limit.
 */
export function useIncidentWorkspace(id: string) {
  return useQuery({ queryKey: trafficKeys.detail(id), queryFn: () => api.workspace(id), enabled: Boolean(id) });
}

function useTrafficMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: trafficKeys.all }),
  });
}

export const useRegisterIncident = () => useTrafficMutation((input: IncidentInput) => api.register(input));
export const useUpdateIncident = () =>
  useTrafficMutation(({ id, input }: { id: string; input: IncidentInput }) => api.update(id, input));
export const useAddVehicle = (id: string) => useTrafficMutation((input: VehicleInput) => api.addVehicle(id, input));
export const useAddPerson = (id: string) => useTrafficMutation((input: PersonInput) => api.addPerson(id, input));
export const useAddCamera = (id: string) => useTrafficMutation((input: CameraInput) => api.addCamera(id, input));
export const useAddPlateRead = (id: string) =>
  useTrafficMutation((input: PlateReadInput) => api.addPlateRead(id, input));
export const useAddSignalPhase = (id: string) =>
  useTrafficMutation((input: SignalPhaseInput) => api.addSignalPhase(id, input));
export const useAddFact = (id: string) => useTrafficMutation((input: FactInput) => api.addFact(id, input));
export const useRemoveIncidentRecord = (id: string) =>
  useTrafficMutation(({ kind, recordId }: { kind: ChildKind; recordId: string }) => api.remove(id, kind, recordId));

export const useCreateReport = (id: string) => useTrafficMutation((findings: string) => api.createReport(id, findings));
export const useUpdateReport = (id: string) =>
  useTrafficMutation(({ reportId, findings }: { reportId: string; findings: string }) =>
    api.updateReport(id, reportId, findings));
export const useSubmitReport = (id: string) => useTrafficMutation((reportId: string) => api.submitReport(id, reportId));
export const useApproveReport = (id: string) =>
  useTrafficMutation((reportId: string) => api.approveReport(id, reportId));
export const useReturnReport = (id: string) =>
  useTrafficMutation(({ reportId, reason }: { reportId: string; reason: string }) =>
    api.returnReport(id, reportId, reason));
