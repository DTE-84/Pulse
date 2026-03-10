import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authAPI.login({ email, password });
        login(res.data.token, res.data.user);
        toast({
          title: "Uplink Established",
          description: "Welcome back to the Command Center.",
        });
        navigate(res.data.user.onboardingCompleted ? "/" : "/onboarding");
      } else {
        const res = await authAPI.signup({ name, email, password });
        login(res.data.token, res.data.user);
        toast({
          title: "Profile Initialized",
          description: "Preparing your Advanced Financial AI protocols.",
        });
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Auth Failed",
        description:
          err.response?.data?.detail ||
          "Invalid credentials. Please verify your uplink.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 overflow-hidden relative selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[140px] rounded-full" />

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Brand & Sentience */}
        <div className="hidden lg:flex flex-col space-y-10">
          <div className="flex items-center gap-6 group">
            <div className="relative w-20 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:4s]" />
              <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse [animation-duration:2s]" />
              <div className="relative z-10 w-16 h-16 rounded-[2rem] bg-black border-2 border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(45,237,156,0.2)]">
                <img
                  src="/pulse-logo-circular.svg"
                  alt="Nova"
                  className="w-10 h-10 object-contain filter drop-shadow-[0_0_12px_rgba(45,237,156,0.8)]"
                />
              </div>
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none">
                Pulse
              </h1>
              <p className="text-primary font-bold tracking-[0.4em] uppercase text-xs mt-2 animate-pulse mb-4">
                Advanced Financial Intelligence
              </p>
              <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[300px] border-l border-primary/20 pl-4 italic">
                "Your financial rhythm isn't random — Pulse detects it, and Nova
                helps you understand it."
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
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
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1 tracking-tight">
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

        {/* Right Side: Auth Interface */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] bg-[#0A0908] border border-white/5 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Header for Mobile */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10">
              <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border border-primary/20 flex items-center justify-center shadow-2xl">
                  <img
                    src="/pulse-logo-circular.svg"
                    alt="Nova"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                Pulse
              </h1>
              <p className="text-white/40 text-[10px] leading-relaxed max-w-[240px] italic mt-2">
                "Your financial rhythm isn't random — Pulse detects it, and Nova
                helps you understand it."
              </p>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? "Welcome Back" : "Initialize Profile"}
              </h3>
              <p className="text-muted-foreground font-medium text-sm">
                {isLogin
                  ? "Establish uplink to your command center."
                  : "Begin your journey into behavioral intelligence."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all font-semibold text-white placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all font-semibold text-white placeholder:text-muted-foreground/40"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Secret Key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-14 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all font-semibold text-white placeholder:text-muted-foreground/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isLogin && (
                <div className="flex justify-end px-2">
                  <button
                    type="button"
                    className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Forgot Secret Key?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(45,237,156,0.25)] uppercase tracking-[0.2em] text-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Authenticate" : "Deploy Solution"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-10 border-t border-white/5 text-center">
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
