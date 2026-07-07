import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Smartphone,
  History,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BrainCircuit,
  Hourglass,
} from "lucide-react-native";
import { useRequests, useTimeline, useWorkflow } from "@/lib/store";
import { type SimRequest } from "@/lib/mock-data";

const { width } = Dimensions.get("window");

type ScenarioKey = "legit" | "sim-lock" | "face-fail" | "device-timeout" | "geo" | "frozen";
const SCENARIOS: { key: ScenarioKey; label: string; desc: string; result: string }[] = [
  { key: "legit", label: "Legitimate Swap", desc: "Customer-initiated, all layers pass", result: "Approved" },
  { key: "sim-lock", label: "SIM Lock Armed", desc: "Customer SIM Lock is enabled", result: "Instant Block" },
  { key: "face-fail", label: "Face Match Mismatch", desc: "Biometric validation failure", result: "Rejected" },
  { key: "device-timeout", label: "Device Consent Timeout", desc: "No push confirmation received", result: "Rejected" },
  { key: "geo", label: "Location Anomaly", desc: "Swap from suspicious gateway", result: "High Risk" },
  { key: "frozen", label: "Frozen Account", desc: "Account flagged and blocked", result: "Blocked" },
];

export default function VerificationCenterScreen() {
  const router = useRouter();
  const { reqId } = useLocalSearchParams<{ reqId?: string }>();
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const { layers, setLayer, reset, setRunning, running, setDecision, finalDecision } = useWorkflow();

  const [selected, setSelected] = useState<SimRequest | null>(null);
  const [riskValue, setRiskValue] = useState(0);

  // Pick request on load
  useEffect(() => {
    if (requests.length > 0) {
      const match = reqId ? requests.find((r) => r.id === reqId) : requests[0];
      if (match) {
        setSelected(match);
        setRiskValue(match.riskScore);
        reset();
      }
    }
  }, [reqId, requests]);

  const runScenario = async (key: ScenarioKey) => {
    if (!selected) return;
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
      Alert.alert("SIM Locked", "BLOCKED at Layer 1 — SIM Lock Firewall is Armed");
      setRunning(false);
      return;
    }

    setLayer("sim-lock", "success"); await wait(400);

    if (key === "face-fail") {
      setLayer("face", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      Alert.alert("Biometrics Failed", "Rejected at Layer 2 — Face verification mismatch");
      setRunning(false);
      return;
    }
    setLayer("face", "success"); await wait(400);
    setLayer("auth", "success"); await wait(400);

    if (key === "device-timeout") {
      setLayer("device", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      Alert.alert("Consent Timeout", "Rejected at Layer 4 — Trusted device failed approval");
      setRunning(false);
      return;
    }
    setLayer("device", "success"); await wait(400);

    if (key === "geo") {
      setLayer("telecom", "failed"); await wait(400);
      setLayer("risk", "failed"); await wait(400);
      setDecision("rejected");
      updateRequestStatus(selected.id, "rejected");
      Alert.alert("Geo Anomaly", "Rejected — Geolocation mismatch warning");
      setRunning(false);
      return;
    }
    if (key === "frozen") {
      setLayer("telecom", "blocked");
      setLayer("risk", "blocked");
      setDecision("blocked");
      updateRequestStatus(selected.id, "blocked");
      Alert.alert("Blocked", "Account frozen — excessive fail logs");
      setRunning(false);
      return;
    }

    setLayer("telecom", "success"); await wait(400);
    setLayer("risk", "success"); await wait(400);
    setDecision("approved");
    updateRequestStatus(selected.id, "approved");
    Alert.alert("Approved", "SIM request approved through all verification layers");
    setRunning(false);
  };

  const handleApprove = () => {
    if (!selected) return;
    updateRequestStatus(selected.id, "approved");
    setDecision("approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${selected.type} approved by operator desk`,
      meta: `${selected.id} · Manual Override`,
      customerId: selected.customerId,
    });
    Alert.alert("Approved", `Request ${selected.id} manually authorized.`);
  };

  const handleReject = () => {
    if (!selected) return;
    updateRequestStatus(selected.id, "rejected");
    setDecision("rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${selected.type} rejected by operator desk`,
      meta: `${selected.id} · Manually blocked`,
      customerId: selected.customerId,
    });
    Alert.alert("Rejected", `Request ${selected.id} manually rejected.`);
  };

  const getAIRecommendation = () => {
    if (!selected) return "";
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

  const renderGauge = (val: number) => {
    const size = 110;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (val / 100) * circ;
    const color = val >= 70 ? "#ef4444" : val >= 35 ? "#f59e0b" : "#10b981";

    return (
      <View style={styles.gaugeWrapper}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#1e1e24" strokeWidth={strokeWidth} fill="transparent" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.gaugeTextContainer}>
          <Text style={[styles.gaugeScoreText, { color }]}>{val}</Text>
          <Text style={styles.gaugeLabelMini}>RISK</Text>
        </View>
      </View>
    );
  };

  const renderWorkflowLayers = () => {
    const MONITOR_LAYERS = [
      { key: "sim-lock", name: "SIM Lock" },
      { key: "face", name: "Face Verify" },
      { key: "auth", name: "TOTP 2FA" },
      { key: "device", name: "Consent Ring" },
      { key: "telecom", name: "Carrier Intel" },
      { key: "risk", name: "Risk score" },
    ];

    return (
      <View style={styles.workflowGrid}>
        {MONITOR_LAYERS.map((layer, idx) => {
          const rawState = (layers[layer.key] ?? "pending") as string;
          let color = "#71717a";
          let bg = "rgba(255, 255, 255, 0.02)";
          let statusText = "Waiting";
          let icon = <Hourglass size={12} color="#71717a" />;

          if (rawState === "success" || rawState === "passed") {
            color = "#10b981";
            bg = "rgba(16, 185, 129, 0.05)";
            statusText = "Passed";
            icon = <CheckCircle2 size={12} color="#10b981" />;
          } else if (rawState === "failed" || rawState === "blocked") {
            color = "#ef4444";
            bg = "rgba(239, 68, 68, 0.05)";
            statusText = "Blocked";
            icon = <XCircle size={12} color="#ef4444" />;
          } else if (rawState === "running" || rawState === "processing") {
            color = "#ef4444";
            bg = "rgba(239, 68, 68, 0.08)";
            statusText = "Running";
            icon = <ActivityIndicator size="small" color="#ef4444" />;
          }

          return (
            <View key={layer.key} style={[styles.layerTile, { borderColor: color, backgroundColor: bg }]}>
              <View style={styles.layerTileHeader}>
                <Text style={styles.layerIndex}>L{idx + 1}</Text>
                {icon}
              </View>
              <Text style={styles.layerName}>{layer.name}</Text>
              <Text style={[styles.layerStatus, { color }]}>{statusText}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (!selected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={16} color="#71717a" />
            <Text style={styles.backBtnText}>Queue</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading queue requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLocked = selected.status === "blocked" || layers["sim-lock"] === "blocked";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#71717a" />
          <Text style={styles.backBtnText}>Queue</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Workflow Inspector</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SELECTED REQUEST PANEL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.reqIdText}>{selected.id}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeLabel}>{selected.type}</Text>
              <Text style={styles.badgeLabelOutline}>{selected.phone}</Text>
            </View>
          </View>

          <Text style={styles.clientName}>{selected.customerName}</Text>
          <Text style={styles.originText}>
            Originating from: {selected.location} (Registered: {selected.registeredLocation})
          </Text>
        </View>

        {/* SIM LOCK ALERT */}
        {isLocked && (
          <View style={styles.dangerCard}>
            <ShieldAlert size={20} color="#ef4444" />
            <View style={styles.dangerContent}>
              <Text style={styles.dangerTitle}>SIM Lock Firewall armed</Text>
              <Text style={styles.dangerDesc}>
                Customer lock enforces hard blocks. Operation auto-denied at registry. Terminate and log block.
              </Text>
            </View>
          </View>
        )}

        {/* WORKFLOW MONITOR GRID */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>7-Layer Workflow Monitor</Text>
            <Text style={[styles.decisionText, { color: selected.status === "approved" ? "#10b981" : selected.status === "pending" || selected.status === "under-review" ? "#f59e0b" : "#ef4444" }]}>
              {selected.status.toUpperCase()}
            </Text>
          </View>
          {renderWorkflowLayers()}
        </View>

        {/* DECISION ENGINE PANEL */}
        <View style={styles.decisionCard}>
          <View style={styles.decisionTitleRow}>
            <BrainCircuit size={16} color="#ef4444" />
            <Text style={styles.decisionCardTitle}>Override Console</Text>
          </View>
          <Text style={styles.verdictBox}>{getAIRecommendation()}</Text>

          <View style={styles.doubleButtons}>
            <TouchableOpacity
              style={[styles.rejectBtn, isLocked && styles.btnDisabled]}
              onPress={handleReject}
              disabled={isLocked}
            >
              <XCircle size={16} color="#ef4444" />
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.approveBtn, isLocked && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={isLocked}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.approveBtnText}>Approve Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DOUBLE INFO BLOCKS */}
        <View style={styles.doubleCardsRow}>
          {/* TELECOM INTELLIGENCE */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Carrier Intel</Text>
            
            <View style={styles.intelRow}>
              <Text style={styles.intelLabel}>Home Loc</Text>
              <Text style={styles.intelVal}>{selected.registeredLocation}</Text>
            </View>
            <View style={styles.intelRow}>
              <Text style={styles.intelLabel}>Current Loc</Text>
              <Text style={[styles.intelVal, selected.location !== selected.registeredLocation && styles.intelAlert]}>
                {selected.location}
              </Text>
            </View>
            <View style={styles.intelRow}>
              <Text style={styles.intelLabel}>Device Swap</Text>
              <Text style={[styles.intelVal, selected.deviceChanged && styles.intelAlert]}>
                {selected.deviceChanged ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.intelRow}>
              <Text style={styles.intelLabel}>SIM Swaps</Text>
              <Text style={[styles.intelVal, selected.recentSimChanges > 0 && styles.intelAlert]}>
                {selected.recentSimChanges}
              </Text>
            </View>
          </View>

          {/* RISK ENG METER */}
          <View style={styles.riskCard}>
            <Text style={styles.infoCardTitle}>Risk Engine</Text>
            {renderGauge(riskValue)}
          </View>
        </View>

        {/* DEMO SCENARIOS PANEL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Run Simulated Verification Gauntlets</Text>
          <Text style={styles.cardSub}>Trigger automated verification loops for analyst training.</Text>
          
          <View style={styles.scenariosGrid}>
            {SCENARIOS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.scenarioBtn}
                onPress={() => runScenario(s.key)}
                disabled={running}
              >
                <View style={styles.scenarioBtnHeader}>
                  <Text style={styles.scenarioLabel}>{s.label}</Text>
                  <Text style={styles.scenarioResult}>{s.result}</Text>
                </View>
                <Text style={styles.scenarioDesc}>{s.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtnText: {
    color: "#71717a",
    marginLeft: 6,
    fontSize: 14,
  },
  headerTitle: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#71717a",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  reqIdText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#71717a",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeLabelOutline: {
    fontSize: 9,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#27272a",
    color: "#a1a1aa",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
  originText: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  dangerCard: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  dangerContent: {
    flex: 1,
    gap: 4,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  dangerDesc: {
    fontSize: 12,
    color: "#a1a1aa",
    lineHeight: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: -8,
    marginBottom: 16,
  },
  decisionText: {
    fontSize: 11,
    fontWeight: "800",
  },
  workflowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  layerTile: {
    width: (width - 62) / 2,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  layerTileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layerIndex: {
    fontSize: 9,
    color: "#52525b",
    fontWeight: "700",
  },
  layerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  layerStatus: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  decisionCard: {
    backgroundColor: "rgba(239, 68, 68, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  decisionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.1)",
    paddingBottom: 8,
  },
  decisionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  verdictBox: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: "#ffffff",
    lineHeight: 16,
    fontWeight: "600",
  },
  doubleButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  rejectBtnText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
  },
  approveBtn: {
    flex: 1.2,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  approveBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.3,
  },
  doubleCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoCard: {
    flex: 1.2,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 6,
    marginBottom: 4,
  },
  intelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  intelLabel: {
    fontSize: 11,
    color: "#71717a",
  },
  intelVal: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  intelAlert: {
    color: "#f59e0b",
  },
  riskCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  gaugeWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  gaugeTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeScoreText: {
    fontSize: 20,
    fontWeight: "800",
  },
  gaugeLabelMini: {
    fontSize: 8,
    color: "#71717a",
    fontWeight: "700",
  },
  scenariosGrid: {
    gap: 8,
    marginTop: 10,
  },
  scenarioBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  scenarioBtnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scenarioLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  scenarioResult: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#ef4444",
    fontWeight: "700",
  },
  scenarioDesc: {
    fontSize: 11,
    color: "#71717a",
    lineHeight: 14,
  },
});
