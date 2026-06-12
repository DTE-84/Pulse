import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  onboardingCompleted?: boolean;
  subscriptionStatus?: 'active' | 'trialing' | 'inactive' | 'expired' | 'canceled' | 'past_due';
  trialEndsAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (newToken: string, userData: User) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasActiveSubscription: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      // Only restore user if we also have a token
      return (savedUser && savedToken) ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken || null;
  });
  const [loading, setLoading] = useState(true);

  const hasActiveSubscription = !!user && (
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'past_due' ||
    (user.subscriptionStatus === 'trialing' && (!user.trialEndsAt || new Date(user.trialEndsAt) > new Date()))
  );

  useEffect(() => {
    // 1. Sync with Supabase Auth State
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
          
          // Fetch profile if not in localStorage or to keep it fresh
          const { data: profile, error: profileError } = await supabase
            .from('dim_users')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (profileError) throw profileError;

          let finalProfile = profile;

          // Self-healing: If profile missing, create it
          if (!finalProfile) {
            console.log("[PulseAi] Profile missing during init, creating...");
            const { data: newProfile, error: insertError } = await supabase
              .from('dim_users')
              .insert([
                {
                  user_id: session.user.id,
                  user_name: session.user.email?.split("@")[0] || "User",
                  email: session.user.email,
                  baseline_spend: 2500,
                  onboarding_completed: false,
                  subscription_status: 'trialing',
                  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                },
              ])
              .select()
              .single();
            
            if (!insertError) {
              finalProfile = newProfile;
            } else {
              console.error("[PulseAi] Profile creation failed:", insertError);
            }
          }

          if (finalProfile) {
            const userData = { 
              ...finalProfile, 
              id: finalProfile.user_id, 
              name: finalProfile.user_name,
              onboardingCompleted: finalProfile.onboarding_completed,
              subscriptionStatus: finalProfile.subscription_status,
              trialEndsAt: finalProfile.trial_ends_at,
              isDemo: finalProfile.is_demo
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          // If no session but we had local state, clear it (it was stale)
          if (token || user) {
            console.log("[PulseAi] Stale session detected, clearing local storage.");
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error("[PulseAi] Auth Initialization Failed:", err);
        // Clear on error to be safe
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[PulseAi] Auth Event:", _event);
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (newToken: string, userData: User) => {
    // If no token provided (e.g. Supabase-native login), try to get it from current session
    let tokenToUse = newToken;
    
    if (!tokenToUse) {
      console.log("[PulseAi] No explicit token provided to login(), checking session...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("[PulseAi] Session found, synchronizing...");
        tokenToUse = session.access_token;
      }
    }

    if (!tokenToUse) {
      console.error("[PulseAi] Login attempt aborted: No session token found. Redirecting to manual login form.");
      // Clear any stale state to be safe
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }

    setToken(tokenToUse);
    setUser(userData);
    localStorage.setItem('token', tokenToUse);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const contextValue = React.useMemo(() => ({ 
    user, 
    token, 
    login, 
    logout, 
    updateUser,
    isAuthenticated: !!token && !!user,
    loading,
    hasActiveSubscription
  }), [user, token, loading, hasActiveSubscription]);

  useEffect(() => {
    if (import.meta.env.MODE !== 'production') {
      console.log("[PulseAi] Auth V2.2 State Updated:", { 
        hasUser: !!user, 
        hasToken: !!token, 
        loading, 
        isAuthenticated: !!token && !!user,
        subscription: user?.subscriptionStatus
      });
    }
  }, [user, token, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

