import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Skull,
  Play,
  RotateCcw,
  X,
  Flame,
  Globe,
  Smartphone,
  Wifi,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSimLock, useRequests, useTimeline, useWorkflow } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/simulator")({
  component: ThreatSimulator,
});

interface AttackLogEntry {
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

function ThreatSimulator() {
  const navigate = useNavigate();
  const { locked, incrementBlocked } = useSimLock();
  const { addRequest, requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  // Attack Configuration States
  const [customerNumber, setCustomerNumber] = useState("+91 98250 12345");
  const [targetCustomer, setTargetCustomer] = useState("Rahul Patel");
  const [attackType, setAttackType] = useState<"SIM Swap" | "eSIM Transfer" | "Port-Out" | "SIM Replacement">("SIM Swap");
  const [location, setLocation] = useState("Mumbai"); // Registered is Vadodara
  const [device, setDevice] = useState("Attacker Kali Linux");
  const [network, setNetwork] = useState("Tor Proxy Network");
  const [fakeDocuments, setFakeDocuments] = useState(false);
  const [multipleAttempts, setMultipleAttempts] = useState(false);

  // Attack Progress States
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackStep, setAttackStep] = useState<number>(0);
  const [currentLayer, setCurrentLayer] = useState<string>("None");
  const [currentRisk, setCurrentRisk] = useState<number>(0);
  const [detectionStatus, setDetectionStatus] = useState<string>("Scanning...");
  const [finalResult, setFinalResult] = useState<"Waiting" | "Blocked" | "Rejected" | "Succeeded" | "idle">("idle");
  const [attackLogs, setAttackLogs] = useState<AttackLogEntry[]>([]);
  const [simulatedReqId, setSimulatedReqId] = useState<string>("");

  const BACKEND_URL = "http://localhost:3000/api/v1";

  const apiCall = async (endpoint: string, method: "POST" | "PUT" | "GET", body?: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend API offline. Falling back to frontend mock sandbox.", e);
    }
    return null;
  };

  const addLog = (message: string, type: AttackLogEntry["type"] = "info", reqIdForBackend?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAttackLogs((prev) => [{ time, type, message }, ...prev]);
    
    // Sync logs to backend if active
    const targetId = reqIdForBackend || simulatedReqId;
    if (targetId) {
      apiCall(`/simulator/attacks/${targetId}`, "PUT", {
        logMessage: message,
        logType: type,
      });
    }
  };

  const syncBackendAttackState = async (
    reqId: string,
    state: string,
    layerName: string,
    riskVal: number,
    detectStatus: string
  ) => {
    await apiCall(`/simulator/attacks/${reqId}`, "PUT", {
      status: state.toLowerCase(),
      currentLayer: layerName,
      riskScore: riskVal,
      detectionStatus: detectStatus,
    });
  };

  const handleCancel = () => {
    setIsAttacking(false);
    setFinalResult("idle");
    setAttackStep(0);
    setCurrentLayer("None");
    setCurrentRisk(0);
    setDetectionStatus("Cancelled");
    addLog("Attack cancelled by simulator operator.", "warning");
    if (simulatedReqId) {
      syncBackendAttackState(simulatedReqId, "rejected", "None", 0, "Cancelled");
    }
    toast.error("Simulation aborted");
  };

  const handleReset = () => {
    setIsAttacking(false);
    setFinalResult("idle");
    setAttackStep(0);
    setCurrentLayer("None");
    setCurrentRisk(0);
    setDetectionStatus("Scanning...");
    setAttackLogs([]);
    toast.success("Simulator reset complete");
  };

  // Run the simulation sequence
  const startSimulation = async () => {
    if (isAttacking) return;
    setIsAttacking(true);
    setFinalResult("Waiting");
    setAttackStep(1);
    setAttackLogs([]);
    
    // Generate Request ID
    const reqId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
    setSimulatedReqId(reqId);

    // Initial Risk Score compilation based on parameters
    let risk = 15; // base risk
    if (location !== "Vadodara") risk += 25; // location mismatch
    if (device !== "Rahul's iPhone") risk += 25; // device mismatch
    if (network.includes("Tor") || network.includes("Proxy")) risk += 15; // bad network
    if (fakeDocuments) risk += 20; // forged documents
    if (multipleAttempts) risk += 10;
    
    setCurrentRisk(risk);

    // Push initial record to backend database
    await apiCall("/simulator/attacks", "POST", {
      requestId: reqId,
      targetCustomer,
      customerNumber,
      attackType: attackType === "SIM Swap" ? "sim_swap" : attackType === "eSIM Transfer" ? "esim_transfer" : attackType === "Port-Out" ? "port_out" : "sim_replacement",
      location,
      device,
      network,
      fakeDocuments,
      multipleAttempts,
      riskScore: risk,
    });
    
    addLog(`Initiating attack vector [${attackType}] on ${targetCustomer} (${customerNumber})...`, "warning", reqId);
    
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    // Create SimRequest entry
    const newReq = {
      id: reqId,
      customerName: targetCustomer,
      customerId: "cust001",
      phone: customerNumber,
      type: attackType === "eSIM Transfer" ? "eSIM Transfer" as const : attackType === "Port-Out" ? "Port-Out" as const : attackType === "SIM Replacement" ? "SIM Replacement" as const : "SIM Swap" as const,
      riskScore: risk,
      status: "pending" as const,
      createdAt: "Just now",
      location: location,
      registeredLocation: "Vadodara",
      deviceChanged: device !== "Rahul's iPhone",
      recentSimChanges: multipleAttempts ? 4 : 1,
    };
    
    addRequest(newReq);
    addEvent({
      ts: "Just now",
      kind: "request-blocked",
      message: `${attackType} request submitted`,
      meta: `${reqId} · ${location}`,
    });

    await wait(1200);

    // LAYER 1: SIM Lock Firewall
    setCurrentLayer("Layer 1: SIM Lock Firewall");
    addLog("Evaluating Layer 1: SIM Lock Firewall...", "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 1: SIM Lock Firewall", risk, "Evaluating SIM Lock");
    
    if (locked) {
      setAttackStep(1);
      setCurrentRisk(98);
      setDetectionStatus("Enforced Block");
      setFinalResult("Blocked");
      updateRequestStatus(reqId, "blocked");
      incrementBlocked();
      
      await syncBackendAttackState(reqId, "blocked", "Layer 1: SIM Lock Firewall", 98, "Enforced Block");

      // log to timeline
      addEvent({
        ts: "Just now",
        kind: "request-blocked",
        message: `${attackType} blocked by SIM Lock`,
        meta: `${reqId} · Locked by user`,
      });

      addLog("CRITICAL: Attack blocked immediately at SIM Lock Firewall. Target account has SIM Lock armed.", "error", reqId);
      addLog(`Status: BLOCKED. Request ID: ${reqId}`, "error", reqId);
      setIsAttacking(false);
      toast.error("Attack blocked by SIM Lock Firewall!");
      return;
    }
    
    addLog("Layer 1 Passed (SIM Lock is DISABLED).", "success", reqId);
    await wait(1200);

    // LAYER 2: Face Verification
    setAttackStep(2);
    setCurrentLayer("Layer 2: Face Verification");
    addLog("Triggering biometric verification on target device...", "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 2: Face Verification", risk, "Awaiting Biometric");
    
    if (fakeDocuments || device.includes("Kali")) {
      const finalRisk = Math.min(100, risk + 15);
      setCurrentRisk(finalRisk);
      setDetectionStatus("Biometric Alert");
      addLog("Liveness verification failed: Biometric mismatch detected.", "error", reqId);
      await wait(1000);
      setFinalResult("Rejected");
      updateRequestStatus(reqId, "rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 2: Face Verification", finalRisk, "Biometric Alert");
      setIsAttacking(false);
      toast.error("Attack failed at Face Verification");
      return;
    }
    addLog("Face verification passed.", "success", reqId);
    await wait(1200);

    // LAYER 3: Google Authenticator
    setAttackStep(3);
    setCurrentLayer("Layer 3: Google Authenticator");
    addLog("Prompting for TOTP authenticator code...", "info", reqId);
    addLog("Brute-forcing/Interacting with TOTP verification session...", "warning", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 3: Google Authenticator", risk, "Brute-forcing TOTP");
    
    if (multipleAttempts) {
      const finalRisk = Math.min(100, risk + 20);
      setCurrentRisk(finalRisk);
      setDetectionStatus("TOTP Verification Error");
      addLog("Incorrect TOTP entered after multiple attempts.", "error", reqId);
      await wait(1000);
      setFinalResult("Rejected");
      updateRequestStatus(reqId, "rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 3: Google Authenticator", finalRisk, "TOTP Fail");
      setIsAttacking(false);
      toast.error("Attack failed: TOTP Auth failure");
      return;
    }
    addLog("TOTP Code Verified.", "success", reqId);
    await wait(1200);

    // LAYER 4: Trusted Device Ring
    setAttackStep(4);
    setCurrentLayer("Layer 4: Trusted Device Consent");
    addLog("Sending push authorization notification to registered primary device (Rahul's iPhone)...", "warning", reqId);
    setDetectionStatus("Awaiting Consent...");
    await syncBackendAttackState(reqId, "waiting", "Layer 4: Trusted Device Consent", risk, "Awaiting Consent");
    
    // In a high-fidelity simulator, this request is now in "pending" status.
    // The attacker dashboard will wait up to 15 seconds for a user to click "Approve" or "Reject"
    // in the Customer Trusted Device panel, OR it will timeout and auto-decide.
    addLog("SYSTEM WAITING: Customer must Approve or Reject this request from their Trusted Devices console.", "warning", reqId);
    
    let consentGranted = false;
    let consentChecked = 0;
    
    while (consentChecked < 10 && isAttacking) {
      // check state
      const currentReqs = useRequests.getState().requests;
      const currentReq = currentReqs.find((r) => r.id === reqId);
      
      if (currentReq) {
        if (currentReq.status === "approved") {
          consentGranted = true;
          break;
        } else if (currentReq.status === "rejected" || currentReq.status === "blocked") {
          consentGranted = false;
          break;
        }
      }
      
      await wait(1500);
      consentChecked++;
      addLog(`Waiting for customer response... (${Math.round(15 - consentChecked * 1.5)}s timeout remaining)`, "info", reqId);
    }
    
    // Auto-decide if timeout
    if (!consentGranted && consentChecked >= 10) {
      addLog("Timeout: No response from customer primary device.", "error", reqId);
      const finalRisk = Math.min(100, risk + 25);
      setCurrentRisk(finalRisk);
      setDetectionStatus("Consent Timeout");
      setFinalResult("Rejected");
      updateRequestStatus(reqId, "rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 4: Trusted Device Consent", finalRisk, "Consent Timeout");
      setIsAttacking(false);
      toast.error("Attack timed out (Rejected by system)");
      return;
    }
    
    // If rejected by customer
    const postReq = useRequests.getState().requests.find((r) => r.id === reqId);
    if (postReq && postReq.status === "rejected") {
      addLog("ALERT: Customer rejected request from Rahul's iPhone.", "error", reqId);
      setDetectionStatus("Rejected by User");
      setFinalResult("Rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 4: Trusted Device Consent", risk, "Rejected by User");
      setIsAttacking(false);
      toast.error("Attack rejected by user!");
      return;
    }
    
    addLog("Customer consent granted via Rahul's iPhone.", "success", reqId);
    await wait(1200);

    // LAYER 5: Telecom Intelligence
    setAttackStep(5);
    setCurrentLayer("Layer 5: Telecom Intelligence");
    addLog("Telecom analyzer compiling location, carrier logs and IMEI history...", "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 5: Telecom Intelligence", risk, "Analyzing Geolocation");
    
    if (location !== "Vadodara" && network.includes("Tor")) {
      addLog("WARNING: Location Vadodara (Home) vs current Mumbai is flagged as abnormal.", "warning", reqId);
      addLog("ISP reports connection originates from a Tor/VPN gateway.", "warning", reqId);
    }

    await wait(1200);

    // LAYER 6: Risk Engine
    setAttackStep(6);
    setCurrentLayer("Layer 6: Risk Scoring Engine");
    addLog(`Compiling total score... final risk evaluated: ${risk}%`, "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 6: Risk Scoring Engine", risk, "Compiling Risk Score");
    
    if (risk >= 70) {
      addLog("Risk Engine flags this attempt as HIGH RISK. Routing to Agent Console for Manual Review.", "warning", reqId);
      setDetectionStatus("Manual Review Required");
      updateRequestStatus(reqId, "under-review");
      await syncBackendAttackState(reqId, "waiting", "Layer 6: Risk Scoring Engine", risk, "Awaiting Agent Override");
      
      // Let's wait for agent to approve
      addLog("SYSTEM WAITING: Request is now in Agent Queue for authorization.", "warning", reqId);
      
      let agentApproved = false;
      let agentChecked = 0;
      
      while (agentChecked < 10) {
        const reqs = useRequests.getState().requests;
        const currentReq = reqs.find((r) => r.id === reqId);
        if (currentReq) {
          if (currentReq.status === "approved") {
            agentApproved = true;
            break;
          } else if (currentReq.status === "rejected") {
            agentApproved = false;
            break;
          }
        }
        await wait(1500);
        agentChecked++;
        addLog(`Waiting for agent decision... (${Math.round(15 - agentChecked * 1.5)}s timeout remaining)`, "info", reqId);
      }
      
      if (!agentApproved) {
        addLog("Decision Console: Request REJECTED by agent.", "error", reqId);
        setFinalResult("Rejected");
        setDetectionStatus("Rejected by Agent");
        await syncBackendAttackState(reqId, "rejected", "Layer 6: Risk Scoring Engine", risk, "Rejected by Agent");
        setIsAttacking(false);
        toast.error("Attack rejected by agent");
        return;
      }
    }
    
    // SUCCESS
    setAttackStep(7);
    setCurrentLayer("Attack Completed");
    setDetectionStatus("Authorized");
    setFinalResult("Succeeded");
    updateRequestStatus(reqId, "approved");
    await syncBackendAttackState(reqId, "succeeded", "Attack Completed", risk, "Authorized");
    
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${attackType} Request Approved`,
      meta: `${reqId} · Attacker successful`,
    });

    addLog(`ATTACK SUCCESS: SIM Swap completed. Attacker has hijacked mobile number!`, "success", reqId);
    addLog(`hijacked MSISDN: ${customerNumber}`, "success", reqId);
    setIsAttacking(false);
    toast.success("Attack succeeded! SIM card hijacked.");
  };

  // Clean simulation when state is cancelled
  useEffect(() => {
    return () => {
      setIsAttacking(false);
    };
  }, []);

  return (
    <div className="min-h-screen grid-bg p-4 md:p-8 flex flex-col">
      <header className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-destructive/10 text-destructive grid place-items-center border border-destructive/20 animate-pulse">
            <Skull className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Threat Simulator</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Attacker Demonstration Panel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/">
            <Button size="sm" variant="ghost">Exit Demo</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/customer" })}>
            Customer Panel
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/agent" })}>
            Agent Console
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 flex-1">
        {/* Attacker Panel & Configurations */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6 glass-strong border-destructive/30 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Flame className="size-5 text-destructive" />
              <h2 className="text-lg font-semibold">Attack Parameters</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Target Customer</Label>
                <Select
                  value={targetCustomer}
                  onValueChange={(val) => {
                    setTargetCustomer(val);
                    if (val === "Rahul Patel") setCustomerNumber("+91 98250 12345");
                    else if (val === "Priya Mehta") setCustomerNumber("+91 98765 54321");
                    else if (val === "Karan Singh") setCustomerNumber("+91 99887 76655");
                  }}
                >
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rahul Patel">Rahul Patel (Rahul's iPhone)</SelectItem>
                    <SelectItem value="Priya Mehta">Priya Mehta (Mumbai)</SelectItem>
                    <SelectItem value="Karan Singh">Karan Singh (Delhi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Customer Number</Label>
                <Input
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="bg-card border-border"
                />
              </div>

              <div>
                <Label>Attack Type</Label>
                <Select value={attackType} onValueChange={(val: any) => setAttackType(val)}>
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIM Swap">SIM Swap</SelectItem>
                    <SelectItem value="eSIM Transfer">eSIM Transfer (Activation)</SelectItem>
                    <SelectItem value="Port-Out">Port-Out</SelectItem>
                    <SelectItem value="SIM Replacement">SIM Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-strong space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
              <Globe className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Spoofing Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Spoofed Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vadodara">Vadodara (Registered - Legitimate)</SelectItem>
                    <SelectItem value="Mumbai">Mumbai (Out-of-state Mismatch)</SelectItem>
                    <SelectItem value="Delhi">Delhi (Out-of-state Mismatch)</SelectItem>
                    <SelectItem value="London">London (International Threat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Simulated Device</Label>
                <Select value={device} onValueChange={setDevice}>
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rahul's iPhone">Rahul's iPhone (Legitimate Device)</SelectItem>
                    <SelectItem value="Attacker Kali Linux">Kali Linux OS (Suspicious Machine)</SelectItem>
                    <SelectItem value="Spoofed iPhone 15">Spoofed iPhone 15 (Device Change)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Network Routing</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="w-full bg-card border-border">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airtel 5G Home">Airtel 5G Home Network (Clean)</SelectItem>
                    <SelectItem value="Tor Proxy Network">Tor Proxy Node (Suspicious)</SelectItem>
                    <SelectItem value="Public Cafe Wifi">Public Cafe Wifi (Medium Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-border/40">
                <Checkbox
                  id="docs"
                  checked={fakeDocuments}
                  onCheckedChange={(checked) => setFakeDocuments(!!checked)}
                />
                <Label htmlFor="docs" className="text-sm font-normal cursor-pointer">
                  Submit Forged ID Documents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attempts"
                  checked={multipleAttempts}
                  onCheckedChange={(checked) => setMultipleAttempts(!!checked)}
                />
                <Label htmlFor="attempts" className="text-sm font-normal cursor-pointer">
                  Simulate Multiple Failed Attempts
                </Label>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls, Live Status, Visualizer */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Controls Card */}
          <Card className="p-6 glass-strong flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Simulation Control Room</div>
              <p className="text-xs text-muted-foreground">Trigger the attack and watch security layers respond.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isAttacking ? "secondary" : "destructive"}
                onClick={startSimulation}
                disabled={isAttacking}
                className="min-w-32 hover:bg-destructive/80 transition font-display"
              >
                {isAttacking ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Running
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-2" /> Launch Attack
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isAttacking}>
                <RotateCcw className="size-4 mr-2" /> Reset
              </Button>
              <Button variant="ghost" onClick={handleCancel} disabled={!isAttacking}>
                <X className="size-4 mr-2" /> Cancel
              </Button>
            </div>
          </Card>

          {/* Live Attack Status & Logs */}
          <div className="grid md:grid-cols-2 gap-6 flex-1">
            {/* Status Panel */}
            <Card className="p-6 glass-strong flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Terminal className="size-4 text-primary" /> Live Attack Status
                </span>
                <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-muted-foreground">
                  ID: {simulatedReqId || "N/A"}
                </span>
              </div>

              <div className="space-y-4 flex-1 justify-center flex flex-col">
                <div className="flex justify-between items-center bg-white/3 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Current Layer</span>
                  <span className="font-mono text-sm text-primary font-semibold truncate max-w-[200px]">
                    {currentLayer}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white/3 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Calculated Risk</span>
                  <span className={`font-mono text-base font-bold ${currentRisk >= 70 ? "text-destructive" : currentRisk >= 35 ? "text-warning" : "text-success"}`}>
                    {currentRisk}%
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white/3 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Detection Status</span>
                  <span className="font-mono text-sm text-warning font-semibold truncate max-w-[200px]">
                    {detectionStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white/3 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Final Result</span>
                  <span className="flex items-center">
                    <FinalStatusBadge status={finalResult} />
                  </span>
                </div>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-6 gap-1 pt-4 border-t border-border/40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 rounded-full transition ${
                      attackStep > i
                        ? finalResult === "Blocked" || finalResult === "Rejected"
                          ? "bg-destructive"
                          : "bg-success"
                        : attackStep === i + 1
                        ? "bg-primary animate-pulse"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </Card>

            {/* Attack Log console */}
            <Card className="p-6 glass-strong flex flex-col bg-black/40 border-destructive/20 relative">
              <div className="text-sm font-semibold border-b border-border/40 pb-3 mb-3 flex items-center justify-between">
                <span>Attack Terminal Logs</span>
                <span className="size-2 rounded-full bg-destructive animate-pulse" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] font-mono text-xs pr-2">
                <AnimatePresence>
                  {attackLogs.length === 0 ? (
                    <div className="text-muted-foreground italic h-full flex items-center justify-center">
                      Awaiting attack initialization...
                    </div>
                  ) : (
                    attackLogs.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 text-left"
                      >
                        <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                        <span
                          className={
                            log.type === "success"
                              ? "text-success"
                              : log.type === "warning"
                              ? "text-warning"
                              : log.type === "error"
                              ? "text-destructive font-semibold"
                              : "text-foreground/90"
                          }
                        >
                          {log.message}
                        </span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Interactive Flow visualization info */}
          {isAttacking && finalResult === "Waiting" && attackStep === 4 && (
            <Card className="p-6 border-warning/40 bg-warning/5 animate-pulse">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-warning">Action Required (Trusted Device Verification)</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    To make the simulation succeed or simulate denial, open the{" "}
                    <Link to="/customer/devices" target="_blank" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                      Customer Trusted Devices <ArrowRight className="size-3" />
                    </Link>{" "}
                    page in a new tab, scroll to the consent card, and select **Approve** or **Reject**.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isAttacking && finalResult === "Waiting" && attackStep === 6 && (
            <Card className="p-6 border-destructive/40 bg-destructive/5 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-destructive">Action Required (Agent Manual Approval)</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    The threat score is high ({currentRisk}%). The request is routed to the agent. Open the{" "}
                    <Link to="/agent" target="_blank" className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5">
                      Agent Console <ArrowRight className="size-3" />
                    </Link>{" "}
                    in a new tab, go to **Review** or approvals, and select **Approve** or **Reject** to resolve the attack sequence.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function FinalStatusBadge({ status }: { status: "Waiting" | "Blocked" | "Rejected" | "Succeeded" | "idle" }) {
  if (status === "idle") return <span className="text-muted-foreground">Idle</span>;
  if (status === "Waiting") return <span className="text-warning flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Penetrating...</span>;
  if (status === "Blocked") return <span className="text-destructive font-bold flex items-center gap-1"><XCircle className="size-4" /> BLOCKED</span>;
  if (status === "Rejected") return <span className="text-destructive font-bold flex items-center gap-1"><XCircle className="size-4" /> REJECTED</span>;
  return <span className="text-success font-bold flex items-center gap-1"><CheckCircle2 className="size-4" /> SUCCEEDED</span>;
}
