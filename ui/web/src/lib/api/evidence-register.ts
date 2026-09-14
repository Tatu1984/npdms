import apiClient from "./client";

/**
 * The evidence register.
 *
 * Phase 01 needs to attach evidence to an investigation, which means reading
 * and creating register entries. The full Phase 02 chain-of-custody surface —
 * hashing, transfers, verification, court production — is specified separately;
 * this covers what the investigation workspace requires.
 */

export type EvidenceType =
  | "PHYSICAL"
  | "DIGITAL"
  | "DOCUMENTARY"
  | "BIOLOGICAL"
  | "TRACE"
  | "TESTIMONIAL";

export type EvidenceStatus =
  | "COLLECTED"
  | "IN_CUSTODY"
  | "SENT_TO_FSL"
  | "AT_COURT"
  | "DISPOSED";

export interface EvidenceRecord {
  id: string;
  evidenceNumber: string;
  caseId?: string;
  firId?: string;
  evidenceType: EvidenceType;
  description: string;
  collectionLocation?: string;
  collectionDate?: string;
  collectedBy?: string;
  storageLocation?: string;
  containerType?: string;
  sealNumber?: string;
  condition?: string;
  status?: EvidenceStatus;
  requiresForensic?: boolean;
  forensicType?: string;
  createdAt: string;
  updatedAt: string;
}

interface Paginated<T> {
  data: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const evidenceApi = {
  list: async (query: { page?: number; pageSize?: number; search?: string } = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;

    const result = await apiClient.get<Paginated<EvidenceRecord>>("/evidence", params);
    // The API returns null rather than [] for an empty page; normalise it here
    // so every caller does not have to.
    return { ...result, data: result.data ?? [] };
  },

  get: (id: string) => apiClient.get<EvidenceRecord>(`/evidence/${id}`),

  /** Registers through the custody register, which signs the first leg. */
  create: (body: {
    description: string;
    evidenceType: EvidenceType;
    collectionLocation?: string;
    collectionDate?: string;
    storageLocation?: string;
    containerType?: string;
    sealNumber?: string;
    caseId?: string;
    firId?: string;
  }) => apiClient.post<EvidenceRecord>("/custody", body),
};

export default evidenceApi;
