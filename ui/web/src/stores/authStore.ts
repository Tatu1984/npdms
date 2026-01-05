"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role, SyncState } from "@/types";
import { authApi, apiClient } from "@/lib/api";

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

// Demo users for different roles - Complete hierarchy
const DEMO_USERS: Record<string, User> = {
  // Station Level - Constables
  constable: {
    id: "user-001",
    name: "Ramesh Kumar",
    badgeNumber: "KAR-C-4567",
    role: "CONSTABLE",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  hc: {
    id: "user-002",
    name: "Mohan Singh",
    badgeNumber: "KAR-HC-3456",
    role: "HEAD_CONSTABLE",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  // Station Level - Sub-Inspectors
  asi: {
    id: "user-003",
    name: "Prakash Rao",
    badgeNumber: "KAR-ASI-2345",
    role: "ASI",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  si: {
    id: "user-004",
    name: "Suresh Patil",
    badgeNumber: "KAR-SI-1234",
    role: "SI",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  inspector: {
    id: "user-005",
    name: "Anand Reddy",
    badgeNumber: "KAR-INS-0987",
    role: "INSPECTOR",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  // Station Level - SHO
  sho: {
    id: "user-006",
    name: "Insp. Sharma",
    badgeNumber: "KAR-SHO-0876",
    role: "SHO",
    stationId: "station-001",
    stationName: "Koramangala PS",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  // District Level
  dsp: {
    id: "user-007",
    name: "DSP Venkatesh",
    badgeNumber: "KAR-DSP-0567",
    role: "DSP",
    stationId: "district-hq",
    stationName: "District HQ - South Division",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  sp: {
    id: "user-008",
    name: "SP Ramachandran",
    badgeNumber: "KAR-SP-0089",
    role: "SP",
    stationId: "district-hq",
    stationName: "District HQ",
    districtId: "district-001",
    districtName: "Bengaluru Urban",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  // State Level
  dig: {
    id: "user-009",
    name: "DIG Chandrashekar",
    badgeNumber: "KAR-DIG-0045",
    role: "DIG",
    stationId: "state-hq",
    stationName: "State HQ - South Zone",
    districtId: "zone-south",
    districtName: "South Zone",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  ig: {
    id: "user-010",
    name: "IG Nagaraj",
    badgeNumber: "KAR-IG-0023",
    role: "IG",
    stationId: "state-hq",
    stationName: "State HQ",
    districtId: "state-hq",
    districtName: "Karnataka State",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  dgp: {
    id: "user-011",
    name: "DGP Praveen Sood",
    badgeNumber: "KAR-DGP-0001",
    role: "DGP",
    stationId: "state-hq",
    stationName: "State HQ",
    districtId: "state-hq",
    districtName: "Karnataka State",
    stateId: "state-001",
    stateName: "Karnataka",
  },
  // Central Level - Home Ministry
  secretary: {
    id: "user-012",
    name: "Joint Secretary Verma",
    badgeNumber: "MHA-JS-0001",
    role: "ADMIN",
    stationId: "central-hq",
    stationName: "Ministry of Home Affairs",
    districtId: "central",
    districtName: "Central Government",
    stateId: "central",
    stateName: "India",
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  syncState: SyncState;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setSyncStatus: (status: SyncState["status"]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      syncState: {
        status: "ONLINE",
        lastSyncTime: new Date().toISOString(),
        pendingChanges: 0,
      },

      login: async (username: string, password: string) => {
        if (USE_REAL_API) {
          try {
            const response = await authApi.login(username, password);
            const apiUser = response.user;
            // Map API user to local User type
            const user: User = {
              id: apiUser.id,
              name: apiUser.name,
              badgeNumber: apiUser.badgeNumber,
              role: apiUser.role as Role,
              stationId: apiUser.stationId,
              stationName: apiUser.stationName,
              districtId: 'district-001', // TODO: Get from API
              districtName: 'Bengaluru Urban',
              stateId: 'state-001',
              stateName: 'Karnataka',
            };
            set({
              user,
              isAuthenticated: true,
              syncState: {
                status: "ONLINE",
                lastSyncTime: new Date().toISOString(),
                pendingChanges: 0,
              },
            });
            return true;
          } catch (error) {
            console.error('Login failed:', error);
            return false;
          }
        }

        // Demo mode fallback
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const demoUser = DEMO_USERS[username.toLowerCase()];
        if (demoUser && password === "demo123") {
          set({
            user: demoUser,
            isAuthenticated: true,
            syncState: {
              status: "ONLINE",
              lastSyncTime: new Date().toISOString(),
              pendingChanges: 0,
            },
          });
          return true;
        }
        return false;
      },

      logout: async () => {
        if (USE_REAL_API) {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        apiClient.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setSyncStatus: (status: SyncState["status"]) => {
        set((state) => ({
          syncState: {
            ...state.syncState,
            status,
            lastSyncTime:
              status === "ONLINE" ? new Date().toISOString() : state.syncState.lastSyncTime,
          },
        }));
      },
    }),
    {
      name: "npdms-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Role hierarchy helpers
export const ROLE_HIERARCHY: Record<Role, number> = {
  CONSTABLE: 1,
  HEAD_CONSTABLE: 2,
  ASI: 3,
  SI: 4,
  INSPECTOR: 5,
  SHO: 6,
  DSP: 7,
  SP: 8,
  DIG: 9,
  IG: 10,
  DGP: 11,
  ADMIN: 12,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    CONSTABLE: "Constable",
    HEAD_CONSTABLE: "Head Constable",
    ASI: "Assistant Sub-Inspector",
    SI: "Sub-Inspector",
    INSPECTOR: "Inspector",
    SHO: "Station House Officer",
    DSP: "Deputy Superintendent",
    SP: "Superintendent of Police",
    DIG: "Deputy Inspector General",
    IG: "Inspector General",
    DGP: "Director General of Police",
    ADMIN: "System Administrator",
  };
  return names[role];
}
