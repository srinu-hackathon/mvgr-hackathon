import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Upload, Settings, LogOut, ChevronRight,
  LogIn, Bookmark, GraduationCap, Building2, BookA, Calendar, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { api } from "@/services/api";
import { getBookmarks } from "@/components/ResourceCard";

const ProfilePage = () => {
  const [isGuest, setIsGuest] = useState(false);

  // Student Details State
  const [details, setDetails] = useState({
    name: "",
    university: "",
    major: "",
    year: "1st Year",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("edu_student_details");
    if (saved) {
      setDetails(JSON.parse(saved));
    } else {
      setIsEditing(true); // Open edit mode by default if no details
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("edu_student_details", JSON.stringify(details));
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

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
            Sign in to upload resources, save bookmarks, and customize your study profile.
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
        {/* Avatar & Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] gradient-primary shadow-elevated mb-4">
            <User className="h-12 w-12 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {details.name || "Student User"}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {details.major || "Add your major below"}
          </p>
        </motion.div>

        {/* Student Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Student Details</h3>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                {isSaved ? <Check className="h-3.5 w-3.5" /> : "Save"}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                <User className="h-3 w-3" /> Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={details.name}
                  onChange={e => setDetails(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full bg-muted/30 rounded-lg px-3 py-2.5 text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all"
                />
              ) : (
                <p className="text-sm font-bold text-foreground px-1">{details.name || "—"}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                <Building2 className="h-3 w-3" /> University / College
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={details.university}
                  onChange={e => setDetails(d => ({ ...d, university: e.target.value }))}
                  placeholder="e.g. Stanford University"
                  className="w-full bg-muted/30 rounded-lg px-3 py-2.5 text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all"
                />
              ) : (
                <p className="text-sm font-medium text-foreground px-1">{details.university || "—"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  <BookA className="h-3 w-3" /> Major / Course
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={details.major}
                    onChange={e => setDetails(d => ({ ...d, major: e.target.value }))}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full bg-muted/30 rounded-lg px-3 py-2.5 text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground px-1">{details.major || "—"}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  <Calendar className="h-3 w-3" /> Year of Study
                </label>
                {isEditing ? (
                  <select
                    value={details.year}
                    onChange={e => setDetails(d => ({ ...d, year: e.target.value }))}
                    className="w-full bg-muted/30 rounded-lg px-3 py-2.5 text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all appearance-none"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Masters</option>
                    <option>PhD</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-foreground px-1">{details.year || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Uploads */}
        <AnimatePresence>
          {pendingResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
          className="space-y-2 pt-2"
        >
          <button className="glass-card flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:bg-muted/50 active:scale-[0.98]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-bold text-foreground">Saved Resources</span>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
              {getBookmarks().length}
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>

          <button className="glass-card flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:bg-muted/50 active:scale-[0.98]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-bold text-foreground">Preferences</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
          </button>

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
