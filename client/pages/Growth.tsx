import React, { useState } from "react";
import { 
  TrendingUp, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  Wallet, 
  LineChart as LineChartIcon,
  BarChart3,
  Calendar,
  Sparkles,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const growthData = [
  { month: "Jan", balance: 12000, target: 11000 },
  { month: "Feb", balance: 13500, target: 12500 },
  { month: "Mar", balance: 14200, target: 14000 },
  { month: "Apr", balance: 16800, target: 15500 },
  { month: "May", balance: 18400, target: 17000 },
  { month: "Jun", balance: 21500, target: 18500 },
  { month: "Jul", balance: 23200, target: 20000 },
  { month: "Aug", balance: 25400, target: 21500 },
  { month: "Sep", balance: 28900, target: 23000 },
  { month: "Oct", balance: 32400, target: 24500 },
];

const goals = [
  { id: 1, name: "Emergency Fund", icon: PiggyBank, target: 20000, current: 15400, color: "text-blue-400" },
  { id: 2, name: "House Downpayment", icon: Wallet, target: 150000, current: 32400, color: "text-primary" },
  { id: 3, name: "New Vehicle", icon: Target, target: 45000, current: 12500, color: "text-purple-400" },
];

export default function GrowthPage() {
  const [timeframe, setTimeframe] = useState("10m");

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Wealth Growth</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white">Financial Growth</h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            Your net worth is <span className="text-primary font-black">$32,400</span>, growing <span className="text-primary font-black">+14.2%</span> year-over-year.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl shrink-0">
          {["1m", "3m", "6m", "10m", "1y", "ALL"].map(t => (
            <button 
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeframe === t ? "bg-primary text-background shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-3 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-8 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
              <LineChartIcon className="w-5 h-5 text-primary" />
              Projected Wealth
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DED9C" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2DED9C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700 }}
                  dy={20}
                />
                <YAxis 
                  hide
                  domain={['dataMin - 2000', 'dataMax + 2000']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1917', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1.5rem',
                    padding: '1rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth={2}
                  strokeDasharray="10 10"
                  fill="transparent" 
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#2DED9C" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  dot={{ r: 4, fill: "#2DED9C", strokeWidth: 2, stroke: "#12110F" }}
                  activeDot={{ r: 8, fill: "#2DED9C", strokeWidth: 0, shadow: '0 0 20px rgba(45,237,156,0.5)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/5 mt-auto">
            {[
              { label: "Savings Ratio", value: "34.2%", trend: "+2.1%" },
              { label: "Growth Momentum", value: "92/100", trend: "High" },
              { label: "Time to Goal", value: "3.2 Years", trend: "-0.5" },
              { label: "Investment Yield", value: "8.4%", trend: "+0.8%" }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">{stat.value}</span>
                  <span className="text-[10px] font-black text-primary">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals & AI Insights */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
           <div className="bg-[#12110F] border border-white/5 rounded-[2.5rem] p-8 space-y-8 flex-1 flex flex-col">
             <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
               <Target className="w-5 h-5 text-primary" />
               Current Goals
             </h3>
             <div className="space-y-8 flex-1">
               {goals.map((goal) => {
                 const progress = (goal.current / goal.target) * 100;
                 return (
                   <div key={goal.id} className="space-y-3 group cursor-pointer">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner", goal.color)}>
                            <goal.icon className="w-5 h-5" />
                         </div>
                         <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{goal.name}</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                     </div>
                     <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-muted-foreground">${goal.current.toLocaleString()}</span>
                         <span className="text-white">${goal.target.toLocaleString()}</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full rounded-full transition-all duration-[1500ms]", progress > 0 ? "bg-primary" : "bg-white/10")} 
                           style={{ width: `${progress}%` }} 
                         />
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
             
             <button className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group shadow-xl">
               Create New Goal
               <Sparkles className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
             </button>
           </div>

           <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 shadow-[0_0_50px_rgba(45,237,156,0.05)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
                   <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(45,237,156,0.8)]" />
                </div>
                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Growth Recommendation</h4>
              </div>
              <p className="text-sm font-semibold text-white/90 leading-relaxed italic">
                "Based on your 14-day mindful streak, you can accelerate your House Goal by 14 months by moving $240/mo to a High-Yield account."
              </p>
              <button className="w-full py-3 bg-primary text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
                Execute Growth Play
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
