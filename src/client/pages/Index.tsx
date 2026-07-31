import { useEffect, useState, useRef } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Play,
  Flame,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  RefreshCcw,
  Target,
  TrendingUp,
  Wallet,
  ArrowRight,
  Zap,
  Crown,
} from "lucide-react";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { statsAPI, transactionsAPI, novaServiceAPI, plaidAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
// framer-motion removed — animations use CSS transitions via useEffect

/** CSS-transition animated progress bar — replaces framer-motion motion.div */
const ProgressBar = ({ targetWidth, className }: { targetWidth: string; className?: string }) => {
  const [width, setWidth] = useState("0%");
  useEffect(() => {
    const t = setTimeout(() => setWidth(targetWidth), 50);
    return () => clearTimeout(t);
  }, [targetWidth]);
  return (
    <div
      className={className}
      style={{ width, transition: "width 2s ease-out" }}
    />
  );
};

const WealthVault = ({ stats }: any) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);
  const baseline = stats?.baselineSpend || 2500;
  const current = stats?.monthlyExpenses || 0;
  const progress = Math.min(100, (current / baseline) * 100);
  const isOver = current > baseline;

  // Savings Velocity: (Income - Spend) / Income
  const income = stats?.monthlyIncome || 5200;
  const savingsRate = Math.max(0, ((income - current) / income) * 100);

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mx-auto group">
      {/* Background Glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000",
          isOver ? "bg-red-500" : "bg-primary",
        )}
      />

      <svg
        viewBox="0 0 256 256"
        className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(45,237,156,0.3)]"
      >
        {/* Outer Ring: Baseline Protection */}
        <circle
          cx="128"
          cy="128"
          r="110"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-white/[0.03]"
        />
        <circle
          cx="128"
          cy="128"
          r="110"
          stroke={isOver ? "#ef4444" : "#2DED9C"}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 110}
          strokeDashoffset={
            animated
              ? 2 * Math.PI * 110 * (1 - progress / 100)
              : 2 * Math.PI * 110
          }
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 2s ease-out" }}
        />

        {/* Inner Ring: Savings Velocity */}
        <circle
          cx="128"
          cy="128"
          r="85"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/[0.02]"
        />
        <circle
          cx="128"
          cy="128"
          r="85"
          stroke="#60A5FA"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 85}
          strokeDashoffset={
            animated
              ? 2 * Math.PI * 85 * (1 - savingsRate / 100)
              : 2 * Math.PI * 85
          }
          strokeLinecap="round"
          className="opacity-60"
          style={{ transition: "stroke-dashoffset 2.5s 0.5s ease-out" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
        <div
          className="text-4xl font-black text-foreground tracking-tighter transition-all duration-500"
          style={{
            opacity: animated ? 1 : 0,
            transform: animated ? "scale(1)" : "scale(0.9)",
          }}
        >
          {Math.round(savingsRate)}%
        </div>
        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
          Savings Velocity
        </div>
        <div
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest mt-2",
            isOver
              ? "bg-red-500/10 text-red-400"
              : "bg-primary/10 text-primary",
          )}
        >
          {isOver ? "High Drift" : "Optimal"}
        </div>
      </div>
    </div>
  );
};

const fallbackChartData = [
  { day: "M", value: 30 },
  { day: "T", value: 45 },
  { day: "W", value: 25 },
  { day: "T", value: 60 },
  { day: "F", value: 40 },
  { day: "S", value: 35 },
  { day: "S", value: 20 },
];

const TriggerCard = ({
  title,
  subtitle,
  stats,
  chartColor,
  aiTip,
  colorClass,
}: any) => (
  <div className="bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 flex flex-col h-full group hover:bg-muted/30 transition-all shadow-xl relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,13,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className="flex gap-6">
        <div
          className={cn(
            "w-16 h-16 rounded-[2rem] flex items-center justify-center bg-muted border border-border shadow-2xl transition-all group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5",
            colorClass,
          )}
        >
          <Zap className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-black text-2xl mb-1 text-foreground tracking-tighter">
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-tight opacity-70">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-primary/20">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(45,237,156,1)]" />
        Nova insight
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 pt-6 border-t border-border">
      {stats.map((stat: any, i: number) => (
        <div key={i}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            {stat.label}
          </div>
          <div className="text-lg font-bold text-foreground">{stat.value}</div>
        </div>
      ))}
    </div>

    <div className="h-32 mb-8 -mx-2">
      <MiniBarChart
        data={stats?.chartData || fallbackChartData}
        dataKey="value"
        labelKey="day"
        radius={6}
        cellColor={(_datum, index) => {
          const chartData = stats?.chartData || fallbackChartData;
          return index === chartData.length - 1
            ? chartColor
            : "rgba(0,0,0,0.05)";
        }}
        height="100%"
      />
    </div>

    <div className="space-y-4 mt-auto">
      <div className="bg-muted border border-border rounded-3xl p-5 relative hover:bg-muted/80 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-red-400/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            {aiTip}
          </p>
        </div>
      </div>

      <Link to="/nova" className="block">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-center justify-between group/nova cursor-pointer hover:bg-primary/10 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
              <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">
                Talk with Nova
              </p>
              <p className="text-[12px] font-bold text-foreground group-hover/nova:text-primary transition-colors">
                Explore this pattern further
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary group-hover/nova:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  </div>
);

export default function Index() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const trialDaysLeft = user?.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSeedSandbox = async () => {
    setSyncing(true);
    toast({
      title: "Initializing Sandbox",
      description: "Establishing direct Plaid sandbox uplink...",
    });

    try {
      await plaidAPI.sandboxSeed();
      
      // Refresh stats to get latest data
      const res = await statsAPI.get();
      setStats(res.data);

      toast({
        title: "Sandbox Primed",
        description: "Pulse is now linked to a Chase Sandbox account. Nova is ready for analysis.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sandbox Error",
        description: err.response?.data?.message || "Could not established analytical link to sandbox.",
      });
    } finally {
      setSyncing(false);
    }
  };



  const runAnalysis = async () => {
    setAnalyzing(true);
    toast({
      title: "Nova is reviewing your patterns",
      description: "Analyzing your spending behavior and rhythm...",
    });

    try {
      const res = await novaServiceAPI.getAnalysis();
      setAnalyzing(false);

      // Update stats if needed, but the analysis is mostly for the insight
      toast({
        title: "Deep Scan Complete",
        description: res.data.report,
        duration: 10000,
      });

      // Refresh stats to get latest novaInsight
      const statsRes = await statsAPI.get();
      setStats(statsRes.data);
    } catch (err: any) {
      setAnalyzing(false);
      const errorMsg = err.response?.data?.message || "Nova encountered a signal deviation during the scan.";
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: errorMsg,
      });
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading before fetching stats
    if (authLoading || !isAuthenticated || !user) return;

    console.log("[PulseAi] Dashboard Routing Check:", {
      isDemo: user.isDemo,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt
    });

    // Redirect to subscription if trial expired and no active sub
    const isTrialExpired = user.subscriptionStatus === 'trialing' && user.trialEndsAt && new Date(user.trialEndsAt) < new Date();
    const isExplicitlyInactive = user.subscriptionStatus === 'inactive' || user.subscriptionStatus === 'expired';
    
    // Only redirect if explicitly inactive or expired. 
    if (!user.isDemo && (isTrialExpired || isExplicitlyInactive) && user.subscriptionStatus !== 'active') {
      console.log("[PulseAi] Redirecting to /subscription: Trial expired or account inactive.");
      navigate("/subscription");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await statsAPI.get();
        setStats(res.data);
      } catch (err) {
        console.error("[PulseAi] Dashboard Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated, authLoading, navigate, user?.id, user?.subscriptionStatus, user?.isDemo, user?.trialEndsAt]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10 text-foreground">
      <h1 className="sr-only">Financial Dashboard</h1>

      {/* Sandbox Mode Strip — guest/demo users only */}
      {(user?.isDemo || user?.subscriptionStatus === 'trialing') && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-5 py-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0 border border-yellow-500/20">
              <Database className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-0.5">
                You're in Sandbox Mode
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                You're viewing demo data. Pre-Order Pro to unlock real,
                live-synced accounts.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            {stats?.totalBalance > 0 && (
              <button 
                onClick={handleSeedSandbox}
                disabled={syncing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent border border-yellow-500/50 text-yellow-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/10 active:scale-95 transition-all"
              >
                {syncing ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                {syncing ? "Resetting..." : "Reset Data"}
              </button>
            )}
            <button 
              onClick={() => navigate("/subscription")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-yellow-400 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.25)]"
            >
              <Crown className="w-3.5 h-3.5" />
              Pre-Order Pro
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State Banner for New Users */}
      {(!stats || stats?.totalBalance === 0) && user?.subscriptionStatus === 'trialing' && (
        <div className="bg-primary/10 border border-primary/20 rounded-[1.5rem] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
            <Zap size={150} className="text-primary" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter text-primary mb-2 uppercase">Welcome to Pulse</h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-md leading-relaxed">Your dashboard is currently empty. Load our high-fidelity demo data to see the behavioral engine in action.</p>
          </div>
          <button
            onClick={handleSeedSandbox}
            disabled={syncing}
            className="w-full md:w-auto relative z-10 flex items-center justify-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-2xl text-[12px] font-black transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(45,237,156,0.3)] disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            {syncing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {syncing ? "Initializing..." : "Load Demo Data"}
          </button>
        </div>
      )}

      {/* High-Density Metric Node (Top Priority) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
         <div className="bg-card border border-border rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Balance</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter font-jura">${stats?.totalBalance?.toLocaleString() || "0"}</h2>
            <p className="text-[7px] md:text-[8px] font-bold text-primary uppercase tracking-widest mt-1">Live Account</p>
         </div>
         <div className="bg-card border border-border rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Spend</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter font-jura">${stats?.monthlyExpenses?.toLocaleString() || "0"}</h2>
            <p className={cn(
              "text-[7px] md:text-[8px] font-bold uppercase tracking-widest mt-1",
              (stats?.spendingDeltaPct || 0) > 0 ? "text-red-400" : "text-emerald-400"
            )}>
              {Math.abs(stats?.spendingDeltaPct || 0).toFixed(1)}% vs target
            </p>
         </div>
         <div className="bg-card border border-border rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-muted-foreground opacity-20" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Limit</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter font-jura">${stats?.baselineSpend?.toLocaleString() || "0"}</h2>
            <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Monthly Goal</p>
         </div>
         <div className="bg-card border border-border rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-20" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Risk Triggers</p>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter font-jura">{stats?.activeSignals || "12"}</h2>
            <p className="text-[7px] md:text-[8px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Active Alerts</p>
         </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-primary/5 border border-primary/20 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 relative overflow-hidden group transition-all hover:bg-primary/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-primary" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(45,237,156,0.25)]">
                <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    Nova’s Analysis
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
                    {stats?.novaTone || "Balanced"}
                  </span>
                </div>
                <p className="text-sm md:text-base text-foreground font-medium leading-relaxed max-w-3xl italic">
                  “
                  {stats?.novaInsight ||
                    "I’m watching your spending patterns and progress. Sync data to give me more to work with."}
                  ”
                </p>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="shrink-0 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              {analyzing ? (
                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Connect Accounts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-[1.5rem] md:rounded-[3.5rem] p-6 md:p-10 min-h-[550px] flex flex-col md:flex-row items-center gap-6 sm:gap-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <WealthVault stats={stats} />
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tighter mb-2">
                  Vault Trajectory
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nova is measuring your{" "}
                  <span className="text-foreground font-bold">Savings Velocity</span>{" "}
                  against your target baseline. Currently, you are
                  protecting{" "}
                  <span className="text-primary font-bold">
                    {100 -
                      Math.round(
                        (stats?.monthlyExpenses / stats?.baselineSpend) * 100 ||
                          0,
                      )}
                    %
                  </span>{" "}
                  of your target liquidity.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="bg-muted rounded-2xl p-4 border border-border flex flex-col justify-between h-full">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Projected Spend
                  </p>
                  <p className="text-lg font-black text-foreground">
                    $
                    {stats?.projection?.projectedSpend?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="bg-muted rounded-2xl p-4 border border-border flex flex-col justify-between h-full">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Daily Velocity
                  </p>
                  <p
                    className={cn(
                      "text-lg font-black",
                      stats?.projection?.isHighVelocity
                        ? "text-red-400"
                        : "text-primary",
                    )}
                  >
                    ${stats?.projection?.velocity || "0"}/d
                  </p>
                </div>
              </div>
              <Link to="/growth" className="block">
                <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-black uppercase tracking-widest text-[10px] py-6">
                  View Wealth Analytics{" "}
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col justify-center space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Pulse Signal
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter leading-tight">
              Catch drift before it becomes a pattern.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trigger spending matters most when it repeats quietly. That’s
              where Nova helps you notice the pattern early.
            </p>
            <div className="pt-4">
              <div className="h-1 bg-muted rounded-full w-full overflow-hidden">
                <ProgressBar targetWidth="65%" className="h-full bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]" />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3">
                Behavioral Integrity: 65%
              </p>
            </div>
          </div>
        </div>
        {user?.subscriptionStatus !== 'trialing' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-3 rounded-full text-[10px] font-black transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {analyzing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-red-400" />
              )}
              {analyzing ? "Reviewing..." : "Scan Patterns"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats?.triggers?.map((trigger: any) => (
          <TriggerCard
            key={trigger.name}
            title={trigger.name}
            subtitle={trigger.status || "Spending pattern detected"}
            colorClass={
              trigger.status === "High" ? "text-red-400" : "text-primary"
            }
            chartColor={trigger.status === "High" ? "#ef4444" : "#2DED9C"}
            stats={[
              { label: "Status", value: trigger.status || "Active" },
              { label: "Impact", value: `$${trigger.impact || "0"}` },
              { label: "View", value: "Open" },
              { chartData: stats?.chartData || fallbackChartData },
            ].filter((item) => !item.chartData)}
            aiTip={
              trigger.insight || "Nova is watching for repeat behavior here."
            }
          />
        ))}
        {(!stats?.triggers || stats?.triggers?.length === 0) && (
          <div className="col-span-2 p-12 bg-card border border-dashed border-border rounded-[2.5rem] text-center">
            <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              Your spending rhythm is currently steady. No trigger patterns are
              standing out.
            </p>
          </div>
        )}
      </div>

      {/* Founding Member Banner */}
      <div
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group hover:bg-primary/[0.12] transition-all cursor-pointer mt-6"
        onClick={() => navigate("/subscription")}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Founding Member — Limited Window</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
              Lock in $14.99/mo — rate frozen for life.
            </h2>
            <p className="text-muted-foreground font-semibold max-w-xl leading-relaxed">
              Early members get{" "}
              <span className="text-primary underline underline-offset-4 decoration-primary/30">
                price-locked access
              </span>
              , a direct line to the product roadmap, and first access to every feature that ships — all for 7 days free.
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(45,237,156,0.3)] flex items-center gap-3 shrink-0">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
