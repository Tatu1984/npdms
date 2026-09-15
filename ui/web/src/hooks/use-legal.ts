"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import legalApi, { type ActInput, type PlaceInput, type SectionInput } from "@/lib/api/legal";

/**
 * React Query bindings for the statute library and the gazetteer. Search hooks
 * take an already-debounced query (see useDebounced); every write invalidates
 * its subtree so pickers and the settings screens agree.
 */

export const legalKeys = {
  all: ["legal"] as const,
  acts: (includeRetired: boolean) => ["legal", "acts", includeRetired] as const,
  actSections: (id: string, page: number, includeRetired: boolean) =>
    ["legal", "act-sections", id, page, includeRetired] as const,
  search: (q: string, act: string) => ["legal", "search", q, act] as const,
  places: ["gazetteer"] as const,
  placeSearch: (q: string) => ["gazetteer", "search", q] as const,
  officerPlaces: (page: number, status: string) => ["gazetteer", "officer", page, status] as const,
};

/** Value that settles `delay` ms after the last change. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

export function useLegalActs(includeRetired = false) {
  return useQuery({
    queryKey: legalKeys.acts(includeRetired),
    queryFn: () => legalApi.acts(includeRetired),
    staleTime: 5 * 60_000,
  });
}

export function useActSections(actId: string, page = 1, includeRetired = false) {
  return useQuery({
    queryKey: legalKeys.actSections(actId, page, includeRetired),
    queryFn: () => legalApi.actSections(actId, page, 50, includeRetired),
    enabled: Boolean(actId),
    placeholderData: keepPreviousData,
  });
}

export function useSectionSearch(q: string, act = "") {
  const query = q.trim();
  return useQuery({
    queryKey: legalKeys.search(query, act),
    queryFn: () => legalApi.searchSections(query, act || undefined),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function usePlaceSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: legalKeys.placeSearch(query),
    queryFn: () => legalApi.searchPlaces(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60_000,
  });
}

export function useOfficerPlaces(page = 1, status = "") {
  return useQuery({
    queryKey: legalKeys.officerPlaces(page, status),
    queryFn: () => legalApi.officerPlaces(page, status),
    placeholderData: keepPreviousData,
  });
}

function useInvalidating<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>, key: readonly string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export const useCreateAct = () => useInvalidating((input: ActInput) => legalApi.createAct(input), legalKeys.all);

export const useUpdateAct = () =>
  useInvalidating(({ id, input }: { id: string; input: ActInput }) => legalApi.updateAct(id, input), legalKeys.all);

export const useRetireAct = () =>
  useInvalidating(({ id, reason }: { id: string; reason: string }) => legalApi.retireAct(id, reason), legalKeys.all);

export const useAddSection = () =>
  useInvalidating(
    ({ actId, input }: { actId: string; input: SectionInput }) => legalApi.addSection(actId, input),
    legalKeys.all,
  );

export const useUpdateSection = () =>
  useInvalidating(
    ({ id, input }: { id: string; input: SectionInput }) => legalApi.updateSection(id, input),
    legalKeys.all,
  );

export const useRetireSection = () =>
  useInvalidating(
    ({ id, reason }: { id: string; reason: string }) => legalApi.retireSection(id, reason),
    legalKeys.all,
  );

export const useAddPlace = () => useInvalidating((input: PlaceInput) => legalApi.addPlace(input), legalKeys.places);

export const useRetirePlace = () =>
  useInvalidating(
    ({ id, reason }: { id: string; reason: string }) => legalApi.retirePlace(id, reason),
    legalKeys.places,
  );
