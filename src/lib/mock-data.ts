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

export const mockRequests: SimRequest[] = [];

export const mockDevices: TrustedDevice[] = [
  { id: "dev-01", name: "Rahul's iPhone", type: "Mobile", model: "iPhone 15 Pro", lastActive: "Active now", trustScore: 98, primary: true },
  { id: "dev-02", name: "MacBook Pro", type: "Laptop", model: "MacBook Pro 14\"", lastActive: "2 hours ago", trustScore: 94 },
  { id: "dev-03", name: "iPad Air", type: "Tablet", model: "iPad Air M2", lastActive: "Yesterday", trustScore: 88 },
];

export const mockTimeline: TimelineEvent[] = [];

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
