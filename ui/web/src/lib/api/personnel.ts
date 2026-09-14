import apiClient from "./client";

/**
 * Personnel API.
 *
 * Field names mirror the Go `models.Personnel` exactly. A personnel record is
 * the service record of an existing user account: `name`, `phone` and `email`
 * are read from that user and cannot be changed through this endpoint.
 * Nullable columns arrive as `null`, so optional fields are typed `| null`.
 */

export type PersonnelRank =
  | "CONSTABLE"
  | "HEAD_CONSTABLE"
  | "ASI"
  | "SI"
  | "INSPECTOR"
  | "SHO"
  | "DSP"
  | "SP"
  | "DIG"
  | "IG"
  | "SECRETARY"
  | "DGP";

export type PersonnelStatus = "ON_DUTY" | "OFF_DUTY" | "ON_LEAVE" | "TRAINING" | "SUSPENDED";

export interface Personnel {
  id: string;
  userId: string;
  name: string;
  badgeNumber: string;
  rank: PersonnelRank;
  status: PersonnelStatus;
  phone: string;
  email: string;
  stationId: string;
  stationName?: string;
  joiningDate: string;
  /** A stored count, not computed from case assignments. */
  assignedCases: number;
  currentDuty: string | null;
  shift: string | null;
  leaveType: string | null;
  leaveUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PersonnelQuery {
  page?: number;
  pageSize?: number;
  /** Matches name, badge number or phone. */
  search?: string;
  status?: PersonnelStatus;
  rank?: PersonnelRank;
  stationId?: string;
}

export interface PersonnelInput {
  userId: string;
  badgeNumber: string;
  rank: PersonnelRank;
  status: PersonnelStatus;
  stationId: string;
  joiningDate: string;
  currentDuty?: string | null;
  shift?: string | null;
}

/** Columns the update statement writes. Name, contact and joining date are not among them. */
export type PersonnelChanges = Partial<
  Pick<Personnel, "badgeNumber" | "rank" | "status" | "stationId" | "assignedCases" | "currentDuty" | "shift" | "leaveType" | "leaveUntil">
>;

export const personnelApi = {
  list: (query: PersonnelQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.rank) params.rank = query.rank;
    if (query.stationId) params.stationId = query.stationId;
    return apiClient.get<Paginated<Personnel>>("/personnel", params);
  },

  get: (id: string) => apiClient.get<Personnel>(`/personnel/${id}`),

  create: (input: PersonnelInput) => apiClient.post<Personnel>("/personnel", input),

  /** The API replaces every writable column, so send the full record with changes applied. */
  update: (person: Personnel, changes: PersonnelChanges) =>
    apiClient.put<Personnel>(`/personnel/${person.id}`, { ...person, ...changes }),

  /** Sets duty and shift, and marks the officer ON_DUTY. */
  assignDuty: (id: string, duty: string, shift: string) =>
    apiClient.post<Personnel>(`/personnel/${id}/assign-duty`, { duty, shift }),

  remove: (id: string) => apiClient.delete<void>(`/personnel/${id}`),
};

export default personnelApi;
