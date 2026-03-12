import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Upload, Star, BookOpen, Settings, LogOut, ChevronRight,
  Award, Shield, Flame, LogIn, Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { api } from "@/services/api";
import { getBookmarks } from "@/components/ResourceCard";

const badges = [
  { icon: Flame, label: "Active Learner", desc: "Visited 10+ topics", earned: true, color: "text-orange-500 bg-orange-500/10" },
  { icon: Upload, label: "Contributor", desc: "Uploaded first resource", earned: true, color: "text-blue-500 bg-blue-500/10" },
  { icon: Star, label: "Top Rater", desc: "Rated 20+ resources", earned: false, color: "text-amber-500 bg-amber-500/10" },
  { icon: Shield, label: "Trusted Member", desc: "5 resources approved", earned: false, color: "text-green-500 bg-green-500/10" },
];

const menuItems = [
  { icon: Upload, label: "My Uploads", count: "3" },
  { icon: Bookmark, label: "Saved Resources", count: "auto" },
  { icon: BookOpen, label: "Study History", count: "28" },
  { icon: Settings, label: "Settings" },
];

const ProfilePage = () => {
  const [isGuest, setIsGuest] = useState(false);

  const { data: pendingResources = [] } = useQuery({
    queryKey: ["pending"],
    queryFn: () => api.getPendingResources(),
  });

  if (isGuest) {
    return (
      <div className="min-h-screen pb-28">
        <PageHeader title="Profile" />
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted/50 shadow-elevated">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">Guest Mode</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            Sign in to upload resources, save bookmarks, and track your study history.
          </p>
          <button
            onClick={() => setIsGuest(false)}
            className="mt-8 flex items-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:opacity-90 active:scale-95"
          >
            <LogIn className="h-4 w-4" /> Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Profile" />

      <div className="p-4 space-y-6">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] gradient-primary shadow-elevated">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm ring-4 ring-background">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">Student User</h2>
          <p className="text-sm font-medium text-muted-foreground">student@university.edu</p>
          <p className="mt-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Global Student Network
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Uploads", value: "3" },
            { label: "Downloads", value: "47" },
            { label: "Bookmarks", value: String(getBookmarks().length) },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-3 flex items-center gap-2 px-1">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold text-sm tracking-wide text-foreground uppercase">Achievements</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map(({ icon: Icon, label, desc, earned, color }) => (
              <div
                key={label}
                className={`glass-card rounded-2xl p-4 transition-all ${earned ? "border-primary/20" : "opacity-60 grayscale-[50%]"}`}
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
                {!earned && <p className="mt-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">🔒 Locked</p>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending Uploads */}
        <AnimatePresence>
          {pendingResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="mb-3 font-bold text-sm text-foreground flex items-center gap-2 px-1 uppercase tracking-wide">
                <Upload className="h-4 w-4 text-amber-500" />
                Pending Review ({pendingResources.length})
              </h3>
              <div className="space-y-3">
                {pendingResources.map((r) => (
                  <div key={r.id} className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 border-amber-500/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{r.type.toUpperCase()}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 pt-2"
        >
          {menuItems.map(({ icon: Icon, label, count }) => (
            <button
              key={label}
              className="glass-card flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:bg-muted/50 active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-bold text-foreground">{label}</span>
              {count && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {count === "auto" ? getBookmarks().length : count}
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </button>
          ))}

          <button
            onClick={() => setIsGuest(true)}
            className="glass-card flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:bg-destructive/10 active:scale-[0.98] border-destructive/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <span className="flex-1 text-sm font-bold text-destructive">Sign Out</span>
            <ChevronRight className="h-5 w-5 text-destructive/50" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
