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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-gray-700"
      >
        {/* Header with enhanced gradient */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </div>
            <span>LinkedIn Post Preview</span>
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Unified Slider Container */}
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  {/* LinkedIn-style post header with enhanced styling */}
                  <div className="flex items-start gap-4 mb-5 pb-4 border-b border-slate-200 dark:border-gray-700">
                    <Avatar className="w-14 h-14 ring-2 ring-white dark:ring-gray-800 shadow-md">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white font-bold">U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Your Name</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Job Title • Company</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Just now</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Public
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Post content with enhanced styling */}
                  <div className="mb-5 whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                    {content}
                  </div>

                  {/* Hashtags with enhanced styling */}
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hashtags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Post image with enhanced styling */}
                  {imageUrl && (
                    <div className="rounded-xl overflow-hidden mb-5 border border-slate-200 dark:border-gray-700 shadow-sm">
                      <img 
                        src={imageUrl} 
                        alt="Post content" 
                        className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Engagement metrics with enhanced styling */}
                  <div className="flex items-center justify-between py-3 text-sm text-gray-500 dark:text-gray-400 border-y border-slate-200 dark:border-gray-700 mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800"></div>
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                        <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <span className="ml-1">0 likes</span>
                    </div>
                    <span>0 comments • 0 reposts</span>
                  </div>

                  {/* Action buttons with enhanced styling */}
                  <div className="grid grid-cols-4 py-2 border-y border-slate-200 dark:border-gray-700">
                    <button className="flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="hidden sm:inline">Like</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">Comment</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      <Repeat2 className="w-5 h-5" />
                      <span className="hidden sm:inline">Repost</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer with better button styling */}
            <div className="flex items-center justify-end gap-4 p-5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/30">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePost}
                disabled={isPosting || isPosted}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
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
              <div className="px-5 pb-4">
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Error
                  </div>
                  {postError}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}