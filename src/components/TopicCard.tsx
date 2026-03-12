import { motion } from "framer-motion";
import { ChevronRight, LayoutTemplate } from "lucide-react";
import { Link } from "react-router-dom";
import type { Topic } from "@/types";

interface TopicCardProps {
  topic: Topic;
  index: number;
}

const TopicCard = ({ topic, index }: TopicCardProps) => {
  return (
    <Link to={`/topics/${topic.id}`} className="block outline-none">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}
        whileHover={{ scale: 1.01, backgroundColor: "hsl(var(--muted)/0.5)" }}
        whileTap={{ scale: 0.98 }}
        className="glass-card group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition-colors relative overflow-hidden"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
          <LayoutTemplate className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="line-clamp-1 text-sm font-bold text-foreground">
            {topic.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80 leading-relaxed">
            {topic.description}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1">
          <ChevronRight className="h-5 w-5" />
        </div>
      </motion.div>
    </Link>
  );
};

export default TopicCard;
