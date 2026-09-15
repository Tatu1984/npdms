"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import riskApi, { type RiskQuery } from "@/lib/api/risk";

/**
 * React Query bindings for Phase 10.
 *
 * Invalidations are scoped to what a change affects: weights change scores and
 * recommendations; beats and placements change beat scores and the FIR list.
 * Invalidating the whole module on every change trips the API rate limit.
 */

export const riskKeys = {
  factors: ["risk", "factors"] as const,
  history: ["risk", "weights", "history"] as const,
  areas: (q: RiskQuery) => ["risk", "areas", q] as const,
  recommendations: (q: RiskQuery, top: number) => ["risk", "recommendations", q, top] as const,
  beats: (stationId?: string) => ["risk", "beats", stationId ?? "all"] as const,
  firs: (stationId: string, from?: string, to?: string, unplaced?: boolean) =>
    ["risk", "firs", stationId, from, to, unplaced] as const,
};

export function useRiskFactors(enabled = true) {
  return useQuery({ queryKey: riskKeys.factors, queryFn: riskApi.factors, enabled });
}

export function useRiskWeightHistory(enabled: boolean) {
  return useQuery({ queryKey: riskKeys.history, queryFn: riskApi.weightHistory, enabled });
}

export function useRiskAreas(q: RiskQuery, enabled = true) {
  return useQuery({ queryKey: riskKeys.areas(q), queryFn: () => riskApi.areas(q), enabled });
}

export function useRiskRecommendations(q: RiskQuery, top: number, enabled = true) {
  return useQuery({
    queryKey: riskKeys.recommendations(q, top),
    queryFn: () => riskApi.recommendations(q, top),
    enabled,
  });
}

export function useRiskBeats(stationId: string | undefined, enabled = true) {
  return useQuery({ queryKey: riskKeys.beats(stationId), queryFn: () => riskApi.beats(stationId), enabled });
}

export function useRiskFIRs(stationId: string | undefined, from: string | undefined, to: string | undefined, unplaced: boolean) {
  return useQuery({
    queryKey: riskKeys.firs(stationId ?? "", from, to, unplaced),
    queryFn: () => riskApi.firs(stationId!, from, to, unplaced),
    enabled: Boolean(stationId),
  });
}

export function useSimulateRisk() {
  return useMutation({
    mutationFn: ({ q, allocations }: { q: RiskQuery; allocations: { areaId: string; units: number }[] }) =>
      riskApi.simulate(q, allocations),
  });
}

export function useUpdateRiskWeights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weights, reason }: { weights: Record<string, number>; reason: string }) =>
      riskApi.updateWeights(weights, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: riskKeys.factors });
      qc.invalidateQueries({ queryKey: riskKeys.history });
      qc.invalidateQueries({ queryKey: ["risk", "areas"] });
      qc.invalidateQueries({ queryKey: ["risk", "recommendations"] });
    },
  });
}

/** Beat and placement changes affect beat-level scores, beats and FIR lists only. */
function useBeatMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk", "beats"] });
      qc.invalidateQueries({ queryKey: ["risk", "firs"] });
      qc.invalidateQueries({ predicate: (query) => {
        const [root, kind, q] = query.queryKey as [string, string, { level?: string } | undefined];
        return root === "risk" && (kind === "areas" || kind === "recommendations") && q?.level === "beat";
      } });
    },
  });
}

export const useCreateRiskBeat = () => useBeatMutation(riskApi.createBeat);
export const useDeleteRiskBeat = () => useBeatMutation(riskApi.deleteBeat);
export const usePlaceRiskFIR = () =>
  useBeatMutation(({ firId, beatId }: { firId: string; beatId: string }) => riskApi.place(firId, beatId));
export const useUnplaceRiskFIR = () => useBeatMutation(riskApi.unplace);
