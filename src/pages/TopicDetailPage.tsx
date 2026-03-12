import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Lightbulb, Globe, Play, FileText, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ResourceCard from "@/components/ResourceCard";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";

const aiExplanations: Record<string, { explanation: string; keyConcepts: string[] }> = {
  // Using generic mock AI explanations for the 3 default subjects just in case, but it mostly relies on the default one since dynamic topics can be anything.
  default: {
    explanation: "This topic covers foundational academic concepts. The resources here are curated and verified by the community to ensure high quality study material.",
    keyConcepts: ["Core definitions", "Key principles", "Practical applications", "Exam preparation"],
  }
};

type Tab = "all" | "video" | "oer";

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.getSubjects(),
  });

  const { data: resources = [], isLoading: loadingResources } = useQuery({
    queryKey: ["resources", topicId],
    queryFn: async () => {
      const all = await api.getApprovedResources();
      return all.filter(r => r.topicId === topicId).sort((a, b) => b.rating - a.rating || b.upvotes - a.upvotes);
    },
    enabled: !!topicId,
  });

  const topic = topics.find((t) => t.id === topicId);
  const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;

  if (!loadingTopics && !topic) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-24">
        <EmptyState
          icon={AlertCircle}
          title="Topic Not Found"
          message="The topic you are looking for does not exist."
          action={{ label: "Go Back", onClick: () => navigate(-1) }}
        />
      </div>
    );
  }

  const ai = aiExplanations[topicId || ""] || aiExplanations.default;

  const videoResources = resources.filter((r) => r.type === "video");
  const oerResources = resources.filter((r) => r.type === "oer");

  const displayed =
    activeTab === "video" ? videoResources :
      activeTab === "oer" ? oerResources :
        resources;

  const tabs: { id: Tab; label: string; icon: typeof Play; count: number }[] = [
    { id: "all", label: "All", icon: FileText, count: resources.length },
    { id: "video", label: "Videos", icon: Play, count: videoResources.length },
    { id: "oer", label: "OER", icon: Globe, count: oerResources.length },
  ];

  return (
    <div className="min-h-screen pb-28">
      {loadingTopics ? (
        <div className="px-5 pb-6 pt-10">
          <div className="skeleton mb-2 h-8 w-3/4 rounded-md" />
          <div className="skeleton h-4 w-1/3 rounded-md" />
        </div>
      ) : (
        <PageHeader
          title={topic?.name || ""}
          subtitle={subject ? `${subject.icon} ${subject.name}` : undefined}
          showBack
        />
      )}

      <div className="space-y-5 p-4">
        {/* AI Explanation */}
        {!loadingTopics && topic && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5 shadow-sm backdrop-blur-md"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm text-primary uppercase tracking-wide">AI Summary</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{topic.description || ai.explanation}</p>
          </motion.div>
        )}

        {/* Key Concepts */}
        {!loadingTopics && topic && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-[1.5rem] p-5 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-sm text-card-foreground uppercase tracking-wide">Study Focus</h2>
            </div>
            <ul className="space-y-2">
              {ai.keyConcepts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${activeTab === tab.id
                    ? "gradient-primary text-primary-foreground shadow-sm scale-100"
                    : "glass-card text-muted-foreground scale-95 opacity-80 hover:opacity-100"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resources List */}
        <section>
          <div className="space-y-3">
            {loadingResources ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : displayed.length > 0 ? (
              displayed.map((r, i) => (
                <ResourceCard key={r.id} resource={r} index={i} />
              ))
            ) : (
              <EmptyState
                icon={FileText}
                title={`No ${tabToName(activeTab)} added`}
                message="Be the first to upload a resource for this topic!"
                action={{ label: "Upload Resource", onClick: () => navigate("/upload") }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

function tabToName(tab: Tab) {
  if (tab === "video") return "Videos";
  if (tab === "oer") return "OER Links";
  return "Resources";
}

export default TopicDetailPage;
