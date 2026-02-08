
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

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const VoteAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI Vote Assistant. Ask me anything about the voting process, dates, or agenda items.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // Toggle for reading responses
    const scrollRef = useRef<HTMLDivElement>(null);

    // Speech Recognition Setup
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                // Optional: Auto-send if confidence is high? For now let user confirm or just fill input.
                // Let's auto-send to make it "voice assistant" like.
                handleSend(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                toast.error("Voice input failed. Please check microphone permissions.");
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
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
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                    toast.info("Listening...");
                } catch (e) {
                    console.error(e);
                }
            } else {
                toast.error("Voice input is not supported in this browser.");
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

        // If text came from voice (textOverride) or speaking is enabled, read the response
        const shouldRead = !!textOverride || isSpeaking;

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!apiKey) {
                throw new Error("Missing VITE_GROQ_API_KEY in .env");
            }

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system", content: `You are the AI Assistant for 'Vote India Secure', a blockchain-based e-voting platform for Indian companies.

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
- Be concise, professional, and helpful.` },
                        { role: "user", content: textToSend }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
                }
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error("Invalid response from Groq API");
            }

            const responseText = data.choices[0].message.content;
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
        <div className="fixed bottom-6 left-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-white/5 backdrop-blur-lg border border-white/30 text-white shadow-lg hover:bg-white/10 hover:scale-110 transition-all duration-300"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-4 flex flex-row items-center justify-between shrink-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Vote Assistant
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => {
                                    const newState = !isSpeaking;
                                    setIsSpeaking(newState);
                                    toast.info(newState ? "Voice Output Enabled" : "Voice Output Disabled");
                                }}
                                title={isSpeaking ? "Mute Text-to-Speech" : "Enable Text-to-Speech"}
                            >
                                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-full items-start gap-2",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === 'user' ? "bg-blue-600" : "bg-purple-600"
                                    )}>
                                        {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700"
                                    )}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex w-full items-start gap-2 flex-row">
                                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className={cn("shrink-0 transition-colors", isListening && "bg-red-100 border-red-500 text-red-600 animate-pulse")}
                                    onClick={toggleListening}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </Button>

                                <Input
                                    placeholder={isListening ? "Listening..." : "Ask a question..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="flex-1 focus-visible:ring-purple-500"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                    disabled={isLoading || (!inputValue.trim() && !isListening)}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
