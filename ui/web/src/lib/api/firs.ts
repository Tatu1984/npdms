import apiClient from "./client";

/**
 * FIR API.
 *
 * Field names mirror the Go `models.FIR` exactly. Nullable columns arrive as
 * `null`; joined names (`stationName`, `registeredByName`, `ioName`) are
 * omitted when empty. `ipcSections` is the column name — it carries BNS/BNSS
 * sections for FIRs registered since 1 July 2024.
 */

export type FIRStatus =
  | "DRAFT"
  | "REGISTERED"
  | "UNDER_INVESTIGATION"
  | "CHARGESHEET_FILED"
  | "CLOSED"
  | "TRANSFERRED";
export type FIRPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const FIR_STATUSES: FIRStatus[] = [
  "DRAFT",
  "REGISTERED",
  "UNDER_INVESTIGATION",
  "CHARGESHEET_FILED",
  "CLOSED",
  "TRANSFERRED",
];

export interface FIR {
  id: string;
  firNumber: string;
  stationId: string;
  stationName?: string;
  complainantName: string;
  complainantPhone: string | null;
  complainantAddress: string | null;
  complainantIdType: string | null;
  complainantIdNumber: string | null;
  incidentDate: string;
  /** "HH:MM:SS" as stored in the TIME column. */
  incidentTime: string | null;
  incidentLocation: string;
  /** Map point, both or neither; inside West Bengal. */
  incidentLatitude: number | null;
  incidentLongitude: number | null;
  incidentDescription: string;
  ipcSections: string[];
  status: FIRStatus;
  priority: FIRPriority;
  registeredBy: string | null;
  registeredByName?: string;
  investigatingOfficer: string | null;
  ioName?: string;
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

export interface FIRQuery {
  page?: number;
  pageSize?: number;
  /** Matches FIR number, complainant name or incident description. */
  search?: string;
  status?: FIRStatus;
  priority?: FIRPriority;
}

export interface TimelineEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon: string;
}

export interface FIRTimeline {
  firId: string;
  firNumber: string;
  timeline: TimelineEntry[] | null;
}

/**
 * Fields an officer supplies. The number, status, registering officer and
 * station are the server's: the FIR is registered at the officer's station
 * unless `stationId` names another.
 */
export type FIRInput = Partial<
  Omit<
    FIR,
    | "id"
    | "firNumber"
    | "status"
    | "stationName"
    | "registeredBy"
    | "registeredByName"
    | "ioName"
    | "createdAt"
    | "updatedAt"
  >
> &
  Pick<FIR, "complainantName" | "incidentDate" | "incidentLocation" | "incidentDescription">;

export const firsApi = {
  list: (query: FIRQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.priority) params.priority = query.priority;
    return apiClient.get<Paginated<FIR>>("/firs", params);
  },

  get: (id: string) => apiClient.get<FIR>(`/firs/${id}`),

  timeline: (id: string) => apiClient.get<FIRTimeline>(`/firs/${id}/timeline`),

  create: (input: FIRInput) => apiClient.post<FIR>("/firs", input),

  /**
   * The API rewrites complainant, incident location and description, sections,
   * priority and IO from the body, so send the full record with changes applied.
   */
  update: (fir: FIR, changes: Partial<FIRInput>) =>
    apiClient.put<FIR>(`/firs/${fir.id}`, { ...fir, ...changes }),

  setStatus: (id: string, status: FIRStatus) =>
    apiClient.patch<unknown>(`/firs/${id}/status`, { status }),
};

export default firsApi;
