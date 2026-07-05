import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayerState, SimRequest, TimelineEvent } from "./mock-data";
import { mockRequests, mockTimeline } from "./mock-data";

interface SimLockState {
  locked: boolean;
  blockedCount: number;
  setLocked: (v: boolean) => void;
  incrementBlocked: () => void;
}

export const useSimLock = create<SimLockState>()(
  persist(
    (set) => ({
      locked: true,
      blockedCount: 14,
      setLocked: (v) => set({ locked: v }),
      incrementBlocked: () => set((s) => ({ blockedCount: s.blockedCount + 1 })),
    }),
    { name: "simshield-lock" }
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
      requests: [...mockRequests],
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
      events: [...mockTimeline],
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

