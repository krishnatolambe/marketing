import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";

interface LinkedInPostPreviewProps {
  content: string;
  imageUrl: string | null;
  onClose: () => void;
  onPost: () => void;
}

export default function LinkedInPostPreview({ 
  content, 
  imageUrl, 
  onClose,
  onPost
}: LinkedInPostPreviewProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const handlePost = async () => {
    setIsPosting(true);
    setPostError(null);
    try {
      // Call the actual post function
      await onPost();
      setIsPosted(true);
      
      // Show success message
      toast.success("Post published to LinkedIn successfully!");
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Error posting to LinkedIn:", error);
      setPostError(error.message || "Failed to post to LinkedIn. Please try again.");
      toast.error(error.message || "Failed to post to LinkedIn. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  // Extract engagement metrics from content if available
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const hashtags = extractHashtags(content);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Preview LinkedIn Post</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* LinkedIn-style post header */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">Your Name</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Job Title • Company</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Just now</p>
              </div>
            </div>

            {/* Post content */}
            <div className="mb-4 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {content}
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post image */}
            {imageUrl && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img 
                  src={imageUrl} 
                  alt="Post content" 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Engagement metrics */}
            <div className="flex items-center justify-between py-2 text-sm text-gray-500 dark:text-gray-400 border-y border-gray-200 dark:border-gray-800 mb-4">
              <span>0 likes</span>
              <span>0 comments • 0 reposts</span>
            </div>

            {/* Action buttons */}
            <div className="flex justify-around py-2 border-y border-gray-200 dark:border-gray-800">
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Heart className="w-5 h-5" />
                <span>Like</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <MessageCircle className="w-5 h-5" />
                <span>Comment</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Repeat2 className="w-5 h-5" />
                <span>Repost</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePost}
            disabled={isPosting || isPosted}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPosted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Posted
              </>
            ) : isPosting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post to LinkedIn"
            )}
          </Button>
        </div>
        
        {/* Error message */}
        {postError && (
          <div className="px-4 pb-4">
            <div className="text-red-500 text-sm">{postError}</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}