import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/ui/BlurText";
import {
  Shield,
  Vote,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
  Building2,
  ShieldCheck
} from "lucide-react";

const HeroSection = () => {
  const features = [
    "End-to-End Encryption",
    "SEBI Compliant",
    "Tamper-Proof Audit Trails",
    "Two-Factor Authentication",
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />

        {/* Animated circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl animate-pulse-slow" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Content */}
          <div>
            {/* Badge */}
            <div className="inline-block animate-fade-in bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20 mb-6">
              <span className="text-secondary font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Secure. Compliant. Transparent.
              </span>
            </div>

            <div className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight flex flex-col items-center">
              <BlurText
                text="Digital Governance for"
                delay={50}
                animateBy="words"
                direction="top"
                className="text-foreground"
              />
              <BlurText
                text="Modern India"
                delay={50}
                animateBy="words"
                direction="bottom"
                className="text-accent mt-2"
              />
            </div>

            <p className="text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              ShareholderVoting.in is a digital platform for shareholders to securely participate in corporate voting, feedback, and governance activities. Experience seamless decision-making with bank-grade security.
            </p>


            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in-up delay-300">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm text-foreground"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400">
              <Link to="/company-register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto gap-2">
                  <Building2 className="w-5 h-5" />
                  Register Your Company
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/shareholder-login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto gap-2">
                  <Users className="w-5 h-5" />
                  Shareholder Login
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mt-10 animate-fade-in-up delay-500">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">10M+</p>
                <p className="text-sm text-muted-foreground">Votes Cast</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
