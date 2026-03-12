import { Subject, Topic, Resource, Domain } from "@/types";
import { supabase, mockSupabaseFallback } from "./supabase";

/**
 * Universal Data Layer that attempts physical Supabase execution, 
 * but falls back gracefully to localStorage if Supabase keys aren't provided by user yet.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- LOCAL STORAGE FALLBACK LOGIC ---
const KEYS = {
    DOMAINS: "edu_domains",
    SUBJECTS: "edu_subjects",
    TOPICS: "edu_topics",
    RESOURCES: "edu_resources",
};

const getStored = <T>(key: string): T[] => {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : [];
};
const setStored = <T>(key: string, val: T[]) => localStorage.setItem(key, JSON.stringify(val));

const ensureFallbackSeeds = () => {
    if (getStored(KEYS.DOMAINS).length === 0) {
        setStored(KEYS.DOMAINS, [
            { id: "domain_1", name: "Medical Sciences", description: "Anatomy, Clinical", icon: "Stethoscope" },
            { id: "domain_2", name: "Engineering", description: "CS, Mechanical", icon: "Cpu" },
        ]);
    }
};
// -------------------------------------

export const api = {

    // DOMAINS
    getDomains: async (): Promise<Domain[]> => {
        if (mockSupabaseFallback) {
            ensureFallbackSeeds();
            await delay(400);
            return getStored<Domain>(KEYS.DOMAINS);
        }
        const { data, error } = await supabase.from("domains").select("*").order("created_at", { ascending: true });
        if (error) throw error;
        return data || [];
    },

    // SUBJECTS
    getSubjects: async (): Promise<Subject[]> => {
        if (mockSupabaseFallback) {
            await delay(400);
            return getStored<Subject>(KEYS.SUBJECTS);
        }
        const { data, error } = await supabase.from("subjects").select("*");
        if (error) throw error;
        return data || [];
    },

    getSubjectsByDomain: async (domainId: string): Promise<Subject[]> => {
        if (mockSupabaseFallback) {
            await delay(400);
            return getStored<Subject>(KEYS.SUBJECTS).filter((s) => s.domainId === domainId);
        }
        const { data, error } = await supabase.from("subjects").select("*").eq("domain_id", domainId);
        if (error) throw error;
        return data || [];
    },

    // TOPICS
    getTopics: async (): Promise<Topic[]> => {
        if (mockSupabaseFallback) {
            await delay(400);
            return getStored<Topic>(KEYS.TOPICS);
        }
        const { data, error } = await supabase.from("topics").select("*");
        if (error) throw error;
        return data || [];
    },

    getTopicsBySubject: async (subjectId: string): Promise<Topic[]> => {
        if (mockSupabaseFallback) {
            await delay(400);
            return getStored<Topic>(KEYS.TOPICS).filter((t) => t.subjectId === subjectId);
        }
        const { data, error } = await supabase.from("topics").select("*").eq("subject_id", subjectId);
        if (error) throw error;
        return data || [];
    },

    // RESOURCES
    getApprovedResources: async (): Promise<Resource[]> => {
        if (mockSupabaseFallback) {
            await delay(600);
            return getStored<Resource>(KEYS.RESOURCES).filter(r => r.status === "approved");
        }
        const { data, error } = await supabase.from("resources").select("*").eq("status", "approved");
        if (error) throw error;
        return data || [];
    },

    getPendingResources: async (): Promise<Resource[]> => {
        if (mockSupabaseFallback) {
            await delay(400);
            return getStored<Resource>(KEYS.RESOURCES).filter(r => r.status === "pending");
        }
        const { data, error } = await supabase.from("resources").select("*").eq("status", "pending");
        if (error) throw error;
        return data || [];
    },

    getResourcesByTopic: async (topicId: string): Promise<Resource[]> => {
        if (mockSupabaseFallback) {
            await delay(500);
            return getStored<Resource>(KEYS.RESOURCES).filter(
                (r) => r.topicId === topicId && r.status === "approved"
            );
        }
        const { data, error } = await supabase.from("resources").select("*").eq("topic_id", topicId).eq("status", "approved");
        if (error) throw error;
        return data || [];
    },

    // MUTATIONS
    uploadResource: async (r: Omit<Resource, "id" | "rating" | "upvotes" | "createdAt" | "status">): Promise<void> => {
        if (mockSupabaseFallback) {
            await delay(800);
            const res: Resource = {
                ...r,
                id: Math.random().toString(36).substr(2, 9),
                rating: 0,
                upvotes: 0,
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            const list = getStored<Resource>(KEYS.RESOURCES);
            setStored(KEYS.RESOURCES, [res, ...list]);
            return;
        }
        const { error } = await supabase.from("resources").insert([{
            topic_id: r.topicId,
            title: r.title,
            type: r.type,
            author: r.author,
            url: r.url,
            youtube_id: r.youtubeId,
            source: r.source,
            description: r.description,
            status: "pending",
            rating: 0,
            upvotes: 0
        }]);
        if (error) throw error;
    },

    approveResource: async (id: string): Promise<void> => {
        if (mockSupabaseFallback) {
            await delay(400);
            const list = getStored<Resource>(KEYS.RESOURCES);
            const updated = list.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r));
            setStored(KEYS.RESOURCES, updated);
            return;
        }
        const { error } = await supabase.from("resources").update({ status: "approved" }).eq("id", id);
        if (error) throw error;
    },

    rejectResource: async (id: string): Promise<void> => {
        if (mockSupabaseFallback) {
            await delay(400);
            const list = getStored<Resource>(KEYS.RESOURCES);
            const updated = list.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r));
            setStored(KEYS.RESOURCES, updated);
            return;
        }
        const { error } = await supabase.from("resources").update({ status: "rejected" }).eq("id", id);
        if (error) throw error;
    },

    upvoteResource: async (id: string): Promise<void> => {
        if (mockSupabaseFallback) {
            const list = getStored<Resource>(KEYS.RESOURCES);
            const updated = list.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
            setStored(KEYS.RESOURCES, updated);
            return;
        }
        // Very naive upvote using client-side calculation (in a real app, use an RPC or edge function in Supabase)
        const { data: current } = await supabase.from("resources").select("upvotes").eq("id", id).single();
        if (current) {
            const { error } = await supabase.from("resources").update({ upvotes: current.upvotes + 1 }).eq("id", id);
            if (error) throw error;
        }
    },
};
