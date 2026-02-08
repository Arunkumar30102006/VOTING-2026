import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Lock, Server, ShieldCheck, Key } from "lucide-react";

const DataProtection = () => {
    return (
        <div className="min-h-screen relative">
            <Navbar />
            <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
                <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-large">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Data Protection Measures</h1>
                    <p className="text-lg text-muted-foreground mb-12">
                        Security is the core of our platform. We employ defense-in-depth strategies to ensure your data remains confidential,
                        integral, and available.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Lock className="w-10 h-10 text-secondary mb-4" />
                            <h3 className="text-xl font-bold mb-2">Encryption</h3>
                            <p className="text-foreground/80">
                                All data in transit is encrypted using TLS 1.3. Data at rest is encrypted with AES-256 standards,
                                ensuring that even in the unlikely event of a breach, data remains unreadable.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Server className="w-10 h-10 text-secondary mb-4" />
                            <h3 className="text-xl font-bold mb-2">Data Localization</h3>
                            <p className="text-foreground/80">
                                All user data is stored exclusively on secure servers located within India, complying with data localization
                                mandates for financial and sensitive personal data.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <ShieldCheck className="w-10 h-10 text-secondary mb-4" />
                            <h3 className="text-xl font-bold mb-2">Regular Audits</h3>
                            <p className="text-foreground/80">
                                We conduct regular Vulnerability Assessment and Penetration Testing (VAPT) by CERT-In empaneled auditors
                                to identify and patch potential security weaknesses.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card/10 border border-white/10 backdrop-blur-md">
                            <Key className="w-10 h-10 text-secondary mb-4" />
                            <h3 className="text-xl font-bold mb-2">Access Control</h3>
                            <p className="text-foreground/80">
                                Strict Role-Based Access Control (RBAC) ensures that only authorized personnel have access to specific system components.
                                MFA is mandatory for all administrative access.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DataProtection;
