import apiClient from "./client";

/**
 * Forensic lab requests API.
 *
 * Field names mirror the Go `models.Forensic` exactly (table `forensics`).
 * Nullable columns arrive as `null`, not absent. `requestNumber` is part of
 * the model but the table has no such column, so the API always returns "".
 */

export type ForensicType = "FINGERPRINT" | "DNA" | "BALLISTICS" | "DIGITAL" | "NARCOTICS" | "DOCUMENT";
export type ForensicStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INCONCLUSIVE";
export type ForensicPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Forensic {
  id: string;
  requestNumber: string;
  evidenceId: string;
  caseId: string | null;
  caseNumber?: string;
  type: ForensicType;
  status: ForensicStatus;
  priority: ForensicPriority;
  submittedDate: string;
  completedDate: string | null;
  expectedDate: string | null;
  lab: string;
  analyst: string | null;
  summary: string | null;
  findings: string | null;
  progress: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForensicStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ForensicQuery {
  page?: number;
  pageSize?: number;
  /** The API matches this against the lab name only. */
  search?: string;
  status?: ForensicStatus;
  type?: ForensicType;
  priority?: ForensicPriority;
}

/** Fields an officer supplies when sending evidence to a lab. */
export interface ForensicInput {
  evidenceId: string;
  caseId: string | null;
  type: ForensicType;
  priority: ForensicPriority;
  submittedDate: string;
  expectedDate: string | null;
  lab: string;
}

export type ForensicChanges = Partial<
  Pick<Forensic, "type" | "status" | "priority" | "expectedDate" | "lab" | "analyst" | "progress">
>;

export const forensicsApi = {
  list: async (query: ForensicQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.type) params.type = query.type;
    if (query.priority) params.priority = query.priority;
    const result = await apiClient.get<Paginated<Forensic>>("/forensics", params);
    return { ...result, data: result.data ?? [] };
  },

  get: (id: string) => apiClient.get<Forensic>(`/forensics/${id}`),

  stats: () => apiClient.get<ForensicStats>("/forensics/stats"),

  create: (input: ForensicInput) => apiClient.post<Forensic>("/forensics", input),

  /** The API replaces every editable column, so send the full record with changes applied. */
  update: (forensic: Forensic, changes: ForensicChanges) =>
    apiClient.put<Forensic>(`/forensics/${forensic.id}`, { ...forensic, ...changes }),

  /** Records the lab result: status becomes COMPLETED, progress 100, completion date stamped server-side. */
  complete: (id: string, summary: string, findings: string) =>
    apiClient.post<Forensic>(`/forensics/${id}/complete`, { summary, findings }),
};

export default forensicsApi;
