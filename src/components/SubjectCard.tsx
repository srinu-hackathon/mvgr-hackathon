import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Subject } from "@/types";

interface SubjectCardProps {
  subject: Subject;
  index: number;
}

const SubjectCard = ({ subject, index }: SubjectCardProps) => {
  return (
    <Link to={`/subjects/${subject.id}`} className="block outline-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card flex min-h-[140px] cursor-pointer flex-col justify-between rounded-[2rem] p-5 shadow-elevated relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${subject.color}), hsl(${subject.color} / 0.8))`,
        }}
      >
        {/* Decorative inner mesh/glow */}
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />

        <div className="relative flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-md shadow-card">
            {subject.icon}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        <div className="relative mt-4">
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-white mb-1.5 drop-shadow-sm">
            {subject.name}
          </h3>
          <div className="flex gap-2">
            <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm uppercase">
              Explore
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default SubjectCard;
