"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import armouryApi, {
  type IssueWeaponInput,
  type RegisterWeaponInput,
  type ReturnWeaponInput,
  type SetWeaponStateInput,
  type WeaponQuery,
} from "@/lib/api/armoury";

/**
 * React Query bindings for the armoury. No local fallback. Every write
 * invalidates the whole subtree: an issue or return changes the weapon, the
 * ledger and the stats together.
 */

export const armouryKeys = {
  all: ["armoury"] as const,
  list: (query: WeaponQuery) => ["armoury", "list", query] as const,
  detail: (id: string) => ["armoury", "detail", id] as const,
  stats: () => ["armoury", "stats"] as const,
  issuances: (id: string, page: number) => ["armoury", "issuances", id, page] as const,
};

export function useWeapons(query: WeaponQuery = {}) {
  return useQuery({ queryKey: armouryKeys.list(query), queryFn: () => armouryApi.list(query) });
}

export function useWeapon(id: string) {
  return useQuery({ queryKey: armouryKeys.detail(id), queryFn: () => armouryApi.get(id), enabled: Boolean(id) });
}

export function useWeaponStats() {
  return useQuery({ queryKey: armouryKeys.stats(), queryFn: armouryApi.stats });
}

export function useWeaponIssuances(id: string, page = 1) {
  return useQuery({
    queryKey: armouryKeys.issuances(id, page),
    queryFn: () => armouryApi.issuances(id, page),
    enabled: Boolean(id),
  });
}

export function useWeaponLedger(page = 1, openOnly = false) {
  return useQuery({
    queryKey: ["armoury", "ledger", page, openOnly] as const,
    queryFn: () => armouryApi.ledger(page, 20, openOnly),
  });
}

function useArmouryMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: armouryKeys.all }),
  });
}

export const useRegisterWeapon = () => useArmouryMutation((input: RegisterWeaponInput) => armouryApi.register(input));

export const useSetWeaponState = () =>
  useArmouryMutation(({ id, input }: { id: string; input: SetWeaponStateInput }) => armouryApi.setState(id, input));

export const useIssueWeapon = () =>
  useArmouryMutation(({ id, input }: { id: string; input: IssueWeaponInput }) => armouryApi.issue(id, input));

export const useReturnWeapon = () =>
  useArmouryMutation(({ id, input }: { id: string; input: ReturnWeaponInput }) => armouryApi.return(id, input));
