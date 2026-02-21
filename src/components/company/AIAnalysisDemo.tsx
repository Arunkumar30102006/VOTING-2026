
import { useState, useEffect } from 'react';
import { SentimentWidget } from '@/components/ai/SentimentWidget';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Search, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { votingApi } from '@/services/api/voting';
import { toast } from 'sonner';

export const AIAnalysisDemo = () => {
    const [text, setText] = useState("");
    const [analyzeText, setAnalyzeText] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isAddingToLive, setIsAddingToLive] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: admin } = await supabase.from('company_admins').select('company_id').eq('user_id', session.user.id).single();
            if (admin) {
                const session = await votingApi.getActiveSession(admin.company_id);
                if (session) setSessionId(session.id);
            }
        };
        fetchSession();
    }, []);

    const handlePushToLive = async (result: any) => {
        if (!sessionId) {
            toast.error("No active voting session found to link feedback.");
            return;
        }

        setIsAddingToLive(true);
        try {
            await votingApi.submitFeedback({
                session_id: sessionId,
                content: analyzeText,
                sentiment_label: result.sentiment,
                sentiment_score: result.score,
                themes: result.themes || [],
            });
            toast.success("Added to Live Stream!");
        } catch (error) {
            console.error("Error pushing to live:", error);
            toast.error("Failed to add to live stream.");
        } finally {
            setIsAddingToLive(false);
        }
    };

    return (
        <div className="space-y-4">
            <Textarea
                placeholder="e.g. 'I am very happy with the new director appointment, but the dividend rollout was delayed and frustrating.'"
                className="min-h-[120px] resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <Button
                onClick={() => setAnalyzeText(text)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!text.trim()}
            >
                <Search className="w-4 h-4 mr-2" />
                Analyze Feedback
            </Button>

            {analyzeText && (
                <div className="mt-4 pt-4 space-y-4">
                    <SentimentWidget feedbackText={analyzeText} />

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        onClick={() => {
                            // This is a bit of a hack since SentimentWidget doesn't expose data yet.
                            // I'll modify SentimentWidget next to accept an onResult callback.
                            const event = new CustomEvent('requestSentimentData', { detail: { callback: handlePushToLive } });
                            window.dispatchEvent(event);
                        }}
                        disabled={isAddingToLive}
                    >
                        {isAddingToLive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Push to Live Feedback Stream (Demo)
                    </Button>
                </div>
            )}
        </div>
    );
};
