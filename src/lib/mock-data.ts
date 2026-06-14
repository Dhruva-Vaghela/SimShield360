export type RequestStatus = "pending" | "under-review" | "approved" | "rejected" | "blocked";
export type RequestType = "SIM Swap" | "eSIM Transfer" | "Port-Out" | "SIM Replacement";
export type LayerState = "pending" | "success" | "failed" | "blocked";

export interface SimRequest {
  id: string;
  customerName: string;
  customerId: string;
  phone: string;
  type: RequestType;
  riskScore: number;
  status: RequestStatus;
  createdAt: string;
  location: string;
  registeredLocation: string;
  deviceChanged: boolean;
  recentSimChanges: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: "Mobile" | "Laptop" | "Tablet";
  model: string;
  lastActive: string;
  trustScore: number;
  primary?: boolean;
}

export interface TimelineEvent {
  id: string;
  ts: string;
  kind: "lock-enabled" | "lock-disabled" | "unlock-failed" | "unlock-success" | "request-blocked" | "device-added" | "device-removed";
  message: string;
  meta?: string;
}

export const mockRequests: SimRequest[] = [
  { id: "REQ-10241", customerName: "Rahul Patel", customerId: "cust001", phone: "+91 98250 12345", type: "SIM Swap", riskScore: 92, status: "blocked", createdAt: "2h ago", location: "Ahmedabad", registeredLocation: "Vadodara", deviceChanged: true, recentSimChanges: 2 },
  { id: "REQ-10240", customerName: "Priya Mehta", customerId: "cust002", phone: "+91 98765 54321", type: "eSIM Transfer", riskScore: 28, status: "approved", createdAt: "3h ago", location: "Mumbai", registeredLocation: "Mumbai", deviceChanged: false, recentSimChanges: 0 },
  { id: "REQ-10239", customerName: "Karan Singh", customerId: "cust003", phone: "+91 99887 76655", type: "Port-Out", riskScore: 64, status: "under-review", createdAt: "5h ago", location: "Delhi", registeredLocation: "Gurgaon", deviceChanged: true, recentSimChanges: 1 },
  { id: "REQ-10238", customerName: "Sneha Iyer", customerId: "cust004", phone: "+91 90123 45678", type: "SIM Replacement", riskScore: 18, status: "approved", createdAt: "8h ago", location: "Bengaluru", registeredLocation: "Bengaluru", deviceChanged: false, recentSimChanges: 0 },
  { id: "REQ-10237", customerName: "Vikram Joshi", customerId: "cust005", phone: "+91 88776 65544", type: "SIM Swap", riskScore: 78, status: "rejected", createdAt: "1d ago", location: "Hyderabad", registeredLocation: "Chennai", deviceChanged: true, recentSimChanges: 3 },
  { id: "REQ-10236", customerName: "Anita Desai", customerId: "cust006", phone: "+91 70123 11122", type: "SIM Swap", riskScore: 12, status: "approved", createdAt: "1d ago", location: "Pune", registeredLocation: "Pune", deviceChanged: false, recentSimChanges: 0 },
  { id: "REQ-10235", customerName: "Mohammed Ali", customerId: "cust007", phone: "+91 70900 11223", type: "Port-Out", riskScore: 55, status: "pending", createdAt: "2d ago", location: "Lucknow", registeredLocation: "Kanpur", deviceChanged: false, recentSimChanges: 1 },
];

export const mockDevices: TrustedDevice[] = [
  { id: "dev-01", name: "Rahul's iPhone", type: "Mobile", model: "iPhone 15 Pro", lastActive: "Active now", trustScore: 98, primary: true },
  { id: "dev-02", name: "MacBook Pro", type: "Laptop", model: "MacBook Pro 14\"", lastActive: "2 hours ago", trustScore: 94 },
  { id: "dev-03", name: "iPad Air", type: "Tablet", model: "iPad Air M2", lastActive: "Yesterday", trustScore: 88 },
];

export const mockTimeline: TimelineEvent[] = [
  { id: "ev1", ts: "Today, 14:22", kind: "request-blocked", message: "SIM Swap request blocked", meta: "REQ-10241 · Ahmedabad" },
  { id: "ev2", ts: "Today, 09:10", kind: "lock-enabled", message: "SIM Lock re-armed", meta: "From trusted device" },
  { id: "ev3", ts: "Yesterday, 22:48", kind: "unlock-failed", message: "Unlock attempt failed", meta: "Face verification mismatch" },
  { id: "ev4", ts: "Yesterday, 19:02", kind: "device-added", message: "Device added to trust ring", meta: "iPad Air M2" },
  { id: "ev5", ts: "Jun 11, 12:30", kind: "unlock-success", message: "Lock temporarily disabled", meta: "Authorized by Rahul" },
  { id: "ev6", ts: "Jun 10, 08:00", kind: "lock-disabled", message: "Initial SIM Lock disabled", meta: "First-time setup" },
];

export const riskTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  risk: Math.round(20 + Math.sin(i / 2) * 18 + Math.random() * 10),
  attempts: Math.round(Math.random() * 6),
}));

export const verificationStats = [
  { name: "Face", success: 98 },
  { name: "Auth App", success: 96 },
  { name: "Device", success: 92 },
  { name: "Telecom", success: 88 },
  { name: "Risk", success: 94 },
];

export const requestTypeDist = [
  { name: "SIM Swap", value: 48 },
  { name: "eSIM Transfer", value: 22 },
  { name: "Port-Out", value: 18 },
  { name: "Replacement", value: 12 },
];

export const SECURITY_LAYERS = [
  { id: 1, key: "sim-lock", name: "SIM Lock Firewall", desc: "Customer-controlled hardware-grade lock" },
  { id: 2, key: "face", name: "Face Verification", desc: "Biometric liveness check" },
  { id: 3, key: "auth", name: "Authenticator", desc: "TOTP from trusted authenticator app" },
  { id: 4, key: "device", name: "Trusted Device Consent", desc: "Push approval from registered device" },
  { id: 5, key: "telecom", name: "Telecom Intelligence", desc: "Location, device & SIM history analysis" },
  { id: 6, key: "risk", name: "Risk Scoring Engine", desc: "Composite ML risk evaluation" },
  { id: 7, key: "final", name: "Final Approval Decision", desc: "Policy gate & audit log" },
] as const;
