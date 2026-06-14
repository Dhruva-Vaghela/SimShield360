import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardShell, customerNav } from "@/components/DashboardShell";

export const Route = createFileRoute("/customer")({
  component: CustomerLayout,
});

function CustomerLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || user.role !== "customer") navigate({ to: "/" });
  }, [user, navigate]);
  if (!user) return null;
  return (
    <DashboardShell items={customerNav} brand="Customer Console">
      <Outlet />
    </DashboardShell>
  );
}
