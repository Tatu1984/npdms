import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import officersApi, {
  type NewOfficerInput,
  type OfficerAmendmentInput,
  type OfficerStatusFilter,
} from "@/lib/api/officers";

export const officerKeys = {
  all: ["officers"] as const,
  list: (query: { search?: string; status?: OfficerStatusFilter }) =>
    ["officers", "list", query] as const,
  detail: (id: string) => ["officers", "detail", id] as const,
  options: ["officers", "options"] as const,
};

export function useOfficers(query: { search?: string; status?: OfficerStatusFilter } = {}) {
  return useQuery({
    queryKey: officerKeys.list(query),
    queryFn: () => officersApi.list(query),
  });
}

export function useOfficer(id: string | undefined) {
  return useQuery({
    queryKey: officerKeys.detail(id ?? ""),
    queryFn: () => officersApi.get(id as string),
    enabled: Boolean(id),
  });
}

/**
 * The stations and ranks this administrator may use. Asked of the API rather
 * than worked out on the screen, so a form cannot offer a posting the rules
 * would then refuse.
 */
export function useOfficerOptions(enabled = true) {
  return useQuery({
    queryKey: officerKeys.options,
    queryFn: () => officersApi.options(),
    enabled,
  });
}

/**
 * The refresh is started, not awaited.
 *
 * Returning the invalidation promise makes react-query wait for the refetch
 * before the mutation resolves, and a refetch that fails then fails the
 * mutation that had already succeeded. That was found here: a create returned
 * 201 with the officer's only password in it, the roster refetch behind it was
 * refused, and the screen reported a failure and threw the password away. An
 * account had been opened that nobody could sign in to.
 */
function useOfficerMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: officerKeys.all });
    },
  });
}

export const useCreateOfficer = () =>
  useOfficerMutation((input: NewOfficerInput) => officersApi.create(input));

export const useAmendOfficer = () =>
  useOfficerMutation(({ id, input }: { id: string; input: OfficerAmendmentInput }) =>
    officersApi.amend(id, input),
  );

export const useDeactivateOfficer = () =>
  useOfficerMutation(({ id, reason }: { id: string; reason: string }) =>
    officersApi.deactivate(id, reason),
  );

export const useReactivateOfficer = () =>
  useOfficerMutation((id: string) => officersApi.reactivate(id));

export const useResetOfficerPassword = () =>
  useOfficerMutation((id: string) => officersApi.resetPassword(id));
