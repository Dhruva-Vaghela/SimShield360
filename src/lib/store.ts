import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayerState } from "./mock-data";

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
