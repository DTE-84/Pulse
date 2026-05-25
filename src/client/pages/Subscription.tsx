import { useState, useEffect } from "react";
import { 
  Check, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CreditCard,
  Crown,
  Star,
  ArrowRight,
  Shield,
  Lock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsAPI } from "@/lib/api";

const plans = [
  {
    name: "Standard",
    price: "$9.99",
    period: "/MO",
    description: "Essential tools for basic financial tracking.",
    features: [
      "Basic bank connection (1 account)",
      "Monthly spending alerts",
      "Manual trigger logging",
      "Community support"
    ],
    cta: " Free Trial",
    popular: false
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/mo",
    description: "Harness the full power of Nova AI.",
    features: [
      "Two bank connections",
      "Real-time Nova AI trigger detection",
      "Stress Index analysis",
      "Behavioral coaching with Nova",
      "Advanced growth forecasting",
      "Priority expert support"
    ],
    cta: "Start 7-Day Free Trial",
    popular: true,
    highlight: "text-primary shadow-[0_0_20px_rgba(45,237,156,0.3)]"
  },
  {
    name: "Elite",
    price: "$19.99",
    period: "/mo",
    description: "Secure the early-bird pre-order rate. Full Elite benefits at launch.",
    features: [
      "Everything in Pro",
      "Early-Bird Locked Rate ($14.99 vs $19.99)",
      "Priority support",
      "Tax optimization strategies",
      "Wealth management reporting",
      "Exclusive access to investor network",
      "Custom trigger development"
    ],
    cta: "Pre-Order Now",
    popular: false,
    elite: true
  }
];

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user, hasActiveSubscription } = useAuth();
  const { toast } = useToast();

  const trialDaysLeft = user?.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleStripeRedirect = async () => {
    if (!selectedPlan) return;
    setIsCheckingOut(true);
    try {
      const { url = "" } = await paymentsAPI.createSession(selectedPlan.name, isAnnual);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No redirect URL received.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: String(err.response?.data?.message || err.message || "Could not established analytical link to payment gateway."),
      });
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 text-foreground">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
        <span className="hover:text-primary cursor-pointer transition-colors">Settings</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-30" />
        <span className="text-primary">Subscription</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Pulse Membership Status
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-foreground leading-tight">
            {hasActiveSubscription ? (
              user?.subscriptionStatus === 'active' ? (
                <>Your Elite <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">Uplink is Active.</span></>
              ) : (
                <>Your Free Trial <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">{trialDaysLeft} Days Remaining.</span></>
              )
            ) : (
              <>Choose your <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">level of mastery.</span></>
            )}
          </h1>
          <p className="text-muted-foreground font-semibold text-lg max-w-xl leading-snug">
            {hasActiveSubscription 
              ? "You have full access to Nova AI's behavioral coaching and deep analysis protocols."
              : "Unlock Nova AI's full potential and transform your relationship with money. Join thousands of users who have saved an average of $640/month."}
          </p>
        </div>

        <div className="bg-card border border-border p-2 rounded-2xl flex items-center shrink-0">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              !isAnnual ? "bg-muted text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
              isAnnual ? "bg-muted text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <span className="absolute -top-3 -right-2 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full rotate-12 shadow-[0_0_10px_rgba(45,237,156,0.5)]">
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
              "bg-card border border-border rounded-[2.5rem] p-10 flex flex-col h-full relative transition-all group hover:bg-muted/30",
              plan.popular ? "ring-2 ring-primary/30 shadow-[0_0_50px_rgba(45,237,156,0.1)] scale-105 z-10" : "scale-100",
              plan.elite ? "border-yellow-500/20 bg-gradient-to-b from-yellow-500/[0.02] to-transparent" : ""
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(45,237,156,0.5)]">
                Most Popular
              </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight flex items-center gap-2">   
                  {plan.name === "Elite" ? <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" /> : plan.name === "Pro" ? <Sparkles className="w-5 h-5 text-primary fill-primary" /> : <Star className="w-5 h-5 text-muted-foreground" />}
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold h-10 overflow-hidden">{plan.description}</p> 
              </div>
            </div>

            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-foreground leading-none">
                {plan.price === "$0" ? plan.price : isAnnual ? `$${Math.round(parseFloat(plan.price.replace('$','')) * 0.8 * 12)}` : plan.price}
              </span>
              <span className="text-muted-foreground font-black text-sm uppercase tracking-widest">{isAnnual && plan.name !== "Standard" ? "/year" : plan.period}</span>
            </div>

            {plan.elite && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                  Locked in $14.99 for life with Pre-Order.
                </span>
              </div>
            )}

            <div className="space-y-4 mb-12 flex-1 pt-6 border-t border-border">
              {plan.features.map((feature, fi) => (
                <div key={fi} className="flex items-start gap-3 group/feature">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/feature:bg-primary/20 transition-colors">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground group-hover/feature:text-foreground transition-colors">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedPlan(plan)}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(45,237,156,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                  : plan.elite
                  ? "bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-primary/[0.03] border border-primary/10 rounded-[2.5rem] p-10 mt-12 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-10 h-10 text-primary" />
             <h3 className="text-2xl font-black text-foreground">The Pulse Guarantee</h3>
          </div>
          <p className="text-muted-foreground font-semibold leading-relaxed">
            Not satisfied? Cancel anytime during your 7-day trial with zero commitments.
            All your data remains encrypted and exportable whenever you need it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
          <div className="text-center">
            <div className="text-3xl font-black text-foreground mb-1">100%</div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Secure</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-foreground mb-1">24/7</div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Support</div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-[440px] bg-card border border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <DialogHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                {selectedPlan?.name === "Elite" ? <Crown className="w-8 h-8 text-yellow-500" /> : <Sparkles className="w-8 h-8 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tighter">
                  Secure Pre-Order
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground mt-2">
                  Initialize your {selectedPlan?.name} membership uplink.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-5 bg-muted border border-border rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Plan Selected</div>
                  <div className="text-sm font-black text-foreground uppercase tracking-tight">{selectedPlan?.name} Membership</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total</div>      
                  <div className="text-xl font-black text-foreground leading-none">
                    {selectedPlan?.name === "Elite" ? (isAnnual ? "$143" : "$14.99") : (isAnnual ? `$${Math.round(parseFloat((selectedPlan?.price || "$0").replace('$','')) * 0.8 * 12)}` : selectedPlan?.price)}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-[10px] font-black text-foreground uppercase tracking-widest">Secure Checkout via Stripe</div>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                  You will be redirected to Stripe's secure portal to complete your pre-order. 
                  Pulse never stores your credit card details.
                </p>
              </div>

              <div className="flex items-center gap-3 px-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  AES-256 Bit Encrypted Uplink
                </span>
              </div>
            </div>

            <button 
              onClick={handleStripeRedirect}
              disabled={isCheckingOut}
              className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(45,237,156,0.25)] uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              {isCheckingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Proceed to Secure Checkout
                </>
              )}
            </button>
          </div>
          
          <div className="bg-muted p-4 text-center border-t border-border">
             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
               Secured by DTE Systems Ecosystem Logic
             </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
