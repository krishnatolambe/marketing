import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, RefreshCw, Send, Save, Calendar, Image as ImageIcon, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";
import ScheduleModal from "@/features/scheduler/components/ScheduleModal";
import LinkedInPostPreview from "@/features/content/components/LinkedInPostPreview";
import EmailModal from "@/features/content/components/EmailModal";

export default function Generate() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmailComplete = () => {
    // This function can be used to handle any post-email actions
    console.log("Email sent successfully");
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generatePost({ topic, tone, audience });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      // Assuming the backend returns an array of posts, we'll use the first one
      const postContent = Array.isArray(response.posts) ? response.posts[0] : response.posts;
      setGeneratedPost(postContent);
      // Reset saved post ID when generating a new post
      setSavedPostId(null);
      toast.success("Post generated successfully!");
    } catch (error: any) {
      console.error("Error generating post:", error);
      if (error.message && error.message.includes('timeout')) {
        toast.error("Content generation is taking longer than expected. The AI model might still be loading or processing. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to generate post. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    
    navigator.clipboard.writeText(generatedPost);
    toast.success("Copied to clipboard!");
  };

  const handleSave = async () => {
    if (!generatedPost.trim()) {
      toast.error("Please generate a post first");
      return;
    }

    try {
      const response = await api.savePost({ 
        content: generatedPost,
        imageUrl: previewUrl || undefined
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setSavedPostId(response.post._id);
      toast.success("Post saved successfully!");
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message || "Failed to save post. Please try again.");
    }
  };

  const handleSchedule = async () => {
    if (!generatedPost.trim()) {
      toast.error("Please generate a post first");
      return;
    }

    // If post is not saved yet, save it first
    let postId = savedPostId;
    if (!postId) {
      try {
        const response = await api.savePost({ 
          content: generatedPost,
          imageUrl: previewUrl || undefined
        });
        
        if (response.error) {
          toast.error(response.error);
          return;
        }
        
        postId = response.post._id;
        setSavedPostId(postId);
      } catch (error: any) {
        console.error("Error saving post:", error);
        toast.error(error.message || "Failed to save post. Please try again.");
        return;
      }
    }

    // Show schedule modal with the saved post
    setShowScheduleModal(true);
  };

  const handleScheduleComplete = () => {
    // Close the schedule modal
    setShowScheduleModal(false);
    // Refresh scheduled posts
    refreshScheduledPosts();
    
    // Dispatch event to update dashboard stats
    window.dispatchEvent(new CustomEvent('postPublished', { detail: { scheduled: true } }));
  };

  const handlePostClick = () => {
    if (!generatedPost.trim()) {
      toast.error("Please generate a post first");
      return;
    }
    
    // Show the LinkedIn post preview
    setShowPreview(true);
  };

  const handlePostConfirm = async () => {
    try {
      // If post is not saved yet, save it first
      let postId = savedPostId;
      if (!postId) {
        const response = await api.savePost({ 
          content: generatedPost,
          imageUrl: previewUrl || undefined
        });
        
        if (response.error) {
          toast.error(response.error);
          return;
        }

        postId = response.post._id;
        setSavedPostId(postId);
      }

      // Post to LinkedIn using the API
      const result = await api.postToLinkedIn(postId);
      
      if (result.success) {
        toast.success("Post published to LinkedIn successfully!");
        setShowPreview(false);
        
        // Dispatch event to update dashboard stats
        window.dispatchEvent(new CustomEvent('postPublished', { detail: { scheduled: false } }));
      } else {
        toast.error(result.message || "Failed to post to LinkedIn. Please try again.");
      }
    } catch (error: any) {
      console.error("Error posting to LinkedIn:", error);
      toast.error(error.message || "Failed to post to LinkedIn. Please try again.");
    }
  };

  const handleEmailClick = async () => {
    if (!generatedPost.trim()) {
      toast.error("Please generate a post first");
      return;
    }

    // If post is not saved yet, save it first
    let postId = savedPostId;
    if (!postId) {
      try {
        const response = await api.savePost({ 
          content: generatedPost,
          imageUrl: previewUrl || undefined
        });
        
        if (response.error) {
          toast.error(response.error);
          return;
        }
        
        postId = response.post._id;
        setSavedPostId(postId);
      } catch (error: any) {
        console.error("Error saving post:", error);
        toast.error(error.message || "Failed to save post. Please try again.");
        return;
      }
    }

    // Show email modal
    setShowEmailModal(true);
  };

  const refreshScheduledPosts = () => {
    // Dispatch a custom event to notify the Schedule page to refresh
    window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Listen for scheduled posts updates from other components
  useEffect(() => {
    const handleScheduledPostsUpdate = () => {
      // This component doesn't need to do anything when scheduled posts are updated
      // But we keep this listener to avoid memory leaks
    };

    window.addEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    return () => {
      window.removeEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">AI Content Generator</h1>
          <p className="text-muted-foreground">Create engaging LinkedIn posts in seconds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl p-8 space-y-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Post Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="E.g., AI in marketing, productivity tips..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="glass mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="glass mt-2">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Audience</Label>
                  <Input
                    id="audience"
                    placeholder="E.g., entrepreneurs, developers..."
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="glass mt-2"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Image (Optional)</Label>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={triggerFileInput}
                      className="w-full glass border-dashed border-gray-300 hover:border-primary"
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Click to upload image
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white glow-cyan"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>
          </motion.div>

          {/* Generated Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Generated Post</h2>
              {generatedPost && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="glass hover:glow-cyan"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="glass hover:glow-purple"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {generatedPost ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Textarea
                  value={generatedPost}
                  onChange={(e) => setGeneratedPost(e.target.value)}
                  className="glass min-h-[400px] resize-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="glass border-primary text-primary hover:bg-primary/20 glow-cyan"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSchedule}
                    className="glass border-primary text-primary hover:bg-primary/20 glow-cyan"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePostClick}
                    className="glass border-primary text-primary hover:bg-primary/20 glow-cyan"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEmailClick}
                    className="glass border-primary text-primary hover:bg-primary/20 glow-cyan"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-4">
                  <Sparkles className="w-16 h-16 mx-auto opacity-50" />
                  <p>Your generated post will appear here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {showScheduleModal && (
          <ScheduleModal
            postId={savedPostId || ""}
            content={generatedPost}
            onClose={() => setShowScheduleModal(false)}
            onSchedule={handleScheduleComplete}
          />
        )}

        {showPreview && (
          <LinkedInPostPreview
            content={generatedPost}
            imageUrl={previewUrl}
            onClose={() => setShowPreview(false)}
            onPost={handlePostConfirm}
          />
        )}

        {showEmailModal && savedPostId && (
          <EmailModal
            postId={savedPostId}
            content={generatedPost}
            imageUrl={previewUrl}
            onClose={() => setShowEmailModal(false)}
            onEmail={handleEmailComplete}
          />
        )}
      </motion.div>
    </div>
  );
}