import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState = ({ icon: Icon, title, message, action }: EmptyStateProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-muted to-muted/50 shadow-elevated">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
                {title}
            </h3>
            <p className="mb-8 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                {message}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-95"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
