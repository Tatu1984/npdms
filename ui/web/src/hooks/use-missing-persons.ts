"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import missingPersonsApi, {
  type CloseInput,
  type MissingPersonQuery,
  type RecordContactInput,
  type RecordSightingInput,
  type RegisterMissingPersonInput,
  type UpdateMissingPersonInput,
} from "@/lib/api/missing-persons";

/**
 * React Query bindings for Phase 04. No local fallback. Every write
 * invalidates the whole subtree: a verified sighting changes the movement
 * route and the counts, a closure changes the linked lookout.
 */

export const missingPersonKeys = {
  all: ["missing-persons"] as const,
  list: (query: MissingPersonQuery) => ["missing-persons", "list", query] as const,
  stats: () => ["missing-persons", "stats"] as const,
  detail: (id: string) => ["missing-persons", id, "detail"] as const,
  checklist: (id: string) => ["missing-persons", id, "checklist"] as const,
  sightings: (id: string) => ["missing-persons", id, "sightings"] as const,
  movement: (id: string) => ["missing-persons", id, "movement"] as const,
  contacts: (id: string) => ["missing-persons", id, "contacts"] as const,
};

export const useMissingPersons = (query: MissingPersonQuery = {}) =>
  useQuery({ queryKey: missingPersonKeys.list(query), queryFn: () => missingPersonsApi.list(query) });

export const useMissingPersonStats = () =>
  useQuery({ queryKey: missingPersonKeys.stats(), queryFn: missingPersonsApi.stats });

export const useMissingPerson = (id: string) =>
  useQuery({ queryKey: missingPersonKeys.detail(id), queryFn: () => missingPersonsApi.get(id), enabled: Boolean(id) });

export const useMissingChecklist = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.checklist(id), queryFn: () => missingPersonsApi.checklist(id), enabled: Boolean(id) && enabled });

export const useMissingSightings = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.sightings(id), queryFn: () => missingPersonsApi.sightings(id), enabled: Boolean(id) && enabled });

export const useMovement = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.movement(id), queryFn: () => missingPersonsApi.movement(id), enabled: Boolean(id) && enabled });

export const useFamilyContacts = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.contacts(id), queryFn: () => missingPersonsApi.contacts(id), enabled: Boolean(id) && enabled });

function useMissingMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: missingPersonKeys.all });
      qc.invalidateQueries({ queryKey: ["lookouts"] });
    },
  });
}

export const useRegisterMissingPerson = () =>
  useMissingMutation((input: RegisterMissingPersonInput) => missingPersonsApi.register(input));

export const useUpdateMissingPerson = () =>
  useMissingMutation(({ id, input }: { id: string; input: UpdateMissingPersonInput }) => missingPersonsApi.update(id, input));

export const useStartSearch = () => useMissingMutation((id: string) => missingPersonsApi.startSearch(id));

export const useCompleteChecklistItem = () =>
  useMissingMutation(({ id, itemCode, note }: { id: string; itemCode: string; note: string }) =>
    missingPersonsApi.completeItem(id, itemCode, note),
  );

export const useRecordMissingSighting = () =>
  useMissingMutation(({ id, input }: { id: string; input: RecordSightingInput }) => missingPersonsApi.recordSighting(id, input));

export const useDecideMissingSighting = () =>
  useMissingMutation(({ id, sightingId, verify, note }: { id: string; sightingId: string; verify: boolean; note: string }) =>
    verify ? missingPersonsApi.verifySighting(id, sightingId, note) : missingPersonsApi.rejectSighting(id, sightingId, note),
  );

export const useRecordFamilyContact = () =>
  useMissingMutation(({ id, input }: { id: string; input: RecordContactInput }) => missingPersonsApi.recordContact(id, input));

export const useCloseMissingPerson = () =>
  useMissingMutation(({ id, input }: { id: string; input: CloseInput }) => missingPersonsApi.close(id, input));

export const useIssueMissingLookout = () => useMissingMutation((id: string) => missingPersonsApi.issueLookout(id));
