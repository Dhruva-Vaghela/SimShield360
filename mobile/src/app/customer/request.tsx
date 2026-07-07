import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ShieldAlert, Send } from "lucide-react-native";
import { useSimLock, useRequests, useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getBackendUrl } from "@/lib/api";

const { width } = Dimensions.get("window");

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getLockState } = useSimLock();
  const { locked } = getLockState(user?.id || "cust001");
  const { addRequest } = useRequests();
  const { addEvent } = useTimeline();

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [requestType, setRequestType] = useState<"SIM Swap" | "eSIM Transfer" | "Port-Out" | "SIM Replacement">("SIM Swap");
  const [newPhoneNumber, setNewPhoneNumber] = useState(user?.phone || "");
  const [newSimCardNumber, setNewSimCardNumber] = useState("");
  const [reason, setReason] = useState(
    "I would like to request a new SIM card swap due to upgrading to a new device."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate random SIM card serial on init
  useEffect(() => {
    setNewSimCardNumber("8991" + Math.floor(100000000000000 + Math.random() * 900000000000000).toString());
  }, []);

  const handleSubmit = async () => {
    if (locked) {
      Alert.alert("Request Blocked", "Your SIM Lock Firewall is enabled. Please disable it in the SIM Lock tab before requesting changes.");
      return;
    }

    if (reason.length < 20) {
      Alert.alert("Validation Error", "Please provide a detailed reason (minimum 20 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = getBackendUrl();
      const cleanCurrentPhone = phoneNumber.replace(/[\s\-()]/g, "");
      const cleanNewPhone = newPhoneNumber && newPhoneNumber.trim()
        ? newPhoneNumber.replace(/[\s\-()]/g, "")
        : cleanCurrentPhone;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const res = await fetch(`${url}/swap-requests`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPhoneNumber: cleanCurrentPhone,
          newPhoneNumber: cleanNewPhone,
          newSimCardNumber: newSimCardNumber,
          reason: reason,
          deviceFingerprint: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6", // 32 characters
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        let errMsg = "Failed to submit swap request to database";
        if (json.error) {
          if (json.error.details && json.error.details.fieldErrors) {
            errMsg = Object.entries(json.error.details.fieldErrors)
              .map(([field, msg]) => `${field.replace("body.", "")}: ${msg}`)
              .join(", ");
          } else {
            errMsg = json.error.message || json.error;
          }
        } else if (json.message) {
          errMsg = json.message;
        }
        throw new Error(errMsg);
      }

      const swapRequestId = json.data?.swapRequestId || `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

      const newReq = {
        id: swapRequestId,
        customerName,
        customerId: user?.id || "cust001",
        phone: newPhoneNumber,
        type: requestType,
        riskScore: 12,
        status: "pending" as const,
        createdAt: "Just now",
        location: "Vadodara",
        registeredLocation: "Vadodara",
        deviceChanged: false,
        recentSimChanges: 0,
      };

      addRequest(newReq, true);
      addEvent({
        ts: "Just now",
        kind: "request-blocked",
        message: `${requestType} request created`,
        meta: `${swapRequestId} · Pending Approval`,
        customerId: user?.id,
      });

      Alert.alert("Success", `Request ${swapRequestId} submitted to cloud database!`);
      // Navigate back to customer home dashboard
      router.push("/customer");
    } catch (err: any) {
      Alert.alert("Connection Failure", err.message || "Could not connect to database server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New SIM Request</Text>
        <Text style={styles.headerSub}>Submit verification requests directly to carrier registry</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {locked && (
          <View style={styles.alertCard}>
            <ShieldAlert size={20} color="#ef4444" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>SIM Lock Firewall is Enabled</Text>
              <Text style={styles.alertDesc}>
                You must temporarily disarm the lock before submitting registry requests.
              </Text>
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => router.push("/customer/sim-lock")}
              >
                <Text style={styles.alertBtnText}>Go to SIM Lock Center</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.formCard, locked && styles.formDisabled]}>
          {/* CUSTOMER NAME */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              editable={!locked && !isSubmitting}
              placeholder="e.g. Rahul Patel"
              placeholderTextColor="#52525b"
            />
          </View>

          {/* PHONE NUMBER */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!locked && !isSubmitting}
              placeholder="e.g. +91 98250 12345"
              placeholderTextColor="#52525b"
              keyboardType="phone-pad"
            />
          </View>

          {/* EMAIL */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!locked && !isSubmitting}
              placeholder="e.g. rahul@example.com"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* REQUEST TYPE */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Request Type</Text>
            <View style={styles.selectorRow}>
              {["SIM Swap", "eSIM Transfer", "Port-Out", "SIM Replacement"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.selectorBtn,
                    requestType === t && styles.selectorActive,
                    locked && styles.selectorDisabled,
                  ]}
                  onPress={() => setRequestType(t as any)}
                  disabled={locked || isSubmitting}
                >
                  <Text style={[styles.selectorText, requestType === t && styles.selectorTextActive]}>
                    {t === "eSIM Transfer" ? "eSIM" : t === "SIM Replacement" ? "Replace" : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* NEW PHONE NUMBER */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>New Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newPhoneNumber}
              onChangeText={setNewPhoneNumber}
              editable={!locked && !isSubmitting}
              placeholder="e.g. +91 98250 12345"
              placeholderTextColor="#52525b"
              keyboardType="phone-pad"
            />
          </View>

          {/* NEW SIM SERIAL */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>New SIM Card Serial Number</Text>
            <TextInput
              style={[styles.input, styles.monoInput]}
              value={newSimCardNumber}
              onChangeText={setNewSimCardNumber}
              editable={!locked && !isSubmitting}
              placeholder="8991..."
              placeholderTextColor="#52525b"
            />
          </View>

          {/* REASON */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Reason for Request (Min 20 characters)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={reason}
              onChangeText={setReason}
              editable={!locked && !isSubmitting}
              placeholder="Provide context for swap authorization..."
              placeholderTextColor="#52525b"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (locked || isSubmitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={locked || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#09090b" />
            ) : (
              <>
                <Send size={16} color="#09090b" />
                <Text style={styles.submitBtnText}>Submit Swap Request</Text>
              </>
            )}
          </TouchableOpacity>
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
  alertCard: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  alertContent: {
    flex: 1,
    gap: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  alertDesc: {
    fontSize: 12,
    color: "#a1a1aa",
    lineHeight: 16,
  },
  alertBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  alertBtnText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  formDisabled: {
    opacity: 0.5,
  },
  fieldRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    color: "#ffffff",
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  monoInput: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  textarea: {
    height: 100,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorBtn: {
    width: (width - 60) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  selectorActive: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
  },
  selectorTextActive: {
    color: "#09090b",
  },
  submitBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
  },
  submitBtnText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "700",
  },
});
