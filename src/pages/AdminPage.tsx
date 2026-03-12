import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Play, FileText, Lock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { api } from "@/services/api";
import { toast } from "sonner";
import type { ResourceType } from "@/types";

const iconMap: Record<ResourceType, typeof Play> = {
    pdf: FileText,
    video: Play,
    notes: FileText,
    ppt: FileText,
    oer: Globe,
};

const AdminPage = () => {
    const queryClient = useQueryClient();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { data: pendingResources = [], isLoading } = useQuery({
        queryKey: ["pending"],
        queryFn: () => api.getPendingResources(),
        enabled: isAuthenticated,
    });

    const { data: subjects = [] } = useQuery({
        queryKey: ["subjects"],
        queryFn: () => api.getSubjects(),
        enabled: isAuthenticated,
    });

    const { data: topics = [] } = useQuery({
        queryKey: ["topics"],
        queryFn: () => api.getTopics(),
        enabled: isAuthenticated,
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => api.approveResource(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["pending"] });
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            toast.success("Resource approved & published", {
                description: `ID: ${id.slice(-6)} will now appear in the app.`,
            });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (id: string) => api.rejectResource(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["pending"] });
            toast.error("Resource rejected", {
                description: `ID: ${id.slice(-6)} has been removed.`,
            });
        },
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin123") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Invalid admin password");
            setPassword("");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen pb-28">
                <PageHeader title="Admin Portal" />
                <div className="flex flex-col items-center justify-center px-6 py-20">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card w-full max-w-sm rounded-[2rem] p-8 text-center"
                    >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive text-3xl">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-foreground">Restricted Access</h2>
                        <p className="mb-8 text-sm text-muted-foreground">Please enter the admin password to continue to the moderation panel.</p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl border-none bg-background px-4 py-3.5 text-center font-mono text-sm shadow-inner outline-none ring-1 ring-border focus:ring-2 focus:ring-destructive"
                                autoFocus
                            />
                            {error && <p className="text-xs font-bold text-destructive animate-fade-in">{error}</p>}
                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-destructive px-4 py-3.5 text-sm font-bold text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 active:scale-[0.98]"
                            >
                                Authenticate
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28">
            <PageHeader title="Moderation Queue" subtitle={`${pendingResources.length} items pending`} />

            <div className="p-4">
                {/* Banner */}
                <div className="glass-card mb-6 flex items-start gap-3 rounded-2xl border-amber-500/20 bg-amber-500/5 px-5 py-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-xs font-medium leading-relaxed text-foreground/80">
                        Review community uploads carefully. Ensure content meets academic standards and is correctly categorized before approving.
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                        <span className="text-2xl font-bold text-amber-500">{pendingResources.length}</span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending</span>
                    </div>
                    <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                        <span className="text-2xl font-bold text-green-500">24</span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Approved Today</span>
                    </div>
                </div>

                {/* Queue List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {isLoading ? (
                            <p className="text-center text-sm text-muted-foreground">Loading queue...</p>
                        ) : pendingResources.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Queue is clear!</h3>
                                <p className="mt-1 text-sm text-muted-foreground">All caught up on community submissions.</p>
                            </motion.div>
                        ) : (
                            pendingResources.map((resource) => {
                                const Icon = iconMap[resource.type] || FileText;
                                const _topic = topics.find(t => t.id === resource.topicId);
                                const _subject = subjects.find(s => s.id === _topic?.subjectId);

                                return (
                                    <motion.div
                                        key={resource.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                                        className="glass-card rounded-2xl p-4 shadow-sm"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                                                    {resource.title}
                                                </h3>
                                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground font-medium">
                                                    {_subject?.name} › {_topic?.name}
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                                                        {resource.type}
                                                    </span>
                                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                                                        By {resource.author}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                title="Reject"
                                                disabled={rejectMutation.isPending || approveMutation.isPending}
                                                onClick={() => rejectMutation.mutate(resource.id)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all active:scale-[0.98]"
                                            >
                                                <XCircle className="h-4 w-4" /> Reject
                                            </button>
                                            <button
                                                title="Approve"
                                                disabled={rejectMutation.isPending || approveMutation.isPending}
                                                onClick={() => approveMutation.mutate(resource.id)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-green-600 transition-all active:scale-[0.98]"
                                            >
                                                <Shield className="h-4 w-4" /> Approve
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
