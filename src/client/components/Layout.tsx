import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Zap,
  Settings,
  LogOut,
  Crown,
  Sparkles,
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
  { icon: Crown, label: "Elite Access", href: "/subscription" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 h-screen bg-[#0A0907] border-r border-white/5 sticky top-0 overflow-hidden transition-all duration-500">
      <div className="p-8">
        <Link to="/" className="flex items-center gap-4 mb-12 group">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SENTIENT PULSE LAYERS */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse [animation-duration:2s]" />

            {/* LOGO CONTAINER */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-black border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(45,237,156,0.15)] overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}icon-1024.png`}
                srcSet={`
                  ${import.meta.env.BASE_URL}icon-29@2x.png 58w,
                  ${import.meta.env.BASE_URL}icon-60@2x.png 120w,
                  ${import.meta.env.BASE_URL}icon-1024.png 1024w
                `}
                sizes="40px"
                alt="Pulse"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white leading-none uppercase">
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
                    ? "bg-white/[0.03] text-primary border border-white/5 shadow-xl"
                    : "text-muted-foreground hover:bg-white/[0.02] hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-white",
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
            <p className="text-[11px] font-bold text-white leading-relaxed">
              Secure your{" "}
              <span className="text-primary underline">Pre-Order Elite</span>{" "}
              membership today.
            </p>
            <button className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
              Pre-Order Now
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
        <div
          onClick={() => {
            logout();
            navigate("/auth");
          }}
          className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.08] transition-all mb-8"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
              <LogOut className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-black truncate text-white uppercase tracking-widest">
              Logout
            </div>
            <div className="text-[9px] text-primary/80 truncate font-bold uppercase tracking-tight">
              Terminate Session
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-zinc-900 border border-white/10 rounded flex items-center justify-center font-black text-[10px] text-white/40">
              DTE
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
              Solutions LLC
            </span>
          </div>
          <div className="flex gap-4 opacity-30">
            <a
              href="https://dte-solutions.icu/legal/terms.html"
              target="_blank"
              className="text-[8px] font-bold uppercase tracking-widest text-white hover:text-primary transition-colors"
            >
              Terms
            </a>
            <a
              href="https://dte-solutions.icu/legal/privacy.html"
              target="_blank"
              className="text-[8px] font-bold uppercase tracking-widest text-white hover:text-primary transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

const primaryNav = menuItems.filter((i) =>
  ["/", "/nova", "/triggers", "/growth"].includes(i.href),
);
const secondaryNav = menuItems.filter(
  (i) => !["/", "/nova", "/triggers", "/growth"].includes(i.href),
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
          "lg:hidden fixed left-4 right-4 z-50 bg-[#0A0907]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] transition-all duration-500 ease-out shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden",
          drawerOpen
            ? "bottom-24 opacity-100 translate-y-0"
            : "bottom-20 opacity-0 pointer-events-none translate-y-12",
        )}
      >
        <div className="p-3 space-y-1">
          <div className="px-4 py-3 mb-2 border-b border-white/5">
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
                    ? "bg-white/5 text-primary"
                    : "text-white/70 hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                      isActive
                        ? "bg-primary/20 border-primary/20"
                        : "bg-white/5 border-white/5 group-hover:border-white/10",
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0907]/95 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 sm:px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-3 min-h-[4rem]">
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
    </>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 shrink-0 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between sticky top-0 bg-[#0A0907]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
              <div className="relative z-10 w-8 h-8 rounded-xl bg-black border border-primary/20 flex items-center justify-center overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}icon-1024.png`}
                  srcSet={`
                    ${import.meta.env.BASE_URL}icon-29@2x.png 58w,
                    ${import.meta.env.BASE_URL}icon-60@2x.png 120w,
                    ${import.meta.env.BASE_URL}icon-1024.png 1024w
                  `}
                  sizes="32px"
                  alt="Pulse"
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
            <span className="font-black tracking-tighter uppercase text-lg text-white leading-none">
              Pulse
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-500/10 transition-colors"
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
