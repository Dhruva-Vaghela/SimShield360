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
  Smartphone,
  Laptop,
  Tablet,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Check,
  X,
} from "lucide-react-native";
import { mockDevices } from "@/lib/mock-data";
import { useRequests, useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const { width } = Dimensions.get("window");

export default function DevicesScreen() {
  const { user } = useAuth();
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const customerId = user?.id || "cust001";

  const activeRequests = requests.filter(
    (r) => (r.status === "pending" || r.status === "under-review") && r.customerId === customerId
  );

  const handleApprove = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${type} Approved via Primary Trusted Device`,
      meta: `${reqId} · Trusted Device ring`,
      customerId,
    });
    Alert.alert("Success", `Request ${reqId} approved successfully`);
  };

  const handleReject = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${type} Rejected via Primary Trusted Device`,
      meta: `${reqId} · Access revoked`,
      customerId,
    });
    Alert.alert("Rejected", `Request ${reqId} rejected`);
  };

  const handleAddDevice = () => {
    Alert.alert("Simulated Action", "Add new hardware verification device flow is simulated.");
  };

  const renderIcon = (type: "Mobile" | "Laptop" | "Tablet", color: string) => {
    if (type === "Laptop") return <Laptop size={24} color={color} />;
    if (type === "Tablet") return <Tablet size={24} color={color} />;
    return <Smartphone size={24} color={color} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Trusted Devices</Text>
          <Text style={styles.headerSub}>Verify requests via hardware cryptography consent ring</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
          <Plus size={16} color="#09090b" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* INCOMING REQUESTS PANEL */}
        {activeRequests.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <ShieldAlert size={16} color="#f59e0b" />
              <Text style={styles.sectionTitleText}>Incoming Verification Taps</Text>
            </View>

            {activeRequests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <View style={styles.reqCardHeader}>
                  <Text style={styles.reqId}>{r.id}</Text>
                  <Text style={styles.reqTime}>AWAITING CONSENT</Text>
                </View>
                <Text style={styles.reqTypeName}>{r.type}</Text>
                <Text style={styles.reqDescText}>
                  Target: {r.phone} · Origin: {r.location}
                </Text>

                <View style={styles.reqActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnReject}
                    onPress={() => handleReject(r.id, r.type)}
                  >
                    <X size={14} color="#ef4444" />
                    <Text style={styles.actionBtnTextReject}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnApprove}
                    onPress={() => handleApprove(r.id, r.type)}
                  >
                    <Check size={14} color="#ffffff" />
                    <Text style={styles.actionBtnTextApprove}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DEVICES LIST */}
        <View style={styles.grid}>
          {mockDevices.map((d) => (
            <View key={d.id} style={styles.deviceCard}>
              <View style={styles.deviceCardHeader}>
                <View style={styles.iconBox}>{renderIcon(d.type, "#0ea5e9")}</View>
                {d.primary && <Text style={styles.primaryBadge}>PRIMARY</Text>}
              </View>

              <Text style={styles.deviceName}>{d.name}</Text>
              <Text style={styles.deviceModel}>{d.model}</Text>

              <View style={styles.deviceMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>TRUST</Text>
                  <Text style={styles.metricVal}>{d.trustScore}%</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>STATUS</Text>
                  <View style={styles.statusRow}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text style={styles.statusLabelText} numberOfLines={1}>{d.lastActive}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.manageBtn}
                  onPress={() => Alert.alert("Device Management", `Manage parameters for ${d.name}`)}
                >
                  <Text style={styles.manageBtnText}>Manage Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => Alert.alert("Remove Device", "Standard device revocation flow simulated.")}
                >
                  <Trash2 size={16} color="#71717a" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
    justifyContent: "space-between",
    alignItems: "center",
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f59e0b",
  },
  reqCard: {
    backgroundColor: "rgba(245, 158, 11, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reqCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reqId: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#a1a1aa",
  },
  reqTime: {
    fontSize: 9,
    fontWeight: "700",
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
  reqTypeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  reqDescText: {
    fontSize: 12,
    color: "#71717a",
  },
  reqActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  actionBtnReject: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  actionBtnTextReject: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  actionBtnApprove: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  actionBtnTextApprove: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    gap: 16,
  },
  deviceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  deviceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBadge: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#10b981",
    fontWeight: "700",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  deviceModel: {
    fontSize: 12,
    color: "#71717a",
    marginTop: -4,
  },
  deviceMetrics: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 10,
    padding: 10,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 8,
    color: "#52525b",
    fontWeight: "700",
  },
  metricVal: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusLabelText: {
    fontSize: 11,
    color: "#a1a1aa",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  manageBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  manageBtnText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
});
