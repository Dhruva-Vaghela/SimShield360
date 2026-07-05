import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2, ShieldAlert, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTimeline } from "@/lib/store";

export const Route = createFileRoute("/customer/authenticator")({
  component: AuthenticatorPage,
});

function AuthenticatorPage() {
  const { addEvent } = useTimeline();

  // Local state for configuration simulation
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("simshield-totp-enabled") === "true";
    }
    return false;
  });

  const [isConfiguring, setIsConfiguring] = useState(!isEnabled);
  const [secretKey] = useState("JBSWY3DPEHPK3PXP");
  const [copied, setCopied] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6 || !/^\d+$/.test(verifyCode)) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsEnabled(true);
    localStorage.setItem("simshield-totp-enabled", "true");
    setIsConfiguring(false);
    setIsVerifying(false);
    setVerifyCode("");

    addEvent({
      ts: "Just now",
      kind: "lock-enabled",
      message: "Google Authenticator Verified & Bound",
      meta: "TOTP 2FA enabled",
    });

    toast.success("Google Authenticator configured successfully!");
  };

  const handleReconfigure = () => {
    setIsConfiguring(true);
    toast.info("Reconfiguring authenticator... Scan the new QR code.");
  };

  const handleDisable = () => {
    setIsEnabled(false);
    localStorage.setItem("simshield-totp-enabled", "false");
    setIsConfiguring(true);

    addEvent({
      ts: "Just now",
      kind: "lock-disabled",
      message: "Google Authenticator Disabled",
      meta: "Reverted to single-factor",
    });

    toast.warning("Google Authenticator protection disabled.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Layer 3 · Google Authenticator</div>
        <h1 className="text-3xl font-display font-bold mt-1">Multi-factor Authenticator</h1>
        <p className="text-muted-foreground mt-1">Bind a TOTP hardware key or Google Authenticator app to authorize high-risk SIM operations.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {isConfiguring ? (
            <Card className="p-6 glass space-y-6">
              <div className="border-b border-border/55 pb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <KeyRound className="size-5 text-primary animate-pulse" /> 
                  Setup 2FA Authenticator
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Follow these steps to link your authenticator app (Google Authenticator, Authy, etc.).
                </p>
              </div>

              <div className="space-y-4 text-sm text-foreground/90">
                <div className="flex gap-3">
                  <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold shrink-0">1</span>
                  <div>
                    <p className="font-medium">Scan the QR Code</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open your authenticator app, select "Add account", then "Scan QR code".
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold shrink-0">2</span>
                  <div className="flex-1">
                    <p className="font-medium">Or enter Secret Key manually</p>
                    <div className="flex items-center gap-2 mt-2 bg-white/5 border border-border/50 rounded-lg p-2.5 max-w-md">
                      <span className="font-mono text-sm tracking-wider text-primary select-all">{secretKey}</span>
                      <Button size="icon" variant="ghost" className="size-8 ml-auto text-muted-foreground hover:text-foreground" onClick={handleCopySecret}>
                        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <span className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold shrink-0">3</span>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">Confirm Verification Code</p>
                    <form onSubmit={handleVerify} className="flex gap-2 max-w-md">
                      <Input
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="bg-card border-border font-mono text-center text-lg tracking-widest"
                        required
                      />
                      <Button type="submit" disabled={isVerifying} className="shrink-0">
                        {isVerifying ? "Verifying..." : "Verify & Enable"}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 glass space-y-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-success/15 text-success grid place-items-center shrink-0">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">2FA Authenticator is Armed</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Google Authenticator is verified and actively protecting your account. Any request to disable SIM Lock or swap cards will challenge you for a 6-digit code.
                  </p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 flex gap-3">
                <Button variant="outline" onClick={handleReconfigure}>
                  <RefreshCw className="size-4 mr-2" /> Reconfigure Authenticator
                </Button>
                <Button variant="ghost" onClick={handleDisable} className="text-destructive hover:bg-destructive/10">
                  Disable Protection
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Verification Status Card */}
        <div className="space-y-6">
          <Card className="p-6 glass flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold border-b border-border/50 pb-2 mb-3">Verification Status</div>
              <div className="flex items-center gap-3">
                <span className={`size-3 rounded-full ${isEnabled ? "bg-success animate-pulse" : "bg-warning"}`} />
                <span className="font-mono text-sm font-semibold uppercase">
                  {isEnabled ? "ACTIVATED" : "NOT CONFIGURED"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {isEnabled 
                  ? "Your account protection factor is heightened with time-based credentials." 
                  : "Single factor authentication. Please configure authenticator ring to bolster security."}
              </p>
            </div>
          </Card>

          {/* Setup QR Code Representation */}
          {isConfiguring && (
            <Card className="p-6 glass flex flex-col items-center justify-center bg-white/2">
              <div className="text-xs font-mono text-muted-foreground mb-3">Scan with Authenticator App</div>
              <div className="bg-white p-3 rounded-xl size-36 flex items-center justify-center">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth%3A%2F%2Ftotp%2FSIMShield%3Arahul.patel%40example.com%3Fsecret%3DJBSWY3DPEHPK3PXP%26issuer%3DSIMShield" 
                  alt="Google Authenticator QR Code"
                  className="size-full object-contain"
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground mt-3 uppercase tracking-wider">SIMShield Verification Secret</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
