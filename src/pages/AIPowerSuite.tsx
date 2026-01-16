import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentSummarizer } from "@/components/ai/DocumentSummarizer";
import { AIAnalysisDemo } from "@/components/company/AIAnalysisDemo";
import { Sparkles, FileText, BrainCircuit, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AIPowerSuite = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/company-login");
            return;
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                <span>AI Power Suite</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                Advanced AI{" "}
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    Tools
                                </span>
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Leverage AI to summarize documents and analyze sentiment
                            </p>
                        </div>
                        <Button variant="ghost" onClick={() => navigate("/company-dashboard")} className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Button>
                    </div>

                    {/* AI Value Proposition */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <BrainCircuit className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Deeper Insights</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Understand shareholder sentiment instantly without reading thousands of comments manually.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-500/20 bg-purple-50/50 dark:bg-purple-900/10">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Time Saving</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Summarize lengthy 100+ page reports into concise executive summaries in seconds.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">Smart Decisions</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Make data-driven governance decisions based on real-time aggregated feedback analysis.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 overflow-hidden relative min-h-[500px]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Sparkles className="w-64 h-64 text-purple-600" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    AI Features
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Select a tool to get started
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="summarizer" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
                                    <TabsTrigger value="summarizer" className="gap-2">
                                        <FileText className="w-4 h-4" /> Document Summarizer
                                    </TabsTrigger>
                                    <TabsTrigger value="sentiment" className="gap-2">
                                        <BrainCircuit className="w-4 h-4" /> Sentiment Analysis
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="summarizer" className="animate-in fade-in slide-in-from-left-4 duration-500">
                                    <DocumentSummarizer />
                                </TabsContent>

                                <TabsContent value="sentiment" className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <h3 className="font-medium mb-2 text-lg text-gray-700 dark:text-gray-300">Shareholder Feedback Analysis</h3>
                                                <p className="text-sm text-gray-500 mb-6">Paste feedback text below to detect sentiment, generate summaries, and extract key themes.</p>
                                                <AIAnalysisDemo />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center p-6 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/20 border-dashed">
                                            <div className="text-center space-y-4 max-w-xs">
                                                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mx-auto">
                                                    <BrainCircuit className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <h4 className="font-semibold text-lg text-purple-900 dark:text-purple-100">Live Insights</h4>
                                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                                    Connect this to your real feedback channels to get automatic weekly sentiment reports.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AIPowerSuite;
