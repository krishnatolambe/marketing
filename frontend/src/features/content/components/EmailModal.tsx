import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Mail, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";

interface EmailModalProps {
  postId: string;
  content: string;
  imageUrl?: string | null;
  onClose: () => void;
  onEmail: () => void;
}

export default function EmailModal({ 
  postId, 
  content, 
  imageUrl,
  onClose,
  onEmail
}: EmailModalProps) {
  const [toEmails, setToEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Extract hashtags from content
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const hashtags = extractHashtags(content);

  const handleSendEmail = async () => {
    if (!toEmails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    // Validate email addresses
    const emailArray = toEmails.split(",").map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of emailArray) {
      if (!emailRegex.test(email)) {
        toast.error(`Invalid email address: ${email}`);
        return;
      }
    }

    setIsSending(true);
    try {
      const response = await api.emailPost({
        postId,
        toEmails: emailArray,
        subject: subject || undefined
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Email sent successfully!");
      onEmail();
      onClose();
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

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
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span>Email Composer</span>
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
              <div className="p-6 space-y-8">
                {/* Email Settings Section with enhanced styling */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-slate-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      Email Settings
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-11">Configure recipients and subject for your email</p>
                  </div>
                  
                  <div className="space-y-5 bg-slate-50 dark:bg-gray-900/50 p-5 rounded-xl border border-slate-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <Label htmlFor="toEmails" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4 text-blue-500" />
                        Recipients
                      </Label>
                      <Input
                        id="toEmails"
                        placeholder="recipient@example.com"
                        value={toEmails}
                        onChange={(e) => setToEmails(e.target.value)}
                        className="mt-2 border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg py-3 px-4 text-base shadow-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        Separate multiple emails with commas
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Check out this LinkedIn post!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-2 border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg py-3 px-4 text-base shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Email Preview Section with enhanced styling */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-slate-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Email Preview
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-11">Review how your email will appear to recipients</p>
                  </div>
                  
                  {/* Enhanced Email Preview Container */}
                  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-slate-300 dark:border-gray-700 overflow-hidden shadow-lg">
                    {/* Email header bar */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Email Preview
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="hidden sm:inline">Powered by</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">LinkedIn AutoMarketer AI</span>
                      </div>
                    </div>

                    {/* Email preview container - mimics email client view */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg border-0 overflow-hidden">
                      {/* Email header - mimics email client header */}
                      <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700 rounded-t-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{subject || "AI-Generated LinkedIn Post"}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">From: LinkedIn AutoMarketer &lt;noreply@linkedin-automarketer.com&gt;</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{new Date().toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">To:</span> {toEmails || "recipient@example.com"}
                          </p>
                        </div>
                      </div>
                    
                      {/* Subject line in email body */}
                      <div className="px-6 pt-4 border-b border-slate-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{subject || "AI-Generated LinkedIn Post"}</span>
                        </div>
                      </div>
                      
                      {/* Email body - styled like email content */}
                      <div className="p-6">
                        <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
                          {content}
                        </div>
                        
                        {/* Hashtags section */}
                        {hashtags.length > 0 && (
                          <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Hash className="w-4 h-4 text-blue-500" />
                              Suggested Hashtags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {hashtags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                  <Hash className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Post image - styled like email attachment */}
                        {imageUrl && (
                          <div className="mt-6 border-t border-slate-200 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                              Attached Image
                            </h4>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 shadow-sm">
                              <img 
                                src={imageUrl} 
                                alt="Post content" 
                                className="w-full h-auto object-contain max-h-80 transition-transform hover:scale-105 duration-300"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Email signature/footer */}
                      <div className="px-6 pb-6">
                        <div className="border-t border-slate-200 dark:border-gray-700 pt-4 mt-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Automated Message</span>
                                <br />
                                This email was automatically generated by LinkedIn AutoMarketer AI. 
                                The content was created using artificial intelligence.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}