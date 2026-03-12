import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import HomePage from "./pages/HomePage";
import DomainsPage from "./pages/DomainsPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import SearchPage from "./pages/SearchPage";
import UploadPage from "./pages/UploadPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ToolsPage from "./pages/ToolsPage";
import ExamModePage from "./pages/ExamModePage";
import NotFound from "./pages/NotFound";

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/domains/:domainId" element={<SubjectsPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/topics/:topicId" element={<TopicDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/assistant" element={<ToolsPage />} />
        <Route path="/exam-mode" element={<ExamModePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="mx-auto max-w-lg bg-mesh min-h-screen">
          <AnimatedRoutes />
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
