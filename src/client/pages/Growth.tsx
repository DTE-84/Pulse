import React, { useState, useEffect } from "react";
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
  ArrowRight,
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

export default function GrowthPage() {
  const [timeframe, setTimeframe] = useState("10m");
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      const [goalsRes, statsRes] = await Promise.all([
        goalsAPI.getAll(),
        statsAPI.get(),
      ]);
      setGoals(goalsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch growth data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    const n = name.toLowerCase();
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
    <div className="p-4 sm:p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">
          Home
        </span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Wealth Growth</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            Financial Growth
          </h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-lg leading-snug">
            Your net worth is{" "}
            <span className="text-primary font-black">
              ${stats?.totalBalance?.toLocaleString() || "0"}
            </span>
            , growing{" "}
            <span className="text-primary font-black">
              +{stats?.spendingDeltaPct || "0"}%
            </span>{" "}
            rhythm.
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
        <div className="lg:col-span-3 bg-[#12110F] border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 space-y-6 sm:space-y-8 flex flex-col min-h-[350px] sm:min-h-[500px]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
              <LineChartIcon className="w-5 h-5 text-primary" />
              Projected Wealth
            </h3>
          </div>

          <div className="flex-1 w-full mt-6">
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
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "rgba(255,255,255,0.2)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  dy={20}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1917",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "1.5rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2DED9C"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals & AI Insights */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
          <div className="bg-[#12110F] border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 space-y-6 sm:space-y-8 flex-1 flex flex-col">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              Current Goals
            </h3>
            <div className="space-y-8 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
              {goals.map((goal) => {
                const Icon = getGoalIcon(goal.name);
                const current = parseFloat(goal.current) || 0;
                const target = parseFloat(goal.target) || 1;
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
                            "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner text-primary",
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {goal.name}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">
                          ${current.toLocaleString()}
                        </span>
                        <span className="text-white">
                          ${target.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-[1500ms] bg-primary",
                          )}
                          style={{ width: `${progress}%` }}
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
                    No active goal nodes
                  </p>
                </div>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group shadow-xl">
                  Create New Goal
                  <Plus className="w-3.5 h-3.5 text-primary group-hover:rotate-90 transition-transform" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0907] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">
                    Goal Engineering
                  </DialogTitle>
                  <DialogDescription>
                    Define a new financial target node.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Goal Name
                    </label>
                    <Input
                      placeholder="e.g., Emergency Vault"
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, name: e.target.value })
                      }
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Target Amount ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="25000"
                      value={newGoal.target}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, target: e.target.value })
                      }
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Deadline (Optional)
                    </label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, deadline: e.target.value })
                      }
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateGoal}
                    className="bg-primary text-black font-black uppercase tracking-widest w-full rounded-xl"
                  >
                    Establish Goal Node
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 shadow-[0_0_50px_rgba(45,237,156,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0 shadow-[0_0_20px_rgba(45,237,156,0.2)]">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(45,237,156,0.8)]" />
              </div>
              <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                Nova Insight
              </h4>
            </div>
            <p className="text-sm font-semibold text-white/90 leading-relaxed italic">
              {stats?.novaInsight ||
                "Sync data to generate growth recommendations."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
