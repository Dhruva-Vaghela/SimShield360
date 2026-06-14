import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { mockTimeline } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Shield, ShieldOff, Plus, Trash2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/customer/timeline")({
  component: Timeline,
});

const ICONS = {
  "lock-enabled": Shield, "lock-disabled": ShieldOff, "unlock-failed": XCircle,
  "unlock-success": CheckCircle2, "request-blocked": ShieldAlert,
  "device-added": Plus, "device-removed": Trash2,
};

const TONES: Record<string, string> = {
  "lock-enabled": "text-success bg-success/10",
  "lock-disabled": "text-warning bg-warning/10",
  "unlock-failed": "text-destructive bg-destructive/10",
  "unlock-success": "text-success bg-success/10",
  "request-blocked": "text-primary bg-primary/10",
  "device-added": "text-accent bg-accent/10",
  "device-removed": "text-muted-foreground bg-muted/30",
};

function Timeline() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Security Timeline</div>
        <h1 className="text-3xl font-display font-bold mt-1">Everything that happened</h1>
      </div>
      <Card className="p-6 glass">
        <ol className="relative border-l border-border/60 ml-3 space-y-6">
          {mockTimeline.map((ev, i) => {
            const Icon = ICONS[ev.kind];
            return (
              <motion.li key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="pl-8">
                <span className={`absolute -left-4 size-8 rounded-full grid place-items-center ${TONES[ev.kind]}`}>
                  <Icon className="size-4" />
                </span>
                <div className="font-medium">{ev.message}</div>
                <div className="text-xs text-muted-foreground">{ev.ts} · {ev.meta}</div>
              </motion.li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
