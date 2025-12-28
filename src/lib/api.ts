/**
 * API Client for Node.js Backend
 * Replaces Supabase client calls with REST API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle 401 - try refresh token
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
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
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
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
  // GET request
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  
  // POST request
  post: <T>(endpoint: string, data?: unknown) => 
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  // PUT request
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // PATCH request
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // DELETE request
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Auth-specific methods
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await api.post<{
      user: { id: string; email: string; role: string; profile: any; employeeId?: string };
      session: { access_token: string; refresh_token: string };
    }>('/auth/login', { email, password });
    
    setTokens(data.session.access_token, data.session.refresh_token);
    return data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },
  
  getMe: () => api.get<{
    user: { id: string; email: string; role: string };
    profile: any;
    employee: any;
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

// Export token helpers for AuthContext
export { getAccessToken, getRefreshToken, setTokens, clearTokens };

export default api;
