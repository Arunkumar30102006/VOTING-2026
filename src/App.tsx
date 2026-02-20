import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ScrollToTop from "./components/ScrollToTop";
import WebsiteFeedback from "./components/feedback/WebsiteFeedback";
import { VoteAssistant } from "./components/ai/VoteAssistant";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import GlobalErrorBoundary from "./components/layout/GlobalErrorBoundary";

// Lazy Load Pages
const Index = lazy(() => import("./pages/Index"));
const CompanyRegister = lazy(() => import("./pages/CompanyRegister"));
const CompanyLogin = lazy(() => import("./pages/CompanyLogin"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const ShareholderLogin = lazy(() => import("./pages/ShareholderLogin"));
const VotingDashboard = lazy(() => import("./pages/VotingDashboard"));
const VotingManagement = lazy(() => import("./pages/VotingManagement"));
const AIPowerSuite = lazy(() => import("./pages/AIPowerSuite"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy Load Public/Legal Pages
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Security = lazy(() => import("./pages/Security"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const SebiCompliance = lazy(() => import("./pages/legal/SebiCompliance"));
const DataProtection = lazy(() => import("./pages/legal/DataProtection"));

// Configure Global Query Client with aggressive caching (User Requested)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

import { HelmetProvider } from 'react-helmet-async';
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";

const App = () => {
  console.log("Vote India Secure - Performance Optimized v2.0");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <GlobalErrorBoundary>
          <HelmetProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <WebsiteFeedback />
                <VoteAssistant />
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/company-register" element={<CompanyRegister />} />
                    <Route path="/company-login" element={<CompanyLogin />} />
                    import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";

                    // ... inside Routes ...
                    <Route path="/" element={<Index />} />
                    <Route path="/company-register" element={<CompanyRegister />} />
                    <Route path="/company-login" element={<CompanyLogin />} />
                    <Route path="/shareholder-login" element={<ShareholderLogin />} />
                    <Route path="/voting-dashboard" element={<VotingDashboard />} />

                    {/* Protected Admin Routes */}
                    <Route element={<ProtectedAdminRoute />}>
                      <Route path="/company-dashboard" element={<CompanyDashboard />} />
                      <Route path="/voting-management" element={<VotingManagement />} />
                      <Route path="/ai-power-suite" element={<AIPowerSuite />} />
                    </Route>

                    {/* Public Pages */}
                    <Route path="/about" element={<About />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Legal Routes */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/sebi-compliance" element={<SebiCompliance />} />
                    <Route path="/data-protection" element={<DataProtection />} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </HelmetProvider>
        </GlobalErrorBoundary>
      </ThemeProvider >
    </QueryClientProvider >
  );
};

export default App;
