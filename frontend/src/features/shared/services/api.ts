// API service for communicating with the backend
const API_BASE_URL = '/api';

// Auto-login credentials for development
const AUTO_LOGIN_CREDENTIALS = {
  username: 'testuser',
  password: 'testpass123'
};

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiService {
  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error: ApiError = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      
      try {
        error.data = await response.json();
      } catch (e) {
        // If parsing JSON fails, use text instead
        error.data = await response.text();
      }
      
      throw error;
    }
    
    return await response.json();
  }

  private async ensureAuthenticated() {
    // Check if we have a valid token
    const token = localStorage.getItem('token');
    if (token) {
      // Test the token by making a simple authenticated request
      try {
        const testResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (testResponse.ok) {
          return token;
        } else {
          // Token is invalid or expired, remove it
          console.log('Token is invalid or expired, removing it');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        console.log('Token validation failed, removing token');
        localStorage.removeItem('token');
      }
    }

    // No valid token, try to login automatically
    console.log('Attempting auto-login with credentials:', AUTO_LOGIN_CREDENTIALS);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AUTO_LOGIN_CREDENTIALS),
      });

      console.log('Auto-login response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Auto-login successful, received token:', data.access_token ? '***' : 'null');
        const newToken = data.access_token;
        localStorage.setItem('token', newToken);
        return newToken;
      } else {
        const errorText = await response.text();
        console.error('Auto-login failed:', response.status, response.statusText, errorText);
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      throw error;
    }
  }
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for AI operations
    
    // For authentication endpoints that don't require auth headers, don't add auth headers
    const isAuthEndpointWithoutAuth = endpoint === '/auth/login' || endpoint === '/auth/register' || endpoint === '/analytics/best-times';    
    let config: RequestInit = {
      signal: controller.signal,
      ...options,
    };

    // Add authorization header for non-auth endpoints
    if (!isAuthEndpointWithoutAuth) {
      try {
        const token = await this.ensureAuthenticated();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      } catch (error) {
        console.error('Failed to authenticate:', error);
        throw new Error('Authentication required');
      }
    }

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      return this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async register(userData: { username: string; email: string; password: string; role?: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Content endpoints
  async generatePost(promptData: any) {
    try {
      return await this.request('/content/generate', {
        method: 'POST',
        body: JSON.stringify(promptData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in generatePost:', error);
      // If it's a timeout error, provide a more user-friendly message
      if (error.message && error.message.includes('timeout')) {
        throw new Error('Content generation is taking longer than expected. Please try again.');
      }
      throw error;
    }
  }

  async savePost(postData: { content: string; hashtags?: string[]; imageUrl?: string }) {
    // Send data as JSON directly
    const payload = {
      content: postData.content,
      hashtags: postData.hashtags || [],
      imageUrl: postData.imageUrl || null
    };
    
    // Ensure imageUrl is either a valid URL or null
    if (payload.imageUrl && !payload.imageUrl.startsWith('http')) {
      payload.imageUrl = null;
    }
    
    return this.request('/content/save', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // LinkedIn endpoints
  async connectToLinkedIn() {
    // This will redirect the user to LinkedIn for authentication
    window.location.href = '/api/auth/linkedin/login';
  }

  async postToLinkedIn(postId: string) {
    return this.request('/linkedin/post', {
      method: 'POST',
      body: JSON.stringify({ postId }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getPostEngagement(postId: string) {
    return this.request(`/analytics/${postId}/engagement`);
  }

  // Schedule endpoints
  async schedulePost(scheduleData: { postId: string; scheduledAt: string }) {
    return this.request('/schedule/', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateScheduledPost(scheduledPostId: string, scheduleData: { scheduledAt: string }) {
    return this.request(`/schedule/${scheduledPostId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateScheduledPostWithContent(scheduledPostId: string, data: { scheduledAt: string; content: string; hashtags?: string[] }) {
    try {
      // Validate input data
      if (!scheduledPostId || !data.scheduledAt || data.content === undefined) {
        throw new Error('Missing required fields for updating scheduled post');
      }
      
      return this.request(`/schedule/${scheduledPostId}/content`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in updateScheduledPostWithContent:', error);
      throw error;
    }
  }

  async deleteScheduledPost(scheduledPostId: string) {
    try {
      // Validate input
      if (!scheduledPostId) {
        throw new Error('Scheduled post ID is required');
      }
      
      return this.request(`/schedule/${scheduledPostId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in deleteScheduledPost:', error);
      throw error;
    }
  }

  async getScheduledPosts() {
    return this.request('/schedule/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Analytics endpoints
  async getPostAnalytics(postId: string) {
    return this.request(`/analytics/${postId}`, {
      method: 'GET',
    });
  }

  async getBestPostingTimes() {
    return this.request('/analytics/best-times', {
      method: 'GET',
    });
  }

  // User preference endpoints
  async getUserPreferences() {
    return this.request('/auth/preferences', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateUserPreferences(preferences: any) {
    return this.request('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health', {
      method: 'GET',
    });
  }
}

export const api = new ApiService();