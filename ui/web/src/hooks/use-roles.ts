import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import rolesApi, { type RoleInput } from "@/lib/api/roles";

export const roleKeys = {
  all: ["roles"] as const,
  list: ["roles", "list"] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
  catalogue: ["roles", "catalogue"] as const,
  mine: ["roles", "mine"] as const,
  ofOfficer: (officerId: string) => ["roles", "officer", officerId] as const,
};

/**
 * The permission catalogue. It changes only when a migration adds a
 * capability, so it is worth holding rather than refetching per screen.
 */
export function usePermissionCatalogue(enabled = true) {
  return useQuery({
    queryKey: roleKeys.catalogue,
    queryFn: () => rolesApi.catalogue(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: roleKeys.list,
    queryFn: () => rolesApi.list(),
    enabled,
  });
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? ""),
    queryFn: () => rolesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useRolesOfOfficer(officerId: string | undefined) {
  return useQuery({
    queryKey: roleKeys.ofOfficer(officerId ?? ""),
    queryFn: () => rolesApi.rolesOf(officerId as string),
    enabled: Boolean(officerId),
  });
}

/**
 * What the signed-in officer may do.
 *
 * Used to hide a control rather than offer one the server will refuse. The
 * refusal still stands on the server either way — this is a courtesy, not the
 * check, and nothing here should be mistaken for security.
 */
export function useMyPermissions() {
  return useQuery({
    queryKey: roleKeys.mine,
    queryFn: () => rolesApi.mine(),
    staleTime: 60 * 1000,
  });
}

/**
 * The refresh is started, not awaited — the same reasoning as the officer
 * mutations: a refetch that fails must not fail a mutation that had already
 * succeeded.
 */
function useRoleMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export const useCreateRole = () => useRoleMutation((input: RoleInput) => rolesApi.create(input));

export const useUpdateRole = () =>
  useRoleMutation(({ id, input }: { id: string; input: RoleInput }) => rolesApi.update(id, input));

export const useDeleteRole = () => useRoleMutation((id: string) => rolesApi.remove(id));

export const useSetRolePermissions = () =>
  useRoleMutation(({ id, permissions }: { id: string; permissions: string[] }) =>
    rolesApi.setPermissions(id, permissions),
  );

export const useAssignRole = () =>
  useRoleMutation(({ officerId, roleId }: { officerId: string; roleId: string }) =>
    rolesApi.assign(officerId, roleId),
  );

export const useUnassignRole = () =>
  useRoleMutation(({ officerId, roleId }: { officerId: string; roleId: string }) =>
    rolesApi.unassign(officerId, roleId),
  );
