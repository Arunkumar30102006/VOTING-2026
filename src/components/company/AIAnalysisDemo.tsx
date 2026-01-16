
import { useState } from 'react';
import { SentimentWidget } from '@/components/ai/SentimentWidget';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

// Define the component locally within the file or separate. 
// Since replace_file_content cannot easily inject a new function definition outside the component safely without risk of breaking syntax if not careful,
// I will create this as a separate file and import it, OR I can define it inside CompanyDashboard if I'm careful.
// But wait, I can just define it as a small internal component at the bottom of CompanyDashboard or inline it. 
// Actually, defining it inline in the render is messy. 
// Let's create a small component file for the demo input part to keep CompanyDashboard clean.

export const AIAnalysisDemo = () => {
    const [text, setText] = useState("");
    const [analyzeText, setAnalyzeText] = useState("");

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
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <SentimentWidget feedbackText={analyzeText} />
                </div>
            )}
        </div>
    );
};
