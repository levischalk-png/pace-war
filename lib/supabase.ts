// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Vercel: zet deze in Environment Variables (zelfde namen)
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY  (nodig voor server-side writes, o.a. Strava callback)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials ontbreken. Zet NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local of Vercel Environment Variables.'
  );
}

// Publieke client (voor client-side gebruik)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client met service role key (bypast RLS). Vereist voor o.a. getOrCreateUser in Strava callback.
if (
  typeof process !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !supabaseServiceRoleKey
) {
  console.error(
    '[Supabase] SUPABASE_SERVICE_ROLE_KEY ontbreekt op Vercel. Zet deze in Project → Settings → Environment Variables. Zonder deze key falen database-writes (bijv. na Strava login).'
  );
}

export const supabaseAdmin =
  supabaseServiceRoleKey && supabaseServiceRoleKey.length > 0
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : supabase;

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