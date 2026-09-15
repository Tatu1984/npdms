import apiClient from "./client";

/**
 * Phase 11 — Police Knowledge Assistant API.
 *
 * Types mirror the Go models in internal/models/knowledge.go. Every read is
 * bounded by the officer's clearance on the server: a document above it is
 * neither listed, counted nor returned (a direct request answers 404).
 */

export type DocType = "SOP" | "CIRCULAR" | "STANDING_ORDER" | "MANUAL" | "STATUTE" | "NOTIFICATION" | "OTHER";
export type Classification = "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET";
export type DocStatus = "EFFECTIVE" | "SUPERSEDED" | "WITHDRAWN";
export type ExtractionStatus =
  | "TEXT_LAYER"
  | "PLAIN_TEXT"
  | "NO_TEXT_LAYER"
  | "OCR_UNAVAILABLE"
  | "UNSUPPORTED"
  | "FAILED";

export const DOC_TYPES: DocType[] = ["SOP", "CIRCULAR", "STANDING_ORDER", "MANUAL", "STATUTE", "NOTIFICATION", "OTHER"];
export const CLASSIFICATIONS: Classification[] = ["PUBLIC", "RESTRICTED", "CONFIDENTIAL", "SECRET"];

/** Rank level each classification needs — mirrors models.KnowledgeClassifications. */
export const CLASSIFICATION_FLOOR: Record<Classification, { level: number; rank: string }> = {
  PUBLIC: { level: 1, rank: "CONSTABLE" },
  RESTRICTED: { level: 3, rank: "ASI" },
  CONFIDENTIAL: { level: 6, rank: "SHO" },
  SECRET: { level: 8, rank: "SP" },
};

export interface KnowledgeDocument {
  id: string;
  documentNumber: string;
  docType: DocType;
  title: string;
  titleBn: string | null;
  description: string;
  issuingAuthority: string;
  referenceNumber: string | null;
  issuedOn: string;
  applicableTo: string[];
  classification: Classification;
  minRankLevel: number;
  version: number;
  supersedesId: string | null;
  supersedesNumber: string;
  status: DocStatus;
  supersededById: string | null;
  supersededByNumber: string;
  supersededAt: string | null;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  sha256: string;
  extractionStatus: ExtractionStatus;
  extractionNote: string;
  textLength: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchHit extends KnowledgeDocument {
  /** Where the query matched: title, metadata or text. Empty without a query. */
  matchedIn: ("title" | "metadata" | "text")[];
  /** Passage around the match; matched terms sit between « and ». */
  snippet: string;
  rank: number;
}

export interface KnowledgeStats {
  total: number;
  effective: number;
  superseded: number;
  withdrawn: number;
  textSearchable: number;
  metadataOnly: number;
}

export interface KnowledgeCapabilities {
  ocrAvailable: boolean;
  classifications: Record<Classification, number>;
  docTypes: DocType[];
  maxUploadBytes: number;
  searchNote: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KnowledgeQuery {
  q?: string;
  type?: DocType;
  status?: DocStatus;
  classification?: Classification;
  authority?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentInput {
  docType?: DocType;
  title: string;
  titleBn?: string;
  description?: string;
  issuingAuthority?: string;
  referenceNumber?: string;
  issuedOn: string;
  applicableTo?: string[];
  classification?: Classification;
}

export interface ChecklistStep {
  id: string;
  position: number;
  text: string;
  textBn: string | null;
}

export interface Checklist {
  id: string;
  documentId: string;
  documentNumber: string;
  documentTitle: string;
  documentStatus: DocStatus;
  sectionRef: string;
  title: string;
  titleBn: string | null;
  active: boolean;
  createdByName: string;
  createdAt: string;
  steps: ChecklistStep[];
}

export interface ChecklistInput {
  documentId: string;
  sectionRef: string;
  title: string;
  titleBn?: string;
  steps: { text: string; textBn?: string }[];
}

export interface ChecklistTick {
  id: string;
  stepId: string;
  tickedByName: string;
  tickedAt: string;
  note: string;
}

export interface ChecklistRun {
  id: string;
  checklistId: string;
  checklistTitle: string;
  caseId: string | null;
  caseNumber: string;
  firId: string | null;
  firNumber: string;
  startedByName: string;
  startedAt: string;
  totalSteps: number;
  ticks: ChecklistTick[];
}

const base = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const token = () => (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null);

/** Multipart upload: the file streams, the details travel as a JSON field. */
async function sendDocument(path: string, input: DocumentInput, file: File): Promise<KnowledgeDocument> {
  const form = new FormData();
  form.append("metadata", JSON.stringify(input));
  form.append("file", file);
  const t = token();
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: t ? { Authorization: `Bearer ${t}` } : undefined,
    body: form,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.message ?? `Upload failed with status ${response.status}`);
  }
  return response.json();
}

export const knowledgeApi = {
  capabilities: () => apiClient.get<KnowledgeCapabilities>("/knowledge/capabilities"),

  search: (query: KnowledgeQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") params[k] = v as string | number;
    }
    return apiClient.get<Paginated<KnowledgeSearchHit>>("/knowledge/documents", params);
  },

  stats: () => apiClient.get<KnowledgeStats>("/knowledge/documents/stats"),

  get: (id: string) => apiClient.get<KnowledgeDocument>(`/knowledge/documents/${id}`),

  upload: (input: DocumentInput, file: File) => sendDocument("/knowledge/documents", input, file),

  /** Files a new version; the current one stays readable, marked superseded. */
  supersede: (id: string, input: DocumentInput, file: File) =>
    sendDocument(`/knowledge/documents/${id}/supersede`, input, file),

  withdraw: (id: string, reason: string) =>
    apiClient.post<KnowledgeDocument>(`/knowledge/documents/${id}/withdraw`, { reason }),

  classify: (id: string, classification: Classification, reason: string) =>
    apiClient.patch<KnowledgeDocument>(`/knowledge/documents/${id}/classification`, { classification, reason }),

  /**
   * Downloads with the officer's credentials (a plain link cannot carry the
   * token) and recomputes the SHA-256 of the bytes received.
   */
  download: async (id: string) => {
    const t = token();
    const response = await fetch(`${base()}/knowledge/documents/${id}/file`, {
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
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `${id}.bin`;
    return { blob, filename, recordedHash: response.headers.get("X-Document-SHA256"), receivedHash };
  },

  checklists: (documentId?: string) =>
    apiClient.get<{ data: Checklist[] }>("/knowledge/checklists", documentId ? { documentId } : undefined),

  checklist: (id: string) => apiClient.get<Checklist>(`/knowledge/checklists/${id}`),

  createChecklist: (input: ChecklistInput) => apiClient.post<Checklist>("/knowledge/checklists", input),

  runs: (checklistId: string) => apiClient.get<{ data: ChecklistRun[] }>(`/knowledge/checklists/${checklistId}/runs`),

  startRun: (checklistId: string, subject: { caseId?: string; firId?: string }) =>
    apiClient.post<ChecklistRun>(`/knowledge/checklists/${checklistId}/runs`, subject),

  run: (id: string) => apiClient.get<ChecklistRun>(`/knowledge/runs/${id}`),

  tick: (runId: string, stepId: string, note?: string) =>
    apiClient.post<ChecklistRun>(`/knowledge/runs/${runId}/ticks`, { stepId, note }),
};

export default knowledgeApi;
