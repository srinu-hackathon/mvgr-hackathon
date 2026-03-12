import { motion } from "framer-motion";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import type { Domain } from "@/types";

interface DomainCardProps {
    domain: Domain;
    index: number;
}

const DomainCard = ({ domain, index }: DomainCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Link
                to={`/domains/${domain.id}`}
                className="glass-card group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all hover:bg-white/10"
            >
                <div className="absolute -right-6 -top-6 text-primary/5 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/10">
                    <LayoutGrid className="h-24 w-24" />
                </div>

                <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{domain.name}</h3>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground line-clamp-1">{domain.description}</p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default DomainCard;
