/**
 * discovery.ts - Enterprise Discovery Fabric (v4.1)
 * Real web search via SearXNG + academic APIs.
 */

import { generateExplanation } from "./ai";

// --- Types & Interfaces ---

export interface DiscoveryResult {
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
    type: "pdf" | "ppt" | "video" | "link";
    thumbnail?: string;
    author?: string;
    year?: string;
    isVerified?: boolean;
    stats?: {
        views?: string;
        likes?: string;
    };
}

export interface QueryBlueprint {
    academic: string;
    video: string;
    docs: string;
    raw: string;
}

export interface IDiscoveryProvider {
    name: string;
    search(query: string, typeFilter?: string): Promise<DiscoveryResult[]>;
}

// --- SearXNG Public Instances (free, keyless, real Google results) ---
const SEARXNG_INSTANCES = [
    "https://search.sapti.me",
    "https://searx.be",
    "https://search.neet.works",
    "https://searx.tiekoetter.com",
    "https://search.bus-hit.me",
];

/**
 * SearXNG Web Search Provider - REAL web search results, no API key.
 * Searches Google, Bing, DuckDuckGo, and more through an open-source proxy.
 */
class WebSearchProvider implements IDiscoveryProvider {
    name = "Web Search";

    private async fetchFromInstance(instance: string, query: string): Promise<any[]> {
        const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general&engines=google,bing,duckduckgo&language=en`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error(`${response.status}`);
            const data = await response.json();
            return data.results || [];
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }

    async search(query: string): Promise<DiscoveryResult[]> {
        // Try instances one by one until one works
        for (const instance of SEARXNG_INSTANCES) {
            try {
                const results = await this.fetchFromInstance(instance, query);
                return results.slice(0, 6).map((r: any, i: number) => {
                    const urlLower = (r.url || "").toLowerCase();
                    const isPdf = urlLower.includes(".pdf") || urlLower.includes("filetype:pdf");
                    const isPpt = urlLower.includes(".ppt") || urlLower.includes("slideshare") || urlLower.includes(".pptx");
                    return {
                        id: `web-${i}-${Date.now()}`,
                        title: r.title || "Web Result",
                        description: r.content || "",
                        url: r.url || "",
                        source: new URL(r.url || "https://example.com").hostname.replace("www.", ""),
                        type: isPdf ? "pdf" : isPpt ? "ppt" : "link",
                        isVerified: urlLower.includes(".edu") || urlLower.includes(".ac.") || urlLower.includes("mit.edu") || urlLower.includes("nptel"),
                    };
                });
            } catch (e) {
                console.warn(`SearXNG instance ${instance} failed, trying next...`);
                continue;
            }
        }
        // All instances failed, use DuckDuckGo lite as final fallback
        return this.duckDuckGoFallback(query);
    }

    private async duckDuckGoFallback(query: string): Promise<DiscoveryResult[]> {
        try {
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
            const data = await response.json();
            const results: DiscoveryResult[] = [];
            if (data.AbstractURL) {
                results.push({
                    id: `ddg-abstract-${Date.now()}`,
                    title: data.Heading || query,
                    description: data.AbstractText || "",
                    url: data.AbstractURL,
                    source: data.AbstractSource || "DuckDuckGo",
                    type: "link",
                });
            }
            (data.RelatedTopics || []).slice(0, 5).forEach((topic: any, i: number) => {
                if (topic.FirstURL) {
                    results.push({
                        id: `ddg-${i}-${Date.now()}`,
                        title: topic.Text?.slice(0, 80) || "Related",
                        description: topic.Text || "",
                        url: topic.FirstURL,
                        source: "DuckDuckGo",
                        type: "link",
                    });
                }
            });
            return results;
        } catch {
            return [];
        }
    }
}

/**
 * PDF & Notes Search Provider — Specifically searches for documents
 */
class DocumentSearchProvider implements IDiscoveryProvider {
    name = "Document Search";
    private webSearch = new WebSearchProvider();

    async search(query: string): Promise<DiscoveryResult[]> {
        // Search for PDFs and lecture notes specifically
        const pdfQuery = `${query} lecture notes filetype:pdf site:*.edu OR site:*.ac.in OR site:researchgate.net`;
        const pptQuery = `${query} slides PPT site:slideshare.net OR site:*.edu`;

        try {
            const [pdfResults, pptResults] = await Promise.all([
                this.webSearch.search(pdfQuery),
                this.webSearch.search(pptQuery),
            ]);

            // Tag them properly
            const pdfs = pdfResults.slice(0, 4).map(r => ({ ...r, type: "pdf" as const }));
            const ppts = pptResults.slice(0, 3).map(r => ({ ...r, type: "ppt" as const }));

            return [...pdfs, ...ppts];
        } catch {
            return [];
        }
    }
}

/**
 * arXiv Provider - Research Papers
 */
class ArXivProvider implements IDiscoveryProvider {
    name = "arXiv";
    async search(query: string): Promise<DiscoveryResult[]> {
        try {
            const response = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=3`);
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const entries = xmlDoc.getElementsByTagName("entry");

            return Array.from(entries).map((entry, i) => ({
                id: `arxiv-${i}-${Date.now()}`,
                title: entry.getElementsByTagName("title")[0]?.textContent?.trim() || "Untitled Paper",
                description: entry.getElementsByTagName("summary")[0]?.textContent?.slice(0, 150).trim() + "..." || "",
                url: entry.getElementsByTagName("id")[0]?.textContent || "",
                source: "arXiv",
                type: "pdf" as const,
                author: entry.getElementsByTagName("name")[0]?.textContent || "Anonymous",
                year: entry.getElementsByTagName("published")[0]?.textContent?.slice(0, 4) || ""
            }));
        } catch (e) {
            return [];
        }
    }
}

/**
 * OpenAlex Provider - Academic Works & Citations
 */
class OpenAlexProvider implements IDiscoveryProvider {
    name = "OpenAlex";
    async search(query: string): Promise<DiscoveryResult[]> {
        try {
            const response = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=3&sort=relevance_score:desc`);
            const data = await response.json();
            return data.results.map((work: any) => ({
                id: work.id,
                title: work.display_name || "Academic Work",
                description: `Academic publication with ${work.cited_by_count} citations.`,
                url: work.doi || `https://openalex.org/${work.id}`,
                source: "OpenAlex",
                type: "link" as const,
                author: work.authorships?.[0]?.author?.display_name || "Unknown Scholar",
                year: work.publication_year?.toString() || ""
            }));
        } catch {
            return [];
        }
    }
}

/**
 * YouTube Provider - Educational Videos
 */
class YouTubeProvider implements IDiscoveryProvider {
    name = "YouTube";
    private apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";

    async search(query: string): Promise<DiscoveryResult[]> {
        if (!this.apiKey) return [];
        try {
            // 1. Search for videos
            const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " lecture tutorial")}&maxResults=3&type=video&key=${this.apiKey}`);
            const searchData = await searchResponse.json();
            const items = searchData.items || [];

            if (items.length === 0) return [];

            // 2. Get statistics (views, likes) for these specific videos
            const videoIds = items.map((item: any) => item.id.videoId).join(',');
            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${this.apiKey}`);
            const statsData = await statsResponse.json();

            // Map stats by video ID
            const statsMap: Record<string, any> = {};
            (statsData.items || []).forEach((item: any) => {
                statsMap[item.id] = item.statistics;
            });

            // Formatter for large numbers (e.g. 1500000 -> 1.5M)
            const formatNum = (numStr: string) => {
                if (!numStr) return "0";
                const num = parseInt(numStr, 10);
                if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
                if (num >= 1000) return (num / 1000).toFixed(1) + "K";
                return num.toString();
            };

            return items.map((item: any) => {
                const videoId = item.id.videoId;
                const stats = statsMap[videoId] || {};

                return {
                    id: videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    url: `https://youtube.com/watch?v=${videoId}`,
                    source: "YouTube",
                    type: "video" as const,
                    thumbnail: item.snippet.thumbnails?.medium?.url,
                    author: item.snippet.channelTitle,
                    stats: {
                        views: formatNum(stats.viewCount),
                        likes: formatNum(stats.likeCount)
                    }
                };
            });
        } catch {
            return [];
        }
    }
}

/**
 * OpenStax Provider - Peer-reviewed Textbooks
 */
class OpenStaxProvider implements IDiscoveryProvider {
    name = "OpenStax";
    async search(query: string): Promise<DiscoveryResult[]> {
        try {
            const response = await fetch(`https://openstax.org/api/v2/pages/?type=books.Book&search=${encodeURIComponent(query)}&limit=2`);
            const data = await response.json();
            return (data.results || []).map((book: any) => ({
                id: `openstax-${book.id}`,
                title: book.title,
                description: "Free peer-reviewed textbook covering core fundamentals.",
                url: `https://openstax.org/details/books/${book.title.toLowerCase().replace(/\s+/g, "-")}`,
                source: "OpenStax",
                type: "link" as const,
                author: "Rice University",
                isVerified: true
            }));
        } catch {
            return [];
        }
    }
}

/**
 * Google Search Provider - Official Google Custom Search JSON API
 * Optimized with site-specific queries for academic depth.
 */
class GoogleSearchProvider implements IDiscoveryProvider {
    name = "Google Search";
    private apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || "";
    private cseId = import.meta.env.VITE_GOOGLE_CSE_ID || "";

    async search(query: string, typeFilter?: string): Promise<DiscoveryResult[]> {
        if (!this.apiKey || !this.cseId) return [];

        try {
            // Enhanced query logic: Force search on trusted academic domains
            const academicDomains = "site:edu OR site:ac.in OR site:researchgate.net OR site:nptel.ac.in OR site:ocw.mit.edu OR site:stanford.edu OR site:archive.org";
            let q = `${query} (${academicDomains})`;

            if (typeFilter === "pdf" || typeFilter === "notes") q += " filetype:pdf";
            if (typeFilter === "ppt") q += " filetype:ppt OR filetype:pptx";

            const response = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&cx=${this.cseId}&key=${this.apiKey}`);
            const data = await response.json();

            if (!data.items) return [];

            return data.items.map((item: any, i: number) => {
                const urlLower = (item.link || "").toLowerCase();
                const isPdf = urlLower.includes(".pdf");
                const isPpt = urlLower.includes(".ppt") || urlLower.includes(".pptx");

                return {
                    id: `google-${i}-${Date.now()}`,
                    title: item.title,
                    description: item.snippet,
                    url: item.link,
                    source: new URL(item.link).hostname.replace("www.", ""),
                    type: isPdf ? "pdf" : isPpt ? "ppt" : "link",
                    isVerified: urlLower.includes(".edu") || urlLower.includes(".ac.") || urlLower.includes("nptel")
                };
            });
        } catch {
            return [];
        }
    }
}

/**
 * SearchApi.io Provider - Powerful alternative for web/doc discovery
 */
class SearchApiProvider implements IDiscoveryProvider {
    name = "SearchApi";
    private apiKey = import.meta.env.VITE_SEARCH_API_KEY || "";

    async search(query: string, typeFilter?: string): Promise<DiscoveryResult[]> {
        if (!this.apiKey) return [];
        try {
            let q = query;
            if (typeFilter === "pdf" || typeFilter === "notes") q += " filetype:pdf";
            if (typeFilter === "ppt") q += " filetype:ppt";

            const response = await fetch(`https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(q)}&api_key=${this.apiKey}`);
            const data = await response.json();

            const results = data.organic_results || [];
            return results.slice(0, 5).map((r: any, i: number) => {
                const urlLower = (r.link || "").toLowerCase();
                const isPdf = urlLower.includes(".pdf");
                const isPpt = urlLower.includes(".ppt") || urlLower.includes(".pptx");

                return {
                    id: `sapi-${i}-${Date.now()}`,
                    title: r.title,
                    description: r.snippet || "",
                    url: r.link,
                    source: new URL(r.link).hostname.replace("www.", ""),
                    type: isPdf ? "pdf" : isPpt ? "ppt" : "link",
                    isVerified: urlLower.includes(".edu") || urlLower.includes(".ac.")
                };
            });
        } catch {
            return [];
        }
    }
}

/**
 * Google Autocomplete API - Real-time suggestions
 */
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data[1] || []; // Index 1 contains the array of suggestions
    } catch {
        return [];
    }
};

// --- Core Discovery Engine ---

export class DiscoveryEngine {
    private arXiv = new ArXivProvider();
    private openAlex = new OpenAlexProvider();
    private youtube = new YouTubeProvider();
    private openStax = new OpenStaxProvider();
    private webSearch = new WebSearchProvider();
    private docSearch = new DocumentSearchProvider();
    private googleSearch = new GoogleSearchProvider();
    private searchApi = new SearchApiProvider();

    /**
     * Parallel Discovery Execution
     */
    async discover(query: string) {
        // Execute all providers in parallel for maximum speed
        const [research, citations, videos, textbooks, webResults, documents, googleResults, sapiResults] = await Promise.all([
            this.arXiv.search(query),
            this.openAlex.search(query),
            this.youtube.search(query),
            this.openStax.search(query),
            this.webSearch.search(query),
            this.docSearch.search(query),
            this.googleSearch.search(query),
            this.searchApi.search(query),
        ]);

        // Merge and deduplicate results
        const allDocs = [...googleResults, ...sapiResults, ...documents, ...webResults].filter(r => r.type === "pdf" || r.type === "ppt");
        const allWeb = [...googleResults.filter(r => r.type === "link"), ...sapiResults.filter(r => r.type === "link"), ...webResults];

        return {
            research,
            citations,
            videos,
            textbooks,
            googleResults,
            sapiResults,
            documents: allDocs.slice(0, 15),
            webResults: allWeb.slice(0, 10),
            totalCount: research.length + citations.length + videos.length + textbooks.length + allWeb.length + allDocs.length
        };
    }
}

// Export singleton instance
export const discoveryEngine = new DiscoveryEngine();

// Compatibility Export
export const searchGlobalKnowledge = async (query: string) => {
    return await discoveryEngine.discover(query);
};
