import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ShieldAlert, ArrowRight, LogOut } from "lucide-react-native";
import { useRequests } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const { width } = Dimensions.get("window");

type TabType = "pending" | "approved" | "rejected" | "blocked" | "disabled";

export default function AgentQueueScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { requests } = useRequests();

  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  // Categorize requests
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "under-review"
  );
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");
  const blockedRequests = requests.filter(
    (r) => r.status === "blocked" && r.riskScore < 90
  );
  const disabledRequests = requests.filter(
    (r) => r.status === "blocked" && r.riskScore >= 90
  );

  const getTabRequests = () => {
    switch (activeTab) {
      case "pending":
        return pendingRequests;
      case "approved":
        return approvedRequests;
      case "rejected":
        return rejectedRequests;
      case "blocked":
        return blockedRequests;
      case "disabled":
        return disabledRequests;
    }
  };

  const filteredRequests = getTabRequests().filter((r) =>
    `${r.id}${r.customerName}${r.phone}`.toLowerCase().includes(q.toLowerCase())
  );

  const stats = [
    { label: "TOTAL INCOMING", val: requests.length, color: "#0ea5e9" },
    { label: "BLOCKED THREATS", val: requests.filter((r) => r.status === "blocked" || r.status === "rejected").length, color: "#10b981" },
    { label: "HIGH RISK VECTOR", val: requests.filter((r) => r.riskScore >= 70).length, color: "#ef4444" },
    { label: "APPROVAL RATE", val: requests.length ? `${Math.round((approvedRequests.length / requests.length) * 100)}%` : "0%", color: "#f59e0b" },
  ];

  const getStatusStyle = (status: string) => {
    if (status === "approved") return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
    if (status === "rejected" || status === "blocked") return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
    return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Operator Attacks Queue</Text>
          <Text style={styles.headerSub}>Telecom Security Intelligence Enforcer Desk</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); router.replace("/"); }}>
          <LogOut size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATS TILES */}
        <View style={styles.statsGrid}>
          {stats.map((s, idx) => (
            <View key={idx} style={styles.statTile}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchCard}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, customer name or phone..."
            placeholderTextColor="#52525b"
            value={q}
            onChangeText={setQ}
          />
        </View>

        {/* HORIZONTAL SCROLLABLE TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {([
            { key: "pending", count: pendingRequests.length },
            { key: "approved", count: approvedRequests.length },
            { key: "rejected", count: rejectedRequests.length },
            { key: "blocked", count: blockedRequests.length },
            { key: "disabled", count: disabledRequests.length },
          ] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.key.toUpperCase()} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BANNERS FOR STATE INFO */}
        {activeTab === "disabled" && (
          <View style={styles.infoBanner}>
            <ShieldAlert size={16} color="#f59e0b" />
            <Text style={styles.infoBannerText}>
              SIM Lock armed requests: Auto-blocked at carrier boundary.
            </Text>
          </View>
        )}

        {/* QUEUE CARDS LIST */}
        <View style={styles.listContainer}>
          {filteredRequests.map((r) => {
            const statusStyle = getStatusStyle(r.status);
            return (
              <View key={r.id} style={styles.reqCard}>
                <View style={styles.reqCardHeader}>
                  <Text style={styles.reqId}>{r.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                      {r.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.reqDetails}>
                  <Text style={styles.customerName}>{r.customerName}</Text>
                  <Text style={styles.phoneText}>MSISDN: {r.phone}</Text>
                  <Text style={styles.vectorText}>Vector: {r.type}</Text>
                </View>

                <View style={styles.reqFooter}>
                  <View style={styles.riskBadge}>
                    <Text style={styles.riskLabel}>RISK SCORE</Text>
                    <Text
                      style={[
                        styles.riskValue,
                        { color: r.riskScore >= 75 ? "#ef4444" : r.riskScore >= 35 ? "#f59e0b" : "#10b981" },
                      ]}
                    >
                      {r.riskScore}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/agent/verification",
                        params: { reqId: r.id },
                      })
                    }
                  >
                    <Text style={styles.reviewBtnText}>Manual Review</Text>
                    <ArrowRight size={14} color="#09090b" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {filteredRequests.length === 0 && (
            <Text style={styles.emptyText}>No requests in this category.</Text>
          )}
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
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    width: (width - 42) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    color: "#71717a",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    height: 44,
    fontSize: 14,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    paddingBottom: 2,
  },
  tabsContent: {
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#ef4444",
  },
  tabBtnText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: "#ef4444",
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    gap: 10,
  },
  infoBannerText: {
    color: "#f59e0b",
    fontSize: 11,
    flex: 1,
  },
  listContainer: {
    gap: 12,
  },
  reqCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  reqCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reqId: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#71717a",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  reqDetails: {
    gap: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  phoneText: {
    fontSize: 12,
    color: "#a1a1aa",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  vectorText: {
    fontSize: 12,
    color: "#a1a1aa",
  },
  reqFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 10,
    marginTop: 4,
  },
  riskBadge: {
    gap: 2,
  },
  riskLabel: {
    fontSize: 8,
    color: "#71717a",
    fontWeight: "700",
  },
  riskValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  reviewBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewBtnText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 12,
    color: "#52525b",
    fontStyle: "italic",
    paddingVertical: 32,
  },
});
