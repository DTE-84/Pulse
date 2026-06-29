import { useEffect, useState } from "react";
import { 
  ChevronRight, 
  Download, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  BrainCircuit,
  CheckCircle2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { statsAPI, novaServiceAPI } from "@/lib/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analysisRes] = await Promise.all([
          statsAPI.get(),
          novaServiceAPI.getAnalysis()
        ]);
        setStats(statsRes.data);
        setAnalysis(analysisRes.data);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const performanceData = stats?.chartData || [];

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">System Performance</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white">Financial Reports</h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            High-fidelity performance analysis for <span className="text-primary underline underline-offset-8 decoration-primary/20">Current Period</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 bg-white/5 border border-white/5 px-6 py-3 rounded-full text-[10px] font-black transition-all hover:bg-white/10 uppercase tracking-widest text-muted-foreground group">
            <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Analytical Performance Narrative */}
        <div className="lg:col-span-4 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-12">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">7-Day Velocity Chart</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-primary" />
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Behavioral Volume</span>
                </div>
              </div>
           </div>

           <div className="h-80 w-full mt-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={performanceData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                 <XAxis 
                   dataKey="day" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700 }}
                   dy={20}
                 />
                 <YAxis hide />
                 <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                   contentStyle={{ backgroundColor: '#1A1917', border: 'none', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                 />
                 <Bar dataKey="value" fill="#2DED9C" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Detailed Metrics */}
        <div className="lg:col-span-3 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { label: "Current Volume", value: `$${stats?.monthlyExpenses?.toLocaleString()}`, trend: stats?.monthlyDiff > 0 ? "down" : "up", trendValue: `${Math.abs(stats?.spendingDeltaPct)}%`, icon: BarChart3, color: "text-primary", bg: "bg-primary/5" },
               { label: "Data Integrity", value: "100%", trend: "up", trendValue: "NOMINAL", icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-400/5" },
               { label: "Vault Drift", value: `$${Math.abs(stats?.monthlyDiff || 0).toLocaleString()}`, trend: stats?.monthlyDiff > 0 ? "down" : "up", trendValue: stats?.monthlyDiff > 0 ? "SURGE" : "SAVED", icon: Zap, color: stats?.monthlyDiff > 0 ? "text-red-400" : "text-primary", bg: "bg-red-400/5" }
             ].map((stat, i) => (
               <div key={i} className="bg-[#12110F] border border-white/5 rounded-3xl p-8 space-y-4 hover:bg-[#1A1917] transition-all cursor-pointer group">
                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                 </div>
                 <div className="space-y-1">
                   <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                   <div className="text-2xl font-black text-white">{stat.value}</div>
                   <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight">
                     <span className={cn(stat.trend === "up" ? "text-primary" : "text-red-400", "flex items-center gap-0.5")}>
                       {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                       {stat.trendValue}
                     </span>
                     <span className="text-muted-foreground/40">vs baseline</span>
                   </div>
                 </div>
               </div>
             ))}
           </div>

           <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Behavioral Synthesis</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-3">Claude 3.5 Sonnet Enabled</Badge>
              </div>

              <div className="space-y-6">
                <div className="flex gap-6 p-8 rounded-[2rem] bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles size={80} className="text-primary" />
                  </div>
                  <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform text-primary")}>
                     <BrainCircuit className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-lg font-black text-white leading-none">Nova Deep-Scan Report</h4>
                     <p className="text-sm font-semibold text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
                       "{analysis?.report || "Not enough spending data yet for a deep scan. Add more transactions to get started."}"
                     </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                      <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Top Catalyst</h5>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400">
                            <Zap className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-base font-bold text-white">{analysis?.summary?.topTrigger || "None Detected"}</div>
                            <div className="text-[10px] text-muted-foreground">Highest Spending Impact</div>
                         </div>
                      </div>
                   </div>
                   <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5">
                      <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Goal Acceleration</h5>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <TrendingUp className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-base font-bold text-white">{analysis?.summary?.acceleration === "Detected" ? "ACCELERATING" : "STABLE"}</div>
                            <div className="text-[10px] text-muted-foreground">Trajectory Shift</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Advisor Sideboard */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
           <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-8 space-y-8 flex-1 flex flex-col text-center">
             <div className="relative mx-auto w-24 h-24 mb-4">
                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 animate-pulse shadow-[0_0_30px_rgba(45,237,156,0.2)]">
                   <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(45,237,156,0.8)]">
                      <div className="w-5 h-5 rounded-full bg-background" />
                   </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border border-white/10 flex items-center justify-center">
                   <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
             </div>
             
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Nova Advisor</h3>
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Live Data Feed</p>
             </div>

             <div className="space-y-4 pt-6 flex-1 text-left">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Monthly Status</p>
                      <p className="text-sm font-bold text-white">
                         {stats?.monthlyDiff > 0 ? "Drifting above baseline" : "Protecting baseline"}
                      </p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Projection</p>
                      <p className="text-sm font-bold text-primary">
                         ${stats?.projection?.projectedSpend?.toLocaleString()} Total
                      </p>
                   </div>
                </div>
             </div>

             <button className="w-full bg-primary text-background font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.2)] uppercase tracking-widest text-xs mt-auto">
                Refresh Performance
                <ArrowRight className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
