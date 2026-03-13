import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, FolderSearch, Globe, Youtube, BookOpen, Sparkles, BookText, FileText, Zap, CheckCircle2, Loader2, User2, Send, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TopicCard from "@/components/TopicCard";
import ResourceCard from "@/components/ResourceCard";
import { api } from "@/services/api";
import { searchGlobalKnowledge, DiscoveryResult, getSearchSuggestions } from "@/services/discovery";
import { generateExplanation } from "@/services/ai";
import type { Resource, ResourceType } from "@/types";

type TypeFilter = "all" | ResourceType | "global";

// Helper to transform discovery results to standard resource type for UI
const mapDiscoveryToResource = (dr: DiscoveryResult): Resource => ({
  id: dr.id,
  title: dr.title,
  description: dr.description,
  url: dr.url,
  type: (dr.type === "link" ? "oer" : dr.type) as ResourceType,
  author: dr.author || dr.source || "External",
  source: dr.source,
  topicId: "", // Not applicable for external results
  rating: 0,
  upvotes: 0,
  status: "approved",
  createdAt: new Date().toISOString(),
});

const typeFilters: { id: TypeFilter; label: string; icon?: any }[] = [
  { id: "all", label: "All Local" },
  { id: "global", label: "Global Discovery", icon: Globe },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "notes", label: "Notes" },
  { id: "ppt", label: "PPT" },
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("global");
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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      const results = await getSearchSuggestions(query);
      setSuggestions(results);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Animate scanning dashboard steps
  useEffect(() => {
    if (!isDiscovering) { setScanStep(0); return; }
    // We removed the individual provider tags to make the UI simpler
    setScanStep(1);
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
      setTypeFilter(typeFilter === "global" ? "global" : typeFilter);
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

        <div className="relative" ref={searchContainerRef}>
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search any topic, subject, concept..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    handleDiscovery();
                    setShowSuggestions(false);
                  }
                }}
                className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button onClick={() => { setQuery(""); setSuggestions([]); setDiscoveryResults(null); setAiSummary(null); setTypeFilter("global"); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1"
                >
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                        handleDiscovery(suggestion);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors group"
                    >
                      <Search className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
                    if (!discoveryResults) handleDiscovery();
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
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      <span className="text-sm font-bold text-foreground">
                        Scanning Academic Databases...
                      </span>
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



              {/* Main Discovery Results */}
              {!isDiscovering && discoveryResults && (
                <div className="space-y-6 pb-10">

                  {/* Videos */}
                  {(typeFilter === "global" || typeFilter === "video") && discoveryResults.videos.length > 0 && (
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
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="text-[9px] font-bold text-red-500">{v.author}</div>
                                {v.stats && (
                                  <>
                                    <span className="text-[8px] text-muted-foreground/30">•</span>
                                    <div className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                                      <span>{v.stats.views} views</span>
                                    </div>
                                    {v.stats.likes !== "0" && (
                                      <>
                                        <span className="text-[8px] text-muted-foreground/30">•</span>
                                        <div className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                                          <span>{v.stats.likes} likes</span>
                                        </div>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"
                        className="mt-3 block w-full text-center py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                        View more videos on YouTube →
                      </a>
                    </section>
                  )}

                  {/* Verified Textbooks */}
                  {typeFilter === "global" && sortedDocs.textbooks.length > 0 && (
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
                  {(typeFilter === "global" || typeFilter === "ppt") && sortedDocs.ppts.length > 0 && (
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

                  {/* Scientific Results (arXiv + OpenAlex) */}
                  {(typeFilter === "global" || typeFilter === "pdf" || typeFilter === "notes") && (sortedDocs.pdfs.length > 0 || discoveryResults.research.length > 0) && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Papers & Preprints</h3>
                        <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">arXiv</span>
                      </div>
                      <div className="space-y-3">
                        {sortedDocs.pdfs.map((p, i) => (
                          <ResourceCard key={p.id} resource={mapDiscoveryToResource(p)} index={i} />
                        ))}
                        {discoveryResults.research.map((p, i) => (
                          <ResourceCard key={p.id} resource={mapDiscoveryToResource(p)} index={i} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Google-style Web Results */}
                  {typeFilter === "global" && discoveryResults.webResults && discoveryResults.webResults.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-5 w-5 text-green-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Web Results</h3>
                        <span className="ml-auto text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className="space-y-3">
                        {discoveryResults.webResults.map((r, i) => (
                          <ResourceCard key={r.id} resource={mapDiscoveryToResource(r)} index={i} />
                        ))}
                      </div>
                    </section>
                  )}

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
