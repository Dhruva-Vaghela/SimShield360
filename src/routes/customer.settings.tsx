import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/settings")({
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-primary">Settings</div>
        <h1 className="text-3xl font-display font-bold mt-1">Account & preferences</h1>
      </div>

      <Card className="p-6 glass space-y-4">
        <div className="text-lg font-semibold">Profile</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input defaultValue={user?.name} /></div>
          <div><Label>Phone</Label><Input defaultValue={user?.phone} /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input defaultValue={user?.email} /></div>
        </div>
      </Card>

      <Card className="p-6 glass space-y-4">
        <div className="text-lg font-semibold">Security preferences</div>
        {[
          { l: "Push notification for every SIM request", d: "Receive a push on your trusted device for every incoming request." },
          { l: "Auto-block on geo anomaly", d: "Reject any request originating from outside your registered state." },
          { l: "Email weekly security report", d: "Summary of risk score, attempts blocked, and lock status." },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-t border-border/60 first:border-t-0 first:pt-0">
            <div>
              <div className="font-medium">{s.l}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
            <Switch defaultChecked={i !== 2} />
          </div>
        ))}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
      </div>
    </div>
  );
}
