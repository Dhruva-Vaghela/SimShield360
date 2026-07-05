import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayerState, SimRequest, TimelineEvent } from "./mock-data";

interface SimLockState {
  locks: Record<string, { locked: boolean; blockedCount: number }>;
  setLocked: (customerId: string, locked: boolean) => void;
  incrementBlocked: (customerId: string) => void;
  getLockState: (customerId: string) => { locked: boolean; blockedCount: number };
}

export const useSimLock = create<SimLockState>()(
  persist(
    (set, get) => ({
      locks: {},
      setLocked: (customerId, locked) =>
        set((s) => ({
          locks: {
            ...s.locks,
            [customerId]: {
              locked,
              blockedCount: s.locks[customerId]?.blockedCount ?? 0,
            },
          },
        })),
      incrementBlocked: (customerId) =>
        set((s) => ({
          locks: {
            ...s.locks,
            [customerId]: {
              locked: s.locks[customerId]?.locked ?? true,
              blockedCount: (s.locks[customerId]?.blockedCount ?? 0) + 1,
            },
          },
        })),
      getLockState: (customerId) => {
        return get().locks[customerId] || { locked: false, blockedCount: 0 };
      },
    }),
    { name: "simshield-lock-v2" }
  )
);

export type WorkflowLayers = Record<string, LayerState>;

interface WorkflowState {
  layers: WorkflowLayers;
  running: boolean;
  finalDecision: "pending" | "approved" | "rejected" | "blocked";
  setLayer: (key: string, state: LayerState) => void;
  reset: () => void;
  setRunning: (v: boolean) => void;
  setDecision: (d: WorkflowState["finalDecision"]) => void;
}

const initialLayers: WorkflowLayers = {
  "sim-lock": "pending",
  face: "pending",
  auth: "pending",
  device: "pending",
  telecom: "pending",
  risk: "pending",
  final: "pending",
};

export const useWorkflow = create<WorkflowState>((set) => ({
  layers: { ...initialLayers },
  running: false,
  finalDecision: "pending",
  setLayer: (key, state) => set((s) => ({ layers: { ...s.layers, [key]: state } })),
  reset: () => set({ layers: { ...initialLayers }, running: false, finalDecision: "pending" }),
  setRunning: (v) => set({ running: v }),
  setDecision: (d) => set({ finalDecision: d }),
}));

interface RequestsState {
  requests: SimRequest[];
  addRequest: (req: SimRequest) => void;
  updateRequestStatus: (id: string, status: SimRequest["status"]) => void;
  clearRequests: () => void;
}

export const useRequests = create<RequestsState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (req) => set((s) => ({ requests: [req, ...s.requests] })),
      updateRequestStatus: (id, status) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
        })),
      clearRequests: () => set({ requests: [] }),
    }),
    { name: "simshield-requests-store" }
  )
);

interface TimelineState {
  events: TimelineEvent[];
  addEvent: (ev: Omit<TimelineEvent, "id">) => void;
  clearEvents: () => void;
}

export const useTimeline = create<TimelineState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (ev) =>
        set((s) => ({
          events: [
            { id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...ev },
            ...s.events,
          ],
        })),
      clearEvents: () => set({ events: [] }),
    }),
    { name: "simshield-timeline-store" }
  )
);

