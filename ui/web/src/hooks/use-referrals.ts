"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import referralsApi, {
  type DecideReferralInput,
  type ProposeReferralInput,
  type ReferralQuery,
} from "@/lib/api/referrals";

/**
 * React Query bindings for referrals. No local fallback: a referral that only
 * exists in a browser is not a referral.
 *
 * Every write invalidates the whole subtree, because a decision moves a
 * referral between the incoming and outgoing views and changes both counts.
 */

export const referralKeys = {
  all: ["referrals"] as const,
  list: (query: ReferralQuery) => ["referrals", "list", query] as const,
  detail: (id: string) => ["referrals", "detail", id] as const,
};

export function useReferrals(query: ReferralQuery = {}) {
  return useQuery({
    queryKey: referralKeys.list(query),
    queryFn: () => referralsApi.list(query),
  });
}

export function useReferral(id: string) {
  return useQuery({
    queryKey: referralKeys.detail(id),
    queryFn: () => referralsApi.get(id),
    enabled: Boolean(id),
  });
}

function useReferralMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
}

export const useProposeReferral = () =>
  useReferralMutation((input: ProposeReferralInput) => referralsApi.propose(input));

export const useDecideReferral = () =>
  useReferralMutation(({ id, input }: { id: string; input: DecideReferralInput }) =>
    referralsApi.decide(id, input),
  );

export const useWithdrawReferral = () =>
  useReferralMutation((id: string) => referralsApi.withdraw(id));
