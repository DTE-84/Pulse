import React, { useState } from "react";
import { 
  ChevronRight, 
  Download, 
  Calendar, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Mail,
  Filter,
  BarChart3,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const performanceData = [
  { month: "Jan", spend: 3200, save: 1200, growth: 10 },
  { month: "Feb", spend: 2800, save: 1500, growth: 15 },
  { month: "Mar", spend: 3500, save: 800, growth: 12 },
  { month: "Apr", spend: 3100, save: 1800, growth: 20 },
  { month: "May", spend: 2900, save: 2100, growth: 25 },
  { month: "Jun", spend: 3300, save: 1400, growth: 22 },
  { month: "Jul", spend: 3000, save: 1900, growth: 30 },
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("July 2023");

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Monthly Performance</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white">Financial Reports</h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            Your performance report for <span className="text-primary underline underline-offset-8 decoration-primary/20">{selectedMonth}</span> is ready for review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 bg-white/5 border border-white/5 px-6 py-3 rounded-full text-[10px] font-black transition-all hover:bg-white/10 uppercase tracking-widest text-muted-foreground group">
            <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            PDF Export
          </button>
          <button className="bg-primary text-background px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(45,237,156,0.2)] hover:scale-105 active:scale-95 transition-all">
            Share Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Analytical Performance Narrative */}
        <div className="lg:col-span-4 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-12">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Performance Score</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-primary" />
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Savings Growth</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-white/10" />
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Spend Efficiency</span>
                </div>
              </div>
           </div>

           <div className="h-80 w-full mt-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={performanceData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                 <XAxis 
                   dataKey="month" 
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
                 <Bar dataKey="save" fill="#2DED9C" radius={[4, 4, 0, 0]} barSize={40} />
                 <Bar dataKey="spend" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Detailed Metrics */}
        <div className="lg:col-span-3 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { label: "Net Savings", value: "+$12.4k", trend: "up", trendValue: "18%", icon: TrendingUp, color: "text-primary", bg: "bg-primary/5" },
               { label: "AI Awareness", value: "94/100", trend: "up", trendValue: "5.2%", icon: Zap, color: "text-orange-400", bg: "bg-orange-400/5" },
               { label: "Streak Bonus", value: "$420", trend: "up", trendValue: "$120", icon: Flame, color: "text-red-400", bg: "bg-red-400/5" }
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
                     <span className="text-muted-foreground/40">vs last month</span>
                   </div>
                 </div>
               </div>
             ))}
           </div>

           <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">AI Behavioral Insights</h3>
                <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Full Behavior Log</button>
              </div>

              <div className="space-y-6">
                {[
                  { title: "Peak Discipline Hours", text: "You are 92% less likely to spend impulsively between 7 PM and 10 PM. This is your 'Golden Hour'.", icon: CheckCircle2, color: "text-primary" },
                  { title: "Trigger Mitigation", text: "Successfully blocked 14 'Late Night' checkout flows by using the pause feature.", icon: Sparkles, color: "text-orange-400" },
                  { title: "Savings Accelerator", text: "Moving to annual subscriptions for Pro saved you an additional $48 this year.", icon: Zap, color: "text-primary" }
                ].map((insight, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer">
                    <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", insight.color)}>
                       <insight.icon className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-base font-black text-white mb-1">{insight.title}</h4>
                       <p className="text-sm font-semibold text-muted-foreground leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                ))}
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
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Always Analyzing</p>
             </div>

             <div className="space-y-4 pt-6 flex-1">
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  "Your financial performance this month is in the <span className="text-white font-black">top 5%</span> of Pulse users. Ready to optimize your growth strategy further?"
                </p>
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-[10px] font-black text-primary uppercase tracking-widest text-left flex items-center gap-3">
                  <Flame className="w-4 h-4 fill-primary" />
                  Performance Rating: ELITE
                </div>
             </div>

             <button className="w-full bg-primary text-background font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.2)] uppercase tracking-widest text-xs mt-auto">
                Open Strategy Deck
                <ArrowRight className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
