import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Moon, 
  Zap, 
  Smartphone,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { statsAPI, novaServiceAPI } from "@/lib/api";

const StressIndex = ({ value }: { value: number }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center mx-auto mb-4">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary shadow-[0_0_15px_rgba(45,237,156,0.5)] transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-[10px] text-muted-foreground uppercase font-bold">/ 100</span>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, color }: any) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    <div className="flex-1 mx-3 h-1 bg-white/5 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const GrowthChart = ({ data }: { data: any[] }) => {
  return (
    <div className="h-16 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? "#2DED9C" : "rgba(45,237,156,0.2)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function NovaChat() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { user, token } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await statsAPI.get();
        setStats(res.data);
        
        // Initial Greeting from Nova based on real data
        setChatMessages([{
          role: "assistant",
          content: `Systems online. Analysis for ${user?.name || 'Subject'} complete. I see your current monthly velocity is $${res.data.monthlyExpenses.toFixed(2)}. How can I assist with your behavioral telemetry today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (err) {
        console.error("Failed to fetch stats for Nova:", err);
      }
    };
    initChat();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const runDeepScan = async () => {
    setIsTyping(true);
    try {
      const res = await novaServiceAPI.getAnalysis();
      const novaMsg = {
        role: "assistant",
        type: "insight",
        content: `DEEP SCAN COMPLETE: ${res.data.report}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, novaMsg]);
    } catch (err) {
      console.error("Deep Scan Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await novaServiceAPI.chat(input, chatMessages.slice(-5));
      setChatMessages(prev => [...prev, response.data]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting to my analytical core right now. Please check your network or API key.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        <header className="h-20 border-b border-border/40 px-6 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                 <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(45,237,156,0.8)]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Nova</h2>
              <p className="text-[10px] text-muted-foreground font-medium">Advanced Financial AI Consultant — Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Moon className="w-5 h-5 text-muted-foreground" /></button>
             <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Info className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
              {msg.type === "insight" ? (
                <div className="max-w-2xl bg-[#1A1816] border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0 text-[10px] font-bold flex gap-1">
                      <Sparkles className="w-3 h-3 fill-primary" />
                      Deep Analysis Complete
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className={cn(
                  "max-w-[80%] rounded-3xl p-4 text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-primary/10 border border-primary/20 text-white" 
                    : "bg-white/5 border border-white/10 text-muted-foreground"
                )}>
                  {msg.content}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground font-bold mt-2 px-2 uppercase tracking-tighter opacity-50">{msg.timestamp}</span>
            </div>
          ))}
          {isTyping && (
            <div className="items-start flex flex-col">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-1">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 shrink-0 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mb-4">
             {["Run Deep Scan", "Show my spending velocity", "What are my top triggers?", "Suggest a spending pause"].map(chip => (
               <button 
                key={chip} 
                onClick={() => { 
                  if (chip === "Run Deep Scan") runDeepScan();
                  else setInput(chip); 
                }}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium hover:bg-white/10 transition-colors"
               >
                 {chip}
               </button>
             ))}
          </div>
          <div className="max-w-4xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message Nova..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-14 focus:outline-none focus:border-primary/50 transition-colors text-sm"
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5 text-background" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:flex flex-col w-80 shrink-0 bg-[#0F0E0D] border-l border-white/5 p-6 overflow-y-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Behavioral Stress</h3>
            <Badge variant="outline" className={cn("text-[10px]", stats?.spendingDeltaPct > 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-primary/10 text-primary border-primary/20")}>
              {stats?.spendingDeltaPct > 0 ? "Elevated" : "Optimal"}
            </Badge>
          </div>
          <StressIndex value={Math.min(100, Math.max(0, 50 + (stats?.spendingDeltaPct || 0)))} />
          <div className="space-y-3 mt-6">
            <MetricRow label="Spending pace" value={Math.min(100, (stats?.monthlyExpenses / stats?.baselineSpend) * 100 || 0)} color={stats?.spendingDeltaPct > 0 ? "bg-red-400" : "bg-primary"} />
            <MetricRow label="Data Integrity" value={100} color="bg-primary" />
            <MetricRow label="Savings velocity" value={Math.max(0, 100 - (stats?.spendingDeltaPct || 0))} color="bg-primary" />
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Active Trigger Signals</h3>
          <div className="space-y-4">
            {stats?.triggers?.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                     <Zap className={cn("w-4 h-4", t.status === "High" ? "text-red-400" : "text-primary")} />
                   </div>
                   <div>
                     <div className="text-[12px] font-bold">{t.name}</div>
                     <div className="text-[10px] text-muted-foreground">Signal: {t.status}</div>
                   </div>
                </div>
                <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5", t.status === "High" ? "text-red-400" : "text-primary")}>
                  ${t.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">7-Day Trajectory</h3>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-primary">Daily Rhythm</span>
              <span className="text-lg font-bold text-primary">{stats?.spendingDeltaPct > 0 ? "+" : ""}{stats?.spendingDeltaPct}%</span>
            </div>
            <GrowthChart data={stats?.chartData || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
