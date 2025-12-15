import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";

export default function LinkedInSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // In a real implementation, you would check if the user has LinkedIn credentials
      // For now, we'll check if the environment variables are set
      const accessToken = import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN;
      const memberUrn = import.meta.env.VITE_LINKEDIN_MEMBER_URN;
      
      if (accessToken && memberUrn) {
        setIsConnected(true);
        // Fetch user profile
        // setProfile({ name: "John Doe", email: "john@example.com" });
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setIsConnected(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      // Redirect to LinkedIn OAuth
      await api.connectToLinkedIn();
    } catch (error: any) {
      console.error("Error connecting to LinkedIn:", error);
      toast.error(error.message || "Failed to connect to LinkedIn. Please try again.");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would remove the LinkedIn credentials from the user's account
      // For now, we'll just simulate the disconnection
      setIsConnected(false);
      setProfile(null);
      toast.success("Disconnected from LinkedIn successfully");
    } catch (error: any) {
      console.error("Error disconnecting from LinkedIn:", error);
      toast.error(error.message || "Failed to disconnect from LinkedIn. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">LinkedIn Integration</h3>
        <p className="text-muted-foreground">
          Connect your LinkedIn account to publish posts directly from the app
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Connection</CardTitle>
          <CardDescription>
            Connect your LinkedIn account to enable posting directly to your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connected to LinkedIn</h4>
                  {profile && (
                    <p className="text-sm text-muted-foreground">
                      {profile.name} ({profile.email})
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
              <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your LinkedIn account is connected. You can now post directly to LinkedIn from the app.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Not Connected</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect your LinkedIn account to enable posting
                  </p>
                </div>
                <Button onClick={handleConnect} disabled={loading}>
                  {loading ? "Connecting..." : "Connect to LinkedIn"}
                </Button>
              </div>
              <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You need to connect your LinkedIn account to post directly to LinkedIn.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Test LinkedIn Posting</CardTitle>
            <CardDescription>
              Test posting to your LinkedIn account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-post">Test Post Content</Label>
              <Input
                id="test-post"
                placeholder="Enter test post content"
                defaultValue="This is a test post from LinkedIn AutoMarketer AI"
              />
            </div>
            <Button>Post to LinkedIn</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}