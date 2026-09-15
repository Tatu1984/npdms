import apiClient from "./client";

/**
 * Record search and the station reference list.
 *
 * Shapes mirror Go `repository.SearchGroup`, `SearchHit` and `StationRef`.
 * Every search is written to the audit trail with its term.
 */

export type SearchKind =
  | "fir"
  | "case"
  | "evidence"
  | "warrant"
  | "accused"
  | "officer"
  | "vehicle"
  | "challan"
  | "lookout";

export interface SearchHit {
  kind: SearchKind;
  id: string;
  number: string;
  title: string;
  status: string;
  /** Screen the record opens; empty when it has no screen of its own. */
  href: string;
}

export interface SearchGroup {
  kind: SearchKind;
  hits: SearchHit[];
}

export interface SearchResult {
  query: string;
  groups: SearchGroup[];
  total: number;
  perGroupLimit: number;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
}

export const SEARCH_MIN_LENGTH = 2;

export const searchApi = {
  search: (q: string) => apiClient.get<SearchResult>("/search", { q }),
  stations: () => apiClient.get<{ data: Station[] }>("/stations").then((r) => r.data),
};

export default searchApi;
