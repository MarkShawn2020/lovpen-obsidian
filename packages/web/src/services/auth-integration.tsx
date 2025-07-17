'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for authentication
interface UniApiUserProfile {
  id: string;
  email: string;
  name?: string;
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UniApiUserProfile;
}

export class AuthIntegrationService {
  private static instance: AuthIntegrationService;
  private baseUrl: string;
  private tokenStorage: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  } = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.loadTokenFromStorage();
  }

  public static getInstance(baseUrl?: string): AuthIntegrationService {
    if (!AuthIntegrationService.instance) {
      AuthIntegrationService.instance = new AuthIntegrationService(baseUrl);
    }
    return AuthIntegrationService.instance;
  }

  private loadTokenFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('uni-api-auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.tokenStorage = parsed;
        } catch (error) {
          console.error('Failed to parse stored auth token:', error);
          this.clearTokenStorage();
        }
      }
    }
  }

  private saveTokenToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uni-api-auth', JSON.stringify(this.tokenStorage));
    }
  }

  private clearTokenStorage() {
    this.tokenStorage = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uni-api-auth');
    }
  }

  public isTokenValid(): boolean {
    const { accessToken, expiresAt } = this.tokenStorage;
    if (!accessToken || !expiresAt) return false;
    
    // Check if token expires within the next 5 minutes
    const bufferTime = 5 * 60 * 1000;
    return Date.now() < (expiresAt - bufferTime);
  }

  public async exchangeClerkTokenForUniApiToken(
    clerkToken: string,
    clerkUserId: string
  ): Promise<TokenExchangeResponse> {
    const response = await fetch(`${this.baseUrl}/account/clerk-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkToken,
        clerkUserId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data: TokenExchangeResponse = await response.json();
    
    // Store the new token
    this.tokenStorage = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (data.expiresIn * 1000),
    };
    
    this.saveTokenToStorage();
    return data;
  }

  public async refreshAccessToken(): Promise<string> {
    const { refreshToken } = this.tokenStorage;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/account/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      this.clearTokenStorage();
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Update stored token
    this.tokenStorage = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
      expiresAt: Date.now() + (data.expiresIn * 1000),
    };
    
    this.saveTokenToStorage();
    return data.accessToken;
  }

  public async getValidAccessToken(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.tokenStorage.accessToken;
    }

    try {
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      this.clearTokenStorage();
      return null;
    }
  }

  public async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getValidAccessToken();
    
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  public clearAuth() {
    this.clearTokenStorage();
  }
}

// React hooks for authentication
export function useUniApiAuth() {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const authService = AuthIntegrationService.getInstance();

  // Query for getting uni-api token
  const { data: authToken, isLoading: isAuthLoading } = useQuery({
    queryKey: ['uniApiAuth', userId],
    queryFn: async () => {
      if (!user || !userId) return null;

      // Check if we have a valid token
      if (authService.isTokenValid()) {
        return await authService.getValidAccessToken();
      }

      // Get Clerk token
      const clerkToken = await getToken();
      if (!clerkToken) return null;

      // Exchange for uni-api token
      const response = await authService.exchangeClerkTokenForUniApiToken(
        clerkToken,
        userId
      );

      return response.accessToken;
    },
    enabled: !!user && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  // Mutation for token exchange
  const exchangeTokenMutation = useMutation({
    mutationFn: async () => {
      if (!user || !userId) throw new Error('User not authenticated');

      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('No Clerk token available');

      return authService.exchangeClerkTokenForUniApiToken(clerkToken, userId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['uniApiAuth', userId], data.accessToken);
    },
    onError: (error) => {
      console.error('Token exchange failed:', error);
      authService.clearAuth();
    },
  });

  // Mutation for token refresh
  const refreshTokenMutation = useMutation({
    mutationFn: () => authService.refreshAccessToken(),
    onSuccess: (newToken) => {
      queryClient.setQueryData(['uniApiAuth', userId], newToken);
    },
    onError: (error) => {
      console.error('Token refresh failed:', error);
      authService.clearAuth();
      queryClient.removeQueries({ queryKey: ['uniApiAuth', userId] });
    },
  });

  // Function to get auth headers
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    return authService.getAuthHeaders();
  };

  // Function to manually refresh token
  const refreshToken = () => {
    refreshTokenMutation.mutate();
  };

  // Function to manually exchange token
  const exchangeToken = () => {
    exchangeTokenMutation.mutate();
  };

  // Function to clear authentication
  const clearAuth = () => {
    authService.clearAuth();
    queryClient.removeQueries({ queryKey: ['uniApiAuth', userId] });
  };

  return {
    authToken,
    isAuthLoading,
    isExchanging: exchangeTokenMutation.isPending,
    isRefreshing: refreshTokenMutation.isPending,
    getAuthHeaders,
    refreshToken,
    exchangeToken,
    clearAuth,
    isAuthenticated: !!authToken,
  };
}

// Hook for uni-api user profile
export function useUniApiUserProfile() {
  const { user } = useUser();
  const { authToken, getAuthHeaders } = useUniApiAuth();

  return useQuery({
    queryKey: ['uniApiUserProfile', user?.id],
    queryFn: async (): Promise<UniApiUserProfile> => {
      const headers = await getAuthHeaders();
      const response = await fetch('http://localhost:8000/account/profile', {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!user && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for checking uni-api user credits
export function useUniApiUserCredits() {
  const profile = useUniApiUserProfile();
  
  return {
    credits: profile.data?.credits || 0,
    isLoading: profile.isLoading,
    error: profile.error,
    refetch: profile.refetch,
  };
}

// Higher-order component for protecting routes that require uni-api authentication
export function withUniApiAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isAuthLoading, exchangeToken } = useUniApiAuth();
    const { user } = useUser();

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to continue</p>
          </div>
        </div>
      );
    }

    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Service Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              Please authenticate with the knowledge base service
            </p>
            <button
              onClick={exchangeToken}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Authenticate
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Export the singleton instance
export const authIntegration = AuthIntegrationService.getInstance();