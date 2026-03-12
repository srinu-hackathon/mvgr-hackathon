import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Search, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import SubjectCard from "@/components/SubjectCard";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";

const SubjectsPage = () => {
  const { domainId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: domain } = useQuery({
    queryKey: ["domain", domainId],
    queryFn: async () => {
      const domains = await api.getDomains();
      return domains.find((d) => d.id === domainId);
    },
    enabled: !!domainId,
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects", domainId],
    queryFn: () => api.getSubjectsByDomain(domainId as string),
    enabled: !!domainId,
  });

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.icon.includes(query)
  );

  return (
    <div className="min-h-screen pb-28">
      {/* Custom Header overlay with Back button */}
      <div className="gradient-primary rounded-b-[2.5rem] px-5 pb-6 pt-10 shadow-elevated">
        <button onClick={() => navigate("/domains")} className="mb-4 flex items-center gap-2 text-primary-foreground/80 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Domains</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">{domain ? domain.name : "Subjects"}</h1>
        <p className="mt-1 text-sm font-medium text-white/80">
          {isLoading ? "Loading..." : `${subjects.length} subjects in this domain`}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search within subjects */}
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3 shadow-sm backdrop-blur-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Filter ${domain?.name || 'subjects'}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Subject Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[140px] rounded-[2rem]" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((s, i) => (
              <SubjectCard key={s.id} subject={s} index={i} />
            ))}
          </div>
        ) : query ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No subjects match "{query}"</p>
          </motion.div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Subjects Found"
            message={`No subjects have been established in ${domain?.name} yet.`}
          />
        )}
      </div>
    </div>
  );
};

export default SubjectsPage;
