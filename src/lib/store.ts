import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayerState, SimRequest, TimelineEvent } from "./mock-data";
import { getBackendUrl } from "./api";

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
  addRequest: (req: SimRequest) => void | Promise<void>;
  updateRequestStatus: (id: string, status: SimRequest["status"]) => void | Promise<void>;
  clearRequests: () => void;
}

export const useRequests = create<RequestsState>()((set) => ({
  requests: [],
  addRequest: async (req) => {
    set((s) => ({ requests: [req, ...s.requests] }));
    try {
      const url = getBackendUrl();
      await fetch(`${url}/simulator/attacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: req.id,
          targetCustomer: req.customerName,
          customerNumber: req.phone,
          attackType: req.type === "SIM Swap" ? "sim_swap" : req.type === "eSIM Transfer" ? "esim_transfer" : req.type === "Port-Out" ? "port_out" : "sim_replacement",
          location: req.location,
          device: req.deviceChanged ? "kali" : "Rahul's iPhone",
          network: "carrier",
          fakeDocuments: false,
          multipleAttempts: req.recentSimChanges > 0,
          riskScore: req.riskScore,
        })
      });
    } catch (e) {
      console.warn("Could not save new request to backend database:", e);
    }
  },
  updateRequestStatus: async (id, status) => {
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
    }));

    let backendStatus = "started";
    if (status === "approved") backendStatus = "succeeded";
    else if (status === "rejected") backendStatus = "rejected";
    else if (status === "blocked") backendStatus = "blocked";
    else if (status === "under-review") backendStatus = "waiting";

    try {
      const url = getBackendUrl();
      await fetch(`${url}/simulator/attacks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus })
      });
    } catch (e) {
      console.warn("Could not sync request status to backend database:", e);
    }
  },
  clearRequests: () => set({ requests: [] }),
}));

interface TimelineState {
  events: TimelineEvent[];
  addEvent: (ev: Omit<TimelineEvent, "id">) => void | Promise<void>;
  clearEvents: () => void;
}

export const useTimeline = create<TimelineState>()((set) => ({
  events: [],
  addEvent: async (ev) => {
    set((s) => ({
      events: [
        { id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...ev },
        ...s.events,
      ],
    }));

    const reqIdMatch = ev.meta?.match(/REQ-\d+/);
    const reqId = reqIdMatch ? reqIdMatch[0] : null;

    if (reqId) {
      try {
        const url = getBackendUrl();
        const logType = ev.kind.includes("success") ? "success" : ev.kind.includes("failed") || ev.kind.includes("blocked") ? "error" : "info";
        await fetch(`${url}/simulator/attacks/${reqId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logMessage: ev.message,
            logType: logType
          })
        });
      } catch (e) {
        console.warn("Could not sync timeline event to backend database:", e);
      }
    }
  },
  clearEvents: () => set({ events: [] }),
}));

