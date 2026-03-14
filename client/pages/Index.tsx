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
  Sparkles
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
import { statsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
  <div className="bg-[#12110F] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:bg-[#1A1917] transition-all">
    <div className={cn("absolute top-0 left-0 w-1 h-full opacity-50", colorClass)} />
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-primary opacity-50" />}
    </div>
    <div className="text-3xl font-bold mb-3 tracking-tight">{value}</div>
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight">
      <span className={cn(trend === "up" ? "text-red-400" : "text-primary", "flex items-center gap-0.5")}>
        {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {trendValue}
      </span>
      <span className="text-muted-foreground/60">vs last month</span>
    </div>
  </div>
);

const TriggerCard = ({ title, subtitle, icon: Icon, stats, chartColor, aiTip, colorClass }: any) => (
  <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full group hover:border-white/10 transition-all hover:bg-[#151412] shadow-2xl">
    <div className="flex justify-between items-start mb-8">
      <div className="flex gap-5">
        <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner transition-transform group-hover:scale-105", colorClass)}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-bold text-xl mb-1 text-white">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium leading-tight">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Active
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
  const { user } = useAuth();

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
          <Link to="/nova" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-3 rounded-full text-[10px] font-black transition-all group shadow-lg uppercase tracking-widest">
              <Play className="w-3 h-3 fill-red-400" />
              Initialize AI Analysis
            </button>
          </Link>
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
          label="Monthly Baseline" 
          value={`$${stats?.baselineSpend || 2500}`} 
          trend={stats?.monthlyExpenses > (stats?.baselineSpend || 2500) ? "up" : "down"} 
          trendValue={`${Math.abs(Math.round(((stats?.monthlyExpenses || 0) / (stats?.baselineSpend || 1)) * 100 - 100))}%`} 
          colorClass="bg-blue-400"
        />
        <StatCard 
          label="Awareness" 
          value="82%" 
          trend="up" 
          trendValue="5%" 
          colorClass="bg-orange-400"
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
