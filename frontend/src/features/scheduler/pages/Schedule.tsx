import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";
import ScheduleModal from "@/features/scheduler/components/ScheduleModal";

interface ScheduledPost {
  id: string;
  postId: string;
  content: string;
  scheduledAt: string;
  status: string;
}

export default function Schedule() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [tempPost, setTempPost] = useState({ id: "", content: "" });

  useEffect(() => {
    fetchScheduledPosts();
    
    // Listen for scheduled posts updates from other components
    const handleScheduledPostsUpdate = () => {
      fetchScheduledPosts();
    };
    
    // Listen for post published events
    const handlePostPublished = () => {
      // Refresh scheduled posts when a post is published
      setTimeout(() => {
        fetchScheduledPosts();
      }, 1000); // Small delay to ensure backend has processed the update
    };

    window.addEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    window.addEventListener('postPublished', handlePostPublished as EventListener);
    
    return () => {
      window.removeEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
      window.removeEventListener('postPublished', handlePostPublished as EventListener);
    };
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await api.getScheduledPosts();
      if (response.success) {
        setScheduledPosts(response.scheduledPosts);
      } else {
        toast.error(response.message || "Failed to fetch scheduled posts");
      }
    } catch (error: any) {
      console.error("Error fetching scheduled posts:", error);
      toast.error(error.message || "Failed to fetch scheduled posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleScheduleNewPost = async () => {
    // For demo purposes, we'll create a temporary post
    // In a real app, you would probably navigate to the generate page or have a form to create a new post
    const tempContent = "This is a sample post for scheduling. In a real application, you would generate or select an actual post.";
    setTempPost({
      id: "temp-" + Date.now(),
      content: tempContent
    });
    setEditingPost(null);
    setShowScheduleModal(true);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setTempPost({
      id: post.postId,
      content: post.content
    });
    setShowScheduleModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    // Show confirmation dialog before deleting
    if (!window.confirm("Are you sure you want to delete this scheduled post?")) {
      return;
    }
    
    try {
      const response = await api.deleteScheduledPost(postId);
      if (response.success) {
        toast.success("Scheduled post deleted successfully");
        fetchScheduledPosts();
        // Also dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
      } else {
        toast.error(response.message || "Failed to delete scheduled post");
      }
    } catch (error: any) {
      console.error("Error deleting scheduled post:", error);
      toast.error(error.message || "Failed to delete scheduled post. Please try again.");
    }
  };

  const handlePostScheduled = () => {
    // Refresh the scheduled posts list
    setTimeout(() => {
      fetchScheduledPosts();
      // Also dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
    }, 500); // Small delay to ensure backend has processed the update
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 gradient-text">Post Scheduler</h1>
            <p className="text-muted-foreground">Manage and schedule your LinkedIn posts</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white glow-cyan"
            onClick={handleScheduleNewPost}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule New Post
          </Button>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glass-strong p-8">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">December 2025</h2>
              </div>

              {/* Simple calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm text-muted-foreground font-semibold p-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 2;
                  const isCurrentMonth = day > 0 && day <= 31;
                  const hasPost = scheduledPosts.some(post => {
                    const postDate = new Date(post.scheduledAt);
                    return postDate.getDate() === day && postDate.getMonth() === 11 && postDate.getFullYear() === 2025;
                  });

                  return (
                    <motion.div
                      key={i}
                      whileHover={isCurrentMonth ? { scale: 1.05 } : {}}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm
                        ${isCurrentMonth ? "glass cursor-pointer hover:glow-cyan" : "text-muted-foreground/30"}
                        ${hasPost ? "bg-primary/20 border-2 border-primary glow-cyan" : ""}
                      `}
                    >
                      {isCurrentMonth ? day : ""}
                      {hasPost && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Scheduled Posts List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="glass-strong p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Upcoming Posts</h3>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled posts yet</p>
                  <p className="text-sm mt-2">Schedule your first post to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {scheduledPosts
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-4 hover:glow-cyan transition-all duration-300"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(post.scheduledAt)}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{formatTime(post.scheduledAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPost(post)}
                              className="hover:bg-primary/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePost(post.id)}
                              className="hover:bg-destructive/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  }
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {showScheduleModal && (
          <ScheduleModal
            postId={tempPost.id}
            content={tempPost.content}
            editingPost={editingPost}
            onClose={() => {
              setShowScheduleModal(false);
              setEditingPost(null);
            }}
            onSchedule={handlePostScheduled}
          />
        )}
      </motion.div>
    </div>
  );
}