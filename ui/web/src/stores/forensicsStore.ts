"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ForensicRequest {
  id: string;
  evidenceId: string;
  caseNumber: string;
  type: "FINGERPRINT" | "DNA" | "BALLISTICS" | "DIGITAL" | "NARCOTICS" | "DOCUMENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "INCONCLUSIVE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  submittedDate: string;
  completedDate?: string;
  expectedDate?: string;
  lab: string;
  analyst?: string;
  summary?: string;
  findings?: string;
  progress?: number;
  devices?: string[];
  items?: string[];
}

const MOCK_FORENSIC_REQUESTS: ForensicRequest[] = [
  {
    id: "FSL-2024-00234",
    evidenceId: "EVD-2024-KOR-00156",
    caseNumber: "CASE-2024-00156",
    type: "FINGERPRINT",
    status: "COMPLETED",
    priority: "HIGH",
    submittedDate: "2024-01-16",
    completedDate: "2024-01-23",
    lab: "FSL Bangalore",
    analyst: "Dr. Priya Nair",
    summary: "3 fingerprint matches found. Matched with accused Raju Kumar.",
    findings: "Positive match with NAFIS database",
  },
  {
    id: "FSL-2024-00233",
    evidenceId: "EVD-2024-KOR-00157",
    caseNumber: "CASE-2024-00156",
    type: "DNA",
    status: "IN_PROGRESS",
    priority: "HIGH",
    submittedDate: "2024-01-18",
    expectedDate: "2024-02-01",
    lab: "FSL Bangalore",
    analyst: "Dr. Ramesh Kumar",
    progress: 65,
  },
  {
    id: "FSL-2024-00232",
    evidenceId: "EVD-2024-KOR-00145",
    caseNumber: "CASE-2024-00145",
    type: "NARCOTICS",
    status: "COMPLETED",
    priority: "MEDIUM",
    submittedDate: "2024-01-14",
    completedDate: "2024-01-20",
    lab: "FSL Bangalore",
    analyst: "Dr. Suresh Menon",
    summary: "Substance confirmed as Methamphetamine. Net weight: 245g",
    findings: "NDPS Act applicable",
  },
  {
    id: "FSL-2024-00231",
    evidenceId: "EVD-2024-KOR-00148",
    caseNumber: "CASE-2024-00148",
    type: "DIGITAL",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    submittedDate: "2024-01-15",
    expectedDate: "2024-01-30",
    lab: "Cyber Forensics Lab",
    analyst: "Er. Vikram Singh",
    progress: 40,
    devices: ["1x Laptop", "2x Mobile Phones", "1x Hard Disk"],
  },
  {
    id: "FSL-2024-00230",
    evidenceId: "EVD-2024-KOR-00140",
    caseNumber: "CASE-2024-00140",
    type: "BALLISTICS",
    status: "PENDING",
    priority: "LOW",
    submittedDate: "2024-01-22",
    expectedDate: "2024-02-05",
    lab: "FSL Bangalore",
    items: ["2x Cartridge cases", "1x Bullet fragment"],
  },
  {
    id: "FSL-2024-00229",
    evidenceId: "EVD-2024-KOR-00135",
    caseNumber: "CASE-2024-00135",
    type: "DOCUMENT",
    status: "COMPLETED",
    priority: "MEDIUM",
    submittedDate: "2024-01-10",
    completedDate: "2024-01-17",
    lab: "Document Examination Lab",
    analyst: "Dr. Anjali Sharma",
    summary: "Signature found to be forged. Document is not authentic.",
    findings: "Forgery confirmed",
  },
];

interface ForensicsState {
  requests: ForensicRequest[];
  selectedRequest: ForensicRequest | null;
  isLoading: boolean;

  loadRequests: () => Promise<void>;
  setSelectedRequest: (request: ForensicRequest | null) => void;
  createRequest: (data: Omit<ForensicRequest, "id">) => Promise<ForensicRequest>;
  updateRequest: (id: string, updates: Partial<ForensicRequest>) => Promise<void>;
  completeRequest: (id: string, summary: string, findings: string) => Promise<void>;
  getStats: () => { total: number; pending: number; inProgress: number; completed: number };
}

export const useForensicsStore = create<ForensicsState>()(
  persist(
    (set, get) => ({
      requests: MOCK_FORENSIC_REQUESTS,
      selectedRequest: null,
      isLoading: false,

      loadRequests: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedRequest: (request) => set({ selectedRequest: request }),

      createRequest: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newRequest: ForensicRequest = {
          ...data,
          id: `FSL-2024-${String(get().requests.length + 235).padStart(5, "0")}`,
        };

        set((state) => ({
          requests: [newRequest, ...state.requests],
          isLoading: false,
        }));

        return newRequest;
      },

      updateRequest: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          selectedRequest:
            state.selectedRequest?.id === id
              ? { ...state.selectedRequest, ...updates }
              : state.selectedRequest,
          isLoading: false,
        }));
      },

      completeRequest: async (id, summary, findings) => {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "COMPLETED" as const,
                  completedDate: new Date().toISOString().split("T")[0],
                  summary,
                  findings,
                  progress: 100,
                }
              : r
          ),
        }));
      },

      getStats: () => {
        const { requests } = get();
        return {
          total: requests.length,
          pending: requests.filter((r) => r.status === "PENDING").length,
          inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
          completed: requests.filter((r) => r.status === "COMPLETED").length,
        };
      },
    }),
    {
      name: "npdms-forensics-storage",
      partialize: (state) => ({ requests: state.requests }),
    }
  )
);
