import apiClient from "./client";

/**
 * Audit trail — read from the immutable, hash-chained audit table.
 *
 * Shapes mirror Go `repository.AuditEntry`, `AuditTrailStats` and
 * `ChainVerification`. DSP and above; the server answers 403 otherwise.
 */

export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED" | "PARTIAL";

export const AUDIT_ACTIONS = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "EXPORT",
  "PRINT",
  "APPROVE",
  "REJECT",
  "ESCALATE",
  "TRANSFER",
  "VERIFY",
  "SIGN",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  sequence: number;
  id: string;
  eventType: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  outcome: AuditOutcome;
  detail: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  hashAlgorithm: string;
}

export interface AuditStats {
  total: number;
  last24h: number;
  failures24h: number;
  byAction: Record<string, number>;
  resourceTypes: string[];
}

export interface ChainBreak {
  sequence: number;
  kind: "linkage" | "hash";
  at: string;
  detail: string;
}

export interface ChainVerification {
  checked: number;
  fromSequence: number;
  toSequence: number;
  linkageBreaks: number;
  hashMismatches: number;
  recomputed: number;
  legacyEntries: number;
  breaks: ChainBreak[];
  intact: boolean;
  method: string;
  verifiedAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  resourceType?: string;
  outcome?: AuditOutcome;
  /** RFC 3339 */
  from?: string;
  /** RFC 3339 */
  to?: string;
}

export const auditApi = {
  list: (query: AuditQuery) => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") params[k] = v as string | number;
    }
    return apiClient.get<Paginated<AuditEntry>>("/audit/logs", params);
  },
  stats: () => apiClient.get<AuditStats>("/audit/stats"),
  verify: (limit: number) => apiClient.get<ChainVerification>("/audit/verify", { limit }),
};

export default auditApi;
