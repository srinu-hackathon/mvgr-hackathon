import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/PageHeader";
import { generateExplanation } from "@/services/ai";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Explain the mechanics of Binary Trees.",
  "Provide a concise summary of Photosynthesis.",
  "Compare Merge Sort and Quick Sort algorithms.",
  "Detail Newton's Laws of Motion.",
  "Summarize the fundamentals of Linear Algebra.",
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const aiResponseContent = await generateExplanation(text);

    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: aiResponseContent },
    ]);
    setIsTyping(false);
  };

  return (
    <div className="flex min-h-screen flex-col pb-40">
      <PageHeader title="AI Assistant" subtitle="Academic Companion" />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] gradient-primary shadow-lg shadow-primary/20">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="font-bold text-xl text-foreground tracking-tight">How can I help you today?</h2>
            <p className="mt-2 text-sm text-muted-foreground px-8">Submit any academic topic to generate professional notes and explanations.</p>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 -mx-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="whitespace-nowrap rounded-full border border-border bg-card/50 backdrop-blur-sm px-5 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary active:scale-95 shadow-sm shrink-0 border-primary/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
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
              <div
                className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-none"
                  : "bg-card border border-border/50 text-card-foreground rounded-bl-none"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        table: (p) => <div className="my-3 overflow-x-auto rounded-lg border border-border"><table className="w-full text-xs border-collapse" {...p} /></div>,
                        th: (p) => <th className="border-b border-border px-3 py-2 bg-muted/50 font-bold text-left" {...p} />,
                        td: (p) => <td className="border-b border-border px-3 py-2" {...p} />,
                        code: (p) => <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono border border-border/50" {...p} />,
                        blockquote: (p) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2" {...p} />,
                        h3: (p) => <h3 className="text-sm font-bold mt-4 mb-2 text-primary" {...p} />,
                        ul: (p) => <ul className="list-disc pl-4 space-y-1 my-2" {...p} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Verified AI Note</span>
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
      </div>

      <div className="fixed bottom-[74px] left-0 right-0 z-40 flex justify-center px-4">
        <div className="w-full max-w-lg bg-background/95 backdrop-blur-2xl border border-border/40 rounded-[2rem] px-4 py-3 shadow-2xl safe-bottom">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your query..."
                className="w-full rounded-2xl border border-border bg-muted/20 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-90 disabled:opacity-40 disabled:grayscale disabled:scale-100"
            >
              <Send className="h-5 w-5 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
