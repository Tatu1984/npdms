"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Lookout {
  id: string;
  lookoutId: string;
  type: "WANTED" | "MISSING" | "STOLEN_VEHICLE" | "SUSPECT" | "WITNESS";
  name: string;
  description: string;
  details: Record<string, string>;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "LOCATED" | "CLOSED";
  linkedFIR: string | null;
  issuedBy: string;
  issuedAt: string;
  hasPhoto: boolean;
  photoUrl?: string;
}

export interface Sighting {
  id: string;
  lookoutId: string;
  reportedBy: string;
  location: string;
  time: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  details: string;
  coordinates?: { lat: number; lng: number };
}

// Mock data
const MOCK_LOOKOUTS: Lookout[] = [
  {
    id: "lo-001",
    lookoutId: "LO-2024-KOR-001",
    type: "WANTED",
    name: "Rajan Kumar @ Raju",
    description: "Wanted in murder case CC/2024/0045",
    details: {
      age: "32",
      gender: "Male",
      height: "5'8\"",
      complexion: "Dark",
      identifyingMarks: "Scar on left cheek",
      lastSeen: "Jayanagar, Bengaluru",
      lastSeenDate: "2024-01-15",
    },
    priority: "HIGH",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00089",
    issuedBy: "State Crime Branch",
    issuedAt: "2024-01-17T00:00:00Z",
    hasPhoto: true,
  },
  {
    id: "lo-002",
    lookoutId: "LO-2024-KOR-002",
    type: "MISSING",
    name: "Priya Sharma",
    description: "Missing since 16 Jan 2024 from BTM Layout",
    details: {
      age: "24",
      gender: "Female",
      height: "5'4\"",
      complexion: "Fair",
      lastWornClothes: "Blue salwar, white dupatta",
      lastSeen: "BTM Layout 2nd Stage",
      lastSeenDate: "2024-01-16",
      contactInfo: "+91 9876543210 (Father)",
    },
    priority: "CRITICAL",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00125",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-17T00:00:00Z",
    hasPhoto: true,
  },
  {
    id: "lo-003",
    lookoutId: "LO-2024-KOR-003",
    type: "STOLEN_VEHICLE",
    name: "KA-01-MH-5678",
    description: "Honda City, White, Stolen from JP Nagar",
    details: {
      make: "Honda City",
      model: "VX CVT",
      year: "2022",
      color: "White",
      chassisNumber: "ME4WB2DE1M******",
      engineNumber: "L15Z6-21*****",
      stolenFrom: "JP Nagar 5th Phase",
      stolenDate: "2024-01-14",
    },
    priority: "NORMAL",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00118",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-15T00:00:00Z",
    hasPhoto: false,
  },
  {
    id: "lo-004",
    lookoutId: "LO-2024-KOR-004",
    type: "SUSPECT",
    name: "Unknown Male",
    description: "Suspect in chain snatching incidents",
    details: {
      age: "25-30",
      gender: "Male",
      height: "5'6\" approx",
      complexion: "Wheatish",
      identifyingMarks: "Wears gold chain",
      vehicleDescription: "Red Pulsar, partial number MH-**-5*",
      lastSeen: "Koramangala area",
      lastSeenDate: "2024-01-18",
    },
    priority: "HIGH",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00120",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-18T00:00:00Z",
    hasPhoto: false,
  },
];

const MOCK_SIGHTINGS: Sighting[] = [
  {
    id: "sight-001",
    lookoutId: "LO-2024-KOR-001",
    reportedBy: "Const. Vijay",
    location: "Near Forum Mall",
    time: "2024-01-18T10:30:00Z",
    verified: false,
    details: "Person matching description seen near mall entrance",
    coordinates: { lat: 12.934, lng: 77.625 },
  },
  {
    id: "sight-002",
    lookoutId: "LO-2024-KOR-003",
    reportedBy: "Public Tip",
    location: "Hosur Road",
    time: "2024-01-17T14:00:00Z",
    verified: true,
    verifiedBy: "ASI Prakash",
    verifiedAt: "2024-01-17T15:00:00Z",
    details: "Vehicle spotted on Hosur Road heading towards Electronics City",
    coordinates: { lat: 12.897, lng: 77.644 },
  },
];

interface LookoutFilters {
  type?: Lookout["type"];
  status?: Lookout["status"];
  priority?: Lookout["priority"];
  search?: string;
}

interface LookoutState {
  lookouts: Lookout[];
  sightings: Sighting[];
  selectedLookout: Lookout | null;
  filters: LookoutFilters;
  isLoading: boolean;

  loadLookouts: () => Promise<void>;
  setSelectedLookout: (lookout: Lookout | null) => void;
  setFilters: (filters: LookoutFilters) => void;
  createLookout: (data: Omit<Lookout, "id" | "lookoutId" | "issuedAt">) => Promise<Lookout>;
  updateLookout: (id: string, updates: Partial<Lookout>) => Promise<void>;
  deleteLookout: (id: string) => Promise<void>;
  closeLookout: (id: string, reason: string) => Promise<void>;
  reportSighting: (data: Omit<Sighting, "id" | "time" | "verified">) => Promise<Sighting>;
  verifySighting: (id: string, verifiedBy: string, verified: boolean) => Promise<void>;
  getFilteredLookouts: () => Lookout[];
  getActiveLookouts: () => Lookout[];
  getSightingsForLookout: (lookoutId: string) => Sighting[];
}

export const useLookoutStore = create<LookoutState>()(
  persist(
    (set, get) => ({
      lookouts: MOCK_LOOKOUTS,
      sightings: MOCK_SIGHTINGS,
      selectedLookout: null,
      filters: {},
      isLoading: false,

      loadLookouts: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedLookout: (lookout) => set({ selectedLookout: lookout }),

      setFilters: (filters) => set({ filters }),

      createLookout: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newLookout: Lookout = {
          ...data,
          id: `lo-${Date.now()}`,
          lookoutId: `LO-2024-KOR-${String(get().lookouts.length + 5).padStart(3, "0")}`,
          issuedAt: new Date().toISOString(),
        };

        set((state) => ({
          lookouts: [newLookout, ...state.lookouts],
          isLoading: false,
        }));

        return newLookout;
      },

      updateLookout: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          lookouts: state.lookouts.map((lo) =>
            lo.id === id ? { ...lo, ...updates } : lo
          ),
          selectedLookout:
            state.selectedLookout?.id === id
              ? { ...state.selectedLookout, ...updates }
              : state.selectedLookout,
          isLoading: false,
        }));
      },

      deleteLookout: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          lookouts: state.lookouts.filter((lo) => lo.id !== id),
          selectedLookout: state.selectedLookout?.id === id ? null : state.selectedLookout,
          isLoading: false,
        }));
      },

      closeLookout: async (id, reason) => {
        set((state) => ({
          lookouts: state.lookouts.map((lo) =>
            lo.id === id
              ? { ...lo, status: "CLOSED" as const, details: { ...lo.details, closureReason: reason } }
              : lo
          ),
        }));
      },

      reportSighting: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newSighting: Sighting = {
          ...data,
          id: `sight-${Date.now()}`,
          time: new Date().toISOString(),
          verified: false,
        };

        set((state) => ({
          sightings: [newSighting, ...state.sightings],
          isLoading: false,
        }));

        return newSighting;
      },

      verifySighting: async (id, verifiedBy, verified) => {
        set((state) => ({
          sightings: state.sightings.map((s) =>
            s.id === id
              ? {
                  ...s,
                  verified,
                  verifiedBy: verified ? verifiedBy : undefined,
                  verifiedAt: verified ? new Date().toISOString() : undefined,
                }
              : s
          ),
        }));
      },

      getFilteredLookouts: () => {
        const { lookouts, filters } = get();

        return lookouts.filter((lo) => {
          if (filters.type && lo.type !== filters.type) return false;
          if (filters.status && lo.status !== filters.status) return false;
          if (filters.priority && lo.priority !== filters.priority) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              lo.lookoutId.toLowerCase().includes(search) ||
              lo.name.toLowerCase().includes(search) ||
              lo.description.toLowerCase().includes(search);
            if (!matchesSearch) return false;
          }
          return true;
        });
      },

      getActiveLookouts: () => {
        return get().lookouts.filter((lo) => lo.status === "ACTIVE");
      },

      getSightingsForLookout: (lookoutId) => {
        return get().sightings.filter((s) => s.lookoutId === lookoutId);
      },
    }),
    {
      name: "npdms-lookout-storage",
      partialize: (state) => ({ lookouts: state.lookouts, sightings: state.sightings }),
    }
  )
);
