/**
 * API Client for Edge Functions Backend
 * Calls Supabase Edge Functions for all operations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Map endpoint to edge function name
function getEdgeFunctionUrl(endpoint: string): string {
  // Remove leading slash
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const parts = path.split('/');
  const resource = parts[0];
  const subPath = parts.slice(1).join('/');
  
  // Map resource to edge function
  const functionName = `api-${resource}`;
  const fullPath = subPath ? `/${subPath}` : '';
  
  return `${SUPABASE_URL}/functions/v1/${functionName}${fullPath}`;
}

// Request helper with auth
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const url = getEdgeFunctionUrl(endpoint);
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 - try refresh token
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        throw new Error(await retryResponse.text());
      }
      return retryResponse.json();
    }
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

// Refresh access token
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      clearTokens();
      return false;
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// API methods
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) => 
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Auth-specific methods
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await response.json();
    setTokens(data.session.access_token, data.session.refresh_token);
    return data;
  },
  
  logout: async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await fetch(`${SUPABASE_URL}/functions/v1/api-auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } finally {
      clearTokens();
    }
  },
  
  getMe: () => api.get<{
    user: { id: string; email: string; role: string };
    profile: Record<string, unknown>;
    employee: Record<string, unknown>;
  }>('/auth/me'),
  
  register: (email: string, password: string, firstName?: string, lastName?: string, role?: string) =>
    api.post('/auth/register', { email, password, firstName, lastName, role }),
  
  refresh: refreshAccessToken,
  isAuthenticated: () => !!getAccessToken(),
  getTokens: () => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  }),
  clearTokens,
  setTokens,
};

export { getAccessToken, getRefreshToken, setTokens, clearTokens };
export default api;
