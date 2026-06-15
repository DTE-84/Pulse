import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "true") {
      supabase.auth.signOut().then(() => {
        localStorage.clear();
        window.location.href = "/auth";
      });
      return;
    }

    if (!authLoading && isAuthenticated && user && params.get("guest") !== "true") {
      console.log("[PulseAi] AuthPage: Already authenticated, redirecting to", user.onboardingCompleted ? "/" : "/onboarding");
      navigate(user.onboardingCompleted ? "/" : "/onboarding");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleGuestProtocol = async () => {
    setLoading(true);
    try {
      const res = await authAPI.guestSignup();
      if (!res.data.token) {
        throw new Error("Sandbox initialized but no access token was provided.");
      }
      await login(res.data.token, res.data.user);
      toast({
        title: "Sandbox Protocol Initialized",
        description: "Entering high-fidelity demo environment.",
      });
      navigate("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sandbox Offline",
        description: String(err.response?.data?.message || "Could not established analytical link to guest environment."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("guest") === "true" && !loading && !isAuthenticated) {
      handleGuestProtocol();
    }
  }, [isAuthenticated, loading]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Include at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Include at least one lowercase letter.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Include at least one special character.";
    return null;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter your email address first.",
      });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast({
        title: "Recovery Link Dispatched",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Recovery Failed",
        description: err.message,
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        toast({
          variant: "destructive",
          title: "Security Requirement",
          description: passwordError,
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await authAPI.login({ email: email.trim(), password });
        if (!res.data.token) {
          throw new Error("Authentication succeeded but no session token was issued.");
        }
        await login(res.data.token, res.data.user);
        toast({
          title: "Access Granted",
          description: "Welcome back to the Intelligence Hub.",
        });
        
        navigate(res.data.user.onboardingCompleted ? "/" : "/onboarding");
      } else {
        const res = await authAPI.signup({ name, email: email.trim(), password });
        if (!res.data.token) {
          toast({
            title: "Verification Required",
            description: "Please check your email to verify your account before logging in.",
          });
          setIsLogin(true);
        } else {
          await login(res.data.token, res.data.user);
          toast({
            title: "Profile Initialized",
            description: "Preparing your Advanced Financial AI protocols.",
          });
          
          navigate("/onboarding");
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Auth Failed",
        description: String(
          err.response?.data?.message ||
          err.message ||
          "Invalid credentials. Please verify your connection."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative selection:bg-primary/30 text-foreground">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[140px] rounded-full" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Brand & Sentience */}
        <div className="hidden lg:flex flex-col space-y-10">
          <div className="flex items-center gap-6 group">
            <div className="relative w-20 h-24 flex items-center justify-center">
              <div className="relative z-10 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform filter drop-shadow-[0_0_20px_rgba(45,237,156,0.25)] overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}PulseNovaLogoTrans.png`}
                  alt="Pulse"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
                Pulse
              </h1>
              <p className="text-primary font-bold tracking-[0.4em] uppercase text-xs mt-2 animate-pulse mb-4">
                Advanced Financial Intelligence
              </p>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[300px] border-l border-primary/20 pl-4 italic">
                "Your financial rhythm isn't random — Pulse detects it, and Nova
                helps you understand it."
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
              Engineering <span className="text-primary italic">Precision</span>{" "}
              into your financial behavior.
            </h2>

            <div className="grid gap-6">
              {[
                {
                  icon: Zap,
                  title: "Velocity Tracking",
                  desc: "Real-time monitoring of discretionary spending rhythm.",
                },
                {
                  icon: ShieldCheck,
                  title: "Pure Integrity",
                  desc: "Bank-grade read-only sync with multi-layered encryption.",
                },
                {
                  icon: Sparkles,
                  title: "Nova Coaching",
                  desc: "AI-driven behavioral mirroring and proactive interventions.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-5 items-start group">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-lg mb-1 tracking-tight">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] bg-card border border-border rounded-3xl md:rounded-[3rem] p-5 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Header for Mobile */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6 sm:mb-10">
              <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                <div className="relative z-10 w-20 h-20 flex items-center justify-center shadow-2xl overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}PulseNovaLogoTrans.png`}
                    alt="Pulse"
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                Pulse
              </h1>
              <p className="text-muted-foreground text-[10px] leading-relaxed max-w-[240px] italic mt-2">
                "Your financial rhythm isn't random — Pulse detects it, and Nova
                helps you understand it."
              </p>
            </div>

            <div className="mb-6 sm:mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                {isLogin ? "Welcome Back" : "Initialize Profile"}
              </h3>
              <p className="text-muted-foreground font-medium text-sm">
                {isLogin
                  ? "Access your intelligence hub."
                  : "Begin your journey into behavioral intelligence."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full bg-muted border border-border rounded-2xl py-4 sm:py-5 pl-14 pr-6 focus:outline-none focus:border-primary/40 focus:bg-background transition-all font-semibold text-foreground placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-muted border border-border rounded-2xl py-4 sm:py-5 pl-14 pr-6 focus:outline-none focus:border-primary/40 focus:bg-background transition-all font-semibold text-foreground placeholder:text-muted-foreground/40"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full bg-muted border border-border rounded-2xl py-4 sm:py-5 pl-14 pr-14 focus:outline-none focus:border-primary/40 focus:bg-background transition-all font-semibold text-foreground placeholder:text-muted-foreground/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!isLogin && (
                <div className="px-2 space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Security Policy:
                  </p>
                  <p className="text-[9px] font-medium text-muted-foreground/60 leading-relaxed">
                    Min 8 characters • 1 Uppercase • 1 Lowercase • 1 Special Character
                  </p>
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end px-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-black py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(45,237,156,0.25)] uppercase tracking-[0.2em] text-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative py-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                  Or
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <button
                type="button"
                onClick={handleGuestProtocol}
                disabled={loading}
                className="w-full bg-muted border border-border text-foreground/60 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-muted/80 hover:text-foreground transition-all uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Launch Sandbox Protocol
              </button>
            </form>

            <div className="mt-10 pt-10 border-t border-border text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {isLogin ? "New to Pulse?" : "Already have an account?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-black uppercase tracking-widest text-[10px] ml-3 hover:underline underline-offset-4"
                >
                  {isLogin ? "Sign Up Here" : "Sign In Here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
