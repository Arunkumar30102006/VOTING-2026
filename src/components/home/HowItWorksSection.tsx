import { Building2, Users, Vote, FileCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Building2,
    title: "Company Registration",
    description: "Company registers on the platform, providing corporate details and SEBI-required documentation.",
    color: "from-primary to-navy-500",
  },
  {
    step: 2,
    icon: Users,
    title: "Director Nominations",
    description: "Add director details, their vision for the company, and set voting agenda items.",
    color: "from-secondary to-saffron-600",
  },
  {
    step: 3,
    icon: Vote,
    title: "Shareholder Voting",
    description: "Shareholders receive unique credentials via email and cast their votes securely.",
    color: "from-accent to-emerald-400",
  },
  {
    step: 4,
    icon: FileCheck,
    title: "Results & Audit",
    description: "Voting results are compiled with complete audit trails and regulatory reports.",
    color: "from-primary to-secondary",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 relative overflow-hidden bg-transparent">
      {/* Background - Removed for DarkVeil visibility */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6 shadow-sm">
            <Vote className="w-4 h-4 text-purple-400" />
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How{" "}
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              E-Voting
            </span>{" "}
            Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From company registration to final results, our streamlined process
            ensures a secure and efficient voting experience.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent transform -translate-y-1/2 z-0" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative group"
              >
                {/* Card */}
                <div className="bg-card/10 backdrop-blur-md rounded-2xl p-6 shadow-soft border border-white/10 hover:shadow-large transition-all duration-500 relative z-10">
                  {/* Step Number */}
                  <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-primary-foreground font-bold text-sm shadow-medium`}>
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-medium mb-5 mt-2 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <div className="w-8 h-8 rounded-full bg-card shadow-medium flex items-center justify-center border border-border">
                      <ArrowRight className="w-4 h-4 text-secondary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
