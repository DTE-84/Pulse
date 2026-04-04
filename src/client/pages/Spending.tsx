import React, { useEffect, useState } from "react";
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
  PieChart as PieChartIcon,
  Flag,
  Database,
  EyeOff,
  History
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
import { transactionsAPI, statsAPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryData = [
  { name: "Shopping", value: 35, color: "#60A5FA" },
  { name: "Food & Drink", value: 25, color: "#FB923C" },
  { name: "Fixed Bills", value: 20, color: "#A855F7" },
  { name: "Transport", value: 15, color: "#FACC15" },
  { name: "Others", value: 5, color: "#94A3B8" },
];

export default function SpendingPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, statsRes] = await Promise.all([
          transactionsAPI.getAll({ limit: 10 }),
          statsAPI.get()
        ]);
        setTransactions(txRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch spending data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("food") || c.includes("dining")) return Utensils;
    if (c.includes("shop")) return ShoppingBag;
    if (c.includes("travel") || c.includes("transport")) return Car;
    if (c.includes("digital") || c.includes("tech")) return Smartphone;
    if (c.includes("coffee")) return Coffee;
    return CreditCard;
  };

  const filteredTransactions = selectedCategory 
    ? transactions.filter(tx => tx.category_name?.toLowerCase().includes(selectedCategory.name.toLowerCase()))
    : [];
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
              <div 
                key={i} 
                onClick={() => setSelectedCategory(cat)}
                className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all"
              >
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

        {/* Transaction Detail Dialog */}
        <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
          <DialogContent className="bg-[#0A0907] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory?.color }} />
                <DialogTitle className="text-2xl font-black tracking-tighter">{selectedCategory?.name} Deep-Dive</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground font-medium">
                Analysis of behavioral nodes within the {selectedCategory?.name} category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Nova Analysis</p>
                <p className="text-sm italic text-white/90">
                  "Your spending in {selectedCategory?.name} represents {selectedCategory?.value}% of your current monthly volume. I've detected a stable rhythm here, with most nodes aligning with your baseline."
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recent {selectedCategory?.name} Nodes</h4>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx: any) => (
                    <div key={tx.transaction_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <div className="text-sm font-bold text-white">{tx.merchant_name || tx.category_name}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(tx.purchase_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-black text-white">${parseFloat(tx.amount).toFixed(2)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-muted-foreground">No specific transactions found for this node.</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transactions List */}
        <div className="lg:col-span-2 bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Recent Transactions</h3>
            <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">View All Historical</button>
          </div>

          <div className="space-y-4">
            {transactions.map((tx) => {
              const Icon = getIcon(tx.category_name || "");
              const isExpense = parseFloat(tx.amount) > 0;
              return (
                <div key={tx.transaction_id} className="group flex items-center justify-between p-5 rounded-3xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all">
                  <div className="flex items-center gap-5 flex-1">
                    <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform text-primary")}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-base font-bold text-white mb-0.5 truncate">{tx.merchant_name || tx.category_name}</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>{tx.category_name}</span>
                        <span className="opacity-30">•</span>
                        <span>{new Date(tx.purchase_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
                    <div className="text-lg font-black text-white">
                      {isExpense ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.trigger_name && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-2.5 py-0 text-[9px] font-black flex gap-1 uppercase tracking-widest">
                          <Zap className="w-3 h-3 fill-red-400" />
                          {tx.trigger_name}
                        </Badge>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#12110F] border-white/10 text-white w-48">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Node Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="flex items-center gap-2 text-xs focus:bg-white/5 focus:text-primary cursor-pointer">
                            <Flag className="w-3.5 h-3.5" /> Flag as Inaccurate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-xs focus:bg-white/5 focus:text-primary cursor-pointer">
                            <History className="w-3.5 h-3.5" /> View Behavioral History
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-xs focus:bg-white/5 focus:text-red-400 cursor-pointer">
                            <EyeOff className="w-3.5 h-3.5" /> Ignore Trigger Signal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {transactions.length === 0 && !loading && (
              <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
                <Database className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No financial nodes detected in this period.</p>
              </div>
            )}
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
