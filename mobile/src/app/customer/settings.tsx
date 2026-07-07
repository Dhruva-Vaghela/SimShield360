import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  User,
  Phone,
  Mail,
  Camera,
  Activity,
  History,
  LogOut,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [faceImage, setFaceImage] = useState(user?.faceImage || "");

  // Camera Settings
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = React.useRef<CameraView | null>(null);

  // Preference Toggles
  const [pushNotification, setPushNotification] = useState(true);
  const [autoBlockGeo, setAutoBlockGeo] = useState(true);
  const [emailWeeklyReport, setEmailWeeklyReport] = useState(false);

  const startCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture a profile baseline photo.");
        return;
      }
    }
    setCameraActive(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        if (photo?.uri) {
          setFaceImage(photo.uri);
          Alert.alert("Captured", "Baseline photo captured successfully!");
          setCameraActive(false);
        }
      } catch (err) {
        Alert.alert("Error", "Could not capture image from camera.");
        console.error(err);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleSave = () => {
    updateProfile({
      name,
      phone,
      email,
      faceImage,
    });
    Alert.alert("Success", "Account preferences saved successfully!");
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Text style={styles.headerSub}>Manage biometric gates and security preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* PROFILE BASICS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Information</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <User size={16} color="#71717a" style={styles.inputIcon} />
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <View style={styles.inputContainer}>
              <Phone size={16} color="#71717a" style={styles.inputIcon} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail size={16} color="#71717a" style={styles.inputIcon} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
        </View>

        {/* BIOMETRIC BASICAL PHOTO CARD */}
        <View style={styles.photoCard}>
          <View style={styles.photoCardLeft}>
            <Text style={styles.cardTitle}>Face Verification Signature</Text>
            <Text style={styles.cardSub}>
              Baseline photo used for biometric matching and liveness gates.
            </Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={startCamera}>
              <Camera size={14} color="#09090b" />
              <Text style={styles.cameraBtnText}>Capture Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            {faceImage ? (
              <Image source={{ uri: faceImage }} style={styles.avatarImage} />
            ) : (
              <Camera size={28} color="#52525b" />
            )}
          </View>
        </View>

        {/* SECURITY PREFERENCES CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security Preferences</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchLabel}>Push Challenge Notification</Text>
              <Text style={styles.switchSub}>Tap to authorize swaps on trusted device</Text>
            </View>
            <Switch
              value={pushNotification}
              onValueChange={setPushNotification}
              trackColor={{ false: "#18181b", true: "#0ea5e9" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchLabel}>Auto-Block Geolocation Anomaly</Text>
              <Text style={styles.switchSub}>Reject any requests from out of home state</Text>
            </View>
            <Switch
              value={autoBlockGeo}
              onValueChange={setAutoBlockGeo}
              trackColor={{ false: "#18181b", true: "#0ea5e9" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchLabel}>Email Weekly Security Report</Text>
              <Text style={styles.switchSub}>Receive audit logs summary directly</Text>
            </View>
            <Switch
              value={emailWeeklyReport}
              onValueChange={setEmailWeeklyReport}
              trackColor={{ false: "#18181b", true: "#0ea5e9" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* SUB NAVIGATION LINKS */}
        <View style={styles.navigationCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push("/customer/timeline")}
          >
            <View style={styles.navRowLeft}>
              <History size={16} color="#0ea5e9" />
              <Text style={styles.navRowText}>Security Timeline</Text>
            </View>
            <ChevronRight size={16} color="#52525b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRow, styles.borderTop]}
            onPress={() => router.push("/customer/analytics")}
          >
            <View style={styles.navRowLeft}>
              <Activity size={16} color="#0ea5e9" />
              <Text style={styles.navRowText}>Threat Analytics</Text>
            </View>
            <ChevronRight size={16} color="#52525b" />
          </TouchableOpacity>
        </View>

        {/* SAVE & LOGOUT BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <ShieldCheck size={16} color="#09090b" />
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Logout Console</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CAMERA CAPTURE MODAL */}
      <Modal visible={cameraActive} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Capture Profile Photo</Text>
              <TouchableOpacity onPress={() => setCameraActive(false)}>
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.cameraBox}>
                <CameraView ref={cameraRef} style={styles.camera} facing="front" />
              </View>

              <TouchableOpacity style={styles.modalBtn} onPress={capturePhoto}>
                {isCapturing ? (
                  <ActivityIndicator color="#09090b" />
                ) : (
                  <Text style={styles.modalBtnText}>Capture baseline photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
    paddingBottom: 8,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: "#71717a",
    lineHeight: 14,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    height: 40,
    fontSize: 14,
  },
  photoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoCardLeft: {
    flex: 1,
    marginRight: 16,
    gap: 8,
  },
  cameraBtn: {
    flexDirection: "row",
    backgroundColor: "#0ea5e9",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  cameraBtnText: {
    color: "#09090b",
    fontSize: 11,
    fontWeight: "700",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  switchCol: {
    flex: 1,
    paddingRight: 10,
  },
  switchLabel: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  switchSub: {
    fontSize: 10,
    color: "#52525b",
    marginTop: 2,
  },
  navigationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 14,
    paddingVertical: 4,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navRowText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 10,
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  saveBtnText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  logoutBtnText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  // Modal Camera
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: width * 0.9,
    backgroundColor: "#0d0d11",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  cameraBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.3)",
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  modalBtn: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
});
