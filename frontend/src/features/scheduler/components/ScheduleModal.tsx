import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";
import DateTimePicker from "@/features/scheduler/components/DateTimePicker";

interface ScheduleModalProps {
  postId: string;
  content: string;
  onClose: () => void;
  onSchedule: () => void;
  editingPost?: {
    id: string;
    postId: string;
    content: string;
    scheduledAt: string;
    status: string;
  } | null;
}

export default function ScheduleModal({ postId, content, onClose, onSchedule, editingPost }: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    // If we're editing a post, pre-fill the date, time, and content
    if (editingPost) {
      try {
        const scheduledDate = new Date(editingPost.scheduledAt);
        setDate(scheduledDate.toISOString().split('T')[0]);
        setTime(scheduledDate.toTimeString().slice(0, 5));
        setPostContent(editingPost.content || content);
      } catch (error) {
        console.error("Error parsing scheduled date:", error);
        setDate("");
        setTime("");
        setPostContent(editingPost.content || content);
      }
    } else {
      setPostContent(content);
    }
  }, [editingPost, content]);

  const handleSchedule = async () => {
    if (!date || !time) {
      toast.error("Please select both date and time");
      return;
    }

    let scheduledAt;
    try {
      scheduledAt = new Date(`${date}T${time}`).toISOString();
    } catch (error) {
      toast.error("Invalid date or time format");
      return;
    }

    if (new Date(scheduledAt) < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    // If we're editing an existing scheduled post, update it with content
    if (editingPost) {
      setIsScheduling(true);
      try {
        const response = await api.updateScheduledPostWithContent(editingPost.id, { 
          scheduledAt, 
          content: postContent,
          hashtags: [] // In a real implementation, you might extract hashtags from the content
        });
        
        if (!response.success) {
          toast.error(response.message || "Failed to update scheduled post");
          setIsScheduling(false);
          return;
        }

        toast.success("Scheduled post and content updated successfully!");
        onSchedule();
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
        onClose();
      } catch (error: any) {
        console.error("Error updating scheduled post:", error);
        toast.error(error.message || "Failed to update scheduled post. Please try again.");
        setIsScheduling(false);
        return; // Make sure we return here to avoid continuing execution
      }
      return;
    }

    // If this is a temporary post or unsaved post, we need to save it first
    let actualPostId = postId;
    if (!postId || postId.startsWith("temp-")) {
      try {
        const saveResponse = await api.savePost({ content: postContent, hashtags: [] });
        if (saveResponse.error) {
          toast.error(saveResponse.error);
          return;
        }
        actualPostId = saveResponse.post._id;
      } catch (error: any) {
        console.error("Error saving post:", error);
        toast.error(error.message || "Failed to save post. Please try again.");
        return;
      }
    }

    setIsScheduling(true);
    
    // Set a timeout to ensure the modal closes even if the request hangs
    const timeoutId = setTimeout(() => {
      if (isScheduling) {
        setIsScheduling(false);
        toast.error("Request timed out. Please try again.");
        onClose();
      }
    }, 10000); // 10 second timeout
    
    try {
      const response = await api.schedulePost({ postId: actualPostId, scheduledAt });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (!response.success) {
        toast.error(response.message || "Failed to schedule post");
        setIsScheduling(false);
        return;
      }

      toast.success("Post scheduled successfully!");
      onSchedule();
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
      onClose();
    } catch (error: any) {
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      
      console.error("Error scheduling post:", error);
      // Check if it's a network error or Redis connection issue
      if (error.message && error.message.includes('ECONNREFUSED')) {
        toast.error("Unable to connect to scheduling service. Please ensure Redis is running.");
      } else {
        toast.error(error.message || "Failed to schedule post. Please try again.");
      }
      // Ensure the modal closes even on error
      onClose();
    } finally {
      // This should always run, but we also clear the timeout as a backup
      if (isScheduling) {
        setIsScheduling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="glass-strong p-6 space-y-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-2xl font-bold">{editingPost ? "Edit Scheduled Post" : "Schedule Post"}</h2>
            <p className="text-muted-foreground mt-1">
              {editingPost ? "Update when to publish your post" : "Choose when to publish your post"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="postContent">Post Content</Label>
              <Textarea
                id="postContent"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="glass mt-2 min-h-[120px]"
                placeholder="Write your LinkedIn post content here..."
              />
            </div>
          </div>

          <DateTimePicker 
            onDateChange={setDate} 
            onTimeChange={setTime} 
            selectedDate={date} 
            selectedTime={time} 
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 glass"
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isScheduling}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white glow-cyan"
            >
              {isScheduling ? (editingPost ? "Updating..." : "Scheduling...") : (editingPost ? "Update" : "Schedule")}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}