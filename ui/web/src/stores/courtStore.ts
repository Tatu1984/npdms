"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CourtHearing {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  courtRoom: string;
  judge: string;
  date: string;
  time: string;
  type: "ARGUMENTS" | "EVIDENCE" | "BAIL_HEARING" | "REMAND_EXTENSION" | "JUDGMENT" | "CHARGESHEET";
  io: string;
  charges: string[];
  requiredDocuments?: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface CourtOrder {
  id: string;
  caseNumber: string;
  orderDate: string;
  orderType: "REMAND" | "BAIL_REJECTED" | "BAIL_GRANTED" | "DIRECTIONS" | "JUDGMENT" | "STAY";
  summary: string;
  court: string;
  judgeName?: string;
}

const MOCK_HEARINGS: CourtHearing[] = [
  {
    id: "hear-001",
    caseNumber: "CASE-2024-00156",
    title: "State vs. Raju Kumar & Others",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 3",
    judge: "Hon. Justice A.K. Sharma",
    date: "2024-02-20",
    time: "10:30 AM",
    type: "ARGUMENTS",
    io: "SI Ramesh Kumar",
    charges: ["IPC 392", "IPC 397"],
    requiredDocuments: ["Chargesheet", "FSL Report", "Witness Statements"],
    priority: "HIGH",
  },
  {
    id: "hear-002",
    caseNumber: "CASE-2024-00150",
    title: "State vs. Vijay Malhotra",
    court: "Magistrate Court, Koramangala",
    courtRoom: "Court Room 1",
    judge: "Hon. Magistrate S.P. Rao",
    date: "2024-02-22",
    time: "11:00 AM",
    type: "BAIL_HEARING",
    io: "SI Priya Sharma",
    charges: ["IPC 304A"],
    priority: "MEDIUM",
  },
  {
    id: "hear-003",
    caseNumber: "CASE-2024-00145",
    title: "State vs. Anand Sharma",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 2",
    judge: "Hon. Justice P.S. Reddy",
    date: "2024-02-25",
    time: "02:00 PM",
    type: "EVIDENCE",
    io: "Inspector Venkatesh",
    charges: ["NDPS 20"],
    requiredDocuments: ["FSL Narcotics Report", "Seizure Memo"],
    priority: "HIGH",
  },
  {
    id: "hear-004",
    caseNumber: "CASE-2024-00135",
    title: "State vs. Mohammed Farooq",
    court: "Sessions Court, Koramangala",
    courtRoom: "Court Room 3",
    judge: "Hon. Justice A.K. Sharma",
    date: "2024-02-28",
    time: "10:00 AM",
    type: "REMAND_EXTENSION",
    io: "SI Anjali Desai",
    charges: ["IPC 420", "IPC 406"],
    priority: "LOW",
  },
];

const MOCK_ORDERS: CourtOrder[] = [
  {
    id: "order-001",
    caseNumber: "CASE-2024-00156",
    orderDate: "2024-01-25",
    orderType: "REMAND",
    summary: "Judicial custody extended by 14 days for accused Raju Kumar",
    court: "Sessions Court",
    judgeName: "Hon. Justice A.K. Sharma",
  },
  {
    id: "order-002",
    caseNumber: "CASE-2024-00148",
    orderDate: "2024-01-24",
    orderType: "BAIL_REJECTED",
    summary: "Anticipatory bail rejected for accused Mohammed Farooq",
    court: "Sessions Court",
    judgeName: "Hon. Justice P.S. Reddy",
  },
  {
    id: "order-003",
    caseNumber: "CASE-2024-00150",
    orderDate: "2024-01-22",
    orderType: "DIRECTIONS",
    summary: "IO directed to submit FSL report within 7 days",
    court: "Magistrate Court",
    judgeName: "Hon. Magistrate S.P. Rao",
  },
];

interface CourtState {
  hearings: CourtHearing[];
  orders: CourtOrder[];
  selectedHearing: CourtHearing | null;
  selectedOrder: CourtOrder | null;
  isLoading: boolean;
  selectedDate: string | null;

  loadData: () => Promise<void>;
  setSelectedHearing: (hearing: CourtHearing | null) => void;
  setSelectedOrder: (order: CourtOrder | null) => void;
  setSelectedDate: (date: string | null) => void;
  createHearing: (data: Omit<CourtHearing, "id">) => Promise<CourtHearing>;
  updateHearing: (id: string, updates: Partial<CourtHearing>) => Promise<void>;
  createOrder: (data: Omit<CourtOrder, "id">) => Promise<CourtOrder>;
  getHearingsForDate: (date: string) => CourtHearing[];
  getTodayHearings: () => CourtHearing[];
  getThisWeekHearings: () => CourtHearing[];
  getStats: () => { todayHearings: number; thisWeekHearings: number; pendingOrders: number; activeCases: number };
}

export const useCourtStore = create<CourtState>()(
  persist(
    (set, get) => ({
      hearings: MOCK_HEARINGS,
      orders: MOCK_ORDERS,
      selectedHearing: null,
      selectedOrder: null,
      isLoading: false,
      selectedDate: null,

      loadData: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ isLoading: false });
      },

      setSelectedHearing: (hearing) => set({ selectedHearing: hearing }),
      setSelectedOrder: (order) => set({ selectedOrder: order }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      createHearing: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newHearing: CourtHearing = {
          ...data,
          id: `hear-${Date.now()}`,
        };

        set((state) => ({
          hearings: [newHearing, ...state.hearings],
          isLoading: false,
        }));

        return newHearing;
      },

      updateHearing: async (id, updates) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          hearings: state.hearings.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
          isLoading: false,
        }));
      },

      createOrder: async (data) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));

        const newOrder: CourtOrder = {
          ...data,
          id: `order-${Date.now()}`,
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          isLoading: false,
        }));

        return newOrder;
      },

      getHearingsForDate: (date) => {
        return get().hearings.filter((h) => h.date === date);
      },

      getTodayHearings: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().hearings.filter((h) => h.date === today);
      },

      getThisWeekHearings: () => {
        const today = new Date();
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return get().hearings.filter((h) => {
          const hearingDate = new Date(h.date);
          return hearingDate >= today && hearingDate <= weekEnd;
        });
      },

      getStats: () => {
        const { hearings, orders } = get();
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        return {
          todayHearings: hearings.filter((h) => h.date === todayStr).length,
          thisWeekHearings: hearings.filter((h) => {
            const d = new Date(h.date);
            return d >= today && d <= weekEnd;
          }).length,
          pendingOrders: orders.length,
          activeCases: 143,
        };
      },
    }),
    {
      name: "npdms-court-storage",
      partialize: (state) => ({ hearings: state.hearings, orders: state.orders }),
    }
  )
);
