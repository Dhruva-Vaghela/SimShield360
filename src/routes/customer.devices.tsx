import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Laptop, Tablet, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { mockDevices } from "@/lib/mock-data";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/customer/devices")({
  component: Devices,
});

const ICONS = { Mobile: Smartphone, Laptop: Laptop, Tablet: Tablet };

function Devices() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Layer 4 · Trusted Device Ring</div>
          <h1 className="text-3xl font-display font-bold mt-1">Trusted Devices</h1>
        </div>
        <Button onClick={() => toast.success("Add-device flow simulated")}><Plus className="size-4 mr-2" /> Add device</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockDevices.map((d, i) => {
          const Icon = ICONS[d.type];
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-6 glass">
                <div className="flex items-start justify-between">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Icon className="size-6" />
                  </div>
                  {d.primary && <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-success/15 text-success">PRIMARY</span>}
                </div>
                <div className="mt-4 font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.model}</div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="glass rounded-md p-2">
                    <div className="text-muted-foreground">Trust score</div>
                    <div className="text-base font-bold text-success">{d.trustScore}</div>
                  </div>
                  <div className="glass rounded-md p-2">
                    <div className="text-muted-foreground">Last active</div>
                    <div className="text-xs flex items-center gap-1 mt-1"><CheckCircle2 className="size-3 text-success" /> {d.lastActive}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.error("Device removed")}><Trash2 className="size-4" /></Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
