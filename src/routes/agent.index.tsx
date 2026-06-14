import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockRequests, type RequestStatus } from "@/lib/mock-data";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/agent/")({
  component: Queue,
});

const statusTone: Record<RequestStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "under-review": "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  blocked: "bg-primary/15 text-primary",
};

function Queue() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const rows = mockRequests.filter((r) => `${r.id}${r.customerName}${r.phone}`.toLowerCase().includes(q.toLowerCase()));

  const stats = [
    { l: "Open requests", v: mockRequests.filter((r) => ["pending", "under-review"].includes(r.status)).length, t: "text-warning" },
    { l: "Blocked today", v: mockRequests.filter((r) => r.status === "blocked").length, t: "text-primary" },
    { l: "High risk", v: mockRequests.filter((r) => r.riskScore >= 71).length, t: "text-destructive" },
    { l: "Approved", v: mockRequests.filter((r) => r.status === "approved").length, t: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Operator Console</div>
          <h1 className="text-3xl font-display font-bold mt-1">Request Queue</h1>
        </div>
        <Button onClick={() => navigate({ to: "/agent/verification" })}>Open verification center <ArrowRight className="size-4 ml-1" /></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.l} className="p-5 glass">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
            <div className={`text-3xl font-display font-bold mt-2 ${s.t}`}>{s.v}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 glass">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name or phone" className="pl-9" />
        </div>
      </Card>

      <Card className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Request</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Risk</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-white/3">
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.phone}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">
                    <span className={r.riskScore >= 71 ? "text-destructive font-semibold" : r.riskScore >= 31 ? "text-warning" : "text-success"}>{r.riskScore}</span>
                  </td>
                  <td className="px-4 py-3"><Badge className={statusTone[r.status]}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/agent/verification" })}>Review</Button>
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
