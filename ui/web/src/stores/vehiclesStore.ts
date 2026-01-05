"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: "Patrol" | "Gypsy" | "PCR" | "Bus";
  make: string;
  status: "ON_DUTY" | "AVAILABLE" | "MAINTENANCE" | "RESERVED";
  currentDriver: string | null;
  fuelLevel: number;
  odometerReading: number;
  lastService: string;
  gpsLocation: { lat: number; lng: number } | null;
  currentDuty: string | null;
  maintenanceNote?: string;
  reservedFor?: string;
}

// Mock data
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v-001",
    registrationNumber: "KA-01-P-1234",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    currentDriver: "HC Mohan",
    fuelLevel: 78,
    odometerReading: 45678,
    lastService: "2024-01-01",
    gpsLocation: { lat: 12.9352, lng: 77.6245 },
    currentDuty: "Beat A - Koramangala 4th Block",
  },
  {
    id: "v-002",
    registrationNumber: "KA-01-P-1235",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    currentDriver: "Const. Ravi",
    fuelLevel: 65,
    odometerReading: 38921,
    lastService: "2024-01-05",
    gpsLocation: { lat: 12.9421, lng: 77.6189 },
    currentDuty: "Beat B - Koramangala 5th Block",
  },
  {
    id: "v-003",
    registrationNumber: "KA-01-G-5678",
    type: "Gypsy",
    make: "Mahindra Thar",
    status: "ON_DUTY",
    currentDriver: "Const. Kumar",
    fuelLevel: 82,
    odometerReading: 23456,
    lastService: "2023-12-20",
    gpsLocation: { lat: 12.9156, lng: 77.6412 },
    currentDuty: "Court Escort Duty",
  },
  {
    id: "v-004",
    registrationNumber: "KA-01-P-9999",
    type: "PCR",
    make: "Innova",
    status: "ON_DUTY",
    currentDriver: "ASI Sharma",
    fuelLevel: 45,
    odometerReading: 67890,
    lastService: "2024-01-10",
    gpsLocation: { lat: 12.9287, lng: 77.6301 },
    currentDuty: "PCR Duty - Mobile",
  },
  {
    id: "v-005",
    registrationNumber: "KA-01-P-1236",
    type: "Patrol",
    make: "Maruti Swift",
    status: "AVAILABLE",
    currentDriver: null,
    fuelLevel: 90,
    odometerReading: 32100,
    lastService: "2024-01-08",
    gpsLocation: null,
    currentDuty: null,
  },
  {
    id: "v-006",
    registrationNumber: "KA-01-G-5679",
    type: "Gypsy",
    make: "Mahindra Bolero",
    status: "AVAILABLE",
    currentDriver: null,
    fuelLevel: 95,
    odometerReading: 28500,
    lastService: "2024-01-12",
    gpsLocation: null,
    currentDuty: null,
  },
  {
    id: "v-007",
    registrationNumber: "KA-01-P-1237",
    type: "Patrol",
    make: "Maruti Swift",
    status: "MAINTENANCE",
    currentDriver: null,
    fuelLevel: 30,
    odometerReading: 52000,
    lastService: "2023-11-15",
    gpsLocation: null,
    currentDuty: null,
    maintenanceNote: "Engine service due",
  },
  {
    id: "v-008",
    registrationNumber: "KA-01-B-0001",
    type: "Bus",
    make: "Ashok Leyland",
    status: "RESERVED",
    currentDriver: null,
    fuelLevel: 100,
    odometerReading: 15000,
    lastService: "2024-01-05",
    gpsLocation: null,
    currentDuty: null,
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

      allocateVehicle: async (id, driver, duty) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? { ...v, currentDriver: driver, currentDuty: duty, status: "ON_DUTY" as const }
              : v
          ),
        }));
      },

      returnVehicle: async (id) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? { ...v, currentDriver: null, currentDuty: null, status: "AVAILABLE" as const, gpsLocation: null }
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
              v.registrationNumber.toLowerCase().includes(search) ||
              v.currentDriver?.toLowerCase().includes(search) ||
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
