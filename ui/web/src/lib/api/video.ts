import apiClient from "./client";

/**
 * Phase 03 — CCTV & Video Intelligence (functional layer).
 *
 * Field names mirror the Go models in internal/models/video.go exactly.
 * Cameras never carry stream credentials; `hasCredentials` says whether any
 * are stored. Searching or opening events requires a stated purpose, which the
 * server records before it returns anything.
 */

export type CameraOwner = "KP" | "KMC" | "TRAFFIC" | "PRIVATE" | "OTHER";
export type StreamType = "RTSP" | "ONVIF" | "NVR" | "NONE";
export type CameraRetention = "SHORT" | "STANDARD" | "EXTENDED";
export type RetentionClass = CameraRetention | "EVIDENTIAL";
/** Only ever what a real reachability check measured. */
export type CameraHealth = "REACHABLE" | "UNREACHABLE" | "UNCHECKED" | "NO_STREAM";
export type CameraStatus = "ACTIVE" | "DECOMMISSIONED";

export const CAMERA_OWNERS: CameraOwner[] = ["KP", "KMC", "TRAFFIC", "PRIVATE", "OTHER"];
export const STREAM_TYPES: StreamType[] = ["RTSP", "ONVIF", "NVR", "NONE"];
export const CAMERA_RETENTIONS: CameraRetention[] = ["SHORT", "STANDARD", "EXTENDED"];
/** The server's stated rule for each expiring class. */
export const RETENTION_DAYS: Record<CameraRetention, number> = { SHORT: 7, STANDARD: 30, EXTENDED: 90 };

export interface Camera {
  id: string;
  cameraNumber: string;
  code: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  stationId: string;
  stationName: string;
  ownerAgency: CameraOwner;
  streamType: StreamType;
  streamHost: string | null;
  streamPort: number | null;
  streamPath: string | null;
  hasCredentials: boolean;
  retentionClass: CameraRetention;
  maskingRequired: boolean;
  status: CameraStatus;
  decommissionNote: string | null;
  health: CameraHealth;
  lastCheckedAt: string | null;
  lastSeenAt: string | null;
  openEvents: number;
  createdAt: string;
  updatedAt: string;
  // Live streaming through the Edge Agent. The upload token is never here.
  streamingEnabled: boolean;
  /** The Edge Agent's Camera ID / stream key. Useless without the token. */
  ingestKey: string | null;
  streamingEnabledAt: string | null;
  tokenRotatedAt: string | null;
  lastSegmentAt: string | null;
  /** Judged by the server from the playlist the Edge Agent last wrote. */
  liveStatus: LiveStatus;
  liveAvailable: boolean;
  /** Playlist URL; playback needs an open, purpose-logged viewing session. */
  liveUrl: string | null;
  liveCheckedAt: string | null;
}

/**
 * ONLINE: segments arriving. CONNECTING: the agent wrote a playlist, no video
 * yet. STOPPED: the feed ended or the agent went quiet. OFFLINE: nothing stored.
 */
export type LiveStatus = "ONLINE" | "CONNECTING" | "STOPPED" | "OFFLINE";

/** Shown exactly once — on enabling streaming or rotating the token. */
export interface EdgeAgentConfig {
  /** Edge Agent → Portal Connection → Ingest URL */
  ingestUrl: string;
  /** Edge Agent → camera → Ingest token. Only its hash is stored. */
  ingestToken: string;
  /** Edge Agent → camera → Camera ID and Stream key */
  cameraId: string;
  /** The full target the agent builds from the two above. */
  publishUrl: string;
}

export type CameraWithEdgeAgent = Camera & { edgeAgent?: EdgeAgentConfig };

export interface LiveViewSession {
  id: string;
  cameraIds: string[];
  purpose: string;
  startedAt: string;
  expiresAt: string;
  maxUntil: string;
}

export interface LiveMediaStatus {
  configured: boolean;
  backend: string;
  message?: string;
}

export interface CameraHealthCheck {
  id: string;
  cameraId: string;
  checkedAt: string;
  reachable: boolean;
  latencyMs: number | null;
  error: string | null;
  checkedBy: string | null;
  checkedByName: string;
}

export interface CameraStats {
  total: number;
  active: number;
  decommissioned: number;
  reachable: number;
  unreachable: number;
  unchecked: number;
  noStream: number;
  streaming: number;
  eventsRaised: number;
  eventsExpired: number;
}

export type VideoEventType =
  | "SUSPICIOUS_ACTIVITY"
  | "ABANDONED_OBJECT"
  | "CROWD_BUILDUP"
  | "TRAFFIC_VIOLATION"
  | "ACCIDENT"
  | "ASSAULT"
  | "THEFT"
  | "VEHICLE_OF_INTEREST"
  | "PERSON_OF_INTEREST"
  | "CAMERA_TAMPERING"
  | "OTHER";

export const VIDEO_EVENT_TYPES: VideoEventType[] = [
  "SUSPICIOUS_ACTIVITY",
  "ABANDONED_OBJECT",
  "CROWD_BUILDUP",
  "TRAFFIC_VIOLATION",
  "ACCIDENT",
  "ASSAULT",
  "THEFT",
  "VEHICLE_OF_INTEREST",
  "PERSON_OF_INTEREST",
  "CAMERA_TAMPERING",
  "OTHER",
];

export type EventSeverity = "low" | "medium" | "high" | "critical";
export type VideoEventStatus = "RAISED" | "CONFIRMED" | "DISMISSED";

export interface VideoEvent {
  id: string;
  eventNumber: string;
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  cameraLocation: string;
  stationName: string;
  eventType: VideoEventType;
  severity: EventSeverity;
  occurredAt: string;
  description: string;
  origin: "officer" | "supervisor" | "derived" | "ai";
  status: VideoEventStatus;
  raisedBy: string;
  raisedByName: string;
  triagedBy: string | null;
  triagedByName: string;
  triagedAt: string | null;
  triageNote: string | null;
  firId: string | null;
  firNumber: string;
  caseId: string | null;
  caseNumber: string;
  linkedByName: string;
  linkedAt: string | null;
  retentionClass: RetentionClass;
  retainUntil: string | null;
  maskingRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoEventStats {
  raised: number;
  confirmed: number;
  dismissed: number;
  linked: number;
  criticalAwaitingTriage: number;
  expiredAwaitingPurge: number;
}

export interface VideoAccessEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorBadge: string;
  accessType: "SEARCH" | "VIEW_EVENT" | "VIEW_LIVE";
  purpose: string;
  filters: Record<string, unknown>;
  eventId: string | null;
  eventNumber: string;
  resultCount: number | null;
  /** The cameras a live viewing session covered. */
  cameraIds: string[];
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

export interface CameraQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CameraStatus;
  health?: CameraHealth;
  ownerAgency?: CameraOwner;
}

export interface CameraInput {
  code: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  ownerAgency: CameraOwner;
  streamType: StreamType;
  streamHost: string | null;
  streamPort: number | null;
  streamPath: string | null;
  credentialUsername: string | null;
  /** Sent only when entering or replacing credentials; never read back. */
  credentialSecret: string | null;
  retentionClass: CameraRetention;
  maskingRequired: boolean;
  /** Issue Edge Agent settings with the registration (register only). */
  enableStreaming?: boolean;
}

export type CameraUpdateInput = Omit<CameraInput, "code" | "enableStreaming"> & { clearCredentials: boolean };

export interface RaiseEventInput {
  cameraId: string;
  eventType: VideoEventType;
  severity: EventSeverity;
  occurredAt: string;
  description: string;
}

export interface EventSearch {
  purpose: string;
  cameraId?: string;
  status?: VideoEventStatus;
  eventType?: VideoEventType;
  severity?: EventSeverity;
  from?: string;
  to?: string;
  text?: string;
  page?: number;
  pageSize?: number;
}

export const MIN_PURPOSE_LENGTH = 10;

/** Server floors for live viewing (see LiveViewMinRank in the API). */
export const LIVE_VIEW_MIN_ROLE = "ASI" as const;
export const LIVE_VIEW_MASKED_MIN_ROLE = "SHO" as const;
export const MAX_LIVE_VIEW_CAMERAS = 64;

export const videoApi = {
  cameras: (query: CameraQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v as string | number;
    return apiClient.get<Paginated<Camera>>("/video/cameras", params);
  },
  camera: (id: string) => apiClient.get<Camera>(`/video/cameras/${id}`),
  cameraStats: () => apiClient.get<CameraStats>("/video/cameras/stats"),
  healthChecks: (id: string) => apiClient.get<{ data: CameraHealthCheck[] }>(`/video/cameras/${id}/health-checks`),
  registerCamera: (input: CameraInput) => apiClient.post<CameraWithEdgeAgent>("/video/cameras", input),
  updateCamera: (id: string, input: CameraUpdateInput) => apiClient.put<Camera>(`/video/cameras/${id}`, input),
  decommission: (id: string, note: string) => apiClient.post<Camera>(`/video/cameras/${id}/decommission`, { note }),
  checkHealth: (id: string) => apiClient.post<CameraHealthCheck>(`/video/cameras/${id}/health-check`, {}),

  // Live streaming through the Edge Agent
  liveCameras: () => apiClient.get<{ data: Camera[]; media: LiveMediaStatus }>("/video/live/cameras"),
  mediaStatus: () => apiClient.get<LiveMediaStatus>("/video/live/media-status"),
  enableStreaming: (id: string) =>
    apiClient.post<{ edgeAgent: EdgeAgentConfig }>(`/video/cameras/${id}/streaming/enable`, {}),
  rotateIngestToken: (id: string) =>
    apiClient.post<{ edgeAgent: EdgeAgentConfig }>(`/video/cameras/${id}/streaming/rotate-token`, {}),
  disableStreaming: (id: string, reason: string) =>
    apiClient.post<{ streamingEnabled: false }>(`/video/cameras/${id}/streaming/disable`, { reason }),
  /** Purpose-logged once per session; playback is refused outside one. */
  startLiveViewing: (purpose: string, cameraIds: string[]) =>
    apiClient.post<LiveViewSession>("/video/live/sessions", { purpose, cameraIds }),
  endLiveViewing: (id: string) => apiClient.post<{ ended: true }>(`/video/live/sessions/${id}/end`, {}),

  raiseEvent: (input: RaiseEventInput) => apiClient.post<VideoEvent>("/video/events", input),
  eventStats: () => apiClient.get<VideoEventStats>("/video/events/stats"),
  /** Purpose-logged: the server records the purpose, filters and result count. */
  searchEvents: (search: EventSearch) => apiClient.post<Paginated<VideoEvent>>("/video/events/search", search),
  /** Purpose-logged view of a single event. */
  openEvent: (id: string, purpose: string) => apiClient.post<VideoEvent>(`/video/events/${id}/access`, { purpose }),
  triage: (id: string, decision: "CONFIRMED" | "DISMISSED", note: string) =>
    apiClient.post<VideoEvent>(`/video/events/${id}/triage`, { decision, note }),
  link: (id: string, target: { firId?: string; caseId?: string }) =>
    apiClient.post<VideoEvent>(`/video/events/${id}/link`, target),
  setRetention: (id: string, retentionClass: RetentionClass, maskingRequired: boolean, reason: string) =>
    apiClient.post<VideoEvent>(`/video/events/${id}/retention`, { retentionClass, maskingRequired, reason }),
  purgeExpired: () => apiClient.post<{ purged: number; eventNumbers: string[] }>("/video/events/purge-expired", {}),
  accessLog: (query: { page?: number; pageSize?: number; actorId?: string; eventId?: string } = {}) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params[k] = v as string | number;
    return apiClient.get<Paginated<VideoAccessEntry>>("/video/access-log", params);
  },
};

export default videoApi;
