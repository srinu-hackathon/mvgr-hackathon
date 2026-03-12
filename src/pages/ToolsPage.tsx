import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Copy, Check, BrainCircuit, BookOpen, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    topic?: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

interface Flashcard {
    front: string;
    back: string;
}

type ActiveMode = "chat" | "quiz" | "flashcards";

const suggestions = [
    "Explain Binary Trees",
    "What is photosynthesis?",
    "Newton's Laws of Motion",
    "Explain DBMS normalization",
    "Compare TCP and UDP",
];

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
};

const ToolsPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Quiz state
    const [activeMode, setActiveMode] = useState<ActiveMode>("chat");
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizCurrent, setQuizCurrent] = useState(0);
    const [quizSelected, setQuizSelected] = useState<number | null>(null);
    const [quizAnswered, setQuizAnswered] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [quizTopic, setQuizTopic] = useState("");

    // Flashcard state
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [flashCurrent, setFlashCurrent] = useState(0);
    const [flashFlipped, setFlashFlipped] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isTyping, activeMode]);

    // Get the last discussed topic from conversation
    const getConversationTopic = useCallback(() => {
        const userMsgs = messages.filter(m => m.role === "user");
        if (userMsgs.length === 0) return "";
        return userMsgs[userMsgs.length - 1].content;
    }, [messages]);

    const send = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), topic: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await generateExplanation(text);
            setMessages(prev => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: "assistant", content: response, topic: text.trim() },
            ]);
        } catch {
            setMessages(prev => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
            ]);
        }
        setIsTyping(false);
    };

    // Generate Quiz from conversation context
    const generateQuiz = useCallback(async () => {
        const topic = getConversationTopic();
        if (!topic) return;
        setIsGenerating(true);
        setQuizTopic(topic);

        try {
            const prompt = `Generate exactly 5 multiple choice questions about "${topic}".
Return ONLY a JSON array: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":0,"explanation":"..."}]
Rules: 5 questions, 4 options each, "correct" is 0-based index. ONLY JSON.`;

            const response = await generateExplanation(prompt);
            const parsed: QuizQuestion[] = JSON.parse(response.replace(/```json|```/g, "").trim());
            setQuizQuestions(parsed.slice(0, 5));
            setQuizCurrent(0);
            setQuizScore(0);
            setQuizSelected(null);
            setQuizAnswered(false);
            setActiveMode("quiz");
        } catch {
            console.error("Quiz generation failed");
        }
        setIsGenerating(false);
    }, [getConversationTopic]);

    // Generate Flashcards from conversation context
    const generateFlashcards = useCallback(async () => {
        const topic = getConversationTopic();
        if (!topic) return;
        setIsGenerating(true);

        try {
            const prompt = `Create exactly 8 flashcards about "${topic}".
Return ONLY a JSON array: [{"front":"Question or term","back":"Answer or definition (1-2 sentences)"}]
Cover the most important concepts. ONLY JSON.`;

            const response = await generateExplanation(prompt);
            const parsed: Flashcard[] = JSON.parse(response.replace(/```json|```/g, "").trim());
            setFlashcards(parsed.slice(0, 8));
            setFlashCurrent(0);
            setFlashFlipped(false);
            setActiveMode("flashcards");
        } catch {
            console.error("Flashcard generation failed");
        }
        setIsGenerating(false);
    }, [getConversationTopic]);

    const handleQuizAnswer = (index: number) => {
        if (quizAnswered) return;
        setQuizSelected(index);
        setQuizAnswered(true);
        if (index === quizQuestions[quizCurrent].correct) setQuizScore(s => s + 1);
    };

    const nextQuizQuestion = () => {
        if (quizCurrent + 1 >= quizQuestions.length) {
            const pct = Math.round(((quizScore + (quizSelected === quizQuestions[quizCurrent].correct ? 0 : 0)) / quizQuestions.length) * 100);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: `**Quiz Complete!** You scored **${quizScore}/${quizQuestions.length}** (${pct}%) on "${quizTopic}". ${pct >= 70 ? "Great job!" : "Keep studying!"}`,
            }]);
            setActiveMode("chat");
        } else {
            setQuizCurrent(c => c + 1);
            setQuizSelected(null);
            setQuizAnswered(false);
        }
    };

    const backToChat = () => {
        setActiveMode("chat");
    };

    return (
        <div className="flex min-h-screen flex-col pb-40">
            <PageHeader title="Study Bot" subtitle="Chat, Learn, Quiz, Flashcards" />

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">

                {/* Chat Mode */}
                {activeMode === "chat" && (
                    <>
                        {messages.length === 0 && (
                            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
                                    <BrainCircuit className="h-8 w-8 text-primary-foreground" />
                                </div>
                                <h2 className="font-bold text-xl text-foreground tracking-tight">What do you want to study?</h2>
                                <p className="mt-2 text-sm text-muted-foreground px-6">
                                    Ask any question. Once you've discussed a topic, you can generate a quiz or flashcards from it.
                                </p>

                                <div className="mt-6 flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-2 -mx-2">
                                    {suggestions.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-95 shrink-0"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={`mb-4 flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm">
                                            <Bot className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "gradient-primary text-primary-foreground rounded-br-none"
                                        : "bg-card border border-border/50 text-card-foreground rounded-bl-none"
                                        }`}>
                                        {msg.role === "assistant" ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        table: (p) => <div className="my-3 overflow-x-auto rounded-lg border border-border"><table className="w-full text-xs border-collapse" {...p} /></div>,
                                                        th: (p) => <th className="border-b border-border px-3 py-2 bg-muted/50 font-bold text-left" {...p} />,
                                                        td: (p) => <td className="border-b border-border px-3 py-2" {...p} />,
                                                        code: (p) => <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono border border-border/50" {...p} />,
                                                        h3: (p) => <h3 className="text-sm font-bold mt-4 mb-2 text-primary" {...p} />,
                                                        ul: (p) => <ul className="list-disc pl-4 space-y-1 my-2" {...p} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">AI Note</span>
                                                    <CopyButton text={msg.content} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary shadow-sm">
                                            <User className="h-4 w-4 text-secondary-foreground" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isTyping && (
                            <div className="mb-4 flex items-center gap-3 animate-in fade-in duration-300">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary">
                                    <Bot className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div className="rounded-[1.25rem] rounded-bl-none bg-card border border-border/50 px-5 py-3 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: "0ms" }} />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: "150ms" }} />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons — appear after AI responds */}
                        {messages.length > 0 && !isTyping && !isGenerating && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-4 mt-2">
                                <button
                                    onClick={generateQuiz}
                                    className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-xs font-bold text-foreground hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
                                >
                                    <BrainCircuit className="h-4 w-4 text-violet-600" /> Generate Quiz
                                </button>
                                <button
                                    onClick={generateFlashcards}
                                    className="flex-1 flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-xs font-bold text-foreground hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
                                >
                                    <BookOpen className="h-4 w-4 text-amber-600" /> Make Flashcards
                                </button>
                            </motion.div>
                        )}

                        {isGenerating && (
                            <div className="flex items-center gap-3 mb-4 mt-2 bg-card border border-primary/20 rounded-xl px-4 py-3">
                                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-primary">Generating from your conversation...</span>
                            </div>
                        )}
                    </>
                )}

                {/* Quiz Mode */}
                {activeMode === "quiz" && quizQuestions[quizCurrent] && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <button onClick={backToChat} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" /> Back to Chat
                        </button>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Q{quizCurrent + 1} / {quizQuestions.length}</span>
                            <span className="text-[10px] font-black text-primary">Score: {quizScore}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${((quizCurrent + 1) / quizQuestions.length) * 100}%` }} />
                        </div>

                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <p className="text-sm font-bold text-foreground leading-relaxed">{quizQuestions[quizCurrent].question}</p>
                        </div>

                        <div className="space-y-2.5">
                            {quizQuestions[quizCurrent].options.map((opt, i) => {
                                const isCorrect = i === quizQuestions[quizCurrent].correct;
                                const isSelected = i === quizSelected;
                                let bg = "bg-card border-border hover:border-primary/30";
                                if (quizAnswered) {
                                    if (isCorrect) bg = "bg-green-50 border-green-500";
                                    else if (isSelected && !isCorrect) bg = "bg-red-50 border-red-500";
                                }
                                return (
                                    <button key={i} onClick={() => handleQuizAnswer(i)} disabled={quizAnswered}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${bg}`}>
                                        <span className="flex-1">{opt}</span>
                                        {quizAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        {quizAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {quizAnswered && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                                    <p className="text-[10px] font-black text-primary uppercase mb-1">Explanation</p>
                                    <p className="text-xs text-foreground leading-relaxed">{quizQuestions[quizCurrent].explanation}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {quizAnswered && (
                            <button onClick={nextQuizQuestion}
                                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                {quizCurrent + 1 >= quizQuestions.length ? "See Results" : "Next Question"} <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Flashcard Mode */}
                {activeMode === "flashcards" && flashcards.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <button onClick={backToChat} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4" /> Back to Chat
                        </button>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Card {flashCurrent + 1} of {flashcards.length}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full gradient-primary rounded-full" animate={{ width: `${((flashCurrent + 1) / flashcards.length) * 100}%` }} />
                        </div>

                        <div onClick={() => setFlashFlipped(f => !f)} className="cursor-pointer select-none" style={{ perspective: "1000px" }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${flashCurrent}-${flashFlipped}`}
                                    initial={{ rotateY: 90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: -90, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center text-center border-2 ${flashFlipped ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${flashFlipped ? "text-primary" : "text-muted-foreground"}`}>
                                        {flashFlipped ? "Answer" : "Question"}
                                    </span>
                                    <p className="text-base font-bold leading-relaxed text-foreground">
                                        {flashFlipped ? flashcards[flashCurrent].back : flashcards[flashCurrent].front}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground mt-4">Tap to {flashFlipped ? "see question" : "reveal answer"}</span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setFlashCurrent(c => Math.max(0, c - 1)); setFlashFlipped(false); }} disabled={flashCurrent === 0}
                                className="flex-1 bg-card border border-border py-3 rounded-xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button onClick={() => { setFlashCurrent(c => Math.min(flashcards.length - 1, c + 1)); setFlashFlipped(false); }} disabled={flashCurrent >= flashcards.length - 1}
                                className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all">
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex justify-center gap-1.5 flex-wrap">
                            {flashcards.map((_, i) => (
                                <button key={i} onClick={() => { setFlashCurrent(i); setFlashFlipped(false); }}
                                    className={`h-2 rounded-full transition-all ${i === flashCurrent ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20"}`} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input bar — always visible in chat mode */}
            {activeMode === "chat" && (
                <div className="fixed bottom-[74px] left-0 right-0 z-40 flex justify-center px-4">
                    <div className="w-full max-w-lg bg-background/95 backdrop-blur-2xl border border-border/40 rounded-[2rem] px-4 py-3 shadow-2xl safe-bottom">
                        <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask any topic or question..."
                                className="flex-1 rounded-2xl border border-border bg-muted/20 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                            <button type="submit" disabled={!input.trim() || isTyping}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-lg transition-all active:scale-90 disabled:opacity-40">
                                <Send className="h-5 w-5 fill-current" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsPage;
