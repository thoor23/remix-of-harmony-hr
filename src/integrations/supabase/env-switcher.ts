/**
 * Environment Switcher Utility
 * Manages switching between Lovable Cloud and VPS testing environments
 */

export type SupabaseEnvironment = 'cloud' | 'vps';

const ENV_STORAGE_KEY = 'supabase_env';

export const getActiveEnvironment = (): SupabaseEnvironment => {
  return (localStorage.getItem(ENV_STORAGE_KEY) as SupabaseEnvironment) || 'cloud';
};

export const setActiveEnvironment = (env: SupabaseEnvironment): void => {
  localStorage.setItem(ENV_STORAGE_KEY, env);
  // Reload to apply changes across the app
  window.location.reload();
};

export const getEnvironmentLabel = (env: SupabaseEnvironment): string => {
  return env === 'cloud' ? 'Lovable Cloud (Production)' : 'VPS Testing';
};

export const getEnvironmentColor = (env: SupabaseEnvironment): string => {
  return env === 'cloud' ? 'bg-green-500' : 'bg-orange-500';
};

// Get the base URL for edge functions based on environment
export const getEdgeFunctionBaseUrl = (): string => {
  const env = getActiveEnvironment();
  if (env === 'vps') {
    return 'https://hrms.thorodin.online/functions/v1';
  }
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
};

// Get the Supabase URL based on environment
export const getSupabaseUrl = (): string => {
  const env = getActiveEnvironment();
  if (env === 'vps') {
    return 'https://hrms.thorodin.online';
  }
  return import.meta.env.VITE_SUPABASE_URL;
};
