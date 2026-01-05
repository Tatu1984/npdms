"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Accused {
  id: string;
  name: string;
  age?: number;
  address?: string;
  identificationMarks?: string;
  status: "WANTED" | "ARRESTED" | "ABSCONDING" | "BAILED" | "CONVICTED";
}

export interface Witness {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  statementRecorded: boolean;
}

export interface Case {
  id: string;
  caseNumber: string;
  firId: string;
  firNumber: string;
  title: string;
  description: string;
  status: "INVESTIGATION" | "CHARGESHEET" | "TRIAL" | "JUDGMENT" | "CLOSED" | "APPEAL";
  courtName?: string;
  nextHearing?: string;
  accused: Accused[];
  witnesses: Witness[];
  investigatingOfficer?: string;
  investigatingOfficerName?: string;
  prosecutor?: string;
  judge?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const MOCK_CASES: Case[] = [
  {
    id: "case-001",
    caseNumber: "CC/2024/0045",
    firId: "fir-001",
    firNumber: "KOR/2024/00123",
    title: "State vs. Unknown (Theft)",
    description: "Theft of laptop and mobile phone from vehicle parked in mall parking lot",
    status: "INVESTIGATION",
    accused: [
      { id: "acc-001", name: "Unknown Suspect 1", status: "WANTED", identificationMarks: "Tall, dark clothes" },
    ],
    witnesses: [
      { id: "wit-001", name: "Security Guard Raju", phone: "+91 9876543220", statementRecorded: true },
      { id: "wit-002", name: "Mrs. Lakshmi", phone: "+91 9876543221", statementRecorded: true },
    ],
    investigatingOfficer: "user-001",
    investigatingOfficerName: "SI Ramesh Kumar",
    createdAt: "2024-01-15T15:30:00Z",
    updatedAt: "2024-01-18T10:00:00Z",
  },
  {
    id: "case-002",
    caseNumber: "CC/2024/0044",
    firId: "fir-004",
    firNumber: "KOR/2024/00120",
    title: "State vs. Raju (Chain Snatching)",
    description: "Chain snatching incident at Jayanagar 4th Block",
    status: "CHARGESHEET",
    courtName: "Magistrate Court, Bengaluru",
    nextHearing: "2024-02-15",
    accused: [
      { id: "acc-002", name: "Raju alias Kulla", age: 28, status: "ARRESTED", address: "Madiwala" },
      { id: "acc-003", name: "Suresh", age: 25, status: "ABSCONDING" },
    ],
    witnesses: [
      { id: "wit-003", name: "Auto Driver Venkat", statementRecorded: true },
    ],
    investigatingOfficer: "user-001",
    investigatingOfficerName: "SI Ramesh Kumar",
    prosecutor: "Public Prosecutor Sharma",
    createdAt: "2024-01-13T18:00:00Z",
    updatedAt: "2024-01-20T14:00:00Z",
  },
  {
    id: "case-003",
    caseNumber: "CC/2024/0043",
    firId: "fir-003",
    firNumber: "KOR/2024/00121",
    title: "State vs. Unknown (Online Fraud)",
    description: "Online investment fraud case",
    status: "INVESTIGATION",
    accused: [],
    witnesses: [
      { id: "wit-004", name: "Bank Manager", statementRecorded: false },
    ],
    investigatingOfficer: "user-001",
    investigatingOfficerName: "SI Ramesh Kumar",
    createdAt: "2024-01-14T12:30:00Z",
    updatedAt: "2024-01-17T09:00:00Z",
  },
];

interface CaseFilters {
  status?: Case["status"];
  search?: string;
}

interface CasesState {
  cases: Case[];
  selectedCase: Case | null;
  filters: CaseFilters;
  isLoading: boolean;

  loadCases: () => Promise<void>;
  setSelectedCase: (caseItem: Case | null) => void;
  setFilters: (filters: CaseFilters) => void;
  createCase: (caseData: Omit<Case, "id" | "caseNumber" | "createdAt" | "updatedAt">) => Promise<Case>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addAccused: (caseId: string, accused: Omit<Accused, "id">) => Promise<void>;
  addWitness: (caseId: string, witness: Omit<Witness, "id">) => Promise<void>;
  getFilteredCases: () => Case[];
}

export const useCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      cases: MOCK_CASES,
      selectedCase: null,
      filters: {},
      isLoading: false,

      loadCases: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedCase: (caseItem) => set({ selectedCase: caseItem }),

      setFilters: (filters) => set({ filters }),

      createCase: async (caseData) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newCase: Case = {
          ...caseData,
          id: `case-${Date.now()}`,
          caseNumber: `CC/2024/${String(get().cases.length + 46).padStart(4, "0")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          cases: [newCase, ...state.cases],
          isLoading: false,
        }));

        return newCase;
      },

      updateCase: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
          selectedCase:
            state.selectedCase?.id === id
              ? { ...state.selectedCase, ...updates, updatedAt: new Date().toISOString() }
              : state.selectedCase,
          isLoading: false,
        }));
      },

      deleteCase: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          cases: state.cases.filter((c) => c.id !== id),
          selectedCase: state.selectedCase?.id === id ? null : state.selectedCase,
          isLoading: false,
        }));
      },

      addAccused: async (caseId, accusedData) => {
        const newAccused: Accused = {
          ...accusedData,
          id: `acc-${Date.now()}`,
        };

        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId
              ? { ...c, accused: [...c.accused, newAccused], updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      addWitness: async (caseId, witnessData) => {
        const newWitness: Witness = {
          ...witnessData,
          id: `wit-${Date.now()}`,
        };

        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === caseId
              ? { ...c, witnesses: [...c.witnesses, newWitness], updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      getFilteredCases: () => {
        const { cases, filters } = get();

        return cases.filter((c) => {
          if (filters.status && c.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              c.caseNumber.toLowerCase().includes(search) ||
              c.firNumber.toLowerCase().includes(search) ||
              c.title.toLowerCase().includes(search) ||
              c.description.toLowerCase().includes(search);
            if (!matchesSearch) return false;
          }
          return true;
        });
      },
    }),
    {
      name: "npdms-cases-storage",
      partialize: (state) => ({ cases: state.cases }),
    }
  )
);
