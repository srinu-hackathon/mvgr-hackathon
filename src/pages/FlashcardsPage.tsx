import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";

interface Flashcard {
    front: string;
    back: string;
}

const FlashcardsPage = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(10);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const generateCards = useCallback(async () => {
        if (!topic.trim()) return;
        setIsLoading(true);

        try {
            const prompt = `Create exactly ${count} flashcards about "${topic}" for studying.

Return ONLY a valid JSON array:
[{"front": "Question or term", "back": "Answer or definition"}]

Rules:
- ${count} cards exactly
- Front: concise question, term, or concept
- Back: clear, brief answer or definition (1-3 sentences max)
- Cover the most important aspects of the topic
- Return ONLY the JSON array`;

            const response = await generateExplanation(prompt);
            const jsonStr = response.replace(/```json|```/g, "").trim();
            const parsed: Flashcard[] = JSON.parse(jsonStr);
            setCards(parsed.slice(0, count));
            setCurrent(0);
            setFlipped(false);
        } catch (e) {
            console.error("Flashcard generation failed:", e);
        } finally {
            setIsLoading(false);
        }
    }, [topic, count]);

    const goNext = () => {
        if (current < cards.length - 1) {
            setCurrent(c => c + 1);
            setFlipped(false);
        }
    };

    const goPrev = () => {
        if (current > 0) {
            setCurrent(c => c - 1);
            setFlipped(false);
        }
    };

    const reset = () => {
        setCards([]);
        setCurrent(0);
        setFlipped(false);
    };

    return (
        <div className="min-h-screen pb-28">
            <PageHeader title="Flashcards" />
            <div className="p-4">

                <button onClick={() => navigate("/tools")} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-4 hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> Back to Tools
                </button>

                {/* SETUP */}
                {cards.length === 0 && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="text-center mb-2">
                            <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                                🃏
                            </div>
                            <h2 className="text-lg font-black">AI Flashcard Generator</h2>
                            <p className="text-xs text-muted-foreground mt-1">Enter any topic and get instant study flashcards</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topic</label>
                            <input
                                type="text"
                                placeholder="e.g. Organic Chemistry, Machine Learning, Contract Law..."
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && generateCards()}
                                className="mt-1.5 w-full bg-card rounded-xl px-4 py-3 text-sm font-medium text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Number of Cards</label>
                            <div className="flex gap-2 mt-1.5">
                                {[5, 10, 15, 20].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCount(c)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${count === c
                                            ? "gradient-primary text-primary-foreground shadow-md"
                                            : "bg-card text-muted-foreground border border-border"
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={generateCards}
                            disabled={!topic.trim()}
                            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Sparkles className="h-4 w-4" /> Generate Flashcards
                        </button>
                    </motion.div>
                )}

                {/* LOADING */}
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                        <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse">
                            Creating {count} flashcards about "{topic}"...
                        </p>
                    </motion.div>
                )}

                {/* FLASHCARD VIEW */}
                {cards.length > 0 && !isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        {/* Progress */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">
                                Card {current + 1} of {cards.length}
                            </span>
                            <button onClick={reset} className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <RotateCcw className="h-3 w-3" /> New Deck
                            </button>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full gradient-primary rounded-full"
                                animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
                            />
                        </div>

                        {/* The Card */}
                        <div
                            onClick={() => setFlipped(f => !f)}
                            className="cursor-pointer select-none"
                            style={{ perspective: "1000px" }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${current}-${flipped}`}
                                    initial={{ rotateY: 90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: -90, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center text-center border-2 ${flipped
                                            ? "bg-primary/5 border-primary/20"
                                            : "bg-card border-border"
                                        }`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${flipped ? "text-primary" : "text-muted-foreground"}`}>
                                        {flipped ? "Answer" : "Question"}
                                    </span>
                                    <p className={`text-base font-bold leading-relaxed ${flipped ? "text-foreground" : "text-foreground"}`}>
                                        {flipped ? cards[current].back : cards[current].front}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground mt-4">
                                        Tap to {flipped ? "see question" : "reveal answer"}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            <button
                                onClick={goPrev}
                                disabled={current === 0}
                                className="flex-1 bg-card border border-border py-3 rounded-xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={goNext}
                                disabled={current >= cards.length - 1}
                                className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Card dots indicator */}
                        <div className="flex justify-center gap-1.5 flex-wrap">
                            {cards.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setCurrent(i); setFlipped(false); }}
                                    className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20"}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FlashcardsPage;
