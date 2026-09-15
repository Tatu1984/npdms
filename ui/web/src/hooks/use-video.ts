"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import videoApi, {
  type CameraInput,
  type CameraQuery,
  type CameraUpdateInput,
  type EventSearch,
  type RaiseEventInput,
  type RetentionClass,
} from "@/lib/api/video";

/**
 * React Query bindings for Phase 03. No local fallback.
 *
 * Event searches are purpose-logged on the server, so they never refetch on
 * their own — every recorded search is one the officer actually ran.
 */

export const videoKeys = {
  all: ["video"] as const,
  cameras: (query: CameraQuery) => ["video", "cameras", query] as const,
  camera: (id: string) => ["video", "camera", id] as const,
  cameraStats: () => ["video", "camera-stats"] as const,
  healthChecks: (id: string) => ["video", "health-checks", id] as const,
  eventStats: () => ["video", "event-stats"] as const,
  search: (search: EventSearch) => ["video", "events", search] as const,
  accessLog: (page: number) => ["video", "access-log", page] as const,
};

export function useCameras(query: CameraQuery = {}) {
  return useQuery({ queryKey: videoKeys.cameras(query), queryFn: () => videoApi.cameras(query) });
}

export function useCamera(id: string | null) {
  return useQuery({
    queryKey: videoKeys.camera(id ?? ""),
    queryFn: () => videoApi.camera(id!),
    enabled: Boolean(id),
  });
}

export function useCameraStats() {
  return useQuery({ queryKey: videoKeys.cameraStats(), queryFn: videoApi.cameraStats });
}

export function useHealthChecks(id: string | null) {
  return useQuery({
    queryKey: videoKeys.healthChecks(id ?? ""),
    queryFn: () => videoApi.healthChecks(id!),
    enabled: Boolean(id),
  });
}

export function useVideoEventStats() {
  return useQuery({ queryKey: videoKeys.eventStats(), queryFn: videoApi.eventStats });
}

/** Runs only when a purpose is present; each run is recorded server-side. */
export function useEventSearch(search: EventSearch | null) {
  return useQuery({
    queryKey: videoKeys.search(search ?? { purpose: "" }),
    queryFn: () => videoApi.searchEvents(search!),
    enabled: Boolean(search?.purpose),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
}

export function useVideoAccessLog(page: number, enabled: boolean) {
  return useQuery({
    queryKey: videoKeys.accessLog(page),
    queryFn: () => videoApi.accessLog({ page, pageSize: 20 }),
    enabled,
  });
}

function useVideoMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // A write changes counts, health and event lists together. Searches are
    // refreshed too, so the list shown reflects the change; that refresh is
    // itself a purpose-logged search under the same stated purpose.
    onSuccess: () => qc.invalidateQueries({ queryKey: videoKeys.all }),
  });
}

export const useRegisterCamera = () => useVideoMutation((input: CameraInput) => videoApi.registerCamera(input));

export const useUpdateCamera = () =>
  useVideoMutation(({ id, input }: { id: string; input: CameraUpdateInput }) => videoApi.updateCamera(id, input));

export const useDecommissionCamera = () =>
  useVideoMutation(({ id, note }: { id: string; note: string }) => videoApi.decommission(id, note));

export const useCheckCameraHealth = () => useVideoMutation((id: string) => videoApi.checkHealth(id));

export const useRaiseVideoEvent = () => useVideoMutation((input: RaiseEventInput) => videoApi.raiseEvent(input));

export const useOpenVideoEvent = () =>
  useMutation({ mutationFn: ({ id, purpose }: { id: string; purpose: string }) => videoApi.openEvent(id, purpose) });

export const useTriageVideoEvent = () =>
  useVideoMutation(({ id, decision, note }: { id: string; decision: "CONFIRMED" | "DISMISSED"; note: string }) =>
    videoApi.triage(id, decision, note)
  );

export const useLinkVideoEvent = () =>
  useVideoMutation(({ id, firId, caseId }: { id: string; firId?: string; caseId?: string }) =>
    videoApi.link(id, { firId, caseId })
  );

export const useSetEventRetention = () =>
  useVideoMutation(
    ({ id, retentionClass, maskingRequired, reason }: { id: string; retentionClass: RetentionClass; maskingRequired: boolean; reason: string }) =>
      videoApi.setRetention(id, retentionClass, maskingRequired, reason)
  );

export const usePurgeExpiredEvents = () => useVideoMutation((_: void) => videoApi.purgeExpired());
