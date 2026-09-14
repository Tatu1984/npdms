"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import lookoutsApi, {
  type IssueLookoutInput,
  type LookoutQuery,
  type ReportSightingInput,
  type ResolveLookoutInput,
} from "@/lib/api/lookouts";

/**
 * React Query bindings for lookout notices. No local fallback. Writes
 * invalidate the whole subtree, since a sighting changes the notice's counts
 * and the stats as well as the sighting list.
 */

export const lookoutKeys = {
  all: ["lookouts"] as const,
  list: (query: LookoutQuery) => ["lookouts", "list", query] as const,
  detail: (id: string) => ["lookouts", "detail", id] as const,
  sightings: (id: string) => ["lookouts", "sightings", id] as const,
  stats: () => ["lookouts", "stats"] as const,
};

export function useLookouts(query: LookoutQuery = {}) {
  return useQuery({ queryKey: lookoutKeys.list(query), queryFn: () => lookoutsApi.list(query) });
}

export function useLookout(id: string) {
  return useQuery({ queryKey: lookoutKeys.detail(id), queryFn: () => lookoutsApi.get(id), enabled: Boolean(id) });
}

export function useLookoutSightings(id: string) {
  return useQuery({ queryKey: lookoutKeys.sightings(id), queryFn: () => lookoutsApi.sightings(id), enabled: Boolean(id) });
}

export function useLookoutStats() {
  return useQuery({ queryKey: lookoutKeys.stats(), queryFn: lookoutsApi.stats });
}

function useLookoutMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: lookoutKeys.all }),
  });
}

export const useIssueLookout = () => useLookoutMutation((input: IssueLookoutInput) => lookoutsApi.issue(input));

export const useReportSighting = () =>
  useLookoutMutation(({ id, input }: { id: string; input: ReportSightingInput }) =>
    lookoutsApi.reportSighting(id, input)
  );

export const useVerifySighting = () =>
  useLookoutMutation(({ id, sightingId }: { id: string; sightingId: string }) =>
    lookoutsApi.verifySighting(id, sightingId)
  );

export const useResolveLookout = () =>
  useLookoutMutation(({ id, input }: { id: string; input: ResolveLookoutInput }) => lookoutsApi.resolve(id, input));
