"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Weapon {
  id: string;
  weaponId: string;
  type: string;
  make: string;
  serialNumber: string;
  status: "IN_ARMOURY" | "ISSUED" | "MAINTENANCE" | "CONDEMNED";
  assignedTo: string | null;
  assignedBadge: string | null;
  issuedDate: string | null;
  expectedReturn: string | null;
  condition: "SERVICEABLE" | "UNDER_REPAIR" | "UNSERVICEABLE";
  maintenanceNote?: string;
}

export interface IssuanceRecord {
  id: string;
  weaponId: string;
  action: "ISSUED" | "RETURNED";
  officer: string;
  badge: string;
  purpose: string;
  ammunition: string;
  verifiedBy: string;
  timestamp: string;
}

// Mock data
const MOCK_WEAPONS: Weapon[] = [
  {
    id: "wpn-001",
    weaponId: "WPN-KOR-001",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78542",
    status: "ISSUED",
    assignedTo: "SI Suresh",
    assignedBadge: "KAR-SI-1234",
    issuedDate: "2024-01-15",
    expectedReturn: "2024-01-15",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-002",
    weaponId: "WPN-KOR-002",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78543",
    status: "ISSUED",
    assignedTo: "ASI Prakash",
    assignedBadge: "KAR-ASI-2345",
    issuedDate: "2024-01-16",
    expectedReturn: "2024-01-16",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-003",
    weaponId: "WPN-KOR-003",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78544",
    status: "IN_ARMOURY",
    assignedTo: null,
    assignedBadge: null,
    issuedDate: null,
    expectedReturn: null,
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-004",
    weaponId: "WPN-KOR-004",
    type: ".303 Rifle",
    make: "INSAS",
    serialNumber: "INS-2015-45612",
    status: "ISSUED",
    assignedTo: "Const. Kumar",
    assignedBadge: "KAR-C-4567",
    issuedDate: "2024-01-18",
    expectedReturn: "2024-01-18",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-005",
    weaponId: "WPN-KOR-005",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78545",
    status: "MAINTENANCE",
    assignedTo: null,
    assignedBadge: null,
    issuedDate: null,
    expectedReturn: null,
    condition: "UNDER_REPAIR",
    maintenanceNote: "Trigger mechanism repair",
  },
];

const MOCK_ISSUANCE_RECORDS: IssuanceRecord[] = [
  {
    id: "iss-001",
    weaponId: "WPN-KOR-001",
    action: "ISSUED",
    officer: "SI Suresh",
    badge: "KAR-SI-1234",
    purpose: "Patrol Duty",
    ammunition: "15 rounds",
    verifiedBy: "HC Mohan (Biometric)",
    timestamp: "2024-01-15T08:00:00Z",
  },
  {
    id: "iss-002",
    weaponId: "WPN-KOR-002",
    action: "ISSUED",
    officer: "ASI Prakash",
    badge: "KAR-ASI-2345",
    purpose: "Investigation",
    ammunition: "15 rounds",
    verifiedBy: "HC Mohan (Biometric)",
    timestamp: "2024-01-16T08:15:00Z",
  },
  {
    id: "iss-003",
    weaponId: "WPN-KOR-004",
    action: "ISSUED",
    officer: "Const. Kumar",
    badge: "KAR-C-4567",
    purpose: "VIP Security",
    ammunition: "20 rounds",
    verifiedBy: "HC Mohan (Biometric)",
    timestamp: "2024-01-18T09:00:00Z",
  },
];

interface ArmouryFilters {
  type?: string;
  status?: Weapon["status"];
  search?: string;
}

interface ArmouryState {
  weapons: Weapon[];
  issuanceRecords: IssuanceRecord[];
  selectedWeapon: Weapon | null;
  filters: ArmouryFilters;
  isLoading: boolean;

  loadWeapons: () => Promise<void>;
  setSelectedWeapon: (weapon: Weapon | null) => void;
  setFilters: (filters: ArmouryFilters) => void;
  createWeapon: (data: Omit<Weapon, "id">) => Promise<Weapon>;
  updateWeapon: (id: string, updates: Partial<Weapon>) => Promise<void>;
  deleteWeapon: (id: string) => Promise<void>;
  issueWeapon: (weaponId: string, officer: string, badge: string, purpose: string, ammunition: string) => Promise<void>;
  returnWeapon: (weaponId: string, officer: string, badge: string) => Promise<void>;
  getFilteredWeapons: () => Weapon[];
  getAvailableWeapons: () => Weapon[];
}

export const useArmouryStore = create<ArmouryState>()(
  persist(
    (set, get) => ({
      weapons: MOCK_WEAPONS,
      issuanceRecords: MOCK_ISSUANCE_RECORDS,
      selectedWeapon: null,
      filters: {},
      isLoading: false,

      loadWeapons: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedWeapon: (weapon) => set({ selectedWeapon: weapon }),

      setFilters: (filters) => set({ filters }),

      createWeapon: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newWeapon: Weapon = {
          ...data,
          id: `wpn-${Date.now()}`,
        };

        set((state) => ({
          weapons: [newWeapon, ...state.weapons],
          isLoading: false,
        }));

        return newWeapon;
      },

      updateWeapon: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          weapons: state.weapons.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
          selectedWeapon:
            state.selectedWeapon?.id === id
              ? { ...state.selectedWeapon, ...updates }
              : state.selectedWeapon,
          isLoading: false,
        }));
      },

      deleteWeapon: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          weapons: state.weapons.filter((w) => w.id !== id),
          selectedWeapon: state.selectedWeapon?.id === id ? null : state.selectedWeapon,
          isLoading: false,
        }));
      },

      issueWeapon: async (weaponId, officer, badge, purpose, ammunition) => {
        const weapon = get().weapons.find((w) => w.weaponId === weaponId || w.id === weaponId);
        if (!weapon) return;

        const record: IssuanceRecord = {
          id: `iss-${Date.now()}`,
          weaponId: weapon.weaponId,
          action: "ISSUED",
          officer,
          badge,
          purpose,
          ammunition,
          verifiedBy: "System (Biometric)",
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          weapons: state.weapons.map((w) =>
            w.id === weapon.id
              ? {
                  ...w,
                  status: "ISSUED" as const,
                  assignedTo: officer,
                  assignedBadge: badge,
                  issuedDate: new Date().toISOString().split("T")[0],
                  expectedReturn: new Date().toISOString().split("T")[0],
                }
              : w
          ),
          issuanceRecords: [record, ...state.issuanceRecords],
        }));
      },

      returnWeapon: async (weaponId, officer, badge) => {
        const weapon = get().weapons.find((w) => w.weaponId === weaponId || w.id === weaponId);
        if (!weapon) return;

        const record: IssuanceRecord = {
          id: `iss-${Date.now()}`,
          weaponId: weapon.weaponId,
          action: "RETURNED",
          officer,
          badge,
          purpose: "-",
          ammunition: "Returned",
          verifiedBy: "System (Biometric)",
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          weapons: state.weapons.map((w) =>
            w.id === weapon.id
              ? {
                  ...w,
                  status: "IN_ARMOURY" as const,
                  assignedTo: null,
                  assignedBadge: null,
                  issuedDate: null,
                  expectedReturn: null,
                }
              : w
          ),
          issuanceRecords: [record, ...state.issuanceRecords],
        }));
      },

      getFilteredWeapons: () => {
        const { weapons, filters } = get();

        return weapons.filter((w) => {
          if (filters.type && w.type !== filters.type) return false;
          if (filters.status && w.status !== filters.status) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              w.weaponId.toLowerCase().includes(search) ||
              w.serialNumber.toLowerCase().includes(search) ||
              w.assignedTo?.toLowerCase().includes(search) ||
              false;
            if (!matchesSearch) return false;
          }
          return true;
        });
      },

      getAvailableWeapons: () => {
        return get().weapons.filter((w) => w.status === "IN_ARMOURY");
      },
    }),
    {
      name: "npdms-armoury-storage",
      partialize: (state) => ({ weapons: state.weapons, issuanceRecords: state.issuanceRecords }),
    }
  )
);
