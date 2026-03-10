import React, { useState } from "react";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

const messages = [
  {
    role: "system",
    type: "alert",
    content: "Behavioral stress pattern detected — You've spent $340 in the last 6 hours. This matches your Thursday evening trigger pattern.",
    timestamp: "8:42 PM"
  },
  {
    role: "user",
    content: "Yeah, rough day at work. Didn't even realize I ordered food three times, honestly.",
    timestamp: "8:43 PM"
  },
  {
    role: "assistant",
    type: "insight",
    content: "That awareness is critical — most people never connect the dots. What you described is a classic emotional spending trigger: work stress → food delivery as comfort.",
    stats: [
      { label: "Today's orders", value: "3x", color: "text-red-400" },
      { label: "Trigger spend", value: "$82", color: "text-red-400" },
      { label: "Streak intact", value: "+14d", color: "text-primary" },
    ],
    timestamp: "8:44 PM"
  },
  {
    role: "assistant",
    content: "The good news? You recognized the pattern — that's step one. Your 14-day streak isn't broken. This is data, not failure.\n\nWant me to set a gentle pause reminder for next time your Behavioral Behavioral Stress Index spikes during work hours?",
    timestamp: "8:45 PM"
  },
  {
    role: "user",
    content: "Yes please. And can you show me how much this pattern is actually costing me per month?",
    timestamp: "8:46 PM"
  }
];

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
          className="text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.5)] transition-all duration-1000"
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

const GrowthChart = () => {
  const data = [
    { v: 10 }, { v: 15 }, { v: 12 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 22 }, { v: 30 }
  ];
  return (
    <div className="h-16 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="v" radius={[2, 2, 0, 0]}>
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
  const [chatMessages, setChatMessages] = useState(messages);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate Nova response
    setTimeout(() => {
      const novaMsg = {
        role: "assistant",
        content: "I'm analyzing that pattern now. Your behavioral data suggests a direct correlation between this expenditure and your recent Behavioral Behavioral Stress Index spike. Want me to dive deeper into the root cause?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, novaMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      {/* Main Chat Area */}
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
              <p className="text-[10px] text-muted-foreground font-medium">Advanced Financial AI Consultant � Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Moon className="w-5 h-5 text-muted-foreground" /></button>
             <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Info className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
              {/* ... same message rendering logic ... */}
              {msg.type === "alert" ? (
                <div className="w-full max-w-2xl bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <p className="text-xs font-medium text-orange-200">{msg.content}</p>
                  </div>
                  <button className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors">Dismiss</button>
                </div>
              ) : msg.type === "insight" ? (
                <div className="max-w-2xl bg-[#1A1816] border border-white/5 rounded-3xl p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-2 py-0 text-[10px] font-bold flex gap-1">
                      <Sparkles className="w-3 h-3 fill-orange-400" />
                      Pattern Recognized
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {msg.content.split("emotional spending trigger:")[0]}
                    <span className="text-white font-bold underline decoration-orange-400 decoration-2 underline-offset-4 mx-1">
                      emotional spending trigger:
                    </span>
                    {msg.content.split("emotional spending trigger:")[1]}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    {msg.stats?.map((stat, si) => (
                      <div key={si}>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className={cn("text-xl font-bold", stat.color)}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "max-w-[80%] rounded-3xl p-4 text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-[#2DED9C]/10 border border-[#2DED9C]/20 text-white" 
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
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 shrink-0 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2 mb-4">
             {["Show monthly trigger cost", "Set pause reminder", "What are my top triggers?", "I want to break this habit"].map(chip => (
               <button 
                key={chip} 
                onClick={() => { setInput(chip); }}
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

      {/* Right Sidebar (Desktop Only) */}
      <div className="hidden xl:flex flex-col w-80 shrink-0 bg-[#0F0E0D] border-l border-white/5 p-6 overflow-y-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Behavioral Behavioral Stress Index</h3>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">Elevated</Badge>
          </div>
          <StressIndex value={62} />
          <div className="space-y-3 mt-6">
            <MetricRow label="Work stress" value={85} color="bg-orange-400" />
            <MetricRow label="Sleep quality" value={40} color="bg-red-400" />
            <MetricRow label="Spending pace" value={72} color="bg-orange-400" />
            <MetricRow label="Savings rate" value={92} color="bg-primary" />
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Behavioral Trigger Analysis</h3>
          <div className="space-y-4">
            {[
              { label: "Stress eating", sub: "Work pressure → delivery", val: "+3 today", color: "text-orange-400" },
              { label: "Late night shop", sub: "Post 10pm impulse buys", val: "+6 / wk", color: "text-yellow-400" },
              { label: "Scroll & spend", sub: "Social media → checkout", val: "Improving", color: "text-primary" },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                     {i === 0 ? <Zap className="w-4 h-4 text-orange-400" /> : i === 1 ? <Moon className="w-4 h-4 text-yellow-400" /> : <Smartphone className="w-4 h-4 text-blue-400" />}
                   </div>
                   <div>
                     <div className="text-[12px] font-bold">{t.label}</div>
                     <div className="text-[10px] text-muted-foreground">{t.sub}</div>
                   </div>
                </div>
                <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5", t.color)}>{t.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Monthly Growth</h3>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-primary">Savings Rate</span>
              <span className="text-lg font-bold text-primary">+18%</span>
            </div>
            <div className="text-[10px] text-muted-foreground mb-1">vs last month</div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary mb-2">
              <CheckCircle2 className="w-3 h-3" />
              On track
            </div>
            <GrowthChart />
          </div>
        </div>
      </div>
    </div>
  );
}
