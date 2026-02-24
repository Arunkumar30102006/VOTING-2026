import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Lock, Server, ShieldCheck, Key } from "lucide-react";
import { SEO } from "@/components/layout/SEO";

const DataProtection = () => {
    return (
        <div className="min-h-screen relative">
            <SEO
                title="Data Protection"
                description="Our comprehensive data protection measures ensure the confidentiality, integrity, and availability of your corporate and voting data."
                canonical="/data-protection"
            />
            <Navbar />
            <main className="container mx-auto px-4 pt-28 pb-12 md:py-20 max-w-4xl">
                <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-large">
                    <h1 className="text-2xl md:text-3xl font-bold mb-6">Data Protection & Sovereignty</h1>
                    <p className="text-sm md:text-base text-muted-foreground mb-10 leading-relaxed">
                        Your corporate data is a strategic asset. We ensure its absolute protection through indigenous hosting and advanced cryptographic standards.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Lock className="w-8 h-8 text-secondary mb-3" />
                            <h3 className="text-lg font-bold mb-2">Encryption</h3>
                            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                                All data in transit is encrypted using TLS 1.3. Data at rest is encrypted with AES-256 standards,
                                ensuring that even in the unlikely event of a breach, data remains unreadable.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Server className="w-8 h-8 text-secondary mb-3" />
                            <h3 className="text-lg font-bold mb-2">Digital Sovereignty</h3>
                            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                                All data is processed and stored exclusively on Tier-4 data centers within Indian territory, ensuring zero cross-border data flow in compliance with national security guidelines.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <ShieldCheck className="w-8 h-8 text-secondary mb-3" />
                            <h3 className="text-lg font-bold mb-2">Regular Audits</h3>
                            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                                We conduct regular Vulnerability Assessment and Penetration Testing (VAPT) by CERT-In empaneled auditors
                                to identify and patch potential security weaknesses.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Key className="w-8 h-8 text-secondary mb-3" />
                            <h3 className="text-lg font-bold mb-2">Access Control</h3>
                            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                                Strict Role-Based Access Control (RBAC) ensures that only authorized personnel have access to specific system components.
                                MFA is mandatory for all administrative access.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default DataProtection;
