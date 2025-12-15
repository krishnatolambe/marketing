import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { api } from "@/features/shared/services/api";

const features = [
  {
    icon: Sparkles,
    title: "AI Content Generator",
    description: "Create engaging LinkedIn posts with AI in seconds",
    gradient: "from-primary to-secondary",
    path: "/generate",
  },
  {
    icon: Clock,
    title: "Best Time Predictor",
    description: "Find optimal posting times for maximum engagement",
    gradient: "from-secondary to-accent",
    path: "/analytics",
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track performance and engagement metrics",
    gradient: "from-accent to-primary",
    path: "/analytics",
  },
  {
    icon: Calendar,
    title: "Post Scheduler",
    description: "Schedule your content for optimal reach",
    gradient: "from-primary via-secondary to-accent",
    path: "/schedule",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: "Posts Generated", value: "0", change: "+0%" },
    { label: "Engagement Rate", value: "0%", change: "+0%" },
    { label: "Scheduled Posts", value: "0", change: "+0" },
    { label: "Total Reach", value: "0", change: "+0%" },
  ]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // In a real implementation, you would fetch actual stats from the API
        // For now, we'll use mock data
        setStats([
          { label: "Posts Generated", value: "24", change: "+12%" },
          { label: "Engagement Rate", value: "4.2%", change: "+0.8%" },
          { label: "Scheduled Posts", value: "8", change: "+2" },
          { label: "Total Reach", value: "12.4K", change: "+15%" },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  // Handle post published events
  useEffect(() => {
    const handlePostPublished = (event: CustomEvent) => {
      const detail = event.detail;
      
      // Update stats based on the published post
      setStats(prevStats => {
        const newStats = [...prevStats];
        
        if (detail.scheduled) {
          // Increment scheduled posts count
          const scheduledIndex = newStats.findIndex(stat => stat.label === "Scheduled Posts");
          if (scheduledIndex !== -1) {
            const currentValue = parseInt(newStats[scheduledIndex].value) || 0;
            newStats[scheduledIndex] = {
              ...newStats[scheduledIndex],
              value: (currentValue + 1).toString(),
              change: `+1`
            };
          }
        } else {
          // Increment posts generated count
          const generatedIndex = newStats.findIndex(stat => stat.label === "Posts Generated");
          if (generatedIndex !== -1) {
            const currentValue = parseInt(newStats[generatedIndex].value) || 0;
            newStats[generatedIndex] = {
              ...newStats[generatedIndex],
              value: (currentValue + 1).toString(),
              change: `+1`
            };
          }
        }
        
        return newStats;
      });
      
      // Show notification
      // toast.success(detail.scheduled ? "Post scheduled successfully!" : "Post published to LinkedIn!");
    };

    // Add event listener for post published events
    window.addEventListener('postPublished', handlePostPublished as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('postPublished', handlePostPublished as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 gradient-text">LinkedIn AutoMarketer AI</h1>
          <p className="text-muted-foreground text-lg">Automate your LinkedIn marketing with AI-powered tools</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass p-6 hover:glow-cyan transition-all duration-300">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-primary">{stat.change}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              <Card className={`glass-strong p-6 bg-gradient-to-br ${feature.gradient} hover:glow-purple transition-all duration-300`}>
                <feature.icon className="w-10 h-10 text-white mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/80">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}