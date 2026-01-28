import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Shield, Users, Target, Award } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-6">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
                            About ShareholderVoting.in
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Empowering shareholders with secure, transparent, and accessible digital governance solutions.
                        </p>
                    </div>

                    {/* Mission & Vision Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To modernize corporate governance in India by providing a secure, user-friendly platform that enables companies to conduct meetings and voting in full compliance with the **Companies Act, 2013** and **SEBI Regulations**.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-secondary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We are a team of financial technology experts and legal compliance professionals dedicated to building the infrastructure for the next generation of digital corporate democracy in India.
                            </p>
                        </div>
                    </div>

                    {/* Core Values */}
                    <div className="space-y-8 mt-16">
                        <h2 className="text-3xl font-bold text-center">Our Core Values</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-6">
                                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Security First</h3>
                                <p className="text-sm text-muted-foreground">
                                    We employ state-of-the-art encryption and security protocols to ensure the integrity of every vote cast.
                                </p>
                            </div>
                            <div className="text-center p-6">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Target className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                                <p className="text-sm text-muted-foreground">
                                    Our platform provides verifiable audit trails, ensuring complete transparency in the voting process.
                                </p>
                            </div>
                            <div className="text-center p-6">
                                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                                    <Award className="w-8 h-8 text-secondary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Compliance</h3>
                                <p className="text-sm text-muted-foreground">
                                    Built with Indian corporate regulations in mind, striving to meet the highest standards of legal adherence.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
