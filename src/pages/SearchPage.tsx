import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, FolderSearch, Globe, Youtube, BookOpen, Sparkles, BookText, FileText, Zap, CheckCircle2, Loader2, User2, Send, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TopicCard from "@/components/TopicCard";
import ResourceCard from "@/components/ResourceCard";
import { api } from "@/services/api";
import { searchGlobalKnowledge, DiscoveryResult } from "@/services/discovery";
import { generateExplanation } from "@/services/ai";
import type { ResourceType } from "@/types";

type TypeFilter = "all" | ResourceType | "global";

const typeFilters: { id: TypeFilter; label: string; icon?: any }[] = [
  { id: "all", label: "All Local" },
  { id: "global", label: "Global Discovery", icon: Globe },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "notes", label: "Notes" },
  { id: "ppt", label: "PPT" },
];

const SCAN_PROVIDERS = [
  "MVGR College Bank",
  "NASA / arXiv Papers",
  "OpenAlex Database",
  "YouTube Education",
  "OpenStax Textbooks",
  "Google / Bing Web Search",
  "PDF & Document Search",
];

// Example context prompts to inspire users
const CONTEXT_EXAMPLES = [
  "2nd year MBBS student, need anatomy notes",
  "3rd year CSE student studying OS concepts",
  "Law student preparing for moot court",
  "Class 12 student preparing for JEE",
  "MBA student learning finance and accounting",
  "Self-learning Python for data science",
  "PhD researcher in computational biology",
  "12th grade student studying chemistry",
];

interface DiscoveryState {
  research: DiscoveryResult[];
  citations: DiscoveryResult[];
  videos: DiscoveryResult[];
  documents: DiscoveryResult[];
  textbooks?: DiscoveryResult[];
  webResults?: DiscoveryResult[];
}

interface ParsedContext {
  domain: string;
  level: string;
  need: string;
  enrichedQuery: string;
  suggestions: string[];
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryState | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Free-text context state
  const [contextText, setContextText] = useState("");
  const [showContextInput, setShowContextInput] = useState(false);
  const [parsedContext, setParsedContext] = useState<ParsedContext | null>(null);
  const [isParsingContext, setIsParsingContext] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const contextInputRef = useRef<HTMLInputElement>(null);

  // Animate scanning dashboard steps
  useEffect(() => {
    if (!isDiscovering) { setScanStep(0); return; }
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= SCAN_PROVIDERS.length) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [isDiscovering]);

  // Categorize documents from discovery results
  const sortedDocs = useMemo(() => {
    if (!discoveryResults) return { pdfs: [], ppts: [], textbooks: [] };
    const allDocs = discoveryResults.documents || [];
    return {
      pdfs: allDocs.filter(d => d.type === "pdf"),
      ppts: allDocs.filter(d => d.type === "ppt"),
      textbooks: (discoveryResults as any).textbooks || allDocs.filter(d => d.source === "OpenStax" || d.isVerified)
    };
  }, [discoveryResults]);

  const { data: topics = [] } = useQuery({ queryKey: ["topics"], queryFn: () => api.getTopics() });
  const { data: resources = [] } = useQuery({ queryKey: ["resources"], queryFn: () => api.getApprovedResources() });

  const q = query.toLowerCase().trim();

  // Parse free-text context with AI
  const handleParseContext = useCallback(async () => {
    if (!contextText.trim()) return;
    setIsParsingContext(true);
    try {
      const prompt = `A student says: "${contextText}"
      
      Parse this into a JSON object:
      {
        "domain": "their field of study (e.g., Medicine, Computer Science, Law)",
        "level": "their academic level (e.g., 2nd Year MBBS, Class 12, PhD)",
        "need": "what they're looking for (e.g., notes, videos, textbooks)",
        "enrichedQuery": "an optimized search query combining their context and typical search needs",
        "suggestions": ["5 specific topic suggestions relevant to their field and level"]
      }
      Return ONLY valid JSON.`;

      const response = await generateExplanation(prompt);
      const parsed: ParsedContext = JSON.parse(response.replace(/```json|```/g, "").trim());
      setParsedContext(parsed);
      setAiSuggestions(parsed.suggestions || []);
      setShowContextInput(false);
    } catch (e) {
      console.warn("Context parsing failed:", e);
    } finally {
      setIsParsingContext(false);
    }
  }, [contextText]);

  // Build contextually enriched search query
  const buildEnrichedQuery = useCallback((baseQuery: string) => {
    if (!parsedContext) return baseQuery;
    return `${baseQuery} ${parsedContext.domain} ${parsedContext.level} ${parsedContext.need}`.trim();
  }, [parsedContext]);

  const handleDiscovery = useCallback(async (overrideQuery?: string) => {
    const base = overrideQuery || query;
    const enriched = buildEnrichedQuery(base);
    if (!enriched.trim()) return;

    setIsDiscovering(true);
    setAiSummary(null);
    setDiscoveryResults(null);
    setShowContextInput(false);

    const contextNote = parsedContext
      ? `for a ${parsedContext.level} ${parsedContext.domain} student`
      : "";

    try {
      const [results, summary] = await Promise.all([
        searchGlobalKnowledge(enriched),
        generateExplanation(`Provide a 2-sentence academic summary of "${base}" ${contextNote}.`)
      ]);

      setDiscoveryResults(results as DiscoveryState);
      setAiSummary(summary);
      setTypeFilter("global");
    } catch (err) {
      console.error("Discovery Engine error:", err);
    } finally {
      setIsDiscovering(false);
    }
  }, [buildEnrichedQuery, query, parsedContext]);

  const localResults = useMemo(() => {
    if (!q) return { topics: [], resources: [] };
    const filteredTopics = topics.filter(t =>
      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
    let filteredResources = resources.filter(r =>
      r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
    );
    if (typeFilter !== "all" && typeFilter !== "global") {
      filteredResources = filteredResources.filter(r => r.type === typeFilter);
    }
    return { topics: filteredTopics, resources: filteredResources };
  }, [q, typeFilter, topics, resources]);

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Discovery" />
      <div className="p-4 space-y-3">

        {/* Main Search Box */}
        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search any topic, subject, concept..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDiscovery()}
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); setDiscoveryResults(null); setAiSummary(null); setTypeFilter("all"); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* "Who are you?" trigger */}
          <div
            onClick={() => { setShowContextInput(p => !p); setTimeout(() => contextInputRef.current?.focus(), 100); }}
            className="flex items-center gap-2 px-4 py-2 border-t border-border/50 cursor-pointer hover:bg-muted/20 transition-colors select-none"
          >
            <User2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-bold text-muted-foreground flex-1 truncate">
              {parsedContext
                ? `🎯 ${parsedContext.level} • ${parsedContext.domain}`
                : "Tell us about yourself for personalized results"}
            </span>
            {parsedContext && <div className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />}
            <span className="text-[10px] text-primary font-bold shrink-0">{showContextInput ? "Done" : "Edit"}</span>
          </div>
        </div>

        {/* Contextual "About Me" Text Input */}
        <AnimatePresence>
          {showContextInput && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-card border border-primary/20 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-black text-foreground">Who are you? Tell AI.</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Describe yourself in plain text. Any domain — engineering, medicine, law, arts, self-learning. The AI will tailor every search result for you.
              </p>

              <div className="flex gap-2">
                <input
                  ref={contextInputRef}
                  type="text"
                  placeholder="e.g. 2nd year MBBS student studying pharmacology..."
                  value={contextText}
                  onChange={e => setContextText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleParseContext()}
                  className="flex-1 bg-muted/30 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-all"
                />
                <button
                  onClick={handleParseContext}
                  disabled={!contextText.trim() || isParsingContext}
                  className="h-10 w-10 gradient-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isParsingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>

              {/* Context inspiration examples */}
              <div className="mt-3">
                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Try these examples:</p>
                <div className="flex flex-wrap gap-1.5">
                  {CONTEXT_EXAMPLES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => setContextText(ex)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parsed Context Card */}
        <AnimatePresence>
          {parsedContext && !showContextInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground">{parsedContext.level} • {parsedContext.domain}</p>
                    <p className="text-[10px] text-muted-foreground">Looking for: {parsedContext.need}</p>
                  </div>
                </div>
                <button onClick={() => setParsedContext(null)} className="text-muted-foreground/50 hover:text-muted-foreground mt-0.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* AI topic suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">AI suggests for you:</p>
                  <div className="flex flex-col gap-1.5">
                    {aiSuggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); handleDiscovery(s); }}
                        className="flex items-center justify-between w-full text-left text-xs font-bold text-foreground bg-card px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                      >
                        {s}
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Action Button */}
        {query && !showContextInput && (
          <button
            onClick={() => handleDiscovery()}
            disabled={!q || isDiscovering}
            className="w-full gradient-primary text-primary-foreground py-3 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isDiscovering
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
              : <><Zap className="h-4 w-4" /> {parsedContext ? `Search as ${parsedContext.level}` : "Discover Knowledge"}</>
            }
          </button>
        )}

        {/* Category Filters */}
        {q && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {typeFilters.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setTypeFilter(f.id);
                    if (f.id !== "all" && !discoveryResults) handleDiscovery();
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${typeFilter === f.id
                    ? "gradient-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground border border-border"
                    }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!q && !showContextInput ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center px-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/5 text-primary">
                <Sparkles className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-bold">Personalized for You</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Tell us who you are — medical student, law scholar, self-learner. AI will tailor the entire world's knowledge to your level.
              </p>
              <button
                onClick={() => { setShowContextInput(true); setTimeout(() => contextInputRef.current?.focus(), 100); }}
                className="mt-5 inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <User2 className="h-4 w-4" /> Tell AI About You
              </button>
            </motion.div>
          ) : q ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Live Scanning Dashboard */}
              <AnimatePresence>
                {isDiscovering && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-2xl bg-card border border-primary/20 p-4 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-black text-primary uppercase tracking-widest">
                        Live Scan {parsedContext && `— ${parsedContext.level}`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {SCAN_PROVIDERS.map((p, i) => (
                        <div key={p} className="flex items-center gap-3">
                          <div className={`h-5 w-5 flex items-center justify-center ${i < scanStep ? "text-green-500" : i === scanStep ? "text-primary animate-pulse" : "text-muted-foreground/30"}`}>
                            {i < scanStep ? <CheckCircle2 className="h-4 w-4" />
                              : i === scanStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <div className="h-3 w-3 rounded-full border border-current" />}
                          </div>
                          <span className={`text-xs font-bold ${i < scanStep ? "text-foreground" : i === scanStep ? "text-primary" : "text-muted-foreground/40"}`}>
                            {p}
                          </span>
                          {i < scanStep && <span className="text-[10px] text-green-500 font-bold ml-auto">Done</span>}
                          {i === scanStep && <span className="text-[10px] text-primary font-bold ml-auto animate-pulse">Scanning...</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Personalized context badge */}
              {parsedContext && !isDiscovering && discoveryResults && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
                  <User2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs font-bold text-primary flex-1">
                    Personalized for <span className="font-black">{parsedContext.level}</span> — {parsedContext.domain}
                  </p>
                </motion.div>
              )}

              {/* AI Summary */}
              {aiSummary && typeFilter === "global" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Briefing</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">{aiSummary}</p>
                </motion.div>
              )}

              {/* Local College Results */}
              {typeFilter !== "global" && (
                <>
                  {localResults.topics.length > 0 && (
                    <section>
                      <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">College Topics</h3>
                      <div className="space-y-2">{localResults.topics.map((t, i) => <TopicCard key={t.id} topic={t} index={i} />)}</div>
                    </section>
                  )}
                  {localResults.resources.length > 0 && (
                    <section>
                      <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verified College Files</h3>
                      <div className="space-y-3">{localResults.resources.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}</div>
                    </section>
                  )}
                  {localResults.topics.length === 0 && localResults.resources.length === 0 && !isDiscovering && (
                    <div className="py-12 text-center animate-in fade-in">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                        <FolderSearch className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No matching local resources.</p>
                      <button
                        onClick={() => { setTypeFilter("global"); handleDiscovery(); }}
                        className="mt-4 inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
                      >
                        <Globe className="h-3.5 w-3.5" /> Explore Global Knowledge →
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Enterprise Discovery Results */}
              {typeFilter === "global" && !isDiscovering && discoveryResults && (
                <div className="space-y-6 pb-10">

                  {/* Videos */}
                  {discoveryResults.videos.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Video Lectures</h3>
                        <span className="ml-auto text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">YouTube</span>
                      </div>
                      <div className="space-y-3">
                        {discoveryResults.videos.map(v => (
                          <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                            className="flex gap-3 bg-card rounded-xl p-2.5 border border-border hover:border-red-500/20 hover:shadow-md transition-all">
                            <div className="h-16 w-28 shrink-0 bg-muted rounded-lg overflow-hidden relative">
                              {v.thumbnail && <img src={v.thumbnail} className="h-full w-full object-cover" alt="" />}
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Youtube className="h-6 w-6 text-white drop-shadow-lg" />
                              </div>
                            </div>
                            <div className="min-w-0 py-1">
                              <h4 className="text-sm font-bold text-foreground line-clamp-1">{v.title}</h4>
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
                              <div className="text-[9px] font-bold text-red-500 mt-1.5">{v.author}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Verified Textbooks */}
                  {sortedDocs.textbooks.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <BookText className="h-5 w-5 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Verified Textbooks</h3>
                        <span className="ml-auto text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">OpenStax</span>
                      </div>
                      <div className="space-y-2">
                        {sortedDocs.textbooks.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 bg-primary/5 rounded-xl px-4 py-3 border border-primary/15 hover:border-primary/40 transition-all">
                            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                              <BookText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{p.title}</h4>
                              <p className="text-[10px] text-muted-foreground">{p.author} • Peer Reviewed</p>
                            </div>
                            <span className="text-[9px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded-full shrink-0 ml-auto">FREE</span>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* PPT Slides */}
                  {sortedDocs.ppts.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-orange-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lecture Slide Decks</h3>
                      </div>
                      <div className="space-y-2">
                        {sortedDocs.ppts.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border hover:border-orange-500/30 transition-all">
                            <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] font-black shrink-0">PPT</div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground line-clamp-1">{p.title}</h4>
                              <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* PDF Notes & Research Papers */}
                  {(sortedDocs.pdfs.length > 0 || discoveryResults.research.length > 0) && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes & Research Papers</h3>
                        <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">arXiv</span>
                      </div>
                      <div className="space-y-2.5">
                        {sortedDocs.pdfs.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
                            className="block bg-card rounded-xl p-4 border border-border hover:border-blue-500/20 transition-all">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <h4 className="text-sm font-bold text-foreground line-clamp-1">{p.title}</h4>
                              <div className="h-6 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-[9px] font-black shrink-0">PDF</div>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                            <div className="flex justify-between mt-2 pt-2 border-t border-border/50 text-[10px]">
                              <span className="font-bold text-muted-foreground italic truncate">{p.author}</span>
                              <span className="text-primary font-bold ml-2">Open →</span>
                            </div>
                          </a>
                        ))}
                        {discoveryResults.research.map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border hover:border-primary/20 transition-all">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px] font-black shrink-0">PAPER</div>
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-bold text-foreground line-clamp-1">{p.title}</h4>
                              <p className="text-[9px] text-muted-foreground">{p.author} • {p.year}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Google-style Web Results */}
                  {discoveryResults.webResults && discoveryResults.webResults.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-5 w-5 text-green-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Web Results</h3>
                        <span className="ml-auto text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className="space-y-3">
                        {discoveryResults.webResults.map(r => (
                          <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                            className="block bg-card rounded-xl px-4 py-3.5 border border-border hover:border-primary/20 hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px] text-green-600 font-medium truncate">{r.source}</span>
                              {r.isVerified && (
                                <span className="text-[8px] bg-green-100 text-green-700 font-black px-1.5 py-0.5 rounded uppercase">.EDU</span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-blue-600 group-hover:underline line-clamp-1 mb-1">{r.title}</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Deep Search Shortcuts */}
                  <div className="pt-6 border-t border-border/50">
                    <div className="bg-gradient-to-br from-primary/5 to-card rounded-2xl p-5 border border-primary/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <div>
                          <h3 className="text-sm font-black text-foreground">Deep Search Shortcuts</h3>
                          <p className="text-[10px] text-muted-foreground">Expert-filtered access to elite repositories</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "NPTEL / India Edu", sublabel: "Govt. Verified Notes", color: "text-primary", href: `https://www.google.com/search?q=site:nptel.ac.in+${encodeURIComponent(q)}+filetype:pdf` },
                          { label: "MIT / Stanford", sublabel: "Ivy League Courseware", color: "text-red-600", href: `https://www.google.com/search?q=site:ocw.mit.edu+OR+site:stanford.edu+${encodeURIComponent(q)}+filetype:pdf` },
                          { label: "SlideShare", sublabel: "Visual Slide Decks", color: "text-blue-600", href: `https://www.slideshare.net/search?q=${encodeURIComponent(q)}` },
                          { label: "Direct PDFs", sublabel: "Lecture Notes", color: "text-green-600", href: `https://www.google.com/search?q=${encodeURIComponent(q)}+"lecture+notes"+filetype:pdf` },
                        ].map(sh => (
                          <a key={sh.label} href={sh.href} target="_blank" rel="noreferrer"
                            className="flex flex-col gap-0.5 bg-card p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95">
                            <div className={`text-[10px] font-black uppercase ${sh.color}`}>{sh.label}</div>
                            <div className="text-[10px] font-bold text-foreground">{sh.sublabel}</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPage;
