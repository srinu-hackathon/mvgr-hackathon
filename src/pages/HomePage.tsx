import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Clock, GraduationCap, BrainCircuit, FileText, Zap, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import ResourceCard, { getBookmarks } from "@/components/ResourceCard";
import SkeletonCard from "@/components/SkeletonCard";
import { api } from "@/services/api";
import type { Resource } from "@/types";

const features = [
  {
    title: "Study Bot",
    desc: "Chat, learn, quiz yourself, make flashcards",
    icon: BrainCircuit,
    path: "/tools",
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Exam Mode",
    desc: "Submit syllabus → get PYQs & key topics",
    icon: GraduationCap,
    path: "/exam-mode",
    color: "bg-violet-50 text-violet-600"
  },
  {
    title: "Discovery",
    desc: "Search notes, PPTs, papers globally",
    icon: Search,
    path: "/search",
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    title: "Upload",
    desc: "Share notes with your college",
    icon: FileText,
    path: "/upload",
    color: "bg-amber-50 text-amber-600"
  },
];

const stats = [
  { label: "Academic APIs", value: "6+" },
  { label: "AI Models", value: "2" },
  { label: "Free", value: "100%" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Resource[]>([]);

  const { data: resources = [], isLoading: loadingResources } = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.getApprovedResources(),
  });

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const recentResources = [...resources]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="gradient-hero rounded-b-[2rem] px-5 pb-6 pt-8 shadow-premium relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Academic Resource Platform</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Study Sphere
            </h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md overflow-hidden border border-white/20">
            <img src="/favicon.png" className="h-full w-full object-cover" alt="Logo" />
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/search")}
          className="relative flex cursor-pointer items-center gap-3 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/25"
        >
          <Search className="h-4 w-4 text-white/70" />
          <span className="text-xs text-white/70 font-medium">Search notes, PPTs, videos, papers...</span>
          <span className="absolute right-3 rounded-lg bg-white/20 px-2.5 py-1 text-[9px] font-bold text-white uppercase backdrop-blur-sm">
            Search
          </span>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex justify-center gap-6"
        >
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="text-[9px] font-bold text-white/50 uppercase">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="space-y-7 p-4 pt-5">

        {/* AI Tools Grid */}
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">AI-Powered Tools</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.button
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(f.path)}
                  className="flex flex-col items-start bg-card rounded-xl p-3.5 border border-border hover:border-primary/30 hover:shadow-elevated transition-all active:scale-[0.97] text-left"
                >
                  <div className={`h-9 w-9 rounded-lg ${f.color} flex items-center justify-center mb-2.5`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{f.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </section>



        {/* Favourites & Bookmarks */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Favourites</h2>
            </div>
            <button onClick={() => navigate("/search")} className="text-[10px] font-bold text-primary">
              Explore More →
            </button>
          </div>
          <div className="space-y-3">
            {bookmarks.length > 0 ? (
              bookmarks.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate("/search")}
                className="cursor-pointer text-center py-10 bg-card rounded-2xl border border-dashed border-border hover:border-primary/30 transition-all"
              >
                <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs font-bold text-muted-foreground">No favourites yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Bookmark any resource to see it here</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-primary">
                  Start Discovering <ArrowRight className="h-3 w-3" />
                </span>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
