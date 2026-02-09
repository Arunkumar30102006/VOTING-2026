import { useState } from "react";
import { MessageSquare, Star, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

const WebsiteFeedback = () => {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [category, setCategory] = useState("");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();

    const categories = [
        { value: "bug", label: "Bug Report" },
        { value: "feature", label: "Feature Request" },
        { value: "ui", label: "UI/UX Improvement" },
        { value: "performance", label: "Performance Issue" },
        { value: "general", label: "General Feedback" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please provide a rating");
            return;
        }
        if (!category) {
            toast.error("Please select a category");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userEmail = email || user?.email || "anonymous";

            // Direct fetch to debug 401/CORS issues
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            const response = await fetch(`${supabaseUrl}/functions/v1/send-feedback-to-sheet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                    type: "website",
                    rating,
                    category,
                    message,
                    email: userEmail,
                    pageName: location.pathname,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Server Error: ${response.status}`);
            }

            toast.success("Feedback submitted successfully!", {
                description: "Thank you for helping us improve.",
            });
            setOpen(false);
            resetForm();
        } catch (error) {
            console.error("Feedback error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback";

            // Check if it looks like a missing credential error
            if (errorMessage.includes("JSON") || errorMessage.includes("Unexpected token")) {
                toast.error("Configuration Error: Feedback system not set up properly.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setCategory("");
        setMessage("");
        setEmail("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="fixed bottom-6 left-6 rounded-full h-14 w-14 shadow-lg z-50 animate-in fade-in zoom-in hover:scale-110 transition-transform duration-200 bg-primary hover:bg-primary/90"
                    size="icon"
                >
                    <MessageSquare className="h-6 w-6" />
                    <span className="sr-only">Feedback</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                    <DialogDescription>
                        Help us improve the website. Your feedback is valuable!
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Rating */}
                    <div className="flex flex-col items-center justify-center gap-2 mb-4">
                        <Label>How would you rate your experience?</Label>
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="p-1 transition-all duration-200 hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                            : "text-muted-foreground/30"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <span className="text-sm font-medium text-muted-foreground animate-in fade-in">
                                {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Very Poor"}
                            </span>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="To contact you about your feedback"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Your Feedback</Label>
                        <Textarea
                            id="message"
                            placeholder="Tell us what you think..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none min-h-[100px]"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Submit Feedback
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WebsiteFeedback;
