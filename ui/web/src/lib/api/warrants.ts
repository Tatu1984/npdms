import apiClient from "./client";

/**
 * Warrants API.
 *
 * Field names mirror the Go `models.Warrant` exactly. `charges` is the JSON
 * name the API gives the `ipc_sections` column. Nullable columns arrive as
 * `null`, not absent, so optional fields are typed `| null`.
 */

export type WarrantType = "ARREST" | "SEARCH" | "SUMMONS" | "NBW";
export type WarrantStatus = "ACTIVE" | "EXECUTED" | "EXPIRED" | "CANCELLED";
export type WarrantPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Warrant {
  id: string;
  warrantNumber: string;
  type: WarrantType;
  status: WarrantStatus;
  issuedFor: string;
  caseId: string | null;
  caseNumber?: string;
  firId: string | null;
  firNumber?: string;
  issuedBy: string;
  judgeName: string | null;
  issuedDate: string;
  validUntil: string | null;
  charges: string[];
  lastKnownLocation: string | null;
  priority: WarrantPriority;
  executedDate: string | null;
  executedBy: string | null;
  executedByName?: string;
  description: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  identifyingMarks: string | null;
  searchPremises: string | null;
  searchScope: string | null;
  summonsPurpose: string | null;
  hearingDate: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantStats {
  total: number;
  active: number;
  executed: number;
  expired: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WarrantQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: WarrantStatus;
  type?: WarrantType;
  priority?: WarrantPriority;
}

/** Fields an officer supplies. Number, status and timestamps are the server's. */
export type WarrantInput = Partial<
  Omit<Warrant, "id" | "warrantNumber" | "status" | "caseNumber" | "firNumber" | "executedByName" | "createdAt" | "updatedAt">
> &
  Pick<Warrant, "type" | "issuedFor" | "issuedDate">;

export const warrantsApi = {
  list: (query: WarrantQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.type) params.type = query.type;
    if (query.priority) params.priority = query.priority;
    return apiClient.get<Paginated<Warrant>>("/warrants", params);
  },

  get: (id: string) => apiClient.get<Warrant>(`/warrants/${id}`),

  stats: () => apiClient.get<WarrantStats>("/warrants/stats"),

  create: (input: WarrantInput) => apiClient.post<Warrant>("/warrants", input),

  /** The API replaces every column, so send the full record with changes applied. */
  update: (warrant: Warrant, changes: Partial<WarrantInput>) =>
    apiClient.put<Warrant>(`/warrants/${warrant.id}`, { ...warrant, ...changes }),

  /** Marking EXECUTED stamps the execution date server-side; `executedBy` records the officer. */
  setStatus: (id: string, status: WarrantStatus, executedBy?: string) =>
    apiClient.patch<Warrant>(`/warrants/${id}/status`, { status, executedBy }),
};

export default warrantsApi;
