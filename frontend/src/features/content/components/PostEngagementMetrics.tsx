import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Heart, MessageCircle, Repeat2, Eye, TrendingUp } from "lucide-react";
import { api } from "@/features/shared/services/api";
import { toast } from "sonner";

interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
}

interface PostEngagementMetricsProps {
  postId: string;
  initialMetrics: EngagementMetrics;
}

export default function PostEngagementMetrics({ 
  postId, 
  initialMetrics 
}: PostEngagementMetricsProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics>(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const fetchEngagementMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPostEngagement(postId);
      
      if (response.success) {
        setMetrics(response.metrics);
        setLastUpdated(new Date().toLocaleTimeString());
        toast.success("Engagement metrics updated successfully");
      } else {
        toast.error(response.message || "Failed to fetch engagement metrics");
      }
    } catch (error: any) {
      console.error("Error fetching engagement metrics:", error);
      toast.error(error.message || "Failed to fetch engagement metrics");
    } finally {
      setIsLoading(false);
    }
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

  // Calculate engagement rate percentage
  const engagementRatePercentage = `${metrics.engagementRate.toFixed(2)}%`;

  return (
    <Card className="glass p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Engagement Metrics</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchEngagementMetrics}
          disabled={isLoading}
          className="glass"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Eye className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">Views</p>
            <p className="text-xl font-bold">{formatNumber(metrics.views)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <Heart className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm text-muted-foreground">Likes</p>
            <p className="text-xl font-bold">{formatNumber(metrics.likes)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Comments</p>
            <p className="text-xl font-bold">{formatNumber(metrics.comments)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <Repeat2 className="w-5 h-5 text-purple-500" />
          <div>
            <p className="text-sm text-muted-foreground">Shares</p>
            <p className="text-xl font-bold">{formatNumber(metrics.shares)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-muted-foreground">Impressions</p>
            <p className="text-xl font-bold">{formatNumber(metrics.impressions)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <div>
            <p className="text-sm text-muted-foreground">Engagement</p>
            <p className="text-xl font-bold">{engagementRatePercentage}</p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-right">
        Last updated: {lastUpdated}
      </p>
    </Card>
  );
}