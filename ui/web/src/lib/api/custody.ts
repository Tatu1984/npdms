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
  /**
   * Re-derived by the server on every read. `legacy` legs were signed before
   * signatures became checkable and cannot be re-derived; they are not intact.
   */
  signatureStatus: SignatureStatus;
  transferDate: string;
}

export type SignatureStatus = "valid" | "invalid" | "legacy" | "unsigned";

export interface AccessLogEntry {
  id: string;
  action:
    | "registered"
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
  /** True only when every leg's signature re-derives. */
  chainIntact: boolean;
  invalidLegs: number;
  unverifiedLegs: number;
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

  /** Registers an item with a signed first custody leg. */
  register: (body: {
    description: string;
    evidenceType: EvidenceType;
    caseId?: string;
    firId?: string;
    collectionLocation?: string;
    storageLocation?: string;
    sealNumber?: string;
  }) => apiClient.post<EvidenceRecord>("/custody", body),

  /**
   * Downloads the stored file with the officer's credentials — a plain link
   * cannot carry the bearer token — and recomputes the SHA-256 of the bytes
   * received, so the copy is checked against the register on arrival.
   */
  download: async (
    id: string,
    purpose?: string,
  ): Promise<{ blob: Blob; filename: string; recordedHash: string | null; receivedHash: string }> => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    const response = await fetch(
      `${base}/custody/${id}/file${purpose ? `?purpose=${encodeURIComponent(purpose)}` : ""}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.message ?? `Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const receivedHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `${id}.bin`;
    return { blob, filename, recordedHash: response.headers.get("X-Evidence-SHA256"), receivedHash };
  },
};

export default custodyApi;
