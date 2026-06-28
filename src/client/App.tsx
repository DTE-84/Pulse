import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import ErrorBoundary from "./components/ErrorBoundary";

import "./global.css";

// Lazy-loaded page chunks — each route loads its JS only when visited
const Index          = lazy(() => import("./pages/Index"));
const NovaChat       = lazy(() => import("./pages/NovaChat"));
const SpendingPage   = lazy(() => import("./pages/Spending"));
const GrowthPage     = lazy(() => import("./pages/Growth"));
const ReportsPage    = lazy(() => import("./pages/Reports"));
const AuthPage       = lazy(() => import("./pages/Auth"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const SubscriptionPage = lazy(() => import("./pages/Subscription"));
const SettingsPage   = lazy(() => import("./pages/Settings"));
const ProfilePage    = lazy(() => import("./pages/Profile"));
const LegalPage      = lazy(() => import("./pages/Legal"));
const OutreachPage   = lazy(() => import("./pages/Outreach"));
const TriggersPage   = lazy(() => import("./pages/Triggers"));
const NotFound       = lazy(() => import("./pages/NotFound"));

import { Layout } from "./components/Layout";

const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--color-background-tertiary)"
  }}>
    <i className="ti ti-loader-2" style={{ fontSize: 32, animation: "spin 1s linear infinite" }} />
  </div>
);


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      background: "var(--color-background-tertiary)"
    }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pulse-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter 
              basename={import.meta.env.BASE_URL || "/"}
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  
                  {/* Protected Routes Wrapper */}
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/onboarding" element={<OnboardingPage />} />
                          <Route path="/nova" element={<NovaChat />} />
                          <Route path="/spending" element={<SpendingPage />} />
                          <Route path="/growth" element={<GrowthPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/outreach" element={<OutreachPage />} />
                          <Route path="/triggers" element={<TriggersPage />} />
                          <Route path="/reports" element={<ReportsPage />} />
                          <Route path="/subscription" element={<SubscriptionPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
