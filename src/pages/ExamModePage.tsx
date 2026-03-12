import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Loader2, Globe, ExternalLink, Sparkles, ChevronDown, ChevronUp, Copy, Check, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";

// Reuse SearXNG for real PYQ search
const SEARXNG_INSTANCES = [
    "https://search.sapti.me",
    "https://searx.be",
    "https://search.neet.works",
    "https://searx.tiekoetter.com",
    "https://search.bus-hit.me",
];

interface Source {
    title: string;
    url: string;
    domain: string;
}

interface TopicAnalysis {
    topic: string;
    importance: "HIGH" | "MEDIUM" | "LOW";
    explanation: string;
    sources: Source[];
    isExpanded?: boolean;
    deepExplanation?: string;
    isDeepLoading?: boolean;
}

type PageState = "input" | "analyzing" | "results";

const searchPYQs = async (topic: string): Promise<Source[]> => {
    const query = `${topic} previous year questions exam paper site:edu OR site:ac.in OR site:studocu.com`;
    for (const instance of SEARXNG_INSTANCES) {
        try {
            const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&language=en`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) continue;
            const data = await res.json();
            return (data.results || []).slice(0, 4).map((r: any) => ({
                title: r.title || "",
                url: r.url || "",
                domain: new URL(r.url || "https://example.com").hostname.replace("www.", ""),
            }));
        } catch { continue; }
    }
    // Fallback to DuckDuckGo
    try {
        const ddg = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(topic + " previous year questions exam")}&format=json&no_redirect=1`);
        const data = await ddg.json();
        const results: Source[] = [];
        if (data.AbstractURL) results.push({ title: data.Heading || topic, url: data.AbstractURL, domain: new URL(data.AbstractURL).hostname });
        (data.RelatedTopics || []).slice(0, 3).forEach((rt: any) => {
            if (rt.FirstURL) results.push({ title: rt.Text?.substring(0, 80) || "", url: rt.FirstURL, domain: new URL(rt.FirstURL).hostname });
        });
        return results;
    } catch { return []; }
};

const EXAMPLE_PROMPTS = [
    "Data Structures: Arrays, Linked Lists, Trees, Graphs, Sorting, Hashing",
    "Engineering Mathematics: Calculus, Linear Algebra, Probability, Differential Equations",
    "Operating Systems: Process Management, Memory, File Systems, Deadlocks",
    "Human Anatomy: Skeletal System, Muscular System, Nervous System, Cardiovascular",
];

const ExamModePage = () => {
    const [courseInput, setCourseInput] = useState("");
    const [state, setState] = useState<PageState>("input");
    const [topics, setTopics] = useState<TopicAnalysis[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state === "results") {
            resultsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [state]);

    const analyze = async (input?: string) => {
        const syllabus = input || courseInput;
        if (!syllabus.trim()) return;
        setState("analyzing");
        setTopics([]);

        try {
            // Step 1: Extract topics from course structure
            setProgress({ current: 0, total: 3, status: "Parsing your course structure..." });

            const extractPrompt = `From this course structure, extract the 5-6 most important exam topics:
"${syllabus}"

Return ONLY a JSON array of strings. Example: ["Topic 1", "Topic 2"]
Return ONLY the JSON array, nothing else.`;

            const topicsRaw = await generateExplanation(extractPrompt);
            const topicList: string[] = JSON.parse(topicsRaw.replace(/```json|```/g, "").trim());

            setProgress({ current: 1, total: 3, status: "AI is analyzing importance & generating explanations..." });

            // Step 2: Get AI analysis for each topic
            const analysisPrompt = `For each topic below, provide:
1. Importance level for exams (HIGH/MEDIUM/LOW)
2. A concise exam-focused explanation covering key definitions, formulas, and concepts (3-4 sentences)

Topics: ${topicList.join(", ")}

Return ONLY a JSON array:
[{"topic":"...","importance":"HIGH","explanation":"..."}]
ONLY JSON, no markdown.`;

            const analysisRaw = await generateExplanation(analysisPrompt);
            const analyses: { topic: string; importance: "HIGH" | "MEDIUM" | "LOW"; explanation: string }[] =
                JSON.parse(analysisRaw.replace(/```json|```/g, "").trim());

            setProgress({ current: 2, total: 3, status: "Searching for PYQs and real exam resources..." });

            // Step 3: Search for PYQs for each topic
            const results: TopicAnalysis[] = [];
            for (const a of analyses) {
                const sources = await searchPYQs(`${syllabus.split(",")[0]?.trim() || ""} ${a.topic}`);
                results.push({ ...a, sources, isExpanded: false });
            }

            // Sort by importance
            const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            results.sort((a, b) => order[a.importance] - order[b.importance]);

            setTopics(results);
            setProgress({ current: 3, total: 3, status: "Done!" });
            setState("results");

        } catch (e) {
            console.error("Exam analysis failed:", e);
            setState("input");
        }
    };

    const toggleExpand = (index: number) => {
        setTopics(prev => prev.map((t, i) => i === index ? { ...t, isExpanded: !t.isExpanded } : t));
    };

    const copyExplanation = (topic: string, text: string) => {
        navigator.clipboard.writeText(`${topic}\n\n${text}`);
        setCopiedId(topic);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateDeepExplanation = async (index: number) => {
        const topic = topics[index];
        if (topic.deepExplanation || topic.isDeepLoading) return;

        setTopics(prev => prev.map((t, i) => i === index ? { ...t, isDeepLoading: true } : t));

        try {
            const prompt = `Give a comprehensive, detailed academic explanation of "${topic.topic}".

Cover:
- **Definition** and core concepts
- **Key formulas** or principles (if applicable)
- **How it works** step by step
- **Real-world examples** or applications
- **Common exam questions** and how to approach them
- **Important points to remember** for exams

Make it thorough but clear. Use bullet points and bold text for key terms. This is for exam preparation.`;

            const response = await generateExplanation(prompt);
            setTopics(prev => prev.map((t, i) => i === index ? { ...t, deepExplanation: response, isDeepLoading: false } : t));
        } catch {
            setTopics(prev => prev.map((t, i) => i === index ? { ...t, isDeepLoading: false } : t));
        }
    };

    const importanceBadge = (level: string) => {
        const styles = {
            HIGH: "bg-red-50 text-red-600 border-red-200",
            MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
            LOW: "bg-green-50 text-green-600 border-green-200",
        };
        return styles[level as keyof typeof styles] || styles.MEDIUM;
    };

    return (
        <div className="min-h-screen pb-28" ref={resultsRef}>
            <PageHeader title="Exam Mode" subtitle="Course → PYQs & Analysis" />

            <div className="p-4">
                {/* INPUT */}
                {state === "input" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="text-center mb-2">
                            <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <GraduationCap className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-black">Exam Mode</h2>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                Paste your course structure or syllabus. AI will identify key topics, rank them by exam importance, find PYQs, and explain each one.
                            </p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course Structure / Syllabus</label>
                            <textarea
                                placeholder="e.g. Data Structures: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting Algorithms, Hashing..."
                                value={courseInput}
                                onChange={e => setCourseInput(e.target.value)}
                                rows={5}
                                className="mt-1.5 w-full bg-card rounded-xl px-4 py-3 text-sm font-medium text-foreground border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Example prompts */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Try an example</p>
                            <div className="space-y-1.5">
                                {EXAMPLE_PROMPTS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => { setCourseInput(p); analyze(p); }}
                                        className="w-full text-left text-[11px] font-medium px-3 py-2.5 rounded-lg bg-card border border-border hover:border-primary/30 hover:text-primary transition-all text-muted-foreground"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => analyze()}
                            disabled={!courseInput.trim()}
                            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Sparkles className="h-4 w-4" /> Analyze & Find PYQs
                        </button>
                    </motion.div>
                )}

                {/* ANALYZING */}
                {state === "analyzing" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 space-y-6">
                        <div className="text-center">
                            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                            <p className="mt-4 text-sm font-bold text-foreground">{progress.status}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">This may take a moment...</p>
                        </div>

                        {/* Progress steps */}
                        <div className="max-w-xs mx-auto space-y-3">
                            {["Parsing course structure", "AI analyzing importance", "Searching for PYQs"].map((step, i) => (
                                <div key={step} className="flex items-center gap-3">
                                    <div className={`h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold
                    ${i < progress.current ? "bg-green-100 text-green-600" : i === progress.current ? "bg-primary/10 text-primary animate-pulse" : "bg-muted text-muted-foreground"}`}>
                                        {i < progress.current ? "✓" : i + 1}
                                    </div>
                                    <span className={`text-xs font-medium ${i < progress.current ? "text-foreground" : i === progress.current ? "text-primary" : "text-muted-foreground"}`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* RESULTS — Perplexity Style */}
                {state === "results" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-foreground">Exam Analysis</h2>
                                <p className="text-[10px] text-muted-foreground">{topics.length} topics analyzed • Sources verified</p>
                            </div>
                            <button
                                onClick={() => { setState("input"); setTopics([]); }}
                                className="text-[10px] font-bold text-primary"
                            >
                                New Analysis
                            </button>
                        </div>

                        {/* Topic Cards */}
                        {topics.map((topic, i) => (
                            <motion.div
                                key={topic.topic}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="bg-card rounded-2xl border border-border overflow-hidden"
                            >
                                {/* Topic Header */}
                                <button
                                    onClick={() => toggleExpand(i)}
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded border ${importanceBadge(topic.importance)}`}>
                                        {topic.importance}
                                    </span>
                                    <span className="flex-1 text-sm font-bold text-foreground">{topic.topic}</span>
                                    {topic.isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                                </button>

                                {/* Expanded Content — Perplexity style */}
                                <AnimatePresence>
                                    {topic.isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                                                {/* AI Explanation */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Sparkles className="h-3 w-3 text-primary" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Explanation</span>
                                                        </div>
                                                        <button onClick={() => copyExplanation(topic.topic, topic.explanation)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                                            {copiedId === topic.topic ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-foreground leading-relaxed">{topic.explanation}</p>

                                                    {/* Deep Explain Button */}
                                                    {!topic.deepExplanation && !topic.isDeepLoading && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); generateDeepExplanation(i); }}
                                                            className="mt-3 flex items-center gap-2 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                                                        >
                                                            <Zap className="h-3.5 w-3.5" /> Deep AI Explanation
                                                        </button>
                                                    )}

                                                    {/* Deep Loading */}
                                                    {topic.isDeepLoading && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                                            <span className="text-[11px] font-bold text-primary animate-pulse">Generating deep explanation...</span>
                                                        </div>
                                                    )}

                                                    {/* Deep Explanation Output */}
                                                    {topic.deepExplanation && (
                                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Zap className="h-3 w-3 text-primary" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Deep Explanation</span>
                                                                </div>
                                                                <button onClick={() => copyExplanation(topic.topic + " (Deep)", topic.deepExplanation!)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                                                    {copiedId === topic.topic + " (Deep)" ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                                                                </button>
                                                            </div>
                                                            <div className="prose prose-sm max-w-none text-xs text-foreground leading-relaxed">
                                                                <ReactMarkdown
                                                                    components={{
                                                                        h3: (p) => <h3 className="text-xs font-bold mt-3 mb-1 text-primary" {...p} />,
                                                                        ul: (p) => <ul className="list-disc pl-4 space-y-0.5 my-1" {...p} />,
                                                                        strong: (p) => <strong className="font-bold text-foreground" {...p} />,
                                                                        code: (p) => <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono" {...p} />,
                                                                    }}
                                                                >
                                                                    {topic.deepExplanation}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Sources — Perplexity style */}
                                                {topic.sources.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Globe className="h-3 w-3 text-green-600" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                                                                Sources ({topic.sources.length})
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {topic.sources.map((src, si) => (
                                                                <a
                                                                    key={si}
                                                                    href={src.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
                                                                >
                                                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black shrink-0">
                                                                        {si + 1}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{src.title}</p>
                                                                        <p className="text-[9px] text-green-600 truncate">{src.domain}</p>
                                                                    </div>
                                                                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}

                        {/* Summary */}
                        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Study Priority</p>
                            <p className="text-xs text-foreground leading-relaxed">
                                Focus on <span className="font-bold text-red-600">{topics.filter(t => t.importance === "HIGH").length} high-priority</span> topics first,
                                then <span className="font-bold text-amber-600">{topics.filter(t => t.importance === "MEDIUM").length} medium</span>,
                                then <span className="font-bold text-green-600">{topics.filter(t => t.importance === "LOW").length} low</span>.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ExamModePage;
