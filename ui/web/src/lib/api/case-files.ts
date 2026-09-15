import apiClient from "./client";

/**
 * Phase 12 — Case File & Court Readiness API.
 *
 * Field names mirror the Go models in internal/models/case_file.go. A case file
 * is assembled over an investigation workspace (Phase 01) and the signed
 * evidence register (Phase 02); it references their records rather than
 * copying them.
 */

export type CaseFileCategory =
  | "FIR"
  | "STATEMENT"
  | "SEIZURE_LIST"
  | "FORENSIC_REPORT"
  | "CUSTODY_RECORD"
  | "CHARGESHEET"
  | "OTHER";

/** The order documents appear in a file submitted to court. */
export const CASE_FILE_CATEGORIES: CaseFileCategory[] = [
  "FIR",
  "STATEMENT",
  "SEIZURE_LIST",
  "FORENSIC_REPORT",
  "CUSTODY_RECORD",
  "CHARGESHEET",
  "OTHER",
];

export type CaseFileStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";
export type SourceKind = "evidence" | "fir" | "forensic" | "upload";
export type ChainState = "valid" | "invalid" | "unsigned" | "legacy" | "empty";
export type IntegrityState = "pending" | "verified" | "broken";

export interface CaseFile {
  id: string;
  fileNumber: string;
  workspaceId: string;
  caseNumber: string;
  title: string;
  titleBn: string | null;
  sections: string[];
  firId: string | null;
  firNumber: string;
  ioId: string | null;
  ioName: string;
  stationName: string;
  version: number;
  entryCount: number;
  status: CaseFileStatus;
  /** The file changed after its latest pack was frozen. */
  stale: boolean;
  latestPackId: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseFileEntry {
  id: string;
  serial: number;
  category: CaseFileCategory;
  title: string;
  sourceKind: SourceKind;
  evidenceId: string | null;
  evidenceNumber: string;
  firId: string | null;
  firNumber: string;
  forensicId: string | null;
  forensicStatus: string;
  originalFilename: string | null;
  contentType: string | null;
  fileSize: number | null;
  sha256: string | null;
  witnessPersonId: string | null;
  witnessName: string;
  statementSection: string | null;
  statementDate: string | null;
  documentDate: string | null;
  addedByName: string;
  addedAt: string;
}

export interface AddEntryInput {
  category: CaseFileCategory;
  title: string;
  sourceKind?: Exclude<SourceKind, "upload">;
  evidenceId?: string;
  firId?: string;
  forensicId?: string;
  witnessPersonId?: string;
  statementSection?: string;
  /** YYYY-MM-DD */
  statementDate?: string;
  /** YYYY-MM-DD */
  documentDate?: string;
}

export interface CaseFileCharge {
  id: string;
  section: string;
  description: string | null;
  addedAt: string;
}

export interface MatrixEvidence {
  evidenceId: string;
  evidenceNumber: string;
  description: string;
  hasFile: boolean;
  integrityState: IntegrityState;
  chainState: ChainState;
  chainLegs: number;
  note?: string | null;
}

export interface EvidenceMatrix {
  rows: { charge: CaseFileCharge; evidence: MatrixEvidence[] }[];
  unlinked: MatrixEvidence[];
}

export interface WitnessMatrixRow {
  personId: string;
  name: string;
  nameBn: string | null;
  role: string;
  facts: { id: string; fact: string; statementEntryId: string | null; addedAt: string }[];
  statements: { entryId: string; serial: number; title: string; section: string; date: string }[];
}

export interface CompletenessFinding {
  rule: string;
  title: string;
  examined: string;
  open: boolean;
  blocking: boolean;
  details: string[];
}

export interface CaseFileVersion {
  version: number;
  summary: string;
  changedByName: string;
  changedAt: string;
  snapshot?: {
    entries: { id: string; category: CaseFileCategory; title: string; sha256: string | null }[];
    charges: { id: string; section: string; evidence: string[] }[];
    witnessFacts: { id: string; personId: string; fact: string }[];
  };
}

export interface CaseFilePack {
  id: string;
  packNumber: string;
  fileVersion: number;
  /** Present when a single pack is read: the exact text that was hashed. */
  manifestJson?: string;
  manifestSha256: string;
  blockingFindings: number;
  status: "SUBMITTED" | "APPROVED" | "RETURNED";
  stale: boolean;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  decidedByName: string;
  decidedAt: string | null;
  returnReason: string | null;
}

export interface CaseFileSources {
  firId: string | null;
  firNumber: string;
  evidence: MatrixEvidence[];
  forensics: { id: string; evidenceNumber: string; type: string; status: string }[];
  persons: { id: string; name: string; nameBn: string | null; role: string }[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const base = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const token = () => (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null);

export const caseFilesApi = {
  list: (query: { search?: string; status?: CaseFileStatus; page?: number; pageSize?: number } = {}) => {
    const params: Record<string, string | number> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    return apiClient.get<Paginated<CaseFile>>("/case-files", params);
  },
  create: (workspaceId: string) => apiClient.post<CaseFile>("/case-files", { workspaceId }),
  get: (id: string) => apiClient.get<CaseFile>(`/case-files/${id}`),
  byWorkspace: (workspaceId: string) => apiClient.get<CaseFile>(`/case-files/by-workspace/${workspaceId}`),
  sources: (id: string) => apiClient.get<CaseFileSources>(`/case-files/${id}/sources`),

  entries: (id: string) =>
    apiClient.get<{ data: CaseFileEntry[] }>(`/case-files/${id}/entries`).then((r) => r.data ?? []),
  addEntry: (id: string, input: AddEntryInput) => apiClient.post<CaseFileEntry>(`/case-files/${id}/entries`, input),
  removeEntry: (id: string, entryId: string, reason: string) =>
    apiClient.post<void>(`/case-files/${id}/entries/${entryId}/remove`, { reason }),

  /** Multipart upload: the SHA-256 is computed by the server as the bytes are stored. */
  uploadEntry: async (id: string, input: Omit<AddEntryInput, "sourceKind">, file: File): Promise<CaseFileEntry> => {
    const form = new FormData();
    form.append("meta", JSON.stringify(input));
    form.append("file", file);
    const t = token();
    const response = await fetch(`${base()}/case-files/${id}/entries/upload`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      body: form,
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.message ?? `Upload failed with status ${response.status}`);
    }
    return response.json();
  },

  /** Downloads with credentials and recomputes the digest of the bytes received. */
  download: async (id: string, entryId: string) => {
    const t = token();
    const response = await fetch(`${base()}/case-files/${id}/entries/${entryId}/file`, {
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.message ?? `Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const receivedHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `${entryId}.bin`;
    return { blob, filename, recordedHash: response.headers.get("X-Evidence-SHA256"), receivedHash };
  },

  evidenceMatrix: (id: string) => apiClient.get<EvidenceMatrix>(`/case-files/${id}/evidence-matrix`),
  addCharge: (id: string, section: string, description?: string) =>
    apiClient.post<CaseFileCharge>(`/case-files/${id}/charges`, { section, description: description || undefined }),
  removeCharge: (id: string, chargeId: string) => apiClient.delete<void>(`/case-files/${id}/charges/${chargeId}`),
  linkEvidence: (id: string, chargeId: string, evidenceId: string, note?: string) =>
    apiClient.post<void>(`/case-files/${id}/charges/${chargeId}/evidence`, { evidenceId, note: note || undefined }),
  unlinkEvidence: (id: string, chargeId: string, evidenceId: string) =>
    apiClient.delete<void>(`/case-files/${id}/charges/${chargeId}/evidence/${evidenceId}`),

  witnessMatrix: (id: string) =>
    apiClient.get<{ data: WitnessMatrixRow[] }>(`/case-files/${id}/witness-matrix`).then((r) => r.data ?? []),
  addWitnessFact: (id: string, personId: string, fact: string, statementEntryId?: string) =>
    apiClient.post<void>(`/case-files/${id}/witness-facts`, { personId, fact, statementEntryId: statementEntryId || undefined }),
  removeWitnessFact: (id: string, factId: string) => apiClient.delete<void>(`/case-files/${id}/witness-facts/${factId}`),

  completeness: (id: string) =>
    apiClient.get<{ data: CompletenessFinding[] }>(`/case-files/${id}/completeness`).then((r) => r.data ?? []),

  versions: (id: string) =>
    apiClient.get<{ data: CaseFileVersion[] }>(`/case-files/${id}/versions`).then((r) => r.data ?? []),
  version: (id: string, version: number) => apiClient.get<CaseFileVersion>(`/case-files/${id}/versions/${version}`),

  packs: (id: string) => apiClient.get<{ data: CaseFilePack[] }>(`/case-files/${id}/packs`).then((r) => r.data ?? []),
  pack: (id: string, packId: string) => apiClient.get<CaseFilePack>(`/case-files/${id}/packs/${packId}`),
  submit: (id: string) => apiClient.post<CaseFilePack>(`/case-files/${id}/packs`, {}),
  approve: (id: string, packId: string) => apiClient.post<CaseFilePack>(`/case-files/${id}/packs/${packId}/approve`, {}),
  returnPack: (id: string, packId: string, reason: string) =>
    apiClient.post<CaseFilePack>(`/case-files/${id}/packs/${packId}/return`, { reason }),
};

export default caseFilesApi;
