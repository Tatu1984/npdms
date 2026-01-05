"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BailApplication {
  id: string;
  applicationNumber: string;
  accused: string;
  caseNumber: string;
  firNumber: string;
  charges: string[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RELEASED";
  bailType: "REGULAR" | "ANTICIPATORY" | "INTERIM";
  applicationDate: string;
  hearingDate?: string;
  approvalDate?: string;
  rejectionDate?: string;
  cancellationDate?: string;
  releaseDate?: string;
  court: string;
  judge?: string;
  bailAmount?: number;
  suretyAmount?: number;
  proposedBailAmount?: number;
  conditions?: string[];
  sureties?: Array<{ name: string; relation: string; verified: boolean }>;
  rejectionReason?: string;
  cancellationReason?: string;
  lawyer?: string;
  validUntil?: string;
}

const MOCK_BAIL_APPLICATIONS: BailApplication[] = [
  {
    id: "bail-001",
    applicationNumber: "BAIL-2024-00089",
    accused: "Raju Kumar",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    charges: ["IPC 392", "IPC 397"],
    status: "APPROVED",
    bailType: "REGULAR",
    applicationDate: "2024-01-22",
    hearingDate: "2024-01-25",
    approvalDate: "2024-01-25",
    court: "Sessions Court, Koramangala",
    judge: "Hon. Justice A.K. Sharma",
    bailAmount: 50000,
    suretyAmount: 100000,
    conditions: [
      "Report to police station every Sunday",
      "Do not leave jurisdiction without permission",
      "Surrender passport",
    ],
    sureties: [
      { name: "Suresh Kumar", relation: "Brother", verified: true },
    ],
  },
  {
    id: "bail-002",
    applicationNumber: "BAIL-2024-00088",
    accused: "Mohammed Farooq",
    caseNumber: "CASE-2024-00135",
    firNumber: "KOR/2024/00060",
    charges: ["IPC 420", "IPC 406"],
    status: "REJECTED",
    bailType: "ANTICIPATORY",
    applicationDate: "2024-01-20",
    hearingDate: "2024-01-24",
    rejectionDate: "2024-01-24",
    rejectionReason: "Flight risk - accused has fled jurisdiction",
    court: "Sessions Court, Koramangala",
    judge: "Hon. Justice P.S. Reddy",
  },
  {
    id: "bail-003",
    applicationNumber: "BAIL-2024-00087",
    accused: "Vijay Malhotra",
    caseNumber: "CASE-2024-00150",
    firNumber: "KOR/2024/00082",
    charges: ["IPC 304A"],
    status: "PENDING",
    bailType: "REGULAR",
    applicationDate: "2024-01-23",
    hearingDate: "2024-01-28",
    court: "Magistrate Court, Koramangala",
    proposedBailAmount: 25000,
    lawyer: "Adv. Ramesh Verma",
  },
  {
    id: "bail-004",
    applicationNumber: "BAIL-2024-00086",
    accused: "Anand Sharma",
    caseNumber: "CASE-2024-00145",
    firNumber: "KOR/2024/00077",
    charges: ["NDPS 20"],
    status: "CANCELLED",
    bailType: "REGULAR",
    applicationDate: "2024-01-15",
    approvalDate: "2024-01-18",
    cancellationDate: "2024-01-22",
    cancellationReason: "Violation of bail conditions - failed to report",
    court: "Sessions Court, Koramangala",
    bailAmount: 100000,
  },
  {
    id: "bail-005",
    applicationNumber: "BAIL-2024-00085",
    accused: "Priya Gupta",
    caseNumber: "CASE-2024-00142",
    firNumber: "KOR/2024/00072",
    charges: ["IPC 420"],
    status: "RELEASED",
    bailType: "INTERIM",
    applicationDate: "2024-01-12",
    approvalDate: "2024-01-12",
    releaseDate: "2024-01-12",
    court: "Magistrate Court, Koramangala",
    bailAmount: 10000,
    validUntil: "2024-02-12",
  },
];

interface BailState {
  applications: BailApplication[];
  selectedApplication: BailApplication | null;
  isLoading: boolean;

  loadApplications: () => Promise<void>;
  setSelectedApplication: (application: BailApplication | null) => void;
  createApplication: (data: Omit<BailApplication, "id" | "applicationNumber">) => Promise<BailApplication>;
  updateApplication: (id: string, updates: Partial<BailApplication>) => Promise<void>;
  addSurety: (id: string, surety: { name: string; relation: string; verified: boolean }) => Promise<void>;
  verifySurety: (applicationId: string, suretyIndex: number) => Promise<void>;
  updateStatus: (id: string, status: BailApplication["status"], reason?: string) => Promise<void>;
  getStats: () => { total: number; pending: number; approved: number; rejected: number };
}

export const useBailStore = create<BailState>()(
  persist(
    (set, get) => ({
      applications: MOCK_BAIL_APPLICATIONS,
      selectedApplication: null,
      isLoading: false,

      loadApplications: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedApplication: (application) => set({ selectedApplication: application }),

      createApplication: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const applicationNumber = `BAIL-2024-${String(get().applications.length + 90).padStart(5, "0")}`;

        const newApplication: BailApplication = {
          ...data,
          id: `bail-${Date.now()}`,
          applicationNumber,
        };

        set((state) => ({
          applications: [newApplication, ...state.applications],
          isLoading: false,
        }));

        return newApplication;
      },

      updateApplication: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          selectedApplication:
            state.selectedApplication?.id === id
              ? { ...state.selectedApplication, ...updates }
              : state.selectedApplication,
          isLoading: false,
        }));
      },

      addSurety: async (id, surety) => {
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id
              ? { ...a, sureties: [...(a.sureties || []), surety] }
              : a
          ),
        }));
      },

      verifySurety: async (applicationId, suretyIndex) => {
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  sureties: a.sureties?.map((s, i) =>
                    i === suretyIndex ? { ...s, verified: true } : s
                  ),
                }
              : a
          ),
        }));
      },

      updateStatus: async (id, status, reason) => {
        const dateField =
          status === "APPROVED" ? "approvalDate" :
          status === "REJECTED" ? "rejectionDate" :
          status === "CANCELLED" ? "cancellationDate" :
          status === "RELEASED" ? "releaseDate" : null;

        const reasonField =
          status === "REJECTED" ? "rejectionReason" :
          status === "CANCELLED" ? "cancellationReason" : null;

        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  ...(dateField && { [dateField]: new Date().toISOString().split("T")[0] }),
                  ...(reasonField && reason && { [reasonField]: reason }),
                }
              : a
          ),
        }));
      },

      getStats: () => {
        const { applications } = get();
        return {
          total: applications.length,
          pending: applications.filter((a) => a.status === "PENDING").length,
          approved: applications.filter((a) => a.status === "APPROVED" || a.status === "RELEASED").length,
          rejected: applications.filter((a) => a.status === "REJECTED" || a.status === "CANCELLED").length,
        };
      },
    }),
    {
      name: "npdms-bail-storage",
      partialize: (state) => ({ applications: state.applications }),
    }
  )
);
