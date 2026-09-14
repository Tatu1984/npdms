import apiClient from "./client";

/**
 * Access log — sign-in activity read from the immutable audit trail.
 *
 * Shapes mirror the Go `repository.AccessEvent` and the /access-log/stats
 * response. DSP and above only; the server answers 403 otherwise.
 */

export type AccessAction = "LOGIN" | "LOGOUT";
export type AccessOutcome = "SUCCESS" | "FAILURE";

export interface AccessEvent {
  id: string;
  action: AccessAction;
  outcome: AccessOutcome | "DENIED" | "PARTIAL";
  userId: string | null;
  userName: string;
  userRole: string;
  badge: string;
  station: string;
  detail: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface SuspiciousSource {
  ipAddress: string;
  failures: number;
  accounts: number;
  lastSeen: string;
}

export interface AccessStats {
  signIns24h: number;
  failures24h: number;
  activeUsers24h: number;
  distinctIPs24h: number;
  suspiciousSources: SuspiciousSource[];
  /** Failed sign-ins from one address within an hour that flag it. */
  suspiciousFailureThreshold: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccessQuery {
  page?: number;
  pageSize?: number;
  action?: AccessAction;
  outcome?: AccessOutcome;
  ip?: string;
  userId?: string;
  /** RFC 3339 */
  from?: string;
  /** RFC 3339 */
  to?: string;
}

/** Mirrors the Go `services.IPIntel`. */
export interface IPIntel {
  ip: string;
  version?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  asn?: string;
  organisation?: string;
  isPrivate: boolean;
  isLoopback: boolean;
  source: string;
  retrievedAt: string;
  cached: boolean;
  available: boolean;
  note?: string;
}

export const accessLogApi = {
  list: (query: AccessQuery = {}) => {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params[key] = value as string | number;
    }
    return apiClient.get<Paginated<AccessEvent>>("/access-log", params);
  },

  stats: () => apiClient.get<AccessStats>("/access-log/stats"),

  /** Server-side lookup; the query and its purpose are audited. */
  ipIntel: (ip: string, purpose: string) =>
    apiClient.get<IPIntel>(`/intel/ip/${encodeURIComponent(ip)}`, { purpose }),
};

export default accessLogApi;
