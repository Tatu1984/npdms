import apiClient from "./client";

/**
 * Roles and permissions.
 *
 * A role is a job — "Malkhana clerk", "Court liaison". A permission is one
 * thing the API can be asked to do. Rank is separate and stays on the officer:
 * it says how senior somebody is, not what their work involves.
 *
 * Field names mirror `repository.Role` and `repository.Permission` exactly.
 */

/** One capability, as the catalogue records it. */
export interface Permission {
  key: string;
  module: string;
  action: string;
  description: string;
  /** What rank this needed before roles existed. Shown for context only. */
  defaultMinRank?: string;
  /** The routes this permission covers, so a grid can say what it allows. */
  routes: string[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
  nameBn?: string;
  description: string;
  forceId?: string;
  forceName?: string;
  /**
   * A role that mirrors a rank. These keep the platform behaving as it did
   * before roles existed, so they cannot be renamed, deleted, regranted, or
   * handed out by hand — they follow the officer's rank.
   */
  isRankDefault: boolean;
  rank?: string;
  /** Only returned when one role is fetched, not in the list. */
  permissions?: string[];
  grantCount: number;
  holderCount: number;
}

export interface RoleInput {
  name: string;
  nameBn?: string;
  description?: string;
  forceId?: string;
  permissions?: string[];
}

/** What the signed-in officer may do, and the roles that grant it. */
export interface MyPermissions {
  permissions: string[];
  roles: string[];
}

export const rolesApi = {
  catalogue: async (): Promise<Permission[]> => {
    const response = await apiClient.get<{ data: Permission[] | null }>("/permissions");
    return response.data ?? [];
  },

  list: async (): Promise<Role[]> => {
    const response = await apiClient.get<{ data: Role[] | null }>("/roles");
    return response.data ?? [];
  },

  get: async (id: string): Promise<Role> => {
    const response = await apiClient.get<{ data: Role }>(`/roles/${id}`);
    return response.data;
  },

  create: async (input: RoleInput): Promise<Role> => {
    const response = await apiClient.post<{ data: Role }>("/roles", input);
    return response.data;
  },

  update: async (id: string, input: RoleInput): Promise<Role> => {
    const response = await apiClient.patch<{ data: Role }>(`/roles/${id}`, input);
    return response.data;
  },

  remove: (id: string) => apiClient.delete<{ message: string }>(`/roles/${id}`),

  /** Replaces what a role grants with exactly these permissions. */
  setPermissions: async (id: string, permissions: string[]): Promise<Role> => {
    const response = await apiClient.put<{ data: Role }>(`/roles/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },

  rolesOf: async (officerId: string): Promise<Role[]> => {
    const response = await apiClient.get<{ data: Role[] | null }>(`/officers/${officerId}/roles`);
    return response.data ?? [];
  },

  assign: (officerId: string, roleId: string) =>
    apiClient.post<{ message: string }>(`/officers/${officerId}/roles`, { roleId }),

  unassign: (officerId: string, roleId: string) =>
    apiClient.delete<{ message: string }>(`/officers/${officerId}/roles/${roleId}`),

  mine: async (): Promise<MyPermissions> => {
    const response = await apiClient.get<{ data: MyPermissions }>("/me/permissions");
    return response.data;
  },
};

export default rolesApi;
