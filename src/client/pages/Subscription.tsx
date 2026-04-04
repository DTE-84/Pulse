import React, { useState } from "react";
import { 
  Check, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CreditCard,
  Crown,
  Star,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Standard",
    price: "$0",
    period: "Forever",
    description: "Essential tools for basic financial tracking.",
    features: [
      "Basic bank connection (1 account)",
      "Monthly spending alerts",
      "Manual trigger logging",
      "Community support"
    ],
    cta: "Continue Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "Harness the full power of Nova AI.",
    features: [
      "Unlimited bank connections",
      "Real-time Nova AI trigger detection",
      "Stress Index analysis",
      "Behavioral coaching with Nova",
      "Advanced growth forecasting",
      "Priority expert support"
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
    highlight: "text-primary shadow-[0_0_20px_rgba(45,237,156,0.3)]"
  },
  {
    name: "Elite",
    price: "$49",
    period: "/mo",
    description: "The ultimate financial performance suite.",
    features: [
      "Everything in Pro",
      "1-on-1 coaching with financial experts",
      "Tax optimization strategies",
      "Wealth management reporting",
      "Exclusive access to investor network",
      "Custom trigger development"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Subscription</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Pulse Pro Membership
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-white leading-tight">
            Choose your <br />
            <span className="text-primary underline underline-offset-8 decoration-primary/20">level of mastery.</span>
          </h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-xl leading-snug">
            Unlock Nova AI's full potential and transform your relationship with money. 
            Join thousands of users who have saved an average of $640/month.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center shrink-0">
          <button 
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              !isAnnual ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
              isAnnual ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            Annual
            <span className="absolute -top-3 -right-2 bg-primary text-background text-[9px] font-black px-1.5 py-0.5 rounded-full rotate-12 shadow-[0_0_10px_rgba(45,237,156,0.5)]">
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={cn(
              "bg-[#12110F] border border-white/5 rounded-[2.5rem] p-10 flex flex-col h-full relative transition-all group hover:bg-[#151412] hover:border-white/10",
              plan.popular ? "ring-2 ring-primary/30 shadow-[0_0_50px_rgba(45,237,156,0.1)] scale-105 z-10" : "scale-100"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-background text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(45,237,156,0.5)]">
                Most Popular
              </div>
            )}
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-2">
                  {plan.name === "Elite" ? <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" /> : plan.name === "Pro" ? <Sparkles className="w-5 h-5 text-primary fill-primary" /> : <Star className="w-5 h-5 text-muted-foreground" />}
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold h-10 overflow-hidden">{plan.description}</p>
              </div>
            </div>

            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white leading-none">
                {plan.price === "$0" ? plan.price : isAnnual ? `$${parseInt(plan.price.replace('$','')) * 0.8 * 12}` : plan.price}
              </span>
              <span className="text-muted-foreground font-black text-sm uppercase tracking-widest">{isAnnual && plan.name !== "Standard" ? "/year" : plan.period}</span>
            </div>

            <div className="space-y-4 mb-12 flex-1 pt-6 border-t border-white/5">
              {plan.features.map((feature, fi) => (
                <div key={fi} className="flex items-start gap-3 group/feature">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/feature:bg-primary/20 transition-colors">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground group-hover/feature:text-white transition-colors">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                plan.popular 
                  ? "bg-primary text-background shadow-[0_0_30px_rgba(45,237,156,0.2)] hover:scale-[1.02] active:scale-[0.98]" 
                  : "bg-white/5 text-white hover:bg-white/10 hover:text-white"
              )}
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Subscription FAQ / Guarantee */}
      <div className="bg-primary/[0.03] border border-primary/10 rounded-[2.5rem] p-10 mt-12 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-10 h-10 text-primary" />
             <h3 className="text-2xl font-black text-white">The Pulse Guarantee</h3>
          </div>
          <p className="text-muted-foreground font-semibold leading-relaxed">
            Not satisfied? Cancel anytime during your 14-day trial with zero commitments. 
            All your data remains encrypted and exportable whenever you need it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">100%</div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Secure</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white mb-1">24/7</div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
