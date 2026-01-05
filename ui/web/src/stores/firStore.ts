"use client";

import { create } from "zustand";
import type { FIR, FIRStatus, FIRPriority } from "@/types";

// Mock FIR data
const MOCK_FIRS: FIR[] = [
  {
    id: "fir-001",
    firNumber: "KOR/2024/00123",
    stationId: "station-001",
    stationName: "Koramangala PS",
    complainantName: "Rajesh Sharma",
    complainantPhone: "+91 9876543210",
    complainantAddress: "45, 5th Block, Koramangala, Bengaluru",
    incidentDate: "2024-01-15",
    incidentTime: "14:30",
    incidentLocation: "Forum Mall, Koramangala",
    offenceCategory: "Property Crimes",
    offenceType: "Theft",
    ipcSections: ["IPC 379", "IPC 411"],
    description: "Complainant reports theft of laptop and mobile phone from vehicle parked in mall parking lot. CCTV footage requested.",
    status: "UNDER_INVESTIGATION",
    priority: "HIGH",
    investigatingOfficer: "user-001",
    investigatingOfficerName: "Ramesh Kumar",
    registeredAt: "2024-01-15T15:00:00Z",
    registeredBy: "user-002",
    updatedAt: "2024-01-16T10:30:00Z",
  },
  {
    id: "fir-002",
    firNumber: "KOR/2024/00122",
    stationId: "station-001",
    stationName: "Koramangala PS",
    complainantName: "Priya Menon",
    complainantPhone: "+91 9876543211",
    complainantAddress: "12, 3rd Cross, HSR Layout, Bengaluru",
    incidentDate: "2024-01-15",
    incidentTime: "22:15",
    incidentLocation: "Near HSR Layout Metro Station",
    offenceCategory: "Crimes Against Person",
    offenceType: "Assault",
    ipcSections: ["IPC 323", "IPC 504"],
    description: "Complainant was assaulted by unknown persons near metro station. Suffered minor injuries. Three suspects involved.",
    status: "REGISTERED",
    priority: "CRITICAL",
    registeredAt: "2024-01-15T23:00:00Z",
    registeredBy: "user-002",
    updatedAt: "2024-01-15T23:00:00Z",
  },
  {
    id: "fir-003",
    firNumber: "KOR/2024/00121",
    stationId: "station-001",
    stationName: "Koramangala PS",
    complainantName: "Mohammed Khan",
    complainantPhone: "+91 9876543212",
    complainantAddress: "78, 1st Stage, Indiranagar, Bengaluru",
    incidentDate: "2024-01-14",
    incidentTime: "11:00",
    incidentLocation: "Online Transaction",
    offenceCategory: "Economic Offences",
    offenceType: "Fraud",
    ipcSections: ["IPC 420", "IT Act 66D"],
    description: "Complainant was defrauded of Rs. 2,50,000 through fake online investment scheme. Bank transaction details provided.",
    status: "UNDER_INVESTIGATION",
    priority: "NORMAL",
    investigatingOfficer: "user-001",
    investigatingOfficerName: "Ramesh Kumar",
    registeredAt: "2024-01-14T12:00:00Z",
    registeredBy: "user-002",
    updatedAt: "2024-01-15T16:00:00Z",
  },
  {
    id: "fir-004",
    firNumber: "KOR/2024/00120",
    stationId: "station-001",
    stationName: "Koramangala PS",
    complainantName: "Anita Desai",
    complainantPhone: "+91 9876543213",
    complainantAddress: "34, 4th Block, Jayanagar, Bengaluru",
    incidentDate: "2024-01-13",
    incidentTime: "16:45",
    incidentLocation: "Jayanagar 4th Block",
    offenceCategory: "Property Crimes",
    offenceType: "Chain Snatching",
    ipcSections: ["IPC 392"],
    description: "Gold chain snatched by two men on motorcycle. Partial vehicle number noted by witnesses.",
    status: "CHARGESHEET_FILED",
    priority: "HIGH",
    investigatingOfficer: "user-001",
    investigatingOfficerName: "Ramesh Kumar",
    registeredAt: "2024-01-13T17:30:00Z",
    registeredBy: "user-002",
    updatedAt: "2024-01-20T14:00:00Z",
  },
  {
    id: "fir-005",
    firNumber: "KOR/2024/00119",
    stationId: "station-001",
    stationName: "Koramangala PS",
    complainantName: "Suresh Reddy",
    complainantPhone: "+91 9876543214",
    complainantAddress: "56, BTM Layout 2nd Stage, Bengaluru",
    incidentDate: "2024-01-10",
    incidentTime: "03:00",
    incidentLocation: "BTM Layout",
    offenceCategory: "Property Crimes",
    offenceType: "Burglary",
    ipcSections: ["IPC 457", "IPC 380"],
    description: "House burglary while family was away. Jewelry and cash worth Rs. 5,00,000 stolen. Lock broken.",
    status: "CLOSED",
    priority: "NORMAL",
    investigatingOfficer: "user-001",
    investigatingOfficerName: "Ramesh Kumar",
    registeredAt: "2024-01-10T08:00:00Z",
    registeredBy: "user-002",
    updatedAt: "2024-01-25T11:00:00Z",
  },
];

interface FIRFilters {
  status?: FIRStatus;
  priority?: FIRPriority;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface FIRState {
  firs: FIR[];
  selectedFIR: FIR | null;
  filters: FIRFilters;
  isLoading: boolean;

  // Actions
  loadFIRs: () => Promise<void>;
  setSelectedFIR: (fir: FIR | null) => void;
  setFilters: (filters: FIRFilters) => void;
  createFIR: (fir: Omit<FIR, "id" | "firNumber" | "registeredAt" | "updatedAt">) => Promise<FIR>;
  updateFIR: (id: string, updates: Partial<FIR>) => Promise<void>;
  deleteFIR: (id: string) => Promise<void>;
  getFilteredFIRs: () => FIR[];
}

export const useFIRStore = create<FIRState>((set, get) => ({
  firs: [],
  selectedFIR: null,
  filters: {},
  isLoading: false,

  loadFIRs: async () => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ firs: MOCK_FIRS, isLoading: false });
  },

  setSelectedFIR: (fir) => set({ selectedFIR: fir }),

  setFilters: (filters) => set({ filters }),

  createFIR: async (firData) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newFIR: FIR = {
      ...firData,
      id: `fir-${Date.now()}`,
      firNumber: `KOR/2024/${String(get().firs.length + 124).padStart(5, "0")}`,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      firs: [newFIR, ...state.firs],
      isLoading: false,
    }));

    return newFIR;
  },

  updateFIR: async (id, updates) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      firs: state.firs.map((fir) =>
        fir.id === id
          ? { ...fir, ...updates, updatedAt: new Date().toISOString() }
          : fir
      ),
      selectedFIR:
        state.selectedFIR?.id === id
          ? { ...state.selectedFIR, ...updates, updatedAt: new Date().toISOString() }
          : state.selectedFIR,
      isLoading: false,
    }));
  },

  deleteFIR: async (id) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      firs: state.firs.filter((fir) => fir.id !== id),
      selectedFIR: state.selectedFIR?.id === id ? null : state.selectedFIR,
      isLoading: false,
    }));
  },

  getFilteredFIRs: () => {
    const { firs, filters } = get();

    return firs.filter((fir) => {
      if (filters.status && fir.status !== filters.status) return false;
      if (filters.priority && fir.priority !== filters.priority) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          fir.firNumber.toLowerCase().includes(search) ||
          fir.complainantName.toLowerCase().includes(search) ||
          fir.offenceType.toLowerCase().includes(search) ||
          fir.description.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      if (filters.dateFrom && fir.incidentDate < filters.dateFrom) return false;
      if (filters.dateTo && fir.incidentDate > filters.dateTo) return false;

      return true;
    });
  },
}));
