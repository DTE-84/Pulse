import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Shield,
  Zap,
  Brain,
  Target,
  Lock,
  Sparkles,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [monthlySpend, setSpend] = useState([2500]);
  const [novaTone, setTone] = useState("Balanced");
  const [loading, setLoading] = useState(false);

  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 8;

  const next = () =>
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  const back = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const finish = async () => {
    setLoading(true);
    try {
      const payload = {
        intentions: goals,
        baseline_spend: monthlySpend[0], 
        nova_tone: novaTone,              
        onboarding_completed: true,     
      };

      await authAPI.updateProfile(payload);
      updateUser(payload);

      toast({
        title: "You’re all set",
        description:
          "Pulse is ready. Nova will start guiding you from your dashboard.",
      });

      navigate("/");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn’t finish setup",
        description:
          "We couldn’t save your onboarding details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const SlideContainer = ({
    title,
    subtitle,
    children,
    nextLabel = "Next",
  }: any) => (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-3 mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none">
          {title}
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg font-medium leading-relaxed max-w-sm">
          {subtitle}
        </p>
      </div>
      <div className="flex-1">{children}</div>
      <div className="mt-auto pt-10 flex gap-4">
        {currentStep > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={back}
            className="rounded-2xl h-12 w-12 sm:h-16 sm:w-16 border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        <Button
          size="lg"
          onClick={currentStep === totalSteps - 1 ? finish : next}
          disabled={loading}
          className="flex-1 rounded-2xl h-12 sm:h-16 bg-primary text-background font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.3)]"
        >
          {currentStep === totalSteps - 1
            ? loading
              ? "Saving..."
              : "Enter Pulse"
            : nextLabel}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-[420px] min-h-[600px] h-[min(840px,90dvh)] bg-[#12110F] border border-white/5 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden p-6 sm:p-10">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-background rounded-2xl border border-white/5 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        <div className="pt-10 mb-8 flex justify-between items-center">
          <div className="flex gap-1.5 flex-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i <= currentStep ? "bg-primary w-8" : "bg-white/10 w-2",
                )}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-widest ml-4 transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {currentStep === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 bg-zinc-900 border-4 border-primary rounded-3xl flex items-center justify-center relative z-10 shadow-2xl rotate-12">
                  <span className="text-4xl font-black text-primary">P</span>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
                Pulse
              </h1>
              <div className="space-y-3 mb-12">
                <p className="text-xl text-white font-bold opacity-90">
                  Understand your habits.
                </p>
                <p className="text-xl text-primary font-bold">
                  Build toward your goals.
                </p>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.4em] mb-12">
                Behavioral finance, guided by Nova
              </p>
              <Button
                size="lg"
                onClick={next}
                className="w-full rounded-2xl h-16 bg-primary text-background font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.3)] mt-auto"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <SlideContainer
              title="Meet Nova."
              subtitle="Your guide inside Pulse."
            >
              <div className="space-y-6 pt-4">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Brain size={80} className="text-primary" />
                  </div>
                  <p className="text-orange-400 font-mono text-[10px] uppercase tracking-widest font-black">
                    Nova’s role
                  </p>
                  <p className="text-white/80 leading-relaxed relative z-10 text-sm font-medium">
                    Nova helps you understand spending patterns, stay connected
                    to your goals, and catch trigger spending before it quietly
                    slows your progress.
                  </p>
                </div>
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/20 italic text-primary/90 text-sm font-medium leading-relaxed">
                  “Think of Nova as your financial guide — not just a dashboard
                  voice.”
                </div>
              </div>
            </SlideContainer>
          )}

          {currentStep === 2 && (
            <SlideContainer
              title="Your data stays yours."
              subtitle="Pulse uses secure connections so your finances stay protected."
            >
              <div className="space-y-4 pt-4">
                {[
                  {
                    icon: Shield,
                    title: "Bank-grade security",
                    desc: "Read-only financial connections and protected account data.",
                    color: "text-blue-400",
                    bg: "bg-blue-400/10",
                  },
                  {
                    icon: Zap,
                    title: "Faster insight",
                    desc: "Connected data helps Pulse understand patterns without making you do everything manually.",
                    color: "text-primary",
                    bg: "bg-primary/10",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/5"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        item.bg,
                      )}
                    >
                      <item.icon size={24} className={item.color} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-6 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20 text-blue-200/70 text-[11px] font-medium leading-relaxed italic text-center">
                  The more complete your data is, the more helpful Nova becomes.
                </div>
              </div>
            </SlideContainer>
          )}

          {currentStep === 3 && (
            <SlideContainer
              title="What are you building toward?"
              subtitle="Pick the goals you want Pulse and Nova to keep in focus."
            >
              <div className="space-y-3 pt-4">
                {[
                  "Pay off debt",
                  "Build savings",
                  "Buy a home",
                  "Feel more in control",
                ].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all flex justify-between items-center group",
                      goals.includes(goal)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20",
                    )}
                  >
                    <span className="font-bold text-sm tracking-tight group-hover:translate-x-1 transition-transform">
                      {goal}
                    </span>
                    {goals.includes(goal) && (
                      <Check size={18} strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </SlideContainer>
          )}

          {currentStep === 4 && (
            <SlideContainer
              title="Set your baseline."
              subtitle="This gives Pulse a starting point for understanding your monthly spending rhythm."
            >
              <div className="space-y-12 py-12 px-2 text-center">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                    Monthly baseline
                  </p>
                  <p className="text-7xl font-black text-white tracking-tighter leading-none">
                    ${monthlySpend[0]}
                  </p>
                </div>
                <Slider
                  defaultValue={[2500]}
                  max={10000}
                  min={500}
                  step={100}
                  onValueChange={setSpend}
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest font-mono">
                  <span>$500</span>
                  <span>$10,000+</span>
                </div>
                <div className="mt-8 p-5 bg-white/5 rounded-3xl border border-white/5 text-[11px] font-medium text-muted-foreground leading-relaxed">
                  Pulse uses this to spot meaningful changes — not to judge you,
                  but to give Nova better context.
                </div>
              </div>
            </SlideContainer>
          )}

          {currentStep === 5 && (
            <SlideContainer
              title="Choose how Nova guides you."
              subtitle="You can change this anytime in settings."
            >
              <div className="space-y-4 pt-4">
                {[
                  {
                    id: "Gentle",
                    desc: "Support me with calm encouragement.",
                    color: "text-blue-400",
                    icon: Heart,
                  },
                  {
                    id: "Balanced",
                    desc: "Guide me with clarity and consistency.",
                    color: "text-primary",
                    icon: Sparkles,
                  },
                  {
                    id: "Driven",
                    desc: "Push me with stronger accountability.",
                    color: "text-orange-400",
                    icon: Target,
                  },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setTone(tone.id)}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all group relative overflow-hidden",
                      novaTone === tone.id
                        ? "bg-white/10 border-primary"
                        : "bg-white/5 border-white/10 hover:border-white/20",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <tone.icon
                          className={cn(
                            "w-5 h-5",
                            novaTone === tone.id ? tone.color : "text-white/60",
                          )}
                        />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-black text-sm tracking-widest uppercase mb-1",
                            novaTone === tone.id ? tone.color : "text-white/60",
                          )}
                        >
                          {tone.id}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                          {tone.desc}
                        </p>
                      </div>
                    </div>
                    {novaTone === tone.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Check
                          className={cn("w-5 h-5", tone.color)}
                          strokeWidth={3}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </SlideContainer>
          )}

          {currentStep === 6 && (
            <SlideContainer
              title="Your records stay durable."
              subtitle="Financial data should be useful, exportable, and ready when you need it."
            >
              <div className="space-y-6 pt-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-primary blur opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                  <div className="relative bg-zinc-900 p-8 rounded-[2.5rem] border border-white/10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner">
                      <Lock size={32} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-lg tracking-tight leading-none mb-2">
                        Financial memory
                      </p>
                      <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                        Pulse keeps the records that matter for reporting,
                        review, and long-term progress.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-3">
                    <Shield size={20} className="text-primary" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      Protected
                    </p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-3">
                    <Target size={20} className="text-blue-400" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      Export-ready
                    </p>
                  </div>
                </div>
              </div>
            </SlideContainer>
          )}

          {currentStep === 7 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000">
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(45,237,156,0.15)]">
                <Check size={48} className="text-primary" strokeWidth={3} />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-6">
                Ready.
              </h2>
              <p className="text-muted-foreground font-semibold text-lg leading-snug mb-12 max-w-[280px]">
                Pulse is ready. Nova will meet you on the dashboard with your
                first guidance.
              </p>
              <div className="w-full p-8 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 space-y-6 mb-12">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Baseline
                  </span>
                  <span className="text-xl font-black text-white tracking-tight">
                    ${monthlySpend[0]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Nova mode
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-black text-primary uppercase tracking-widest">
                      {novaTone}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={finish}
                disabled={loading}
                className="w-full rounded-2xl h-16 bg-primary text-background font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.3)] mt-auto"
              >
                {loading ? "Saving..." : "Enter Pulse"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
