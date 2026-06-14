import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { RiskGauge } from "@/components/RiskGauge";
import { mockRequests } from "@/lib/mock-data";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/agent/risk")({
  component: RiskAnalysis,
});

function RiskAnalysis() {
  const avg = Math.round(mockRequests.reduce((s, r) => s + r.riskScore, 0) / mockRequests.length);
  const distribution = [
    { band: "Low (0–30)",  count: mockRequests.filter((r) => r.riskScore < 31).length },
    { band: "Med (31–70)", count: mockRequests.filter((r) => r.riskScore >= 31 && r.riskScore < 71).length },
    { band: "High (71+)",  count: mockRequests.filter((r) => r.riskScore >= 71).length },
  ];
  const signals = [
    { signal: "Geo", score: 72 },
    { signal: "Device", score: 65 },
    { signal: "Velocity", score: 48 },
    { signal: "Port history", score: 58 },
    { signal: "Identity", score: 30 },
    { signal: "Network", score: 40 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Risk Analysis</div>
        <h1 className="text-3xl font-display font-bold mt-1">Operator risk overview</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 glass flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground mb-3">Average queue risk</div>
          <RiskGauge score={avg} size={200} />
        </Card>
        <Card className="p-6 glass lg:col-span-2">
          <div className="text-sm font-semibold mb-4">Risk band distribution</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={distribution} layout="vertical">
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis type="category" dataKey="band" stroke="var(--muted-foreground)" fontSize={10} width={100} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 glass">
        <div className="text-sm font-semibold mb-4">Signal radar · current sample</div>
        <div className="h-80">
          <ResponsiveContainer>
            <RadarChart data={signals}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="signal" stroke="var(--muted-foreground)" fontSize={11} />
              <PolarRadiusAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
