import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardShell, agentNav } from "@/components/DashboardShell";

export const Route = createFileRoute("/agent")({
  component: AgentLayout,
});

function AgentLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || user.role !== "telecom-agent") navigate({ to: "/" });
  }, [user, navigate]);
  if (!user) return null;
  return (
    <DashboardShell items={agentNav} brand="Telecom Operator">
      <Outlet />
    </DashboardShell>
  );
}
