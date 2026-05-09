import { useEffect, useState } from "react";
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
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { statsAPI, transactionsAPI, novaServiceAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const WealthVault = ({ stats }: any) => {
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
        <motion.circle
          cx="128"
          cy="128"
          r="110"
          stroke={isOver ? "#ef4444" : "#2DED9C"}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 110}
          initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
          animate={{
            strokeDashoffset: 2 * Math.PI * 110 * (1 - progress / 100),
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          strokeLinecap="round"
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
        <motion.circle
          cx="128"
          cy="128"
          r="85"
          stroke="#60A5FA"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 85}
          initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
          animate={{
            strokeDashoffset: 2 * Math.PI * 85 * (1 - savingsRate / 100),
          }}
          transition={{ duration: 2.5, delay: 0.5, ease: "easeOut" }}
          strokeLinecap="round"
          className="opacity-60"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-black text-foreground tracking-tighter"
        >
          {Math.round(savingsRate)}%
        </motion.div>
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

const StatCard = ({
  label,
  value,
  trend,
  trendValue,
  icon: Icon,
  colorClass,
}: any) => (
  <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group hover:bg-muted/50 transition-all shadow-2xl">
    <div
      className={cn(
        "absolute top-0 left-0 w-1.5 h-full opacity-30 group-hover:opacity-100 transition-opacity",
        colorClass,
      )}
    />
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">
        {label}
      </span>
      {Icon && (
        <Icon className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-all" />
      )}
    </div>
    <div className="text-3xl font-black mb-3 tracking-tighter text-foreground">
      {value}
    </div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <span
        className={cn(
          trend === "up" ? "text-red-400" : "text-primary",
          "flex items-center gap-0.5 bg-muted px-2 py-0.5 rounded-full",
        )}
      >
        {trend === "up" ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        {trendValue}
      </span>
      <span className="text-muted-foreground/40 italic">vs baseline</span>
    </div>
  </div>
);

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
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.chartData || fallbackChartData}>
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {(stats.chartData || fallbackChartData).map(
              (_entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === (stats.chartData || fallbackChartData).length - 1
                      ? chartColor
                      : "rgba(0,0,0,0.05)"
                  }
                  className="transition-all duration-500 hover:opacity-80"
                />
              ),
            )}
          </Bar>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(100,100,100,0.4)",
              fontSize: 11,
              fontWeight: 600,
            }}
            dy={15}
          />
        </BarChart>
      </ResponsiveContainer>
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
  const [ingestData, setIngestData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [triggerId, setTriggerId] = useState<string>("0"); // Default to no trigger
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleIngest = async () => {
    if (!ingestData.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please provide valid transaction data.",
      });
      return;
    }

    setSyncing(true);
    setIsDialogOpen(false);
    toast({
      title: "Syncing data",
      description: "Processing transactions and refreshing your dashboard...",
    });

    try {
      let transactions;
      try {
        transactions = JSON.parse(ingestData);
        if (!Array.isArray(transactions)) transactions = [transactions];
      } catch {
        const lines = ingestData.split("\n").filter((l) => l.trim());
        transactions = lines.map((line) => {
          const [date, amount, category, risk_category] = line.split(",");
          return {
            date,
            amount: parseFloat(amount),
            category,
            risk_category,
            trigger_id: triggerId !== "0" ? parseInt(triggerId) : undefined,
          };
        });
      }

      // If it was JSON, we also apply the trigger if selected
      const dataToSync = Array.isArray(transactions)
        ? transactions.map((t) => ({
            ...t,
            trigger_id:
              t.trigger_id ||
              (triggerId !== "0" ? parseInt(triggerId) : undefined),
          }))
        : transactions;

      await transactionsAPI.ingest({ transactions: dataToSync });
      const res = await statsAPI.get();
      setStats(res.data);

      toast({
        title: "Dashboard updated",
        description: "Your latest spending data is now reflected in Pulse.",
      });
      setIngestData("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "We couldn’t process that transaction data.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    toast({
      title: "Nova is reviewing your patterns",
      description: "Performing high-fidelity behavioral telemetry scan...",
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
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await statsAPI.get();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch Pulse stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyTrendUp = (stats?.monthlyDiff || 0) > 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 text-foreground">
      <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] overflow-x-auto whitespace-nowrap scrollbar-hide">
        <span className="hover:text-primary cursor-pointer transition-colors">
          Home
        </span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="hover:text-primary cursor-pointer transition-colors">
          Dashboard
        </span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-primary">Insights</span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
              Your financial heartbeat
            </h1>
            {stats?.projection?.isHighVelocity && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">
                High-Velocity Surge
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-semibold text-sm max-w-2xl leading-snug">
            Pulse tracks your spending rhythm. Nova helps you understand what it
            means and where your habits are helping or hurting your progress.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 relative overflow-hidden group transition-all hover:bg-primary/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-primary" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
                <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    Nova’s insight
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
                    {stats?.novaTone || "Balanced"} mode
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
              Initialize Deep Scan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <WealthVault stats={stats} />
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter mb-2">
                  Vault Trajectory
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nova is measuring your{" "}
                  <span className="text-foreground font-bold">Savings Velocity</span>{" "}
                  against your deterministic baseline. Currently, you are
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-2xl p-4 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Projected Spend
                  </p>
                  <p className="text-lg font-black text-foreground">
                    $
                    {stats?.projection?.projectedSpend?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="bg-muted rounded-2xl p-4 border border-border">
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

          <div className="bg-card border border-border rounded-[3rem] p-10 flex flex-col justify-center space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Pulse Signal
              </span>
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-tight">
              Catch drift before it becomes a pattern.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trigger spending matters most when it repeats quietly. That’s
              where Nova helps you notice the pattern early.
            </p>
            <div className="pt-4">
              <div className="h-1 bg-muted rounded-full w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]"
                />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3">
                Behavioral Integrity: 65%
              </p>
            </div>
          </div>
        </div>

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
            {analyzing ? "Reviewing..." : "Run Nova review"}
          </button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                disabled={syncing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-3 rounded-full text-[10px] font-black transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCcw className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                {syncing ? "Syncing..." : "Sync transactions"}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border text-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter">
                  Transaction sync
                </DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  Paste JSON or CSV transaction data below to refresh your Pulse
                  dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Contextual Catalyst (Trigger)
                  </label>
                  <select
                    value={triggerId}
                    onChange={(e) => setTriggerId(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                  >
                    <option value="0">No specific trigger</option>
                    <option value="1">Stress (High Risk)</option>
                    <option value="2">Boredom (Medium Risk)</option>
                    <option value="3">Social Pressure (Medium Risk)</option>
                    <option value="4">Celebration (Low Risk)</option>
                    <option value="5">Late Night (High Risk)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Transaction Data
                  </label>
                  <Textarea
                    placeholder='[{"date": "2026-03-20", "amount": 150.00, "category": "Dining", "risk_category": "Lifestyle"}]'
                    value={ingestData}
                    onChange={(e) => setIngestData(e.target.value)}
                    className="min-h-[150px] bg-muted border border-border font-mono text-xs text-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Format: date,amount,category,risk_category (one per line) or
                  valid JSON array.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-full border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleIngest}
                  disabled={syncing}
                  className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-full font-black uppercase tracking-widest px-8"
                >
                  {syncing ? "Syncing..." : "Process data"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Balance"
          value={`$${stats?.totalBalance?.toLocaleString?.() ?? stats?.totalBalance ?? 0}`}
          trend="down"
          trendValue="Live"
          colorClass="bg-primary"
          icon={Wallet}
        />
        <StatCard
          label="Monthly Spend"
          value={`$${stats?.monthlyExpenses?.toLocaleString?.() ?? stats?.monthlyExpenses ?? 0}`}
          trend={monthlyTrendUp ? "up" : "down"}
          trendValue={`${Math.abs(stats?.spendingDeltaPct || 0)}%`}
          colorClass={monthlyTrendUp ? "bg-red-500" : "bg-primary"}
          icon={TrendingUp}
        />
        <StatCard
          label="Monthly Baseline"
          value={`$${stats?.baselineSpend || 2500}`}
          trend="down"
          trendValue="Target"
          colorClass="bg-blue-400"
          icon={Target}
        />
        <StatCard
          label="Active Signals"
          value={`${stats?.triggers?.length || 0}`}
          trend="down"
          trendValue="Review"
          colorClass="bg-primary"
          icon={Flame}
        />
      </div>

      {/* Pre-Order Banner Card */}
      <div
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group hover:bg-primary/[0.12] transition-all cursor-pointer"
        onClick={() => navigate("/subscription")}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Crown className="w-6 h-6 text-yellow-400 animate-bounce" />
              <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] px-4">
                Pre-Order Live
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
              Become a Founding Elite Member
            </h2>
            <p className="text-muted-foreground font-semibold max-w-xl leading-relaxed">
              Lock in the{" "}
              <span className="text-primary underline underline-offset-4 decoration-primary/30">
                Early-Bird $9.99/mo rate
              </span>{" "}
              forever. Get exclusive access to the investor network and custom
              behavior triggers at launch.
            </p>
          </div>
          <button className="bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(45,237,156,0.3)] flex items-center gap-3">
            Secure Your Spot
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats?.triggers?.map((trigger: any) => (
          <TriggerCard
            key={trigger.id}
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
    </div>
  );
}
