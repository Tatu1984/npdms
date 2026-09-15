"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import malkhanaApi, {
  type DisposeInput,
  type MoveOutInput,
  type PropertyQuery,
  type RegisterPropertyInput,
  type ReturnInput,
} from "@/lib/api/malkhana";

/**
 * React Query bindings for Phase 14.
 *
 * Invalidations are scoped: a change to one item refreshes that item, its
 * history, the register pages and the dashboard — never every malkhana query,
 * which trips the API's per-minute rate limit during ordinary use.
 */

export const malkhanaKeys = {
  dashboard: (stationId?: string) => ["malkhana", "dashboard", stationId ?? "own"] as const,
  stations: ["malkhana", "stations"] as const,
  locations: (stationId?: string) => ["malkhana", "locations", stationId ?? "own"] as const,
  list: (q: PropertyQuery) => ["malkhana", "items", q] as const,
  lists: ["malkhana", "items"] as const,
  item: (id: string) => ["malkhana", "item", id] as const,
  sealChecks: (id: string) => ["malkhana", "item", id, "seal-checks"] as const,
  movements: (id: string) => ["malkhana", "item", id, "movements"] as const,
  events: (id: string) => ["malkhana", "item", id, "events"] as const,
};

export function useMalkhanaDashboard(stationId?: string) {
  return useQuery({ queryKey: malkhanaKeys.dashboard(stationId), queryFn: () => malkhanaApi.dashboard(stationId) });
}

export function useMalkhanaStations(enabled = true) {
  return useQuery({ queryKey: malkhanaKeys.stations, queryFn: malkhanaApi.stations, enabled, staleTime: 10 * 60_000 });
}

export function useMalkhanaLocations(stationId?: string, enabled = true) {
  return useQuery({ queryKey: malkhanaKeys.locations(stationId), queryFn: () => malkhanaApi.locations(stationId), enabled });
}

export function useProperties(q: PropertyQuery) {
  return useQuery({ queryKey: malkhanaKeys.list(q), queryFn: () => malkhanaApi.list(q) });
}

export function useProperty(id: string) {
  return useQuery({ queryKey: malkhanaKeys.item(id), queryFn: () => malkhanaApi.get(id), enabled: Boolean(id) });
}

export function usePropertySealChecks(id: string) {
  return useQuery({ queryKey: malkhanaKeys.sealChecks(id), queryFn: () => malkhanaApi.sealChecks(id), enabled: Boolean(id) });
}

export function usePropertyMovements(id: string) {
  return useQuery({ queryKey: malkhanaKeys.movements(id), queryFn: () => malkhanaApi.movements(id), enabled: Boolean(id) });
}

export function usePropertyEvents(id: string) {
  return useQuery({ queryKey: malkhanaKeys.events(id), queryFn: () => malkhanaApi.events(id), enabled: Boolean(id) });
}

/** Refresh what a change to one item can affect. */
function useItemRefresh() {
  const qc = useQueryClient();
  return (id: string, parts: { movements?: boolean; sealChecks?: boolean; locations?: boolean } = {}) => {
    qc.invalidateQueries({ queryKey: malkhanaKeys.item(id), exact: true });
    qc.invalidateQueries({ queryKey: malkhanaKeys.events(id) });
    qc.invalidateQueries({ queryKey: malkhanaKeys.lists });
    qc.invalidateQueries({ queryKey: ["malkhana", "dashboard"] });
    if (parts.movements) qc.invalidateQueries({ queryKey: malkhanaKeys.movements(id) });
    if (parts.sealChecks) qc.invalidateQueries({ queryKey: malkhanaKeys.sealChecks(id) });
    if (parts.locations) qc.invalidateQueries({ queryKey: ["malkhana", "locations"] });
  };
}

export function useCreateMalkhanaLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: malkhanaApi.createLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["malkhana", "locations"] });
      qc.invalidateQueries({ queryKey: ["malkhana", "dashboard"] });
    },
  });
}

export function useRegisterProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterPropertyInput) => malkhanaApi.register(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: malkhanaKeys.lists });
      qc.invalidateQueries({ queryKey: ["malkhana", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["malkhana", "locations"] });
    },
  });
}

export function useVerifySeal(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: (input: { sealNumber: string; intact: boolean; note?: string | null }) => malkhanaApi.verifySeal(id, input),
    onSuccess: () => refresh(id, { sealChecks: true }),
  });
}

export function useReseal(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: (input: { reason: string; newSealNumber: string }) => malkhanaApi.reseal(id, input),
    onSuccess: () => refresh(id, { sealChecks: true }),
  });
}

export function useRelocate(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: (input: { locationId: string; reason: string }) => malkhanaApi.relocate(id, input),
    onSuccess: () => refresh(id, { locations: true }),
  });
}

export function useMoveOut(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: (input: MoveOutInput) => malkhanaApi.moveOut(id, input),
    onSuccess: () => refresh(id, { movements: true, sealChecks: true, locations: true }),
  });
}

export function useReturnMovement(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: ({ movementId, input }: { movementId: string; input: ReturnInput }) =>
      malkhanaApi.returnMovement(id, movementId, input),
    onSuccess: () => refresh(id, { movements: true, sealChecks: true, locations: true }),
  });
}

export function useDispose(id: string) {
  const refresh = useItemRefresh();
  return useMutation({
    mutationFn: (input: DisposeInput) => malkhanaApi.dispose(id, input),
    onSuccess: () => refresh(id, { locations: true }),
  });
}
