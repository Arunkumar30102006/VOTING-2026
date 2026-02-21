import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, CheckCircle } from "lucide-react";
import { SEO } from "@/components/layout/SEO";

const SebiCompliance = () => {
    return (
        <div className="min-h-screen relative">
            <SEO
                title="SEBI Compliance"
                description="Vote India Secure ensures full compliance with SEBI and MCA regulations for electronic voting processes."
                canonical="/sebi-compliance"
            />
            <Navbar />
            <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-secondary/10 rounded-xl">
                        <Shield className="w-8 h-8 text-secondary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">SEBI Compliance</h1>
                </div>

                <p className="text-lg text-muted-foreground mb-12">
                    E-Vote India is fully compliant with the directives issued by the Securities and Exchange Board of India (SEBI)
                    and the Ministry of Corporate Affairs (MCA) regarding electronic voting facilities.
                </p>

                <div className="grid gap-8">
                    <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            STQC Certification
                        </h2>
                        <p className="text-foreground/80">
                            Our platform has been audited and certified by the Standardization Testing and Quality Certification (STQC) Directorate,
                            ensuring that our systems meet the highest standards of quality, reliability, and security as mandated by the Government of India.
                        </p>
                    </div>

                    <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Audit Trail & Transparency
                        </h2>
                        <p className="text-foreground/80">
                            We maintain immutable audit logs of all system activities, including voting timestamps, IP addresses (for security),
                            and modification attempts. These logs are tamper-proof and available for scrutinizer review.
                        </p>
                    </div>

                    <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Vote Secrecy
                        </h2>
                        <p className="text-foreground/80">
                            In accordance with regulations, our system ensures that the identity of the voter is disassociated from the vote cast
                            in the final report, preserving "Secret Ballot" principles while verifying voter eligibility.
                        </p>
                    </div>

                    <div className="bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Scrutinizer Access
                        </h2>
                        <p className="text-foreground/80">
                            Dedicated, secure portals are provided for appointed Scrutinizers to independently monitor the voting process,
                            unblock votes, and generate final reports without platform interference.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default SebiCompliance;
