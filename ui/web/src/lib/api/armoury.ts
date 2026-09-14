import apiClient from "./client";

/**
 * Armoury API — weapon register and issue/return ledger.
 *
 * Field names mirror the Go `models.Weapon` and `models.WeaponIssuance`
 * exactly (see internal/models/armoury.go). Nullable columns arrive as `null`.
 */

export type WeaponStatus = "IN_ARMOURY" | "ISSUED" | "MAINTENANCE" | "CONDEMNED";
export type WeaponCondition = "SERVICEABLE" | "UNDER_REPAIR" | "UNSERVICEABLE";

export const WEAPON_STATUSES: WeaponStatus[] = ["IN_ARMOURY", "ISSUED", "MAINTENANCE", "CONDEMNED"];
export const WEAPON_CONDITIONS: WeaponCondition[] = ["SERVICEABLE", "UNDER_REPAIR", "UNSERVICEABLE"];

export interface WeaponIssuance {
  id: string;
  weaponId: string;
  weaponNumber: string;
  issuedTo: string;
  issuedToName: string;
  issuedToBadge: string;
  issuedBy: string;
  issuedByName: string;
  purpose: string;
  roundsIssued: number;
  expectedReturn: string | null;
  issuedAt: string;
  returnedAt: string | null;
  receivedBy: string | null;
  receivedByName: string;
  roundsReturned: number | null;
  returnCondition: WeaponCondition | null;
  returnNote: string | null;
  /** Computed by the server: still out past its expected return. */
  overdue: boolean;
}

export interface Weapon {
  id: string;
  weaponNumber: string;
  type: string;
  make: string;
  serialNumber: string;
  stationId: string;
  stationName: string;
  status: WeaponStatus;
  condition: WeaponCondition;
  maintenanceNote: string | null;
  /** The open issuance when the weapon is out; null otherwise. */
  currentIssue: WeaponIssuance | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeaponStats {
  total: number;
  inArmoury: number;
  issued: number;
  maintenance: number;
  condemned: number;
  overdue: number;
  roundsOut: number;
  /** Rounds issued but not returned, across all closed issuances. */
  roundsShortfall: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WeaponQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: WeaponStatus;
  overdue?: boolean;
}

export interface RegisterWeaponInput {
  type: string;
  make: string;
  serialNumber: string;
  stationId?: string;
}

export interface SetWeaponStateInput {
  status: Exclude<WeaponStatus, "ISSUED">;
  condition: WeaponCondition;
  maintenanceNote?: string | null;
}

export interface IssueWeaponInput {
  issuedTo: string;
  purpose: string;
  roundsIssued: number;
  expectedReturn?: string | null;
}

export interface ReturnWeaponInput {
  roundsReturned: number;
  condition: WeaponCondition;
  note?: string | null;
}

export const armouryApi = {
  list: (query: WeaponQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.overdue) params.overdue = "true";
    return apiClient.get<Paginated<Weapon>>("/armoury/weapons", params);
  },

  get: (id: string) => apiClient.get<Weapon>(`/armoury/weapons/${id}`),

  stats: () => apiClient.get<WeaponStats>("/armoury/weapons/stats"),

  issuances: (weaponId: string, page = 1, pageSize = 20) =>
    apiClient.get<Paginated<WeaponIssuance>>(`/armoury/weapons/${weaponId}/issuances`, { page, pageSize }),

  /** The whole ledger, newest movement first; `openOnly` limits it to weapons still out. */
  ledger: (page = 1, pageSize = 20, openOnly = false) =>
    apiClient.get<Paginated<WeaponIssuance>>("/armoury/issuances", {
      page,
      pageSize,
      ...(openOnly ? { open: "true" } : {}),
    }),

  register: (input: RegisterWeaponInput) => apiClient.post<Weapon>("/armoury/weapons", input),

  setState: (id: string, input: SetWeaponStateInput) =>
    apiClient.patch<Weapon>(`/armoury/weapons/${id}/state`, input),

  issue: (id: string, input: IssueWeaponInput) =>
    apiClient.post<WeaponIssuance>(`/armoury/weapons/${id}/issue`, input),

  return: (id: string, input: ReturnWeaponInput) =>
    apiClient.post<WeaponIssuance>(`/armoury/weapons/${id}/return`, input),
};

export default armouryApi;
