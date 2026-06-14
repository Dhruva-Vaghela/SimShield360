import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Fingerprint, KeyRound, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSimLock } from "@/lib/store";
import { mockTimeline } from "@/lib/mock-data";
import { toast } from "sonner";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/customer/sim-lock")({
  component: SimLockCenter,
});

type Step = "idle" | "biometric" | "auth" | "confirm" | "success";

function SimLockCenter() {
  const { locked, setLocked, blockedCount } = useSimLock();
  const [step, setStep] = useState<Step>("idle");

  const start = () => setStep("biometric");
  const close = () => setStep("idle");

  const advance = () => {
    if (step === "biometric") setStep("auth");
    else if (step === "auth") setStep("confirm");
    else if (step === "confirm") {
      setLocked(!locked);
      setStep("success");
      toast.success(locked ? "SIM Lock disabled" : "SIM Lock armed");
      setTimeout(close, 1400);
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
                  <DialogDescription>Look at your trusted device camera to confirm.</DialogDescription>
                </DialogHeader>
                <div className="my-6 grid place-items-center">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }}
                    className="size-32 rounded-full border-2 border-primary grid place-items-center">
                    <Fingerprint className="size-12 text-primary" />
                  </motion.div>
                </div>
                <DialogFooter><Button onClick={advance}>Confirm match</Button></DialogFooter>
              </motion.div>
            )}
            {step === "auth" && (
              <motion.div key="a" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Authenticator Code</DialogTitle>
                  <DialogDescription>Enter the 6-digit code from your authenticator app.</DialogDescription>
                </DialogHeader>
                <div className="my-6 flex gap-2 justify-center font-mono text-2xl">
                  {[4, 7, 2, 1, 9, 3].map((n, i) => (
                    <div key={i} className="size-12 rounded-md glass grid place-items-center">{n}</div>
                  ))}
                </div>
                <DialogFooter><Button onClick={advance}>Verify code</Button></DialogFooter>
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
