import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Zap,
  Settings,
  Sparkles,
  LogOut,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", active: true },
  { icon: MessageSquare, label: "Nova Chat", href: "/nova" },
  { icon: Zap, label: "Triggers", href: "/triggers" },
  { icon: CreditCard, label: "Spending", href: "/spending" },
  { icon: TrendingUp, label: "Growth", href: "/growth" },
  { icon: Sparkles, label: "Membership", href: "/subscription" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 h-screen bg-card border-r border-border sticky top-0 overflow-hidden transition-all duration-500 neo-shadow">
      <div className="p-8">
        <Link to="/" className="flex items-center gap-4 mb-12 group">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* LOGO CONTAINER */}
            <div className="relative z-10 w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img
                src={`${import.meta.env.BASE_URL}PulseNovaLogoTrans.png`}
                alt="Pulse"
                className="w-12 h-12 object-contain filter drop-shadow-[0_0_15px_rgba(45,237,156,0.3)]"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-foreground leading-none uppercase">
              Pulse
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mt-1">
              Advanced AI Consultant
            </span>
          </div>
        </Link>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.active && location.pathname === "/");
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-muted text-primary border border-border shadow-md"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {item.label}
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,1)]" />
                )}
              </Link>
            );
          })}
              </nav>
        {/* Pre-Order CTA Card */}
        <div
          className="mt-10 p-5 bg-primary/5 border border-primary/20 rounded-3xl relative overflow-hidden group/preorder hover:bg-primary/10 transition-all cursor-pointer"
          onClick={() => navigate("/subscription")}
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover/preorder:bg-primary/20 transition-all" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                Early Access
              </span>
            </div>
            <p className="text-[11px] font-bold text-foreground leading-relaxed">
              Lock in your{" "}
              <span className="text-primary underline">Founding Member</span>{" "}
              rate — $14.99/mo, price-locked for life.
            </p>
            <button className="w-full py-2 bg-primary text-primary-foreground border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto p-8 border-t border-border bg-muted/20">
        <div
          onClick={() => {
            logout();
            navigate("/auth");
          }}
          className="flex items-center gap-4 p-4 bg-muted border border-border rounded-2xl cursor-pointer group hover:bg-muted/80 transition-all mb-8"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
              <LogOut className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-black truncate text-foreground uppercase tracking-widest">
              Logout
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-muted border border-border rounded flex items-center justify-center font-black text-[10px] text-muted-foreground/40">
              DTE
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
              © 2026 DTE Solutions LLC
            </span>
          </div>
          <div className="flex gap-4 opacity-30">
            <Link
              to="/legal"
              className="text-[8px] font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors"
            >
              Legal Protocol
            </Link>
            <a
              href="https://dte-solutions.icu"
              target="_blank"
              className="text-[8px] font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors"
            >
              The Hub
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

const primaryNav = menuItems.filter((i) =>
  ["/", "/triggers", "/spending", "/growth"].includes(i.href),
);
const secondaryNav = menuItems.filter(
  (i) => !["/", "/triggers", "/spending", "/growth"].includes(i.href),
);

const MobileNav = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSecondaryActive = secondaryNav.some(
    (i) => location.pathname === i.href,
  );

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Secondary drawer */}
      <div
        className={cn(
          "lg:hidden fixed left-4 right-4 z-50 bg-card/90 backdrop-blur-2xl border border-border rounded-[2rem] transition-all duration-500 ease-out shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden",
          drawerOpen
            ? "bottom-24 opacity-100 translate-y-0"
            : "bottom-20 opacity-0 pointer-events-none translate-y-12",
        )}
      >
        <div className="p-3 space-y-1">
          <div className="px-4 py-3 mb-2 border-b border-border">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">
              Pulse Command
            </span>
          </div>
          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center justify-between px-5 py-4 rounded-2xl transition-all relative group",
                  isActive
                    ? "bg-muted text-primary"
                    : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                      isActive
                        ? "bg-primary/20 border-primary/20"
                        : "bg-muted border-border group-hover:border-border",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,1)]" />
                ) : (
                  <Zap className="w-3 h-3 opacity-0 group-hover:opacity-20 transition-opacity" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Primary tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <div className="bg-background/95 backdrop-blur-2xl border border-border flex items-center justify-around px-2 sm:px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 min-h-[4.5rem] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto max-w-[600px] mx-auto">
          {primaryNav.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.active && location.pathname === "/");
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all relative",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground opacity-50 hover:opacity-100",
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          aria-label="Toggle menu"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all relative",
            drawerOpen || isSecondaryActive
              ? "text-primary scale-110"
              : "text-muted-foreground opacity-50 hover:opacity-100",
          )}
        >
          <div
            className={cn(
              "w-6 h-6 flex flex-col items-center justify-center gap-[4px] transition-transform duration-300",
              drawerOpen && "rotate-180",
            )}
          >
            <span className="w-4 h-[2px] bg-current rounded-full" />
            <span className="w-4 h-[2px] bg-current rounded-full" />
            <span className="w-4 h-[2px] bg-current rounded-full" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">
            More
          </span>
          {isSecondaryActive && !drawerOpen && (
            <div className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
          )}
        </button>
        </div>
      </div>
    </>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const { logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthPage = location.pathname === "/auth" || location.pathname.endsWith("/auth");
    const isOnboardingPage = location.pathname === "/onboarding" || location.pathname.endsWith("/onboarding");
    


    if (!loading && !isAuthenticated && !isAuthPage && !isOnboardingPage) {

      navigate("/auth");
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }



  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 shrink-0 border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="relative z-10 w-10 h-10 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL || "/"}PulseNovaLogoTrans.png`}
                  alt="Pulse"
                  className="w-10 h-10 object-contain filter drop-shadow-[0_0_10px_rgba(45,237,156,0.25)]"
                />
              </div>
            </div>
            <span className="font-black tracking-tighter uppercase text-lg text-foreground leading-none">
              Pulse
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              aria-label="Sign out"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 text-primary hover:text-red-400" />
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-8 pt-6 lg:pt-12 px-4 sm:px-6 md:px-12 xl:px-24">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

