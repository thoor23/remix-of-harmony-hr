/**
 * VPS Self-Hosted Supabase Client
 * For testing purposes only - connects to self-hosted Supabase instance
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// VPS Supabase Configuration
const VPS_SUPABASE_URL = "https://hrms.thorodin.online";
const VPS_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3MjA0Mzc2LCJleHAiOjIwODI1NjQzNzZ9.0XtZ3-ZCJELOv6BsYG5LpI_0W-KNcxNwBv3H0C5Px7Y";

export const vpsSupabase = createClient<Database>(VPS_SUPABASE_URL, VPS_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const VPS_CONFIG = {
  url: VPS_SUPABASE_URL,
  anonKey: VPS_ANON_KEY,
};
