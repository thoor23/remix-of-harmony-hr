/**
 * API Client for Edge Functions Backend
 * Calls Supabase Edge Functions for all operations
 * Supports environment switching between Lovable Cloud and VPS Testing
 */

import { getSupabaseUrl } from '@/integrations/supabase/env-switcher';
import { supabase } from '@/integrations/supabase/client';

// Dynamic Supabase URL based on environment
const getBaseUrl = () => getSupabaseUrl();

// Map endpoint to edge function name
function getEdgeFunctionUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  
  // Separate path from query string
  const [pathPart, queryString] = endpoint.split('?');
  
  // Remove leading slash
  const path = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  const parts = path.split('/');
  const resource = parts[0];
  const subPath = parts.slice(1).join('/');
  
  // Map resource to edge function
  const functionName = `api-${resource}`;
  const fullPath = subPath ? `/${subPath}` : '';
  const query = queryString ? `?${queryString}` : '';
  
  return `${baseUrl}/functions/v1/${functionName}${fullPath}${query}`;
}

// Get access token from Supabase session
const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Request helper with auth
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const url = getEdgeFunctionUrl(endpoint);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
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

export default api;
