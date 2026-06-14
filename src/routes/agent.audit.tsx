import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockRequests } from "@/lib/mock-data";

export const Route = createFileRoute("/agent/audit")({
  component: Audit,
});

function Audit() {
  const logs = mockRequests.flatMap((r, i) => [
    { ts: r.createdAt, actor: "system", action: `Workflow started for ${r.id}`, level: "info" as const },
    { ts: r.createdAt, actor: "risk-engine", action: `Risk score computed: ${r.riskScore}`, level: r.riskScore >= 71 ? "warn" as const : "info" as const },
    { ts: r.createdAt, actor: r.status === "blocked" ? "sim-lock" : "agent001", action: `Decision: ${r.status.toUpperCase()}`, level: r.status === "approved" ? "ok" as const : r.status === "blocked" ? "warn" as const : "err" as const },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Audit Logs</div>
        <h1 className="text-3xl font-display font-bold mt-1">Immutable activity stream</h1>
      </div>
      <Card className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Level</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {logs.map((l, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="px-4 py-3 text-muted-foreground">{l.ts}</td>
                  <td className="px-4 py-3">{l.actor}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3">
                    <Badge className={l.level === "ok" ? "bg-success/20 text-success" : l.level === "warn" ? "bg-warning/20 text-warning" : l.level === "err" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}>
                      {l.level.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
