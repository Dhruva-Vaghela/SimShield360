import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRequests } from "@/lib/store";

export default function AgentAuditLogsScreen() {
  const { requests } = useRequests();

  const logs = requests.flatMap((r, i) => [
    { ts: r.createdAt, actor: "system", action: `Workflow initialized for ${r.id}`, level: "info" as const },
    { ts: r.createdAt, actor: "risk-engine", action: `Risk compiled: ${r.riskScore}%`, level: r.riskScore >= 75 ? "warn" as const : "info" as const },
    { ts: r.createdAt, actor: r.status === "blocked" ? "sim-lock" : "agent001", action: `Decision override: ${r.status.toUpperCase()}`, level: r.status === "approved" ? "ok" as const : r.status === "blocked" ? "warn" as const : "err" as const },
  ]);

  const getLevelStyle = (level: string) => {
    if (level === "ok") return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
    if (level === "warn") return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
    if (level === "err") return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
    return { color: "#71717a", bg: "rgba(255, 255, 255, 0.05)" };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registry Audit Logs</Text>
        <Text style={styles.headerSub}>Immutable ledger of operator overrides and decision verifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logsList}>
          {logs.map((l, i) => {
            const levelStyle = getLevelStyle(l.level);
            return (
              <View key={i} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTime}>{l.ts}</Text>
                  <View style={[styles.badge, { backgroundColor: levelStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: levelStyle.color }]}>
                      {l.level.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.logAction}>{l.action}</Text>
                
                <View style={styles.logFooter}>
                  <Text style={styles.actorLabel}>ACTOR: </Text>
                  <Text style={styles.actorName}>{l.actor}</Text>
                </View>
              </View>
            );
          })}

          {logs.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No audit activity logged.</Text>
            </View>
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
    gap: 12,
    paddingBottom: 40,
  },
  logsList: {
    gap: 10,
  },
  logCard: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logTime: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#71717a",
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  logAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 18,
  },
  logFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.03)",
    paddingTop: 6,
    marginTop: 2,
  },
  actorLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#52525b",
  },
  actorName: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#0ea5e9",
    fontWeight: "600",
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
});
