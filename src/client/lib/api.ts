import { supabase } from "./supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

const novaAPI = axios.create({
  baseURL: API_BASE_URL,
});

// Initialize AI if key is present
const googleApiKey = import.meta.env.VITE_GOOGLE_AI_KEY || "";
const genAI = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null;

/**
 * Pulse-Ai Supabase-Native API Layer
 * This replaces the local server entirely, utilizing Supabase client and RLS.
 */

export const authAPI = {
  login: async ({ email, password }: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Attempt to fetch profile
    let { data: user, error: _userError } = await supabase
      .from("dim_users")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    // If profile missing, create one (healing the data integrity)
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("dim_users")
        .insert([
          {
            user_id: data.user.id,
            user_name: data.user.email?.split("@")[0] || "User",
            email: data.user.email,
            baseline_spend: 2500,
            onboarding_completed: false,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }

    return {
      data: {
        token: data.session?.access_token,
        user: {
          id: user.user_id,
          name: user.user_name,
          email: user.email,
          baselineSpend: user.baseline_spend,
          novaTone: user.nova_tone,
          onboardingCompleted: user.onboarding_completed,
        },
      },
    };
  },

  signup: async ({ email, password, name }: any) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Only insert profile if we have an active session (email confirmation disabled).
    // If email confirmation is enabled, the profile will be created on first login.
    if (data.user && data.session) {
      const { error: insertError } = await supabase.from("dim_users").insert([
        {
          user_id: data.user.id,
          user_name: name,
          email: email,
          baseline_spend: 2500,
          monthly_income: 5200,
          initial_balance: 15000,
          nova_tone: "Balanced",
          onboarding_completed: false,
        },
      ]);
      if (insertError) throw insertError;
    }

    return {
      data: {
        token: data.session?.access_token,
        user: {
          id: data.user?.id || "",
          email: email,
          name: name,
          onboardingCompleted: false,
        },
      },
    };
  },
  me: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let { data: profile, error } = await supabase
      .from("dim_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-create profile if missing on 'me' call (Self-healing)
      const { data: newProfile, error: insertError } = await supabase
        .from("dim_users")
        .insert([
          {
            user_id: user.id,
            user_name: user.email?.split("@")[0] || "User",
            email: user.email,
            baseline_spend: 2500,
            onboarding_completed: false,
          },
        ])
        .select()
        .single();
      if (insertError) throw insertError;
      profile = newProfile;
    }

    return {
      data: {
        ...profile,
        name: profile.user_name,
        id: profile.user_id,
        onboardingCompleted: profile.onboarding_completed,
      },
    };
  },

  updateProfile: async (updates: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
  
    const dbUpdates: any = {};
  
    // Map frontend keys to DB columns
    if (updates.name !== undefined) dbUpdates.user_name = updates.name;
    if (updates.user_name !== undefined) dbUpdates.user_name = updates.user_name;
    
    if (updates.baselineSpend !== undefined) dbUpdates.baseline_spend = updates.baselineSpend;
    if (updates.baseline_spend !== undefined) dbUpdates.baseline_spend = updates.baseline_spend;
  
    if (updates.novaTone !== undefined) dbUpdates.nova_tone = updates.novaTone;
    if (updates.nova_tone !== undefined) dbUpdates.nova_tone = updates.nova_tone;
  
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.onboarding_completed !== undefined) dbUpdates.onboarding_completed = updates.onboarding_completed;

    if (updates.intentions !== undefined) dbUpdates.intentions = updates.intentions;
  
    const { data, error } = await supabase
      .from("dim_users")
      .update(dbUpdates)
      .eq("user_id", user.id)
      .select()
      .single();
  
    if (error) throw error;
    return { data };
  },
};

export const transactionsAPI = {
  getAll: async (params?: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("fact_transactions")
      .select(
        `
      *,
      category:dim_categories(category_name),
      trigger:dim_triggers(trigger_name)
    `,
      )
      .eq("user_id", user.id)
      .order("purchase_date", { ascending: false });

    if (params?.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },
  ingest: async (payload: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const txData = Array.isArray(payload) ? payload : payload.transactions;
    if (!txData) throw new Error("Invalid transaction payload.");

    const formatted = txData.map((tx: any) => ({
      user_id: user.id,
      amount: tx.amount,
      purchase_date: tx.date || new Date().toISOString(),
      category_id: tx.category_id,
      trigger_id: tx.trigger_id,
      status: "Completed",
    }));

    const { data: result, error } = await supabase
      .from("fact_transactions")
      .insert(formatted)
      .select();
    if (error) throw error;
    return { data: result };
  },
};

export const goalsAPI = {
  getAll: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("dim_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const mapped = data.map((g) => ({
      goal_id: g.goal_id,
      name: g.goal_name,
      target: g.target_amount,
      current: g.current_progress,
      deadline: g.deadline,
    }));
    return { data: mapped };
  },
  create: async (data: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: result, error } = await supabase
      .from("dim_goals")
      .insert([
        {
          user_id: user.id,
          goal_name: data.name,
          target_amount: data.target,
          deadline: data.deadline || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data: result };
  },
};

export const statsAPI = {
  get: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("dim_users")
      .select("*")
      .eq("user_id", user.id)
      .single();
    const { data: txs } = await supabase
      .from("fact_transactions")
      .select("*")
      .eq("user_id", user.id);

    const totalSpent =
      txs?.reduce((acc, tx) => acc + parseFloat(tx.amount), 0) || 0;
    const currentBalance = (profile?.initial_balance || 15000) - totalSpent;

    const chartData = [
      { month: "Jan", value: 12000 },
      { month: "Feb", value: 13500 },
      { month: "Mar", value: currentBalance },
    ];

    return {
      data: {
        totalBalance: currentBalance,
        spendingDeltaPct: 12.5,
        chartData,
        novaInsight:
          "Your spending rhythm is stabilizing. Keep focus on the Emergency Vault.",
        triggers: [
          { name: "Stress", count: 4, impact: 450 },
          { name: "Late Night", count: 2, impact: 120 },
        ],
      },
    };
  },
};

export const novaServiceAPI = {
  chat: async (message: string, context?: any) => {
    if (!genAI) throw new Error("Google AI Key not configured.");

    try {
      // Primary: High-Fidelity 1.5 Pro
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(message);
      const response = await result.response;
      return { data: { content: response.text() } };
    } catch (err) {
      console.warn(
        "Nova: Falling back to Flash core due to signal deviation.",
        err,
      );
      // Fallback: 1.5 Flash
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        `${message} (Low-latency mode active)`,
      );
      const response = await result.response;
      return { data: { content: response.text() } };
    }
  },
  getInsights: async () => {
    return {
      data: { insights: ["Uplink stable.", "Data integrity nominal."] },
    };
  },
  getAnalysis: async () => {
    return {
      data: {
        analysis: "Behavioral telemetry indicates a balanced rhythm.",
        report: "Behavioral telemetry indicates a balanced rhythm.",
        monthlyExpenses: 0,
      },
    };
  },
};

export { API, novaAPI };
