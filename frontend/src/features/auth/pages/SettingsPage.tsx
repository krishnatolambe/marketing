import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Key, User, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";
import LinkedInSettingsSection from "../components/LinkedInSettingsSection";

export default function SettingsPage() {
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  const [notifications, setNotifications] = useState({
    postReminders: true,
    engagementAlerts: false,
    weeklyReports: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const response = await api.getUserPreferences();
      if (response.success && response.preferences) {
        setNotifications({
          postReminders: response.preferences.notifications.postReminders,
          engagementAlerts: response.preferences.notifications.engagementAlerts,
          weeklyReports: response.preferences.notifications.weeklyReports
        });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      // Use default values if fetch fails
      setNotifications({
        postReminders: true,
        engagementAlerts: false,
        weeklyReports: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      // Redirect to LinkedIn OAuth flow
      await api.connectToLinkedIn();
    } catch (error) {
      console.error("Error connecting to LinkedIn:", error);
      toast.error("Failed to connect to LinkedIn. Please try again.");
    }
  };





  const handleNotificationChange = async (notification: keyof typeof notifications) => {
    const updatedNotifications = {
      ...notifications,
      [notification]: !notifications[notification]
    };
    
    setNotifications(updatedNotifications);
    
    // Update preferences on the backend
    try {
      const response = await api.updateUserPreferences({
        notifications: updatedNotifications
      });
      
      if (response.success) {
        toast.success("Notification preferences updated successfully!");
      } else {
        toast.error(response.message || "Failed to update notification preferences");
        // Revert the change if the update failed
        setNotifications(notifications);
      }
    } catch (error: any) {
      console.error("Error updating notification preferences:", error);
      toast.error(error.message || "Failed to update notification preferences. Please try again.");
      // Revert the change if the update failed
      setNotifications(notifications);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* LinkedIn Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-strong p-8">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">LinkedIn Connection</h2>
              </div>

              <LinkedInSettingsSection 
                onConnect={handleConnectLinkedIn}
                isConnected={linkedinConnected}
              />
            </Card>
          </motion.div>



          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-strong p-8">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between glass p-4 rounded-lg">
                  <div>
                    <p className="font-semibold">Post Reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified before scheduled posts</p>
                  </div>
                  <Switch 
                    checked={notifications.postReminders}
                    onCheckedChange={() => handleNotificationChange('postReminders')}
                  />
                </div>
                <div className="flex items-center justify-between glass p-4 rounded-lg">
                  <div>
                    <p className="font-semibold">Engagement Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications for high-performing posts</p>
                  </div>
                  <Switch 
                    checked={notifications.engagementAlerts}
                    onCheckedChange={() => handleNotificationChange('engagementAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between glass p-4 rounded-lg">
                  <div>
                    <p className="font-semibold">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={() => handleNotificationChange('weeklyReports')}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}