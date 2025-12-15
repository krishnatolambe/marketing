import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export default function LinkedInCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse the authorization code from the URL
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      toast.error(`LinkedIn OAuth error: ${error}`);
      navigate('/settings');
      return;
    }
    
    if (!code) {
      toast.error("No authorization code received from LinkedIn");
      navigate('/settings');
      return;
    }
    
    // Store the code in sessionStorage instead of localStorage for better security
    // and automatic cleanup when the tab is closed
    sessionStorage.setItem('linkedin_auth_code', code);
    toast.success("Authorization code received! Please enter this code in the LinkedIn settings.");
    
    // Navigate back to settings
    navigate('/settings');
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Processing LinkedIn authorization...</p>
      </div>
    </div>
  );
}