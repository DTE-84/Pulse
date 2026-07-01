import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import ErrorBoundary from "./components/ErrorBoundary";

import "./global.css";

// A helper function to retry lazy loading if it fails due to a network/deployment error
const lazyWithRetry = (componentImport: () => Promise<any>) => 
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Refresh the page once to get the latest assets from the server
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy-loaded page chunks — each route loads its JS only when visited
const Index          = lazyWithRetry(() => import("./pages/Index"));
const NovaChat       = lazyWithRetry(() => import("./pages/NovaChat"));
const SpendingPage   = lazyWithRetry(() => import("./pages/Spending"));
const GrowthPage     = lazyWithRetry(() => import("./pages/Growth"));
const ReportsPage    = lazyWithRetry(() => import("./pages/Reports"));
const AuthPage       = lazyWithRetry(() => import("./pages/Auth"));
const OnboardingPage = lazyWithRetry(() => import("./pages/Onboarding"));
const SubscriptionPage = lazyWithRetry(() => import("./pages/Subscription"));
const SettingsPage   = lazyWithRetry(() => import("./pages/Settings"));
const ProfilePage    = lazyWithRetry(() => import("./pages/Profile"));
const LegalPage      = lazyWithRetry(() => import("./pages/Legal"));
const OutreachPage   = lazyWithRetry(() => import("./pages/Outreach"));
const TriggersPage   = lazyWithRetry(() => import("./pages/Triggers"));
const NotFound       = lazyWithRetry(() => import("./pages/NotFound"));

import { Layout } from "./components/Layout";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

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
              <ScrollToTop />
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
