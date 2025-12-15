import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/features/shared/services/api";
import { toast } from "sonner";

// Mock data for demonstration
const mockMetrics = [
  { icon: Eye, label: "Total Views", value: "1,240", trend: "+12%" },
  { icon: Heart, label: "Total Likes", value: "324", trend: "+8%" },
  { icon: MessageCircle, label: "Total Comments", value: "89", trend: "+5%" },
  { icon: Repeat2, label: "Total Shares", value: "42", trend: "+15%" },
];

const heatmapData = [
  { day: "Mon", hours: [2, 3, 5, 8, 6, 4, 3, 5, 7, 9, 8, 6, 5, 7, 9, 8, 6, 4, 3, 2, 1, 1, 1, 1] },
  { day: "Tue", hours: [1, 2, 4, 7, 5, 3, 2, 4, 6, 8, 7, 5, 4, 6, 8, 7, 5, 3, 2, 1, 1, 1, 1, 1] },
  { day: "Wed", hours: [2, 3, 5, 8, 6, 4, 3, 5, 7, 9, 8, 6, 5, 7, 9, 8, 6, 4, 3, 2, 1, 1, 1, 1] },
  { day: "Thu", hours: [1, 2, 4, 7, 5, 3, 2, 4, 6, 8, 7, 5, 4, 6, 8, 7, 5, 3, 2, 1, 1, 1, 1, 1] },
  { day: "Fri", hours: [2, 3, 5, 8, 6, 4, 3, 5, 7, 9, 8, 6, 5, 7, 8, 7, 5, 3, 2, 1, 1, 1, 1, 1] },
  { day: "Sat", hours: [1, 1, 2, 3, 2, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1, 1] },
  { day: "Sun", hours: [1, 1, 1, 2, 2, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1, 1] },
];

export default function Analytics() {
  const [metrics, setMetrics] = useState(mockMetrics);
  const [isLoading, setIsLoading] = useState(false);

  const getHeatmapColor = (value: number) => {
    if (value >= 8) return "bg-primary glow-cyan";
    if (value >= 6) return "bg-primary/70";
    if (value >= 4) return "bg-primary/40";
    if (value >= 2) return "bg-primary/20";
    return "bg-muted";
  };

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your LinkedIn performance and engagement</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass p-6 hover:glow-purple transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <metric.icon className="w-8 h-8 text-primary" />
                  <span className="text-xs text-primary">{metric.trend}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-3xl font-bold">{metric.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Best Posting Times Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-strong p-8">
            <h2 className="text-2xl font-semibold mb-6">Best Times to Post</h2>
            <p className="text-muted-foreground mb-6">
              Darker colors indicate higher engagement rates based on industry data
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Hour labels */}
                <div className="flex mb-2">
                  <div className="w-16"></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                      {i}
                    </div>
                  ))}
                </div>

                {/* Heatmap */}
                {heatmapData.map((dayData, dayIndex) => (
                  <motion.div
                    key={dayData.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + dayIndex * 0.05 }}
                    className="flex items-center mb-2"
                  >
                    <div className="w-16 text-sm text-muted-foreground">{dayData.day}</div>
                    {dayData.hours.map((value, hourIndex) => (
                      <div
                        key={hourIndex}
                        className={`flex-1 h-8 mx-0.5 rounded ${getHeatmapColor(value)} transition-all duration-300 hover:scale-110 cursor-pointer`}
                        title={`${dayData.day} ${hourIndex}:00 - Engagement: ${value}/10`}
                      />
                    ))}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/40"></div>
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary glow-cyan"></div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}