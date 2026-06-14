import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ShieldAlert, Loader2 } from "lucide-react";
import { SECURITY_LAYERS } from "@/lib/mock-data";
import type { LayerState } from "@/lib/mock-data";
import type { WorkflowLayers } from "@/lib/store";

const stateStyles: Record<LayerState, { ring: string; text: string; icon: React.ReactNode; label: string }> = {
  pending:  { ring: "ring-muted-foreground/30 bg-muted/30", text: "text-muted-foreground", icon: <Loader2 className="size-4 animate-spin" />, label: "Pending" },
  success:  { ring: "ring-success/60 bg-success/10",        text: "text-success",          icon: <CheckCircle2 className="size-4" />,        label: "Passed"  },
  failed:   { ring: "ring-destructive/60 bg-destructive/10",text: "text-destructive",      icon: <XCircle className="size-4" />,             label: "Failed"  },
  blocked:  { ring: "ring-warning/60 bg-warning/10",        text: "text-warning",          icon: <ShieldAlert className="size-4" />,         label: "Blocked" },
};

export function WorkflowVisualization({ layers }: { layers: WorkflowLayers }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {SECURITY_LAYERS.map((layer, idx) => {
          const state = layers[layer.key] ?? "pending";
          const s = stateStyles[state];
          return (
            <motion.div
              key={layer.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative rounded-xl p-3 ring-1 glass ${s.ring}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">L{layer.id}</span>
                <span className={s.text}>{s.icon}</span>
              </div>
              <div className="text-xs font-semibold leading-tight">{layer.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{layer.desc}</div>
              <div className={`mt-2 text-[10px] uppercase tracking-wider font-mono ${s.text}`}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
