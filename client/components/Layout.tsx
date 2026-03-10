import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  CreditCard, 
  TrendingUp, 
  Zap, 
  BarChart3,
  Moon,
  Sun,
  Flame,
  Settings,
  LogOut,
  User,
  X,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", active: true },
  { icon: MessageSquare, label: "Nova Chat", href: "/nova" },
  { icon: Zap, label: "Triggers", href: "/triggers" },
  { icon: CreditCard, label: "Spending", href: "/spending" },
  { icon: TrendingUp, label: "Growth", href: "/growth" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-[#0A0907] border-r border-white/5 sticky top-0 overflow-hidden">
      <div className="p-8">
        <Link to="/" className="flex items-center gap-4 mb-12 group">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SENTIENT PULSE LAYERS */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse [animation-duration:2s]" />
            
            {/* LOGO CONTAINER */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-black border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(45,237,156,0.15)]">
              <img 
                src="/pulse-logo-circular.svg" 
                alt="Nova" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(45,237,156,0.6)]" 
              />
            </div>

          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white leading-none uppercase">Pulse</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mt-1">Advanced AI Consultant</span>
          </div>
        </Link>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || (item.active && location.pathname === "/");
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-white/[0.03] text-primary border border-white/5 shadow-xl" 
                    : "text-muted-foreground hover:bg-white/[0.02] hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                {item.label}
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,1)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
        <div
          onClick={() => navigate("/auth")}
          className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.08] transition-all mb-8"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
               <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(45,237,156,0.5)]" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-black truncate text-white uppercase tracking-widest">Advanced Consultant</div>
            <div className="text-[9px] text-primary/80 truncate font-bold uppercase tracking-tight">System Integrity Active</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-zinc-900 border border-white/10 rounded flex items-center justify-center font-black text-[10px] text-white/40">DTE</div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Solutions LLC</span>
          </div>
          <div className="flex gap-4 opacity-30">
            <button className="text-[8px] font-bold uppercase tracking-widest text-white hover:text-primary transition-colors">Terms</button>
            <button className="text-[8px] font-bold uppercase tracking-widest text-white hover:text-primary transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const location = useLocation();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0A0907]/90 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-6 pb-2">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.href || (item.active && location.pathname === "/");
        return (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all relative",
              isActive ? "text-primary scale-110" : "text-muted-foreground opacity-50 hover:opacity-100"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            {isActive && (
              <div className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(45,237,156,1)]" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 shrink-0 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0A0907]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
              <div className="relative z-10 w-8 h-8 rounded-xl bg-black border border-primary/20 flex items-center justify-center">
                <img src="/pulse-logo-circular.svg" alt="Nova" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <span className="font-black tracking-tighter uppercase text-lg text-white leading-none">Pulse</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-8 pt-8 lg:pt-12 px-6 md:px-12 xl:px-24">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};
