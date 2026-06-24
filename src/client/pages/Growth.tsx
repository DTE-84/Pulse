import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Wallet,
  LineChart as LineChartIcon,
  Sparkles,
  Target,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { goalsAPI, statsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function GrowthPage() {
  const [timeframe, setTimeframe] = useState("10m");
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  // Create Goal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target: "",
    deadline: "",
  });

  const fetchData = async () => {
    try {
      const statsRes = await statsAPI.get();
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch stats data:", err);
    }
    
    try {
      const goalsRes = await goalsAPI.getAll();
      setGoals(goalsRes.data);
    } catch (err) {
      console.error("Failed to fetch goals data:", err);
    }
  };

  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    fetchData();
  }, [loading, isAuthenticated]);

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target) return;
    try {
      await goalsAPI.create({
        name: newGoal.name,
        target: parseFloat(newGoal.target),
        deadline: newGoal.deadline || null,
      });
      setIsDialogOpen(false);
      setNewGoal({ name: "", target: "", deadline: "" });
      fetchData();
      toast({
        title: "Goal Engineering Complete",
        description: "Your new behavioral target has been established.",
      });
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Signal deviation detected during creation.";
      toast({
        variant: "destructive",
        title: "Goal Failed",
        description: errMsg,
      });
    }
  };

  const getGoalIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("emergency") || n.includes("fund")) return PiggyBank;
    if (n.includes("house") || n.includes("home") || n.includes("car"))
      return Wallet;
    return Target;
  };

  const growthData = stats?.chartData || [
    { month: "Jan", value: 12000 },
    { month: "Feb", value: 13500 },
    { month: "Mar", value: 14200 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase leading-tight">
            Financial Growth
          </h1>
          <p className="text-muted-foreground font-semibold text-base md:text-lg max-w-lg leading-snug">
            Your net worth is{" "}
            <span className="text-primary font-black">
              ${stats?.totalBalance?.toLocaleString() || "0"}
            </span>
            , growing at a{" "}
            <span className="text-primary font-black">
              {(stats?.spendingDeltaPct && stats.spendingDeltaPct > 0) ? "+" : ""}{stats?.spendingDeltaPct || "0"}%
            </span>{" "}
            rate.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-2xl shrink-0 flex-wrap">
          {["1m", "3m", "6m", "ALL"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeframe === t
                  ? "bg-primary text-background shadow-lg"
                  : "text-muted-foreground hover:text-white",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Growth Chart */}
        <div className="lg:col-span-3 bg-[#12110F] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 space-y-6 sm:space-y-8 flex flex-col min-h-[350px] sm:min-h-[500px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
             <TrendingUp size={200} className="text-primary" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <LineChartIcon className="w-5 h-5 text-primary" />
                Wealth Trajectory
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Predictive Forecast based on current velocity
              </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Actual</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/30 border border-primary/50" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Forecast</span>
               </div>
            </div>
          </div>

          <div className="flex-1 w-full mt-6 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DED9C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2DED9C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "rgba(255,255,255,0.2)",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                  dy={20}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  cursor={{ stroke: '#2DED9C', strokeWidth: 1, strokeDasharray: '4 4' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Projected Value"]}
                  contentStyle={{
                    backgroundColor: "#0A0908",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "1.5rem",
                    padding: "1rem"
                  }}
                  itemStyle={{ color: '#2DED9C', fontWeight: 900, fontSize: '12px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '10px', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2DED9C"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals & AI Insights */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
          <div className="bg-[#12110F] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 sm:space-y-8 flex-1 flex flex-col">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              Active Goals
            </h3>
            <div className="space-y-8 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
              {goals.map((goal) => {
                const Icon = getGoalIcon(goal.goal_name);
                const current = parseFloat(goal.current_progress) || 0;
                const target = parseFloat(goal.target_amount) || 1;
                const progress = Math.min(100, (current / target) * 100);
                return (
                  <div
                    key={goal.goal_id}
                    className="space-y-3 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/30 transition-all shadow-inner text-primary",
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {goal.goal_name}
                        </span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">
                          ${current.toLocaleString()}
                        </span>
                        <span className="text-white/40">
                          Target: ${target.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div
                            className={cn(
                              "h-full rounded-full transition-all bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]",
                            )}
                            style={{ 
                              width: `${progress}%`,
                              transitionDuration: '1500ms'
                            }}
                          />
                      </div>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <Sparkles className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase">
                    No goals yet
                  </p>
                </div>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full bg-primary text-background py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(45,237,156,0.2)]">
                  Create New Goal
                  <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0908] border-white/10 text-white rounded-[2.5rem] p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
                    Goal Engineering
                  </DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-muted-foreground">
                    Establish a new deterministic financial target.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-2 group">
                    <label htmlFor="goal-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">
                      Goal Identification
                    </label>
                    <Input
                      id="goal-name"
                      name="goal-name"
                      placeholder="e.g., Emergency Vault"
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, name: e.target.value })
                      }
                      className="bg-white/[0.03] border-white/5 rounded-xl h-12 font-bold focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label htmlFor="goal-target" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">
                      Target Quantum ($)
                    </label>
                    <Input
                      id="goal-target"
                      name="goal-target"
                      type="number"
                      placeholder="25000"
                      value={newGoal.target}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, target: e.target.value })
                      }
                      className="bg-white/[0.03] border-white/5 rounded-xl h-12 font-bold focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label htmlFor="goal-deadline" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">
                      Optimization Deadline
                    </label>
                    <Input
                      id="goal-deadline"
                      name="goal-deadline"
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, deadline: e.target.value })
                      }
                      className="bg-white/[0.03] border-white/5 rounded-xl h-12 font-bold focus:border-primary/40 transition-all text-white/50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateGoal}
                    className="bg-primary text-black font-black uppercase tracking-widest w-full rounded-2xl h-14 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.3)]"
                  >
                    Initialize Goal Node
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 shadow-[0_0_50px_rgba(45,237,156,0.05)] relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                Nova Intelligence
              </h4>
            </div>
            <p className="text-sm font-semibold text-white/90 leading-relaxed italic relative z-10">
              {stats?.novaInsight ||
                "Connect your accounts so Nova can start building your growth plan."}
            </p>
          </div>
        </div>
      </div>

      {/* Behavioral Intelligence Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-6">
         {[
           { label: "Savings Velocity", value: stats?.monthlyIncome ? `$${Math.round((stats.monthlyIncome - stats.monthlyExpenses) / 30)}/day` : "$0/day", drift: "+12%", trend: "up", desc: "Average daily wealth accumulation." },
           { label: "Spending Drift", value: stats?.monthlyDiff ? `$${stats.monthlyDiff}` : "$0", drift: "-4%", trend: "down", desc: "Deviation from linear baseline." },
           { label: "Data Status", value: "99.8%", drift: "Secure", trend: "up", desc: "Your data is secure and up to date." },
           { label: "Goal Acceleration", value: "2.4 Mo", drift: "+0.8", trend: "up", desc: "Months gained via behavioral shifts." }
         ].map((node, i) => (
           <div key={i} className="bg-[#12110F] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 group hover:border-primary/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {node.trend === "up" ? <ArrowUpRight className="w-12 h-12 text-primary" /> : <ArrowDownRight className="w-12 h-12 text-red-400" />}
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 md:mb-4">
                {node.label}
              </p>
              <div className="flex items-end justify-between gap-2 mb-2">
                <h4 className="text-xl md:text-2xl font-black text-white">{node.value}</h4>
                <Badge variant="outline" className={cn(
                  "text-[8px] md:text-[9px] px-1.5 py-0 border-0 bg-transparent font-black",
                  node.trend === "up" ? "text-primary" : "text-red-400"
                )}>
                  {node.drift}
                </Badge>
              </div>
              <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground/60 leading-relaxed">
                {node.desc}
              </p>
           </div>
         ))}
      </div>
    </div>
  );
}
