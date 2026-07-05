import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, KeyRound, User, Lock, Mail, Phone, Camera, CheckCircle2, AlertTriangle, ArrowRight, Laptop, Sparkles, Upload, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type MockUser } from "@/lib/auth";
import { verifyTOTP, generateTOTPSecret } from "@/lib/totp";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type LoginStage = "credentials" | "biometric" | "totp" | "success";
type RegisterStage = "fields" | "biometric" | "totp" | "success";

function LoginPage() {
  const navigate = useNavigate();
  const { getCustomers, loginAsUser, loginAs } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

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

  // --- CAMERA SHARED STATES ---
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Start camera helper
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: "user" },
      });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      toast.error("Could not access camera. Please allow camera permissions.");
      console.error(err);
    }
  };

  // Capture image helper
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 300;
      canvas.height = videoRef.current.videoHeight || 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setRegFaceImage(dataUrl);
        toast.success("Facial baseline photo captured!");
      }
    }
    stopCamera();
  };

  // Clean up camera on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [activeTab, loginStage, regStage]);

  // --- LOGIN HANDLERS ---
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check if it's the telecom agent
    if (loginEmail === "amit.sharma@telecom.in" && loginPassword === "password123") {
      toast.success("Agent authenticated. Welcome back!");
      loginAs("telecom-agent");
      navigate({ to: "/agent" });
      return;
    }

    // Check customers
    const customers = getCustomers();
    const found = customers.find(
      (c) => c.email?.toLowerCase() === loginEmail.toLowerCase()
    );

    if (!found || found.password !== loginPassword) {
      toast.error("Invalid email or password");
      return;
    }

    setTargetUser(found);
    toast.success("Credentials correct! Proceeding to biometric verification.");
    setLoginStage("biometric");
  };

  // Biometric liveness check simulation
  const handleLoginFaceVerify = async () => {
    if (!targetUser?.faceImage && activeTab === "login") {
      toast.error("No face baseline registered for this profile.");
      return;
    }

    setLoginFaceVerifying(true);
    // Liveness calculation simulation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoginFaceVerifying(false);

    toast.success("Liveness match verified. Identity confirmed!");
    stopCamera();
    
    // Check if TOTP is armed on this user
    if (targetUser?.totpSecret) {
      setLoginStage("totp");
    } else {
      // If no TOTP (shouldn't happen on defaults), login directly
      completeCustomerLogin(targetUser!);
    }
  };

  const handleLoginFaceBypass = () => {
    toast.info("Face biometric bypassed for demo purposes.");
    stopCamera();
    if (targetUser?.totpSecret) {
      setLoginStage("totp");
    } else {
      completeCustomerLogin(targetUser!);
    }
  };

  const handleLoginTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginTotpCode.length !== 6 || !/^\d+$/.test(loginTotpCode)) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    setLoginTotpVerifying(true);
    const secret = targetUser?.totpSecret || "JBSWY3DPEHPK3PXP";
    const isValid = await verifyTOTP(loginTotpCode, secret);
    setLoginTotpVerifying(false);

    if (isValid) {
      toast.success("Google Authenticator OTP Verified!");
      completeCustomerLogin(targetUser!);
    } else {
      toast.error("Invalid verification code. Please check your authenticator app.");
    }
  };

  const completeCustomerLogin = (profile: Omit<MockUser, "token">) => {
    setLoginStage("success");
    loginAsUser(profile);
    setTimeout(() => {
      navigate({ to: "/customer" });
    }, 1200);
  };

  // --- REGISTER HANDLERS ---
  const handleRegisterFieldsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Go to face scan step
    setRegStage("biometric");
  };

  const handleRegFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegFaceImage(reader.result as string);
        toast.success("Face baseline photo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegFaceSubmit = () => {
    if (!regFaceImage) {
      toast.error("Please capture or upload a face baseline photo");
      return;
    }

    // Generate unique TOTP secret for registration setup
    const secret = generateTOTPSecret();
    setRegTotpSecret(secret);
    setRegStage("totp");
  };

  const handleRegTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regTotpCode.length !== 6 || !/^\d+$/.test(regTotpCode)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setRegTotpVerifying(true);
    const isValid = await verifyTOTP(regTotpCode, regTotpSecret);

    if (isValid) {
      try {
        // Register in the database and local storage
        const { registerCustomer } = useAuth.getState();
        const newCust = await registerCustomer(
          regName,
          regPhone,
          regEmail,
          regPassword,
          regFaceImage,
          regTotpSecret
        );

        toast.success("Account registered successfully!");
        setRegStage("success");
        
        // Automatically log them in
        setTimeout(() => {
          loginAsUser(newCust);
          navigate({ to: "/customer" });
        }, 1200);
      } catch (err: any) {
        toast.error(err.message || "Failed to register account on database server.");
      } finally {
        setRegTotpVerifying(false);
      }
    } else {
      setRegTotpVerifying(false);
      toast.error("Invalid code. Please scan the QR code and input correct code.");
    }
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col justify-center items-center p-4">
      {/* Top logo */}
      <Link to="/" className="flex items-center gap-2 mb-6 group">
        <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center group-hover:scale-105 transition">
          <Shield className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold leading-tight text-foreground">SIMShield <span className="text-primary">360</span></div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Authorization Firewall</div>
        </div>
      </Link>

      <Card className="w-full max-w-lg glass-strong p-6 md:p-8 neon-border relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_50%)]" />

        {/* Tab switcher - only show if at first stage */}
        {((activeTab === "login" && loginStage === "credentials") ||
          (activeTab === "register" && regStage === "fields")) && (
          <div className="grid grid-cols-2 bg-card/60 p-1 rounded-xl mb-6 border border-border/60">
            <button
              onClick={() => setActiveTab("login")}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <motion.div
              key={`login-${loginStage}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {loginStage === "credentials" && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold">Secure Access</h2>
                    <p className="text-xs text-muted-foreground">Provide credentials to enter multi-factor verification.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="login-pass">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="login-pass"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2 font-display">
                    Authenticate Credentials <ArrowRight className="size-4 ml-1.5" />
                  </Button>

                  <div className="text-center pt-2 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Quick Demo Profiles</span>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail("rahul.patel@example.com");
                          setLoginPassword("password123");
                        }}
                        className="text-[11px] bg-white/5 border border-border hover:bg-white/10 rounded py-1 px-1.5 text-muted-foreground truncate"
                      >
                        Rahul Patel (Cust)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail("amit.sharma@telecom.in");
                          setLoginPassword("password123");
                        }}
                        className="text-[11px] bg-white/5 border border-border hover:bg-white/10 rounded py-1 px-1.5 text-muted-foreground truncate"
                      >
                        Amit Sharma (Agent)
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loginStage === "biometric" && (
                <div className="space-y-4 text-center">
                  <div className="space-y-1 text-left">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                      <Camera className="size-5 text-primary" /> Liveness Verification
                    </h2>
                    <p className="text-xs text-muted-foreground">Look at your camera to verify biometric signature liveness.</p>
                  </div>

                  <div className="my-6 grid place-items-center">
                    <div className="size-48 rounded-full overflow-hidden border-2 border-primary/50 relative bg-black">
                      {cameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                          {targetUser?.faceImage ? (
                            <img
                              src={targetUser.faceImage}
                              alt="Profile Baseline"
                              className="size-full object-cover"
                            />
                          ) : (
                            <Camera className="size-12 animate-pulse" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 border border-primary/30 rounded-full animate-pulse pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {!cameraActive ? (
                      <Button onClick={startCamera} className="w-full bg-primary hover:bg-primary/90">
                        Activate Web Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={handleLoginFaceVerify}
                        disabled={loginFaceVerifying}
                        className="w-full bg-success hover:bg-success/80 text-white font-medium"
                      >
                        {loginFaceVerifying ? "Matching Signature..." : "Scan & Verify Identity"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      onClick={handleLoginFaceBypass}
                      disabled={loginFaceVerifying}
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                      Bypass Facial Scan (Demo Mode)
                    </Button>
                  </div>
                </div>
              )}

              {loginStage === "totp" && (
                <form onSubmit={handleLoginTotpVerify} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                      <KeyRound className="size-5 text-primary" /> Authenticator Token
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Input the 6-digit TOTP code associated with your registered SIMShield secret.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-4">
                    <Input
                      value={loginTotpCode}
                      onChange={(e) => setLoginTotpCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="bg-card border-border font-mono text-center text-3xl tracking-widest h-14 max-w-[200px]"
                      required
                      autoFocus
                    />

                    {/* Small configuration guide for demo convenience */}
                    <div className="text-[11px] text-muted-foreground border border-border/40 p-2.5 rounded-lg w-full bg-white/2">
                      <span className="font-semibold block text-center mb-1 text-primary">Authenticator Setup Key</span>
                      <div className="flex items-center justify-between font-mono bg-black/40 p-1.5 rounded select-all mb-1 text-center">
                        <span className="w-full text-center tracking-wider">{targetUser?.totpSecret || "JBSWY3DPEHPK3PXP"}</span>
                      </div>
                      <span className="text-[10px] text-center block">Enter this secret manually, or scan the profile in your Authenticator app.</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLoginStage("biometric")}
                      className="w-1/3"
                    >
                      <ArrowLeft className="size-4 mr-1" /> Back
                    </Button>
                    <Button type="submit" disabled={loginTotpVerifying} className="w-2/3">
                      {loginTotpVerifying ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                  </div>
                </form>
              )}

              {loginStage === "success" && (
                <div className="py-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="size-20 rounded-full bg-success/15 grid place-items-center mx-auto text-success"
                  >
                    <CheckCircle2 className="size-10" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-bold">Authentication Passed</h3>
                    <p className="text-sm text-muted-foreground">Redirecting to Customer Console...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`register-${regStage}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {regStage === "fields" && (
                <form onSubmit={handleRegisterFieldsSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold">Create Account</h2>
                    <p className="text-xs text-muted-foreground">Setup details to register your SIMShield license.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          placeholder="Rahul Patel"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="rahul@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reg-phone"
                          placeholder="+91 98250 12345"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-pass">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reg-pass"
                          type="password"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-conf">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="reg-conf"
                          type="password"
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="bg-card border-border pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2 font-display">
                    Continue to Biometrics <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </form>
              )}

              {regStage === "biometric" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                      <Camera className="size-5 text-primary" /> Register Face Baseline
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Capture or upload your profile photo. This is the baseline image used for all future biometrics.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative size-36 rounded-full overflow-hidden border-2 border-primary/50 bg-card/60 flex items-center justify-center">
                      {cameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : regFaceImage ? (
                        <img src={regFaceImage} alt="Face Profile" className="size-full object-cover" />
                      ) : (
                        <User className="size-16 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 w-full max-w-sm justify-center">
                      {!cameraActive ? (
                        <Button variant="outline" size="sm" onClick={startCamera} className="bg-card">
                          <Camera className="size-4 mr-2" /> Start Camera
                        </Button>
                      ) : (
                        <Button size="sm" onClick={capturePhoto} className="bg-success text-white">
                          Capture Baseline Photo
                        </Button>
                      )}

                      <label className="text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold ring-1 ring-border py-2 px-3 bg-card/25 hover:bg-card/45 cursor-pointer transition">
                          <Upload className="size-3.5" /> Upload File
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleRegFaceUpload} />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRegStage("fields")} className="w-1/3">
                      Back
                    </Button>
                    <Button onClick={handleRegFaceSubmit} disabled={!regFaceImage} className="w-2/3">
                      Bind Face & Continue <ArrowRight className="size-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {regStage === "totp" && (
                <form onSubmit={handleRegTotpVerify} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                      <KeyRound className="size-5 text-primary" /> Link Authenticator App
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code below using Google Authenticator or input the secret key manually.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 items-center py-2">
                    <div className="flex flex-col items-center justify-center bg-white/2 border border-border/40 p-4 rounded-xl">
                      <div className="bg-white p-2.5 rounded-lg size-32">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=otpauth%3A%2F%2Ftotp%2FSIMShield%3A${encodeURIComponent(regEmail)}%3Fsecret%3D${regTotpSecret}%26issuer%3DSIMShield`}
                          alt="Google Authenticator QR Code"
                          className="size-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground mt-2 uppercase tracking-widest">
                        Scan QR Code
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Manual Entry Key</Label>
                        <div className="bg-black/40 border border-border/60 p-2.5 rounded font-mono text-[11px] tracking-wider select-all text-center text-primary">
                          {regTotpSecret}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-code">Confirm 6-Digit Code</Label>
                        <Input
                          id="reg-code"
                          placeholder="000000"
                          maxLength={6}
                          value={regTotpCode}
                          onChange={(e) => setRegTotpCode(e.target.value)}
                          className="bg-card border-border font-mono text-center text-lg tracking-widest"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRegStage("biometric")}
                      className="w-1/3"
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={regTotpVerifying} className="w-2/3">
                      {regTotpVerifying ? "Verifying..." : "Complete Registration"}
                    </Button>
                  </div>
                </form>
              )}

              {regStage === "success" && (
                <div className="py-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="size-20 rounded-full bg-success/15 grid place-items-center mx-auto text-success"
                  >
                    <CheckCircle2 className="size-10" />
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-bold">Registration Complete</h3>
                    <p className="text-sm text-muted-foreground">Setting up your profile console...</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
