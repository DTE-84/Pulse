import { useEffect, useState } from "react";
import {
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
  History,
} from "lucide-react";
import {
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
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
  const [_stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, statsRes] = await Promise.all([
          transactionsAPI.getAll({ limit: 10 }),
          statsAPI.get(),
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

  const filteredTransactions = selectedCategory && selectedCategory.name
    ? transactions.filter((tx) =>
        (tx.category_name || "")
          .toLowerCase()
          .includes(selectedCategory.name.toLowerCase()),
      )
    : transactions;
  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-7xl mx-auto space-y-12 text-foreground">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-primary cursor-pointer transition-colors">
          Home
        </span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Spending Breakdown</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">
            All Spending
          </h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            You've spent <span className="text-foreground">$3,240</span> this month,{" "}
            <span className="text-red-400 underline decoration-red-400/30 underline-offset-4 font-bold">
              up 12%
            </span>{" "}
            from September.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              placeholder="Search transactions..."
              className="bg-muted border border-border pl-12 pr-6 py-3 rounded-full text-xs font-bold text-foreground focus:outline-none focus:border-primary/30 transition-all w-full sm:w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-muted border border-border p-3 rounded-full hover:bg-muted/80 transition-all">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 bg-muted border border-border p-3 rounded-full hover:bg-muted/80 transition-all">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {/* Category Overview Card */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center justify-center gap-3">
                <PieChartIcon className="w-6 h-6 text-primary" />
                Spending Allocation
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                Behavioral weight by category
              </p>
            </div>

            <div className="h-72 w-72 relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        onClick={() => setSelectedCategory(entry)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-foreground tracking-tighter">$3.2k</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  Total Volume
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 pt-12 border-t border-border/50">
            {categoryData.map((cat, i) => {
              const Icon = getIcon(cat.name);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedCategory(cat)}
                  className="group bg-muted/30 border border-border p-6 rounded-[2rem] flex flex-col items-center text-center gap-4 cursor-pointer hover:bg-muted hover:border-primary/30 transition-all hover:-translate-y-1"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {cat.name}
                    </p>
                    <p className="text-xl font-black text-foreground">
                      {cat.value}%
                    </p>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        backgroundColor: cat.color,
                        width: `${cat.value}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Detail Dialog */}
        <Dialog
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
        >
          <DialogContent className="bg-card border border-border text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCategory?.color }}
                />
                <DialogTitle className="text-2xl font-black tracking-tighter">
                  {selectedCategory?.name} Deep-Dive
                </DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground font-medium">
                Analysis of behavioral nodes within the {selectedCategory?.name}{" "}
                category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                  Nova Analysis
                </p>
                <p className="text-sm italic text-foreground/90">
                  "Your spending in {selectedCategory?.name} represents{" "}
                  {selectedCategory?.value}% of your current monthly volume.
                  I've detected a stable rhythm here, with most nodes aligning
                  with your baseline."
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Recent {selectedCategory?.name} Nodes
                </h4>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx: any) => (
                    <div
                      key={tx.transaction_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border"
                    >
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {tx.merchant_name || tx.category_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(tx.purchase_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-black text-foreground">
                        ${parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground">
                      No specific transactions found for this node.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transactions List (Full Width) */}
        <div className="bg-card border border-border rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <History className="w-64 h-64 text-foreground" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                Recent Transactions
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Live behavioral telemetry feed
              </p>
            </div>
            <button className="w-full md:w-auto bg-muted border border-border px-8 py-4 rounded-2xl text-[10px] font-black text-primary hover:bg-primary/10 hover:border-primary/20 transition-all uppercase tracking-widest">
              View Historical Archive
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 relative z-10">
            {transactions.map((tx) => {
              const Icon = getIcon(tx.category_name || "");
              const isExpense = parseFloat(tx.amount) > 0;
              return (
                <div
                  key={tx.transaction_id}
                  className="group flex items-center justify-between p-6 rounded-[2.5rem] bg-muted/20 border border-transparent hover:border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-[1.5rem] bg-card border border-border flex items-center justify-center group-hover:scale-105 transition-transform text-primary shadow-sm",
                      )}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-lg font-bold text-foreground mb-1 truncate">
                        {tx.merchant_name || tx.category_name}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          {tx.category_name}
                        </span>
                        <span className="opacity-30">•</span>
                        <span>
                          {new Date(tx.purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0 ml-4">
                    <div className="text-right">
                      <div className="text-xl font-black text-foreground">
                        {isExpense ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                      {tx.trigger_name && (
                        <Badge
                          variant="outline"
                          className="bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0 text-[8px] font-black flex gap-1 uppercase tracking-widest mt-1"
                        >
                          <Zap className="w-2.5 h-2.5 fill-red-400" />
                          {tx.trigger_name}
                        </Badge>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors">
                          <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-card border border-border text-foreground w-56 p-2 rounded-xl"
                      >
                        <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40 px-3 py-2">
                          Telemetry Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-muted mx-2" />
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                          <Flag className="w-4 h-4" /> Flag Inaccuracy
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                          <History className="w-4 h-4" /> Behavioral Audit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-red-500/10 focus:text-red-400 cursor-pointer transition-colors">
                          <EyeOff className="w-4 h-4" /> Suppress Signal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {transactions.length === 0 && !loading && (
              <div className="text-center py-24 border border-dashed border-border rounded-[3rem] bg-muted/10">
                <Database className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  No telemetry detected
                </p>
              </div>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer hover:bg-primary/10 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(45,237,156,0.3)] group-hover:scale-110 transition-transform">
                <Flame className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                  Nova Signal
                </p>
                <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors italic leading-tight">
                  "Your behavioral drift is stabilizing. Optimal liquidity preservation detected."
                </p>
              </div>
            </div>
            <button className="relative z-10 bg-primary text-primary-foreground px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
              Claim Efficiency Bonus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
