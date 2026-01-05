"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustodyEntry {
  id: string;
  action: "COLLECTED" | "SEALED" | "TRANSFERRED" | "RECEIVED" | "RETURNED" | "DISPOSED";
  date: string;
  officer: string;
  location: string;
  notes?: string;
  verified: boolean;
}

export interface Evidence {
  id: string;
  evidenceNumber: string;
  firId: string;
  firNumber: string;
  caseId?: string;
  type: "PHYSICAL" | "DIGITAL" | "DOCUMENTARY";
  category: string;
  description: string;
  collectedBy: string;
  collectedAt: string;
  location: string;
  status: "COLLECTED" | "IN_CUSTODY" | "AT_LAB" | "RETURNED" | "DISPOSED";
  currentCustodian: string;
  integrityVerified: boolean;
  hash?: string;
  sealNumber?: string;
  fileSize?: string;
  chainOfCustody: CustodyEntry[];
  createdAt: string;
  updatedAt: string;
}

// Mock data
const MOCK_EVIDENCE: Evidence[] = [
  {
    id: "evd-001",
    evidenceNumber: "EVD-2024-KOR-00123-001",
    firId: "fir-001",
    firNumber: "KOR/2024/00123",
    type: "PHYSICAL",
    category: "Fingerprint Sample",
    description: "Fingerprint lifted from door handle at scene",
    collectedBy: "SI Suresh",
    collectedAt: "2024-01-15T15:45:00Z",
    location: "Crime Scene - Door Handle",
    status: "AT_LAB",
    currentCustodian: "FSL Bangalore",
    integrityVerified: true,
    hash: "sha256:a3b4c5d6e7f8",
    chainOfCustody: [
      { id: "coc-001", action: "COLLECTED", date: "2024-01-15T15:45:00Z", officer: "SI Suresh", location: "Crime Scene", verified: true },
      { id: "coc-002", action: "SEALED", date: "2024-01-15T16:30:00Z", officer: "SI Suresh", location: "PS Koramangala", verified: true },
      { id: "coc-003", action: "TRANSFERRED", date: "2024-01-16T09:00:00Z", officer: "HC Mohan", location: "FSL Courier", verified: true },
    ],
    createdAt: "2024-01-15T15:45:00Z",
    updatedAt: "2024-01-16T14:00:00Z",
  },
  {
    id: "evd-002",
    evidenceNumber: "EVD-2024-KOR-00123-002",
    firId: "fir-001",
    firNumber: "KOR/2024/00123",
    type: "DIGITAL",
    category: "CCTV Footage",
    description: "Footage from Sharma Stores (14:00-15:00 hours)",
    collectedBy: "SI Suresh",
    collectedAt: "2024-01-16T10:30:00Z",
    location: "Sharma Stores",
    status: "IN_CUSTODY",
    currentCustodian: "Evidence Vault",
    integrityVerified: true,
    hash: "sha256:d4e5f6g7h8i9",
    fileSize: "2.3 GB",
    chainOfCustody: [
      { id: "coc-004", action: "COLLECTED", date: "2024-01-16T10:30:00Z", officer: "SI Suresh", location: "Sharma Stores", verified: true },
    ],
    createdAt: "2024-01-16T10:30:00Z",
    updatedAt: "2024-01-16T10:30:00Z",
  },
  {
    id: "evd-003",
    evidenceNumber: "EVD-2024-KOR-00123-003",
    firId: "fir-001",
    firNumber: "KOR/2024/00123",
    type: "PHYSICAL",
    category: "Broken Lock",
    description: "Broken padlock from main gate",
    collectedBy: "Const. Ramesh",
    collectedAt: "2024-01-15T16:00:00Z",
    location: "Main Gate",
    status: "IN_CUSTODY",
    currentCustodian: "Station Malkhana",
    integrityVerified: true,
    sealNumber: "KOR-2024-0456",
    chainOfCustody: [
      { id: "coc-005", action: "COLLECTED", date: "2024-01-15T16:00:00Z", officer: "Const. Ramesh", location: "Main Gate", verified: true },
      { id: "coc-006", action: "SEALED", date: "2024-01-15T16:30:00Z", officer: "Const. Ramesh", location: "PS Koramangala", verified: true },
    ],
    createdAt: "2024-01-15T16:00:00Z",
    updatedAt: "2024-01-15T16:30:00Z",
  },
  {
    id: "evd-004",
    evidenceNumber: "EVD-2024-KOR-00122-001",
    firId: "fir-002",
    firNumber: "KOR/2024/00122",
    type: "DOCUMENTARY",
    category: "Witness Statement",
    description: "Written statement of Mrs. Lakshmi",
    collectedBy: "Const. Ramesh",
    collectedAt: "2024-01-15T18:00:00Z",
    location: "Police Station",
    status: "IN_CUSTODY",
    currentCustodian: "Case File",
    integrityVerified: true,
    chainOfCustody: [
      { id: "coc-007", action: "COLLECTED", date: "2024-01-15T18:00:00Z", officer: "Const. Ramesh", location: "Police Station", verified: true },
    ],
    createdAt: "2024-01-15T18:00:00Z",
    updatedAt: "2024-01-15T18:00:00Z",
  },
];

interface EvidenceFilters {
  type?: Evidence["type"];
  status?: Evidence["status"];
  search?: string;
}

interface EvidenceState {
  evidence: Evidence[];
  selectedEvidence: Evidence | null;
  filters: EvidenceFilters;
  isLoading: boolean;

  loadEvidence: () => Promise<void>;
  setSelectedEvidence: (evidence: Evidence | null) => void;
  setFilters: (filters: EvidenceFilters) => void;
  createEvidence: (data: Omit<Evidence, "id" | "evidenceNumber" | "chainOfCustody" | "createdAt" | "updatedAt">) => Promise<Evidence>;
  updateEvidence: (id: string, updates: Partial<Evidence>) => Promise<void>;
  deleteEvidence: (id: string) => Promise<void>;
  transferEvidence: (id: string, entry: Omit<CustodyEntry, "id">) => Promise<void>;
  getFilteredEvidence: () => Evidence[];
}

export const useEvidenceStore = create<EvidenceState>()(
  persist(
    (set, get) => ({
      evidence: MOCK_EVIDENCE,
      selectedEvidence: null,
      filters: {},
      isLoading: false,

      loadEvidence: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedEvidence: (evidence) => set({ selectedEvidence: evidence }),

      setFilters: (filters) => set({ filters }),

      createEvidence: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const count = get().evidence.length + 1;
        const newEvidence: Evidence = {
          ...data,
          id: `evd-${Date.now()}`,
          evidenceNumber: `EVD-2024-KOR-${data.firNumber.split("/")[2]}-${String(count).padStart(3, "0")}`,
          chainOfCustody: [
            {
              id: `coc-${Date.now()}`,
              action: "COLLECTED",
              date: data.collectedAt,
              officer: data.collectedBy,
              location: data.location,
              verified: true,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          evidence: [newEvidence, ...state.evidence],
          isLoading: false,
        }));

        return newEvidence;
      },

      updateEvidence: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          evidence: state.evidence.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
          selectedEvidence:
            state.selectedEvidence?.id === id
              ? { ...state.selectedEvidence, ...updates, updatedAt: new Date().toISOString() }
              : state.selectedEvidence,
          isLoading: false,
        }));
      },

      deleteEvidence: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          evidence: state.evidence.filter((e) => e.id !== id),
          selectedEvidence: state.selectedEvidence?.id === id ? null : state.selectedEvidence,
          isLoading: false,
        }));
      },

      transferEvidence: async (id, entry) => {
        const newEntry: CustodyEntry = {
          ...entry,
          id: `coc-${Date.now()}`,
        };

        set((state) => ({
          evidence: state.evidence.map((e) =>
            e.id === id
              ? {
                  ...e,
                  chainOfCustody: [...e.chainOfCustody, newEntry],
                  currentCustodian: entry.location,
                  updatedAt: new Date().toISOString(),
                }
              : e
          ),
        }));
      },

      getFilteredEvidence: () => {
        const { evidence, filters } = get();

        return evidence.filter((e) => {
          if (filters.type && e.type !== filters.type) return false;
          if (filters.status && e.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              e.evidenceNumber.toLowerCase().includes(search) ||
              e.firNumber.toLowerCase().includes(search) ||
              e.category.toLowerCase().includes(search) ||
              e.description.toLowerCase().includes(search);
            if (!matchesSearch) return false;
          }
          return true;
        });
      },
    }),
    {
      name: "npdms-evidence-storage",
      partialize: (state) => ({ evidence: state.evidence }),
    }
  )
);
