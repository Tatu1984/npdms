import apiClient from "./client";

/**
 * AI layer A0 — the model gateway, the model registry and the review queue.
 *
 * Types mirror the Go models in internal/models/ai_decision.go and the gateway
 * status in internal/ai/gateway.go. Three rules from the API shape everything
 * here, and the screens state them rather than work around them:
 *
 *  - a model's output is a lead. A suggestion is PENDING until an officer
 *    approves, rejects or overrides it. Nothing in this client approves one.
 *  - every suggestion carries its confidence, its model version and the record
 *    text it relied on, so an officer can check it against the record.
 *  - a model is switched on only after an evaluation of that exact version has
 *    passed. The API answers 409 when someone tries; that is a stated rule and
 *    is shown as one.
 */

export type AIDecisionType =
  | "STATUTE_SUGGESTION"
  | "CRIME_CATEGORY"
  | "COMPLAINT_CATEGORY"
  | "COMPLAINT_ROUTING"
  | "DOCUMENT_CLASSIFICATION"
  | "DOCUMENT_TEXT"
  | "ENTITY_EXTRACTION"
  | "KNOWLEDGE_ANSWER"
  | "FACE_MATCH"
  | "PLATE_READ";

/** There is deliberately no auto-approved status. */
export type AIDecisionStatus = "PENDING" | "APPROVED" | "REJECTED" | "OVERRIDDEN" | "EXPIRED";

export type AIDecisionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AIFeedbackType = "CORRECT" | "INCORRECT" | "PARTIALLY_CORRECT";

export const DECISION_TYPES: AIDecisionType[] = [
  "STATUTE_SUGGESTION",
  "CRIME_CATEGORY",
  "COMPLAINT_CATEGORY",
  "COMPLAINT_ROUTING",
  "DOCUMENT_CLASSIFICATION",
  "DOCUMENT_TEXT",
  "ENTITY_EXTRACTION",
  "KNOWLEDGE_ANSWER",
  "FACE_MATCH",
  "PLATE_READ",
];

export const DECISION_PRIORITIES: AIDecisionPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

/** One record, and the text within it, that a suggestion relied on. */
export interface AISource {
  recordType: string;
  recordId?: string;
  reference?: string;
  excerpt?: string;
}

/** One suggestion from one model, awaiting an officer. */
export interface AIDecision {
  id: string;
  type: AIDecisionType;
  status: AIDecisionStatus;
  priority: AIDecisionPriority;
  module?: string;

  sourceType: string;
  sourceId: string;
  sourceReference?: string;

  modelName: string;
  modelVersion: string;
  prediction: string;
  predictionData?: string;
  confidence: number;
  confidenceThreshold: number;
  language?: string;
  sources: AISource[] | null;

  alternatives?: string;

  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  humanDecision?: string;
  overrideReason?: string;

  assignedTo?: string;
  assignedAt?: string;
  dueBy?: string;

  requestedBy: string;
  stationId?: string;
  processingTimeMs: number;

  createdAt: string;
  updatedAt: string;
}

/** One entry in the model registry. */
export interface AIModelConfig {
  id: string;
  modelName: string;
  modelVersion: string;
  decisionType: AIDecisionType;
  module?: string;
  task?: string;
  endpointEnv?: string;
  licence?: string;
  sourceUrl?: string;
  confidenceThreshold: number;
  isEnabled: boolean;
  requiresReview: boolean;
  reviewTimeout: number;
  maxQueueSize: number;
  description?: string;
  configData?: string;
  registeredBy?: string;
  retiredAt?: string;
  retiredReason?: string;
  /** Filled in on read: the state of the model's own service. */
  connected?: boolean;
  measured: boolean;
  moduleOn: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What a model service reports about itself. */
export interface AIServiceHealth {
  service: string;
  modelName: string;
  modelVersion: string;
  licence?: string;
  ready: boolean;
}

/** A registry entry with the state of its service on this deployment. */
export interface AIGatewayStatus extends AIModelConfig {
  hasClient: boolean;
  connected: boolean;
  reachable?: boolean;
  reports?: AIServiceHealth;
  note?: string;
}

export interface AIGatewayState {
  data: AIGatewayStatus[] | null;
  models: number;
  enabled: number;
  connected: number;
  /** Plain sentence when nothing is registered or nothing is connected. */
  note: string;
}

/** One measurement of one model version. Append-only. */
export interface AIModelEvaluation {
  id: string;
  modelName: string;
  modelVersion: string;
  dataset: string;
  datasetSize: number;
  datasetSha256?: string;
  metric: string;
  threshold: number;
  measured: number;
  passed: boolean;
  limitations?: string;
  notes?: string;
  runBy: string;
  runByName?: string;
  runAt: string;
}

/** The per-module off switch. Off at installation. */
export interface AIModuleSwitch {
  module: string;
  enabled: boolean;
  config?: string;
  reason?: string;
  note?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
}

/** What officers did with a model's suggestions. */
export interface AIAcceptance {
  modelName: string;
  module?: string;
  type?: string;
  stationId?: string;
  stationName?: string;
  language?: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  overridden: number;
  expired: number;
  reviewed: number;
  acceptedRate?: number;
  overrideRate?: number;
  avgConfidence?: number;
}

export type AcceptanceGroupBy = "station" | "language" | "type" | "model";

export interface AIAcceptanceResponse {
  data: AIAcceptance[] | null;
  groupBy: AcceptanceGroupBy;
  start: string;
  end: string;
}

/**
 * Queue statistics, normalised.
 *
 * The API answers this one in snake_case (`pending_count`, `avg_confidence`,
 * `by_status`, `by_type`, `total_decisions`) rather than the camelCase the
 * rest of the AI endpoints use, so the client reads either spelling and the
 * screens see one shape.
 */
export interface AIReviewStats {
  pendingCount: number;
  criticalCount: number;
  overdueCount: number;
  totalDecisions: number;
  totalReviewed30Days: number;
  avgConfidence: number;
  avgReviewTimeHours: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

interface RawStats {
  pending_count?: number;
  pendingCount?: number;
  critical_count?: number;
  criticalCount?: number;
  overdue_count?: number;
  overdueCount?: number;
  total_decisions?: number;
  totalDecisions?: number;
  total_reviewed_30_days?: number;
  totalReviewed30Days?: number;
  avg_confidence?: number;
  avgConfidence?: number;
  avg_review_time_hours?: number;
  avgReviewTimeHours?: number;
  by_status?: Record<string, number>;
  byStatus?: Record<string, number>;
  by_type?: Record<string, number>;
  byType?: Record<string, number>;
}

function normaliseStats(raw: RawStats): AIReviewStats {
  const byStatus = raw.by_status ?? raw.byStatus ?? {};
  return {
    pendingCount: raw.pending_count ?? raw.pendingCount ?? byStatus.PENDING ?? 0,
    criticalCount: raw.critical_count ?? raw.criticalCount ?? 0,
    overdueCount: raw.overdue_count ?? raw.overdueCount ?? 0,
    totalDecisions: raw.total_decisions ?? raw.totalDecisions ?? 0,
    totalReviewed30Days:
      raw.total_reviewed_30_days ??
      raw.totalReviewed30Days ??
      (byStatus.APPROVED ?? 0) + (byStatus.REJECTED ?? 0) + (byStatus.OVERRIDDEN ?? 0),
    avgConfidence: raw.avg_confidence ?? raw.avgConfidence ?? 0,
    avgReviewTimeHours: raw.avg_review_time_hours ?? raw.avgReviewTimeHours ?? 0,
    byStatus,
    byType: raw.by_type ?? raw.byType ?? {},
  };
}

export interface AIQueueResponse {
  decisions: AIDecision[] | null;
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}

export interface AIQueueQuery {
  type?: AIDecisionType;
  priority?: AIDecisionPriority;
  page?: number;
  pageSize?: number;
}

export interface AIDecisionFeedback {
  id: string;
  decisionId: string;
  feedbackType: AIFeedbackType;
  feedbackBy: string;
  correctValue?: string;
  comments?: string;
  usedForTraining: boolean;
  createdAt: string;
}

export interface AIDecisionHistory {
  decision: AIDecision;
  feedback: AIDecisionFeedback[] | null;
  assignments: unknown[] | null;
}

export interface RegisterModelInput {
  modelName: string;
  modelVersion: string;
  decisionType: AIDecisionType;
  module?: string;
  task?: string;
  endpointEnv?: string;
  licence?: string;
  sourceUrl?: string;
  /** A fraction between 0 and 1; the API refuses anything else. */
  confidenceThreshold: number;
  reviewTimeout?: number;
  maxQueueSize?: number;
  description?: string;
}

export interface UpdateModelInput {
  confidenceThreshold?: number;
  isEnabled?: boolean;
  modelVersion?: string;
  endpointEnv?: string;
  licence?: string;
  sourceUrl?: string;
  reviewTimeout?: number;
  maxQueueSize?: number;
  description?: string;
}

export interface RecordEvaluationInput {
  modelName: string;
  modelVersion: string;
  dataset: string;
  datasetSize: number;
  datasetSha256?: string;
  metric: string;
  threshold: number;
  /** The API decides `passed`: it is measured >= threshold. */
  measured: number;
  limitations?: string;
  notes?: string;
}

export interface ModuleSwitchInput {
  enabled: boolean;
  /** Required; the API answers 400 without it. */
  reason: string;
}

export interface ReviewInput {
  status: "APPROVED" | "REJECTED" | "OVERRIDDEN";
  humanDecision?: string;
  reviewNotes?: string;
  /** Required when overriding — the API refuses without one. */
  overrideReason?: string;
}

export interface FeedbackInput {
  feedbackType: AIFeedbackType;
  correctValue?: string;
  comments?: string;
}

export interface AcceptanceQuery {
  groupBy?: AcceptanceGroupBy;
  modelName?: string;
  startDate?: string;
  endDate?: string;
}

function params(entries: Record<string, string | number | undefined>) {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out;
}

export const aiReviewApi = {
  /** Every registered model with whether its service can be reached from here. */
  gateway: () => apiClient.get<AIGatewayState>("/ai-review/gateway"),

  /** Retired models come back last. */
  models: () => apiClient.get<{ data: AIModelConfig[] | null }>("/ai-review/models").then((r) => r.data ?? []),

  model: (modelName: string) => apiClient.get<AIModelConfig>(`/ai-review/models/${encodeURIComponent(modelName)}`),

  /** Registers a model switched off. It stays off until an evaluation passes. */
  registerModel: (input: RegisterModelInput) => apiClient.post<AIModelConfig>("/ai-review/models", input),

  updateModel: (modelName: string, input: UpdateModelInput) =>
    apiClient.put<AIModelConfig>(`/ai-review/models/${encodeURIComponent(modelName)}`, input),

  evaluations: (modelName?: string) =>
    apiClient.get<{ data: AIModelEvaluation[] | null }>("/ai-review/evaluations", params({ model_name: modelName })),

  recordEvaluation: (input: RecordEvaluationInput) =>
    apiClient.post<AIModelEvaluation>("/ai-review/evaluations", input),

  modules: () => apiClient.get<{ data: AIModuleSwitch[] | null }>("/ai-review/modules"),

  /**
   * Switches one module on or off. The reason is required. A rule the database
   * enforces — face recognition without an authorisation — comes back 409 and
   * is shown as that rule, not as a fault.
   */
  setModuleSwitch: (module: string, input: ModuleSwitchInput) =>
    apiClient.put<AIModuleSwitch>(`/ai-review/modules/${encodeURIComponent(module)}`, input),

  /**
   * Withdraws a model from use. It stays in the registry, switched off, and
   * cannot be switched back on: a suggestion an officer acted on must keep
   * naming the model that made it.
   */
  retireModel: (modelName: string, reason: string) =>
    apiClient.post<AIModelConfig>(`/ai-review/models/${encodeURIComponent(modelName)}/retire`, { reason }),

  acceptance: (query: AcceptanceQuery = {}) =>
    apiClient.get<AIAcceptanceResponse>(
      "/ai-review/acceptance",
      params({
        group_by: query.groupBy,
        model_name: query.modelName,
        start_date: query.startDate,
        end_date: query.endDate,
      }),
    ),

  queue: (query: AIQueueQuery = {}) =>
    apiClient.get<AIQueueResponse>(
      "/ai-review/queue",
      params({
        type: query.type,
        priority: query.priority,
        page: query.page,
        page_size: query.pageSize,
      }),
    ),

  stats: () => apiClient.get<RawStats>("/ai-review/stats").then(normaliseStats),

  /** The API names this list `assignments`; `decisions` is accepted as well. */
  myAssignments: () =>
    apiClient
      .get<{ assignments?: AIDecision[] | null; decisions?: AIDecision[] | null }>("/ai-review/my-assignments")
      .then((response) => response.assignments ?? response.decisions ?? []),

  decision: (id: string) => apiClient.get<AIDecision>(`/ai-review/decisions/${id}`),

  history: (id: string) => apiClient.get<AIDecisionHistory>(`/ai-review/decisions/${id}/history`),

  /**
   * Records one officer's decision. The API answers 409 `already_reviewed`
   * when another officer decided it first; the caller tells the officer and
   * refreshes rather than overwriting.
   */
  review: (id: string, input: ReviewInput) => apiClient.post<AIDecision>(`/ai-review/decisions/${id}/review`, input),

  feedback: (id: string, input: FeedbackInput) =>
    apiClient.post<{ decisionId: string; message: string }>(`/ai-review/decisions/${id}/feedback`, input),
};

export default aiReviewApi;
