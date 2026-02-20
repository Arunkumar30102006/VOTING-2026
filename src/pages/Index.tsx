import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

import { SEO } from "@/components/layout/SEO";

const Index = () => {
  return (
    <div className="min-h-screen relative selection:bg-primary/20">
      <SEO
        title="Vote India Secure - Enterprise E-Voting Platform"
        description="Secure, transparent, and compliant e-voting platform for Indian companies. Blockchain-backed integrity."
        canonical="/"
      />
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
