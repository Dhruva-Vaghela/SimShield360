import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSimLock, useRequests, useTimeline } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { ShieldAlert, Send, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/request")({
  component: CreateRequestPage,
});

function CreateRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getLockState } = useSimLock();
  const { locked } = getLockState(user?.id || "cust001");
  const { addRequest } = useRequests();
  const { addEvent } = useTimeline();

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [requestType, setRequestType] = useState<"SIM Swap" | "eSIM Transfer" | "Port-Out" | "SIM Replacement">("SIM Swap");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      toast.error("Blocked: SIM Lock is currently enabled.");
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const reqId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReq = {
      id: reqId,
      customerName,
      customerId: user?.id || "cust001",
      phone: phoneNumber,
      type: requestType,
      riskScore: 12, // User initiated from trusted dashboard has low risk
      status: "pending" as const,
      createdAt: "Just now",
      location: "Vadodara",
      registeredLocation: "Vadodara",
      deviceChanged: false,
      recentSimChanges: 0,
    };

    addRequest(newReq);
    addEvent({
      ts: "Just now",
      kind: "request-blocked", // We reuse the timeline category for request placement
      message: `${requestType} request created`,
      meta: `${reqId} · Pending Approval`,
      customerId: user?.id,
    });

    toast.success(`Request ${reqId} created successfully!`);
    setIsSubmitting(false);
    navigate({ to: "/customer/activity" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">New Request</div>
        <h1 className="text-3xl font-display font-bold mt-1">Submit SIM Request</h1>
        <p className="text-muted-foreground mt-1">Request SIM swap, eSIM transfer, replace SIM, or port-out services.</p>
      </div>

      {locked ? (
        <Card className="p-6 border-destructive/40 bg-destructive/10">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-destructive/20 text-destructive grid place-items-center shrink-0">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-destructive">SIM Lock is enabled</h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Disable the lock before creating any request.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-destructive/30 hover:bg-destructive/10 text-destructive"
                onClick={() => navigate({ to: "/customer/sim-lock" })}
              >
                Go to SIM Lock Center
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-6 glass">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={locked || isSubmitting}
              required
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={locked || isSubmitting}
              required
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={locked || isSubmitting}
              required
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Request Type</Label>
            <Select
              disabled={locked || isSubmitting}
              value={requestType}
              onValueChange={(val: any) => setRequestType(val)}
            >
              <SelectTrigger id="type" className="bg-card/50 border-border">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIM Swap">SIM Swap</SelectItem>
                <SelectItem value="eSIM Transfer">eSIM Activation</SelectItem>
                <SelectItem value="Port-Out">Port Out</SelectItem>
                <SelectItem value="SIM Replacement">Replace SIM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={locked || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? "Submitting..." : (
                <>
                  <Send className="size-4 mr-2" /> Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
