import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const CTASection = () => {
  const benefits = [
    "Free company registration",
    "Unlimited shareholder accounts",
    "24/7 technical support",
    "SEBI compliance guaranteed",
  ];

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-transparent">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-white text-sm font-medium mb-8">
            <Shield className="w-4 h-4 text-orange-400" />
            <span>Start Your Free Trial Today</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            Ready to Transform Your{" "}
            <span className="text-primary">Shareholder Meetings?</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join 500+ Indian companies that trust E-Vote India for their shareholder voting needs.
            Get started in minutes, not days.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm text-white/90 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link to="/company-register" onClick={() => trackEvent(AnalyticsEvents.REGISTER_CLICK, { location: 'cta_section' })}>
            <Button
              variant="default"
              size="xl"
              className="gap-3 text-lg px-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <Building2 className="w-6 h-6" />
              Register Your Company Now
              <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>

          {/* Trust Text */}
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
