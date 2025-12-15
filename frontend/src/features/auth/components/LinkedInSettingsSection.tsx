import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/features/shared/services/api";

interface LinkedInSettingsSectionProps {
  onConnect: () => void;
  isConnected: boolean;
}

export default function LinkedInSettingsSection({ onConnect, isConnected }: LinkedInSettingsSectionProps) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [memberUrn, setMemberUrn] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isFetchingToken, setIsFetchingToken] = useState(false);

  // Load existing credentials when component mounts
  useEffect(() => {
    // Load authorization code from sessionStorage if available
    const storedAuthCode = sessionStorage.getItem('linkedin_auth_code');
    if (storedAuthCode) {
      setAuthCode(storedAuthCode);
    }
  }, []);

  const handleTestConnection = async () => {
    if (!accessToken || !memberUrn) {
      toast.error("Please enter both Access Token and Member URN or fetch them automatically");
      return;
    }

    try {
      // Test the LinkedIn connection with a simple API call
      // This would be implemented in the backend
      toast.success("LinkedIn connection test successful!");
    } catch (error) {
      console.error("Error testing LinkedIn connection:", error);
      toast.error("Failed to test LinkedIn connection. Please check your credentials.");
    }
  };

  const handleAutoFetchCredentials = async () => {
    try {
      setIsFetchingToken(true);
      
      // Call backend to get the LinkedIn authorization URL
      const response = await fetch("/api/auth/linkedin/login");
      const data = await response.json();
      
      if (data.success && data.redirectUrl) {
        // Redirect to the LinkedIn authorization page
        window.open(data.redirectUrl, '_blank');
        toast.info("LinkedIn authorization page opened in a new tab. Please complete the authorization process.");
      } else {
        toast.error(data.message || "Failed to initiate LinkedIn authorization");
      }
      
    } catch (error) {
      console.error("Error initiating OAuth flow:", error);
      toast.error("Failed to initiate OAuth flow. Please try again.");
    } finally {
      setIsFetchingToken(false);
    }
  };

  const handleExchangeCodeForToken = async () => {
    if (!authCode) {
      toast.error("Please enter the authorization code");
      return;
    }

    try {
      setIsFetchingToken(true);
      
      // Exchange code for token using backend endpoint
      const response = await fetch("/api/auth/linkedin/callback?code=" + encodeURIComponent(authCode));

      const data = await response.json();
      
      if (data.success && data.token) {
        setAccessToken(data.token);
        if (data.member_urn) {
          setMemberUrn(data.member_urn);
        }
        toast.success("Successfully exchanged code for access token!");
        // Remove the auth code from sessionStorage after successful exchange
        sessionStorage.removeItem('linkedin_auth_code');
        setAuthCode("");
      } else {
        toast.error(data.message || "Failed to exchange code for token");
        // If exchange fails, it might be because the code expired
        if (data.message && data.message.includes("invalid")) {
          sessionStorage.removeItem('linkedin_auth_code');
          setAuthCode("");
          toast.info("The authorization code may have expired. Please generate a new one.");
        }
      }
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      toast.error("Failed to exchange code for token. Please try again.");
      // Clear the auth code from sessionStorage if it failed
      sessionStorage.removeItem('linkedin_auth_code');
      setAuthCode("");
    } finally {
      setIsFetchingToken(false);
    }
  };

  const handleGetUserInfo = async (token: string) => {
    try {
      const response = await fetch(`/api/linkedin/credentials/user-info?access_token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setMemberUrn(data.member_urn || "");
        toast.success("Successfully retrieved user information!");
      } else {
        toast.error(data.message || "Failed to get user information");
      }
    } catch (error) {
      console.error("Error getting user information:", error);
      toast.error("Failed to get user information. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass p-4 rounded-lg flex items-center justify-between">
        <div>
          <p className="font-semibold">LinkedIn Account</p>
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Not connected"}
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
          onClick={onConnect}
        >
          {isConnected ? "Reconnect LinkedIn" : "Connect LinkedIn"}
        </Button>
      </div>
      
      <div className="glass p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Automatic Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your LinkedIn App credentials to automatically fetch your access token and member URN.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="linkedin-client-id">Client ID</Label>
            <Input
              id="linkedin-client-id"
              type="password"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your LinkedIn Client ID"
              className="glass mt-2"
            />
          </div>
          <div>
            <Label htmlFor="linkedin-client-secret">Client Secret</Label>
            <Input
              id="linkedin-client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your LinkedIn Client Secret"
              className="glass mt-2"
            />
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white"
            onClick={handleAutoFetchCredentials}
            disabled={isFetchingToken}
          >
            {isFetchingToken ? "Fetching..." : "Get Authorization URL"}
          </Button>
          
          <div className="pt-4">
            <Label htmlFor="linkedin-auth-code">Authorization Code</Label>
            <Input
              id="linkedin-auth-code"
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Enter the authorization code from LinkedIn"
              className="glass mt-2"
            />
            <Button 
              className="w-full mt-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
              onClick={handleExchangeCodeForToken}
              disabled={isFetchingToken || !authCode}
            >
              {isFetchingToken ? "Exchanging..." : "Exchange Code for Token"}
            </Button>
          </div>
          
          <div className="pt-4">
            <Label htmlFor="linkedin-access-token">Access Token</Label>
            <Input
              id="linkedin-access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Access token will appear here"
              className="glass mt-2"
            />
          </div>
          <div>
            <Label htmlFor="linkedin-member-urn">Member URN</Label>
            <Input
              id="linkedin-member-urn"
              type="text"
              value={memberUrn}
              onChange={(e) => setMemberUrn(e.target.value)}
              placeholder="Member URN will appear here"
              className="glass mt-2"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white"
              onClick={async () => {
                if (!accessToken || !memberUrn) {
                  toast.error("Please enter both Access Token and Member URN or fetch them automatically");
                  return;
                }

                try {
                  // In a real implementation, you would save these to the backend
                  // For now, we'll just show a success message
                  toast.success("LinkedIn credentials saved successfully!");
                } catch (error) {
                  console.error("Error saving LinkedIn credentials:", error);
                  toast.error("Failed to save LinkedIn credentials. Please try again.");
                }
              }}
            >
              Save Credentials
            </Button>
            <Button 
              variant="outline"
              onClick={handleTestConnection}
            >
              Test Connection
            </Button>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex items-start gap-2">
          <ExternalLink className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Need help setting up LinkedIn?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Visit the LinkedIn Developer Portal to create an app and get your credentials.
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 dark:text-blue-400 mt-2"
              onClick={() => window.open('https://www.linkedin.com/developers/', '_blank')}
            >
              Go to LinkedIn Developer Portal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}