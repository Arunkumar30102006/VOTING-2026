import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Server, FileCheck, Eye, BadgeCheck } from "lucide-react";

const Security = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-5xl mx-auto space-y-16">
                    {/* Hero Section */}
                    <div className="text-center space-y-6">
                        <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            Bank-Grade Security Architecture
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            ShareholderVoting.in is built on a foundation of zero-trust security principles. We protect your corporate data with the same standards used by leading financial institutions.
                        </p>
                    </div>

                    {/* Key Security Pillars */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                            <Lock className="w-8 h-8 text-accent mb-4" />
                            <h3 className="text-xl font-bold mb-3">256-bit Encryption</h3>
                            <p className="text-muted-foreground">
                                All data is encrypted at rest and in transit using industry-standard AES-256 encryption protocols.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                            <Server className="w-8 h-8 text-primary mb-4" />
                            <h3 className="text-xl font-bold mb-3">Data Sovereignty</h3>
                            <p className="text-muted-foreground">
                                Your data resides securely within Indian borders, complying with the Digital Personal Data Protection Act, 2023.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
                            <FileCheck className="w-8 h-8 text-secondary mb-4" />
                            <h3 className="text-xl font-bold mb-3">Audit Trails</h3>
                            <p className="text-muted-foreground">
                                Immutable logs track every login, vote, and action, providing a tamper-proof history for compliance audits.
                            </p>
                        </div>
                    </div>

                    {/* Infrastructure Section */}
                    <div className="bg-muted/30 rounded-3xl p-8 md:p-12 border border-border/50">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold">Resilient Infrastructure</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Our platform is hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLAs. We utilize multi-zone redundancy to ensure your voting events are never interrupted.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <BadgeCheck className="w-5 h-5 text-green-500" />
                                        <span className="font-medium">SOC 2 Type II Compliant Centers</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <BadgeCheck className="w-5 h-5 text-green-500" />
                                        <span className="font-medium">DDoS Protection & WAF</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <BadgeCheck className="w-5 h-5 text-green-500" />
                                        <span className="font-medium">Regular Penetration Testing</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="relative h-64 md:h-full min-h-[300px] bg-background rounded-2xl border border-border p-6 flex items-center justify-center">
                                {/* Abstract Visual Representation of Security */}
                                <div className="absolute inset-0 bg-grid-slate-100/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                                <div className="text-center space-y-4 relative z-10">
                                    <Eye className="w-16 h-16 text-primary mx-auto opacity-80" />
                                    <div className="font-mono text-sm text-muted-foreground">
                                        System Status: <span className="text-green-500 font-bold">OPERATIONAL</span><br />
                                        Encryption: <span className="text-green-500 font-bold">ACTIVE</span><br />
                                        Threat Level: <span className="text-green-500 font-bold">NONE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compliance Note */}
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
                        <p className="text-muted-foreground">
                            ShareholderVoting.in is designed to adhere to the provisions of the **Companies Act, 2013** and relevant **SEBI License Obligations**. We work continuously with legal experts to ensure our platform adapts to the evolving regulatory landscape in India.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Security;
