import apiClient from "./client";

/**
 * Lookout notices and sightings.
 *
 * Field names mirror the Go `models.Lookout` and `models.LookoutSighting`
 * exactly (see internal/models/lookout.go).
 */

export type LookoutType = "WANTED" | "MISSING" | "STOLEN_VEHICLE" | "SUSPECT" | "WITNESS";
export type LookoutStatus = "ACTIVE" | "LOCATED" | "CLOSED";
export type LookoutPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export const LOOKOUT_TYPES: LookoutType[] = ["WANTED", "MISSING", "STOLEN_VEHICLE", "SUSPECT", "WITNESS"];
export const LOOKOUT_PRIORITIES: LookoutPriority[] = ["CRITICAL", "HIGH", "NORMAL", "LOW"];

export interface Lookout {
  id: string;
  lookoutNumber: string;
  type: LookoutType;
  subject: string;
  description: string;
  details: Record<string, string>;
  priority: LookoutPriority;
  status: LookoutStatus;
  firId: string | null;
  firNumber: string;
  stationId: string;
  stationName: string;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
  resolvedAt: string | null;
  resolvedByName: string;
  resolutionNote: string | null;
  sightingCount: number;
  verifiedCount: number;
  lastSightedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LookoutSighting {
  id: string;
  lookoutId: string;
  reportedBy: string;
  reportedByName: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  sightedAt: string;
  details: string;
  verifiedBy: string | null;
  verifiedByName: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface LookoutStats {
  active: number;
  critical: number;
  located: number;
  closed: number;
  unverifiedSightings: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LookoutQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LookoutStatus;
  type?: LookoutType;
  priority?: LookoutPriority;
}

export interface IssueLookoutInput {
  type: LookoutType;
  subject: string;
  description: string;
  details?: Record<string, string>;
  priority?: LookoutPriority;
  firId?: string | null;
}

export interface ReportSightingInput {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  sightedAt: string;
  details?: string;
}

export interface ResolveLookoutInput {
  status: Exclude<LookoutStatus, "ACTIVE">;
  note: string;
}

export const lookoutsApi = {
  list: (query: LookoutQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.type) params.type = query.type;
    if (query.priority) params.priority = query.priority;
    return apiClient.get<Paginated<Lookout>>("/lookouts", params);
  },

  get: (id: string) => apiClient.get<Lookout>(`/lookouts/${id}`),

  stats: () => apiClient.get<LookoutStats>("/lookouts/stats"),

  sightings: async (id: string) =>
    (await apiClient.get<{ data: LookoutSighting[] | null }>(`/lookouts/${id}/sightings`)).data ?? [],

  issue: (input: IssueLookoutInput) => apiClient.post<Lookout>("/lookouts", input),

  reportSighting: (id: string, input: ReportSightingInput) =>
    apiClient.post<LookoutSighting>(`/lookouts/${id}/sightings`, input),

  verifySighting: (id: string, sightingId: string) =>
    apiClient.post<LookoutSighting>(`/lookouts/${id}/sightings/${sightingId}/verify`, {}),

  resolve: (id: string, input: ResolveLookoutInput) => apiClient.post<Lookout>(`/lookouts/${id}/resolve`, input),
};

export default lookoutsApi;
