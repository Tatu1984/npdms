import { useQuery } from "@tanstack/react-query";

import activityApi from "@/lib/api/activity";

export const activityKeys = {
  mine: (days: number) => ["activity", "mine", days] as const,
  officer: (id: string, days: number) => ["activity", "officer", id, days] as const,
};

/** The signed-in officer's own trail. */
export function useMyActivity(days = 7) {
  return useQuery({
    queryKey: activityKeys.mine(days),
    queryFn: () => activityApi.mine(days),
  });
}

/** One officer's trail, for whoever may supervise them. */
export function useOfficerActivity(officerId: string | undefined, days = 7) {
  return useQuery({
    queryKey: activityKeys.officer(officerId ?? "", days),
    queryFn: () => activityApi.forOfficer(officerId as string, days),
    enabled: Boolean(officerId),
  });
}
