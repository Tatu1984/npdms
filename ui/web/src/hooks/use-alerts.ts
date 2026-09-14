"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import alertsApi, { type Alert, type AlertInput, type AlertQuery } from "@/lib/api/alerts";

/**
 * React Query bindings for alerts. No local fallback: a failed request is an
 * error, never cached or demo alerts. Every mutation invalidates the whole
 * alerts subtree so the active, unacknowledged and full lists stay consistent.
 */

export const alertKeys = {
  all: ["alerts"] as const,
  list: (query: AlertQuery) => ["alerts", "list", query] as const,
  active: () => ["alerts", "active"] as const,
  unacknowledged: () => ["alerts", "unacknowledged"] as const,
  detail: (id: string) => ["alerts", "detail", id] as const,
};

export function useAlerts(query: AlertQuery = {}) {
  return useQuery({ queryKey: alertKeys.list(query), queryFn: () => alertsApi.list(query) });
}

export function useActiveAlerts() {
  return useQuery({ queryKey: alertKeys.active(), queryFn: alertsApi.active });
}

export function useUnacknowledgedAlerts() {
  return useQuery({ queryKey: alertKeys.unacknowledged(), queryFn: alertsApi.unacknowledged });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: alertKeys.detail(id),
    queryFn: () => alertsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AlertInput) => alertsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alert, changes }: { alert: Alert; changes: Partial<AlertInput> }) =>
      alertsApi.update(alert, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertKeys.all }),
  });
}
