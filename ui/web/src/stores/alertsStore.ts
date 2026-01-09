"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Alert {
  id: string;
  type: "FLASH" | "URGENT" | "BOLO" | "NOTICE";
  scope: "STATION" | "DISTRICT" | "STATE" | "NATIONAL";
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  issuedBy: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  priority: number;
  image?: boolean;
  imageUrl?: string;
}

// Mock data
const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-001",
    type: "FLASH",
    scope: "DISTRICT",
    title: "Armed suspects spotted near MG Road",
    description:
      "Two armed suspects spotted near MG Road Metro Station. Wearing dark clothes, one has red motorcycle. Approach with caution.",
    issuedAt: "2024-01-18T14:30:00Z",
    expiresAt: "2024-01-18T20:30:00Z",
    issuedBy: "Control Room",
    acknowledged: false,
    priority: 1,
  },
  {
    id: "alert-002",
    type: "URGENT",
    scope: "STATION",
    title: "VIP movement - Route diversion required",
    description:
      "Governor convoy movement expected on 80 Feet Road between 15:00-16:00 hours. Traffic diversion and security arrangements required.",
    issuedAt: "2024-01-18T12:00:00Z",
    expiresAt: "2024-01-18T16:00:00Z",
    issuedBy: "SP Office",
    acknowledged: true,
    acknowledgedBy: "SHO Koramangala",
    acknowledgedAt: "2024-01-18T12:15:00Z",
    priority: 2,
  },
  {
    id: "alert-003",
    type: "BOLO",
    scope: "STATE",
    title: "BOLO: Wanted suspect in murder case",
    description:
      'Rajan Kumar alias Raju, 32M, wanted in connection with murder case CC/2024/0045. Height: 5\'8", Dark complexion, Scar on left cheek. Last seen in Jayanagar area.',
    issuedAt: "2024-01-17T08:00:00Z",
    expiresAt: "2024-01-24T23:59:59Z",
    issuedBy: "State Crime Branch",
    acknowledged: true,
    image: true,
    priority: 1,
  },
  {
    id: "alert-004",
    type: "NOTICE",
    scope: "STATION",
    title: "Weekly review meeting at 10:00 AM",
    description:
      "All officers to attend weekly review meeting at station conference room. Bring case update reports.",
    issuedAt: "2024-01-18T08:00:00Z",
    expiresAt: "2024-01-19T10:00:00Z",
    issuedBy: "SHO Office",
    acknowledged: true,
    priority: 3,
  },
  {
    id: "alert-005",
    type: "FLASH",
    scope: "NATIONAL",
    title: "Terror threat advisory - High alert",
    description:
      "General high alert issued in view of Republic Day celebrations. Enhanced security measures to be implemented at all sensitive locations.",
    issuedAt: "2024-01-16T00:00:00Z",
    expiresAt: "2024-01-27T23:59:59Z",
    issuedBy: "MHA - Intelligence Bureau",
    acknowledged: true,
    priority: 1,
  },
];

interface AlertFilters {
  type?: Alert["type"];
  search?: string;
}

interface AlertsState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  filters: AlertFilters;
  isLoading: boolean;

  loadAlerts: () => Promise<void>;
  setSelectedAlert: (alert: Alert | null) => void;
  setFilters: (filters: AlertFilters) => void;
  createAlert: (data: Omit<Alert, "id" | "issuedAt" | "acknowledged">) => Promise<Alert>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string, acknowledgedBy: string) => Promise<void>;
  getFilteredAlerts: () => Alert[];
  getActiveAlerts: () => Alert[];
  getUnacknowledgedAlerts: () => Alert[];
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: MOCK_ALERTS,
      selectedAlert: null,
      filters: {},
      isLoading: false,

      loadAlerts: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedAlert: (alert) => set({ selectedAlert: alert }),

      setFilters: (filters) => set({ filters }),

      createAlert: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newAlert: Alert = {
          ...data,
          id: `alert-${Date.now()}`,
          issuedAt: new Date().toISOString(),
          acknowledged: false,
        };

        set((state) => ({
          alerts: [newAlert, ...state.alerts],
          isLoading: false,
        }));

        return newAlert;
      },

      updateAlert: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          selectedAlert:
            state.selectedAlert?.id === id
              ? { ...state.selectedAlert, ...updates }
              : state.selectedAlert,
          isLoading: false,
        }));
      },

      deleteAlert: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
          selectedAlert: state.selectedAlert?.id === id ? null : state.selectedAlert,
          isLoading: false,
        }));
      },

      acknowledgeAlert: async (id, acknowledgedBy) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  acknowledged: true,
                  acknowledgedBy,
                  acknowledgedAt: new Date().toISOString(),
                }
              : a
          ),
        }));
      },

      getFilteredAlerts: () => {
        const { alerts, filters } = get();

        return alerts.filter((a) => {
          if (filters.type && a.type !== filters.type) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              a.title.toLowerCase().includes(search) ||
              a.description.toLowerCase().includes(search);
            if (!matchesSearch) return false;
          }
          return true;
        });
      },

      getActiveAlerts: () => {
        const { alerts } = get();
        return alerts.filter((a) => new Date(a.expiresAt) > new Date());
      },

      getUnacknowledgedAlerts: () => {
        const { alerts } = get();
        return alerts.filter(
          (a) => !a.acknowledged && new Date(a.expiresAt) > new Date()
        );
      },
    }),
    {
      name: "npdms-alerts-storage",
      partialize: (state) => ({ alerts: state.alerts }),
    }
  )
);
