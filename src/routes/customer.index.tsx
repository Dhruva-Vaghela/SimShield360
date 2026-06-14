import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, Lock, Smartphone, ShieldAlert, ArrowUpRight, Activity, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSimLock } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { mockDevices, mockTimeline, riskTrend } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { RiskGauge } from "@/components/RiskGauge";

export const Route = createFileRoute("/customer/")({
  component: CustomerHome,
});

function CustomerHome() {
  const { user } = useAuth();
  const { locked, blockedCount } = useSimLock();
  const score = locked ? 96 : 64;
  const risk = locked ? 12 : 48;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Welcome back</div>
          <h1 className="text-3xl font-display font-bold mt-1">{user?.name}</h1>
        </div>
        <Link to="/customer/sim-lock">
          <Button><Lock className="size-4 mr-2" /> SIM Lock Center</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Security Score" value={score} suffix="/100" tone="success" icon={Shield} />
        <Stat label="Current Risk" value={risk} suffix="/100" tone={risk > 50 ? "warning" : "success"} icon={ShieldAlert} />
        <Stat label="Trusted Devices" value={mockDevices.length} tone="primary" icon={Smartphone} />
        <Stat label="Attempts Blocked" value={blockedCount} tone="accent" icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Risk trend</div>
              <div className="text-lg font-semibold">Last 14 days</div>
            </div>
            <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="size-3" /> Stable</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={riskTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="risk" stroke="var(--primary)" fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 glass flex flex-col items-center justify-center text-center">
          <div className="text-sm text-muted-foreground mb-3">Live risk meter</div>
          <RiskGauge score={risk} />
          <div className="text-xs text-muted-foreground mt-3">Updated from telecom intelligence engine</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6 glass">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">SIM Lock Status</div>
            <Link to="/customer/sim-lock" className="text-xs text-primary inline-flex items-center gap-1">Manage <ArrowUpRight className="size-3" /></Link>
          </div>
          <div className="flex items-center gap-4">
            <motion.div animate={{ scale: locked ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2.4 }}
              className={`size-20 rounded-2xl grid place-items-center ${locked ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
              <Shield className="size-9" />
            </motion.div>
            <div>
              <div className={`text-2xl font-display font-bold ${locked ? "text-success" : "text-warning"}`}>{locked ? "LOCKED" : "UNLOCKED"}</div>
              <div className="text-sm text-muted-foreground">{locked ? "All SIM operations are blocked at the firewall." : "Monitoring mode — requests are evaluated by workflow."}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="text-lg font-semibold mb-4">Recent activity</div>
          <ul className="space-y-3">
            {mockTimeline.slice(0, 5).map((ev) => (
              <li key={ev.id} className="flex items-start gap-3 text-sm">
                <div className="size-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <div>{ev.message}</div>
                  <div className="text-xs text-muted-foreground">{ev.ts} · {ev.meta}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, icon: Icon, tone }: { label: string; value: number | string; suffix?: string; icon: React.ComponentType<{ className?: string }>; tone: "success" | "warning" | "primary" | "accent" }) {
  const toneCls = { success: "text-success", warning: "text-warning", primary: "text-primary", accent: "text-accent" }[tone];
  return (
    <Card className="p-5 glass">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className={`size-4 ${toneCls}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <div className={`text-3xl font-display font-bold ${toneCls}`}>{value}</div>
        {suffix && <div className="text-xs text-muted-foreground">{suffix}</div>}
      </div>
    </Card>
  );
}
