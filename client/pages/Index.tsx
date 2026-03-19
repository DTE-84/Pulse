import React, { useEffect, useState } from "react";

import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ChevronRight, 
  Play, 
  Flame, 
  Zap, 
  Coffee, 
  Moon, 
  Smartphone, 
  ShoppingBag,
  Info,
  ExternalLink,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  RefreshCcw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { statsAPI, transactionsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";


const chartData = [
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
      {Icon && <Icon className="w-4 h-4 text-primary opacity-30 group-hover:opacity-100 transition-all" />}
    </div>
    <div className="text-3xl font-black mb-3 tracking-tighter text-white">{value}</div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <span className={cn(trend === "up" ? "text-red-400" : "text-primary", "flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-full")}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trendValue}
      </span>
      <span className="text-muted-foreground/40 italic">vs Period Baseline</span>
    </div>
    {/* Subtle Inner Glow */}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const TriggerCard = ({ title, subtitle, icon: Icon, stats, chartColor, aiTip, colorClass }: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-[3rem] p-8 flex flex-col h-full group hover:border-white/10 transition-all hover:bg-[#0E0D0B] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
    {/* Scanline Overlay */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,13,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    
    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className="flex gap-6">
        <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-2xl transition-all group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5", colorClass)}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-black text-2xl mb-1 text-white tracking-tighter">{title}</h3>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-tight opacity-70">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-primary/20">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(45,237,156,1)]" />
        Nova Active
      </div>
    </div>

    <div className="grid grid-cols-3 gap-6 mb-8 pt-6 border-t border-white/5">
      {stats.map((stat: any, i: number) => (
        <div key={i}>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{stat.label}</div>
          <div className="text-lg font-bold text-white flex items-center gap-1">
            {stat.value}
            {stat.trend && (
              <span className={cn("text-[10px] font-bold", stat.trend === "up" ? "text-red-400" : "text-primary")}>
                {stat.trend === "up" ? "+" : ""}{stat.trendValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>

    <div className="h-32 mb-8 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 3 ? chartColor : "rgba(255,255,255,0.03)"}
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Bar>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 600 }}
            dy={15}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="space-y-4 mt-auto">
      <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 relative group/tip cursor-pointer hover:bg-white/[0.03] transition-colors">
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
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">Nova Analysis</p>
              <p className="text-[12px] font-bold text-white group-hover/nova:text-primary transition-colors">Apply spending pause?</p>
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const syncData = async () => {
    setSyncing(true);
    toast({
      title: "Syncing Nexus Telemetry",
      description: "Processing natural input via Python Wrangler...",
    });

    try {
      // In a real live test, you'd have a modal to paste JSON
      // For this first step, we'll sync a test set of "Natural Input"
      const naturalInput = [
        { date: "2026-03-15", amount: 150.00, category: "Dining", risk_category: "Lifestyle" },
        { date: "2026-03-16", amount: 45.00, category: "Transport", risk_category: "Essential" },
        { date: "2026-03-17", amount: 800.00, category: "Tech", risk_category: "Impulse" },
        { date: "2026-03-18", amount: 1200.00, category: "Rent", risk_category: "Essential" },
        { date: "2026-03-19", amount: 60.00, category: "Sub", risk_category: "Lifestyle" }
      ];

      await transactionsAPI.ingest({ transactions: naturalInput });
      
      // Refresh stats
      const res = await statsAPI.get();
      setStats(res.data);

      toast({
        title: "Nexus Synchronized",
        description: "Your behavioral dashboard is now live.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Behavioral Wrangler connection was interrupted.",
      });
    } finally {
      setSyncing(false);
    }
  };
  

  const runAnalysis = () => {
    setAnalyzing(true);
    toast({
      title: "Nova Deep Scan Initialized",
      description: "Analyzing high-velocity behavioral trajectories...",
    });
    setTimeout(() => {
      setAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "No immediate threats detected beyond the known capital breach.",
      });
    }, 3000);
  };

  const executeDemand = () => {
    toast({
      variant: "destructive",
      title: "Protocol Executed",
      description: "Demand for payment issued to Mahogany. Tracking for response.",
    });
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      {/* Breadcrumbs - Scaled Down for Mobile */}
      <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] overflow-x-auto whitespace-nowrap scrollbar-hide">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="hover:text-white cursor-pointer transition-colors">Analytics</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-primary">Triggers</span>
      </div>

      {/* Header - Optimized Layout */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Spending Triggers</h1>
          <p className="text-muted-foreground font-semibold text-sm max-w-lg leading-snug">
            {stats?.triggers?.length || 0} active triggers detected, <span className="text-primary font-bold">Live Data</span> via Nova.
          </p>
        </div>
        
        {/* Nova Insight Briefing */}
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
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Briefing</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                  {stats?.novaTone || 'Balanced'} Protocol
                </span>
              </div>
              <p className="text-sm md:text-base text-white font-medium leading-relaxed max-w-3xl italic">
                "{stats?.novaInsight || "I'm currently stabilizing your behavioral baseline. No critical deviations detected in your spending rhythm."}"
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-3 rounded-full text-[10px] font-black transition-all group shadow-lg uppercase tracking-widest disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-red-400" />}
              {analyzing ? "Analyzing Telemetry..." : "Initialize AI Analysis"}
            </button>
            <button 
              onClick={syncData}
              disabled={syncing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-3 rounded-full text-[10px] font-black transition-all group shadow-lg uppercase tracking-widest disabled:opacity-50"
            >
              {syncing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              {syncing ? "Syncing..." : "Sync Nexus Data"}
            </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none text-center bg-white/5 border border-white/5 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Last 30d
            </div>
            <div className="flex-1 sm:flex-none text-center bg-white/5 border border-white/5 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              All Sites
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Balance" 
          value={`$${stats?.totalBalance?.toLocaleString()}`} 
          trend="up" 
          trendValue="8%" 
          colorClass="bg-primary"
        />
        <StatCard 
          label="Target Recovery" 
          value="$10,000" 
          trend="down" 
          trendValue="Critical" 
          colorClass="bg-red-500"
          icon={AlertCircle}
        />
        <StatCard 
          label="Monthly Baseline" 
          value={`$${stats?.baselineSpend || 2500}`} 
          trend={stats?.monthlyExpenses > (stats?.baselineSpend || 2500) ? "up" : "down"} 
          trendValue={`${Math.abs(Math.round(((stats?.monthlyExpenses || 0) / (stats?.baselineSpend || 1)) * 100 - 100))}%`} 
          colorClass="bg-blue-400"
        />
        <StatCard 
          label="Mindful Streak" 
          value="14d" 
          trend="up" 
          trendValue="2d" 
          colorClass="bg-primary"
          icon={Flame}
        />
      </div>

      {/* Asset Recovery Mission Section */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <AlertCircle size={100} className="text-red-500" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border-red-500/20">
                Critical Asset Recovery
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target: Mahogany (10k)</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter">Non-Performing Asset Management</h2>
            <p className="text-sm text-muted-foreground font-medium max-w-xl">
              Recovery protocol initialized for $10,000 capital breach. Status: <span className="text-red-400 font-bold">Delinquent</span>. 
              Liquidity gap identified. Redirecting Nova analysis to prioritize high-velocity income generation.
            </p>
          </div>
          <div className="w-full md:w-64 space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Recovery Progress</span>
              <span className="text-red-400">0% Collected</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-red-500 w-[2%] shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
            <button 
              onClick={executeDemand}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Execute Demand Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats?.triggers?.map((trigger: any) => (
          <TriggerCard 
            key={trigger.id}
            title={trigger.name}
            subtitle={trigger.description || "Identified behavioral trajectory"}
            icon={Zap}
            colorClass={trigger.status === 'Critical' ? 'text-red-400' : 'text-primary'}
            chartColor={trigger.status === 'Critical' ? '#ef4444' : '#2DED9C'}
            stats={[
              { label: "Detected", value: trigger.status || "Active" },
              { label: "Impact", value: `$${trigger.impact || '0'}` },
              { label: "Status", value: "Monitoring" }
            ]}
            aiTip={trigger.insight || "The AI Consultant is analyzing this trajectory for deviations."}
          />
        ))}
        {(!stats?.triggers || stats?.triggers?.length === 0) && (
          <div className="col-span-2 p-12 bg-[#12110F] border border-dashed border-white/10 rounded-[2.5rem] text-center">
            <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Your financial rhythm is currently steady. No triggers detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
