
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export const DocumentSummarizer = () => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarize = async () => {
        if (!text.trim()) {
            toast.error('Please enter some text to summarize');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-ops', {
                body: { action: 'summarize', payload: { text } }
            });

            if (error) throw error;
            setSummary(data.result);
            toast.success('Summary generated successfully!');
        } catch (error) {
            console.error('Error generating summary:', error);
            toast.error('Failed to generate summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    <FileText className="h-6 w-6 text-purple-600" />
                    AI Document Summarizer
                </CardTitle>
                <CardDescription>
                    Paste your annual report or agenda text below to get an instant AI-generated summary.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Paste document text here..."
                    className="min-h-[200px] resize-none focus-visible:ring-purple-500"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className="flex justify-end">
                    <Button
                        onClick={handleSummarize}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Summarizing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Summarize with AI
                            </>
                        )}
                    </Button>
                </div>

                {summary && (
                    <div className="mt-8 p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            Summary
                        </h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
