import { supabase } from "./supabase";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Pulse-Ai API Layer
 * This utilizes the unified backend for high-fidelity data integrity.
 */

export const authAPI = {
  login: async ({ email, password }: any) => {
    const response = await API.post("/api/auth/login", { email, password });
    const { token, refreshToken } = response.data;
    
    if (token) {
      // Synchronize with Supabase Client to enable RLS and session persistence
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || "",
      });
      localStorage.setItem("token", token);
    }
    
    return response;
  },

  signup: async ({ email, password, name }: any) => {
    const response = await API.post("/api/auth/signup", { email, password, name });
    const { token, refreshToken } = response.data;
    
    if (token) {
      // Synchronize with Supabase Client to enable RLS and session persistence
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || "",
      });
      localStorage.setItem("token", token);
    }
    
    return response;
  },
  guestSignup: async () => {
    const response = await API.post("/api/auth/guest");
    const { token, refreshToken } = response.data;
    
    if (token) {
      // Synchronize with Supabase Client to enable RLS and session persistence
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || "",
      });
      localStorage.setItem("token", token);
    }
    
    return response;
  },
  me: async () => {
    const response = await API.get("/api/auth/me");
    return response;
  },

  updateProfile: async (updates: any) => {
    // Map frontend keys to backend expected keys if necessary
    const payload = {
      name: updates.name || updates.user_name,
      baselineSpend: updates.baselineSpend || updates.baseline_spend,
      novaTone: updates.novaTone || updates.nova_tone,
      onboardingCompleted: updates.onboardingCompleted ?? updates.onboarding_completed,
      intentions: updates.intentions
    };

    const response = await API.patch("/api/auth/update", payload);
    return response;
  },

  deleteAccount: async () => {
    const response = await API.delete("/api/auth/delete");
    await supabase.auth.signOut();
    return response.data;
  },
};

export const paymentsAPI = {
  createSession: async (planName: string, isAnnual: boolean) => {
    const response = await API.post("/api/payments/create-session", { planName, isAnnual });
    return response.data;
  },
};

export const plaidAPI = {
  createLinkToken: async () => {
    const response = await API.post("/api/plaid/create-link-token");
    return response.data;
  },
  exchangeToken: async (publicToken: string, institutionName: string) => {
    const response = await API.post("/api/plaid/exchange-token", { publicToken, institutionName });
    return response.data;
  },
};

export const transactionsAPI = {
  getAll: async (params?: any) => {
    const response = await API.get("/api/finance/transactions", { params });
    return response;
  },
  ingest: async (payload: any) => {
    const txData = Array.isArray(payload) ? payload : payload.transactions;
    if (!txData) throw new Error("Invalid transaction payload.");

    const response = await API.post("/api/finance/ingest", { transactions: txData });
    return response;
  },
};

export const goalsAPI = {
  getAll: async () => {
    const response = await API.get("/api/finance/goals");
    return response;
  },
  create: async (data: any) => {
    const response = await API.post("/api/finance/goals", data);
    return response;
  },
};

export const statsAPI = {
  get: async () => {
    const response = await API.get("/api/stats");
    return { data: response.data };
  },
};

export const novaServiceAPI = {
  chat: async (message: string, history?: any[]) => {
    // We now use the server-side proxy for high-fidelity telemetry and security.
    const response = await API.post("/api/nova/chat", { message, history });
    return response;
  },
  getInsights: async () => {
    const response = await API.get("/api/stats");
    return {
      data: { 
        insights: [
          `Total Balance: $${response.data.totalBalance.toLocaleString()}`,
          response.data.novaInsight
        ] 
      }
    };
  },
  getAnalysis: async () => {
    const response = await API.post("/api/nova/analysis");
    return response;
  },
};

export { API };
