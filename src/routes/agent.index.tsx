import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequests } from "@/lib/store";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, ShieldAlert } from "lucide-react";
import { type SimRequest } from "@/lib/mock-data";

export const Route = createFileRoute("/agent/")({
  component: Queue,
});

type TabType = "pending" | "approved" | "rejected" | "blocked" | "disabled";

function Queue() {
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const navigate = useNavigate();
  const { requests } = useRequests();

  // Categorize requests
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "under-review"
  );
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");
  
  // Blocked are requests blocked due to high risk or failures (risk score not 92/95 SIM Lock)
  const blockedRequests = requests.filter(
    (r) => r.status === "blocked" && r.riskScore < 90
  );
  
  // Disabled are requests blocked because SIM Lock was enabled (usually has riskScore >= 90 / SIM lock armed)
  const disabledRequests = requests.filter(
    (r) => r.status === "blocked" && r.riskScore >= 90
  );

  const getTabRequests = () => {
    switch (activeTab) {
      case "pending":
        return pendingRequests;
      case "approved":
        return approvedRequests;
      case "rejected":
        return rejectedRequests;
      case "blocked":
        return blockedRequests;
      case "disabled":
        return disabledRequests;
    }
  };

  const filteredRequests = getTabRequests().filter((r) =>
    `${r.id}${r.customerName}${r.phone}`.toLowerCase().includes(q.toLowerCase())
  );

  const stats = [
    { l: "Total Requests", v: requests.length, t: "text-primary" },
    { l: "Fraud Prevented", v: requests.filter((r) => r.status === "blocked" || r.status === "rejected").length, t: "text-success" },
    { l: "High Risk Requests", v: requests.filter((r) => r.riskScore >= 70).length, t: "text-destructive" },
    { l: "Approval Rate", v: requests.length ? `${Math.round((approvedRequests.length / requests.length) * 100)}%` : "0%", t: "text-warning" },
  ];

  const statusTone: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    "under-review": "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
    blocked: "bg-primary/15 text-primary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">Operator Console</div>
          <h1 className="text-3xl font-display font-bold mt-1">Request Queue</h1>
        </div>
        <Button onClick={() => navigate({ to: "/agent/verification" })}>Open verification center <ArrowRight className="size-4 ml-1" /></Button>
      </div>

      {/* Analytics stats displayed at the top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.l} className="p-5 glass">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
            <div className={`text-3xl font-display font-bold mt-2 ${s.t}`}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        <Card className="p-4 glass">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name or phone" className="pl-9" />
          </div>
        </Card>

        {/* Status Tab list */}
        <div className="flex border-b border-border/60 overflow-x-auto gap-2">
          {(["pending", "approved", "rejected", "blocked", "disabled"] as TabType[]).map((tab) => {
            const count = {
              pending: pendingRequests.length,
              approved: approvedRequests.length,
              rejected: rejectedRequests.length,
              blocked: blockedRequests.length,
              disabled: disabledRequests.length,
            }[tab];
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-4 text-sm font-semibold capitalize border-b-2 transition shrink-0 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Disabled SIM Lock warnings info banner */}
      {activeTab === "disabled" && (
        <Card className="p-4 border-warning/40 bg-warning/5 text-warning text-xs flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>SIM Lock is enabled, therefore no authorization action is required.</span>
        </Card>
      )}

      {/* Requests Table */}
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
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground italic">
                    No requests found in this category.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-white/3">
                    <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3">{r.customerName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.phone}</td>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3">
                      <span className={r.riskScore >= 71 ? "text-destructive font-semibold" : r.riskScore >= 31 ? "text-warning" : "text-success"}>
                        {r.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusTone[r.status] || "bg-muted text-muted-foreground"}>
                        {activeTab === "disabled" ? "disabled" : r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate({
                            to: "/agent/verification",
                            search: { reqId: r.id },
                          })
                        }
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

