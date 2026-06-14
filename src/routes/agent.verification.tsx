import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockRequests, type SimRequest } from "@/lib/mock-data";
import { useWorkflow } from "@/lib/store";
import { WorkflowVisualization } from "@/components/WorkflowVisualization";
import { RiskGauge } from "@/components/RiskGauge";
import { Shield, MapPin, Smartphone, History, AlertTriangle, Play, RotateCcw, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/verification")({
  component: VerificationCenter,
});

type ScenarioKey = "legit" | "sim-lock" | "face-fail" | "device-timeout" | "geo" | "frozen";
const SCENARIOS: { key: ScenarioKey; label: string; desc: string; result: string }[] = [
  { key: "legit", label: "Legitimate SIM Swap", desc: "Customer-initiated, all layers pass", result: "Approved" },
  { key: "sim-lock", label: "SIM Lock Enabled", desc: "Customer SIM Lock is armed", result: "Instant Block" },
  { key: "face-fail", label: "Face Verification Failure", desc: "Biometric mismatch", result: "Rejected" },
  { key: "device-timeout", label: "Trusted Device Timeout", desc: "No push approval received", result: "Rejected" },
  { key: "geo", label: "Suspicious Location", desc: "Request from outside registered area", result: "High Risk" },
  { key: "frozen", label: "Multiple Failed Attempts", desc: "Account flagged & frozen", result: "Frozen" },
];

function VerificationCenter() {
  const { layers, setLayer, reset, setRunning, running, setDecision, finalDecision } = useWorkflow();
  const [selected, setSelected] = useState<SimRequest>(mockRequests[0]);
  const [riskValue, setRiskValue] = useState(selected.riskScore);

  const runScenario = async (key: ScenarioKey) => {
    reset();
    setRunning(true);
    const score = key === "legit" ? 14 : key === "sim-lock" ? 95 : key === "geo" ? 78 : key === "frozen" ? 99 : 62;
    setRiskValue(score);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    if (key === "sim-lock") {
      setLayer("sim-lock", "blocked"); await wait(700);
      ["face", "auth", "device", "telecom", "risk", "final"].forEach((k) => setLayer(k, "blocked"));
      setDecision("blocked");
      toast.error("BLOCKED at Layer 1 — Customer SIM Lock is armed");
      setRunning(false);
      return;
    }

    setLayer("sim-lock", "success"); await wait(500);

    if (key === "face-fail") {
      setLayer("face", "failed"); await wait(400);
      setDecision("rejected");
      toast.error("Rejected at Layer 2 — Face verification mismatch");
      setRunning(false);
      return;
    }
    setLayer("face", "success"); await wait(400);
    setLayer("auth", "success"); await wait(400);

    if (key === "device-timeout") {
      setLayer("device", "failed"); await wait(400);
      setDecision("rejected");
      toast.error("Rejected at Layer 4 — Trusted device did not approve");
      setRunning(false);
      return;
    }
    setLayer("device", "success"); await wait(400);

    if (key === "geo") {
      setLayer("telecom", "failed"); await wait(400);
      setLayer("risk", "failed"); await wait(400);
      setLayer("final", "failed");
      setDecision("rejected");
      toast.warning("Rejected — Telecom intelligence flagged geo anomaly");
      setRunning(false);
      return;
    }
    if (key === "frozen") {
      setLayer("telecom", "blocked");
      setLayer("risk", "blocked");
      setLayer("final", "blocked");
      setDecision("blocked");
      toast.error("Account frozen — too many failed attempts");
      setRunning(false);
      return;
    }
    setLayer("telecom", "success"); await wait(400);
    setLayer("risk", "success"); await wait(400);
    setLayer("final", "success");
    setDecision("approved");
    toast.success("Request approved through all 7 layers");
    setRunning(false);
  };

  const simLockBlocked = layers["sim-lock"] === "blocked";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Verification Center</div>
          <h1 className="text-3xl font-display font-bold mt-1">Live workflow inspector</h1>
        </div>
        <Button variant="outline" onClick={() => { reset(); setRiskValue(0); }} disabled={running}><RotateCcw className="size-4 mr-2" /> Reset</Button>
      </div>

      {/* Selected request header */}
      <Card className="p-6 glass">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
              <Badge>{selected.type}</Badge>
              <Badge variant="outline">{selected.phone}</Badge>
            </div>
            <div className="text-xl font-semibold mt-2">{selected.customerName}</div>
            <div className="text-sm text-muted-foreground">Request originating from {selected.location} · registered in {selected.registeredLocation}</div>
          </div>
          <select
            className="bg-card border border-border rounded-md px-3 py-2 text-sm"
            value={selected.id}
            onChange={(e) => {
              const r = mockRequests.find((x) => x.id === e.target.value)!;
              setSelected(r); setRiskValue(r.riskScore); reset();
            }}
          >
            {mockRequests.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.customerName}</option>)}
          </select>
        </div>
      </Card>

      {/* SIM Lock blocked banner */}
      <AnimatePresence>
        {simLockBlocked && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-6 border-destructive/40 bg-destructive/10">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-destructive/20 text-destructive grid place-items-center">
                  <ShieldAlert className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-destructive">Customer SIM Lock Enabled</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This customer has armed their SIM Lock firewall. Operator cannot override. The request must be rejected and the customer notified.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => toast.error("Request rejected")}><XCircle className="size-4 mr-1" /> Reject Request</Button>
                    <Button variant="outline" size="sm" onClick={() => toast.message("Customer notified via trusted device")}>Notify Customer</Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">7-Layer Workflow</div>
          <FinalDecision decision={finalDecision} />
        </div>
        <WorkflowVisualization layers={layers} />
      </Card>

      {/* Side panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield className="size-4 text-primary" /> Telecom Intelligence</div>
          <ul className="space-y-3 text-sm">
            <IntelRow icon={MapPin} label="Registered location" value={selected.registeredLocation} />
            <IntelRow icon={MapPin} label="Current location" value={selected.location} flag={selected.location !== selected.registeredLocation} />
            <IntelRow icon={Smartphone} label="Device change" value={selected.deviceChanged ? "Yes" : "No"} flag={selected.deviceChanged} />
            <IntelRow icon={History} label="Recent SIM changes" value={String(selected.recentSimChanges)} flag={selected.recentSimChanges > 0} />
            <IntelRow icon={AlertTriangle} label="Port-out history" value={selected.recentSimChanges > 1 ? "Frequent" : "None"} flag={selected.recentSimChanges > 1} />
          </ul>
        </Card>

        <Card className="p-6 glass flex flex-col items-center justify-center">
          <div className="text-sm font-semibold mb-3">Risk Engine</div>
          <RiskGauge score={riskValue} />
          <div className="text-xs text-muted-foreground mt-3">Composite score (0–100)</div>
        </Card>

        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4">Demo Scenarios</div>
          <div className="grid gap-2">
            {SCENARIOS.map((s) => (
              <button key={s.key} disabled={running} onClick={() => runScenario(s.key)}
                className="text-left rounded-lg p-3 glass hover:neon-border transition disabled:opacity-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{s.label}</div>
                  <span className="text-[10px] font-mono text-primary">{s.result}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function IntelRow({ icon: Icon, label, value, flag }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; flag?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" /> {label}</span>
      <span className={`text-sm font-medium ${flag ? "text-warning" : ""}`}>{value} {flag && <span className="text-[10px] ml-1">⚠</span>}</span>
    </li>
  );
}

function FinalDecision({ decision }: { decision: ReturnType<typeof useWorkflow.getState>["finalDecision"] }) {
  if (decision === "pending") return <Badge className="bg-muted text-muted-foreground"><Play className="size-3 mr-1" /> Awaiting</Badge>;
  if (decision === "approved") return <Badge className="bg-success/20 text-success"><CheckCircle2 className="size-3 mr-1" /> APPROVED</Badge>;
  if (decision === "rejected") return <Badge className="bg-destructive/20 text-destructive"><XCircle className="size-3 mr-1" /> REJECTED</Badge>;
  return <Badge className="bg-primary/20 text-primary"><ShieldAlert className="size-3 mr-1" /> BLOCKED</Badge>;
}
