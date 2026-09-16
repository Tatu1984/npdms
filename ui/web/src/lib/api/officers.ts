import apiClient from "./client";

/**
 * Officer account administration.
 *
 * Field names mirror the Go `services.Officer` exactly. Note what is not in
 * this file: there is no delete, because the platform has none — an account is
 * deactivated and the records the officer made keep naming them — and there is
 * no password field on an officer, because a password is returned once, by the
 * call that issued it, and never again.
 */

export type OfficerStatusFilter = "" | "active" | "inactive";

export interface Officer {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  badgeNumber?: string;
  role: string;
  stationId?: string;
  stationName?: string;
  stationCode?: string;
  forceCode: string;
  forceShortName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt: string;
  deactivatedAt?: string;
  deactivatedByName?: string;
  deactivationReason?: string;
}

/** A station this administrator may post an officer to. */
export interface Posting {
  id: string;
  code: string;
  name: string;
  forceCode: string;
  forceShortName: string;
}

/** What the create and transfer forms are allowed to offer. */
export interface OfficerOptions {
  postings: Posting[];
  ranks: string[];
}

/**
 * The one moment a password is readable. Shown once, on this screen, and not
 * kept anywhere the administrator can go back to.
 */
export interface IssuedPassword {
  officer: Officer;
  password: string;
  notice: string;
}

export interface NewOfficerInput {
  username: string;
  name: string;
  email: string;
  phone?: string;
  badgeNumber?: string;
  role: string;
  /** The posting. The department follows from it and is never sent. */
  stationId: string;
}

export interface OfficerAmendmentInput {
  name?: string;
  email?: string;
  phone?: string;
  badgeNumber?: string;
  role?: string;
  stationId?: string;
}

export const officersApi = {
  list: async (query: { search?: string; status?: OfficerStatusFilter } = {}): Promise<Officer[]> => {
    const params: Record<string, string> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    // A department with no officers other than the viewer answers `null`.
    const response = await apiClient.get<{ data: Officer[] | null }>("/officers", params);
    return response.data ?? [];
  },

  get: (id: string) => apiClient.get<Officer>(`/officers/${id}`),

  options: () => apiClient.get<OfficerOptions>("/officers/options"),

  create: (input: NewOfficerInput) => apiClient.post<IssuedPassword>("/officers", input),

  amend: (id: string, input: OfficerAmendmentInput) =>
    apiClient.patch<Officer>(`/officers/${id}`, input),

  deactivate: (id: string, reason: string) =>
    apiClient.post<Officer>(`/officers/${id}/deactivate`, { reason }),

  reactivate: (id: string) => apiClient.post<Officer>(`/officers/${id}/reactivate`, {}),

  resetPassword: (id: string) => apiClient.post<IssuedPassword>(`/officers/${id}/password-reset`, {}),
};

export default officersApi;
