import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Laptop, Tablet, Plus, Trash2, CheckCircle2, ShieldAlert, Check, X } from "lucide-react";
import { mockDevices } from "@/lib/mock-data";
import { useRequests, useTimeline } from "@/lib/store";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/customer/devices")({
  component: Devices,
});

const ICONS = { Mobile: Smartphone, Laptop: Laptop, Tablet: Tablet };

function Devices() {
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const activeRequests = requests.filter((r) => r.status === "pending" || r.status === "under-review");

  const handleApprove = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${type} Approved via Primary Trusted Device`,
      meta: `${reqId} · Trusted Device ring`,
    });
    toast.success(`Request ${reqId} approved successfully`);
  };

  const handleReject = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${type} Rejected via Primary Trusted Device`,
      meta: `${reqId} · Access revoked`,
    });
    toast.error(`Request ${reqId} rejected`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Layer 4 · Trusted Device Ring</div>
          <h1 className="text-3xl font-display font-bold mt-1">Trusted Devices</h1>
        </div>
        <Button onClick={() => toast.success("Add-device flow simulated")}><Plus className="size-4 mr-2" /> Add device</Button>
      </div>

      {/* Pending Consent Card for Attacks/Requests */}
      <AnimatePresence>
        {activeRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="text-sm font-semibold flex items-center gap-1.5 text-warning animate-pulse">
              <ShieldAlert className="size-4" /> Incoming Authorization Requests
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {activeRequests.map((r) => (
                <Card key={r.id} className="p-5 border-warning/40 bg-warning/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-warning/15 text-warning font-bold">
                        Approve / Reject Action Required
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mt-2">{r.type}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target Number: {r.phone} · Location: {r.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested By: {r.customerName}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(r.id, r.type)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="size-4 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(r.id, r.type)}
                      className="bg-success hover:bg-success/80 text-white font-medium"
                    >
                      <Check className="size-4 mr-1" /> Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
