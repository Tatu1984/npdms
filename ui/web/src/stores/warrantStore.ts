"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Warrant {
  id: string;
  warrantNumber: string;
  type: "ARREST" | "SEARCH" | "SUMMONS" | "NBW";
  status: "ACTIVE" | "EXECUTED" | "EXPIRED" | "CANCELLED";
  issuedFor: string;
  caseNumber: string;
  firNumber: string;
  issuedBy: string;
  issuedDate: string;
  validUntil: string;
  charges: string[];
  lastKnownLocation?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  executedDate?: string;
  executedBy?: string;
  description?: string;
  age?: number;
  gender?: string;
  address?: string;
  identifyingMarks?: string;
  searchPremises?: string;
  itemsToSearch?: string[];
  witnessRequired?: boolean;
  courtDate?: string;
  itemsSeized?: string[];
  searchScope?: string;
  summonsPurpose?: string;
  hearingDate?: string;
  latitude?: number;
  longitude?: number;
  executionHistory?: Array<{ date: string; action: string; officer: string; result: string }>;
  judgeName?: string;
}

const MOCK_WARRANTS: Warrant[] = [
  {
    id: "war-001",
    warrantNumber: "WAR-2024-00045",
    type: "ARREST",
    status: "ACTIVE",
    issuedFor: "Rajesh Kumar Singh",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-20",
    validUntil: "2024-04-20",
    charges: ["IPC 392", "IPC 397"],
    lastKnownLocation: "Marathahalli, Bangalore",
    priority: "HIGH",
  },
  {
    id: "war-002",
    warrantNumber: "WAR-2024-00044",
    type: "SEARCH",
    status: "EXECUTED",
    issuedFor: "Premises at 45, MG Road",
    caseNumber: "CASE-2024-00148",
    firNumber: "KOR/2024/00075",
    issuedBy: "Magistrate Court, Koramangala",
    issuedDate: "2024-01-18",
    validUntil: "2024-01-25",
    executedDate: "2024-01-19",
    charges: ["NDPS Act 20"],
    priority: "MEDIUM",
  },
  {
    id: "war-003",
    warrantNumber: "WAR-2024-00043",
    type: "ARREST",
    status: "EXPIRED",
    issuedFor: "Unknown Male (Alias: Chotu)",
    caseNumber: "CASE-2024-00140",
    firNumber: "KOR/2024/00068",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-10",
    validUntil: "2024-01-17",
    charges: ["IPC 379"],
    lastKnownLocation: "Electronic City",
    priority: "LOW",
  },
  {
    id: "war-004",
    warrantNumber: "WAR-2024-00042",
    type: "SUMMONS",
    status: "ACTIVE",
    issuedFor: "Priya Sharma (Witness)",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-22",
    validUntil: "2024-02-15",
    charges: [],
    priority: "MEDIUM",
  },
  {
    id: "war-005",
    warrantNumber: "WAR-2024-00041",
    type: "NBW",
    status: "ACTIVE",
    issuedFor: "Mohammed Farooq",
    caseNumber: "CASE-2024-00135",
    firNumber: "KOR/2024/00060",
    issuedBy: "Sessions Court, Koramangala",
    issuedDate: "2024-01-15",
    validUntil: "2024-07-15",
    charges: ["IPC 420", "IPC 406"],
    lastKnownLocation: "Unknown - Fled jurisdiction",
    priority: "HIGH",
  },
];

interface WarrantState {
  warrants: Warrant[];
  selectedWarrant: Warrant | null;
  isLoading: boolean;

  loadWarrants: () => Promise<void>;
  setSelectedWarrant: (warrant: Warrant | null) => void;
  createWarrant: (data: Omit<Warrant, "id" | "warrantNumber">) => Promise<Warrant>;
  updateWarrant: (id: string, updates: Partial<Warrant>) => Promise<void>;
  markExecuted: (id: string, executedBy: string) => Promise<void>;
  cancelWarrant: (id: string) => Promise<void>;
  getStats: () => { total: number; active: number; executed: number; expired: number };
}

export const useWarrantStore = create<WarrantState>()(
  persist(
    (set, get) => ({
      warrants: MOCK_WARRANTS,
      selectedWarrant: null,
      isLoading: false,

      loadWarrants: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedWarrant: (warrant) => set({ selectedWarrant: warrant }),

      createWarrant: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const warrantNumber = `WAR-2024-${String(get().warrants.length + 46).padStart(5, "0")}`;

        const newWarrant: Warrant = {
          ...data,
          id: `war-${Date.now()}`,
          warrantNumber,
        };

        set((state) => ({
          warrants: [newWarrant, ...state.warrants],
          isLoading: false,
        }));

        return newWarrant;
      },

      updateWarrant: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          warrants: state.warrants.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          selectedWarrant:
            state.selectedWarrant?.id === id
              ? { ...state.selectedWarrant, ...updates }
              : state.selectedWarrant,
          isLoading: false,
        }));
      },

      markExecuted: async (id, executedBy) => {
        set((state) => ({
          warrants: state.warrants.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: "EXECUTED" as const,
                  executedDate: new Date().toISOString().split("T")[0],
                  executedBy,
                }
              : w
          ),
        }));
      },

      cancelWarrant: async (id) => {
        set((state) => ({
          warrants: state.warrants.map((w) =>
            w.id === id ? { ...w, status: "CANCELLED" as const } : w
          ),
        }));
      },

      getStats: () => {
        const { warrants } = get();
        return {
          total: warrants.length,
          active: warrants.filter((w) => w.status === "ACTIVE").length,
          executed: warrants.filter((w) => w.status === "EXECUTED").length,
          expired: warrants.filter((w) => w.status === "EXPIRED").length,
        };
      },
    }),
    {
      name: "npdms-warrant-storage",
      partialize: (state) => ({ warrants: state.warrants }),
    }
  )
);
