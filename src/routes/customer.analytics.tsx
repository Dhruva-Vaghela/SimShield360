import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { riskTrend, verificationStats, requestTypeDist } from "@/lib/mock-data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/customer/analytics")({
  component: Analytics,
});

const COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--accent)"];

function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Security Analytics</div>
        <h1 className="text-3xl font-display font-bold mt-1">Your security posture</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4">Risk trend · 14d</div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={riskTrend}>
                <defs>
                  <linearGradient id="rt" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="risk" stroke="var(--primary)" fill="url(#rt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4">Fraud attempts · 14d</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={riskTrend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Bar dataKey="attempts" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4">Verification success rate</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={verificationStats}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis domain={[80, 100]} stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Line dataKey="success" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="text-sm font-semibold mb-4">Request type distribution</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={requestTypeDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                  {requestTypeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
