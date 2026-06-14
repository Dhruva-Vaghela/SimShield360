import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockRequests, type RequestStatus } from "@/lib/mock-data";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/customer/activity")({
  component: ActivityPage,
});

const statusTone: Record<RequestStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "under-review": "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  blocked: "bg-primary/15 text-primary",
};

function ActivityPage() {
  const [status, setStatus] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");

  const rows = mockRequests.filter((r) =>
    (status === "all" || r.status === status) &&
    (risk === "all" || (risk === "high" ? r.riskScore >= 71 : risk === "med" ? r.riskScore >= 31 && r.riskScore < 71 : r.riskScore < 31))
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">SIM Activity Center</div>
        <h1 className="text-3xl font-display font-bold mt-1">All SIM-related requests</h1>
      </div>

      <Card className="p-4 glass flex flex-wrap gap-3 items-center">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under-review">Under review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="med">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Request</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Risk</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-white/3">
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.location}</td>
                  <td className="px-4 py-3">
                    <span className={r.riskScore >= 71 ? "text-destructive" : r.riskScore >= 31 ? "text-warning" : "text-success"}>{r.riskScore}</span>
                  </td>
                  <td className="px-4 py-3"><Badge className={statusTone[r.status]}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
