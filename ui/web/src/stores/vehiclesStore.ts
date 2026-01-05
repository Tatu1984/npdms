"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Vehicle {
  id: string;
  regNumber: string;
  type: "Patrol" | "Gypsy" | "PCR" | "Bus";
  make: string;
  status: "ON_DUTY" | "AVAILABLE" | "MAINTENANCE" | "RESERVED";
  driver: string | null;
  fuelLevel: number;
  kmToday: number;
  totalKm: number;
  lastService: string;
  gpsLocation: string | null;
  currentBeat: string | null;
  maintenanceNote?: string;
  reservedFor?: string;
}

// Mock data
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v-001",
    regNumber: "KA-01-P-1234",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    driver: "HC Mohan",
    fuelLevel: 78,
    kmToday: 45,
    totalKm: 45678,
    lastService: "2024-01-01",
    gpsLocation: "12.9352, 77.6245",
    currentBeat: "Beat A - Koramangala 4th Block",
  },
  {
    id: "v-002",
    regNumber: "KA-01-P-1235",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    driver: "Const. Ravi",
    fuelLevel: 65,
    kmToday: 32,
    totalKm: 38921,
    lastService: "2024-01-05",
    gpsLocation: "12.9421, 77.6189",
    currentBeat: "Beat B - Koramangala 5th Block",
  },
  {
    id: "v-003",
    regNumber: "KA-01-G-5678",
    type: "Gypsy",
    make: "Mahindra Thar",
    status: "ON_DUTY",
    driver: "Const. Kumar",
    fuelLevel: 82,
    kmToday: 28,
    totalKm: 23456,
    lastService: "2023-12-20",
    gpsLocation: "12.9156, 77.6412",
    currentBeat: "Court Escort Duty",
  },
  {
    id: "v-004",
    regNumber: "KA-01-P-9999",
    type: "PCR",
    make: "Innova",
    status: "ON_DUTY",
    driver: "ASI Sharma",
    fuelLevel: 45,
    kmToday: 67,
    totalKm: 67890,
    lastService: "2024-01-10",
    gpsLocation: "12.9287, 77.6301",
    currentBeat: "PCR Duty - Mobile",
  },
  {
    id: "v-005",
    regNumber: "KA-01-P-1236",
    type: "Patrol",
    make: "Maruti Swift",
    status: "AVAILABLE",
    driver: null,
    fuelLevel: 90,
    kmToday: 0,
    totalKm: 32100,
    lastService: "2024-01-08",
    gpsLocation: null,
    currentBeat: null,
  },
  {
    id: "v-006",
    regNumber: "KA-01-G-5679",
    type: "Gypsy",
    make: "Mahindra Bolero",
    status: "AVAILABLE",
    driver: null,
    fuelLevel: 95,
    kmToday: 0,
    totalKm: 28500,
    lastService: "2024-01-12",
    gpsLocation: null,
    currentBeat: null,
  },
  {
    id: "v-007",
    regNumber: "KA-01-P-1237",
    type: "Patrol",
    make: "Maruti Swift",
    status: "MAINTENANCE",
    driver: null,
    fuelLevel: 30,
    kmToday: 0,
    totalKm: 52000,
    lastService: "2023-11-15",
    gpsLocation: null,
    currentBeat: null,
    maintenanceNote: "Engine service due",
  },
  {
    id: "v-008",
    regNumber: "KA-01-B-0001",
    type: "Bus",
    make: "Ashok Leyland",
    status: "RESERVED",
    driver: null,
    fuelLevel: 100,
    kmToday: 0,
    totalKm: 15000,
    lastService: "2024-01-05",
    gpsLocation: null,
    currentBeat: null,
    reservedFor: "Bandobast - Republic Day",
  },
];

interface VehicleFilters {
  type?: Vehicle["type"];
  status?: Vehicle["status"];
  search?: string;
}

interface VehiclesState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  filters: VehicleFilters;
  isLoading: boolean;

  loadVehicles: () => Promise<void>;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setFilters: (filters: VehicleFilters) => void;
  createVehicle: (data: Omit<Vehicle, "id">) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  allocateVehicle: (id: string, driver: string, beat: string) => Promise<void>;
  returnVehicle: (id: string) => Promise<void>;
  getFilteredVehicles: () => Vehicle[];
}

export const useVehiclesStore = create<VehiclesState>()(
  persist(
    (set, get) => ({
      vehicles: MOCK_VEHICLES,
      selectedVehicle: null,
      filters: {},
      isLoading: false,

      loadVehicles: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

      setFilters: (filters) => set({ filters }),

      createVehicle: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newVehicle: Vehicle = {
          ...data,
          id: `v-${Date.now()}`,
        };

        set((state) => ({
          vehicles: [newVehicle, ...state.vehicles],
          isLoading: false,
        }));

        return newVehicle;
      },

      updateVehicle: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
          selectedVehicle:
            state.selectedVehicle?.id === id
              ? { ...state.selectedVehicle, ...updates }
              : state.selectedVehicle,
          isLoading: false,
        }));
      },

      deleteVehicle: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          selectedVehicle: state.selectedVehicle?.id === id ? null : state.selectedVehicle,
          isLoading: false,
        }));
      },

      allocateVehicle: async (id, driver, beat) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? { ...v, driver, currentBeat: beat, status: "ON_DUTY" as const }
              : v
          ),
        }));
      },

      returnVehicle: async (id) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? { ...v, driver: null, currentBeat: null, status: "AVAILABLE" as const, gpsLocation: null }
              : v
          ),
        }));
      },

      getFilteredVehicles: () => {
        const { vehicles, filters } = get();

        return vehicles.filter((v) => {
          if (filters.type && v.type !== filters.type) return false;
          if (filters.status && v.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              v.regNumber.toLowerCase().includes(search) ||
              v.driver?.toLowerCase().includes(search) ||
              false;
            if (!matchesSearch) return false;
          }
          return true;
        });
      },
    }),
    {
      name: "npdms-vehicles-storage",
      partialize: (state) => ({ vehicles: state.vehicles }),
    }
  )
);
