import apiClient from "./client";

/**
 * Bail API.
 *
 * Field names mirror the Go `models.Bail` exactly. `charges` is the JSON name
 * of the `ipc_sections` column, `judge` of `judge_name`, and `accused` is the
 * name joined from the accused register — it is read-only. A bail application
 * is linked to an accused by `accusedId`; a name sent without one is discarded
 * by the server, so the client never sends it.
 */

export type BailStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RELEASED";
export type BailType = "REGULAR" | "ANTICIPATORY" | "INTERIM";

export interface Bail {
  id: string;
  applicationNumber: string;
  accusedId: string | null;
  accused: string;
  caseId: string | null;
  caseNumber?: string;
  firId: string | null;
  firNumber?: string;
  charges: string[] | null;
  status: BailStatus;
  bailType: BailType;
  applicationDate: string;
  hearingDate: string | null;
  approvalDate: string | null;
  rejectionDate: string | null;
  cancellationDate: string | null;
  releaseDate: string | null;
  court: string;
  judge: string | null;
  bailAmount: number | null;
  suretyAmount: number | null;
  proposedBailAmount: number | null;
  conditions: string[] | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  lawyer: string | null;
  validUntil: string | null;
  orderSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Server counts. `approved` includes RELEASED and `rejected` includes
 * CANCELLED, so neither maps onto a single status filter.
 */
export interface BailStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** Mirrors Go `models.Accused`, as returned by GET /cases/{id}/accused. */
export interface CaseAccused {
  id: string;
  caseId: string | null;
  firId: string | null;
  name: string;
  alias: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  status: string;
  arrestDate: string | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BailQuery {
  page?: number;
  pageSize?: number;
  /** Matches the application number only. */
  search?: string;
  status?: BailStatus;
  bailType?: BailType;
}

/** Fields an officer supplies. Number, status, outcome dates and joins are the server's. */
export type BailInput = Partial<
  Pick<
    Bail,
    | "accusedId"
    | "caseId"
    | "firId"
    | "charges"
    | "hearingDate"
    | "judge"
    | "bailAmount"
    | "suretyAmount"
    | "proposedBailAmount"
    | "conditions"
    | "lawyer"
    | "validUntil"
    | "orderSummary"
  >
> &
  Pick<Bail, "bailType" | "applicationDate" | "court">;

export const bailApi = {
  list: (query: BailQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.bailType) params.bailType = query.bailType;
    return apiClient.get<Paginated<Bail>>("/bail", params);
  },

  get: (id: string) => apiClient.get<Bail>(`/bail/${id}`),

  stats: () => apiClient.get<BailStats>("/bail/stats"),

  create: (input: BailInput) => apiClient.post<Bail>("/bail", input),

  /** The API replaces every column, so send the full record with changes applied. */
  update: (bail: Bail, changes: Partial<BailInput>) =>
    apiClient.put<Bail>(`/bail/${bail.id}`, { ...bail, ...changes }),

  /**
   * The server stamps the matching outcome date (approval, rejection,
   * cancellation, release). `reason` is stored only for REJECTED and CANCELLED.
   */
  setStatus: (id: string, status: BailStatus, reason?: string) =>
    apiClient.patch<Bail>(`/bail/${id}/status`, { status, reason }),

  /** The server returns `null`, not `[]`, for a case with no accused. */
  accusedForCase: async (caseId: string) =>
    (await apiClient.get<CaseAccused[] | null>(`/cases/${caseId}/accused`)) ?? [],
};

export default bailApi;
