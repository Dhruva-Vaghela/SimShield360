import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "customer" | "telecom-agent";

export interface MockUser {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  email?: string;
  faceImage?: string;
  token: string;
}

const MOCK_USERS: Record<Role, Omit<MockUser, "token">> = {
  customer: {
    id: "cust001",
    role: "customer",
    name: "Rahul Patel",
    phone: "+91 98250 12345",
    email: "rahul.patel@example.com",
    faceImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  },
  "telecom-agent": {
    id: "agent001",
    role: "telecom-agent",
    name: "Amit Sharma",
    email: "amit.sharma@telecom.in",
  },
};

function generateMockJwt(role: Role) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `${header}.${payload}.simshield-mock-signature`;
}

interface AuthState {
  user: MockUser | null;
  loginAs: (role: Role) => MockUser;
  updateProfile: (data: Partial<Omit<MockUser, "id" | "role" | "token">>) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginAs: (role) => {
        let profile = { ...MOCK_USERS[role] };
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(`simshield-profile-${role}`);
          if (stored) {
            try {
              profile = { ...profile, ...JSON.parse(stored) };
            } catch (e) {
              console.error("Error reading profile from localStorage:", e);
            }
          }
        }
        const user: MockUser = { ...profile, token: generateMockJwt(role) };
        set({ user });
        return user;
      },
      updateProfile: (data) =>
        set((s) => {
          if (!s.user) return {};
          const updated = { ...s.user, ...data };
          if (typeof window !== "undefined") {
            const { token, ...profileInfo } = updated;
            localStorage.setItem(`simshield-profile-${s.user.role}`, JSON.stringify(profileInfo));
          }
          return { user: updated };
        }),
      logout: () => set({ user: null }),
    }),
    { name: "simshield-auth" }
  )
);
