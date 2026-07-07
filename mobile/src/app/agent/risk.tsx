import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRequests } from "@/lib/store";

const { width } = Dimensions.get("window");

export default function AgentRiskScreen() {
  const { requests } = useRequests();

  const avg = requests.length
    ? Math.round(requests.reduce((s, r) => s + r.riskScore, 0) / requests.length)
    : 0;

  const lowCount = requests.filter((r) => r.riskScore < 31).length;
  const medCount = requests.filter((r) => r.riskScore >= 31 && r.riskScore < 71).length;
  const highCount = requests.filter((r) => r.riskScore >= 71).length;
  const maxCount = Math.max(lowCount, medCount, highCount, 1);

  // Risk weights state simulation
  const [signals, setSignals] = useState([
    { signal: "Geolocation Mismatch", score: 72, desc: "Distance from home state carrier node" },
    { signal: "Device Fingerprint", score: 65, desc: "IMEI/device changes from baseline" },
    { signal: "Attempt Velocity", score: 48, desc: "Frequency of requests within 24h" },
    { signal: "Port-out History", score: 58, desc: "Carrier migration attempts count" },
    { signal: "Identity Verification", score: 30, desc: "TOTP and device consent confirmations" },
    { signal: "Network Routing", score: 40, desc: "Request sent via Tor VPN endpoint" },
  ]);

  const renderGauge = (val: number) => {
    const size = 130;
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
          <Text style={[styles.gaugeScoreText, { color }]}>{val}%</Text>
          <Text style={styles.gaugeLabelMini}>AVG RISK</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Risk Scoring Analysis</Text>
        <Text style={styles.headerSub}>Customize risk signal weights and view queue distributions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ROW: AVERAGE AND BANDS */}
        <View style={styles.doubleCardsRow}>
          {/* AVERAGE GAUGE */}
          <View style={styles.gaugeCard}>
            <Text style={styles.cardTitleMini}>Average Risk</Text>
            {renderGauge(avg)}
          </View>

          {/* DISTRIBUTION BANDS */}
          <View style={styles.distCard}>
            <Text style={styles.cardTitleMini}>Risk Bands</Text>
            
            <View style={styles.bandRow}>
              <View style={styles.bandHeader}>
                <Text style={styles.bandLabel}>Low (0-30)</Text>
                <Text style={styles.bandCount}>{lowCount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(lowCount / maxCount) * 100}%`, backgroundColor: "#10b981" }]} />
              </View>
            </View>

            <View style={styles.bandRow}>
              <View style={styles.bandHeader}>
                <Text style={styles.bandLabel}>Med (31-70)</Text>
                <Text style={styles.bandCount}>{medCount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(medCount / maxCount) * 100}%`, backgroundColor: "#f59e0b" }]} />
              </View>
            </View>

            <View style={styles.bandRow}>
              <View style={styles.bandHeader}>
                <Text style={styles.bandLabel}>High (71+)</Text>
                <Text style={styles.bandCount}>{highCount}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(highCount / maxCount) * 100}%`, backgroundColor: "#ef4444" }]} />
              </View>
            </View>
          </View>
        </View>

        {/* RISK SIGNALS WEIGHT ENGINE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scoring Engine Weights</Text>
          <Text style={styles.cardSub}>
            Signal sensitivity thresholds evaluated by neural decision engines.
          </Text>

          <View style={styles.signalsList}>
            {signals.map((sig, idx) => (
              <View key={idx} style={styles.sigRow}>
                <View style={styles.sigHeader}>
                  <View style={styles.sigTextContainer}>
                    <Text style={styles.sigName}>{sig.signal}</Text>
                    <Text style={styles.sigDesc}>{sig.desc}</Text>
                  </View>
                  <Text
                    style={[
                      styles.sigVal,
                      { color: sig.score >= 70 ? "#ef4444" : sig.score >= 40 ? "#f59e0b" : "#10b981" },
                    ]}
                  >
                    {sig.score}
                  </Text>
                </View>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      {
                        width: `${sig.score}%`,
                        backgroundColor: sig.score >= 70 ? "#ef4444" : sig.score >= 40 ? "#f59e0b" : "#10b981",
                      },
                    ]}
                  />
                </View>
              </View>
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
  doubleCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  distCard: {
    flex: 1.3,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTitleMini: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 6,
    marginBottom: 10,
    width: "100%",
  },
  gaugeWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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
  },
  bandRow: {
    gap: 4,
    marginBottom: 6,
  },
  bandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bandLabel: {
    fontSize: 10,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  bandCount: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
    marginBottom: 16,
  },
  signalsList: {
    gap: 14,
  },
  sigRow: {
    gap: 6,
  },
  sigHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sigTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  sigName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  sigDesc: {
    fontSize: 10,
    color: "#52525b",
    marginTop: 2,
  },
  sigVal: {
    fontSize: 16,
    fontWeight: "800",
  },
  sliderTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
});
