import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Play, StickyNote, Presentation, Globe, Star, ArrowUpCircle, ExternalLink, Bookmark, Share2 } from "lucide-react";
import VideoModal from "./VideoModal";
import type { Resource } from "@/types";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const iconMap = {
  pdf: FileText,
  video: Play,
  notes: StickyNote,
  ppt: Presentation,
  oer: Globe,
};

const colorMap = {
  pdf: "text-red-500 bg-red-500/10 border-red-500/20",
  video: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  notes: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  ppt: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  oer: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

// Bookmark helpers using localStorage
const BOOKMARKS_KEY = "studysphere_bookmarks";

export const getBookmarks = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch { return []; }
};

export const isBookmarked = (id: string): boolean => getBookmarks().includes(id);

export const toggleBookmark = (id: string): boolean => {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  if (index > -1) {
    bookmarks.splice(index, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks.push(id);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  }
};

export default function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
  const Icon = iconMap[resource.type];
  const colorClass = colorMap[resource.type];
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(resource.upvotes);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsSaved(isBookmarked(resource.id));
  }, [resource.id]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpvoted) return;
    setIsUpvoted(true);
    setUpvotes(prev => prev + 1);
    await api.upvoteResource(resource.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = toggleBookmark(resource.id);
    setIsSaved(saved);
    toast({
      title: saved ? "Bookmarked" : "Removed",
      description: `"${resource.title}" ${saved ? "saved to your bookmarks." : "removed from bookmarks."}`,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📚 Check out this resource: *${resource.title}*\n${resource.url || ""}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleClick = () => {
    if (resource.type === "video") {
      setIsVideoOpen(true);
    } else if (resource.url) {
      window.open(resource.url, "_blank");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="glass-card mb-3 cursor-pointer rounded-2xl p-4 transition-all hover:bg-muted/30"
      >
        <div className="flex items-start gap-4">
          <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">
              {resource.title}
            </h3>

            {resource.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {resource.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                {resource.type.toUpperCase()}
              </span>

              {resource.source && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {resource.source}
                </span>
              )}

              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {resource.rating > 0 ? resource.rating.toFixed(1) : "New"}
                </div>
                {resource.type !== "video" && (
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/80">By {resource.author}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* WhatsApp Share */}
            <button
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {/* Bookmark */}
            <button
              onClick={handleSave}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isSaved ? "text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
            </button>
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-colors ${isUpvoted ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ArrowUpCircle className={`h-4 w-4 ${isUpvoted ? "fill-primary text-primary/20" : ""}`} />
              <span className="text-xs font-semibold">{upvotes}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {resource.type === "video" && resource.youtubeId && (
        <VideoModal
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          videoId={resource.youtubeId}
          title={resource.title}
        />
      )}
    </>
  );
}
