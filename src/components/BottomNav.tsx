import { Home, Search, PlusCircle, User, BrainCircuit } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/tools", icon: BrainCircuit, label: "Study Bot" },
  { path: "/upload", icon: PlusCircle, label: "Upload" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="mx-auto w-full max-w-lg bg-background/80 px-4 py-3 backdrop-blur-xl border-t border-border/50 shadow-elevated">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95"
              >
                {active && (
                  <motion.div
                    layoutId="bubble"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`relative z-10 h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                />
                <span
                  className={`relative z-10 mt-1 text-[9px] font-bold transition-colors ${active ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
