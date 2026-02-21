import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackItem {
    id: string;
    content: string;
    sentiment_label: 'Positive' | 'Neutral' | 'Negative';
    sentiment_score: number;
    created_at: string;
}

export const LiveSentimentMonitor = () => {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState({ positive: 0, neutral: 0, negative: 0, total: 0 });

    useEffect(() => {
        fetchInitialData();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('public:shareholder_feedback')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shareholder_feedback',
                },
                (payload) => {
                    const newItem = payload.new as FeedbackItem;
                    addFeedbackItem(newItem);
                    toast.info("New shareholder feedback received!");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInitialData = async () => {
        const { data, error } = await supabase
            .from('shareholder_feedback')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching feedback:', error);
            return;
        }

        if (data) {
            setFeedback(data as FeedbackItem[]);
            calculateStats(data as FeedbackItem[]);
        }
    };

    const addFeedbackItem = (item: FeedbackItem) => {
        setFeedback(prev => {
            const newFeedback = [item, ...prev].slice(0, 50); // Keep last 50
            calculateStats(newFeedback);
            return newFeedback;
        });
    };

    const calculateStats = (items: FeedbackItem[]) => {
        const newStats = items.reduce((acc, item) => {
            if (item.sentiment_label === 'Positive') acc.positive++;
            else if (item.sentiment_label === 'Negative') acc.negative++;
            else acc.neutral++;
            acc.total++;
            return acc;
        }, { positive: 0, neutral: 0, negative: 0, total: 0 });
        setStats(newStats);
    };

    const getSentimentColor = (label: string) => {
        switch (label) {
            case 'Positive': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Negative': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    const getSentimentIcon = (label: string) => {
        switch (label) {
            case 'Positive': return <ThumbsUp className="w-3 h-3" />;
            case 'Negative': return <ThumbsDown className="w-3 h-3" />;
            default: return <Minus className="w-3 h-3" />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Stats Overview */}
            <div className="lg:col-span-1 h-full">
                <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Sentiment Trend
                        </CardTitle>
                        <CardDescription>Real-time analysis of last 50 comments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Positive</span>
                                    <span className="font-medium text-emerald-500">{stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.positive / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Neutral</span>
                                    <span className="font-medium text-yellow-500">{stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.neutral / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Negative</span>
                                    <span className="font-medium text-red-500">{stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.negative / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-primary/5">
                            <div className="text-center">
                                <span className="text-4xl font-bold block text-foreground">{stats.total}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Total Comments</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Feed */}
            <div className="lg:col-span-2 h-full">
                <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/10 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Live Feedback Stream
                            <Badge variant="outline" className="ml-auto animate-pulse text-green-500 border-green-500/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                                LIVE
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px] p-0">
                        <ScrollArea className="h-[300px] px-6 pb-6">
                            <div className="space-y-4">
                                {feedback.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground italic">
                                        Waiting for feedback...
                                    </div>
                                ) : (
                                    feedback.map((item) => (
                                        <div key={item.id} className="group p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors animate-fade-in-left">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className={`flex items-center gap-1 ${getSentimentColor(item.sentiment_label)}`}>
                                                    {getSentimentIcon(item.sentiment_label)}
                                                    {item.sentiment_label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/90 leading-relaxed">
                                                {item.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
