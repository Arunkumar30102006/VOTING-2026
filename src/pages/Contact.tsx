import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log("Sending contact message...", formData);

            const { data, error } = await supabase.functions.invoke('send-contact-message', {
                body: formData
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
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center space-y-4 mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary">Contact Us</h1>
                        <p className="text-xl text-muted-foreground">
                            We are here to assist you with any questions or support you need.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Get in Touch</h2>
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                                    <Mail className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-1">Email Support</h3>
                                        <p className="text-sm text-muted-foreground mb-2">For general inquiries and support:</p>
                                        <a href="mailto:support@shareholdervoting.in" className="text-primary hover:underline font-medium">support@shareholdervoting.in</a>
                                        <br />
                                        <a href="mailto:admin@shareholdervoting.in" className="text-primary hover:underline font-medium">admin@shareholdervoting.in</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                                    <Phone className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-1">Phone</h3>
                                        <p className="text-sm text-muted-foreground mb-2">Mon-Fri from 9am to 6pm IST</p>
                                        <a href="tel:+919876543210" className="text-primary hover:underline font-medium">+91-987654321</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                                    <MapPin className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-1">Office Address</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Tech Hub, Financial District<br />
                                            Mumbai, Maharashtra 400051<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form Placeholder */}
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-6 h-6 text-secondary" />
                                <h2 className="text-2xl font-bold">Send a Message</h2>
                            </div>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstname" className="text-sm font-medium">First Name</label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            required
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="John"
                                            value={formData.firstname}
                                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastname" className="text-sm font-medium">Last Name</label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            required
                                            className="w-full p-2 rounded-md border border-input bg-background"
                                            placeholder="Doe"
                                            value={formData.lastname}
                                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className="w-full p-2 rounded-md border border-input bg-background"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        required
                                        className="w-full p-2 rounded-md border border-input bg-background"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        required
                                        className="w-full p-2 rounded-md border border-input bg-background"
                                        placeholder="Your message..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>
                                <Button className="w-full" size="lg" disabled={isSubmitting}>
                                    {isSubmitting ? "Sending Message..." : "Send Message"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
