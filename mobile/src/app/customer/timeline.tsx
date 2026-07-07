import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react-native";
import { useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const ICONS: Record<string, React.ComponentType<any>> = {
  "lock-enabled": Shield,
  "lock-disabled": ShieldAlert,
  "unlock-failed": XCircle,
  "unlock-success": CheckCircle2,
  "request-blocked": ShieldAlert,
  "device-added": Plus,
  "device-removed": Trash2,
};

const COLORS: Record<string, string> = {
  "lock-enabled": "#10b981",
  "lock-disabled": "#f59e0b",
  "unlock-failed": "#ef4444",
  "unlock-success": "#10b981",
  "request-blocked": "#ef4444",
  "device-added": "#0ea5e9",
  "device-removed": "#71717a",
};

export default function CustomerTimelineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { events } = useTimeline();

  const customerId = user?.id || "cust001";
  const customerEvents = events.filter((ev) => ev.customerId === customerId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#71717a" />
          <Text style={styles.backBtnText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Timeline</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Security Audit Logs</Text>
          <Text style={styles.cardSub}>
            Deterministic firewall activity and credential gates logs.
          </Text>

          <View style={styles.timelineList}>
            {customerEvents.map((ev, i) => {
              const IconComponent = ICONS[ev.kind] || Shield;
              const color = COLORS[ev.kind] || "#a1a1aa";

              return (
                <View key={ev.id} style={styles.timelineItem}>
                  {/* Left line & bullet */}
                  <View style={styles.lineCol}>
                    <View style={[styles.bulletCircle, { borderColor: color }]}>
                      <IconComponent size={12} color={color} />
                    </View>
                    {i < customerEvents.length - 1 && <View style={styles.connectingLine} />}
                  </View>

                  {/* Content details */}
                  <View style={styles.contentCol}>
                    <Text style={styles.messageText}>{ev.message}</Text>
                    <Text style={styles.metaText}>
                      {ev.ts} · {ev.meta}
                    </Text>
                  </View>
                </View>
              );
            })}

            {customerEvents.length === 0 && (
              <Text style={styles.emptyText}>No security logs registered.</Text>
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
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
    marginBottom: 20,
  },
  timelineList: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 64,
  },
  lineCol: {
    alignItems: "center",
    width: 32,
  },
  bulletCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#0d0d11",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  connectingLine: {
    flex: 1,
    width: 1,
    backgroundColor: "#1e1e24",
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
    gap: 4,
  },
  messageText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
    lineHeight: 18,
  },
  metaText: {
    fontSize: 11,
    color: "#71717a",
  },
  emptyText: {
    fontSize: 12,
    color: "#52525b",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
});
