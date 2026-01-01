/**
 * API Client - Temporary stub for migration
 * This file is being phased out - hooks are being migrated to direct Supabase calls
 */

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Get access token from Supabase session
const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Request helper with auth - calls edge functions
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  // Separate path from query string
  const [pathPart, queryString] = endpoint.split('?');
  const path = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  const parts = path.split('/');
  const resource = parts[0];
  const subPath = parts.slice(1).join('/');
  
  const functionName = `api-${resource}`;
  const fullPath = subPath ? `/${subPath}` : '';
  const query = queryString ? `?${queryString}` : '';
  
  const url = `${SUPABASE_URL}/functions/v1/${functionName}${fullPath}${query}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
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
