export interface Domain {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface Subject {
    id: string;
    domainId: string;
    name: string;
    icon: string;
    color: string;
}

export interface Topic {
    id: string;
    subjectId: string;
    name: string;
    description: string;
}

export type ResourceType = "pdf" | "video" | "oer" | "notes" | "ppt";

export interface Resource {
    id: string;
    topicId: string;
    title: string;
    type: ResourceType;
    author: string;
    url: string;
    youtubeId?: string;
    rating: number;
    upvotes: number;
    createdAt: string;
    source?: string;
    description?: string;
    status: "pending" | "approved" | "rejected";
}
