import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock,
  CreditCard,
  ArrowRight,
  Shield,
  Lock,
  Loader2,
  Users,
  MessageSquare,
  Zap,
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
import { paymentsAPI, authAPI } from "@/lib/api";

const PRO_FEATURES = [
  "Unlimited bank connections via Plaid",
  "Real-time behavioral trigger detection",
  "Advanced Stress Index & momentum tracking",
  "Behavioral coaching with Nova AI",
  "Full spending analytics & reports",
  "Priority support",
];

const FOUNDING_PERKS = [
  {
    icon: Lock,
    label: "Price-Locked for Life",
    desc: "Your $14.99/mo rate is frozen — price never increases as long as you stay subscribed.",
  },
  {
    icon: MessageSquare,
    label: "Direct Roadmap Input",
    desc: "Founding members get a direct line (Discord + email) for feature requests. You shape what gets built next.",
  },
  {
    icon: Users,
    label: "Early Access to New Features",
    desc: "Every new capability ships to founding members first — before the general product launch.",
  },
  {
    icon: Clock,
    label: "7-Day Free Trial",
    desc: "Full access, no charge. Cancel any time during the trial with zero commitment.",
  },
];

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user, hasActiveSubscription, updateUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const monthlyPrice = 14.99;
  const annualPrice = Math.round(monthlyPrice * 0.8 * 12);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("success") === "true") {
      toast({
        title: "Uplink Established",
        description: "Your Pulse membership has been activated.",
      });
      authAPI.me().then(res => {
        updateUser(res.data);
      }).catch(err => {
        console.error("[PulseAi] Failed to refresh profile after subscription:", err);
      });
    }
  }, [location.search]);

  const trialDaysLeft = user?.trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleStripeRedirect = async () => {
    setIsCheckingOut(true);
    try {
      const { url = "" } = await paymentsAPI.createSession("Pro", isAnnual);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No redirect URL received.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: String(err.response?.data?.message || err.message || "Could not establish link to payment gateway."),
      });
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-5 md:p-12 max-w-5xl mx-auto space-y-10 text-foreground font-inter">

      {/* Header */}
      <div className="space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
          Membership Protocol
        </Badge>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-tight font-jura uppercase">
          {hasActiveSubscription ? (
            user?.subscriptionStatus === 'active' ? (
              <>Your Uplink <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">is Active.</span></>
            ) : (
              <>Free Trial <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">{trialDaysLeft} Days Remaining.</span></>
            )
          ) : (
            <>Become a <br /> <span className="text-primary underline underline-offset-8 decoration-primary/20">Founding Member.</span></>
          )}
        </h1>
        <p className="text-muted-foreground font-semibold text-base md:text-lg max-w-2xl leading-snug">
          {hasActiveSubscription
            ? "You have full access to Nova AI's behavioral coaching and deep analysis protocols."
            : "One plan. Everything built. Lock in your rate before the public launch."}
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center gap-1 bg-card border border-border p-1.5 rounded-2xl w-fit">
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
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(45,237,156,0.5)] uppercase tracking-tighter">
            SAVE 20%
          </div>
        </button>
      </div>

      {/* Hero Plan Card */}
      <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 ring-2 ring-primary/30 shadow-[0_0_60px_rgba(45,237,156,0.08)] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
          
          {/* Left: Pricing + features */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary fill-primary" />
              </div>
              <div>
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Founding Member</div>
                <div className="text-lg font-black text-foreground uppercase tracking-tight font-jura">Pulse Pro</div>
              </div>
              <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">
                Early Access
              </Badge>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-foreground leading-none">
                  {isAnnual ? `$${annualPrice}` : `$${monthlyPrice}`}
                </span>
                <span className="text-muted-foreground font-black text-sm uppercase tracking-widest">
                  {isAnnual ? "/yr" : "/mo"}
                </span>
              </div>
              {isAnnual && (
                <div className="text-[11px] font-semibold text-primary mt-1">
                  That's ${(monthlyPrice * 0.8).toFixed(2)}/mo — 20% off monthly
                </div>
              )}
              <p className="text-xs text-muted-foreground font-semibold mt-2 leading-relaxed">
                Harness the full behavioral intelligence of Nova AI.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6 border-t border-border">
              {PRO_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {!hasActiveSubscription && (
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full py-4 rounded-2xl font-black text-sm bg-primary text-primary-foreground shadow-[0_0_30px_rgba(45,237,156,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                Start 7-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right: Founding Member perks */}
          <div className="lg:w-[340px] space-y-4">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">
              Founding Member Benefits
            </div>
            {FOUNDING_PERKS.map((perk, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <perk.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-foreground uppercase tracking-tight mb-1">{perk.label}</div>
                  <div className="text-[10px] font-semibold text-muted-foreground leading-relaxed">{perk.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guarantee Strip */}
      <div className="bg-primary/[0.03] border border-primary/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-primary" />
            <h3 className="text-2xl font-black text-foreground font-jura uppercase">The Pulse Guarantee</h3>
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

      {/* Checkout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(false)}>
        <DialogContent className="max-w-[440px] bg-card border border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <DialogHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tighter font-jura">
                  Secure Checkout
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground mt-2">
                  Initialize your Pulse Pro membership.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-5 bg-muted border border-border rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Plan Selected</div>
                  <div className="text-sm font-black text-foreground uppercase tracking-tight">Pulse Pro — Founding Member</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total</div>
                  <div className="text-xl font-black text-foreground leading-none">
                    {isAnnual ? `$${annualPrice}/yr` : `$${monthlyPrice}/mo`}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">7-Day Free Trial Included</span>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                  You won't be charged until your trial ends. Cancel any time — no questions asked.
                </p>
              </div>

              <div className="p-5 bg-muted/50 border border-border rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-[10px] font-black text-foreground uppercase tracking-widest">Secure Checkout via Stripe</div>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                  You will be redirected to Stripe's secure portal. Pulse never stores your card details.
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
