import apiClient from "./client";
import type { CustodyEvent } from "./custody";

/**
 * Phase 13 — Body-Worn Camera Evidence API.
 *
 * Field names mirror the Go models in internal/models/bodycam.go. Nullable
 * columns arrive as `null`. Recordings are held under a short non-evidential
 * retention class until linked to an FIR or case, which registers them in the
 * Phase 02 evidence register.
 */

export type BWCDeviceStatus = "IN_SERVICE" | "CHARGING" | "FAULTY" | "RETIRED";
export type BWCReadingSource = "DOCK" | "OFFICER";
export type BWCRetentionClass = "NON_EVIDENTIAL" | "EVIDENTIAL";

export interface BWCReading {
  id: string;
  deviceId: string;
  batteryPercent: number;
  storagePercent: number;
  source: BWCReadingSource;
  reportedBy: string;
  reportedByName: string;
  observedAt: string;
  stale: boolean;
}

export interface BWCAssignment {
  id: string;
  deviceId: string;
  deviceNumber: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  issuedBy: string;
  issuedByName: string;
  shiftLabel: string;
  issuedAt: string;
  expectedReturn: string | null;
  returnedAt: string | null;
  receivedBy: string | null;
  receivedByName: string;
  returnNote: string | null;
  recordingCount: number;
  overdue: boolean;
}

export interface BWCDevice {
  id: string;
  deviceNumber: string;
  serialNumber: string;
  model: string;
  stationId: string;
  stationName: string;
  status: BWCDeviceStatus;
  statusNote: string | null;
  currentIssue: BWCAssignment | null;
  latestReading: BWCReading | null;
  createdAt: string;
  updatedAt: string;
}

export interface BWCRecording {
  id: string;
  recordingNumber: string;
  deviceId: string;
  deviceNumber: string;
  assignmentId: string;
  officerId: string;
  officerName: string;
  stationName: string;
  uploadedBy: string;
  uploadedByName: string;
  startedAt: string;
  endedAt: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  retentionClass: BWCRetentionClass;
  retainUntil: string | null;
  evidenceId: string | null;
  evidenceNumber: string;
  firId: string | null;
  firNumber: string;
  caseId: string | null;
  caseNumber: string;
  dispatchIncidentId: string | null;
  dispatchIncidentNumber: string;
  linkNote: string | null;
  linkedByName: string;
  linkedAt: string | null;
  purgedAt: string | null;
  purgedByName: string;
  purgeReason: string | null;
  expired: boolean;
}

export interface BWCAccessEntry {
  id: string;
  recordingId: string;
  actorId: string;
  actorName: string;
  accessType: "VIEW" | "DOWNLOAD" | "DENIED";
  purpose: string;
  ipAddress: string;
  accessedAt: string;
}

export interface BWCStats {
  devices: number;
  inService: number;
  charging: number;
  faulty: number;
  retired: number;
  onShift: number;
  overdueReturns: number;
  staleReadings: number;
  heldRecordings: number;
  expiredRecordings: number;
  evidentialRecordings: number;
}

export interface BWCRules {
  readingStaleAfterHours: number;
  nonEvidentialRetentionDays: number;
  maxUploadMegabytes: number;
}

export interface BWCVerification {
  recordingId: string;
  result: "intact" | "broken" | "purged";
  recordedSha256: string;
  computedSha256: string;
  checkedAt: string;
  evidenceId?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DeviceQuery {
  search?: string;
  status?: BWCDeviceStatus;
  page?: number;
  pageSize?: number;
}

export interface RecordingQuery {
  search?: string;
  retention?: BWCRetentionClass;
  deviceId?: string;
  expired?: boolean;
  page?: number;
  pageSize?: number;
}

const params = (q: Record<string, unknown>) => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== "" && v !== false) out[k] = typeof v === "boolean" ? "true" : (v as string | number);
  }
  return out;
};

const API_BASE = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
const bearer = () =>
  typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

async function problemMessage(response: Response, fallback: string) {
  const problem = await response.json().catch(() => null);
  return problem?.message ?? `${fallback} (status ${response.status})`;
}

export const bodycamApi = {
  devices: (q: DeviceQuery = {}) => apiClient.get<Paginated<BWCDevice>>("/bodycam/devices", params({ ...q })),
  stats: () => apiClient.get<{ stats: BWCStats; rules: BWCRules }>("/bodycam/devices/stats"),
  device: (id: string) => apiClient.get<BWCDevice>(`/bodycam/devices/${id}`),
  registerDevice: (body: { serialNumber: string; model: string; stationId?: string }) =>
    apiClient.post<BWCDevice>("/bodycam/devices", body),
  setStatus: (id: string, body: { status: BWCDeviceStatus; note?: string }) =>
    apiClient.patch<BWCDevice>(`/bodycam/devices/${id}/status`, body),

  readings: (id: string) => apiClient.get<{ data: BWCReading[] }>(`/bodycam/devices/${id}/readings`),
  recordReading: (
    id: string,
    body: { batteryPercent: number; storagePercent: number; source: BWCReadingSource; observedAt?: string },
  ) => apiClient.post<BWCReading>(`/bodycam/devices/${id}/readings`, body),

  assignments: (id: string) => apiClient.get<Paginated<BWCAssignment>>(`/bodycam/devices/${id}/assignments`, { pageSize: 50 }),
  issue: (id: string, body: { officerId: string; shiftLabel: string; expectedReturn?: string }) =>
    apiClient.post<BWCAssignment>(`/bodycam/devices/${id}/assignments`, body),
  returnCamera: (id: string, assignmentId: string, body: { note?: string }) =>
    apiClient.post<BWCAssignment>(`/bodycam/devices/${id}/assignments/${assignmentId}/return`, body),

  /**
   * Docks one recording as multipart form data. The server hashes the bytes as
   * they stream in; the client never supplies a digest.
   */
  dock: async (deviceId: string, assignmentId: string, file: File, startedAt: string, endedAt: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("startedAt", startedAt);
    form.append("endedAt", endedAt);
    const token = bearer();
    const response = await fetch(`${API_BASE()}/bodycam/devices/${deviceId}/assignments/${assignmentId}/recordings`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error(await problemMessage(response, "Upload failed"));
    return (await response.json()) as BWCRecording;
  },

  recordings: (q: RecordingQuery = {}) =>
    apiClient.get<Paginated<BWCRecording>>("/bodycam/recordings", params({ ...q })),
  access: (id: string, purpose: string) => apiClient.post<BWCRecording>(`/bodycam/recordings/${id}/access`, { purpose }),
  verify: (id: string) => apiClient.post<BWCVerification>(`/bodycam/recordings/${id}/verify`, {}),
  link: (id: string, body: { firId?: string; caseId?: string; dispatchIncidentId?: string; note: string }) =>
    apiClient.post<BWCRecording>(`/bodycam/recordings/${id}/link`, body),
  chain: (id: string) => apiClient.get<{ data: CustodyEvent[] }>(`/bodycam/recordings/${id}/custody`),
  accessLog: (id: string) => apiClient.get<{ data: BWCAccessEntry[] }>(`/bodycam/recordings/${id}/access-log`),
  purge: (id: string, reason: string) => apiClient.post<BWCRecording>(`/bodycam/recordings/${id}/purge`, { reason }),

  /**
   * Downloads footage with the officer's credentials and a stated purpose, then
   * recomputes the SHA-256 of what arrived so the copy is checked on receipt.
   */
  download: async (id: string, purpose: string) => {
    const token = bearer();
    const response = await fetch(
      `${API_BASE()}/bodycam/recordings/${id}/file?purpose=${encodeURIComponent(purpose)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    if (!response.ok) throw new Error(await problemMessage(response, "Download failed"));
    const blob = await response.blob();
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const receivedHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `${id}.bin`;
    return { blob, filename, recordedHash: response.headers.get("X-Recording-SHA256"), receivedHash };
  },
};

export default bodycamApi;
