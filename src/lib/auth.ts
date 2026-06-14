import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "customer" | "telecom-agent";

export interface MockUser {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  email?: string;
  token: string;
}

const MOCK_USERS: Record<Role, Omit<MockUser, "token">> = {
  customer: { id: "cust001", role: "customer", name: "Rahul Patel", phone: "+91 98250 12345", email: "rahul.patel@example.com" },
  "telecom-agent": { id: "agent001", role: "telecom-agent", name: "Amit Sharma", email: "amit.sharma@telecom.in" },
};

function generateMockJwt(role: Role) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `${header}.${payload}.simshield-mock-signature`;
}

interface AuthState {
  user: MockUser | null;
  loginAs: (role: Role) => MockUser;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginAs: (role) => {
        const user: MockUser = { ...MOCK_USERS[role], token: generateMockJwt(role) };
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
    }),
    { name: "simshield-auth" }
  )
);
