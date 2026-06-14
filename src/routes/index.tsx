import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Shield, Lock, Smartphone, Activity, ArrowRight, CheckCircle2, Fingerprint, Radar, Brain, Network, ShieldCheck, AlertTriangle, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/lib/auth";
import { SECURITY_LAYERS } from "@/lib/mock-data";

const Hero3D = lazy(() => import("@/components/Hero3D"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIMShield 360 — Prevent SIM Swap Fraud Before It Happens" },
      { name: "description", content: "Multi-layer SIM swap, eSIM transfer and port-out prevention firewall for telecom operators." },
      { property: "og:title", content: "SIMShield 360" },
      { property: "og:description", content: "Multi-Layer SIM Swap Prevention & Authorization Firewall." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { loginAs } = useAuth();
  const navigate = useNavigate();

  const enterAs = (role: Role) => {
    loginAs(role);
    navigate({ to: role === "customer" ? "/customer" : "/agent" });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Top nav */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Shield className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold leading-tight">SIMShield <span className="text-primary">360</span></div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Authorization Firewall</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#layers" className="hover:text-foreground">Protection</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#stats" className="hover:text-foreground">Statistics</a>
            <a href="#demo" className="hover:text-foreground">Demo</a>
          </nav>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => enterAs("telecom-agent")}>Agent</Button>
            <Button size="sm" onClick={() => enterAs("customer")}>Customer</Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[92vh] grid-bg overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <Suspense fallback={null}>
            <Hero3D locked />
          </Suspense>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono glass mb-6">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              7-LAYER AUTHORIZATION FIREWALL · v3.2
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tighter">
              Prevent SIM Swap Fraud <span className="bg-gradient-to-r from-primary via-neon to-accent bg-clip-text text-transparent">before it happens.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              SIMShield 360 is a telecom-grade authorization firewall that locks SIM swap, eSIM transfer and port-out requests behind seven independent security layers — owned by the customer, enforced by the operator.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => enterAs("customer")} className="group">
                Enter as Customer <ArrowRight className="ml-1 group-hover:translate-x-0.5 transition" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => enterAs("telecom-agent")}>
                Enter as Telecom Agent
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> No setup · Demo mode</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Mock JWT auth</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Pluggable to Clerk / Supabase</div>
            </div>
          </motion.div>
          <div className="hidden lg:block" />
        </div>
      </section>

      {/* LAYERS */}
      <section id="layers" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="Defense in depth" title="Seven layers between attackers and your SIM" desc="Each layer is independent. A compromise of one does not weaken the others." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {SECURITY_LAYERS.map((l, i) => {
              const Icon = [Lock, Fingerprint, Shield, Smartphone, Network, Brain, ShieldCheck][i];
              return (
                <motion.div key={l.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 hover:neon-border transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">LAYER {l.id}</span>
                  </div>
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{l.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-24 px-6 border-y border-border/60 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="The workflow" title="Every request runs the same gauntlet" desc="From the moment a SIM-related request hits the operator, SIMShield routes it through a deterministic pipeline." />
          <div className="mt-12 grid grid-cols-2 md:grid-cols-7 gap-3">
            {SECURITY_LAYERS.map((l, i) => (
              <motion.div key={l.key}
                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="relative">
                <div className="glass rounded-xl p-4 h-full">
                  <div className="text-2xl font-display font-bold text-primary">{String(l.id).padStart(2, "0")}</div>
                  <div className="text-xs font-semibold mt-2 leading-tight">{l.name}</div>
                </div>
                {i < SECURITY_LAYERS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 -translate-y-1/2 text-primary/50">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6">
          {[
            { v: "₹4,200Cr", l: "Annual SIM swap fraud loss (India)", icon: AlertTriangle, c: "text-destructive" },
            { v: "73%", l: "Attacks bypass SMS-based 2FA",            icon: Radar,          c: "text-warning" },
            { v: "99.4%", l: "Of attempts blocked by SIM Lock layer", icon: Shield,         c: "text-success" },
            { v: "<2.1s", l: "Median decision latency",                icon: Zap,            c: "text-primary" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6">
              <s.icon className={`size-6 ${s.c}`} />
              <div className="mt-4 text-4xl font-display font-bold">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24 px-6 bg-card/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {[
            { t: "Customer-owned lock", d: "Customers arm a hardware-grade SIM Lock from their trusted device. Operators cannot override it.", icon: Lock },
            { t: "Telecom Intelligence", d: "Cross-reference registered location, device fingerprint, port-out history and recent SIM changes.", icon: Network },
            { t: "Auditable decisions", d: "Every layer's verdict is logged. Agents see exactly why a request was approved or blocked.", icon: BarChart3 },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6">
              <b.icon className="size-6 text-primary" />
              <div className="mt-4 text-xl font-semibold">{b.t}</div>
              <div className="text-sm text-muted-foreground mt-2">{b.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="Demo access" title="Step into either side of the firewall" desc="No login required. We generate a mock JWT and route you straight to the right console." />
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <DemoCard
              role="customer" title="Customer Console"
              desc="Arm your SIM Lock, manage trusted devices, and review every SIM-related request hitting your account."
              persona="Rahul Patel · +91 98250 12345"
              onClick={() => enterAs("customer")}
            />
            <DemoCard
              role="telecom-agent" title="Telecom Agent Console"
              desc="Triage incoming SIM swap and port-out requests, inspect risk signals, and approve or block them."
              persona="Amit Sharma · Operations Desk"
              onClick={() => enterAs("telecom-agent")}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass-strong rounded-3xl p-12 neon-border">
          <h2 className="text-4xl md:text-5xl font-display font-bold">Stop SIM swap fraud at layer one.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">SIMShield 360 turns the SIM itself into a permission boundary.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={() => enterAs("customer")}>Launch demo</Button>
            <Button size="lg" variant="outline" onClick={() => enterAs("telecom-agent")}>Operator view</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 px-6 text-center text-xs text-muted-foreground">
        SIMShield 360 · Hackathon MVP · <Link to="/" className="hover:text-foreground">Home</Link>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-mono uppercase tracking-widest text-primary">{eyebrow}</div>
      <h2 className="mt-3 text-3xl md:text-5xl font-display font-bold tracking-tight">{title}</h2>
      <p className="mt-4 text-muted-foreground">{desc}</p>
    </div>
  );
}

function DemoCard({ role, title, desc, persona, onClick }: { role: Role; title: string; desc: string; persona: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="text-left glass-strong rounded-2xl p-6 hover:neon-border transition group"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-primary">{role}</span>
        <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition" />
      </div>
      <div className="mt-3 text-2xl font-display font-bold">{title}</div>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
      <div className="mt-6 text-xs font-mono text-muted-foreground border-t border-border/60 pt-4">{persona}</div>
    </motion.button>
  );
}
