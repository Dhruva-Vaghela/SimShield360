import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRequests, useTimeline, useWorkflow } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getBackendUrl } from "@/lib/api";
import { WorkflowVisualization } from "@/components/WorkflowVisualization";
import { RiskGauge } from "@/components/RiskGauge";
import { Shield, MapPin, Smartphone, History, AlertTriangle, Play, RotateCcw, CheckCircle2, XCircle, ShieldAlert, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { type SimRequest } from "@/lib/mock-data";

export const Route = createFileRoute("/agent/verification")({
  validateSearch: (search: Record<string, unknown>): { reqId?: string } => {
    return {
      reqId: search.reqId as string | undefined,
    };
  },
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
  const { reqId } = Route.useSearch();
  const navigate = useNavigate();
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const { layers, setLayer, reset, setRunning, running, setDecision, finalDecision } = useWorkflow();

  // Find selected request, default to first request if none matches reqId
  const [selected, setSelected] = useState<SimRequest>(() => {
    if (reqId) {
      const match = requests.find((r) => r.id === reqId);
      if (match) return match;
    }
    return requests[0];
  });

  const [riskValue, setRiskValue] = useState(selected.riskScore);

  useEffect(() => {
    if (reqId) {
      const match = requests.find((r) => r.id === reqId);
      if (match) {
        setSelected(match);
        setRiskValue(match.riskScore);
        reset();
      }
    }
  }, [reqId, requests]);

  // Fetch real database workflow layers if the request is a backend swap request (24-char hex ID)
  useEffect(() => {
    if (!selected?.id) return;
    
    const isBackendSwapId = /^[0-9a-fA-F]{24}$/.test(selected.id);
    if (!isBackendSwapId) return;

    const fetchWorkflowStatus = async () => {
      try {
        const url = getBackendUrl();
        const token = useAuth.getState().user?.token;
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${url}/swap-requests/${selected.id}/workflow`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            reset();
            
            // Map layerResults array to visualizer
            const layerKeyMap: Record<number, string> = {
              1: "sim-lock",
              2: "face",
              3: "auth",
              4: "device",
              5: "telecom",
              6: "risk",
              7: "final"
            };

            (data.layerResults || []).forEach((lr: any) => {
              const key = layerKeyMap[lr.layer];
              if (key) {
                let state: "success" | "failed" | "blocked" = lr.passed ? "success" : "failed";
                if (!lr.passed && lr.layer === 1) {
                  state = "blocked";
                }
                setLayer(key, state);
              }
            });

            // Set final decision
            if (data.finalDecision) {
              setDecision(data.finalDecision);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live workflow status from backend:", err);
      }
    };

    fetchWorkflowStatus();
  }, [selected?.id]);

  const runScenario = async (key: ScenarioKey) => {
    reset();
    setRunning(true);
    const score = key === "legit" ? 14 : key === "sim-lock" ? 95 : key === "geo" ? 78 : key === "frozen" ? 99 : 62;
    setRiskValue(score);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    if (key === "sim-lock") {
      setLayer("sim-lock", "blocked"); await wait(600);
      ["face", "auth", "device", "telecom", "risk"].forEach((k) => setLayer(k, "blocked"));
      setDecision("blocked");
      updateRequestStatus(selected.id, "blocked");
      toast.error("BLOCKED at Layer 1 — Customer SIM Lock is armed");
      setRunning(false);
      return;
    }

    setLayer("sim-lock", "success"); await wait(400);

    if (key === "face-fail") {
      setLayer("face", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      toast.error("Rejected at Layer 2 — Face verification mismatch");
      setRunning(false);
      return;
    }
    setLayer("face", "success"); await wait(400);
    setLayer("auth", "success"); await wait(400);

    if (key === "device-timeout") {
      setLayer("device", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      toast.error("Rejected at Layer 4 — Trusted device did not approve");
      setRunning(false);
      return;
    }
    setLayer("device", "success"); await wait(400);

    if (key === "geo") {
      setLayer("telecom", "failed"); await wait(400);
      setLayer("risk", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      toast.warning("Rejected — Telecom intelligence flagged geo anomaly");
      setRunning(false);
      return;
    }
    if (key === "frozen") {
      setLayer("telecom", "blocked");
      setLayer("risk", "blocked");
      setDecision("blocked");
      updateRequestStatus(selected.id, "blocked");
      toast.error("Account frozen — too many failed attempts");
      setRunning(false);
      return;
    }
    setLayer("telecom", "success"); await wait(400);
    setLayer("risk", "success"); await wait(400);
    setDecision("approved");
    updateRequestStatus(selected.id, "approved");
    toast.success("Request approved through all layers");
    setRunning(false);
  };

  const handleApprove = () => {
    updateRequestStatus(selected.id, "approved");
    setDecision("approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${selected.type} approved by operator desk`,
      meta: `${selected.id} · Manual Override`,
    });
    toast.success(`Request ${selected.id} approved successfully`);
  };

  const handleReject = () => {
    updateRequestStatus(selected.id, "rejected");
    setDecision("rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${selected.type} rejected by operator desk`,
      meta: `${selected.id} · Manually blocked`,
    });
    toast.error(`Request ${selected.id} rejected`);
  };

  const simLockBlocked = selected.status === "blocked" || layers["sim-lock"] === "blocked";

  // AI Recommendation engine text
  const getAIRecommendation = () => {
    if (selected.status === "blocked") {
      return "AI Verdict: AUTO-DENY. SIM Lock Firewall is armed. Reject action is mandatory.";
    }
    if (selected.riskScore >= 70) {
      return "AI Verdict: HIGH RISK. Detected location mismatch and device signature changes. Suggest manual voice validation prior to authorization.";
    }
    if (selected.riskScore >= 30) {
      return "AI Verdict: MEDIUM RISK. Minor geo-discrepancy detected. Authenticator checks passed successfully.";
    }
    return "AI Verdict: LOW RISK. Perfect trust markers. Clean hardware fingerprint. Auto-approve recommended.";
  };

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
              <Badge variant="secondary" className="font-mono text-xs uppercase">{selected.status}</Badge>
            </div>
            <div className="text-xl font-semibold mt-2">{selected.customerName}</div>
            <div className="text-sm text-muted-foreground">Request originating from {selected.location} · registered in {selected.registeredLocation}</div>
          </div>
          <select
            className="bg-card border border-border rounded-md px-3 py-2 text-sm"
            value={selected.id}
            onChange={(e) => {
              const r = requests.find((x) => x.id === e.target.value)!;
              setSelected(r);
              setRiskValue(r.riskScore);
              reset();
              navigate({ to: "/agent/verification", search: { reqId: r.id } });
            }}
          >
            {requests.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.customerName}</option>)}
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
                    SIM Lock is enabled, therefore no authorization action is required. All operations are hard-blocked by the client ring.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleReject}><XCircle className="size-4 mr-1" /> Terminate & Log</Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Monitor showing live status */}
      <Card className="p-6 glass">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Workflow Monitor</div>
          <FinalDecision decision={finalDecision !== "pending" ? finalDecision : selected.status} />
        </div>
        <WorkflowVisualization layers={layers} />
      </Card>

      {/* Decision Console */}
      <Card className="p-6 glass border-primary/20 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <BrainCircuit className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Decision Console</h2>
        </div>
        
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-foreground">
          {getAIRecommendation()}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/15"
            disabled={simLockBlocked}
            onClick={handleReject}
          >
            <XCircle className="size-4 mr-2" /> Reject Request
          </Button>
          <Button
            className="bg-success hover:bg-success/80 text-white font-medium"
            disabled={simLockBlocked}
            onClick={handleApprove}
          >
            <CheckCircle2 className="size-4 mr-2" /> Approve Request
          </Button>
        </div>
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

function FinalDecision({ decision }: { decision: string }) {
  const d = decision.toLowerCase();
  if (d === "pending" || d === "under-review") return <Badge className="bg-muted text-muted-foreground"><Play className="size-3 mr-1" /> Awaiting</Badge>;
  if (d === "approved" || d === "success") return <Badge className="bg-success/20 text-success"><CheckCircle2 className="size-3 mr-1" /> APPROVED</Badge>;
  if (d === "rejected" || d === "denied") return <Badge className="bg-destructive/20 text-destructive"><XCircle className="size-3 mr-1" /> REJECTED</Badge>;
  return <Badge className="bg-primary/20 text-primary"><ShieldAlert className="size-3 mr-1" /> BLOCKED</Badge>;
}
