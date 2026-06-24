import React, { useState } from "react";
import {
  Zap,
  Brain,
  ChevronRight,
  Sparkles,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const StatCard = ({
  label,
  value,
  trend,
  trendValue,
  icon: Icon,
  colorClass,
}: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-3xl p-4 md:p-6 relative overflow-hidden group hover:bg-[#11100D] transition-all hover:border-white/10 shadow-2xl">
    <div
      className={cn(
        "absolute top-0 left-0 w-1 h-full opacity-30 group-hover:opacity-100 transition-opacity",
        colorClass,
      )}
    />
    
    {/* Telemetry Pulse Animation */}
    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-20 transition-opacity">
       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
    </div>

    <div className="flex justify-between items-start mb-4">
      <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">
        {label}
      </span>
      {Icon && (
        <Icon className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
      )}
    </div>
    <div className="text-2xl md:text-3xl font-black mb-3 tracking-tighter text-white flex items-baseline gap-1">
      {value}
    </div>
    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
      <span
        className={cn(
          trend === "up" ? "text-red-400" : "text-primary",
          "flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-full",
        )}
      >
        {trend === "up" ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        {trendValue}
      </span>
      <span className="text-muted-foreground/40 italic">Signal Drift</span>
    </div>
  </div>
);

const TriggerCard = ({
  emoji,
  name,
  desc,
  severity,
  amount,
  count,
  peak,
  timeline,
  insight,
  novaSuggestion,
  colorClass,
}: any) => (
  <div className="bg-[#0A0907] border border-white/[0.03] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 flex flex-col h-full group hover:border-white/10 transition-all hover:bg-[#0E0D0B] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
    {/* High-Fidelity Severity Glow */}
    <div className={cn(
      "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none",
      severity === "HIGH" ? "bg-red-500" : severity === "MED" ? "bg-yellow-500" : "bg-primary"
    )} />
    
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,13,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

    {/* Header */}
    <div className="flex items-start gap-4 mb-8 relative z-10">
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-white/[0.02] border border-white/5 shadow-2xl transition-all group-hover:scale-105 group-hover:border-primary/20",
          colorClass,
        )}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-black text-white mb-1 tracking-tighter uppercase leading-tight">
          {name}
        </h3>
        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest leading-tight opacity-70">
          {desc}
        </p>
      </div>
      <div className={cn(
        "flex items-center gap-2 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border shrink-0 transition-all",
        severity === "HIGH" ? "text-red-400 bg-red-400/10 border-red-400/20" : 
        severity === "MED" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : 
        "text-primary bg-primary/10 border-primary/20"
      )}>
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            severity === "HIGH" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" : 
            severity === "MED" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,1)]" : 
            "bg-primary shadow-[0_0_8px_rgba(45,237,156,1)]",
          )}
        />
        {severity}
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 pt-6 border-t border-white/5 relative z-10">
      {[
        { val: `$${amount}`, label: "Cycle Spend", color: "text-white" },
        { val: `${count}×`, label: "Frequency", color: "text-primary" },
        { val: peak, label: "Peak Window", color: "text-blue-400" },
      ].map(({ val, label, color }) => (
        <div key={label}>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-50">
            {label}
          </div>
          <div className={cn("text-lg font-black tracking-tight", color)}>{val}</div>
        </div>
      ))}
    </div>

    {/* Timeline bars */}
    <div className="mb-8 relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.25em] opacity-50">
          Pattern Intensity // 7D History
        </div>
        <div className="text-[7px] text-primary font-bold uppercase tracking-widest opacity-80">
          Bar Height = Spend Volume
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-12">
        {timeline.map((v: number, i: number) => {
          const days = ["M", "T", "W", "T", "F", "S", "S"];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div
                className="w-full rounded-sm transition-all duration-700 bg-primary/20 hover:scale-x-110 mt-auto"
                style={{
                  height: `${Math.max(15, (v / Math.max(...timeline)) * 100)}%`,
                  backgroundColor:
                    v > 0
                      ? severity === "HIGH"
                        ? "#ef4444"
                        : severity === "MED"
                        ? "#f59e0b"
                        : "#2DED9C"
                      : "rgba(255,255,255,0.05)",
                  opacity: v > 0 ? 0.4 + (v / Math.max(...timeline)) * 0.6 : 0.1,
                }}
              />
              <span className="text-[7px] font-black text-muted-foreground/30 uppercase">
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Brain insight */}
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative hover:bg-white/[0.04] transition-all mb-4 mt-auto group/insight">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/10 group-hover/insight:border-primary/30 transition-colors">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <p
          className="text-[11px] leading-relaxed text-muted-foreground font-semibold"
          dangerouslySetInnerHTML={{ __html: insight }}
        />
      </div>
    </div>

    {/* Nova strip */}
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-center justify-between group/nova cursor-pointer hover:bg-primary/10 transition-all shadow-inner">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 group-hover/nova:scale-105 transition-transform">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(45,237,156,1)]" />
        </div>
        <div>
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-0.5">
            Nova Protocol Suggestion
          </p>
          <p
            className="text-[12px] font-black text-white group-hover/nova:text-primary transition-colors tracking-tight"
            dangerouslySetInnerHTML={{ __html: novaSuggestion }}
          />
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover/nova:opacity-100 group-hover/nova:translate-x-1 transition-all" />
    </div>
  </div>
);

export default function TriggersPage() {
  const [filter, setFilter] = useState("This Month");

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-10 text-foreground">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
              Behavioral Triggers
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse"
            >
              4 Active
            </Badge>
          </div>
          <p className="text-muted-foreground font-semibold text-sm max-w-2xl leading-snug">
            Deep analysis of behavioral spending and impulse signals detected in your patterns.
          </p>
        </div>

        <div className="flex bg-muted border border-border rounded-2xl p-1 shrink-0">
          {["This Month", "Last 3 Mo", "All Time"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Trigger Spend"
          value="$684"
          trend="up"
          trendValue="$120"
          colorClass="bg-red-500"
          icon={Zap}
        />
        <StatCard
          label="Avg Pulse"
          value="$38"
          trend="down"
          trendValue="12%"
          colorClass="bg-yellow-500"
          icon={Activity}
        />
        <StatCard
          label="Interventions"
          value="12"
          trend="up"
          trendValue="+4"
          colorClass="bg-primary"
          icon={Brain}
        />
        <StatCard
          label="Risk Window"
          value="Thu PM"
          trend="down"
          trendValue="High"
          colorClass="bg-blue-400"
          icon={Clock}
        />
      </div>

      {/* Trigger cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TriggerCard
          emoji="🍕"
          name="Stress Eating"
          severity="HIGH"
          desc="Work pressure → food delivery within 90 mins"
          amount="320"
          count="18"
          peak="Thu"
          timeline={[2, 1, 3, 5, 1, 0, 2]}
          insight="You order delivery <strong>22 minutes faster</strong> on days with high meetings."
          novaSuggestion="Nova detected this 6 days ago. A 5-min pause reduced this by 34%."
        />
        <TriggerCard
          emoji="🌙"
          name="Late Night Shop"
          severity="MED"
          desc="Impulse purchases after 10pm, mobile-driven"
          amount="186"
          count="9"
          peak="Fri"
          timeline={[0, 0, 1, 0, 3, 2, 1]}
          insight="78% of late-night buys happen <strong>while watching TV</strong>. Avg cart is $47."
          novaSuggestion="Try Nova's 10pm wind-down — an intention check for post-9pm buys."
        />
        <TriggerCard
          emoji="📱"
          name="Social Scroll"
          severity="LOW"
          desc="Browsing leads to checkout within 2 hrs"
          amount="98"
          count="4"
          peak="Sat"
          timeline={[1, 0, 0, 1, 0, 1, 0]}
          insight="Improving. Your 24-hr wishlist rule abandoned 6 carts. <strong>$312 saved</strong>."
          novaSuggestion="Keep the wishlist active — building real behavioral resilience. 💚"
        />
        <TriggerCard
          emoji="🥱"
          name="Boredom Spend"
          severity="MED"
          desc="Weekend time gap → browsing → buying"
          amount="80"
          count="5"
          peak="Sat"
          timeline={[0, 0, 0, 0, 1, 3, 2]}
          insight="Purchases happen <strong>Saturdays 1–4pm</strong>, typically items under $25."
          novaSuggestion="Nova can send a Saturday nudge with a free activity suggestion."
        />
      </div>

      {/* Vulnerability Heatmap */}
      <div className="bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 md:p-12 relative overflow-hidden group hover:border-border transition-all shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
              Vulnerability Heatmap
            </h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">
              Impulse Risk Architecture
            </p>
          </div>
          <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted px-6 py-3 rounded-full border border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500/20" /> Low
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500/50" /> Elevated
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />{" "}
              Critical
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 relative group/heatmap">
          {/* Deliberate Peekthrough Fade (Visible on mobile to invite swipe) */}
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-card via-card/80 to-transparent z-10 pointer-events-none md:hidden" />
          
          <div className="min-w-[750px] grid grid-cols-[80px_repeat(7,1fr)] gap-2 items-center">
            {/* Header row */}
            <div />
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-[10px] text-muted-foreground font-black text-center pb-3 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}

            {/* Data rows */}
            {["Morning", "Midday", "Afternoon", "Evening", "Night"].map(
              (time) => (
                <React.Fragment key={time}>
                  <div className="text-[10px] text-muted-foreground font-black text-right pr-4 uppercase tracking-wider">
                    {time}
                  </div>
                  {[0.1, 0.3, 0.5, 0.8, 0.2, 0.4, 0.6].map((v, colIdx) => (
                    <div
                      key={colIdx}
                      className="h-10 rounded-xl transition-all duration-300 cursor-crosshair group/cell relative"
                      style={{ backgroundColor: `rgba(239, 68, 68, ${v})` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-xl text-[10px] font-black text-foreground opacity-0 group-hover/cell:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap shadow-2xl scale-90 group-hover/cell:scale-100">
                        RISK INDEX: {Math.round(v * 100)}%
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ),
            )}
          </div>
        </div>
        <div className="flex justify-center mt-2 md:hidden">
           <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 animate-pulse">
              <ChevronRight className="w-3 h-3" /> Swipe to see full week
           </div>
        </div>
      </div>

      {/* Bottom analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* Emotional Velocity */}
        <div className="bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 flex flex-col group hover:border-border transition-all">
          <h3 className="text-xl font-black text-foreground mb-8 tracking-tighter uppercase flex items-center gap-3">
            <Flame className="w-5 h-5 text-red-500" />
            Emotional Velocity
          </h3>
          <div className="space-y-6">
            {[
              { n: "Stress / Anxiety", p: 72, c: "#ef4444" },
              { n: "Boredom", p: 48, c: "#f59e0b" },
              { n: "Loneliness", p: 35, c: "#3b82f6" },
              { n: "Celebration", p: 28, c: "#2DED9C" },
            ].map((e) => (
              <div key={e.n} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {e.n}
                  </span>
                  <span className="text-[10px] font-black text-foreground">
                    {e.p}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${e.p}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: e.c }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              <span className="text-primary font-black not-italic uppercase tracking-widest mr-2">
                Nova:
              </span>
              "Stress is your primary driver — addressing work stress could
              reduce impulse volume by 40%."
            </p>
          </div>
        </div>

        {/* Behavioral Resilience */}
        <div className="bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 md:p-10 flex flex-col group hover:border-border transition-all">
          <h3 className="text-xl font-black text-foreground mb-8 tracking-tighter uppercase flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            Behavioral Resilience
          </h3>
          <div className="space-y-4">
            {[
              {
                icon: "🧘",
                label: "Breathing Protocol",
                sub: "Reduced impulse buys by 34%",
                eff: "+34%",
                status: "good",
              },
              {
                icon: "⏱️",
                label: "24-hr Wishlist Rule",
                sub: "Saved $312 in cycle delta",
                eff: "$312",
                status: "good",
              },
              {
                icon: "🚶",
                label: "Physical Reset",
                sub: "Nova suggested · Higher efficiency",
                eff: "New",
                status: "new",
              },
              {
                icon: "💬",
                label: "Nova Direct Sync",
                sub: "Reduces spend urge by 60%",
                eff: "+60%",
                status: "good",
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-start gap-4 p-5 bg-muted border border-border rounded-2xl
                              hover:bg-muted/80 hover:border-primary/20 transition-all cursor-pointer group/item"
              >
                <span className="text-2xl group-hover/item:scale-110 transition-transform">
                  {r.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-foreground tracking-tight uppercase">
                    {r.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                    {r.sub}
                  </div>
                </div>
                <div
                  className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shrink-0",
                    r.status === "new"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {r.eff}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
