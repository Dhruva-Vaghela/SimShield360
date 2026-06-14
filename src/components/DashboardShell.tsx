import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, LayoutDashboard, Lock, Smartphone, Activity, BarChart3, Clock, Settings, LogOut, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface NavItem { to: string; label: string; icon: LucideIcon }

export function DashboardShell({
  items,
  brand,
  children,
}: {
  items: NavItem[];
  brand: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex w-full grid-bg">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 glass-strong">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold leading-tight">SIMShield <span className="text-primary">360</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{brand}</div>
          </div>
        </div>
        <nav className="px-3 py-2 flex-1 space-y-1">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${active ? "bg-primary/15 text-primary neon-border" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <Icon className="size-4" />
                <span>{it.label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary animate-pulse" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="rounded-lg p-3 glass flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-sm font-semibold">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</div>
            </div>
            <button onClick={() => { logout(); navigate({ to: "/" }); }} className="text-muted-foreground hover:text-destructive" aria-label="Logout">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 glass-strong">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <span className="font-display font-bold">SIMShield 360</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { logout(); navigate({ to: "/" }); }}>Exit</Button>
        </header>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-border/60">
          {items.map((it) => {
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={`shrink-0 text-xs rounded-md px-3 py-1.5 ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                {it.label}
              </Link>
            );
          })}
        </nav>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export const customerNav: NavItem[] = [
  { to: "/customer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customer/sim-lock", label: "SIM Lock Center", icon: Lock },
  { to: "/customer/devices", label: "Trusted Devices", icon: Smartphone },
  { to: "/customer/activity", label: "SIM Activity", icon: Activity },
  { to: "/customer/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/customer/timeline", label: "Timeline", icon: Clock },
  { to: "/customer/settings", label: "Settings", icon: Settings },
];

export const agentNav: NavItem[] = [
  { to: "/agent", label: "Request Queue", icon: LayoutDashboard },
  { to: "/agent/verification", label: "Verification Center", icon: Shield },
  { to: "/agent/risk", label: "Risk Analysis", icon: BarChart3 },
  { to: "/agent/approval", label: "Approval Console", icon: Lock },
  { to: "/agent/audit", label: "Audit Logs", icon: Clock },
];
