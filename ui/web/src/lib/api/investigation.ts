import apiClient from "./client";

/**
 * Phase 01 — Investigation Copilot API.
 *
 * Field names mirror the Go models exactly. Bilingual fields arrive as
 * `<field>` / `<field>Bn`; use `bilingual()` to hand them to `pick()`.
 */

export type WorkspaceStatus = "active" | "supervisory-review" | "chargesheet" | "closed";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReviewState = "pending" | "accepted" | "rejected";
/** "derived" means a deterministic rule produced it — no model is involved. */
export type Origin = "officer" | "supervisor" | "derived" | "ai";

export interface WorkspaceCounts {
  evidence: number;
  witnesses: number;
  persons: number;
  vehicles: number;
  locations: number;
  timeline: number;
  contradictions: number;
  gaps: number;
  openTasks: number;
  totalTasks: number;
}

export interface Workspace {
  id: string;
  caseNumber: string;
  firId?: string;
  caseId?: string;
  firNumber?: string;
  title: string;
  titleBn?: string;
  offence?: string;
  offenceBn?: string;
  sections: string[];
  stationId?: string;
  stationName?: string;
  ioId?: string;
  ioName?: string;
  supervisorId?: string;
  supervisorName?: string;
  status: WorkspaceStatus;
  priority: Severity;
  registeredOn: string;
  nextCourtDate?: string;
  progress: number;
  counts: WorkspaceCounts;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacePerson {
  id: string;
  workspaceId: string;
  name: string;
  nameBn?: string;
  aliases: string[];
  role: "accused" | "suspect" | "witness" | "complainant" | "victim";
  age?: number;
  gender?: string;
  address?: string;
  addressBn?: string;
  phone?: string;
  vehicles: string[];
  riskNote?: string;
  statementsCount: number;
  createdAt: string;
}

export interface WorkspaceSource {
  id: string;
  label: string;
  type: "document" | "statement" | "cctv" | "call" | "transaction" | "forensic" | "circular";
  locator?: string;
  evidenceId?: string;
}

export interface TimelineEntry {
  id: string;
  workspaceId: string;
  occurredAt: string;
  title: string;
  titleBn?: string;
  detail?: string;
  detailBn?: string;
  kind: "movement" | "communication" | "incident" | "transaction" | "detection" | "report";
  location?: string;
  latitude?: number;
  longitude?: number;
  origin: Origin;
  confidence?: number;
  reviewState: ReviewState;
  reviewedBy?: string;
  /** Name of the officer who reviewed it — never inferred from the case IO. */
  reviewedByName?: string;
  reviewedAt?: string;
  sources: WorkspaceSource[];
  createdAt: string;
}

export interface Contradiction {
  id: string;
  workspaceId: string;
  title: string;
  titleBn?: string;
  statementALabel: string;
  statementAClaim: string;
  statementBLabel: string;
  statementBClaim: string;
  severity: Severity;
  origin: Origin;
  confidence?: number;
  reviewState: ReviewState;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  resolutionNote?: string;
  sources: WorkspaceSource[];
  createdAt: string;
}

export interface InvestigationGap {
  id: string;
  workspaceId: string;
  /** Present when a deterministic rule produced this gap. */
  ruleKey?: string;
  title: string;
  titleBn?: string;
  detail?: string;
  detailBn?: string;
  kind: "witness" | "forensic" | "timeline" | "document" | "digital" | "seizure";
  severity: Severity;
  origin: Origin;
  status: "open" | "closed" | "dismissed";
  dueBy?: string;
  createdAt: string;
}

export interface InvestigationTask {
  id: string;
  workspaceId: string;
  gapId?: string;
  contradictionId?: string;
  title: string;
  titleBn?: string;
  detail?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: Severity;
  status: "open" | "in-progress" | "blocked" | "done";
  origin: Origin;
  completionNote?: string;
  completedAt?: string;
  createdAt: string;
}

export interface WorkspaceEvidenceLink {
  workspaceId: string;
  evidenceId: string;
  evidenceNumber?: string;
  description?: string;
  note?: string;
  linkedAt: string;
}

/** An officer who may be assigned to a case. */
export interface Officer {
  id: string;
  name: string;
  badgeNumber?: string;
  role: string;
  roleLabel: string;
  stationId?: string;
  stationName?: string;
  isActive: boolean;
  /** Cases this officer is already investigating — shown so load is visible at assignment. */
  openCases: number;
}

export interface LinkNode {
  id: string;
  label: string;
  type: "person" | "phone" | "vehicle" | "location" | "evidence" | "case";
  role?: string;
  detail?: string;
  entityId?: string;
}

export interface LinkEdge {
  from: string;
  to: string;
  label: string;
}

export interface LinkGraph {
  nodes: LinkNode[];
  edges: LinkEdge[];
}

export interface WorkspaceBrief {
  workspace: Workspace;
  timeline: TimelineEntry[];
  persons: WorkspacePerson[];
  evidence: WorkspaceEvidenceLink[];
  contradictions: Contradiction[];
  gaps: InvestigationGap[];
  openTasks: InvestigationTask[];
  generatedAt: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Listed<T> {
  data: T[];
}

/** Turns the API's `x` / `xBn` pair into the shape `pick()` expects. */
export function bilingual(en?: string, bn?: string): { en: string; bn?: string } {
  return { en: en ?? "", bn: bn || undefined };
}

export interface WorkspaceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  stationId?: string;
  /** Restrict to workspaces the signed-in officer owns or supervises. */
  mine?: boolean;
}

export const investigationApi = {
  list: (query: WorkspaceQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.priority) params.priority = query.priority;
    if (query.stationId) params.stationId = query.stationId;
    if (query.mine) params.mine = 1;
    return apiClient.get<Paginated<Workspace>>("/investigation", params);
  },

  get: (id: string) => apiClient.get<Workspace>(`/investigation/${id}`),

  create: (body: {
    caseNumber: string;
    title: string;
    titleBn?: string;
    offence?: string;
    sections?: string[];
    priority?: Severity;
    nextCourtDate?: string;
    ioId?: string;
    supervisorId?: string;
    stationId?: string;
  }) => apiClient.post<Workspace>("/investigation", body),

  update: (
    id: string,
    body: {
      title?: string;
      offence?: string;
      sections?: string[];
      status?: WorkspaceStatus;
      priority?: Severity;
      nextCourtDate?: string;
      ioId?: string;
      supervisorId?: string;
      reassignReason?: string;
    },
  ) => apiClient.put<Workspace>(`/investigation/${id}`, body),

  brief: (id: string) => apiClient.get<WorkspaceBrief>(`/investigation/${id}/brief`),

  /** Officers assignable as investigating or supervisory officer. */
  officers: (search?: string, stationId?: string) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (stationId) params.stationId = stationId;
    return apiClient.get<Listed<Officer>>("/investigation/officers", params);
  },

  /** Relationships recorded on the case. Nothing here is inferred. */
  links: (id: string) => apiClient.get<LinkGraph>(`/investigation/${id}/links`),

  persons: {
    list: (id: string) =>
      apiClient.get<Listed<WorkspacePerson>>(`/investigation/${id}/persons`),
    create: (
      id: string,
      body: {
        name: string;
        nameBn?: string;
        role: WorkspacePerson["role"];
        age?: number;
        address?: string;
        phone?: string;
        aliases?: string[];
        vehicles?: string[];
        riskNote?: string;
      },
    ) => apiClient.post<WorkspacePerson>(`/investigation/${id}/persons`, body),
    update: (
      id: string,
      personId: string,
      body: {
        name?: string;
        role?: WorkspacePerson["role"];
        aliases?: string[];
        age?: number;
        gender?: string;
        statementsCount?: number;
        phone?: string;
        address?: string;
        vehicles?: string[];
        riskNote?: string;
      },
    ) => apiClient.patch<Listed<WorkspacePerson>>(`/investigation/${id}/persons/${personId}`, body),
    remove: (id: string, personId: string) =>
      apiClient.delete<void>(`/investigation/${id}/persons/${personId}`),
  },

  timeline: {
    list: (id: string) => apiClient.get<Listed<TimelineEntry>>(`/investigation/${id}/timeline`),
    create: (
      id: string,
      body: {
        occurredAt: string;
        title: string;
        titleBn?: string;
        detail?: string;
        kind?: TimelineEntry["kind"];
        location?: string;
        sources?: { label: string; type?: string; locator?: string; evidenceId?: string }[];
      },
    ) => apiClient.post<TimelineEntry>(`/investigation/${id}/timeline`, body),
    review: (id: string, entryId: string, state: "accepted" | "rejected") =>
      apiClient.post<{ id: string; reviewState: ReviewState }>(
        `/investigation/${id}/timeline/${entryId}/review`,
        { state },
      ),
    remove: (id: string, entryId: string) =>
      apiClient.delete<void>(`/investigation/${id}/timeline/${entryId}`),
  },

  contradictions: {
    list: (id: string) =>
      apiClient.get<Listed<Contradiction>>(`/investigation/${id}/contradictions`),
    create: (
      id: string,
      body: {
        title: string;
        statementALabel: string;
        statementAClaim: string;
        statementBLabel: string;
        statementBClaim: string;
        severity?: Severity;
        sources?: { label: string; type?: string; locator?: string }[];
      },
    ) => apiClient.post<Contradiction>(`/investigation/${id}/contradictions`, body),
    review: (id: string, contradictionId: string, state: "accepted" | "rejected", note?: string) =>
      apiClient.post<{ id: string; reviewState: ReviewState }>(
        `/investigation/${id}/contradictions/${contradictionId}/review`,
        { state, note },
      ),
  },

  gaps: {
    list: (id: string, includeClosed = false) =>
      apiClient.get<Listed<InvestigationGap>>(
        `/investigation/${id}/gaps`,
        includeClosed ? { includeClosed: 1 } : undefined,
      ),
    /** Re-runs the deterministic rules. Safe to call at any time. */
    recompute: (id: string) =>
      apiClient.post<Listed<InvestigationGap>>(`/investigation/${id}/gaps/recompute`),
    create: (
      id: string,
      body: { title: string; detail?: string; kind?: InvestigationGap["kind"]; severity?: Severity; dueBy?: string },
    ) => apiClient.post<InvestigationGap>(`/investigation/${id}/gaps`, body),
    setStatus: (id: string, gapId: string, status: "open" | "closed" | "dismissed") =>
      apiClient.patch<{ id: string; status: string }>(`/investigation/${id}/gaps/${gapId}`, { status }),
  },

  tasks: {
    list: (id: string) => apiClient.get<Listed<InvestigationTask>>(`/investigation/${id}/tasks`),
    create: (
      id: string,
      body: {
        title: string;
        detail?: string;
        assigneeId?: string;
        dueDate?: string;
        priority?: Severity;
        gapId?: string;
        contradictionId?: string;
      },
    ) => apiClient.post<InvestigationTask>(`/investigation/${id}/tasks`, body),
    update: (
      id: string,
      taskId: string,
      body: {
        title?: string;
        assigneeId?: string;
        dueDate?: string;
        priority?: Severity;
        status?: InvestigationTask["status"];
        completionNote?: string;
      },
    ) => apiClient.patch<Listed<InvestigationTask>>(`/investigation/${id}/tasks/${taskId}`, body),
    remove: (id: string, taskId: string) =>
      apiClient.delete<void>(`/investigation/${id}/tasks/${taskId}`),
  },

  evidence: {
    list: (id: string) =>
      apiClient.get<Listed<WorkspaceEvidenceLink>>(`/investigation/${id}/evidence`),
    link: (id: string, evidenceId: string, note?: string) =>
      apiClient.post<Listed<WorkspaceEvidenceLink>>(`/investigation/${id}/evidence`, {
        evidenceId,
        note,
      }),
    unlink: (id: string, evidenceId: string) =>
      apiClient.delete<void>(`/investigation/${id}/evidence/${evidenceId}`),
  },
};

export default investigationApi;
