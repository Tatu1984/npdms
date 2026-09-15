"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import anprApi, { type HitStatus, type ReadSearch, type SubmitAnalysisInput, type WatchPriority } from "@/lib/api/anpr";

/**
 * React Query bindings for vehicle detection. No local fallback and no
 * placeholder results. Mutations invalidate only what they change.
 */

export const anprKeys = {
  all: ["anpr"] as const,
  status: () => ["anpr", "status"] as const,
  analyses: (page: number) => ["anpr", "analyses", page] as const,
  analysisLists: () => ["anpr", "analyses"] as const,
  search: (q: ReadSearch) => ["anpr", "search", q] as const,
  watchlist: (includeClosed: boolean) => ["anpr", "watchlist", includeClosed] as const,
  watchlists: () => ["anpr", "watchlist"] as const,
  hits: (status: string, page: number) => ["anpr", "hits", status, page] as const,
  hitLists: () => ["anpr", "hits"] as const,
  map: () => ["anpr", "map"] as const,
  accessLog: (page: number) => ["anpr", "access-log", page] as const,
};

export function useAnprStatus() {
  // The service can come and go; a minute is fresh enough for a banner.
  return useQuery({ queryKey: anprKeys.status(), queryFn: anprApi.status, refetchInterval: 60_000 });
}

export function useSetAnprSwitch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enabled, note }: { enabled: boolean; note: string }) => anprApi.setSwitch(enabled, note),
    onSuccess: (status) => qc.setQueryData(anprKeys.status(), status),
  });
}

export function useSubmitAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAnalysisInput) => anprApi.submit(input),
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: anprKeys.analysisLists() });
      qc.invalidateQueries({ queryKey: anprKeys.map() });
      if (a.hitCount > 0) qc.invalidateQueries({ queryKey: anprKeys.hitLists() });
    },
  });
}

export function useAnalyses(page: number, pageSize: number) {
  return useQuery({ queryKey: anprKeys.analyses(page), queryFn: () => anprApi.analyses(page, pageSize) });
}

export function useOpenAnalysis() {
  return useMutation({ mutationFn: ({ id, purpose }: { id: string; purpose: string }) => anprApi.open(id, purpose) });
}

export function useReadSearch(search: ReadSearch | null) {
  return useQuery({
    queryKey: anprKeys.search(search ?? { purpose: "" }),
    queryFn: () => anprApi.search(search!),
    enabled: Boolean(search?.purpose),
    // Each run is purpose-logged, so it runs only when the officer asks.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
}

export function useWatchlist(includeClosed: boolean) {
  return useQuery({ queryKey: anprKeys.watchlist(includeClosed), queryFn: () => anprApi.watchlist(includeClosed) });
}

export function useAddWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { registrationNumber: string; reason: string; priority: WatchPriority; expiresAt: string }) =>
      anprApi.addWatch(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: anprKeys.watchlists() }),
  });
}

export function useRemoveWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => anprApi.removeWatch(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: anprKeys.watchlists() }),
  });
}

export function useHits(status: "" | HitStatus, page: number, pageSize: number) {
  return useQuery({ queryKey: anprKeys.hits(status, page), queryFn: () => anprApi.hits(status, page, pageSize) });
}

export function useReviewHit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "CONFIRMED" | "DISMISSED"; note: string }) =>
      anprApi.review(id, decision, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: anprKeys.hitLists() });
      qc.invalidateQueries({ queryKey: anprKeys.map() });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["lookouts"] });
    },
  });
}

export function useReadsMap() {
  return useQuery({ queryKey: anprKeys.map(), queryFn: anprApi.map });
}

export function useAnprAccessLog(page: number, enabled: boolean) {
  return useQuery({ queryKey: anprKeys.accessLog(page), queryFn: () => anprApi.accessLog(page), enabled });
}
