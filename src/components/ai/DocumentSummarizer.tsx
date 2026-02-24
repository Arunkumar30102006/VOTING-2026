
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Sparkles, Upload, FileUp, X, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Text extraction libraries
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Initialize PDF.js worker
// Using a more robust worker initialization for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const DocumentSummarizer = () => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [activeFile, setActiveFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setActiveFile(file);
        setIsExtracting(true);
        setSummary(''); // Clear previous summary

        try {
            let extractedText = '';
            const fileType = file.type;

            if (fileType === 'application/pdf') {
                extractedText = await extractTextFromPDF(file);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extractedText = await extractTextFromWord(file);
            } else if (fileType.startsWith('image/')) {
                extractedText = await extractTextFromImage(file);
            } else {
                toast.error(`Unsupported file type: ${fileType}. Please upload PDF, Word, or Image.`);
                setActiveFile(null);
                setIsExtracting(false);
                return;
            }

            if (extractedText && extractedText.trim()) {
                setText(extractedText);
                toast.success('Text extracted successfully!');
                handleSummarize(extractedText);
            } else {
                console.warn('Extraction completed but no text found.');
                toast.error('No readable text found in this file.');
            }
        } catch (error: any) {
            console.error('Extraction Error Details:', error);
            const errorMessage = error?.message || 'Check if the file is encrypted or corrupted.';
            toast.error(`Failed to extract text: ${errorMessage}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // Handle different item types and ensure we get a string
                const pageText = content.items
                    .map((item: any) => item.str || '')
                    .filter((str: string) => str.trim().length > 0)
                    .join(' ');
                fullText += pageText + '\n';
            }
            return fullText;
        } catch (err: any) {
            console.error('PDF.js Error:', err);
            throw new Error(`PDF Error: ${err.message || 'Worker initialization failed'}`);
        }
    };

    const extractTextFromWord = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const extractTextFromImage = async (file: File): Promise<string> => {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(file);
        await worker.terminate();
        return ret.data.text;
    };

    const handleSummarize = async (overrideText?: string) => {
        const textToSummarize = overrideText || text;
        if (!textToSummarize.trim()) {
            toast.error('Please enter some text or upload a document to summarize');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-ops', {
                body: { action: 'summarize', payload: { text: textToSummarize } },
                headers: {
                    "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`
                }
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

    const clearFile = () => {
        setActiveFile(null);
        setText('');
        setSummary('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Card className="w-full max-w-4xl mx-auto backdrop-blur-md bg-white/5 dark:bg-gray-900/40 border-white/10 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
                    AI Smart Summarizer
                </CardTitle>
                <CardDescription className="text-lg">
                    Analyze annual reports, agendas, or complex documents in seconds.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                {/* File Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 group ${activeFile ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
                        }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.docx,image/*"
                        onChange={handleFileChange}
                        disabled={isExtracting || isLoading}
                    />

                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                        {activeFile ? (
                            <>
                                <div className="p-4 rounded-full bg-primary/20 text-primary animate-in zoom-in duration-300">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-foreground">{activeFile.name}</p>
                                    <p className="text-sm text-muted-foreground">{(activeFile.size / 1024 / 1024).toFixed(2)} MB • {activeFile.type.split('/')[1].toUpperCase()}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="z-20 text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFile();
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" /> Remove
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="p-4 rounded-full bg-white/5 text-muted-foreground group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors duration-300">
                                    <FileUp className="h-10 w-10" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-medium text-foreground">Click or Drag & Drop Documents</p>
                                    <p className="text-sm text-muted-foreground">Supports PDF, Word (.docx), and Images</p>
                                </div>
                            </>
                        )}
                    </div>

                    {isExtracting && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-30">
                            <div className="flex flex-col items-center space-y-3">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-sm font-medium animate-pulse text-foreground">Reading document text...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#020817] px-2 text-muted-foreground">OR PASTE TEXT</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Textarea
                        placeholder="Manually paste text from your document here..."
                        className="min-h-[150px] bg-white/5 border-white/10 focus-visible:ring-purple-500 rounded-xl"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex gap-4">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Word Count:</span>
                            <span className="ml-2 font-mono text-foreground">{text.trim() ? text.trim().split(/\s+/).length : 0}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="ml-2 font-mono text-foreground">{new Blob([text]).size} bytes</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => handleSummarize()}
                        disabled={isLoading || isExtracting || !text.trim()}
                        className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Generating Intelligence...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-3 h-5 w-5 animate-pulse" />
                                <span className="text-lg">Summarize Now</span>
                            </>
                        )}
                    </Button>
                </div>

                {summary && (
                    <div className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-white/10 shadow-inner animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                </div>
                                AI Analysis Results
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/10 hover:bg-white/5"
                                onClick={() => {
                                    navigator.clipboard.writeText(summary);
                                    toast.success('Summary copied to clipboard!');
                                }}
                            >
                                Copy Summary
                            </Button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-300 leading-relaxed font-light">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
