import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import TopicCard from "@/components/TopicCard";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";

const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.getSubjects(),
  });

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => api.getTopicsBySubject(subjectId!),
    enabled: !!subjectId,
  });

  const subject = subjects.find((s) => s.id === subjectId);

  if (!loadingSubjects && !subject) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-24">
        <EmptyState
          icon={AlertCircle}
          title="Subject Not Found"
          message="The subject you are looking for does not exist."
          action={{ label: "Go Back", onClick: () => navigate(-1) }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Subject Hero */}
      <div
        className="px-5 pb-6 pt-10 shadow-elevated relative overflow-hidden transition-all duration-500"
        style={subject ? { background: `linear-gradient(135deg, hsl(${subject.color}), hsl(${subject.color} / 0.7))` } : {}}
      >
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />

        <button
          onClick={() => navigate(-1)}
          className="relative mb-4 flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white"
        >
          ← Back
        </button>

        <div className="relative flex items-center gap-4">
          {loadingSubjects ? (
            <div className="skeleton h-16 w-16 rounded-2xl bg-white/20" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm shadow-card">
              {subject?.icon}
            </span>
          )}

          <div className="flex-1">
            {loadingSubjects ? (
              <>
                <div className="skeleton mb-2 h-6 w-3/4 rounded bg-white/20" />
                <div className="skeleton h-4 w-1/2 rounded bg-white/20" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">{subject?.name}</h1>
                <p className="text-sm font-medium text-white/80">
                  {topics.length} topics mapped
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 mt-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          All Topics
        </motion.p>

        {loadingTopics ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((t, i) => (
              <TopicCard key={t.id} topic={t} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Topics Yet"
            message={`There are no specific topics added for ${subject?.name || "this subject"}.`}
          />
        )}
      </div>
    </div>
  );
};

export default SubjectDetailPage;
