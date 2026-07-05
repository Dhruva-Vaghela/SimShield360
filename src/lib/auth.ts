import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getBackendUrl } from "./api";

export type Role = "customer" | "telecom-agent";

export interface MockUser {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  totpSecret?: string;
  totpEnabled?: boolean;
  faceImage?: string;
  token: string;
}

export const DEFAULT_CUSTOMERS: Omit<MockUser, "token">[] = [
  {
    id: "cust001",
    role: "customer",
    name: "Rahul Patel",
    phone: "+91 98250 12345",
    email: "rahul.patel@example.com",
    password: "password123",
    totpSecret: "JBSWY3DPEHPK3PXP",
    totpEnabled: true,
    faceImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "cust002",
    role: "customer",
    name: "Priya Sharma",
    phone: "+91 97110 54321",
    email: "priya.sharma@example.com",
    password: "password123",
    totpSecret: "JBSWY3DPEHPK3PXQ",
    totpEnabled: true,
    faceImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "cust003",
    role: "customer",
    name: "Vikram Mehta",
    phone: "+91 98980 88888",
    email: "vikram.mehta@example.com",
    password: "password123",
    totpSecret: "JBSWY3DPEHPK3PXR",
    totpEnabled: true,
    faceImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  }
];

export const MOCK_AGENT: Omit<MockUser, "token"> = {
  id: "agent001",
  role: "telecom-agent",
  name: "Amit Sharma",
  email: "amit.sharma@telecom.in",
  password: "password123",
};

function generateMockJwt(role: Role, userId: string) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role, userId, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `${header}.${payload}.simshield-mock-signature`;
}

interface AuthState {
  user: MockUser | null;
  loginAs: (role: Role) => MockUser;
  loginAsUser: (profile: Omit<MockUser, "token">) => MockUser;
  updateProfile: (data: Partial<Omit<MockUser, "id" | "role" | "token">>) => void;
  logout: () => void;
  getCustomers: () => Omit<MockUser, "token">[];
  registerCustomer: (
    name: string,
    phone: string,
    email: string,
    password?: string,
    faceImage?: string,
    totpSecret?: string
  ) => Promise<Omit<MockUser, "token">>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      
      loginAs: (role) => {
        if (role === "telecom-agent") {
          const user: MockUser = { ...MOCK_AGENT, token: generateMockJwt(role, MOCK_AGENT.id) };
          set({ user });
          return user;
        }
        // Default customer fallback
        const defaultCust = get().getCustomers()[0];
        return get().loginAsUser(defaultCust);
      },

      loginAsUser: (profile) => {
        let activeProfile = { ...profile };
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(`simshield-profile-${profile.id}`);
          if (stored) {
            try {
              activeProfile = { ...activeProfile, ...JSON.parse(stored) };
            } catch (e) {
              console.error("Error reading profile details:", e);
            }
          }
        }
        const user: MockUser = { ...activeProfile, token: generateMockJwt(profile.role, profile.id) };
        set({ user });
        return user;
      },

      updateProfile: (data) =>
        set((s) => {
          if (!s.user) return {};
          const updated = { ...s.user, ...data };
          if (typeof window !== "undefined") {
            const { token, ...profileInfo } = updated;
            localStorage.setItem(`simshield-profile-${s.user.id}`, JSON.stringify(profileInfo));
            
            // Also update in registered list
            const customList = localStorage.getItem("simshield-custom-customers");
            if (customList) {
              try {
                const list = JSON.parse(customList) as Omit<MockUser, "token">[];
                const index = list.findIndex(c => c.id === s.user?.id);
                if (index !== -1) {
                  list[index] = { ...list[index], ...data };
                  localStorage.setItem("simshield-custom-customers", JSON.stringify(list));
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
          return { user: updated };
        }),

      logout: () => set({ user: null }),

      getCustomers: () => {
        if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
        const stored = localStorage.getItem("simshield-custom-customers");
        if (!stored) {
          localStorage.setItem("simshield-custom-customers", JSON.stringify(DEFAULT_CUSTOMERS));
          return DEFAULT_CUSTOMERS;
        }
        try {
          return JSON.parse(stored);
        } catch (e) {
          return DEFAULT_CUSTOMERS;
        }
      },

      registerCustomer: async (name, phone, email, password = "password123", faceImage = "", totpSecret = "JBSWY3DPEHPK3PXP") => {
        const id = `cust-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCust: Omit<MockUser, "token"> = {
          id,
          role: "customer",
          name,
          phone,
          email,
          password,
          totpSecret,
          totpEnabled: true,
          faceImage,
        };

        if (typeof window !== "undefined") {
          const url = getBackendUrl();
          const nameParts = name.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "Customer";
          const cleanPhone = phone.replace(/[\s\-()]/g, "");

          const res = await fetch(`${url}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              confirmPassword: password,
              role: "customer",
              profile: {
                firstName,
                lastName,
                phoneNumber: cleanPhone
              }
            })
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            let errMsg = "Database registration failed";
            if (json.error) {
              if (json.error.details && json.error.details.fieldErrors) {
                errMsg = Object.entries(json.error.details.fieldErrors)
                  .map(([field, msg]) => `${field.replace("body.profile.", "").replace("body.", "")}: ${msg}`)
                  .join(", ");
              } else {
                errMsg = json.error.message || json.error;
              }
            } else if (json.message) {
              errMsg = json.message;
            }
            throw new Error(errMsg);
          }

          const list = get().getCustomers();
          const updatedList = [...list, newCust];
          localStorage.setItem("simshield-custom-customers", JSON.stringify(updatedList));
          localStorage.setItem(`simshield-profile-${id}`, JSON.stringify(newCust));
        }

        return newCust;
      }
    }),
    { name: "simshield-auth-v2" }
  )
);
