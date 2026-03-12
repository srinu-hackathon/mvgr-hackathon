import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoModalProps {
    open: boolean;
    onClose: () => void;
    youtubeId: string;
    title: string;
}

const VideoModal = ({ open, onClose, youtubeId, title }: VideoModalProps) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="modal"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-background"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-border" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <p className="font-semibold text-sm text-foreground line-clamp-1 flex-1 pr-3">{title}</p>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* YouTube Embed */}
                        <div className="relative mx-4 mb-8 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16/9" }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                                title={title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full border-0"
                            />
                        </div>

                        {/* Safe bottom for mobile */}
                        <div className="safe-bottom" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default VideoModal;
