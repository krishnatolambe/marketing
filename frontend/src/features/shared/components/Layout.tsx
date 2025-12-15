import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Home, Sparkles, BarChart3, Calendar, Settings } from "lucide-react";
import { NavLink } from "@/features/shared/components/NavLink";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Sparkles, label: "Generate", path: "/generate" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-20 glass-strong border-r border-border/50 flex flex-col items-center py-8 space-y-8"
      >
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-cyan"
        >
          <Sparkles className="w-6 h-6 text-background" />
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="w-12 h-12 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-300"
              activeClassName="bg-primary/20 text-primary glow-cyan"
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
