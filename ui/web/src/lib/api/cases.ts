import apiClient from "./client";

/**
 * Cases API.
 *
 * Field names mirror the Go `models.Case`, `models.Accused` and
 * `models.Witness` exactly. Nullable columns arrive as `null`; joined names
 * (`firNumber`, `ioName`) are omitted when empty.
 */

export type CaseStatus =
  | "REGISTERED"
  | "UNDER_INVESTIGATION"
  | "CHARGESHEET_FILED"
  | "IN_COURT"
  | "CONVICTION"
  | "ACQUITTAL"
  | "CLOSED";
export type CasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const CASE_STATUSES: CaseStatus[] = [
  "REGISTERED",
  "UNDER_INVESTIGATION",
  "CHARGESHEET_FILED",
  "IN_COURT",
  "CONVICTION",
  "ACQUITTAL",
  "CLOSED",
];

export interface Case {
  id: string;
  caseNumber: string;
  firId: string;
  firNumber?: string;
  title: string;
  synopsis: string | null;
  category: string | null;
  status: CaseStatus;
  priority: CasePriority;
  ipcSections: string[];
  investigatingOfficer: string | null;
  ioName?: string;
  courtName: string | null;
  courtCaseNumber: string | null;
  nextHearingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AccusedStatus = "ABSCONDING" | "ARRESTED" | "ON_BAIL" | "IN_CUSTODY" | "RELEASED";

export const ACCUSED_STATUSES: AccusedStatus[] = ["ABSCONDING", "ARRESTED", "IN_CUSTODY", "ON_BAIL", "RELEASED"];

export interface Accused {
  id: string;
  caseId: string | null;
  firId: string | null;
  name: string;
  alias: string | null;
  description: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
  idType: string | null;
  idNumber: string | null;
  status: AccusedStatus;
  arrestDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Witness {
  id: string;
  caseId: string | null;
  firId: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  witnessType: string | null;
  statementRecorded: boolean;
  statementDate: string | null;
  statementText: string | null;
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

export interface CaseQuery {
  page?: number;
  pageSize?: number;
  /**
   * Sent for when the API supports it. GET /cases currently reads only page
   * and pageSize, so results are the most recent cases regardless.
   */
  search?: string;
}

/** Fields an officer supplies. Number, status and timestamps are the server's. */
export type CaseInput = Partial<
  Omit<Case, "id" | "caseNumber" | "status" | "firNumber" | "ioName" | "createdAt" | "updatedAt">
> &
  Pick<Case, "firId" | "title">;

export type AccusedInput = Partial<Omit<Accused, "id" | "caseId" | "createdAt" | "updatedAt">> &
  Pick<Accused, "name" | "status">;

export type WitnessInput = Partial<Omit<Witness, "id" | "caseId" | "createdAt" | "updatedAt">> &
  Pick<Witness, "name">;

export const casesApi = {
  list: (query: CaseQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    return apiClient.get<Paginated<Case>>("/cases", params);
  },

  get: (id: string) => apiClient.get<Case>(`/cases/${id}`),

  create: (input: CaseInput) => apiClient.post<Case>("/cases", input),

  /** The API rewrites every editable column from the body, so send the full record. */
  update: (current: Case, changes: Partial<CaseInput> & { status?: CaseStatus }) =>
    apiClient.put<Case>(`/cases/${current.id}`, { ...current, ...changes }),

  /** The API returns null rather than an empty list for a case with none. */
  accused: async (caseId: string) =>
    (await apiClient.get<Accused[] | null>(`/cases/${caseId}/accused`)) ?? [],

  addAccused: (caseId: string, input: AccusedInput) =>
    apiClient.post<Accused>(`/cases/${caseId}/accused`, input),

  witnesses: async (caseId: string) =>
    (await apiClient.get<Witness[] | null>(`/cases/${caseId}/witnesses`)) ?? [],

  addWitness: (caseId: string, input: WitnessInput) =>
    apiClient.post<Witness>(`/cases/${caseId}/witnesses`, input),
};

export default casesApi;
