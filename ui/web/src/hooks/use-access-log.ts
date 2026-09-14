"use client";

import { useQuery } from "@tanstack/react-query";
import accessLogApi, { type AccessQuery } from "@/lib/api/access-log";

/**
 * React Query bindings for the access log. Read-only: sign-in events are
 * written server-side by the auth handler, never from the browser.
 */

export const accessLogKeys = {
  all: ["access-log"] as const,
  list: (query: AccessQuery) => ["access-log", "list", query] as const,
  stats: () => ["access-log", "stats"] as const,
  intel: (ip: string) => ["access-log", "intel", ip] as const,
};

export function useAccessLog(query: AccessQuery, enabled = true) {
  return useQuery({ queryKey: accessLogKeys.list(query), queryFn: () => accessLogApi.list(query), enabled });
}

export function useAccessStats(enabled = true) {
  return useQuery({ queryKey: accessLogKeys.stats(), queryFn: accessLogApi.stats, enabled });
}

/** Runs only when an officer asks for a specific address; each lookup is audited with its purpose. */
export function useIPIntel(ip: string | null, purpose: string) {
  return useQuery({
    queryKey: accessLogKeys.intel(ip ?? ""),
    queryFn: () => accessLogApi.ipIntel(ip!, purpose),
    enabled: Boolean(ip),
    staleTime: 60 * 60 * 1000,
  });
}
