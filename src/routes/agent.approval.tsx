import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRequests, useTimeline } from "@/lib/store";
import { CheckCircle2, XCircle, ShieldAlert, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/approval")({
  component: ApprovalConsole,
});

function ApprovalConsole() {
  const { requests, updateRequestStatus } = useRequests();
  const { addEvent } = useTimeline();

  const pending = requests.filter((r) => r.status === "pending" || r.status === "under-review");

  const handleApprove = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "approved");
    addEvent({
      ts: "Just now",
      kind: "unlock-success",
      message: `${type} Approved`,
      meta: `${reqId} · Operator desk override`,
    });
    toast.success(`Request ${reqId} approved`);
  };

  const handleReject = (reqId: string, type: string) => {
    updateRequestStatus(reqId, "rejected");
    addEvent({
      ts: "Just now",
      kind: "unlock-failed",
      message: `${type} Rejected`,
      meta: `${reqId} · Blocked by operator desk`,
    });
    toast.error(`Request ${reqId} rejected`);
  };

  const handleEscalate = (reqId: string) => {
    toast.message(`Request ${reqId} escalated to L2 SecOps Desk`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Approval Console</div>
        <h1 className="text-3xl font-display font-bold mt-1">Final approval queue</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {pending.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground italic bg-white/3 rounded-xl border border-border/55">
            No requests currently awaiting final operator approval.
          </div>
        ) : (
          pending.map((r) => {
            const simLocked = r.status === "blocked" || r.riskScore >= 95; // Blocked because SIM Lock is enabled
            return (
              <Card key={r.id} className={`p-6 glass ${simLocked ? "border-destructive/40" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
                    <div className="text-lg font-semibold mt-1">{r.customerName}</div>
                    <div className="text-xs text-muted-foreground">{r.phone} · {r.type}</div>
                  </div>
                  <Badge className={r.riskScore >= 71 ? "bg-destructive/20 text-destructive" : r.riskScore >= 31 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}>
                    Risk {r.riskScore}
                  </Badge>
                </div>

                {simLocked ? (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                      <ShieldAlert className="size-4" /> Customer SIM Lock Enabled
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Approve action is unavailable. Request must be rejected and customer notified.</p>
                  </div>
                ) : r.riskScore >= 71 && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2 text-xs">
                    <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                    <span>High-risk request. Manual verification with customer recommended before approval.</span>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="glass rounded p-2"><div className="text-muted-foreground">From</div><div>{r.location}</div></div>
                  <div className="glass rounded p-2"><div className="text-muted-foreground">Registered</div><div>{r.registeredLocation}</div></div>
                </div>

                <div className="mt-4 flex gap-2">
                  {!simLocked && (
                    <Button size="sm" onClick={() => handleApprove(r.id, r.type)}>
                      <CheckCircle2 className="size-4 mr-1" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleReject(r.id, r.type)}>
                    <XCircle className="size-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEscalate(r.id)}>
                    Escalate
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
