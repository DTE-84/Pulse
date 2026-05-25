import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[PulseAi] Uncaught Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0908] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                Signal Deviation Detected
              </h1>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Pulse encountered a deterministic error in the rendering protocol. 
                Your data integrity remains secure, but the visual uplink was interrupted.
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono text-red-400/80 break-all">
                {this.state.error?.message || "Unknown rendering exception"}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-background font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(45,237,156,0.2)] uppercase tracking-widest text-xs"
              >
                <RefreshCcw className="w-4 h-4" />
                Initialize System Recovery
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white/5 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
              >
                <Home className="w-4 h-4" />
                Return to Nexus
              </button>
            </div>
            
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] pt-8 opacity-30">
              DTE Systems • Pulse Protocol v1.6.4
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
