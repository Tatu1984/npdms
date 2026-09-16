import apiClient from "./client";

/**
 * Referrals — a record handed from one department to another.
 *
 * This is the act the boundary exists for. An officer sees their own force's
 * records; a record crosses to another force only when someone proposes it
 * with a reason and the receiving force accepts. Both halves are recorded.
 *
 * Field names mirror the Go `models.Referral` exactly.
 */

export type ReferralRecordType = "CASE" | "FIR" | "COMPLAINT";
export type ReferralStatus = "PROPOSED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
/** Which side of the boundary this officer's force is on. */
export type ReferralDirection = "incoming" | "outgoing";

export const REFERRAL_RECORD_TYPES: ReferralRecordType[] = ["CASE", "FIR", "COMPLAINT"];

export interface Referral {
  id: string;
  referralNumber: string;
  recordType: ReferralRecordType;
  recordId: string;
  recordReference?: string;
  status: ReferralStatus;
  reason: string;
  authority?: string;

  fromForceCode: string;
  fromForceShortName: string;
  toForceCode: string;
  toForceShortName: string;

  referredBy: string;
  referredByName?: string;
  referredAt: string;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface ReferralQuery {
  direction?: ReferralDirection;
  status?: ReferralStatus;
}

export interface ProposeReferralInput {
  recordType: ReferralRecordType;
  recordId: string;
  toForceCode: string;
  reason: string;
  authority?: string;
}

export interface DecideReferralInput {
  accept: boolean;
  note?: string;
}

export const referralsApi = {
  list: async (query: ReferralQuery = {}): Promise<Referral[]> => {
    const params: Record<string, string> = {};
    if (query.direction) params.direction = query.direction;
    if (query.status) params.status = query.status;
    const response = await apiClient.get<{ data: Referral[] | null }>("/referrals", params);
    // An officer with no referrals gets `null`, not an empty array.
    return response.data ?? [];
  },

  get: (id: string): Promise<Referral> => apiClient.get<Referral>(`/referrals/${id}`),

  propose: (input: ProposeReferralInput): Promise<Referral> =>
    apiClient.post<Referral>("/referrals", input),

  decide: (id: string, input: DecideReferralInput): Promise<Referral> =>
    apiClient.post<Referral>(`/referrals/${id}/decision`, {
      accept: input.accept,
      note: input.note ?? "",
    }),

  withdraw: (id: string): Promise<Referral> =>
    apiClient.post<Referral>(`/referrals/${id}/withdraw`),
};

export default referralsApi;
