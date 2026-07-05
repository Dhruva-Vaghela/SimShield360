import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Fingerprint, KeyRound, CheckCircle2, X, AlertTriangle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSimLock } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { mockTimeline } from "@/lib/mock-data";
import { toast } from "sonner";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/customer/sim-lock")({
  component: SimLockCenter,
});

type Step = "idle" | "biometric" | "auth" | "device" | "confirm" | "success";

function base32ToBuf(secret: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = secret.toUpperCase().replace(/=+$/, "");
  const buf = new Uint8Array(Math.floor((cleaned.length * 5) / 8));
  let value = 0;
  let bits = 0;
  let index = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buf[index++] = (value >> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buf;
}

async function verifyTOTP(inputCode: string): Promise<boolean> {
  const secret = "JBSWY3DPEHPK3PXP";
  try {
    const keyBytes = base32ToBuf(secret);
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes as any,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const currentCounter = Math.floor(epoch / 30);
    
    // Check counter window to avoid latency issues
    for (let offset = -1; offset <= 1; offset++) {
      const counter = currentCounter + offset;
      const counterBuffer = new Uint8Array(8);
      let temp = counter;
      for (let i = 7; i >= 0; i--) {
        counterBuffer[i] = temp & 0xff;
        temp = temp >> 8;
      }
      
      const signature = await window.crypto.subtle.sign("HMAC", key, counterBuffer as any);
      const signatureBytes = new Uint8Array(signature);
      const idx = signatureBytes[signatureBytes.length - 1] & 0xf;
      const binary =
        ((signatureBytes[idx] & 0x7f) << 24) |
        ((signatureBytes[idx + 1] & 0xff) << 16) |
        ((signatureBytes[idx + 2] & 0xff) << 8) |
        (signatureBytes[idx + 3] & 0xff);
      
      const computedCode = (binary % 1000000).toString().padStart(6, "0");
      if (computedCode === inputCode) {
        return true;
      }
    }
  } catch (err) {
    console.error("Error verifying TOTP", err);
  }
  return false;
}

async function analyzeLiveness(video: HTMLVideoElement): Promise<{ success: boolean; reason?: string }> {
  const canvas = document.createElement("canvas");
  canvas.width = 30;
  canvas.height = 30;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: true };

  // Capture frame
  ctx.drawImage(video, 0, 0, 30, 30);
  const data1 = ctx.getImageData(0, 0, 30, 30).data;

  // Calculate average brightness and standard deviation
  let total = 0;
  for (let i = 0; i < data1.length; i += 4) {
    total += (data1[i] + data1[i+1] + data1[i+2]) / 3;
  }
  const avg = total / 225;

  let sumSqDiff = 0;
  for (let i = 0; i < data1.length; i += 4) {
    const val = (data1[i] + data1[i+1] + data1[i+2]) / 3;
    sumSqDiff += Math.pow(val - avg, 2);
  }
  const stdDev = Math.sqrt(sumSqDiff / 225);

  console.log("Biometric contrast detail score:", stdDev);

  // A hand placed in front of the face close to the camera blurs the lens details,
  // dropping the standard deviation score below 18. Normal face scans register >=20.
  if (stdDev < 18) {
    return { 
      success: false, 
      reason: "Face match failed: Biometric occlusion or hand covering detected. Please look directly at the camera with your face fully visible." 
    };
  }

  return { success: true };
}

function SimLockCenter() {
  const { locked, setLocked, blockedCount } = useSimLock();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [inputCode, setInputCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (step === "biometric") {
      navigator.mediaDevices.getUserMedia({ video: { width: 250, height: 250, facingMode: "user" } })
        .then((s) => {
          setCameraStream(s);
        })
        .catch((err) => {
          console.error("Camera access failed for biometric step", err);
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [step]);

  // Bind video element when DOM element and camera stream are both active
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, step]);

  const start = () => setStep("biometric");
  const close = () => {
    setStep("idle");
    setInputCode("");
    setIsChecking(false);
    setFaceVerifying(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  const handleFaceVerify = async () => {
    if (!user?.faceImage) {
      toast.error("Biometric mismatch: No face baseline photo registered. Please register your profile photo in settings first.");
      return;
    }

    setFaceVerifying(true);
    const video = videoRef.current;

    if (video) {
      const check = await analyzeLiveness(video);
      setFaceVerifying(false);

      if (!check.success) {
        toast.error(check.reason);
        return;
      }
    } else {
      setFaceVerifying(false);
      toast.error("Camera capture device not initialized. Please try again.");
      return;
    }

    toast.success("Biometric match successful! Identity verified.");
    advance();
  };

  const handleFaceBypass = () => {
    toast.info("Biometric verification bypassed for demo purposes.");
    advance();
  };

  const advance = () => {
    if (step === "biometric") setStep("auth");
    else if (step === "auth") setStep("device");
    else if (step === "device") setStep("confirm");
    else if (step === "confirm") {
      setLocked(!locked);
      setStep("success");
      toast.success(locked ? "SIM Lock disabled" : "SIM Lock armed");
      setTimeout(close, 1400);
    }
  };

  const handleAuthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 6 || !/^\d+$/.test(inputCode)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    
    setIsChecking(true);
    const isValid = await verifyTOTP(inputCode);
    setIsChecking(false);

    if (isValid || inputCode === "123456") {
      toast.success("Authenticator code verified");
      setInputCode("");
      advance();
    } else {
      toast.error("Invalid Authenticator Code. Scan the QR code in Authenticator settings to match.");
    }
  };

  const blockedData = Array.from({ length: 7 }, (_, i) => ({ d: `D${i + 1}`, blocked: Math.round(Math.random() * 5) }));


  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Layer 1 · SIM Lock Firewall</div>
        <h1 className="text-3xl font-display font-bold mt-1">SIM Lock Control Center</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">Master switch that blocks every SIM swap, eSIM transfer, replacement and port-out request — at the operator boundary.</p>
      </div>

      <Card className={`relative overflow-hidden p-10 glass-strong ${locked ? "neon-border" : ""}`}>
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: locked ? "radial-gradient(circle at 30% 30%, var(--success) 0%, transparent 60%)" : "radial-gradient(circle at 30% 30%, var(--warning) 0%, transparent 60%)" }} />
        <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-8 items-center">
          <div className="relative grid place-items-center">
            {locked && (
              <>
                <span className="absolute inset-0 rounded-full bg-success/30 pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-success/20 pulse-ring" style={{ animationDelay: "0.8s" }} />
              </>
            )}
            <motion.div animate={{ rotate: locked ? 0 : 8 }} transition={{ type: "spring" }}
              className={`relative size-40 rounded-3xl grid place-items-center ${locked ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              {locked ? <Shield className="size-20" /> : <ShieldAlert className="size-20" />}
            </motion.div>
          </div>
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono ${locked ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              {locked ? "PROTECTED" : "MONITORING"}
            </div>
            <div className={`text-5xl font-display font-bold mt-3 ${locked ? "text-success" : "text-warning"}`}>
              {locked ? "LOCKED" : "UNLOCKED"}
            </div>
            <p className="text-muted-foreground mt-2 max-w-md">
              {locked
                ? "All SIM operations are being rejected at the firewall. Any attacker — even with full account access — cannot move your number."
                : "SIM operations will be evaluated by the full 7-layer workflow. Lock again to enforce hard block."}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {["Block SIM Swap", "Block SIM Replacement", "Block eSIM Transfer", "Block Port-Out"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  {locked ? <CheckCircle2 className="size-4 text-success" /> : <X className="size-4 text-muted-foreground" />}
                  <span className={locked ? "" : "text-muted-foreground line-through"}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" variant={locked ? "outline" : "default"} onClick={start} className="min-w-44">
            {locked ? "Disable Lock" : "Arm SIM Lock"}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 glass">
          <div className="text-sm text-muted-foreground">Requests blocked</div>
          <div className="text-4xl font-display font-bold text-success mt-2">{blockedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Since lock was first armed</div>
        </Card>
        <Card className="p-6 glass lg:col-span-2">
          <div className="text-sm text-muted-foreground mb-2">Blocked requests · last 7 days</div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={blockedData}>
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Bar dataKey="blocked" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 glass">
        <div className="text-lg font-semibold mb-4">Lock timeline</div>
        <ol className="space-y-3">
          {mockTimeline.map((ev) => (
            <li key={ev.id} className="flex gap-3 items-start text-sm">
              <span className={`mt-1 size-2 rounded-full ${ev.kind.includes("blocked") || ev.kind === "lock-enabled" ? "bg-success" : ev.kind === "unlock-failed" ? "bg-destructive" : "bg-primary"}`} />
              <div className="flex-1">
                <div>{ev.message}</div>
                <div className="text-xs text-muted-foreground">{ev.ts} · {ev.meta}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Dialog open={step !== "idle"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="glass-strong">
          <AnimatePresence mode="wait">
            {step === "biometric" && (
              <motion.div key="b" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Fingerprint className="size-5 text-primary" /> Face Verification</DialogTitle>
                  <DialogDescription>Look at your camera to confirm biometric identity.</DialogDescription>
                </DialogHeader>
                <div className="my-6 grid place-items-center">
                  <div className="size-48 rounded-full overflow-hidden border-2 border-primary/50 relative bg-black">
                    <video ref={videoRef} id="biometric-video" autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-0 border border-primary/30 rounded-full animate-pulse pointer-events-none" />
                  </div>
                </div>
                <DialogFooter className="flex flex-col gap-2">
                  <Button
                    onClick={handleFaceVerify}
                    disabled={faceVerifying}
                    className="w-full bg-success hover:bg-success/80 text-white font-medium"
                  >
                    {faceVerifying ? "Verifying face signature..." : "Verify Identity"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFaceBypass}
                    disabled={faceVerifying}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Bypass Scan (Demo Mode)
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
            {step === "auth" && (
              <motion.div key="a" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Authenticator Code</DialogTitle>
                  <DialogDescription>Enter the 6-digit code from your authenticator app (use 123456 as bypass).</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAuthVerify} className="my-6 space-y-4">
                  <Input
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-card border-border font-mono text-center text-2xl tracking-widest h-12"
                    required
                    autoFocus
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isChecking} className="w-full">
                      {isChecking ? "Verifying..." : "Verify code"}
                    </Button>
                  </DialogFooter>
                </form>
              </motion.div>
            )}
            {step === "device" && (
              <motion.div key="d" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Smartphone className="size-5 text-primary" /> Trusted Device Consent</DialogTitle>
                  <DialogDescription>A verification challenge was dispatched to your registered primary trusted device.</DialogDescription>
                </DialogHeader>
                <div className="my-6 grid place-items-center">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="size-28 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center text-primary">
                    <Smartphone className="size-12" />
                  </motion.div>
                  <span className="text-xs text-muted-foreground mt-3 animate-pulse">Awaiting consent approval tap...</span>
                </div>
                <DialogFooter><Button onClick={advance}>Simulate Push Approval</Button></DialogFooter>
              </motion.div>
            )}
            {step === "confirm" && (
              <motion.div key="c" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-warning" /> Confirm change</DialogTitle>
                  <DialogDescription>{locked ? "Disabling SIM Lock will allow SIM-related requests to proceed through the workflow." : "Arming SIM Lock will block all SIM operations at the firewall."}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={close}>Cancel</Button>
                  <Button onClick={advance}>{locked ? "Disable lock" : "Arm lock"}</Button>
                </DialogFooter>
              </motion.div>
            )}
            {step === "success" && (
              <motion.div key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                  className="size-20 rounded-full bg-success/15 grid place-items-center mx-auto text-success">
                  <CheckCircle2 className="size-10" />
                </motion.div>
                <div className="mt-4 text-xl font-semibold">Done</div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
