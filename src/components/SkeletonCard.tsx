import { motion } from "framer-motion";

const SkeletonCard = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card mb-3 rounded-2xl p-4"
        >
            <div className="flex gap-3">
                {/* Type Icon Skeleton */}
                <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />

                <div className="flex-1 space-y-2.5 py-1">
                    {/* Title Skeleton */}
                    <div className="skeleton h-4 w-3/4 rounded-md" />

                    {/* Description/Author Skeleton */}
                    <div className="skeleton h-3 w-1/2 rounded-md" />

                    {/* Badges Skeleton */}
                    <div className="flex gap-2 pt-2">
                        <div className="skeleton h-5 w-16 rounded-full" />
                        <div className="skeleton h-5 w-12 rounded-full" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SkeletonCard;
