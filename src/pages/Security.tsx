import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Server, FileCheck, Eye, BadgeCheck } from "lucide-react";
import { SEO } from "@/components/layout/SEO";

const Security = () => {
    return (
        <div className="min-h-screen relative">
            <SEO
                title="Security Architecture"
                description="Our bank-grade security protocols ensure the highest level of protection for your corporate data and voting integrity."
                canonical="/security"
            />
            <Navbar />
            <main className="container mx-auto px-4 py-8 md:py-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="max-w-5xl mx-auto space-y-12 md:space-y-16">
                    {/* Hero Section */}
                    <div className="text-center space-y-4 md:space-y-6">
                        <div className="inline-block p-3 rounded-full bg-primary/20 mb-2 md:mb-4 animate-pulse">
                            <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                            Bank-Grade Security Architecture
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            ShareholderVoting.in is built on a foundation of zero-trust security principles. We protect your corporate data with the same standards used by leading financial institutions.
                        </p>
                    </div>

                    {/* Key Security Pillars */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        <div className="p-6 md:p-8 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-accent/30 transition-all group overflow-hidden">
                            <Lock className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg md:text-xl font-bold mb-3 text-white">256-bit Encryption</h3>
                            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                All data is encrypted at rest and in transit using industry-standard AES-256 encryption protocols.
                            </p>
                        </div>
                        <div className="p-6 md:p-8 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-primary/30 transition-all group overflow-hidden">
                            <Server className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg md:text-xl font-bold mb-3 text-white">Data Sovereignty</h3>
                            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                Your data resides securely within Indian borders, complying with the <span className="text-primary italic">Digital Personal Data Protection Act, 2023</span>.
                            </p>
                        </div>
                        <div className="p-6 md:p-8 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-secondary/30 transition-all group overflow-hidden sm:col-span-2 lg:col-span-1">
                            <FileCheck className="w-8 h-8 text-secondary mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-lg md:text-xl font-bold mb-3 text-white">Audit Trails</h3>
                            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                Immutable logs track every login, vote, and action, providing a tamper-proof history for compliance audits.
                            </p>
                        </div>
                    </div>

                    {/* Infrastructure Section */}
                    <div className="bg-[#020817]/60 backdrop-blur-2xl rounded-3xl p-6 md:p-12 border border-white/10 overflow-hidden relative group">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
                            <div className="space-y-4 md:space-y-6">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">Resilient Infrastructure</h2>
                                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                    Our platform is hosted on enterprise-grade cloud infrastructure with 99.9% uptime SLAs. We utilize multi-zone redundancy to ensure your voting events are never interrupted.
                                </p>
                                <ul className="space-y-3 md:space-y-4">
                                    {[
                                        "SOC 2 Type II Compliant Centers",
                                        "DDoS Protection & WAF",
                                        "Regular Penetration Testing"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <span className="text-sm md:text-base font-medium text-slate-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative h-48 md:h-full min-h-[200px] md:min-h-[300px] bg-[#020817]/40 rounded-2xl border border-white/5 p-4 md:p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                                <div className="text-center space-y-3 relative z-10 animate-in zoom-in duration-1000">
                                    <Eye className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto opacity-80" />
                                    <div className="font-mono text-[10px] md:text-xs text-slate-500 space-y-1">
                                        <div>SYSTEM STATUS: <span className="text-emerald-500 font-bold">OPERATIONAL</span></div>
                                        <div>ENCRYPTION: <span className="text-emerald-500 font-bold">ACTIVE (AES-256)</span></div>
                                        <div>THREAT LEVEL: <span className="text-emerald-500 font-bold">NONE DETECTED</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compliance Note */}
                    <div className="text-center max-w-2xl mx-auto pt-8 border-t border-white/5">
                        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">Regulatory Compliance</h2>
                        <p className="text-sm md:text-base text-slate-400 leading-relaxed italic">
                            ShareholderVoting.in is designed to adhere to the provisions of the <span className="text-primary">Companies Act, 2013</span> and relevant <span className="text-primary">SEBI Regulations</span>. We work continuously with legal experts to ensure our platform adapts to the evolving regulatory landscape in India.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Security;
