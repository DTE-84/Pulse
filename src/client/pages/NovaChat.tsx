import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Moon, Zap, Loader2, Crown, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { useAuth } from "@/contexts/AuthContext";
import { statsAPI, novaServiceAPI } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";
import { Link } from "react-router-dom";

const SpendingRing = ({ value }: { value: number }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center mx-auto mb-2">
      <svg className="w-full h-full -rotate-90">
        <circle cx="56" cy="56" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
        <circle
          cx="56" cy="56" r="40"
          stroke="currentColor" strokeWidth="8" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-[9px] text-muted-foreground font-bold">/100</span>
      </div>
    </div>
  );
};

const MiniBar = ({ label, value, color }: any) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-[11px] text-muted-foreground font-medium w-28 shrink-0">{label}</span>
    <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
    </div>
    <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{Math.round(value)}%</span>
  </div>
);

const WeekChart = ({ data }: { data: any[] }) => (
  <div className="h-16 w-full mt-3">
    <MiniBarChart
      data={data} dataKey="value" radius={2}
      cellColor={(_d: any, i: number) => i === data.length - 1 ? "#2DED9C" : "rgba(45,237,156,0.18)"}
      height="100%"
    />
  </div>
);

// Nova avatar — the green pulse dot
const NovaAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
  </div>
);

export default function NovaChat() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { hasActiveSubscription } = useAuth();
  const { theme, setTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    statsAPI.get()
      .then((res) => setStats(res.data))
      .catch((err) => console.error("[Nova] Stats load failed:", err));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSend = async () => {
    if (!hasActiveSubscription || !input.trim()) return;
    const userMsg = { role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages((prev) => [...prev, userMsg].slice(-50));
    setInput("");
    setIsTyping(true);
    try {
      const res = await novaServiceAPI.chat(input, chatMessages);
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: res.data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }].slice(-50));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Nova is unavailable right now. Try again in a moment.";
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }].slice(-50));
    } finally {
      setIsTyping(false);
    }
  };

  const runDeepScan = async () => {
    if (!hasActiveSubscription) return;
    setIsTyping(true);
    try {
      const res = await novaServiceAPI.getAnalysis();
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        type: "insight",
        content: res.data.report,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }].slice(-50));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Deep scan couldn't complete. Make sure your bank data is synced and try again.";
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }].slice(-50));
    } finally {
      setIsTyping(false);
    }
  };

  const spendingScore = Math.min(100, Math.max(0, 50 + (stats?.spendingDeltaPct || 0)));
  const isOverspending = (stats?.spendingDeltaPct || 0) > 0;

  return (
    <div className="flex h-full relative">
      {/* Elite Gate Overlay */}
      {!hasActiveSubscription && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/40 backdrop-blur-md">
          <div className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Elite Access Required</h2>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                Nova Chat is a Pulse Elite feature. Upgrade to unlock AI coaching, deep scans, and personalized financial guidance.
              </p>
            </div>
            <Link
              to="/subscription"
              className="w-full py-4 bg-primary text-background font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(45,237,156,0.25)] uppercase tracking-[0.2em] text-xs"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Elite
            </Link>
          </div>
        </div>
      )}

      {/* Main Chat Column */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Nova</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Online · Ready to help</p>
            </div>
          </div>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            {theme === "dark"
              ? <Sun className="w-5 h-5 text-muted-foreground" />
              : <Moon className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 scrollbar-hide">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary fill-primary" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-lg font-black tracking-tight text-foreground">Hey, I'm Nova.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask me anything about your spending — or tap one of the suggestions below to get started.
                </p>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {/* Nova avatar only on assistant messages */}
                {msg.role === "assistant" && <NovaAvatar />}

                <div className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start", "max-w-[78%]")}>
                  {msg.type === "insight" ? (
                    <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-md">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 px-2 py-0 text-[10px] font-bold gap-1 flex w-fit"
                      >
                        <Sparkles className="w-3 h-3 fill-primary" />
                        Monthly Check-In
                      </Badge>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm"
                        : "bg-muted border border-border text-foreground rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground/50 mt-1.5 px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 items-start">
              <NovaAvatar />
              <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 sm:px-6 py-4 shrink-0 bg-background/80 backdrop-blur-md border-t border-border">
          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: "📊 Monthly Check-In", action: () => runDeepScan() },
              { label: "💸 Where am I spending most?", action: () => setInput("Where am I spending most this month?") },
              { label: "⚡ What triggers my overspending?", action: () => setInput("What are my top spending triggers?") },
              { label: "🎯 Am I on track for my goals?", action: () => setInput("Am I on track for my savings goals?") },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={chip.action}
                disabled={!hasActiveSubscription}
                className="px-3 py-1.5 rounded-full bg-muted border border-border text-[11px] font-medium hover:bg-muted/60 hover:border-primary/30 transition-all text-foreground disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div className="relative">
            <input
              id="nova-message"
              name="nova-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Nova anything about your money..."
              disabled={!hasActiveSubscription}
              className="w-full bg-muted border border-border rounded-2xl py-4 px-5 pr-14 focus:outline-none focus:border-primary/50 transition-colors text-sm text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!hasActiveSubscription || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:flex flex-col w-72 shrink-0 bg-card border-l border-border p-5 overflow-y-auto gap-8">

        {/* Spending Health */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spending Health</h3>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
              isOverspending
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {isOverspending ? "Watch this" : "Looking good"}
            </span>
          </div>
          <SpendingRing value={spendingScore} />
          <p className="text-center text-[11px] text-muted-foreground mt-1">
            {isOverspending
              ? "You're spending a bit faster than usual this month."
              : "Your spending pace is healthy right now."}
          </p>

          <div className="mt-5 space-y-1">
            <MiniBar
              label="Monthly pace"
              value={Math.min(100, (stats?.monthlyExpenses / stats?.baselineSpend) * 100 || 0)}
              color={isOverspending ? "bg-red-400" : "bg-primary"}
            />
            <MiniBar
              label="Savings progress"
              value={Math.max(0, 100 - (stats?.spendingDeltaPct || 0))}
              color="bg-primary"
            />
            <MiniBar label="Data coverage" value={100} color="bg-primary" />
          </div>
        </div>

        {/* Spending Triggers */}
        {stats?.triggers?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">What's driving your spending</h3>
            <div className="space-y-3">
              {stats.triggers.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center border",
                      t.status === "High"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-muted border-border"
                    )}>
                      <Zap className={cn("w-3.5 h-3.5", t.status === "High" ? "text-red-400" : "text-primary")} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-foreground">{t.name}</div>
                      <div className={cn("text-[10px]", t.status === "High" ? "text-red-400" : "text-muted-foreground")}>
                        {t.status === "High" ? "High impact" : "Moderate"}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold",
                    t.status === "High" ? "text-red-400" : "text-primary"
                  )}>${t.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-Day Chart */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last 7 Days</h3>
            <span className={cn(
              "text-sm font-bold",
              isOverspending ? "text-red-400" : "text-primary"
            )}>
              {isOverspending ? "+" : ""}{stats?.spendingDeltaPct ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">vs. your usual daily pace</p>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3">
            <WeekChart data={stats?.chartData || []} />
          </div>
        </div>

      </div>
    </div>
  );
}
