"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courtApi, { type OrderInput, type OrderQuery } from "@/lib/api/court";
import { courtKeys } from "./use-court-hearings";

/**
 * React Query bindings for court orders. No local fallback, as for hearings.
 * The API has no order update or delete — an order, once recorded, stands.
 */

export const courtOrderKeys = {
  all: ["court", "orders"] as const,
  list: (query: OrderQuery) => ["court", "orders", "list", query] as const,
  detail: (id: string) => ["court", "orders", "detail", id] as const,
};

export function useCourtOrders(query: OrderQuery = {}) {
  return useQuery({
    queryKey: courtOrderKeys.list(query),
    queryFn: () => courtApi.orders(query),
  });
}

export function useCourtOrder(id: string) {
  return useQuery({
    queryKey: courtOrderKeys.detail(id),
    queryFn: () => courtApi.order(id),
    enabled: Boolean(id),
  });
}

export function useCreateCourtOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) => courtApi.createOrder(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: courtKeys.all }),
  });
}
