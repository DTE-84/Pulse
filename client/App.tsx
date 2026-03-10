import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NovaChat from "./pages/NovaChat";
import SpendingPage from "./pages/Spending";
import GrowthPage from "./pages/Growth";
import ReportsPage from "./pages/Reports";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
import SubscriptionPage from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
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
                  <Route path="/triggers" element={<Index />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
