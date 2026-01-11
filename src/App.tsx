import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import CompanyRegister from "./pages/CompanyRegister";
import CompanyLogin from "./pages/CompanyLogin";
import CompanyDashboard from "./pages/CompanyDashboard";
import ShareholderLogin from "./pages/ShareholderLogin";
import VotingDashboard from "./pages/VotingDashboard";
import VotingManagement from "./pages/VotingManagement";
import NotFound from "./pages/NotFound";

import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import SebiCompliance from "./pages/legal/SebiCompliance";
import DataProtection from "./pages/legal/DataProtection";
import WebsiteFeedback from "./components/feedback/WebsiteFeedback";

const queryClient = new QueryClient();

const App = () => {
  console.log("Vote India Secure - Live v1.2 (Feedback Enabled)");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <WebsiteFeedback />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/company-register" element={<CompanyRegister />} />
              <Route path="/company-login" element={<CompanyLogin />} />
              <Route path="/company-dashboard" element={<CompanyDashboard />} />
              <Route path="/shareholder-login" element={<ShareholderLogin />} />
              <Route path="/voting-dashboard" element={<VotingDashboard />} />
              <Route path="/voting-management" element={<VotingManagement />} />

              {/* Legal Routes */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/sebi-compliance" element={<SebiCompliance />} />
              <Route path="/data-protection" element={<DataProtection />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  export default App;
