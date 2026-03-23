import React, { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Play,
  Flame,
  Zap,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  RefreshCcw,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { statsAPI, transactionsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

const fallbackChartData = [
  { day: "M", value: 30 },
  { day: "T", value: 45 },
  { day: "W", value: 25 },
  { day: "T", value: 60 },
  { day: "F", value: 40 },
  { day: "S", value: 35 },
  { day: "S", value: 20 },
];

const StatCard = ({ label, value, trend, trendValue, icon: Icon, colorClass }: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-3xl p-6 relative overflow-hidden group hover:bg-[#11100D] transition-all hover:border-white/10 shadow-2xl">
    <div className={cn("absolute top-0 left-0 w-1.5 h-full opacity-30 group-hover:opacity-100 transition-opacity", colorClass)} />
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-all" />}
    </div>
    <div className="text-3xl font-black mb-3 tracking-tighter text-white">{value}</div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <span className={cn(trend === "up" ? "text-red-400" : "text-primary", "flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-full")}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trendValue}
      </span>
      <span className="text-muted-foreground/40 italic">vs baseline</span>
    </div>
  </div>
);

const TriggerCard = ({ title, subtitle, stats, chartColor, aiTip, colorClass }: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-[3rem] p-8 flex flex-col h-full group hover:border-white/10 transition-all hover:bg-[#0E0D0B] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,13,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className="flex gap-6">
        <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-2xl transition-all group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5", colorClass)}>
          <Zap className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-black text-2xl mb-1 text-white tracking-tighter">{title}</h3>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-tight opacity-70">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-primary/20">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(45,237,156,1)]" />
        Nova insight
      </div>
    </div>

    <div className="grid grid-cols-3 gap-6 mb-8 pt-6 border-t border-white/5">
      {stats.map((stat: any, i: number) => (
        <div key={i}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{stat.label}</div>
          <div className="text-lg font-bold text-white">{stat.value}</div>
        </div>
      ))}
    </div>

    <div className="h-32 mb-8 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats.chartData || fallbackChartData}>
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {(stats.chartData || fallbackChartData).map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={index === ((stats.chartData || fallbackChartData).length - 1) ? chartColor : "rgba(255,255,255,0.03)"}
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Bar>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 600 }} dy={15} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="space-y-4 mt-auto">
      <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 relative hover:bg-white/[0.03] transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-red-400/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">{aiTip}</p>
        </div>
      </div>

      <Link to="/nova" className="block">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-center justify-between group/nova cursor-pointer hover:bg-primary/10 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
              <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">Talk with Nova</p>
              <p className="text-[12px] font-bold text-white group-hover/nova:text-primary transition-colors">Explore this pattern further</p>
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
  const [syncing, setSyncing] = useState(false);
  const [ingestData, setIngestData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          return { date, amount: parseFloat(amount), category, risk_category };
        });
      }

      await transactionsAPI.ingest({ transactions });
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

  const runAnalysis = () => {
    setAnalyzing(true);
    toast({
      title: "Nova is reviewing your patterns",
      description: "Looking for changes in spending pace and trigger risk...",
    });
    setTimeout(() => {
      setAnalyzing(false);
      toast({
        title: "Review complete",
        description: "Your latest trends and trigger signals are ready.",
      });
    }, 3000);
  };

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyTrendUp = (stats?.monthlyDiff || 0) > 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] overflow-x-auto whitespace-nowrap scrollbar-hide">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="hover:text-white cursor-pointer transition-colors">Dashboard</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-primary">Insights</span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Your financial heartbeat</h1>
          <p className="text-muted-foreground font-semibold text-sm max-w-2xl leading-snug">
            Pulse tracks your spending rhythm. Nova helps you understand what it means and where your habits are helping or hurting your progress.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 relative overflow-hidden group transition-all hover:bg-primary/10">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-primary" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
              <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Nova’s insight</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                  {stats?.novaTone || "Balanced"} mode
                </span>
              </div>
              <p className="text-sm md:text-base text-white font-medium leading-relaxed max-w-3xl italic">
                “{stats?.novaInsight || "I’m watching your spending patterns and progress. Sync data to give me more to work with."}”
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Goal focus</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-2">Stay close to your baseline to move faster.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The more consistently you protect your monthly baseline, the easier it is for Nova to connect short-term behavior to long-term goals.
            </p>
          </div>
          <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Trigger focus</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-2">Catch drift before it becomes a pattern.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trigger spending matters most when it repeats quietly. That’s where Nova should help you notice the pattern early.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-3 rounded-full text-[10px] font-black transition-all uppercase tracking-widest disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-red-400" />}
            {analyzing ? "Reviewing..." : "Run Nova review"}
          </button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                disabled={syncing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-3 rounded-full text-[10px] font-black transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {syncing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {syncing ? "Syncing..." : "Sync transactions"}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0907] border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter">Transaction sync</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  Paste JSON or CSV transaction data below to refresh your Pulse dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder='[{"date": "2026-03-20", "amount": 150.00, "category": "Dining", "risk_category": "Lifestyle"}]'
                  value={ingestData}
                  onChange={(e) => setIngestData(e.target.value)}
                  className="min-h-[200px] bg-white/5 border-white/10 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground italic">Format: date,amount,category,risk_category (one per line) or valid JSON array.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full border-white/10 hover:bg-white/5">
                  Cancel
                </Button>
                <Button onClick={handleIngest} disabled={syncing} className="bg-primary text-black hover:bg-primary/80 rounded-full font-black uppercase tracking-widest px-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats?.triggers?.map((trigger: any) => (
          <TriggerCard
            key={trigger.id}
            title={trigger.name}
            subtitle={trigger.status || "Spending pattern detected"}
            colorClass={trigger.status === "High" ? "text-red-400" : "text-primary"}
            chartColor={trigger.status === "High" ? "#ef4444" : "#2DED9C"}
            stats={[
              { label: "Status", value: trigger.status || "Active" },
              { label: "Impact", value: `$${trigger.impact || "0"}` },
              { label: "View", value: "Open" },
              { chartData: stats?.chartData || fallbackChartData },
            ].filter((item) => !item.chartData)}
            aiTip={trigger.insight || "Nova is watching for repeat behavior here."}
          />
        ))}
        {(!stats?.triggers || stats?.triggers?.length === 0) && (
          <div className="col-span-2 p-12 bg-[#12110F] border border-dashed border-white/10 rounded-[2.5rem] text-center">
            <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Your spending rhythm is currently steady. No trigger patterns are standing out.</p>
          </div>
        )}
      </div>
    </div>
  );
}
