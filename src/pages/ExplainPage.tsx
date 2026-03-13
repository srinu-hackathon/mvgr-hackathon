import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronLeft, Copy, CheckCircle2, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";
import { isBookmarked, toggleBookmark } from "@/components/ResourceCard";
import type { Resource } from "@/types";

const MODES = [
    { id: "simple", label: "Simple", prompt: "Explain this in very simple terms a beginner would understand" },
    { id: "detailed", label: "Detailed", prompt: "Give a comprehensive, detailed academic explanation of this" },
    { id: "eli5", label: "ELI5", prompt: "Explain like I'm 5 years old with fun analogies" },
    { id: "exam", label: "Exam Ready", prompt: "Give a concise exam-ready answer covering key points, definitions, and examples" },
];

const QUICK_TOPICS = [
    "What is TCP/IP?",
    "Explain photosynthesis",
    "Newton's laws of motion",
    "What is normalization in DBMS?",
    "Explain supply and demand",
    "What is a linked list?",
];

const ExplainPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState("simple");
    const [explanation, setExplanation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleExplain = useCallback(async (overrideQuery?: string) => {
        const q = overrideQuery || query;
        if (!q.trim()) return;
        setIsLoading(true);
        setExplanation("");

        const selectedMode = MODES.find(m => m.id === mode) || MODES[0];

        try {
            const prompt = `${selectedMode.prompt}: "${q}".
      
Format your response with clear paragraphs. Use bullet points for lists. Keep it educational and accurate. Do NOT use markdown headers or code blocks.`;

            const response = await generateExplanation(prompt);
            setExplanation(response);
        } catch (e) {
            setExplanation("Sorry, I couldn't generate an explanation right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [query, mode]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(explanation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!explanation || !query) return;
        const res: Resource = {
            id: `ai_explain_${Date.now()}`,
            title: `Explanation: ${query}`,
            description: explanation.substring(0, 100) + "...",
            url: "",
            type: "notes",
            author: "Study Sphere AI",
            source: "AI Explain",
            topicId: "",
            rating: 5,
            upvotes: 0,
            status: "approved",
            createdAt: new Date().toISOString()
        };
        const saved = toggleBookmark(res);
        setIsSaved(saved);
    };

    return (
        <div className="min-h-screen pb-28">
            <PageHeader title="AI Explain" />
            <div className="p-4">

                <button onClick={() => navigate("/tools")} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-4 hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> Back to Tools
                </button>

                <div className="space-y-4">
                    {/* Header */}
                    <div className="text-center mb-2">
                        <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-black">AI Explain</h2>
                        <p className="text-xs text-muted-foreground mt-1">Get instant, clear explanations of any concept</p>
                    </div>

                    {/* Input */}
                    <div>
                        <textarea
                            placeholder="Type any concept, formula, or question..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            rows={3}
                            className="w-full bg-card rounded-xl px-4 py-3 text-sm font-medium text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Mode selector */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Explanation Style</p>
                        <div className="flex gap-2">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${mode === m.id
                                        ? "gradient-primary text-primary-foreground shadow-md"
                                        : "bg-card text-muted-foreground border border-border"
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Topics */}
                    {!explanation && !isLoading && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Try these</p>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_TOPICS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setQuery(t); handleExplain(t); }}
                                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-all"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Explain button */}
                    <button
                        onClick={() => handleExplain()}
                        disabled={!query.trim() || isLoading}
                        className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                    >
                        {isLoading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</>
                            : <><Sparkles className="h-4 w-4" /> Explain</>
                        }
                    </button>

                    {/* Explanation Output */}
                    <AnimatePresence>
                        {explanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card rounded-2xl border border-border p-5 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Explanation</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleSave} className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                                            <Bookmark className={`h-3 w-3 ${isSaved ? "fill-primary" : ""}`} /> {isSaved ? "Saved" : "Save"}
                                        </button>
                                        <button onClick={copyToClipboard} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                                            {copied ? <><CheckCircle2 className="h-3 w-3 text-green-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {explanation}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ExplainPage;
