"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role, SyncState } from "@/types";
import { authApi, apiClient } from "@/lib/api";

// Production mode - always use real API authentication
// Demo mode is completely disabled in production builds

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  syncState: SyncState;
  _hasHydrated: boolean;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setSyncStatus: (status: SyncState["status"]) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      syncState: {
        status: "ONLINE",
        lastSyncTime: new Date().toISOString(),
        pendingChanges: 0,
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (username: string, password: string) => {
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
            districtId: apiUser.districtId || '',
            districtName: apiUser.districtName || '',
            stateId: apiUser.stateId || '',
            stateName: apiUser.stateName || '',
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
        } catch {
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Logout errors are non-critical, continue with local cleanup
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
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
