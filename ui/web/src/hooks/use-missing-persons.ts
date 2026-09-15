"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import missingPersonsApi, {
  type RecordStationCheckInput,
  type UploadPhotoInput,
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
  board: () => ["missing-persons", "board"] as const,
  photos: (id: string, includeRetired: boolean) => ["missing-persons", id, "photos", includeRetired] as const,
  checks: (id: string) => ["missing-persons", id, "checks"] as const,
  map: (id: string) => ["missing-persons", id, "map"] as const,
};

/**
 * Image bytes live under their own root, so invalidating a report never
 * re-downloads its photographs (a photograph's bytes never change).
 */
export const photoBlobKey = (photoId: string, variant: "image" | "thumbnail") => ["missing-person-photo", photoId, variant] as const;

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

/* ------------------------------------------------ photographs, board, map */

/** Polling interval of the city-wide board. */
export const BOARD_POLL_MS = 20_000;

export const useMissingBoard = (enabled = true) =>
  useQuery({
    queryKey: missingPersonKeys.board(),
    queryFn: missingPersonsApi.board,
    enabled,
    refetchInterval: BOARD_POLL_MS,
    refetchIntervalInBackground: true,
  });

export const useMissingPhotos = (id: string, includeRetired = false, enabled = true) =>
  useQuery({
    queryKey: missingPersonKeys.photos(id, includeRetired),
    queryFn: () => missingPersonsApi.photos(id, includeRetired),
    enabled: Boolean(id) && enabled,
  });

/** An object URL for a photograph, fetched once with the officer's credentials. */
export const usePhotoUrl = (reportId: string, photoId: string | null | undefined, variant: "image" | "thumbnail") =>
  useQuery({
    queryKey: photoBlobKey(photoId ?? "none", variant),
    queryFn: async () => URL.createObjectURL(await missingPersonsApi.photoBlob(reportId, photoId as string, variant)),
    enabled: Boolean(reportId && photoId),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
  });

export const useStationChecks = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.checks(id), queryFn: () => missingPersonsApi.stationChecks(id), enabled: Boolean(id) && enabled });

export const useSearchMap = (id: string, enabled = true) =>
  useQuery({ queryKey: missingPersonKeys.map(id), queryFn: () => missingPersonsApi.searchMap(id), enabled: Boolean(id) && enabled });

/** Invalidates only what a photograph change affects. */
function usePhotoMutation<TVars extends { id: string }, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["missing-persons", vars.id, "photos"] });
      qc.invalidateQueries({ queryKey: missingPersonKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ["missing-persons", "list"] });
      qc.invalidateQueries({ queryKey: missingPersonKeys.board() });
    },
  });
}

export const useUploadPhoto = () =>
  usePhotoMutation(({ id, input }: { id: string; input: UploadPhotoInput }) => missingPersonsApi.uploadPhoto(id, input));

export const useSetPrimaryPhoto = () =>
  usePhotoMutation(({ id, photoId }: { id: string; photoId: string }) => missingPersonsApi.setPrimaryPhoto(id, photoId));

export const useRetirePhoto = () =>
  usePhotoMutation(({ id, photoId, reason }: { id: string; photoId: string; reason: string }) =>
    missingPersonsApi.retirePhoto(id, photoId, reason),
  );

export const useRecordStationCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecordStationCheckInput }) => missingPersonsApi.recordStationCheck(id, input),
    onSuccess: (check, { id }) => {
      qc.invalidateQueries({ queryKey: missingPersonKeys.board() });
      qc.invalidateQueries({ queryKey: missingPersonKeys.checks(id) });
      if (check.sightingId) {
        qc.invalidateQueries({ queryKey: missingPersonKeys.sightings(id) });
        qc.invalidateQueries({ queryKey: missingPersonKeys.map(id) });
        qc.invalidateQueries({ queryKey: missingPersonKeys.detail(id) });
      }
    },
  });
};
