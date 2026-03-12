import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";

interface Question {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

type QuizState = "setup" | "loading" | "playing" | "result";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const COUNTS = [5, 10, 15];

const QuizPage = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [count, setCount] = useState(5);
    const [state, setState] = useState<QuizState>("setup");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);

    const generateQuiz = useCallback(async () => {
        if (!topic.trim()) return;
        setState("loading");

        try {
            const prompt = `Generate exactly ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array, no markdown:
[{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": 0,
  "explanation": "Brief explanation of the correct answer"
}]

Rules:
- ${count} questions exactly
- 4 options each labeled A), B), C), D)
- "correct" is the 0-based index of the right answer
- Make questions educational and clear
- Return ONLY the JSON array`;

            const response = await generateExplanation(prompt);
            const jsonStr = response.replace(/```json|```/g, "").trim();
            const parsed: Question[] = JSON.parse(jsonStr);
            setQuestions(parsed.slice(0, count));
            setCurrent(0);
            setScore(0);
            setSelected(null);
            setAnswered(false);
            setState("playing");
        } catch (e) {
            console.error("Quiz generation failed:", e);
            setState("setup");
        }
    }, [topic, difficulty, count]);

    const handleAnswer = (index: number) => {
        if (answered) return;
        setSelected(index);
        setAnswered(true);
        if (index === questions[current].correct) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (current + 1 >= questions.length) {
            setState("result");
        } else {
            setCurrent(c => c + 1);
            setSelected(null);
            setAnswered(false);
        }
    };

    const resetQuiz = () => {
        setState("setup");
        setQuestions([]);
        setCurrent(0);
        setScore(0);
        setSelected(null);
        setAnswered(false);
    };

    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
        <div className="min-h-screen pb-28">
            <PageHeader title="AI Quiz" />
            <div className="p-4">

                {/* Back button */}
                <button onClick={() => navigate("/tools")} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-4 hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> Back to Tools
                </button>

                {/* SETUP */}
                {state === "setup" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="text-center mb-2">
                            <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-lg font-black">AI Quiz Generator</h2>
                            <p className="text-xs text-muted-foreground mt-1">Enter any topic and AI will create a custom quiz for you</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topic</label>
                            <input
                                type="text"
                                placeholder="e.g. Linked Lists, Human Anatomy, Civil Law..."
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && generateQuiz()}
                                className="mt-1.5 w-full bg-card rounded-xl px-4 py-3 text-sm font-medium text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Difficulty</label>
                            <div className="flex gap-2 mt-1.5">
                                {DIFFICULTIES.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${difficulty === d
                                            ? "gradient-primary text-primary-foreground shadow-md"
                                            : "bg-card text-muted-foreground border border-border"
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Number of Questions</label>
                            <div className="flex gap-2 mt-1.5">
                                {COUNTS.map(c => (
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
                            onClick={generateQuiz}
                            disabled={!topic.trim()}
                            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Sparkles className="h-4 w-4" /> Generate Quiz
                        </button>
                    </motion.div>
                )}

                {/* LOADING */}
                {state === "loading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                        <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse">
                            AI is crafting {count} questions about "{topic}"...
                        </p>
                    </motion.div>
                )}

                {/* PLAYING */}
                {state === "playing" && questions[current] && (
                    <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Question {current + 1} / {questions.length}</span>
                            <span className="text-[10px] font-black text-primary">Score: {score}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full gradient-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question */}
                        <div className="bg-card rounded-2xl p-5 border border-border">
                            <p className="text-sm font-bold text-foreground leading-relaxed">{questions[current].question}</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5">
                            {questions[current].options.map((opt, i) => {
                                const isCorrect = i === questions[current].correct;
                                const isSelected = i === selected;
                                let bg = "bg-card border-border hover:border-primary/30";
                                if (answered) {
                                    if (isCorrect) bg = "bg-green-50 border-green-500 dark:bg-green-950";
                                    else if (isSelected && !isCorrect) bg = "bg-red-50 border-red-500 dark:bg-red-950";
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={answered}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${bg}`}
                                    >
                                        <span className="flex-1">{opt}</span>
                                        {answered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        {answered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        <AnimatePresence>
                            {answered && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                                    <p className="text-[10px] font-black text-primary uppercase mb-1">Explanation</p>
                                    <p className="text-xs text-foreground leading-relaxed">{questions[current].explanation}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {answered && (
                            <button
                                onClick={nextQuestion}
                                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                {current + 1 >= questions.length ? "See Results" : "Next Question"} <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                    </motion.div>
                )}

                {/* RESULTS */}
                {state === "result" && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <Trophy className={`h-10 w-10 ${pct >= 70 ? "text-yellow-500" : "text-primary"}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">{pct}%</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                You got <span className="font-bold text-foreground">{score}</span> out of <span className="font-bold text-foreground">{questions.length}</span> correct
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {pct >= 90 ? "Outstanding! You've mastered this topic! 🌟" :
                                    pct >= 70 ? "Great job! Keep it up! 💪" :
                                        pct >= 50 ? "Good effort! Review the tricky ones. 📖" :
                                            "Keep studying! You'll get there. 🎯"}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={resetQuiz} className="flex-1 bg-card border border-border py-3 rounded-xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <RotateCcw className="h-4 w-4" /> New Quiz
                            </button>
                            <button onClick={() => { resetQuiz(); generateQuiz(); }} className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <Sparkles className="h-4 w-4" /> Retry
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
