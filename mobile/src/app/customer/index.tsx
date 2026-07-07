import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Svg, Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import {
  Shield,
  ShieldAlert,
  Smartphone,
  Lock,
  ArrowUpRight,
  Check,
  X,
  Plus,
} from "lucide-react-native";
import { useSimLock, useRequests, useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const { width } = Dimensions.get("window");

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { getLockState } = useSimLock();
  const { requests, updateRequestStatus } = useRequests();
  const { events, addEvent } = useTimeline();

  const customerId = user?.id || "cust001";
  const { locked, blockedCount } = getLockState(customerId);

  const score = locked ? 96 : 64;
  const risk = locked ? 12 : 48;
  const protectionStatus = locked ? "SECURED" : "VULNERABLE";

  // Filter requests for this customer
  const activeRequests = requests.filter(
    (r) => (r.status === "pending" || r.status === "under-review") && r.customerId === customerId
  );

  const customerEvents = events.filter((ev) => ev.customerId === customerId);

  const handleApprove = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${type} Approved by Customer`,
      meta: `${reqId} · Trusted Device consent`,
      customerId,
    });
  };

  const handleReject = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${type} Rejected by Customer`,
      meta: `${reqId} · Action blocked`,
      customerId,
    });
  };

  // Custom SVG Gauge Renderer
  const renderGauge = (val: number) => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (val / 100) * circ;

    const color = val >= 70 ? "#ef4444" : val >= 35 ? "#f59e0b" : "#10b981";

    return (
      <View style={styles.gaugeWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e1e24"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
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
          <Text style={[styles.gaugeScoreText, { color }]}>{val}%</Text>
          <Text style={styles.gaugeLabelMini}>RISK</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || "Customer"}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push("/customer/request")}
          >
            <Plus size={20} color="#0ea5e9" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATS ROW */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SECURITY SCORE</Text>
            <View style={styles.statRow}>
              <Text style={styles.statVal}>{score}</Text>
              <Text style={styles.statSub}>/100</Text>
            </View>
            <Shield size={16} color="#10b981" style={styles.statIcon} />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PROTECTION STATE</Text>
            <Text style={[styles.statValText, { color: locked ? "#10b981" : "#f59e0b" }]}>
              {protectionStatus}
            </Text>
            <Lock size={16} color={locked ? "#10b981" : "#f59e0b"} style={styles.statIcon} />
          </View>
        </View>

        {/* PENDING AUTHORIZATIONS */}
        {activeRequests.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.pendingHeader}>
              <ShieldAlert size={16} color="#f59e0b" />
              <Text style={styles.pendingHeaderText}>Pending Authorizations</Text>
            </View>

            {activeRequests.map((r) => (
              <View key={r.id} style={styles.requestCard}>
                <View style={styles.reqHeader}>
                  <Text style={styles.reqId}>{r.id}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Awaiting Consent</Text>
                  </View>
                </View>
                <Text style={styles.reqType}>{r.type}</Text>
                <Text style={styles.reqDetail}>
                  Phone: {r.phone} · Location: {r.location}
                </Text>

                <View style={styles.reqActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(r.id, r.type)}
                  >
                    <X size={16} color="#ef4444" />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(r.id, r.type)}
                  >
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RISK GAUGE & METRIC */}
        <View style={styles.gaugeContainerCard}>
          <View style={styles.gaugeCardLeft}>
            <Text style={styles.gaugeTitle}>Live Risk Meter</Text>
            <Text style={styles.gaugeDesc}>
              Real-time threat status evaluated by carrier firewall rules.
            </Text>
          </View>
          {renderGauge(risk)}
        </View>

        {/* SIM LOCK DASHBOARD CARD */}
        <TouchableOpacity
          style={styles.lockCard}
          onPress={() => router.push("/customer/sim-lock")}
        >
          <View style={[styles.lockIconContainer, { backgroundColor: locked ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)" }]}>
            <Shield size={28} color={locked ? "#10b981" : "#f59e0b"} />
          </View>
          <View style={styles.lockCardContent}>
            <Text style={styles.lockCardTitle}>SIM Lock Center</Text>
            <Text style={styles.lockCardStatus}>
              Status: <Text style={{ color: locked ? "#10b981" : "#f59e0b", fontWeight: "700" }}>{locked ? "LOCKED" : "UNLOCKED"}</Text>
            </Text>
            <Text style={styles.lockCardSub}>
              {locked ? "SIM swap firewall armed." : "Firewall in bypass mode."}
            </Text>
          </View>
          <ArrowUpRight size={16} color="#71717a" />
        </TouchableOpacity>

        {/* RECENT ACTIVITY */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {customerEvents.slice(0, 5).map((ev) => (
              <View key={ev.id} style={styles.activityItem}>
                <View style={styles.activityBullet} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{ev.message}</Text>
                  <Text style={styles.activityMeta}>
                    {ev.ts} · {ev.meta}
                  </Text>
                </View>
              </View>
            ))}
            {customerEvents.length === 0 && (
              <Text style={styles.emptyText}>No recent activity logs available.</Text>
            )}
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 12,
    color: "#71717a",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 12,
    padding: 14,
    position: "relative",
  },
  statLabel: {
    fontSize: 9,
    color: "#71717a",
    fontWeight: "700",
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  statVal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  statValText: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 14,
  },
  statSub: {
    fontSize: 12,
    color: "#71717a",
    marginLeft: 2,
  },
  statIcon: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  sectionContainer: {
    gap: 10,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingHeaderText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
  },
  requestCard: {
    backgroundColor: "rgba(245, 158, 11, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  reqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reqId: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    color: "#a1a1aa",
  },
  badge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    color: "#f59e0b",
    fontWeight: "700",
  },
  reqType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  reqDetail: {
    fontSize: 11,
    color: "#71717a",
  },
  reqActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    gap: 6,
  },
  rejectText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    gap: 6,
  },
  approveText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  gaugeContainerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gaugeCardLeft: {
    flex: 1,
    marginRight: 10,
    gap: 6,
  },
  gaugeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  gaugeDesc: {
    fontSize: 11,
    color: "#71717a",
    lineHeight: 15,
  },
  gaugeWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeScoreText: {
    fontSize: 22,
    fontWeight: "800",
  },
  gaugeLabelMini: {
    fontSize: 8,
    color: "#71717a",
    fontWeight: "700",
    letterSpacing: 1,
  },
  lockCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  lockCardContent: {
    flex: 1,
    gap: 4,
  },
  lockCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  lockCardStatus: {
    fontSize: 12,
    color: "#a1a1aa",
  },
  lockCardSub: {
    fontSize: 10,
    color: "#71717a",
  },
  activityCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  activityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0ea5e9",
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityMessage: {
    fontSize: 13,
    color: "#ffffff",
    lineHeight: 18,
  },
  activityMeta: {
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
});
