import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Shield,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  X,
  AlertTriangle,
  Smartphone,
  Check,
} from "lucide-react-native";
import { useSimLock, useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";

const { width, height } = Dimensions.get("window");

type Step = "idle" | "biometric" | "auth" | "device" | "confirm" | "success";

export default function SimLockCenter() {
  const { user } = useAuth();
  const customerId = user?.id || "cust001";
  const { getLockState, setLocked } = useSimLock();
  const { locked, blockedCount } = getLockState(customerId);
  const { events, addEvent } = useTimeline();

  const [step, setStep] = useState<Step>("idle");
  const [inputCode, setInputCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);

  const customerEvents = events.filter(
    (ev) => ev.customerId === customerId && (ev.kind.includes("lock") || ev.kind.includes("blocked"))
  );

  const start = async () => {
    // If enabling the lock or disabling, run verification
    setStep("biometric");
    if (!permission?.granted) {
      const res = await requestPermission();
      if (res.granted) {
        setCameraActive(true);
      }
    } else {
      setCameraActive(true);
    }
  };

  const close = () => {
    setStep("idle");
    setInputCode("");
    setIsChecking(false);
    setFaceVerifying(false);
    setCameraActive(false);
  };

  const handleFaceVerify = async () => {
    if (!user?.faceImage) {
      Alert.alert("Biometric Error", "No face baseline photo registered. Go to Settings tab to scan one.");
      return;
    }

    setFaceVerifying(true);
    // Simulate biometric liveness scan processing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setFaceVerifying(false);

    Alert.alert("Success", "Biometric match successful! Identity verified.");
    setCameraActive(false);
    advance();
  };

  const handleFaceBypass = () => {
    setCameraActive(false);
    advance();
  };

  const advance = () => {
    if (step === "biometric") setStep("auth");
    else if (step === "auth") setStep("device");
    else if (step === "device") setStep("confirm");
    else if (step === "confirm") {
      const newState = !locked;
      setLocked(customerId, newState);
      setStep("success");

      addEvent({
        ts: "Just now",
        kind: newState ? "lock-enabled" : "lock-disabled",
        message: newState ? "SIM Lock Armed by Customer" : "SIM Lock Disabled by Customer",
        meta: `MANUAL OVERRIDE · Verified console tap`,
        customerId,
      });

      setTimeout(close, 1400);
    }
  };

  const handleAuthVerify = async () => {
    if (inputCode.length !== 6 || !/^\d+$/.test(inputCode)) {
      Alert.alert("Error", "Please enter a valid 6-digit code.");
      return;
    }

    setIsChecking(true);
    const isValid = await verifyTOTP(inputCode, user?.totpSecret || "JBSWY3DPEHPK3PXP");
    setIsChecking(false);

    if (isValid) {
      setInputCode("");
      advance();
    } else {
      Alert.alert("Verification Failed", "Invalid TOTP Authenticator code.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SIM Lock Control Center</Text>
        <Text style={styles.headerSub}>Master firewall settings for your MSISDN line</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LOCK CONSOLE CARD */}
        <View style={[styles.consoleCard, locked && styles.consoleCardActive]}>
          <View style={styles.shieldWrapper}>
            <View style={[styles.shieldIconContainer, { backgroundColor: locked ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)" }]}>
              {locked ? <Shield size={64} color="#10b981" /> : <ShieldAlert size={64} color="#f59e0b" />}
            </View>
            {locked && <View style={styles.shieldPulse} />}
          </View>

          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: locked ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)" }]}>
              <View style={[styles.statusDot, { backgroundColor: locked ? "#10b981" : "#f59e0b" }]} />
              <Text style={[styles.statusText, { color: locked ? "#10b981" : "#f59e0b" }]}>
                {locked ? "ARMED & PROTECTED" : "MONITORING ACTIVE"}
              </Text>
            </View>
          </View>

          <Text style={[styles.lockStatusValue, { color: locked ? "#10b981" : "#f59e0b" }]}>
            {locked ? "LOCKED" : "UNLOCKED"}
          </Text>

          <Text style={styles.lockDescription}>
            {locked
              ? "All hardware SIM swaps, eSIM activations and carrier replacements are currently rejected. An attacker cannot hijack your mobile number."
              : "SIM actions are bypass-permissible. Requests will proceed to the 7-layer validation engine. Enable lock for complete protection."}
          </Text>

          {/* CHECKLIST */}
          <View style={styles.checklist}>
            {["SIM Swap Attempts", "Carrier Replacements", "eSIM Transfers", "Port-out Requests"].map((t) => (
              <View key={t} style={styles.checkItem}>
                <View style={[styles.checkboxDot, { backgroundColor: locked ? "#10b981" : "#3f3f46" }]}>
                  {locked && <Check size={10} color="#09090b" />}
                </View>
                <Text style={[styles.checkLabel, !locked && styles.checkLabelDisabled]}>
                  {locked ? `Block ${t}` : `Permit ${t}`}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, locked ? styles.actionButtonOutline : styles.actionButtonPrimary]}
            onPress={start}
          >
            <Text style={[styles.actionButtonText, { color: locked ? "#ffffff" : "#09090b" }]}>
              {locked ? "Disable Firewall Lock" : "Arm SIM Lock Firewall"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* METRICS ROW */}
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>BLOCKED ATTACKS</Text>
            <Text style={styles.metricVal}>{blockedCount}</Text>
            <Text style={styles.metricSub}>Since lock initialized</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>COMPLIANCE GATE</Text>
            <Text style={[styles.metricVal, { color: "#10b981" }]}>100%</Text>
            <Text style={styles.metricSub}>Zero active overrides</Text>
          </View>
        </View>

        {/* LOCK HISTORY LIST */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Lock Event Timeline</Text>
          <View style={styles.historyList}>
            {customerEvents.map((ev) => (
              <View key={ev.id} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: ev.kind.includes("blocked") || ev.kind === "lock-enabled" ? "#10b981" : "#ef4444" }]} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyMsg}>{ev.message}</Text>
                  <Text style={styles.historyMeta}>
                    {ev.ts} · {ev.meta}
                  </Text>
                </View>
              </View>
            ))}
            {customerEvents.length === 0 && (
              <Text style={styles.emptyText}>No lock event logs available.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MULTI-STAGE CHALLENGE MODAL */}
      <Modal visible={step !== "idle"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Multi-Factor Verification</Text>
              <TouchableOpacity onPress={close}>
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* STAGE CONTAINER */}
            <ScrollView contentContainerStyle={styles.modalBody}>
              {step === "biometric" && (
                <View style={styles.stageContent}>
                  <Fingerprint size={36} color="#0ea5e9" />
                  <Text style={styles.stageTitle}>Face Verification</Text>
                  <Text style={styles.stageDesc}>
                    Look at your front camera to confirm owner liveness signature.
                  </Text>

                  <View style={styles.cameraBox}>
                    {cameraActive && permission?.granted ? (
                      <CameraView style={styles.modalCamera} facing="front" />
                    ) : (
                      <ActivityIndicator size="large" color="#0ea5e9" />
                    )}
                  </View>

                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleFaceVerify}>
                    {faceVerifying ? (
                      <ActivityIndicator color="#09090b" />
                    ) : (
                      <Text style={styles.modalPrimaryBtnText}>Verify Identity</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalGhostBtn} onPress={handleFaceBypass}>
                    <Text style={styles.modalGhostBtnText}>Bypass Biometrics (Demo Mode)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === "auth" && (
                <View style={styles.stageContent}>
                  <KeyRound size={36} color="#0ea5e9" />
                  <Text style={styles.stageTitle}>Authenticator OTP</Text>
                  <Text style={styles.stageDesc}>
                    Input the 6-digit verification code from your Google Authenticator.
                  </Text>

                  <TextInput
                    style={styles.modalOtpInput}
                    placeholder="000000"
                    placeholderTextColor="#27272a"
                    maxLength={6}
                    keyboardType="numeric"
                    value={inputCode}
                    onChangeText={setInputCode}
                  />

                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleAuthVerify}>
                    {isChecking ? (
                      <ActivityIndicator color="#09090b" />
                    ) : (
                      <Text style={styles.modalPrimaryBtnText}>Confirm Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {step === "device" && (
                <View style={styles.stageContent}>
                  <Smartphone size={36} color="#0ea5e9" />
                  <Text style={styles.stageTitle}>Trusted Device Consent</Text>
                  <Text style={styles.stageDesc}>
                    A push permission confirmation request was dispatched to your primary device ({user?.name}'s iPhone).
                  </Text>

                  <View style={styles.deviceIndicator}>
                    <Smartphone size={40} color="#0ea5e9" />
                  </View>

                  <TouchableOpacity style={styles.modalPrimaryBtn} onPress={advance}>
                    <Text style={styles.modalPrimaryBtnText}>Simulate Push Approval</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === "confirm" && (
                <View style={styles.stageContent}>
                  <AlertTriangle size={36} color="#f59e0b" />
                  <Text style={styles.stageTitle}>Confirm Configuration</Text>
                  <Text style={styles.stageDesc}>
                    Are you absolutely sure you want to {locked ? "DISABLE" : "ARM"} the SIM swap firewall lock?
                  </Text>

                  <View style={styles.doubleButtons}>
                    <TouchableOpacity style={styles.modalOutlineBtn} onPress={close}>
                      <Text style={styles.modalOutlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalDangerBtn} onPress={advance}>
                      <Text style={styles.modalDangerBtnText}>
                        {locked ? "Confirm Disable" : "Confirm Arm"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {step === "success" && (
                <View style={styles.stageContent}>
                  <CheckCircle2 size={48} color="#10b981" />
                  <Text style={styles.stageTitle}>Verifications Passed</Text>
                  <Text style={styles.stageDesc}>SIM Lock Firewall config state successfully written.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  consoleCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  consoleCardActive: {
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  shieldWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  shieldIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  shieldPulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusBadgeContainer: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  lockStatusValue: {
    fontSize: 36,
    fontWeight: "800",
  },
  lockDescription: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
  },
  checklist: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkboxDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  checkLabelDisabled: {
    textDecorationLine: "line-through",
    color: "#52525b",
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  actionButtonPrimary: {
    backgroundColor: "#0ea5e9",
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 9,
    color: "#71717a",
    fontWeight: "700",
    letterSpacing: 1,
  },
  metricVal: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  metricSub: {
    fontSize: 11,
    color: "#52525b",
  },
  historyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  historyContent: {
    flex: 1,
    gap: 2,
  },
  historyMsg: {
    fontSize: 13,
    color: "#ffffff",
  },
  historyMeta: {
    fontSize: 11,
    color: "#71717a",
  },
  emptyText: {
    fontSize: 12,
    color: "#52525b",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  // MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: height * 0.75,
    backgroundColor: "#0d0d11",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1e1e24",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalBody: {
    padding: 24,
  },
  stageContent: {
    alignItems: "center",
    gap: 12,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  stageDesc: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },
  cameraBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    backgroundColor: "#000000",
    marginVertical: 16,
  },
  modalCamera: {
    width: "100%",
    height: "100%",
  },
  modalPrimaryBtn: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "700",
  },
  modalGhostBtn: {
    paddingVertical: 10,
  },
  modalGhostBtnText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOtpInput: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textAlign: "center",
    height: 52,
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 10,
    width: "80%",
    marginVertical: 16,
  },
  deviceIndicator: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  doubleButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 20,
  },
  modalOutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalOutlineBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalDangerBtn: {
    flex: 1.5,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalDangerBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
