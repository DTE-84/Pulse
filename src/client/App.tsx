import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";

import "./global.css";

// Page Imports
import Index from "./pages/Index";
import NovaChat from "./pages/NovaChat";
import SpendingPage from "./pages/Spending";
import GrowthPage from "./pages/Growth";
import ReportsPage from "./pages/Reports";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
// Removed SubscriptionPage temporarily to diagnose blackout
// import SubscriptionPage from "./pages/Subscription";
import SettingsPage from "./pages/Settings";
import ProfilePage from "./pages/Profile";
import LegalPage from "./pages/Legal";
import OutreachPage from "./pages/Outreach";
import TriggersPage from "./pages/Triggers";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="pulse-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter 
            basename={import.meta.env.BASE_URL || "/"}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              
              <Route path="*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/nova" element={<NovaChat />} />
                    <Route path="/spending" element={<SpendingPage />} />
                    <Route path="/growth" element={<GrowthPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/outreach" element={<OutreachPage />} />
                    <Route path="/triggers" element={<TriggersPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    {/* Subscription page removed temporarily */}
                    <Route path="/subscription" element={<div>Subscription Placeholder</div>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
