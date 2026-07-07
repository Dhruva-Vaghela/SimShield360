import React from "react";
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
} from "react-native";
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react-native";
import { useRequests, useTimeline } from "@/lib/store";

const { width } = Dimensions.get("window");

export default function ApprovalConsoleScreen() {
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const pending = requests.filter((r) => r.status === "pending" || r.status === "under-review");

  const handleApprove = (reqId: string, type: string, customerId: string) => {
    updateRequestStatus(reqId, "approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${type} Approved`,
      meta: `${reqId} · Operator desk override`,
      customerId,
    });
    Alert.alert("Approved", `Request ${reqId} successfully approved.`);
  };

  const handleReject = (reqId: string, type: string, customerId: string) => {
    updateRequestStatus(reqId, "rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${type} Rejected`,
      meta: `${reqId} · Blocked by operator desk`,
      customerId,
    });
    Alert.alert("Rejected", `Request ${reqId} successfully rejected.`);
  };

  const handleEscalate = (reqId: string) => {
    Alert.alert("Escalated", `Request ${reqId} escalated to L2 SecOps Desk.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Policy Enforcer Queue</Text>
        <Text style={styles.headerSub}>Verify rules and manually resolve high-risk requests</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No requests awaiting operator approval.</Text>
          </View>
        ) : (
          pending.map((r) => {
            const simLocked = r.status === "blocked" || r.riskScore >= 95;
            const isHighRisk = r.riskScore >= 70;

            return (
              <View key={r.id} style={[styles.card, simLocked && styles.cardDanger]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.reqId}>{r.id}</Text>
                    <Text style={styles.customerName}>{r.customerName}</Text>
                    <Text style={styles.reqDetail}>
                      {r.phone} · {r.type}
                    </Text>
                  </View>

                  <View style={[styles.riskBadge, { backgroundColor: isHighRisk ? "rgba(239, 68, 68, 0.1)" : "#0ea5e9" }]}>
                    <Text style={[styles.riskText, { color: isHighRisk ? "#ef4444" : "#09090b" }]}>
                      Risk {r.riskScore}%
                    </Text>
                  </View>
                </View>

                {simLocked ? (
                  <View style={styles.warningBox}>
                    <View style={styles.warningTitleRow}>
                      <ShieldAlert size={14} color="#ef4444" />
                      <Text style={styles.warningTitle}>Customer SIM Lock Armed</Text>
                    </View>
                    <Text style={styles.warningDesc}>
                      Approve override is unavailable. Request must be rejected.
                    </Text>
                  </View>
                ) : isHighRisk ? (
                  <View style={styles.alertBox}>
                    <View style={styles.warningTitleRow}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <Text style={[styles.warningTitle, { color: "#f59e0b" }]}>High Risk Detected</Text>
                    </View>
                    <Text style={[styles.warningDesc, { color: "#a1a1aa" }]}>
                      Manual verification recommended prior to approval.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.doubleMeta}>
                  <View style={styles.metaTile}>
                    <Text style={styles.metaLabel}>FROM</Text>
                    <Text style={styles.metaVal}>{r.location}</Text>
                  </View>
                  <View style={styles.metaTile}>
                    <Text style={styles.metaLabel}>REGISTERED</Text>
                    <Text style={styles.metaVal}>{r.registeredLocation}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  {!simLocked && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(r.id, r.type, r.customerId)}
                    >
                      <CheckCircle2 size={14} color="#ffffff" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(r.id, r.type, r.customerId)}
                  >
                    <XCircle size={14} color="#ef4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.escalateBtn}
                    onPress={() => handleEscalate(r.id)}
                  >
                    <Text style={styles.escalateBtnText}>Escalate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
    gap: 14,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#71717a",
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardDanger: {
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reqId: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#71717a",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 2,
  },
  reqDetail: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 2,
  },
  riskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  warningBox: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  warningTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  warningTitle: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "700",
  },
  warningDesc: {
    fontSize: 10,
    color: "#71717a",
  },
  alertBox: {
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  doubleMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaTile: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  metaLabel: {
    fontSize: 8,
    color: "#52525b",
    fontWeight: "700",
  },
  metaVal: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1.5,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 6,
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
  rejectBtn: {
    flex: 1.2,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 10,
    borderRadius: 6,
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
  escalateBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  escalateBtnText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
  },
});
