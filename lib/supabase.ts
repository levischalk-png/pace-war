// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials ontbreken in .env.local');
}

// Publieke client (voor client-side gebruik)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client met service role key (bypassed RLS)
// Gebruik deze ALLEEN in API routes / server-side code
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : supabase; // fallback naar anon client als service key ontbreekt

// Type definitions
export interface User {
  id: string;
  strava_athlete_id: string;
  name: string | null;
  email: string | null;
  max_heart_rate: number;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: string;
  user_id: string;
  strava_activity_id: string;
  name: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  average_heartrate: number | null;
  distance_score: number;
  heartrate_score: number;
  consistency_bonus: number;
  total_score: number;
  created_at: string;
}