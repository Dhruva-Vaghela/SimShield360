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
import { ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

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
  const [newPhoneNumber, setNewPhoneNumber] = useState(user?.phone || "");
  const [newSimCardNumber, setNewSimCardNumber] = useState(
    () => "8991" + Math.floor(100000000000000 + Math.random() * 900000000000000).toString()
  );
  const [reason, setReason] = useState(
    "I would like to request a new SIM card swap due to upgrading to a new device."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      toast.error("Blocked: SIM Lock is currently enabled.");
      return;
    }

    if (reason.length < 20) {
      toast.error("Reason must be at least 20 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = getBackendUrl();
      const cleanCurrentPhone = phoneNumber.replace(/[\s\-()]/g, "");
      const cleanNewPhone = newPhoneNumber && newPhoneNumber.trim()
        ? newPhoneNumber.replace(/[\s\-()]/g, "")
        : cleanCurrentPhone;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const res = await fetch(`${url}/swap-requests`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPhoneNumber: cleanCurrentPhone,
          newPhoneNumber: cleanNewPhone,
          newSimCardNumber: newSimCardNumber,
          reason: reason,
          deviceFingerprint: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6", // 32 characters
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        let errMsg = "Failed to submit swap request to database";
        if (json.error) {
          if (json.error.details && json.error.details.fieldErrors) {
            errMsg = Object.entries(json.error.details.fieldErrors)
              .map(([field, msg]) => `${field.replace("body.", "")}: ${msg}`)
              .join(", ");
          } else {
            errMsg = json.error.message || json.error;
          }
        } else if (json.message) {
          errMsg = json.message;
        }
        throw new Error(errMsg);
      }

      const swapRequestId = json.data?.swapRequestId || `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

      const newReq = {
        id: swapRequestId,
        customerName,
        customerId: user?.id || "cust001",
        phone: newPhoneNumber,
        type: requestType,
        riskScore: 12, // User initiated has low risk
        status: "pending" as const,
        createdAt: "Just now",
        location: "Vadodara",
        registeredLocation: "Vadodara",
        deviceChanged: false,
        recentSimChanges: 0,
      };

      // skipBackend = true because we already posted to /swap-requests manually
      addRequest(newReq, true);
      addEvent({
        ts: "Just now",
        kind: "request-blocked", // We reuse the timeline category for request placement
        message: `${requestType} request created`,
        meta: `${swapRequestId} · Pending Approval`,
        customerId: user?.id,
      });

      toast.success(`Request ${swapRequestId} submitted to cloud database!`);
      navigate({ to: "/customer/activity" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not connect to database server.");
    } finally {
      setIsSubmitting(false);
    }
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

          <div className="space-y-2">
            <Label htmlFor="new-phone">New Phone Number (Optional)</Label>
            <Input
              id="new-phone"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              disabled={locked || isSubmitting}
              className="bg-card/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-number">New SIM Card Number</Label>
            <Input
              id="sim-number"
              value={newSimCardNumber}
              onChange={(e) => setNewSimCardNumber(e.target.value)}
              disabled={locked || isSubmitting}
              required
              className="bg-card/50 border-border font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Request (Min 20 characters)</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={locked || isSubmitting}
              required
              rows={3}
              className="w-full min-h-[80px] bg-card/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card/50 border-border"
            />
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
