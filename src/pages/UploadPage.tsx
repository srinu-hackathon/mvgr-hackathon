import { useState, useRef } from "react";
import type React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Upload, FileText, Presentation, StickyNote, CheckCircle2, Link, Info, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { api } from "@/services/api";
import type { ResourceType } from "@/types";

type Mode = "file" | "link";

const typeOptions: { value: ResourceType; icon: typeof FileText; label: string; desc: string }[] = [
  { value: "pdf", icon: FileText, label: "PDF", desc: "Notes, textbooks" },
  { value: "ppt", icon: Presentation, label: "PPT", desc: "Lecture slides" },
  { value: "notes", icon: StickyNote, label: "Notes", desc: "Handwritten notes" },
  { value: "oer", icon: Link, label: "OER", desc: "Open resources" },
  { value: "video", icon: Upload, label: "Video", desc: "YouTube link" },
];

const UploadPage = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("file");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.getSubjects(),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics", selectedSubject],
    queryFn: () => api.getTopicsBySubject(selectedSubject),
    enabled: !!selectedSubject,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Simulate mapping correct inputs
      let finalUrl = url;
      let youtubeId = undefined;

      if (mode === "file") {
        finalUrl = "https://example.com/simulated-upload.pdf"; // Mock uploaded file URL
      } else if (type === "video") {
        // Extract basic ID just for simulation
        const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match) youtubeId = match[1];
      }

      await api.uploadResource({
        title,
        description,
        type,
        url: finalUrl,
        youtubeId,
        topicId: selectedTopic,
        author: "Student User", // Mapped from active logged in user typically
        source: mode === "file" ? "Community" : "External Link",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle(""); setSelectedSubject(""); setSelectedTopic(""); setFile(null); setUrl(""); setDescription("");
      }, 4000);
    }
  });

  const handleFile = (f: File) => setFile(f);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const formValid = title && selectedSubject && selectedTopic && (mode === "file" ? !!file : !!url);

  const inputClass = "w-full rounded-2xl glass-card px-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all";
  const labelClass = "mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider px-1";

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Upload Resource" subtitle="Share your knowledge" />

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center px-6 py-24 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 shadow-elevated"
            >
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Submitted Successfully!</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-[280px] leading-relaxed">
              Your resource has been sent to the moderation queue. It will be public once an admin approves it.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6 p-4"
          >
            {/* Guidelines Banner */}
            <div className="glass-card flex items-start gap-3 rounded-2xl px-4 py-4 border-primary/20 bg-primary/5">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                Upload authentic study materials or valid OER links. Fake content or spam will be permanently rejected by moderators.
              </p>
            </div>

            {/* Mode Toggle */}
            <div>
              <label className={labelClass}>Upload Method</label>
              <div className="flex gap-2 p-1 rounded-2xl glass-card bg-muted/30">
                {([
                  { id: "file" as Mode, icon: Upload, label: "Upload File" },
                  { id: "link" as Mode, icon: Link, label: "Share Link" },
                ]).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${mode === id ? "bg-background text-foreground shadow-sm scale-100" : "text-muted-foreground hover:text-foreground scale-95"
                      }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className={labelClass}>Resource Title *</label>
              <input
                type="text" required value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Binary Trees Notes"
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this covers..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Subject */}
            <div>
              <label className={labelClass}>Subject *</label>
              <select
                required value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(""); }}
                className={inputClass}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <AnimatePresence>
              {selectedSubject && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <label className={labelClass}>Topic *</label>
                  <select required value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className={inputClass}>
                    <option value="">Select topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resource Type */}
            <div>
              <label className={labelClass}>Content Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {typeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value} type="button" onClick={() => setType(value)}
                    className={`glass-card flex items-center gap-3 rounded-2xl p-3.5 transition-all ${type === value ? "border-primary ring-1 ring-primary/30 bg-primary/5 text-primary scale-100" : "text-muted-foreground scale-95 opacity-80 hover:opacity-100"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File or Link */}
            {mode === "file" ? (
              <div>
                <label className={labelClass}>Upload File *</label>
                <input
                  ref={fileRef} type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`glass-card flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all ${dragOver ? "border-primary bg-primary/5 scale-[1.02]" : file ? "border-primary/50 bg-primary/5" : "hover:border-primary/40 hover:bg-muted/30"
                    }`}
                >
                  {file ? (
                    <>
                      <div className="rounded-full bg-primary/20 p-3">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-2 rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-full bg-muted p-4">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">Tap to browse or drag file</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">PDF, PPT, DOC (Max 25MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Resource URL *</label>
                <input
                  type="url" required value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={inputClass}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!formValid || uploadMutation.isPending}
              className="w-full rounded-2xl gradient-primary py-4 text-sm font-bold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {uploadMutation.isPending ? "Submitting..." : "Submit for Admin Review"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
