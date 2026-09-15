import apiClient, { ApiClientError } from "./client";

/**
 * Face recognition for missing persons.
 *
 * Field names mirror internal/models/face_recognition.go. Every result is a
 * candidate for an officer to confirm; nothing here is an identification.
 * When the face recognition service is not connected the API answers 503 with
 * error "fr_service_not_connected" and the screens say so.
 */

export const FR_DEMO_LABEL = "Demo — synthetic faces";

export type FRKind = "ORDER" | "DEMO";
export type FRMode = "OFF" | "DEMO" | "LIVE";
export type FRSourceMedia = "UPLOADED_FOOTAGE" | "UPLOADED_STILL" | "CAMERA_SNAPSHOT";
export type FRCandidateStatus = "PENDING" | "CONFIRMED" | "REJECTED";
export type FRPhotoKind = "REPORT_PHOTO" | "SYNTHETIC_TEST";

export interface FRAuthorisation {
  id: string;
  kind: FRKind;
  orderReference: string | null;
  issuingAuthority: string | null;
  orderDate: string | null;
  scope: string[];
  scopeNote: string | null;
  validFrom: string;
  validUntil: string;
  recordedBy: string;
  recordedByName: string;
  recordedAt: string;
  revokedAt: string | null;
  revokedByName: string | null;
  revocationReason: string | null;
  active: boolean;
  demoLabel?: string;
}

export interface FRConfig {
  matchThreshold: number;
  sampleFps: number;
  mergeWindowSeconds: number;
}

export interface FRServiceStatus {
  configured: boolean;
  reachable: boolean;
  message: string;
  modelVersion?: string;
  models?: {
    detector?: { name: string; version: string; licence: string; sha256: string; source: string };
    recognizer?: { name: string; version: string; licence: string; sha256: string; source: string };
  };
  checkedAt: string;
}

export interface FRStatus {
  switchOn: boolean;
  mode: FRMode;
  modeReason: string;
  demoLabel?: string;
  activeOrder: FRAuthorisation | null;
  activeDemo: FRAuthorisation | null;
  config: FRConfig;
  switchReason: string | null;
  updatedAt: string;
  updatedByName: string | null;
  service: FRServiceStatus;
}

export interface FRQuality {
  detectionScore: number;
  facePx: number;
  sharpness: number;
  brightness: number;
  yawRatio: number;
  pitchRatio: number;
  rollDeg: number;
  score: number;
  issues: string[];
}

export interface FaceEnrolment {
  id: string;
  reportId: string;
  photoId: string | null;
  syntheticPhotoId: string | null;
  isDemo: boolean;
  authorisationId: string;
  authorisationKind: FRKind;
  status: "ENROLLED" | "REJECTED" | "RETIRED";
  rejectionReason: string | null;
  rejectionMessage: string | null;
  quality: FRQuality | null;
  qualityScore: number | null;
  modelVersion: string;
  photoSha256: string;
  hasFaceCrop: boolean;
  automatic: boolean;
  enrolledByName: string;
  createdAt: string;
  retiredAt: string | null;
  retireReason: string | null;
  currentModel: boolean;
  demoLabel?: string;
}

export interface FRPhoto {
  id: string;
  reportId: string;
  kind: FRPhotoKind;
  isPrimary: boolean;
  source: string | null;
  providedByName: string | null;
  relationship: string | null;
  consentRecorded: boolean | null;
  syntheticSource: string | null;
  sha256: string;
  contentType: string;
  createdAt: string;
  enrolment: FaceEnrolment | null;
  demoLabel?: string;
}

export interface FRReportView {
  photos: FRPhoto[];
  modelVersion: string;
  pendingCandidates: number;
}

export interface FaceMatchCandidate {
  id: string;
  searchId: string;
  reportId: string;
  reportNumber: string;
  personName: string;
  reportStatus: string;
  masked: boolean;
  enrolmentId: string;
  photoId: string | null;
  syntheticPhotoId: string | null;
  isDemo: boolean;
  cameraId: string | null;
  cameraName: string | null;
  cameraCode: string | null;
  sourceMedia: FRSourceMedia;
  purpose: string;
  originalFilename: string | null;
  mediaSha256: string;
  searchMediaSha256: string;
  frameOffsetMs: number | null;
  frameTime: string;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  boundingBox: { x: number; y: number; w: number; h: number };
  frameWidth: number | null;
  frameHeight: number | null;
  detectionScore: number | null;
  quality: FRQuality | null;
  similarity: number;
  modelVersion: string;
  thresholdUsed: number;
  status: FRCandidateStatus;
  submittedBy: string;
  submittedByName: string;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  sightingId: string | null;
  createdAt: string;
  demoLabel?: string;
}

export interface FaceMatchSearch {
  id: string;
  isDemo: boolean;
  sourceMedia: FRSourceMedia;
  cameraName: string | null;
  purpose: string;
  originalFilename: string | null;
  mediaSha256: string;
  mediaRetained: boolean;
  recordedAt: string;
  thresholdUsed: number;
  modelVersion: string | null;
  sampleFps: number | null;
  gallerySize: number | null;
  framesAnalysed: number | null;
  facesSeen: number | null;
  facesCompared: number | null;
  candidatesCreated: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  error: string | null;
  submittedByName: string;
  submittedAt: string;
  demoLabel?: string;
}

export interface FaceMatchSearchResult {
  search: FaceMatchSearch;
  candidates: FaceMatchCandidate[];
  message: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RecordAuthorisationInput {
  kind: FRKind;
  orderReference?: string;
  issuingAuthority?: string;
  orderDate?: string;
  scope?: string[];
  scopeNote?: string;
  validFrom?: string;
  validUntil: string;
}

export interface SearchInput {
  file: File;
  purpose: string;
  recordedAt: string;
  cameraId?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  /** Run against synthetic test photos under the DEMO authorisation. */
  demo?: boolean;
}

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const bearer = () => (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null);

async function send<T>(path: string, form: FormData): Promise<T> {
  const token = bearer();
  const csrf = apiClient.getCsrfToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const response = await fetch(`${API_BASE()}${path}`, { method: "POST", body: form, headers });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiClientError(problem?.message ?? `Request failed (status ${response.status})`, response.status, problem?.error ?? "error");
  }
  return (await response.json()) as T;
}

/** True when the error means the face recognition service is absent or down. */
export const isServiceProblem = (err: unknown) =>
  err instanceof ApiClientError && (err.errorType === "fr_service_not_connected" || err.errorType === "fr_service_unavailable");

export const faceRecognitionApi = {
  status: () => apiClient.get<FRStatus>("/face-recognition/status"),
  authorisations: () => apiClient.get<{ data: FRAuthorisation[] }>("/face-recognition/authorisations"),
  recordAuthorisation: (input: RecordAuthorisationInput) => apiClient.post<FRAuthorisation>("/face-recognition/authorisations", input),
  revokeAuthorisation: (id: string, reason: string) =>
    apiClient.post<FRAuthorisation>(`/face-recognition/authorisations/${id}/revoke`, { reason }),
  updateSettings: (input: { enabled?: boolean; matchThreshold?: number; sampleFps?: number; reason: string }) =>
    apiClient.put<FRStatus>("/face-recognition/settings", input),

  report: (reportId: string) => apiClient.get<FRReportView>(`/missing-persons/${reportId}/face-recognition`),
  enrol: (reportId: string, photoId?: string, kind?: FRPhotoKind) =>
    apiClient.post<{ photos: FRPhoto[] }>(`/missing-persons/${reportId}/face-recognition/enrol`, photoId ? { photoId, kind } : {}),
  withdraw: (reportId: string, enrolmentId: string, reason: string) =>
    apiClient.post<FaceEnrolment>(`/missing-persons/${reportId}/face-recognition/enrolments/${enrolmentId}/withdraw`, { reason }),
  reportCandidates: (reportId: string) =>
    apiClient.get<{ data: FaceMatchCandidate[] }>(`/missing-persons/${reportId}/face-recognition/candidates`),

  uploadSyntheticPhoto: (reportId: string, file: File, syntheticSource: string, declared: boolean) => {
    const form = new FormData();
    form.append("file", file);
    form.append("syntheticSource", syntheticSource);
    form.append("declaredSynthetic", declared ? "true" : "false");
    return send<FRPhoto>(`/missing-persons/${reportId}/face-recognition/synthetic-photos`, form);
  },

  search: (input: SearchInput) => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("purpose", input.purpose);
    form.append("recordedAt", input.recordedAt);
    if (input.cameraId) form.append("cameraId", input.cameraId);
    if (input.location) form.append("location", input.location);
    if (input.latitude) form.append("latitude", input.latitude);
    if (input.longitude) form.append("longitude", input.longitude);
    if (input.demo !== undefined) form.append("demo", String(input.demo));
    return send<FaceMatchSearchResult>("/face-recognition/searches", form);
  },

  queue: (q: { status?: FRCandidateStatus | "ALL"; demo?: boolean; page?: number; pageSize?: number } = {}) => {
    const params: Record<string, string | number> = {};
    if (q.status) params.status = q.status;
    if (q.demo !== undefined) params.demo = String(q.demo);
    if (q.page) params.page = q.page;
    if (q.pageSize) params.pageSize = q.pageSize;
    return apiClient.get<Paginated<FaceMatchCandidate>>("/face-recognition/candidates", params);
  },
  confirm: (id: string, body: { note?: string; location?: string; latitude?: number; longitude?: number }) =>
    apiClient.post<{ candidate: FaceMatchCandidate; sighting?: { id: string } }>(`/face-recognition/candidates/${id}/confirm`, body),
  reject: (id: string, note: string) =>
    apiClient.post<{ candidate: FaceMatchCandidate }>(`/face-recognition/candidates/${id}/reject`, { note }),

  /** Image paths; fetched with the officer's token by AuthImage. */
  paths: {
    candidateCrop: (id: string) => `/face-recognition/candidates/${id}/crop`,
    candidateFrame: (id: string) => `/face-recognition/candidates/${id}/frame`,
    enrolmentFace: (id: string) => `/face-recognition/enrolments/${id}/face`,
    photo: (reportId: string, photoId: string, kind: FRPhotoKind) =>
      `/missing-persons/${reportId}/face-recognition/photos/${photoId}/image?kind=${kind}`,
  },

  fetchImage: async (path: string): Promise<Blob> => {
    const token = bearer();
    const response = await fetch(`${API_BASE()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) throw new Error(`Image not available (status ${response.status})`);
    return response.blob();
  },
};

export default faceRecognitionApi;
