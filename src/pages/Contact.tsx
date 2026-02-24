import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/layout/SEO";

import { env } from "@/config/env";

const Contact = () => {
    // The user's instruction included `const { toast } = useToast();`.
    // However, the existing code uses `toast` imported from "sonner" directly.
    // Adding `const { toast } = useToast();` without importing `useToast`
    // and without removing the `sonner` import would lead to a conflict or error.
    // To faithfully apply the change while maintaining a syntactically correct file,
    // and assuming the user intended to use the existing `sonner` toast,
    // this line is commented out. If `useToast` from another library (e.g., shadcn/ui)
    // is intended, its import would also be required.
    // const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        subject: "",
        message: ""
    });

    // Ensure clean state on mount without triggering error toasts
    useEffect(() => {
        const clearSession = async () => {
            try {
                // Only clear if a likely stale/invalid session exists to avoid unnecessary calls
                const sessionToken = localStorage.getItem("supabase.auth.token");
                if (sessionToken && (sessionToken.includes('"expires_at":') || sessionToken.includes('access_token'))) {
                    // Use local scope to avoid server call that might 401
                    await supabase.auth.signOut({ scope: 'local' });
                    localStorage.removeItem("supabase.auth.token");
                }
            } catch (e) {
                // Silently ignore all errors during cleanup
            }
        };
        clearSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log("Sending contact message...", formData);

            const { data, error } = await supabase.functions.invoke('send-contact-message', {
                body: formData,
                headers: {
                    "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
                    "apikey": env.SUPABASE_ANON_KEY
                }
            });

            if (error) {
                console.error("Supabase Function Error:", error);
                throw error;
            }

            if (!data?.success) {
                console.error("API Error:", data?.error);
                throw new Error(data?.error || "Failed to send message");
            }

            console.log("Message sent successfully:", data);
            toast.success("Message sent successfully! We will get back to you shortly.");

            setFormData({
                firstname: "",
                lastname: "",
                email: "",
                subject: "",
                message: ""
            });
        } catch (error: any) {
            console.error("Submission failed:", error);
            toast.error(error.message || "Failed to send message. Please try again or email us directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen relative">
            <SEO
                title="Contact Us"
                description="Have questions? Get in touch with our team for support and inquiries about our e-voting solutions."
                canonical="/contact"
            />
            <Navbar />
            <main className="container mx-auto px-4 py-8 md:py-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center space-y-4 mb-12 md:mb-16">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Contact Us</h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            We are here to assist you with any questions or support you need during the voting process.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Contact Information */}
                        <div className="space-y-6 md:space-y-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>

                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3 bg-primary/20 rounded-xl relative z-10 shrink-0">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div className="relative z-10 overflow-hidden w-full">
                                    <h3 className="font-semibold mb-1 text-white">Email Support</h3>
                                    <p className="text-xs md:text-sm text-slate-400 mb-2">For general inquiries and support:</p>
                                    <div className="space-y-1">
                                        <a href="mailto:support@shareholdervoting.in" className="text-sm md:text-base text-primary hover:underline font-medium block break-all">support@shareholdervoting.in</a>
                                        <a href="mailto:admin@shareholdervoting.in" className="text-sm md:text-base text-primary hover:underline font-medium block break-all">admin@shareholdervoting.in</a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 hover:border-secondary/30 transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3 bg-secondary/20 rounded-xl relative z-10 shrink-0">
                                    <Phone className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-semibold mb-1 text-white">Phone Support</h3>
                                    <p className="text-xs md:text-sm text-slate-400 mb-1">Mon-Fri from 9am to 6pm IST</p>
                                    <a href="tel:+919876543210" className="text-sm md:text-base text-secondary hover:underline font-medium">+91-9876543210</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0d1b2a]/40 backdrop-blur-xl border border-white/10 hover:border-accent/30 transition-all group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3 bg-accent/20 rounded-xl relative z-10 shrink-0">
                                    <MapPin className="w-6 h-6 text-accent" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-semibold mb-1 text-white">Office Location</h3>
                                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed italic">
                                        Tech Hub, Financial District<br />
                                        Mumbai, Maharashtra 400051, India
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-[#0d1b2a]/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative group overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6 md:mb-8">
                                    <div className="p-3 bg-secondary/20 rounded-xl">
                                        <MessageSquare className="w-6 h-6 text-secondary" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Send a Message</h2>
                                </div>
                                <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="firstname" className="text-xs md:text-sm font-medium text-slate-300">First Name</label>
                                            <input
                                                type="text"
                                                id="firstname"
                                                required
                                                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-[#020817]/40 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm transition-all"
                                                placeholder="John"
                                                value={formData.firstname}
                                                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastname" className="text-xs md:text-sm font-medium text-slate-300">Last Name</label>
                                            <input
                                                type="text"
                                                id="lastname"
                                                required
                                                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-[#020817]/40 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm transition-all"
                                                placeholder="Doe"
                                                value={formData.lastname}
                                                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-xs md:text-sm font-medium text-slate-300">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            className="w-full h-11 px-4 rounded-xl border border-white/10 bg-[#020817]/40 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm transition-all"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-xs md:text-sm font-medium text-slate-300">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            required
                                            className="w-full h-11 px-4 rounded-xl border border-white/10 bg-[#020817]/40 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm transition-all"
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-xs md:text-sm font-medium text-slate-300">Your Message</label>
                                        <textarea
                                            id="message"
                                            rows={4}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#020817]/40 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm transition-all resize-none"
                                            placeholder="Tell us what you need..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>
                                    <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" size="lg" disabled={isSubmitting}>
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
