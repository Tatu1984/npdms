import apiClient from "./client";

/**
 * AI layer A4 — vehicle detection and number-plate reading (ANPR).
 *
 * Field names mirror internal/models/anpr.go. Every detection and plate read is
 * machine output: it carries its confidence, the model version that produced
 * it and the frame it came from. A watchlist match is a hit awaiting an
 * operator, never an alert by itself.
 */

export const MIN_PURPOSE_LENGTH = 10;

export type VehicleClass = "CAR" | "MOTORCYCLE" | "BUS" | "TRUCK" | "BICYCLE";
export type SourceKind = "STILL" | "FOOTAGE" | "SNAPSHOT";
export type HitStatus = "PENDING" | "CONFIRMED" | "DISMISSED";
export type WatchPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export const WATCH_PRIORITIES: WatchPriority[] = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

export interface ModuleSwitch {
  module: string;
  enabled: boolean;
  note: string;
  updatedByName: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ANPRModelInfo {
  key: string;
  file: string;
  version: string;
  sha256: string;
  licence: string;
  source: string;
  ready: boolean;
  problem: string | null;
}

export interface ANPRStatus {
  switch: ModuleSwitch;
  service: {
    connected: boolean;
    configured: boolean;
    reason?: string;
    versions?: { pipeline: string; detector: string; plateReader: string };
    models?: ANPRModelInfo[];
    vehicleClasses?: string[];
    unsupportedVehicleClasses?: string[];
    colour?: string;
    checkedAt: string;
  };
  canAnalyse: boolean;
}

export interface PlateCharacter {
  char: string;
  confidence: number;
  corrected: boolean;
  raw: string;
}

export type Box = [number, number, number, number];

export interface PlateRead {
  id: string;
  analysisId: string;
  analysisNumber: string;
  frameId: string;
  detectionId: string | null;
  cameraId: string | null;
  cameraCode: string;
  cameraName: string;
  cameraLocation: string;
  latitude: number | null;
  longitude: number | null;
  frameTime: string;
  registrationNumber: string;
  displayNumber: string;
  rawText: string;
  plateFormat: "STANDARD" | "BH" | "OLD";
  confidence: number;
  minCharConfidence: number;
  characters: PlateCharacter[];
  corrections: string[];
  box: Box;
  modelVersion: string;
  createdAt: string;
}

export interface VehicleDetection {
  id: string;
  frameId: string;
  vehicleClass: VehicleClass;
  box: Box;
  confidence: number;
  modelVersion: string;
  plateRead: PlateRead | null;
  frameTime: string;
}

export interface AnalysisFrame {
  id: string;
  frameIndex: number;
  offsetSeconds: number;
  frameTime: string;
  sha256: string;
  width: number;
  height: number;
  detections: VehicleDetection[];
  unattachedPlateReads: PlateRead[];
}

export interface WatchlistHit {
  id: string;
  hitNumber: string;
  registrationNumber: string;
  source: "LOOKOUT" | "WATCHLIST";
  lookoutId: string | null;
  lookoutNumber: string;
  lookoutSubject: string;
  watchlistEntryId: string | null;
  watchlistReason: string;
  priority: WatchPriority;
  submittedBy: string;
  submittedByName: string;
  status: HitStatus;
  reviewedByName: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  alertId: string | null;
  sightingId: string | null;
  createdAt: string;
  read: PlateRead;
}

export interface Analysis {
  id: string;
  analysisNumber: string;
  sourceKind: SourceKind;
  cameraId: string | null;
  cameraCode: string;
  cameraName: string;
  cameraLocation: string;
  latitude: number | null;
  longitude: number | null;
  purpose: string;
  capturedAt: string;
  mediaSha256: string;
  mediaFilename: string;
  mediaContentType: string;
  mediaSizeBytes: number;
  detectorVersion: string;
  plateReaderVersion: string;
  sampledFrames: number;
  sampleSeconds: number | null;
  processingMs: number | null;
  submittedBy: string;
  submittedByName: string;
  createdAt: string;
  frameCount: number;
  detectionCount: number;
  plateReadCount: number;
  hitCount: number;
  frames?: AnalysisFrame[];
  hits?: WatchlistHit[];
}

export interface WatchlistEntry {
  id: string;
  source: "WATCHLIST" | "LOOKOUT";
  registrationNumber: string;
  reason: string;
  priority: WatchPriority;
  firId: string | null;
  firNumber: string;
  lookoutId: string | null;
  lookoutNumber: string;
  expiresAt: string | null;
  addedByName: string;
  createdAt: string;
  removedAt: string | null;
  removedByName: string;
  removalNote: string | null;
  status: "ACTIVE" | "EXPIRED" | "REMOVED" | "NO_REGISTRATION";
}

export interface ReadsMapCamera {
  cameraId: string;
  code: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  reads: number;
  pendingHits: number;
  confirmedHits: number;
  lastReadAt: string | null;
}

export interface ReadsMap {
  from: string;
  to: string;
  cameras: ReadsMapCamera[];
  readsWithoutCamera: number;
}

export interface ReadSearch {
  purpose: string;
  plate?: string;
  from?: string;
  to?: string;
  cameraId?: string;
  latitude?: number;
  longitude?: number;
  radiusM?: number;
  page?: number;
  pageSize?: number;
}

export interface AccessEntry {
  id: string;
  actorName: string;
  actorBadge: string;
  accessType: "SUBMIT_ANALYSIS" | "INGEST_SNAPSHOT" | "SEARCH_READS" | "VIEW_ANALYSIS";
  purpose: string;
  filters: Record<string, unknown>;
  analysisId: string | null;
  analysisNumber: string;
  resultCount: number | null;
  ipAddress: string;
  accessedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubmitAnalysisInput {
  file: File;
  purpose: string;
  capturedAt: string;
  cameraId?: string;
  sampleSeconds?: number;
}

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const bearer = () => (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null);

/** An error from the API that keeps its code, so screens can tell "not connected" apart. */
export class AnprError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
  }
}

async function failure(response: Response, fallback: string) {
  const problem = await response.json().catch(() => null);
  return new AnprError(problem?.message ?? `${fallback} (status ${response.status})`, response.status, problem?.error ?? "");
}

export const anprApi = {
  status: () => apiClient.get<ANPRStatus>("/anpr/status"),
  setSwitch: (enabled: boolean, note: string) => apiClient.put<ANPRStatus>("/anpr/switch", { enabled, note }),

  /** Sends footage or a still as multipart form data; the server hashes it. */
  submit: async (input: SubmitAnalysisInput) => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("purpose", input.purpose);
    form.append("capturedAt", input.capturedAt);
    if (input.cameraId) form.append("cameraId", input.cameraId);
    if (input.sampleSeconds) form.append("sampleSeconds", String(input.sampleSeconds));
    const token = bearer();
    const response = await fetch(`${API_BASE()}/anpr/analyses`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw await failure(response, "Analysis failed");
    return (await response.json()) as Analysis;
  },

  analyses: (page: number, pageSize: number) =>
    apiClient.get<Paginated<Analysis>>("/anpr/analyses", { page, pageSize }),
  open: (id: string, purpose: string) => apiClient.post<Analysis>(`/anpr/analyses/${id}/access`, { purpose }),

  /** Loads a stored frame with the officer's credentials, as an object URL. */
  frameUrl: async (analysisId: string, frameId: string) => {
    const token = bearer();
    const response = await fetch(`${API_BASE()}/anpr/analyses/${analysisId}/frames/${frameId}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw await failure(response, "Frame could not be loaded");
    return URL.createObjectURL(await response.blob());
  },

  search: (q: ReadSearch) => apiClient.post<Paginated<PlateRead>>("/anpr/reads/search", q),

  watchlist: (includeClosed: boolean) =>
    apiClient.get<{ data: WatchlistEntry[] }>("/anpr/watchlist", includeClosed ? { includeClosed: "true" } : undefined),
  addWatch: (body: { registrationNumber: string; reason: string; priority: WatchPriority; expiresAt: string }) =>
    apiClient.post<WatchlistEntry>("/anpr/watchlist", body),
  removeWatch: (id: string, note: string) => apiClient.post<WatchlistEntry>(`/anpr/watchlist/${id}/remove`, { note }),

  hits: (status: "" | HitStatus, page: number, pageSize: number) =>
    apiClient.get<Paginated<WatchlistHit>>("/anpr/hits", { page, pageSize, ...(status ? { status } : {}) }),
  review: (id: string, decision: "CONFIRMED" | "DISMISSED", note: string) =>
    apiClient.post<WatchlistHit>(`/anpr/hits/${id}/review`, { decision, note }),

  map: () => apiClient.get<ReadsMap>("/anpr/map"),
  accessLog: (page: number) => apiClient.get<Paginated<AccessEntry>>("/anpr/access-log", { page, pageSize: 25 }),
};

export default anprApi;
