import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Base64 helper compatible with React Native (using simple UTF-8 string encoding)
function btoa(input: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input;
  let output = "";

  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = "="), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));

    if (charCode > 0xff) {
      throw new Error(
        "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range."
      );
    }

    block = (block << 8) | charCode;
  }

  return output;
}

function generateMockJwt(role: Role, userId: string, email?: string) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role, userId, email, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `${header}.${payload}.simshield-mock-signature`;
}

interface AuthState {
  user: MockUser | null;
  customCustomers: Omit<MockUser, "token">[];
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
      customCustomers: DEFAULT_CUSTOMERS,
      
      loginAs: (role) => {
        if (role === "telecom-agent") {
          const user: MockUser = { ...MOCK_AGENT, token: generateMockJwt(role, MOCK_AGENT.id, MOCK_AGENT.email) };
          set({ user });
          return user;
        }
        const defaultCust = get().getCustomers()[0];
        return get().loginAsUser(defaultCust);
      },

      loginAsUser: (profile) => {
        // Retrieve local profile updates if they exist
        const match = get().customCustomers.find(c => c.id === profile.id);
        const activeProfile = match ? { ...profile, ...match } : { ...profile };
        const user: MockUser = { ...activeProfile, token: generateMockJwt(profile.role, profile.id, activeProfile.email) };
        set({ user });
        return user;
      },

      updateProfile: (data) =>
        set((s) => {
          if (!s.user) return {};
          const updatedUser = { ...s.user, ...data };
          const updatedList = s.customCustomers.map(c => 
            c.id === s.user?.id ? { ...c, ...data } : c
          );
          return {
            user: updatedUser,
            customCustomers: updatedList
          };
        }),

      logout: () => set({ user: null }),

      getCustomers: () => {
        const list = get().customCustomers;
        if (!list || list.length === 0) {
          return DEFAULT_CUSTOMERS;
        }
        return list;
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

        set((s) => ({
          customCustomers: [...s.customCustomers, newCust]
        }));

        return newCust;
      }
    }),
    {
      name: "simshield-auth-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
