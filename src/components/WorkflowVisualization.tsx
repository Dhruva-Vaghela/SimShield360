import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Hourglass } from "lucide-react";
import type { WorkflowLayers } from "@/lib/store";

interface MonitorLayer {
  key: string;
  name: string;
  desc: string;
}

const MONITOR_LAYERS: MonitorLayer[] = [
  { key: "sim-lock", name: "SIM Lock", desc: "Customer hardware-grade lock" },
  { key: "face", name: "Face Verification", desc: "Biometric liveness check" },
  { key: "auth", name: "Google Authenticator", desc: "TOTP authenticator app check" },
  { key: "device", name: "Trusted Device", desc: "Consent from registered device" },
  { key: "telecom", name: "Telecom Intelligence", desc: "Location & IMSI history checks" },
  { key: "risk", name: "Risk Engine", desc: "Composite score assessment" },
];

type NormalizedState = "waiting" | "running" | "passed" | "failed";

const stateStyles: Record<NormalizedState, { ring: string; text: string; bg: string; icon: React.ReactNode; label: string }> = {
  waiting: { 
    ring: "border-border/60", 
    bg: "bg-muted/10",
    text: "text-muted-foreground", 
    icon: <Hourglass className="size-4 text-muted-foreground" />, 
    label: "Waiting" 
  },
  running: { 
    ring: "border-primary/50 animate-pulse ring-1 ring-primary/30", 
    bg: "bg-primary/5",
    text: "text-primary font-semibold", 
    icon: <Loader2 className="size-4 animate-spin text-primary" />, 
    label: "Running" 
  },
  passed: { 
    ring: "border-success/50", 
    bg: "bg-success/5",
    text: "text-success", 
    icon: <CheckCircle2 className="size-4 text-success" />, 
    label: "Passed" 
  },
  failed: { 
    ring: "border-destructive/50", 
    bg: "bg-destructive/5",
    text: "text-destructive", 
    icon: <XCircle className="size-4 text-destructive" />, 
    label: "Failed" 
  },
};

function normalizeState(state: string): NormalizedState {
  if (!state) return "waiting";
  const s = state.toLowerCase();
  if (s === "success" || s === "passed" || s === "approved") return "passed";
  if (s === "failed" || s === "blocked" || s === "rejected" || s === "denied") return "failed";
  if (s === "running" || s === "processing") return "running";
  return "waiting";
}

export function WorkflowVisualization({ layers }: { layers: WorkflowLayers }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {MONITOR_LAYERS.map((layer, idx) => {
          const rawState = layers[layer.key] ?? "pending";
          const state = normalizeState(rawState);
          const s = stateStyles[state];
          
          return (
            <motion.div
              key={layer.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl p-4 border transition-all duration-300 ${s.ring} ${s.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">LAYER {idx + 1}</span>
                <span className={s.text}>{s.icon}</span>
              </div>
              <div className="text-sm font-semibold leading-tight">{layer.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{layer.desc}</div>
              <div className={`mt-3 text-[10px] uppercase tracking-wider font-mono ${s.text}`}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
