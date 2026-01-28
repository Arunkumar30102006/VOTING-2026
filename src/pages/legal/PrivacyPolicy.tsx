import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, FileText, Eye } from "lucide-react";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
                <div className="space-y-8">
                    <div className="text-center space-y-4 border-b border-border pb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-primary">Privacy Policy</h1>
                        <p className="text-muted-foreground">Last Updated: January 22, 2026</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                1. Introduction
                            </h2>
                            <p className="text-muted-foreground">
                                ShareholderVoting.in ("we", "our", or "us") is committed to protecting the privacy and security of your personal information. This Privacy Policy outlines how we collect, use, process, and safeguard your data when you use our platform for corporate voting and governance activities. By accessing or using our services, you consent to the practices described in this policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                2. Information We Collect
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                We collect information necessary to provide secure and compliant voting services:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Identity Data:</strong> Name, Shareholder ID/Folio Number, Email address, Phone number.</li>
                                <li><strong>Corporate Data:</strong> Company details, Director nominations, Meeting agendas.</li>
                                <li><strong>Voting Data:</strong> Records of votes cast (encrypted and anonymized where applicable for results).</li>
                                <li><strong>Technical Data:</strong> IP address, browser type, device identifiers, and login timestamps for security auditing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                3. How We Use Your Information
                            </h2>
                            <p className="text-muted-foreground">
                                Your data is used strictly for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Facilitating secure and verifiable shareholder voting.</li>
                                <li>Verifying user identity and preventing fraud.</li>
                                <li>Communicating critical voting events (meeting notices, OTPs).</li>
                                <li>Complying with legal obligations under the Companies Act, 2013 and other applicable Indian laws.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                4. Data Security
                            </h2>
                            <p className="text-muted-foreground">
                                We employ industry-standard security measures, including 256-bit SSL encryption, secure server infrastructure, and strict access controls. While we strive to protect your data, no method of transmission over the internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">5. Data Sharing and Disclosure</h2>
                            <p className="text-muted-foreground">
                                We do not sell your personal data. We may share information with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>Regulatory Authorities:</strong> If required by law (e.g., SEBI, MCA courts).</li>
                                <li><strong>Service Providers:</strong> IT infrastructure providers who are bound by confidentiality agreements.</li>
                                <li><strong>The Concerned Company:</strong> To report voting results as per legal requirements (identity may be redacted depending on poll type).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">6. Your Rights</h2>
                            <p className="text-muted-foreground">
                                You have the right to request access to your personal data, correct inaccuracies, or request deletion (subject to legal retention requirements for voting records).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold">7. Contact Us</h2>
                            <p className="text-muted-foreground">
                                For privacy-related concerns, please contact our Data Protection Officer at: <a href="mailto:privacy@shareholdervoting.in" className="text-primary hover:underline">privacy@shareholdervoting.in</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
