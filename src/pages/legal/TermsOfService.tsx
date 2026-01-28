import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Gavel, AlertTriangle, FileCheck, ShieldAlert } from "lucide-react";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
                <div className="space-y-8">
                    <div className="text-center space-y-4 border-b border-border pb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-primary">Terms of Service</h1>
                        <p className="text-muted-foreground">Effective Date: January 22, 2026</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">

                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-destructive dark:text-red-400">
                            <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <strong>IMPORTANT DISCLAIMER:</strong> ShareholderVoting.in is a private technology platform. We are NOT an official government entity, SEBI, NSDL, or CDSL. We provide software tools for corporate governance. Users must independently verify the legal validity of their voting processes.
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-primary" />
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-muted-foreground">
                                By accessing or using the ShareholderVoting.in website and services, you agree to be bound by these Terms of Service. If you do not agree, strictly do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-primary" />
                                2. Services Provided
                            </h2>
                            <p className="text-muted-foreground">
                                ShareholderVoting.in provides a Software-as-a-Service (SaaS) platform for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Company registration and dashboard management.</li>
                                <li>Shareholder and director nomination management.</li>
                                <li>Electronic voting facilitation.</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                We act purely as an intermediary technology provider and do not influence voting outcomes or advise on corporate decisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-primary" />
                                3. User Responsibilities
                            </h2>
                            <p className="text-muted-foreground">
                                <strong>Companies:</strong> Are responsible for the accuracy of shareholder data, meeting notices, and compliance with applicable laws (e.g., Companies Act, 2013).<br />
                                <strong>Shareholders:</strong> Are responsible for maintaining the confidentiality of their login credentials and voting securely.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                To the fullest extent permitted by law, ShareholderVoting.in shall not be liable for any indirect, incidental, special, or consequential damages arising out of:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Service interruptions or technical failures.</li>
                                <li>Inaccurate data provided by companies.</li>
                                <li>Unauthorized access due to user negligence.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">5. Account Termination</h2>
                            <p className="text-muted-foreground">
                                We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or compromise the security of the platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">6. Governing Law</h2>
                            <p className="text-muted-foreground">
                                These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">7. Contact</h2>
                            <p className="text-muted-foreground">
                                Questions about these Terms should be sent to: <a href="mailto:legal@shareholdervoting.in" className="text-primary hover:underline">legal@shareholdervoting.in</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
