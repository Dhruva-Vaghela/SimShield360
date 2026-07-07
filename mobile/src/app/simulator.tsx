import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Skull,
  Play,
  RotateCcw,
  X,
  Flame,
  Globe,
  Terminal,
  ArrowRight,
  ArrowLeft,
  Shield,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react-native";
import { useSimLock, useRequests, useTimeline } from "@/lib/store";
import { getBackendUrl } from "@/lib/api";

const { width } = Dimensions.get("window");

interface AttackLogEntry {
  time: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export default function SimulatorScreen() {
  const router = useRouter();
  const { getLockState, incrementBlocked } = useSimLock();
  const { addRequest, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  // Attack Config States
  const [customerNumber, setCustomerNumber] = useState("+91 98250 12345");
  const [targetCustomer, setTargetCustomer] = useState("Rahul Patel");
  const [attackType, setAttackType] = useState<"SIM Swap" | "eSIM Transfer" | "Port-Out" | "SIM Replacement">("SIM Swap");
  const [location, setLocation] = useState("Mumbai");
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

  const logsEndRef = useRef<ScrollView | null>(null);

  const getCustomerId = (name: string) => {
    if (name === "Rahul Patel") return "cust001";
    if (name === "Priya Sharma") return "cust002";
    return "cust003";
  };

  const targetCustId = getCustomerId(targetCustomer);
  const { locked } = getLockState(targetCustId);

  const BACKEND_URL = getBackendUrl();

  const apiCall = async (endpoint: string, method: "POST" | "PUT" | "GET", body?: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend offline. Running on mock client sandbox.", e);
    }
    return null;
  };

  const addLog = (message: string, type: AttackLogEntry["type"] = "info", reqIdForBackend?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAttackLogs((prev) => [{ time, type, message }, ...prev]);

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
    addLog("Attack cancelled by operator.", "warning");
    if (simulatedReqId) {
      syncBackendAttackState(simulatedReqId, "rejected", "None", 0, "Cancelled");
    }
    Alert.alert("Simulation Aborted");
  };

  const handleReset = () => {
    setIsAttacking(false);
    setFinalResult("idle");
    setAttackStep(0);
    setCurrentLayer("None");
    setCurrentRisk(0);
    setDetectionStatus("Scanning...");
    setAttackLogs([]);
    setSimulatedReqId("");
    Alert.alert("Simulator Reset Complete");
  };

  const startSimulation = async (directToAgent = false) => {
    if (isAttacking) return;
    setIsAttacking(true);
    setFinalResult("Waiting");
    setAttackLogs([]);

    const reqId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
    setSimulatedReqId(reqId);

    let risk = directToAgent ? 95 : 15;
    if (!directToAgent) {
      if (location !== "Vadodara") risk += 25;
      if (device !== "Rahul's iPhone") risk += 25;
      if (network.includes("Tor") || network.includes("Proxy")) risk += 15;
      if (fakeDocuments) risk += 20;
      if (multipleAttempts) risk += 10;
    }
    setCurrentRisk(risk);

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

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const newReq = {
      id: reqId,
      customerName: targetCustomer,
      customerId: targetCustId,
      phone: customerNumber,
      type: attackType,
      riskScore: risk,
      status: (directToAgent ? "under-review" : "pending") as any,
      createdAt: "Just now",
      location,
      registeredLocation: "Vadodara",
      deviceChanged: device !== "Rahul's iPhone",
      recentSimChanges: multipleAttempts ? 4 : 1,
    };

    addRequest(newReq, true);
    addEvent({
      ts: "Just now",
      kind: "request-blocked",
      message: `${attackType} request submitted`,
      meta: `${reqId} · ${location}`,
      customerId: targetCustId,
    });

    if (directToAgent) {
      addLog(`[DIRECT ROUTE] Submitting vector [${attackType}] directly to review...`, "warning", reqId);
      await wait(800);

      setAttackStep(6);
      setCurrentLayer("Layer 6: Risk Scoring Engine");
      setDetectionStatus("Manual Review Required");
      await syncBackendAttackState(reqId, "waiting", "Layer 6: Risk Scoring Engine", risk, "Awaiting Agent Override");

      addLog("Risk Engine flags attempt as HIGH RISK. Routing to Agent Console.", "warning", reqId);
      addLog("SYSTEM WAITING: Request in Agent Queue for authorization.", "warning", reqId);

      let agentApproved = false;
      let agentChecked = 0;

      while (agentChecked < 10) {
        const reqs = useRequests.getState().requests;
        const currentReq = reqs.find((r) => r.id === reqId);

        if (currentReq) {
          if (currentReq.status === "approved") {
            agentApproved = true;
            break;
          } else if (currentReq.status === "rejected" || currentReq.status === "blocked") {
            agentApproved = false;
            break;
          }
        }
        await wait(1500);
        agentChecked++;
        addLog(`Waiting for agent decision... (${Math.round(15 - agentChecked * 1.5)}s)`, "info", reqId);
      }

      if (!agentApproved) {
        addLog("Decision Console: Request REJECTED by agent.", "error", reqId);
        setFinalResult("Rejected");
        setDetectionStatus("Rejected by Agent");
        await syncBackendAttackState(reqId, "rejected", "Layer 6: Risk Scoring Engine", risk, "Rejected by Agent");
        setIsAttacking(false);
        return;
      }

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
        customerId: targetCustId,
      });

      addLog(`ATTACK SUCCESS: SIM Swap completed. Line hijacked!`, "success", reqId);
      setIsAttacking(false);
      return;
    }

    addLog(`Initiating vector [${attackType}] on ${targetCustomer}...`, "warning", reqId);
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
      incrementBlocked(targetCustId);

      await syncBackendAttackState(reqId, "blocked", "Layer 1: SIM Lock Firewall", 98, "Enforced Block");

      addEvent({
        ts: "Just now",
        kind: "request-blocked",
        message: `${attackType} blocked by SIM Lock`,
        meta: `${reqId} · Locked by user`,
        customerId: targetCustId,
      });

      addLog("CRITICAL: Blocked immediately at SIM Lock Firewall. Firewall is armed.", "error", reqId);
      setIsAttacking(false);
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
      return;
    }
    addLog("Face verification passed.", "success", reqId);
    await wait(1200);

    // LAYER 3: Google Authenticator
    setAttackStep(3);
    setCurrentLayer("Layer 3: Google Authenticator");
    addLog("Prompting for TOTP code...", "info", reqId);
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
      return;
    }
    addLog("TOTP Code Verified.", "success", reqId);
    await wait(1200);

    // LAYER 4: Trusted Device Ring
    setAttackStep(4);
    setCurrentLayer("Layer 4: Trusted Device Consent");
    addLog("Sending push authorization request to registered primary device...", "warning", reqId);
    setDetectionStatus("Awaiting Consent...");
    await syncBackendAttackState(reqId, "waiting", "Layer 4: Trusted Device Consent", risk, "Awaiting Consent");

    addLog("SYSTEM WAITING: Customer must approve request on their Trusted Device Console.", "warning", reqId);

    let consentGranted = false;
    let consentChecked = 0;

    while (consentChecked < 10 && isAttacking) {
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
      addLog(`Waiting for customer response... (${Math.round(15 - consentChecked * 1.5)}s)`, "info", reqId);
    }

    if (!consentGranted && consentChecked >= 10) {
      addLog("Timeout: No response from customer primary device.", "error", reqId);
      const finalRisk = Math.min(100, risk + 25);
      setCurrentRisk(finalRisk);
      setDetectionStatus("Consent Timeout");
      setFinalResult("Rejected");
      updateRequestStatus(reqId, "rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 4: Trusted Device Consent", finalRisk, "Consent Timeout");
      setIsAttacking(false);
      return;
    }

    const postReq = useRequests.getState().requests.find((r) => r.id === reqId);
    if (postReq && postReq.status === "rejected") {
      addLog("ALERT: Customer rejected request.", "error", reqId);
      setDetectionStatus("Rejected by User");
      setFinalResult("Rejected");
      await syncBackendAttackState(reqId, "rejected", "Layer 4: Trusted Device Consent", risk, "Rejected by User");
      setIsAttacking(false);
      return;
    }

    addLog("Customer consent granted.", "success", reqId);
    await wait(1200);

    // LAYER 5: Telecom Intelligence
    setAttackStep(5);
    setCurrentLayer("Layer 5: Telecom Intelligence");
    addLog("Evaluating Carrier geolocation, IMEI logs, and history...", "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 5: Telecom Intelligence", risk, "Analyzing Geolocation");

    if (location !== "Vadodara" && network.includes("Tor")) {
      addLog("WARNING: Geolocation mismatch flagged.", "warning", reqId);
      addLog("ISP reports connection originates from Tor VPN Gateway.", "warning", reqId);
    }
    await wait(1200);

    // LAYER 6: Risk Engine
    setAttackStep(6);
    setCurrentLayer("Layer 6: Risk Scoring Engine");
    addLog(`Evaluating risk weight score... current score: ${risk}%`, "info", reqId);
    await syncBackendAttackState(reqId, "started", "Layer 6: Risk Scoring Engine", risk, "Compiling Risk Score");

    if (risk >= 70) {
      addLog("Risk Engine flags attempt as HIGH RISK. Routing to Agent Console.", "warning", reqId);
      setDetectionStatus("Manual Review Required");
      updateRequestStatus(reqId, "under-review");
      await syncBackendAttackState(reqId, "waiting", "Layer 6: Risk Scoring Engine", risk, "Awaiting Agent Override");

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
        addLog(`Waiting for agent decision... (${Math.round(15 - agentChecked * 1.5)}s)`, "info", reqId);
      }

      if (!agentApproved) {
        addLog("Decision Console: Request REJECTED by agent.", "error", reqId);
        setFinalResult("Rejected");
        setDetectionStatus("Rejected by Agent");
        await syncBackendAttackState(reqId, "rejected", "Layer 6: Risk Scoring Engine", risk, "Rejected by Agent");
        setIsAttacking(false);
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
      customerId: targetCustId,
    });

    addLog(`ATTACK SUCCESS: SIM card swapped successfully. MSISDN hijacked!`, "success", reqId);
    setIsAttacking(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
          <ArrowLeft size={16} color="#71717a" />
          <Text style={styles.backText}>Exit Demo</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Threat Simulator</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PARAMS CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Flame size={16} color="#ef4444" />
            <Text style={styles.sectionTitle}>Attack Configuration</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Target Customer</Text>
            <View style={styles.selectorRow}>
              {["Rahul Patel", "Priya Sharma"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.selectorButton, targetCustomer === c && styles.selectorActive]}
                  onPress={() => {
                    setTargetCustomer(c);
                    setCustomerNumber(c === "Rahul Patel" ? "+91 98250 12345" : "+91 97110 54321");
                  }}
                >
                  <Text style={[styles.selectorText, targetCustomer === c && styles.selectorTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Vector Type</Text>
            <View style={styles.selectorRow}>
              {["SIM Swap", "eSIM Transfer", "Port-Out"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectorButton, attackType === type && styles.selectorActive]}
                  onPress={() => setAttackType(type as any)}
                >
                  <Text style={[styles.selectorText, attackType === type && styles.selectorTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SPOOFING CONFIG CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color="#0ea5e9" />
            <Text style={styles.sectionTitle}>Spoofing Vectors</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Origin Location</Text>
            <View style={styles.selectorRow}>
              {["Vadodara", "Mumbai", "London"].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.selectorButton, location === l && styles.selectorActive]}
                  onPress={() => setLocation(l)}
                >
                  <Text style={[styles.selectorText, location === l && styles.selectorTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Device Context</Text>
            <View style={styles.selectorRow}>
              {["Rahul's iPhone", "Attacker Kali Linux"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.selectorButton, device === d && styles.selectorActive]}
                  onPress={() => setDevice(d)}
                >
                  <Text style={[styles.selectorText, device === d && styles.selectorTextActive]}>
                    {d.replace("Attacker ", "")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Submit Forged ID Documents</Text>
              <Text style={styles.switchSub}>Triggers high fraud detection signals</Text>
            </View>
            <Switch
              value={fakeDocuments}
              onValueChange={setFakeDocuments}
              trackColor={{ false: "#18181b", true: "#0ea5e9" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Simulate Brute-force Attempts</Text>
              <Text style={styles.switchSub}>Adds multiple locks logs</Text>
            </View>
            <Switch
              value={multipleAttempts}
              onValueChange={setMultipleAttempts}
              trackColor={{ false: "#18181b", true: "#0ea5e9" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* STATUS GAUGE CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusMetric}>
              <Text style={styles.metricLabel}>Current Layer</Text>
              <Text style={styles.metricVal} numberOfLines={1}>{currentLayer}</Text>
            </View>
            <View style={styles.statusMetric}>
              <Text style={styles.metricLabel}>Evaluated Risk</Text>
              <Text
                style={[
                  styles.metricVal,
                  styles.riskText,
                  { color: currentRisk >= 75 ? "#ef4444" : currentRisk >= 35 ? "#f59e0b" : "#10b981" },
                ]}
              >
                {currentRisk}%
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusMetric}>
              <Text style={styles.metricLabel}>Detection State</Text>
              <Text style={styles.metricVal} numberOfLines={1}>{detectionStatus}</Text>
            </View>
            <View style={styles.statusMetric}>
              <Text style={styles.metricLabel}>Simulation Result</Text>
              <Text
                style={[
                  styles.metricVal,
                  {
                    color:
                      finalResult === "Succeeded"
                        ? "#10b981"
                        : finalResult === "Blocked" || finalResult === "Rejected"
                        ? "#ef4444"
                        : "#a1a1aa",
                  },
                ]}
              >
                {finalResult.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* SIMULATION GAUNTLET DOTS */}
          <View style={styles.dotsBar}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  attackStep > i
                    ? finalResult === "Blocked" || finalResult === "Rejected"
                      ? styles.dotDanger
                      : styles.dotSuccess
                    : attackStep === i + 1
                    ? styles.dotActive
                    : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* CONTROL PANEL */}
        <View style={styles.controlsBar}>
          {!isAttacking ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.launchButton]}
                onPress={() => startSimulation(false)}
              >
                <Play size={16} color="#09090b" />
                <Text style={styles.launchButtonText}>Launch Attack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.agentButton]}
                onPress={() => startSimulation(true)}
              >
                <Skull size={16} color="#09090b" />
                <Text style={styles.agentButtonText}>Send to Agent</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <X size={16} color="#ffffff" />
              <Text style={styles.cancelButtonText}>Cancel Simulation</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={isAttacking}>
            <RotateCcw size={16} color={isAttacking ? "#52525b" : "#ffffff"} />
          </TouchableOpacity>
        </View>

        {/* TERMINAL LOGS CARD */}
        <View style={styles.terminalCard}>
          <View style={styles.terminalHeader}>
            <Terminal size={14} color="#0ea5e9" />
            <Text style={styles.terminalTitle}>Attack Terminal Console</Text>
            <View style={styles.terminalIndicator} />
          </View>

          <ScrollView
            ref={logsEndRef}
            style={styles.terminalLogsContainer}
            contentContainerStyle={styles.terminalLogsContent}
            nestedScrollEnabled
          >
            {attackLogs.length === 0 ? (
              <Text style={styles.terminalPlaceholder}>Awaiting attack initialization...</Text>
            ) : (
              attackLogs.map((log, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.logLine,
                    log.type === "success" && styles.logSuccess,
                    log.type === "error" && styles.logError,
                    log.type === "warning" && styles.logWarning,
                  ]}
                >
                  [{log.time}] {log.message}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "#71717a",
    marginLeft: 6,
    fontSize: 14,
  },
  titleText: {
    flex: 1,
    textAlign: "center",
    marginRight: 60,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  fieldRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  selectorActive: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  selectorText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  selectorTextActive: {
    color: "#09090b",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  switchSub: {
    fontSize: 10,
    color: "#52525b",
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusMetric: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  metricLabel: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "600",
  },
  metricVal: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 4,
  },
  riskText: {
    fontSize: 14,
  },
  dotsBar: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  dot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  dotSuccess: {
    backgroundColor: "#10b981",
  },
  dotDanger: {
    backgroundColor: "#ef4444",
  },
  dotActive: {
    backgroundColor: "#0ea5e9",
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  controlsBar: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  launchButton: {
    backgroundColor: "#ef4444",
  },
  launchButtonText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
  agentButton: {
    backgroundColor: "#f59e0b",
  },
  agentButtonText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#27272a",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  resetButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  terminalCard: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    borderRadius: 14,
    overflow: "hidden",
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    gap: 8,
  },
  terminalTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#a1a1aa",
    fontWeight: "700",
  },
  terminalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  terminalLogsContainer: {
    height: 180,
    padding: 12,
  },
  terminalLogsContent: {
    paddingBottom: 20,
  },
  terminalPlaceholder: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#52525b",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 60,
  },
  logLine: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#a1a1aa",
    lineHeight: 15,
    marginBottom: 4,
  },
  logSuccess: {
    color: "#10b981",
  },
  logError: {
    color: "#ef4444",
  },
  logWarning: {
    color: "#f59e0b",
  },
});
