import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BlurText from "@/components/ui/BlurText";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

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
      {/* Solid Background - Uses Global Theme */}
      <div className="absolute inset-0 -z-10 bg-transparent" />

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-block animate-fade-in bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-6 shadow-sm">
              <span className="text-white font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Secure. Compliant. Transparent.
              </span>
            </div>

            <div className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight flex flex-col items-center gap-2">
              <BlurText
                text="Digital Governance for"
                className="text-foreground text-center"
                delay={200}
                animateBy="words"
                direction="top"
              />
              <motion.span
                initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 animate-gradient text-center inline-block"
              >
                Modern India
              </motion.span>
            </div>

            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              ShareholderVoting.in is a digital platform for shareholders to securely participate in corporate voting, feedback, and governance activities. Experience seamless decision-making with bank-grade security.
            </p>


            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in-up delay-300">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-white/90 shadow-sm transition-all hover:bg-white/10"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
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
            <div className="flex items-center justify-center gap-8 mt-12 animate-fade-in-up delay-500">
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
