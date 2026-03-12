import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import DomainCard from "@/components/DomainCard";
import EmptyState from "@/components/ui/EmptyState";
import { api } from "@/services/api";

const DomainsPage = () => {
    const [query, setQuery] = useState("");

    const { data: domains = [], isLoading } = useQuery({
        queryKey: ["domains"],
        queryFn: () => api.getDomains(),
    });

    const filtered = domains.filter(
        (d) =>
            d.name.toLowerCase().includes(query.toLowerCase()) ||
            d.description.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-28">
            <PageHeader title="Educational Domains" subtitle={isLoading ? "Loading..." : `${domains.length} learning paths`} />

            <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3 shadow-sm backdrop-blur-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filter domains..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton h-[140px] rounded-[2rem]" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((d, i) => (
                            <DomainCard key={d.id} domain={d} index={i} />
                        ))}
                    </div>
                ) : query ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                        <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No domains match "{query}"</p>
                    </motion.div>
                ) : (
                    <EmptyState
                        icon={LayoutGrid}
                        title="Database Empty"
                        message="No domains have been established in the Supabase backend yet."
                    />
                )}
            </div>
        </div>
    );
};

export default DomainsPage;
