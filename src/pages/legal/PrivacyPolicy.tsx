import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Last Updated: October 2024</p>

                <div className="space-y-8 text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p>
                            E-Vote India ("we," "our," "us") is committed to protecting your privacy and ensuring the security of your personal data.
                            This Privacy Policy outlines how we collect, use, process, and safeguard your information in compliance with the
                            <strong> Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Personal Identification Data:</strong> Name, Email Address, Phone Number, Shareholder ID/Folio Number.</li>
                            <li><strong>Authentication Data:</strong> Login credentials, secure tokens, and biometric data (if enabled for 2FA).</li>
                            <li><strong>Voting Data:</strong> Encrypted voting choices (stored anonymously to ensure vote secrecy).</li>
                            <li><strong>Device & Log Data:</strong> IP address, browser type, and access timestamps for security auditing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Purpose of Processing</h2>
                        <p>We process your data for the following lawful purposes:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Facilitating secure and verifiable electronic voting for shareholder meetings.</li>
                            <li>Verifying your identity as an eligible voter.</li>
                            <li> complying with SEBI regulations and corporate laws.</li>
                            <li>Generating audit trails and preventing voter fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                        <p>
                            We implement state-of-the-art security measures, including <strong>256-bit encryption</strong>, secure socket layer (SSL) technology,
                            and strict access controls to protect your data. Our systems are STQC certified and regularly audited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Your Rights (DPDP Act 2023)</h2>
                        <p>As a Data Principal, you have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Access information about your personal data being processed.</li>
                            <li>Request correction or completion of inaccurate or incomplete data.</li>
                            <li>Register a grievance regarding data processing.</li>
                            <li>Withdraw consent for data processing (subject to legal/regulatory retention requirements).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                        <p>
                            For any privacy-related concerns or to exercise your rights, please contact our Data Protection Officer (DPO) at:
                            <br />
                            <strong>Email:</strong> privacy@evoteindia.com
                            <br />
                            <strong>Address:</strong> Mumbai Financial District, Maharashtra, India.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
