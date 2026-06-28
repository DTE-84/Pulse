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
  RefreshCcw,
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SpendingPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [_stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isIngestDialogOpen, setIsIngestDialogOpen] = useState(false);
  const [ingestData, setIngestData] = useState("");
  const [triggerId, setTriggerId] = useState<string>("0");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

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
    setIsIngestDialogOpen(false);
    toast({
      title: "Syncing data",
      description: "Processing transactions and refreshing your spending dashboard...",
    });

    try {
      let transactionsData;
      try {
        transactionsData = JSON.parse(ingestData);
        if (!Array.isArray(transactionsData)) transactionsData = [transactionsData];
      } catch {
        const lines = ingestData.split("\n").filter((l) => l.trim());
        transactionsData = lines.map((line) => {
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

      const dataToSync = Array.isArray(transactionsData)
        ? transactionsData.map((t) => ({
            ...t,
            trigger_id:
              t.trigger_id ||
              (triggerId !== "0" ? parseInt(triggerId) : undefined),
          }))
        : transactionsData;

      await transactionsAPI.ingest({ transactions: dataToSync });
      
      const [txRes, statsRes] = await Promise.all([
        transactionsAPI.getAll({ limit: 10 }),
        statsAPI.get(),
      ]);
      setTransactions(txRes.data);
      setStats(statsRes.data);

      toast({
        title: "Spending dashboard updated",
        description: "Your latest spending data is now reflected.",
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

  const categoryData: { name: string; value: number; color: string }[] = _stats?.categoryBreakdown || [];

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
    if (c.includes("service")) return Zap;
    if (c.includes("entertain")) return Flame;
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 text-foreground">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-tight uppercase">
            All Spending
          </h1>
          <p className="text-muted-foreground font-semibold text-base md:text-lg max-w-lg leading-snug">
            You've spent <span className="text-foreground">${_stats?.monthlyExpenses?.toLocaleString() || "0"}</span> this month,{" "}
            <span className={cn(
              "underline underline-offset-4 font-bold",
              (_stats?.spendingDeltaPct || 0) > 0 ? "text-red-400 decoration-red-400/30" : "text-emerald-400 decoration-emerald-400/30"
            )}>
              {(_stats?.spendingDeltaPct || 0) > 0 ? "up" : "down"} {Math.abs(_stats?.spendingDeltaPct || 0).toFixed(1)}%
            </span>{" "}
            from target.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="search-transactions"
              name="search-transactions"
              placeholder="Search..."
              className="bg-muted border border-border pl-12 pr-6 py-3 rounded-full text-[10px] font-bold text-foreground focus:outline-none focus:border-primary/30 transition-all w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-muted border border-border p-3 rounded-full hover:bg-muted/80 transition-all">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="flex items-center gap-2 bg-muted border border-border p-3 rounded-full hover:bg-muted/80 transition-all">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Dialog open={isIngestDialogOpen} onOpenChange={setIsIngestDialogOpen}>
            <DialogTrigger asChild>
              <button
                disabled={syncing}
                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-3 rounded-full text-[10px] font-black transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                {syncing ? "Syncing..." : "Add Transactions"}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border text-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tighter">
                  Transaction Ingestion
                </DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">
                  Paste JSON or CSV transaction data below to add transactions to your Pulse spending ledger.
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
                  Format: date,amount,category,risk_category (one per line) or valid JSON array.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsIngestDialogOpen(false)}
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

      <div className="flex flex-col gap-8 md:gap-12">
        {/* Category Overview Card */}
        <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-8">
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest flex items-center justify-center gap-3">
                <PieChartIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                Spending Allocation
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                Behavioral weight by category
              </p>
            </div>

            <div className="h-64 w-64 md:h-80 md:w-80 relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
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
                <span className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">${_stats?.monthlyExpenses?.toLocaleString() || "0"}</span>
                <span className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  Total Volume
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 pt-8 md:pt-12 pb-8 border-t border-border/50">
            {categoryData.map((cat, i) => {
              const Icon = getIcon(cat.name);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedCategory(cat)}
                  className="group bg-muted/30 border border-border p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex flex-col items-center text-center gap-3 md:gap-4 cursor-pointer hover:bg-muted hover:border-primary/30 transition-all hover:-translate-y-1 last:col-span-2 lg:last:col-span-1"
                >
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {cat.name}
                    </p>
                    <p className="text-lg md:text-xl font-black text-foreground">
                      {cat.value}%
                    </p>
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
                Analysis of behavioral nodes within the {selectedCategory?.name} category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                  Nova Analysis
                </p>
                <p className="text-sm italic text-foreground/90 leading-relaxed">
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
        <div className="bg-card border border-border rounded-[2.5rem] md:rounded-[3.5rem] p-6 sm:p-8 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <History className="w-64 h-64 text-foreground" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">
                Recent Purchases
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Your recent transactions
              </p>
            </div>
            <button className="w-full md:w-auto bg-muted border border-border px-8 py-4 rounded-2xl text-[10px] font-black text-primary hover:bg-primary/10 hover:border-primary/20 transition-all uppercase tracking-widest">
              View Archive
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 relative z-10">
            {transactions.map((tx) => {
              const Icon = getIcon(tx.category_name || "");
              const isExpense = parseFloat(tx.amount) > 0;
              return (
                <div
                  key={tx.transaction_id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-muted/20 border border-transparent hover:border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-card border border-border flex items-center justify-center group-hover:scale-105 transition-transform text-primary shadow-sm shrink-0 mt-1 sm:mt-0",
                      )}
                    >
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base sm:text-lg font-bold text-foreground mb-1.5 leading-tight uppercase tracking-tight break-words pr-2">
                        {tx.merchant_name || tx.category_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                          {tx.category_name}
                        </span>
                        <span className="opacity-30 hidden sm:inline-block">•</span>
                        <span className="shrink-0">
                          {new Date(tx.purchase_date).toLocaleDateString()}
                        </span>
                        {/* Show trigger next to date on mobile, hidden on desktop */}
                        {tx.trigger_name && (
                          <Badge
                            variant="outline"
                            className="sm:hidden bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0.5 text-[8px] font-black flex items-center gap-1 uppercase tracking-widest"
                          >
                            <Zap className="w-2.5 h-2.5 fill-red-400" />
                            {tx.trigger_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 shrink-0 ml-0 sm:ml-4 pl-16 sm:pl-0">
                    <div className="text-left sm:text-right flex-1 sm:flex-none">
                      <div className="text-lg sm:text-xl font-black text-foreground">
                        {isExpense ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                      {/* Show trigger below price on desktop, hidden on mobile */}
                      {tx.trigger_name && (
                        <Badge
                          variant="outline"
                          className="hidden sm:flex bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0 text-[8px] font-black items-center gap-1 uppercase tracking-widest mt-1.5 ml-auto w-max"
                        >
                          <Zap className="w-2.5 h-2.5 fill-red-400" />
                          {tx.trigger_name}
                        </Badge>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors shrink-0">
                          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-card border border-border text-foreground w-56 p-2 rounded-xl shadow-2xl"
                      >
                        <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40 px-3 py-2">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-muted mx-2" />
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                          <Flag className="w-4 h-4" /> Flag Transaction
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors">
                          <History className="w-4 h-4" /> Audit Pattern
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold focus:bg-red-500/10 focus:text-red-400 cursor-pointer transition-colors">
                          <EyeOff className="w-4 h-4" /> Suppress Feed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {transactions.length === 0 && !loading && (
              <div className="text-center py-24 border border-dashed border-border rounded-[2.5rem] bg-muted/10">
                <Database className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  No transactions yet — sync your accounts to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
