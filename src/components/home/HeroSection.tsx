import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-block animate-fade-in bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20 mb-6">
              <span className="text-secondary font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Secure. Compliant. Transparent.
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Digital Governance for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">
                Modern India
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              ShareholderVoting.in is a digital platform for shareholders to securely participate in corporate voting, feedback, and governance activities. Experience seamless decision-making with bank-grade security.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up delay-300">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-400">
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
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-10 animate-fade-in-up delay-500">
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

          {/* Right Content - Illustration */}
          <div className="relative flex justify-center lg:justify-end animate-scale-in delay-300">
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Main Card */}
              <div className="relative z-10 bg-card rounded-3xl shadow-large p-8 border border-border/50">
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-medium">
                    <Vote className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Annual General Meeting</h3>
                    <p className="text-sm text-muted-foreground">Active Voting Session</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Voting Progress</span>
                    <span className="font-semibold text-accent">76%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[76%] bg-gradient-to-r from-accent to-emerald-400 rounded-full animate-pulse-slow" />
                  </div>
                </div>

                {/* Voting Items */}
                <div className="space-y-3">
                  {[
                    { label: "Director Re-election", votes: "12,450", status: "approved" },
                    { label: "Dividend Declaration", votes: "11,890", status: "approved" },
                    { label: "Auditor Appointment", votes: "10,234", status: "pending" },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w - 2 h - 2 rounded - full ${item.status === "approved" ? "bg-accent" : "bg-secondary animate-pulse"
                          } `} />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.votes} votes</span>
                    </div>
                  ))}
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 mt-6 p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <Lock className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-accent">256-bit Encrypted Session</span>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 z-20 bg-card rounded-2xl shadow-medium p-4 border border-border/50 animate-bounce-gentle">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="text-sm font-semibold text-foreground">Verified Secure</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 z-20 bg-secondary rounded-2xl shadow-glow p-4 animate-float">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary-foreground" />
                  <span className="text-sm font-semibold text-secondary-foreground">15,234 Active</span>
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl scale-110" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
