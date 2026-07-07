import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { ArrowLeft, TrendingUp, AlertCircle, ShieldCheck, Activity } from "lucide-react-native";
import { riskTrend, verificationStats, requestTypeDist } from "@/lib/mock-data";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;
const CHART_HEIGHT = 120;

export default function CustomerAnalyticsScreen() {
  const router = useRouter();

  // 1. Render Risk Trend Custom Area Chart (SVG)
  const renderRiskTrendChart = () => {
    if (riskTrend.length === 0) return null;
    
    // Map data points
    const points = riskTrend.map((d, i) => {
      const x = (i / (riskTrend.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - (d.risk / 100) * (CHART_HEIGHT - 20) - 10;
      return { x, y };
    });

    // Create path string
    const dPath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    // Create fill path (closing the path to the bottom corners)
    const fillPath = `${dPath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    return (
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0ea5e9" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Fill */}
          <Path d={fillPath} fill="url(#riskGrad)" />
          {/* Line */}
          <Path d={dPath} stroke="#0ea5e9" strokeWidth="2.5" fill="none" />
          {/* Data Dots for key points */}
          {points.map((p, idx) => (
            idx % 3 === 0 && (
              <Circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#0ea5e9" stroke="#09090b" strokeWidth="1" />
            )
          ))}
        </Svg>
        {/* X Axis Labels */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.axisLabel}>Day 1</Text>
          <Text style={styles.axisLabel}>Day 7</Text>
          <Text style={styles.axisLabel}>Day 14</Text>
        </View>
      </View>
    );
  };

  // 2. Render Verification Success Line Chart (SVG)
  const renderVerificationChart = () => {
    if (verificationStats.length === 0) return null;

    const points = verificationStats.map((d, i) => {
      const x = (i / (verificationStats.length - 1)) * CHART_WIDTH;
      // success scale from 80% to 100%
      const percentage = Math.max(80, Math.min(100, d.success));
      const y = CHART_HEIGHT - ((percentage - 80) / 20) * (CHART_HEIGHT - 30) - 15;
      return { x, y, name: d.name, val: d.success };
    });

    const dPath = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    return (
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Path d={dPath} stroke="#10b981" strokeWidth="2" fill="none" />
          {points.map((p, idx) => (
            <React.Fragment key={idx}>
              <Circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#09090b" strokeWidth="1.5" />
            </React.Fragment>
          ))}
        </Svg>
        {/* X Axis Labels */}
        <View style={styles.xAxisLabels}>
          {points.map((p, idx) => (
            <Text key={idx} style={styles.axisLabel}>{p.name}</Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#71717a" />
          <Text style={styles.backBtnText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Threat Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* RISK TREND CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp size={16} color="#0ea5e9" />
            <Text style={styles.cardTitle}>Risk Score Trend (14d)</Text>
          </View>
          <Text style={styles.cardSub}>Composite daily evaluation score history.</Text>
          {renderRiskTrendChart()}
        </View>

        {/* FRAUD ATTEMPTS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.cardTitle}>Blocked Fraud Attempts (14d)</Text>
          </View>
          <Text style={styles.cardSub}>Volume of intercepted hijackings.</Text>
          
          {/* Simple HTML/CSS-like native bars chart */}
          <View style={styles.barChartContainer}>
            <View style={styles.barsRow}>
              {riskTrend.slice(-7).map((d, idx) => {
                const maxAttempts = 6;
                const percent = (d.attempts / maxAttempts) * 100;
                return (
                  <View key={idx} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${percent}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* VERIFICATION SUCCESS RATE CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={16} color="#10b981" />
            <Text style={styles.cardTitle}>Verification Success Rate</Text>
          </View>
          <Text style={styles.cardSub}>Success verification percentage across modules (80% - 100%).</Text>
          {renderVerificationChart()}
        </View>

        {/* REQUEST TYPE DISTRIBUTION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={16} color="#a855f7" />
            <Text style={styles.cardTitle}>Request Vector Distribution</Text>
          </View>
          <Text style={styles.cardSub}>Breakdown of requests by transaction kind.</Text>

          <View style={styles.distributionList}>
            {requestTypeDist.map((item, idx) => {
              const colors = ["#0ea5e9", "#10b981", "#f59e0b", "#a855f7"];
              const color = colors[idx % colors.length];
              return (
                <View key={idx} style={styles.distRow}>
                  <View style={styles.distRowLeft}>
                    <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                    <Text style={styles.distName}>{item.name}</Text>
                  </View>
                  <View style={styles.distRowRight}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${item.value}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.distVal}>{item.value}%</Text>
                  </View>
                </View>
              );
            })}
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
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  chartWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: CHART_WIDTH,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  axisLabel: {
    fontSize: 9,
    color: "#52525b",
    fontWeight: "600",
  },
  // Bar Chart styling
  barChartContainer: {
    height: 140,
    marginTop: 10,
    justifyContent: "center",
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 9,
    color: "#52525b",
    fontWeight: "700",
  },
  // Dist breakdown
  distributionList: {
    gap: 12,
  },
  distRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distName: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  distRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    width: 100,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  distVal: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "700",
    width: 32,
    textAlign: "right",
  },
});
