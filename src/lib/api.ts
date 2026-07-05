import type { SimRequest, TimelineEvent } from "./mock-data";

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Connect to the backend running on port 3000 of the same host
    return `http://${hostname}:3000/api/v1`;
  }
  return "http://localhost:3000/api/v1";
};

export const BACKEND_URL = getBackendUrl();

export function mapAttackLogToRequest(log: any): SimRequest {
  let status: SimRequest["status"] = "pending";
  if (log.status === "succeeded" || log.status === "approved") status = "approved";
  else if (log.status === "rejected") status = "rejected";
  else if (log.status === "blocked") status = "blocked";
  else if (log.status === "waiting" || log.status === "under-review") status = "under-review";
  else if (log.status === "started" || log.status === "pending") status = "pending";

  const customerId = log.targetCustomer === "Rahul Patel" ? "cust001" : log.targetCustomer === "Priya Sharma" ? "cust002" : "cust003";

  return {
    id: log.requestId,
    customerName: log.targetCustomer,
    customerId: customerId,
    phone: log.customerNumber,
    type: log.attackType === "sim_swap" ? "SIM Swap" : log.attackType === "esim_transfer" ? "eSIM Transfer" : log.attackType === "port_out" ? "Port-Out" : "SIM Replacement",
    riskScore: log.riskScore || 0,
    status: status,
    createdAt: new Date(log.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: log.location || "Mumbai",
    registeredLocation: "Vadodara",
    deviceChanged: log.device !== "Rahul's iPhone",
    recentSimChanges: log.multipleAttempts ? 3 : 0,
  };
}

export function mapAttackLogsToTimeline(logs: any[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  logs.forEach(log => {
    const customerId = log.targetCustomer === "Rahul Patel" ? "cust001" : log.targetCustomer === "Priya Sharma" ? "cust002" : "cust003";
    
    (log.logs || []).forEach((entry: any, index: number) => {
      let kind: TimelineEvent["kind"] = "request-blocked";
      const msg = entry.message || "";
      
      if (msg.includes("blocked") || msg.includes("Blocked")) {
        kind = "request-blocked";
      } else if (msg.includes("Approved") || msg.includes("success") || msg.includes("passed") || msg.includes("Verified")) {
        kind = "unlock-success";
      } else if (msg.includes("failed") || msg.includes("failure") || msg.includes("error") || msg.includes("mismatch")) {
        kind = "unlock-failed";
      } else if (msg.includes("Lock enabled") || msg.includes("Lock armed")) {
        kind = "lock-enabled";
      } else if (msg.includes("Lock disabled")) {
        kind = "lock-disabled";
      }

      events.push({
        id: `${log.requestId}-${index}`,
        ts: new Date(entry.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: kind,
        message: msg,
        meta: `${log.requestId} · ${log.location || "Mumbai"}`,
        customerId: customerId,
      });
    });
  });
  
  return events;
}
