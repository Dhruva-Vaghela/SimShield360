import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Shield,
  Mail,
  Lock,
  Camera,
  KeyRound,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react-native";
import { useAuth, type MockUser } from "@/lib/auth";
import { verifyTOTP, generateTOTPSecret } from "@/lib/totp";

const { width } = Dimensions.get("window");

type LoginStage = "credentials" | "biometric" | "totp" | "success";
type RegisterStage = "fields" | "biometric" | "totp" | "success";

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { getCustomers, loginAsUser, loginAs } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [permission, requestPermission] = useCameraPermissions();

  // Pre-configure tab based on param
  useEffect(() => {
    if (role === "customer" || role === "agent") {
      setActiveTab("login");
      if (role === "agent") {
        setLoginEmail("amit.sharma@telecom.in");
        setLoginPassword("password123");
      } else {
        setLoginEmail("rahul.patel@example.com");
        setLoginPassword("password123");
      }
    }
  }, [role]);

  // --- LOGIN STATES ---
  const [loginStage, setLoginStage] = useState<LoginStage>("credentials");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [targetUser, setTargetUser] = useState<Omit<MockUser, "token"> | null>(null);
  const [loginTotpCode, setLoginTotpCode] = useState("");
  const [loginFaceVerifying, setLoginFaceVerifying] = useState(false);
  const [loginTotpVerifying, setLoginTotpVerifying] = useState(false);

  // --- REGISTER STATES ---
  const [regStage, setRegStage] = useState<RegisterStage>("fields");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFaceImage, setRegFaceImage] = useState("");
  const [regTotpSecret, setRegTotpSecret] = useState("");
  const [regTotpCode, setRegTotpCode] = useState("");
  const [regTotpVerifying, setRegTotpVerifying] = useState(false);

  // --- CAMERA ACTION STATES ---
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const startCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Required", "Camera access is needed for facial liveness biometrics.");
        return;
      }
    }
    setCameraActive(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        if (photo?.uri) {
          if (activeTab === "register") {
            setRegFaceImage(photo.uri);
            Alert.alert("Captured", "Facial baseline photo saved!");
          }
          setCameraActive(false);
        }
      } catch (err) {
        Alert.alert("Error", "Could not capture image from camera.");
        console.error(err);
      }
    }
  };

  // --- LOGIN HANDLERS ---
  const handleCredentialsSubmit = () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    if (loginEmail === "amit.sharma@telecom.in" && loginPassword === "password123") {
      loginAs("telecom-agent");
      Alert.alert("Success", "Agent authenticated. Welcome back!");
      router.replace("/agent");
      return;
    }

    const customers = getCustomers();
    const found = customers.find(
      (c) => c.email?.toLowerCase() === loginEmail.toLowerCase()
    );

    if (!found || found.password !== loginPassword) {
      Alert.alert("Error", "Invalid email or password.");
      return;
    }

    setTargetUser(found);
    setLoginStage("biometric");
  };

  const handleLoginFaceVerify = async () => {
    setLoginFaceVerifying(true);
    // Simulate complex neural liveness classification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoginFaceVerifying(false);

    Alert.alert("Identity Confirmed", "Liveness match verified. Identity confirmed!");
    setCameraActive(false);
    
    if (targetUser?.totpSecret) {
      setLoginStage("totp");
    } else {
      completeCustomerLogin(targetUser!);
    }
  };

  const handleLoginFaceBypass = () => {
    setCameraActive(false);
    if (targetUser?.totpSecret) {
      setLoginStage("totp");
    } else {
      completeCustomerLogin(targetUser!);
    }
  };

  const handleLoginTotpVerify = async () => {
    if (loginTotpCode.length !== 6 || !/^\d+$/.test(loginTotpCode)) {
      Alert.alert("Invalid Input", "Please enter a valid 6-digit TOTP code.");
      return;
    }

    setLoginTotpVerifying(true);
    const secret = targetUser?.totpSecret || "JBSWY3DPEHPK3PXP";
    const isValid = await verifyTOTP(loginTotpCode, secret);
    setLoginTotpVerifying(false);

    if (isValid) {
      completeCustomerLogin(targetUser!);
    } else {
      Alert.alert("Verification Failed", "Invalid code. Please check your authenticator.");
    }
  };

  const completeCustomerLogin = (profile: Omit<MockUser, "token">) => {
    setLoginStage("success");
    loginAsUser(profile);
    setTimeout(() => {
      router.replace("/customer");
    }, 1200);
  };

  // --- REGISTER HANDLERS ---
  const handleRegisterFieldsSubmit = () => {
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      Alert.alert("Missing Fields", "Please populate all registration fields.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (regPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setRegStage("biometric");
  };

  const handleRegFaceSubmit = () => {
    if (!regFaceImage) {
      Alert.alert("Error", "Please capture or upload a face baseline photo.");
      return;
    }
    const secret = generateTOTPSecret();
    setRegTotpSecret(secret);
    setRegStage("totp");
  };

  const handleRegTotpVerify = async () => {
    if (regTotpCode.length !== 6 || !/^\d+$/.test(regTotpCode)) {
      Alert.alert("Invalid Input", "Please enter a valid 6-digit confirmation code.");
      return;
    }

    setRegTotpVerifying(true);
    const isValid = await verifyTOTP(regTotpCode, regTotpSecret);

    if (isValid) {
      try {
        const { registerCustomer } = useAuth.getState();
        const newCust = await registerCustomer(
          regName,
          regPhone,
          regEmail,
          regPassword,
          regFaceImage,
          regTotpSecret
        );

        setRegStage("success");
        setTimeout(() => {
          loginAsUser(newCust);
          router.replace("/customer");
        }, 1200);
      } catch (err: any) {
        Alert.alert("Registration Error", err.message || "Failed to register account on database server.");
      } finally {
        setRegTotpVerifying(false);
      }
    } else {
      setRegTotpVerifying(false);
      Alert.alert("OTP Failed", "Invalid code. Please scan the QR code and confirm the token.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* HEADER */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
            <ArrowLeft size={16} color="#71717a" />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <View style={styles.logoIcon}>
              <Shield size={24} color="#0ea5e9" />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>
                SIMShield <Text style={styles.logoHighlight}>360</Text>
              </Text>
              <Text style={styles.logoSub}>AUTHORIZATION FIREWALL</Text>
            </View>
          </View>

          {/* MAIN CARD */}
          <View style={styles.card}>
            {/* TAB SELECTOR */}
            {((activeTab === "login" && loginStage === "credentials") ||
              (activeTab === "register" && regStage === "fields")) && (
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "login" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("login")}
                >
                  <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "register" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("register")}
                >
                  <Text style={[styles.tabText, activeTab === "register" && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TAB BODY */}
            {activeTab === "login" ? (
              // SIGN IN TAB
              <View>
                {loginStage === "credentials" && (
                  <View style={styles.formContainer}>
                    <Text style={styles.cardTitle}>Secure Access</Text>
                    <Text style={styles.cardSub}>Provide credentials to enter verification.</Text>

                    <View style={styles.inputContainer}>
                      <Mail size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#52525b"
                        value={loginEmail}
                        onChangeText={setLoginEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Lock size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                        autoCapitalize="none"
                      />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleCredentialsSubmit}>
                      <Text style={styles.submitButtonText}>Authenticate Credentials</Text>
                      <ArrowRight size={16} color="#09090b" style={styles.submitButtonIcon} />
                    </TouchableOpacity>

                    {/* QUICK DEMO PROFILES */}
                    <View style={styles.quickAccess}>
                      <Text style={styles.quickAccessTitle}>QUICK DEMO PROFILES</Text>
                      <View style={styles.quickAccessButtons}>
                        <TouchableOpacity
                          style={styles.quickButton}
                          onPress={() => {
                            setLoginEmail("rahul.patel@example.com");
                            setLoginPassword("password123");
                          }}
                        >
                          <Text style={styles.quickButtonText}>Rahul Patel (Cust)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickButton}
                          onPress={() => {
                            setLoginEmail("amit.sharma@telecom.in");
                            setLoginPassword("password123");
                          }}
                        >
                          <Text style={styles.quickButtonText}>Amit Sharma (Agent)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {loginStage === "biometric" && (
                  <View style={styles.cameraWrapper}>
                    <Text style={styles.cardTitle}>Liveness Verification</Text>
                    <Text style={styles.cardSub}>Verify your baseline facial biometric signature.</Text>

                    <View style={styles.cameraViewContainer}>
                      {cameraActive ? (
                        <CameraView
                          ref={cameraRef}
                          style={styles.camera}
                          facing="front"
                        />
                      ) : (
                        <View style={styles.cameraPlaceholder}>
                          {targetUser?.faceImage ? (
                            <Image
                              source={{ uri: targetUser.faceImage }}
                              style={styles.baselineImage}
                            />
                          ) : (
                            <Camera size={44} color="#3f3f46" />
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.cameraControls}>
                      {!cameraActive ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={startCamera}>
                          <Text style={styles.primaryButtonText}>Activate Camera</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.successButton} onPress={handleLoginFaceVerify}>
                          {loginFaceVerifying ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.successButtonText}>Scan & Confirm Identity</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity style={styles.linkButton} onPress={handleLoginFaceBypass}>
                        <Text style={styles.linkButtonText}>Bypass Biometrics (Demo Mode)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {loginStage === "totp" && (
                  <View style={styles.formContainer}>
                    <Text style={styles.cardTitle}>Authenticator Token</Text>
                    <Text style={styles.cardSub}>Input the 6-digit TOTP code associated with your profile.</Text>

                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor="#27272a"
                      maxLength={6}
                      keyboardType="numeric"
                      value={loginTotpCode}
                      onChangeText={setLoginTotpCode}
                    />

                    {/* SECRET DISPLAY PANEL FOR DEMO CONVENIENCE */}
                    <View style={styles.otpHelper}>
                      <Text style={styles.otpHelperTitle}>Authenticator Setup Key</Text>
                      <Text style={styles.otpSecretKey}>
                        {targetUser?.totpSecret || "JBSWY3DPEHPK3PXP"}
                      </Text>
                      <Text style={styles.otpHelperSub}>
                        Input this secret manually into your Google Authenticator or use bypass codes (e.g. 000000) for testing.
                      </Text>
                    </View>

                    <View style={styles.doubleButtons}>
                      <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => setLoginStage("biometric")}
                      >
                        <Text style={styles.outlineButtonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleLoginTotpVerify}
                        disabled={loginTotpVerifying}
                      >
                        {loginTotpVerifying ? (
                          <ActivityIndicator color="#09090b" />
                        ) : (
                          <Text style={styles.confirmButtonText}>Verify Token</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {loginStage === "success" && (
                  <View style={styles.successContainer}>
                    <CheckCircle2 size={64} color="#10b981" />
                    <Text style={styles.successTitle}>Authentication Passed</Text>
                    <Text style={styles.successSub}>Redirecting to Customer Console...</Text>
                  </View>
                )}
              </View>
            ) : (
              // SIGN UP TAB
              <View>
                {regStage === "fields" && (
                  <View style={styles.formContainer}>
                    <Text style={styles.cardTitle}>Create Account</Text>
                    <Text style={styles.cardSub}>Setup details to register your SIMShield license.</Text>

                    <View style={styles.inputContainer}>
                      <User size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#52525b"
                        value={regName}
                        onChangeText={setRegName}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Mail size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#52525b"
                        value={regEmail}
                        onChangeText={setRegEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Phone size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number (e.g. +91 98250 12345)"
                        placeholderTextColor="#52525b"
                        value={regPhone}
                        onChangeText={setRegPhone}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Lock size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={regPassword}
                        onChangeText={setRegPassword}
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Lock size={16} color="#71717a" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#52525b"
                        secureTextEntry
                        value={regConfirmPassword}
                        onChangeText={setRegConfirmPassword}
                        autoCapitalize="none"
                      />
                    </View>

                    <TouchableOpacity style={styles.submitButton} onPress={handleRegisterFieldsSubmit}>
                      <Text style={styles.submitButtonText}>Continue to Biometrics</Text>
                      <ArrowRight size={16} color="#09090b" style={styles.submitButtonIcon} />
                    </TouchableOpacity>
                  </View>
                )}

                {regStage === "biometric" && (
                  <View style={styles.cameraWrapper}>
                    <Text style={styles.cardTitle}>Register Face Baseline</Text>
                    <Text style={styles.cardSub}>Capture a baseline photo to bind your facial signature.</Text>

                    <View style={styles.cameraViewContainer}>
                      {cameraActive ? (
                        <CameraView
                          ref={cameraRef}
                          style={styles.camera}
                          facing="front"
                        />
                      ) : (
                        <View style={styles.cameraPlaceholder}>
                          {regFaceImage ? (
                            <Image
                              source={{ uri: regFaceImage }}
                              style={styles.baselineImage}
                            />
                          ) : (
                            <User size={44} color="#3f3f46" />
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.cameraControls}>
                      {!cameraActive ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={startCamera}>
                          <Text style={styles.primaryButtonText}>Start Front Camera</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.successButton} onPress={capturePhoto}>
                          <Text style={styles.successButtonText}>Capture Photo</Text>
                        </TouchableOpacity>
                      )}

                      <View style={styles.doubleButtons}>
                        <TouchableOpacity
                          style={styles.outlineButton}
                          onPress={() => setRegStage("fields")}
                        >
                          <Text style={styles.outlineButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmButton, !regFaceImage && styles.disabledButton]}
                          onPress={handleRegFaceSubmit}
                          disabled={!regFaceImage}
                        >
                          <Text style={styles.confirmButtonText}>Continue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {regStage === "totp" && (
                  <View style={styles.formContainer}>
                    <Text style={styles.cardTitle}>Link Authenticator App</Text>
                    <Text style={styles.cardSub}>Input the manual key, or scan the QR configuration key below.</Text>

                    <View style={styles.qrSection}>
                      <View style={styles.qrImageContainer}>
                        <Image
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=otpauth%3A%2F%2Ftotp%2FSIMShield%3A${encodeURIComponent(regEmail)}%3Fsecret%3D${regTotpSecret}%26issuer%3DSIMShield`
                          }}
                          style={styles.qrImage}
                        />
                      </View>
                      <View style={styles.secretPanel}>
                        <Text style={styles.secretLabel}>Manual Entry Secret</Text>
                        <Text style={styles.secretText}>{regTotpSecret}</Text>
                      </View>
                    </View>

                    <View style={styles.otpInputPanel}>
                      <Text style={styles.otpLabel}>Enter Generated 6-Digit Code</Text>
                      <TextInput
                        style={styles.otpInputMini}
                        placeholder="000000"
                        placeholderTextColor="#27272a"
                        maxLength={6}
                        keyboardType="numeric"
                        value={regTotpCode}
                        onChangeText={setRegTotpCode}
                      />
                    </View>

                    <View style={styles.doubleButtons}>
                      <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => setRegStage("biometric")}
                      >
                        <Text style={styles.outlineButtonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleRegTotpVerify}
                        disabled={regTotpVerifying}
                      >
                        {regTotpVerifying ? (
                          <ActivityIndicator color="#09090b" />
                        ) : (
                          <Text style={styles.confirmButtonText}>Complete Setup</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {regStage === "success" && (
                  <View style={styles.successContainer}>
                    <CheckCircle2 size={64} color="#10b981" />
                    <Text style={styles.successTitle}>Registration Complete</Text>
                    <Text style={styles.successSub}>Setting up your profile console...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    color: "#71717a",
    marginLeft: 6,
    fontSize: 14,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoTextContainer: {
    alignItems: "flex-start",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  logoHighlight: {
    color: "#0ea5e9",
  },
  logoSub: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "#1e1e24",
    borderRadius: 16,
    padding: 20,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#0ea5e9",
  },
  tabText: {
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#09090b",
  },
  formContainer: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  cardSub: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    height: 48,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  submitButtonIcon: {
    marginLeft: 6,
  },
  quickAccess: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1e1e24",
    alignItems: "center",
  },
  quickAccessTitle: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  quickAccessButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    width: "100%",
  },
  quickButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  quickButtonText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
  },
  cameraWrapper: {
    alignItems: "center",
    gap: 12,
  },
  cameraViewContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(14, 165, 233, 0.5)",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  cameraPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  baselineImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cameraControls: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "700",
  },
  successButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  successButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  linkButtonText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  otpInput: {
    color: "#ffffff",
    fontSize: 32,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textAlign: "center",
    height: 60,
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 10,
    marginVertical: 16,
  },
  otpHelper: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  otpHelperTitle: {
    fontSize: 11,
    color: "#0ea5e9",
    fontWeight: "700",
  },
  otpSecretKey: {
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  otpHelperSub: {
    fontSize: 10,
    color: "#52525b",
    textAlign: "center",
    lineHeight: 14,
  },
  doubleButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#27272a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 2,
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 10,
  },
  successSub: {
    fontSize: 13,
    color: "#a1a1aa",
  },
  qrSection: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginVertical: 16,
  },
  qrImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  secretPanel: {
    flex: 1,
    gap: 4,
  },
  secretLabel: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "600",
  },
  secretText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#0ea5e9",
    fontWeight: "700",
    letterSpacing: 1,
  },
  otpInputPanel: {
    gap: 8,
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  otpInputMini: {
    borderWidth: 1,
    borderColor: "#27272a",
    color: "#ffffff",
    fontSize: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 4,
  },
});
