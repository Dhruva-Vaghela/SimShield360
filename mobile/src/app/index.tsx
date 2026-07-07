import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Shield,
  Lock,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Skull,
  Zap,
  Activity,
  UserCheck,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();

  const enterAs = (role: "customer" | "agent") => {
    // Navigate to unified login screen with query param or store it in state
    router.push({
      pathname: "/login",
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Shield size={20} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.logoText}>
                SIMShield <Text style={styles.logoHighlight}>360</Text>
              </Text>
              <Text style={styles.logoSub}>AUTHORIZATION FIREWALL</Text>
            </View>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>7-LAYER ENFORCEMENT FIREWALL</Text>
          </View>

          <Text style={styles.heroTitle}>
            Prevent SIM Swap Fraud{"\n"}
            <Text style={styles.heroGradient}>before it happens.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            SIMShield 360 is a telecom-grade authorization firewall that locks SIM swap, eSIM transfer and
            port-out requests behind seven independent security layers.
          </Text>

          {/* QUICK LINKS BUTTONS */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => enterAs("customer")}>
              <Text style={styles.primaryButtonText}>Customer Console</Text>
              <UserCheck size={18} color="#09090b" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => enterAs("agent")}>
              <Text style={styles.secondaryButtonText}>Telecom Agent Console</Text>
              <ArrowRight size={18} color="#ffffff" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => router.push("/simulator")}
            >
              <Text style={styles.dangerButtonText}>Threat Simulator</Text>
              <Skull size={18} color="#ef4444" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>


        {/* KEY PROTECTION LAYERS */}
        <View style={styles.layersSection}>
          <Text style={styles.sectionEyebrow}>DEFENSE IN DEPTH</Text>
          <Text style={styles.sectionTitle}>Built-in Protection</Text>
          <Text style={styles.sectionDesc}>
            Our multi-layer system creates independent permission gates between hijackers and customer telephone numbers.
          </Text>

          <View style={styles.layersList}>
            <View style={styles.layerCard}>
              <View style={[styles.layerIconContainer, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                <Lock size={20} color="#10b981" />
              </View>
              <View style={styles.layerCardContent}>
                <Text style={styles.layerName}>SIM Lock Firewall</Text>
                <Text style={styles.layerDesc}>
                  Customer-controlled hardware lock armed from registered device.
                </Text>
              </View>
            </View>

            <View style={styles.layerCard}>
              <View style={[styles.layerIconContainer, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                <Smartphone size={20} color="#0ea5e9" />
              </View>
              <View style={styles.layerCardContent}>
                <Text style={styles.layerName}>Biometrics & Trusted Devices</Text>
                <Text style={styles.layerDesc}>
                  Verification requires liveness matching and push authorization.
                </Text>
              </View>
            </View>

            <View style={styles.layerCard}>
              <View style={[styles.layerIconContainer, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <ShieldCheck size={20} color="#ef4444" />
              </View>
              <View style={styles.layerCardContent}>
                <Text style={styles.layerName}>Telecom Intelligence</Text>
                <Text style={styles.layerDesc}>
                  Risk evaluation tracking location data, ISP details and device swap trends.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footerText}>
          SIMShield 360 · Production Mobile App · v3.2
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  logoHighlight: {
    color: "#0ea5e9",
  },
  logoSub: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "flex-start",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    color: "#a1a1aa",
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 40,
    letterSpacing: -1,
  },
  heroGradient: {
    color: "#0ea5e9",
  },
  heroDescription: {
    fontSize: 15,
    color: "#a1a1aa",
    marginTop: 15,
    lineHeight: 22,
  },
  ctaContainer: {
    width: "100%",
    marginTop: 30,
    gap: 12,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#1c1c1f",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e2e33",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  dangerButton: {
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0ea5e9",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 5,
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 14,
    color: "#a1a1aa",
    lineHeight: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 15,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "#71717a",
    lineHeight: 14,
  },
  layersSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
  },
  layersList: {
    gap: 12,
    marginTop: 15,
  },
  layerCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 16,
  },
  layerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  layerCardContent: {
    flex: 1,
  },
  layerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  layerDesc: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 4,
    lineHeight: 16,
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: "#3f3f46",
    marginTop: 40,
  },
});
