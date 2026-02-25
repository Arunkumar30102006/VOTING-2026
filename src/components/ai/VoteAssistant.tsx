
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { env } from '@/config/env';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const VoteAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI Vote Assistant (v2). Ask me anything about the voting process, dates, or agenda items.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // Toggle for reading responses
    const scrollRef = useRef<HTMLDivElement>(null);

    // Speech Recognition Setup
    const recognitionRef = useRef<any>(null);
    const [debugStatus, setDebugStatus] = useState<string>(""); // For visual debugging

    const initializeSpeech = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setDebugStatus("Status: Listening...");
                setIsListening(true);
                toast.info("Listening... Speak now.");
            };

            recognition.onresult = (event: any) => {
                setDebugStatus("Status: Result received");
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        setInputValue(event.results[i][0].transcript);
                    }
                }

                if (finalTranscript) {
                    setInputValue(finalTranscript);
                    handleSend(finalTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                setDebugStatus(`Status: Error - ${event.error}`);
                console.error('Speech error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    toast.error("Microphone blocked. Allow access in address bar.");
                } else if (event.error === 'no-speech') {
                    toast.info("No speech detected.");
                } else {
                    toast.error(`Error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                if (debugStatus !== "Status: Result received") {
                    setDebugStatus("Status: Stopped");
                }
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            return true;
        } else {
            setDebugStatus("Status: Not Supported");
            return false;
        }
    };

    useEffect(() => {
        initializeSpeech();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setDebugStatus("Status: Stopped by user");
        } else {
            if (!recognitionRef.current) {
                const success = initializeSpeech();
                if (!success) {
                    toast.error("Voice input not supported.");
                    return;
                }
            }

            try {
                recognitionRef.current.start();
                setDebugStatus("Status: Starting...");
            } catch (e: any) {
                console.error("Start error:", e);
                setDebugStatus(`Status: Start Error - ${e.message}`);
                // If it fails (e.g. already started), try to stop and restart
                try {
                    recognitionRef.current.stop();
                    setTimeout(() => recognitionRef.current.start(), 100);
                } catch (retryError) {
                    toast.error("Could not start microphone.");
                }
            }
        }
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel previous speech
            const utterance = new SpeechSynthesisUtterance(text);

            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft David")) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim()) return;

        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        setIsLoading(true);

        // If text came from voice (textOverride) or speaking is enabled, check if we should read
        // However, if the user explicitly muted (isSpeaking is false), we should NOT read even if voice input was used.
        // Or should we? Let's check common behavior. Usually, if I speak to Siri, it speaks back.
        // But the user complained "if they mute means the sound is out".
        // Let's interpret "sound is out" as "sound is emitted when it shouldn't be".
        // So we strictly follow isSpeaking.

        // If the user uses microphone but isSpeaking is false, maybe we should auto-enable it?
        // No, let's respect the toggle.
        const shouldRead = isSpeaking;

        try {
            const { data, error } = await supabase.functions.invoke('ai-ops', {
                body: {
                    action: 'chat',
                    payload: {
                        message: textToSend,
                        context: `You are the AI Assistant for 'Vote India Secure', a blockchain-based e-voting platform for Indian companies.

YOUR KNOWLEDGE BASE:
1. **User Types**:
   - **Shareholders**: They login with credentials sent via email to vote on resolutions.
   - **Companies**: They register, create voting sessions, and manage nominees.

2. **How to Vote (Shareholder Process)**:
   - **Step 1:** Go to 'Shareholder Login'.
   - **Step 2:** Enter your unique User Credential ID and Password (received via email).
   - **Step 3:** Enter the OTP sent to your registered email/mobile.
   - **Step 4:** Once logged in, you will see the 'Active Voting Session'.
   - **Step 5:** Click 'Start Voting'. You will see resolutions (e.g., Appointment of Directors).
   - **Step 6:** Select 'FOR', 'AGAINST', or 'ABSTAIN' for each resolution.
   - **Step 7:** Click 'Submit Vote'. You will get a blockchain transaction hash as a receipt.

3. **Key Features**:
   - **Security**: Votes are encrypted and stored on a tamper-proof ledger.
   - **Anonymity**: The company knows *that* you voted, but not *what* you voted (unless required by law).
   - **Timeframe**: Voting is only open during the 'Scheduled' start and end times.

INSTRUCTIONS:
- Answer ONLY about this website processes.
- Do NOT describe generic real-world paper ballot voting.
- If asked "How do I vote?", give the specific 7-step digital process above.
- Be concise, professional, and helpful.`
                    }
                },
                headers: {
                    "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`
                }
            });

            if (error) throw error;

            const responseText = data.result;
            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

            if (shouldRead) {
                speakText(responseText);
            }

        } catch (error: any) {
            console.error('Error sending message:', error);
            // Don't show toast for rate limit to avoid spamming the user, just show in chat
            if (!error.message.includes("Rate limit")) {
                toast.error(`Failed to get response: ${error.message || 'Unknown error'}`);
            }
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-2xl hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-300 backdrop-blur-sm border border-white/10 bottom-4 right-4 md:bottom-6 md:right-6"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}

            {isOpen && (
                <div className="w-[380px] h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl bg-black/40">
                    {/* Glassy Header */}
                    <div className="bg-white/5 backdrop-blur-md p-4 flex flex-row items-center justify-between shrink-0 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-inner">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-base">Vote Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="text-xs text-zinc-400">Online</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                onClick={() => {
                                    const newState = !isSpeaking;
                                    setIsSpeaking(newState);
                                    if (!newState) {
                                        window.speechSynthesis.cancel();
                                    }
                                    toast.info(newState ? "Voice Output Enabled" : "Voice Output Disabled");
                                }}
                                title={isSpeaking ? "Mute Text-to-Speech" : "Enable Text-to-Speech"}
                            >
                                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" ref={scrollRef}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex w-full items-end gap-2",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                {msg.role !== 'user' && (
                                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mb-1">
                                        <Bot className="h-3 w-3 text-white/70" />
                                    </div>
                                )}

                                <div className={cn(
                                    "max-w-[85%] px-4 py-2.5 text-sm shadow-sm backdrop-blur-md",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                        : "bg-white/10 text-zinc-100 rounded-2xl rounded-tl-sm border border-white/5"
                                )}>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex w-full items-end gap-2 flex-row">
                                <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mb-1">
                                    <Bot className="h-3 w-3 text-white/70" />
                                </div>
                                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-white/5 backdrop-blur-md">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-transparent mt-auto backdrop-blur-md">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="relative flex items-center"
                        >
                            <div className="absolute left-2 flex items-center z-10">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        "h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors",
                                        isListening && "text-red-500 hover:text-red-400 animate-pulse bg-red-500/10"
                                    )}
                                    // Make sure button itself is clickable
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleListening();
                                    }}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </Button>
                            </div>

                            <Input
                                placeholder={isListening ? "Listening..." : "Ask AI..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full pl-12 pr-12 h-12 rounded-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 backdrop-blur-sm transition-all shadow-inner"
                            />

                            <div className="absolute right-2 flex items-center">
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform active:scale-95"
                                    disabled={isLoading || (!inputValue.trim() && !isListening)}
                                >
                                    <Send className="h-3.5 w-3.5 ml-0.5" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
