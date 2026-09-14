import apiClient from "./client";

/**
 * Phase 02 — Evidence & Chain of Custody API.
 *
 * The digest of a file is taken by the server as the bytes stream into storage;
 * the client never supplies one and nothing here accepts one.
 */

export type IntegrityState = "pending" | "verified" | "broken";

export type EvidenceType =
  | "PHYSICAL"
  | "DIGITAL"
  | "DOCUMENTARY"
  | "BIOLOGICAL"
  | "TRACE"
  | "TESTIMONIAL";

export interface EvidenceFile {
  objectKey?: string;
  originalFilename?: string;
  contentType?: string;
  fileSize?: number;
  storageBackend?: string;
  sha256?: string;
  hashAlgorithm?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface EvidenceRecord {
  id: string;
  evidenceNumber: string;
  caseId?: string;
  firId?: string;
  evidenceType: EvidenceType;
  description: string;
  collectionLocation?: string;
  collectionDate?: string;
  collectedByName?: string;
  storageLocation?: string;
  containerType?: string;
  sealNumber?: string;
  condition?: string;
  status?: string;
  file: EvidenceFile;
  /** `pending` means no file, or none checked since upload — never "intact". */
  integrityState: IntegrityState;
  lastVerifiedAt?: string;
  /** Reserved for the anchoring layer; absent until that phase ships. */
  blockchainAnchorTx?: string;
  currentHolder?: string;
  transferCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustodyEvent {
  id: string;
  evidenceId: string;
  sequenceNumber: number;
  fromName?: string;
  fromLocation?: string;
  toName?: string;
  toLocation?: string;
  purpose?: string;
  sealNumber?: string;
  sealIntact: boolean;
  conditionNote?: string;
  notes?: string;
  signedByName?: string;
  signedAt?: string;
  signature?: string;
  hashAtTransfer?: string;
  transferDate: string;
}

export interface AccessLogEntry {
  id: string;
  action:
    | "viewed"
    | "downloaded"
    | "verified"
    | "transferred"
    | "uploaded"
    | "metadata_changed"
    | "court_verified";
  actorName?: string;
  purpose?: string;
  ipAddress?: string;
  outcome: "success" | "failure" | "denied";
  detail?: string;
  createdAt: string;
}

export interface IntegrityCheck {
  id: string;
  expectedHash?: string;
  computedHash?: string;
  matched: boolean;
  sizeBytes?: number;
  checkedByName?: string;
  note?: string;
  createdAt: string;
}

export interface VerificationResult {
  evidenceId: string;
  evidenceNumber: string;
  matched: boolean;
  state: IntegrityState;
  expectedHash?: string;
  computedHash?: string;
  sizeBytes?: number;
  checkedAt: string;
  message: string;
}

export interface CourtVerification {
  evidenceNumber: string;
  evidenceType: string;
  description: string;
  capturedAt?: string;
  capturedBy?: string;
  sha256?: string;
  hashAlgorithm?: string;
  integrityState: IntegrityState;
  lastVerifiedAt?: string;
  custodyEvents: number;
  custodyChain: CustodyEvent[];
  sealIntact: boolean;
  verifiedAt: string;
}

export interface CustodyStats {
  total: number;
  verified: number;
  broken: number;
  pending: number;
  withFile: number;
}

interface Paginated<T> {
  data: T[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Listed<T> {
  data: T[];
}

export const custodyApi = {
  list: async (query: {
    page?: number;
    pageSize?: number;
    search?: string;
    integrity?: IntegrityState;
    caseId?: string;
  } = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.integrity) params.integrity = query.integrity;
    if (query.caseId) params.caseId = query.caseId;

    const result = await apiClient.get<Paginated<EvidenceRecord>>("/custody", params);
    return { ...result, data: result.data ?? [] };
  },

  get: (id: string, purpose?: string) =>
    apiClient.get<EvidenceRecord>(`/custody/${id}`, purpose ? { purpose } : undefined),

  stats: () => apiClient.get<CustodyStats>("/custody/stats"),

  chain: (id: string) => apiClient.get<Listed<CustodyEvent>>(`/custody/${id}/chain`),

  accessLog: (id: string) => apiClient.get<Listed<AccessLogEntry>>(`/custody/${id}/access-log`),

  verifications: (id: string) =>
    apiClient.get<Listed<IntegrityCheck>>(`/custody/${id}/verifications`),

  /** Re-reads the stored file and recomputes its digest. */
  verify: (id: string, note?: string) =>
    apiClient.post<VerificationResult>(`/custody/${id}/verify`, { note }),

  transfer: (
    id: string,
    body: {
      toLocation: string;
      purpose: string;
      toUserId?: string;
      sealNumber?: string;
      sealIntact?: boolean;
      conditionNote?: string;
      notes?: string;
    },
  ) => apiClient.post<CustodyEvent>(`/custody/${id}/transfer`, body),

  courtVerification: (id: string) =>
    apiClient.get<CourtVerification>(`/custody/${id}/court-verification`),

  /**
   * Uploads the file. Sent as multipart rather than through the JSON client, so
   * large exports stream instead of being base64-encoded into memory.
   */
  attachFile: async (id: string, file: File): Promise<EvidenceRecord> => {
    const form = new FormData();
    form.append("file", file);

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

    const response = await fetch(`${base}/custody/${id}/file`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.message ?? `Upload failed with status ${response.status}`);
    }
    return response.json();
  },

  /** Absolute URL for downloading the stored file. */
  downloadUrl: (id: string, purpose?: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    return `${base}/custody/${id}/file${purpose ? `?purpose=${encodeURIComponent(purpose)}` : ""}`;
  },
};

export default custodyApi;
