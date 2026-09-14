"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import vehiclesApi, { type Vehicle, type VehicleInput, type VehicleQuery } from "@/lib/api/vehicles";

/**
 * React Query bindings for fleet vehicles.
 *
 * No local fallback: a failed request surfaces as an error, never as demo
 * vehicles or a write that only happened in the browser. Every mutation
 * invalidates the whole vehicles subtree so the table and the status counts
 * cannot disagree with the record just changed.
 */

export const vehicleKeys = {
  all: ["vehicles"] as const,
  list: (query: VehicleQuery) => ["vehicles", "list", query] as const,
  detail: (id: string) => ["vehicles", "detail", id] as const,
  counts: () => ["vehicles", "counts"] as const,
};

export function useVehicles(query: VehicleQuery = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(query),
    queryFn: () => vehiclesApi.list(query),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useVehicleCounts() {
  return useQuery({
    queryKey: vehicleKeys.counts(),
    queryFn: vehiclesApi.counts,
  });
}

function useInvalidatingMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useCreateVehicle() {
  return useInvalidatingMutation((input: VehicleInput) => vehiclesApi.create(input));
}

export function useUpdateVehicle() {
  return useInvalidatingMutation(({ vehicle, changes }: { vehicle: Vehicle; changes: Partial<VehicleInput> }) =>
    vehiclesApi.update(vehicle, changes)
  );
}

export function useAllocateVehicle() {
  return useInvalidatingMutation(({ id, driverId, duty }: { id: string; driverId: string; duty: string }) =>
    vehiclesApi.allocate(id, driverId, duty)
  );
}

export function useReturnVehicle() {
  return useInvalidatingMutation((id: string) => vehiclesApi.release(id));
}

export function useDeleteVehicle() {
  return useInvalidatingMutation((id: string) => vehiclesApi.remove(id));
}
