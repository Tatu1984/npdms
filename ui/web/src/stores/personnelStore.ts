"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Personnel {
  id: string;
  name: string;
  badgeNumber: string;
  rank: "CONSTABLE" | "HEAD_CONSTABLE" | "ASI" | "SI" | "INSPECTOR" | "SHO" | "SP" | "DIG" | "IG";
  status: "ON_DUTY" | "OFF_DUTY" | "ON_LEAVE" | "TRAINING" | "SUSPENDED";
  phone: string;
  email: string;
  stationId: string;
  stationName: string;
  joiningDate: string;
  assignedCases: number;
  currentDuty: string | null;
  shift: string | null;
  leaveType?: string;
  leaveUntil?: string;
}

// Mock data
const MOCK_PERSONNEL: Personnel[] = [
  {
    id: "p-001",
    name: "Ramesh Kumar",
    badgeNumber: "KAR-C-4567",
    rank: "CONSTABLE",
    status: "ON_DUTY",
    phone: "+91 9876543210",
    email: "ramesh.kumar@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2019-05-15",
    assignedCases: 3,
    currentDuty: "Patrol - Beat A",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-002",
    name: "Mohan Singh",
    badgeNumber: "KAR-HC-3456",
    rank: "HEAD_CONSTABLE",
    status: "ON_DUTY",
    phone: "+91 9876543211",
    email: "mohan.singh@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2015-08-20",
    assignedCases: 5,
    currentDuty: "Armoury In-Charge",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-003",
    name: "Prakash Rao",
    badgeNumber: "KAR-ASI-2345",
    rank: "ASI",
    status: "ON_LEAVE",
    phone: "+91 9876543212",
    email: "prakash.rao@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2012-03-10",
    assignedCases: 4,
    currentDuty: null,
    shift: null,
    leaveType: "Medical Leave",
    leaveUntil: "2024-01-25",
  },
  {
    id: "p-004",
    name: "Suresh Patil",
    badgeNumber: "KAR-SI-1234",
    rank: "SI",
    status: "ON_DUTY",
    phone: "+91 9876543213",
    email: "suresh.patil@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2010-07-01",
    assignedCases: 8,
    currentDuty: "Investigation - FIR/2024/00123",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-005",
    name: "Anand Reddy",
    badgeNumber: "KAR-INS-0987",
    rank: "INSPECTOR",
    status: "OFF_DUTY",
    phone: "+91 9876543214",
    email: "anand.reddy@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2005-09-15",
    assignedCases: 2,
    currentDuty: null,
    shift: "Night (2200-0600)",
  },
  {
    id: "p-006",
    name: "Insp. Sharma",
    badgeNumber: "KAR-SHO-0876",
    rank: "SHO",
    status: "ON_DUTY",
    phone: "+91 9876543215",
    email: "sharma.sho@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2000-01-10",
    assignedCases: 0,
    currentDuty: "Station Command",
    shift: "Day (0800-1700)",
  },
];

interface PersonnelFilters {
  rank?: Personnel["rank"];
  status?: Personnel["status"];
  search?: string;
}

interface PersonnelState {
  personnel: Personnel[];
  selectedPersonnel: Personnel | null;
  filters: PersonnelFilters;
  isLoading: boolean;

  loadPersonnel: () => Promise<void>;
  setSelectedPersonnel: (person: Personnel | null) => void;
  setFilters: (filters: PersonnelFilters) => void;
  createPersonnel: (data: Omit<Personnel, "id">) => Promise<Personnel>;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => Promise<void>;
  deletePersonnel: (id: string) => Promise<void>;
  assignDuty: (id: string, duty: string, shift: string) => Promise<void>;
  getFilteredPersonnel: () => Personnel[];
}

export const usePersonnelStore = create<PersonnelState>()(
  persist(
    (set, get) => ({
      personnel: MOCK_PERSONNEL,
      selectedPersonnel: null,
      filters: {},
      isLoading: false,

      loadPersonnel: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedPersonnel: (person) => set({ selectedPersonnel: person }),

      setFilters: (filters) => set({ filters }),

      createPersonnel: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newPerson: Personnel = {
          ...data,
          id: `p-${Date.now()}`,
        };

        set((state) => ({
          personnel: [newPerson, ...state.personnel],
          isLoading: false,
        }));

        return newPerson;
      },

      updatePersonnel: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          personnel: state.personnel.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          selectedPersonnel:
            state.selectedPersonnel?.id === id
              ? { ...state.selectedPersonnel, ...updates }
              : state.selectedPersonnel,
          isLoading: false,
        }));
      },

      deletePersonnel: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          personnel: state.personnel.filter((p) => p.id !== id),
          selectedPersonnel: state.selectedPersonnel?.id === id ? null : state.selectedPersonnel,
          isLoading: false,
        }));
      },

      assignDuty: async (id, duty, shift) => {
        set((state) => ({
          personnel: state.personnel.map((p) =>
            p.id === id ? { ...p, currentDuty: duty, shift, status: "ON_DUTY" as const } : p
          ),
        }));
      },

      getFilteredPersonnel: () => {
        const { personnel, filters } = get();

        return personnel.filter((p) => {
          if (filters.rank && p.rank !== filters.rank) return false;
          if (filters.status && p.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              p.name.toLowerCase().includes(search) ||
              p.badgeNumber.toLowerCase().includes(search) ||
              p.phone.includes(search);
            if (!matchesSearch) return false;
          }
          return true;
        });
      },
    }),
    {
      name: "npdms-personnel-storage",
      partialize: (state) => ({ personnel: state.personnel }),
    }
  )
);
