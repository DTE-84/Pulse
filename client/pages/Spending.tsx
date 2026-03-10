import React from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  ShoppingBag, 
  Utensils, 
  Smartphone, 
  Car, 
  Coffee,
  MoreVertical,
  Zap,
  Flame,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: 1, name: "Amazon Marketplace", category: "Shopping", date: "Oct 24, 2023", amount: -142.50, trigger: "Late Night", status: "Detected", icon: ShoppingBag, color: "text-blue-400" },
  { id: 2, name: "Uber Eats", category: "Food & Drink", date: "Oct 23, 2023", amount: -42.20, trigger: "Stress Eating", status: "Pending", icon: Utensils, color: "text-orange-400" },
  { id: 3, name: "Apple Subscription", category: "Digital", date: "Oct 22, 2023", amount: -14.99, trigger: "None", status: "Safe", icon: Smartphone, color: "text-purple-400" },
  { id: 4, name: "Starbucks Coffee", category: "Food & Drink", date: "Oct 22, 2023", amount: -6.45, trigger: "Boredom Scrolling", status: "Detected", icon: Coffee, color: "text-green-400" },
  { id: 5, name: "Chevron Gasoline", category: "Travel", date: "Oct 21, 2023", amount: -54.00, trigger: "None", status: "Safe", icon: Car, color: "text-yellow-400" },
  { id: 6, name: "Nike Store", category: "Shopping", date: "Oct 20, 2023", amount: -210.00, trigger: "Social Influenced", status: "High Risk", icon: ShoppingBag, color: "text-blue-400" },
];

const categoryData = [
  { name: "Shopping", value: 35, color: "#60A5FA" },
  { name: "Food & Drink", value: 25, color: "#FB923C" },
  { name: "Fixed Bills", value: 20, color: "#A855F7" },
  { name: "Transport", value: 15, color: "#FACC15" },
  { name: "Others", value: 5, color: "#94A3B8" },
];

export default function SpendingPage() {
  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Spending Breakdown</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white">All Spending</h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            You've spent <span className="text-white">$3,240</span> this month, <span className="text-red-400 underline decoration-red-400/30 underline-offset-4 font-bold">up 12%</span> from September.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search transactions..." 
              className="bg-white/5 border border-white/5 pl-12 pr-6 py-3 rounded-full text-xs font-bold text-white focus:outline-none focus:border-primary/30 transition-all w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/5 p-3 rounded-full hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 bg-white/5 border border-white/5 p-3 rounded-full hover:bg-white/10 transition-all">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown Card */}
        <div className="lg:col-span-1 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-8 flex flex-col items-center justify-center">
          <div className="w-full text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2 flex items-center justify-center gap-3">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Categories
            </h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Percentage of total spend</p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">$3.2k</span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="w-full space-y-4 pt-6 border-t border-white/5">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-bold text-white">{cat.name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-[11px] font-black text-white/80">{cat.value}%</span>
                   <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Recent Transactions</h3>
            <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">View All Historical</button>
          </div>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="group flex items-center justify-between p-5 rounded-3xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
                <div className="flex items-center gap-5 flex-1">
                   <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform", tx.color)}>
                     <tx.icon className="w-7 h-7" />
                   </div>
                   <div className="overflow-hidden">
                     <div className="text-base font-bold text-white mb-0.5 truncate">{tx.name}</div>
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                       <span>{tx.category}</span>
                       <span className="opacity-30">•</span>
                       <span>{tx.date}</span>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
                   <div className="text-lg font-black text-white">
                     {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                   </div>
                   <div className="flex items-center gap-2">
                     {tx.trigger !== "None" && (
                       <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-2.5 py-0 text-[9px] font-black flex gap-1 uppercase tracking-widest">
                         <Zap className="w-3 h-3 fill-red-400" />
                         {tx.trigger}
                       </Badge>
                     )}
                     <div className={cn(
                       "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                       tx.status === "Safe" ? "bg-primary/10 text-primary border border-primary/20" : 
                       tx.status === "Detected" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : 
                       "bg-red-500/10 text-red-400 border border-red-500/20"
                     )}>
                       {tx.status}
                     </div>
                     <button className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2">
                       <MoreVertical className="w-4 h-4 text-muted-foreground" />
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group cursor-pointer hover:bg-primary/10 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
                <Flame className="w-7 h-7 text-primary" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Nova Insight</p>
                 <p className="text-base font-bold text-white group-hover:text-primary transition-colors italic leading-snug">"Your weekend shopping is 22% lower than usual. You're on track for a record saving month!"</p>
              </div>
            </div>
            <button className="bg-primary text-background px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
              Claim Bonus Streak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
