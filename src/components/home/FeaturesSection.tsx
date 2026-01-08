import { 
  Shield, 
  Lock, 
  Eye, 
  Fingerprint, 
  FileCheck, 
  Globe,
  Mail,
  Calendar
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All voting data is encrypted from your device to our servers using military-grade 256-bit encryption.",
    color: "from-primary to-navy-500",
  },
  {
    icon: Fingerprint,
    title: "Two-Factor Authentication",
    description: "Extra layer of security with OTP verification sent to registered mobile numbers and email.",
    color: "from-secondary to-saffron-600",
  },
  {
    icon: Eye,
    title: "Immutable Audit Trails",
    description: "Every vote is recorded with tamper-proof logs for complete transparency and regulatory compliance.",
    color: "from-accent to-emerald-400",
  },
  {
    icon: Shield,
    title: "Unique Credentials",
    description: "One-time login credentials for each shareholder, automatically hashed after voting completion.",
    color: "from-primary to-secondary",
  },
  {
    icon: FileCheck,
    title: "SEBI Compliant",
    description: "Fully compliant with Securities and Exchange Board of India regulations for e-voting.",
    color: "from-emerald-500 to-accent",
  },
  {
    icon: Globe,
    title: "Multi-Platform Access",
    description: "Vote securely from any device - desktop, tablet, or mobile with responsive design.",
    color: "from-navy-400 to-primary",
  },
  {
    icon: Mail,
    title: "Email Notifications",
    description: "Automated emails with voting credentials, meeting details, and director nominations.",
    color: "from-saffron-500 to-secondary",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Companies can set custom voting windows with automatic start and end times.",
    color: "from-accent to-primary",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Enterprise-Grade Security</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Built for Security,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Designed for Trust
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge security technology with intuitive design 
            to deliver a seamless and trustworthy voting experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-large hover:-translate-y-2 transition-all duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-medium mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
