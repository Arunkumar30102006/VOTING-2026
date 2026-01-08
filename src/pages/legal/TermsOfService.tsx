import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
                <p className="text-muted-foreground mb-8">Effective Date: October 2024</p>

                <div className="space-y-8 text-foreground/90 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using the E-Vote India platform, you agree to be bound by these Terms of Service.
                            These terms constitute a legally binding agreement between you ("User") and E-Vote India ("Company," "we").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Use of Services</h2>
                        <p>
                            You agree to use our services only for lawful purposes in connection with shareholder voting and corporate governance.
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. Prohibited Activities</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Attempting to interfere with or disrupt the integrity or performance of the voting system.</li>
                            <li>Impersonating another person or entity to cast a vote.</li>
                            <li>Reverse engineering or attempting to derive source code from the platform.</li>
                            <li>Using the platform for any fraudulent or illegal activity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
                        <p>
                            The E-Vote India platform, including its software, code, design, and logos, is the intellectual property of E-Vote India
                            and is protected by Indian copyright and trademark laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                        <p>
                            To the fullest extent permitted by law, E-Vote India shall not be liable for any indirect, incidental, special, or consequential damages
                            arising out of or in connection with your use of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>.
                            Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
