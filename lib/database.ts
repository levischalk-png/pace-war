// lib/database.ts
import { supabaseAdmin as supabase, User, Run } from './supabase';
import { getWeekInfo } from './scoreCalculator';

/**
 * Haal of maak een gebruiker aan op basis van Strava Athlete ID
 */
export async function getOrCreateUser(
  stravaAthleteId: string,
  name?: string,
  email?: string
): Promise<User | null> {
  try {
    // Check of gebruiker al bestaat
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('strava_athlete_id', stravaAthleteId)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Maak nieuwe gebruiker aan
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        strava_athlete_id: stravaAthleteId,
        name: name || null,
        email: email || null,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Fout bij aanmaken gebruiker:', createError);
      return null;
    }

    return newUser;
  } catch (error) {
    console.error('Database fout:', error);
    return null;
  }
}

/**
 * Check of een run al in de database staat
 */
export async function runExists(stravaActivityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('runs')
    .select('id')
    .eq('strava_activity_id', stravaActivityId)
    .single();

  return !!data;
}

/**
 * Tel hoeveel runs een gebruiker al heeft gedaan deze week
 */
export async function countRunsThisWeek(
  userId: string,
  currentRunDate: Date
): Promise<number> {
  const weekInfo = getWeekInfo(currentRunDate);
  
  // Start van deze week (maandag 00:00)
  const startOfWeek = new Date(currentRunDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('runs')
    .select('id')
    .eq('user_id', userId)
    .gte('start_date', startOfWeek.toISOString())
    .lt('start_date', currentRunDate.toISOString());

  if (error) {
    console.error('Fout bij tellen runs deze week:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Sla een nieuwe run op in de database
 */
export async function saveRun(runData: {
  userId: string;
  stravaActivityId: string;
  name: string;
  startDate: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  averageHeartrate: number | null;
  distanceScore: number;
  heartrateScore: number;
  consistencyBonus: number;
  totalScore: number;
}): Promise<Run | null> {
  try {
    const { data, error } = await supabase
      .from('runs')
      .insert({
        user_id: runData.userId,
        strava_activity_id: runData.stravaActivityId,
        name: runData.name,
        start_date: runData.startDate,
        distance_meters: runData.distanceMeters,
        moving_time_seconds: runData.movingTimeSeconds,
        average_heartrate: runData.averageHeartrate,
        distance_score: runData.distanceScore,
        heartrate_score: runData.heartrateScore,
        consistency_bonus: runData.consistencyBonus,
        total_score: runData.totalScore
      })
      .select()
      .single();

    if (error) {
      // Als het een duplicate is, negeer de fout
      if (error.code === '23505') {
        console.log('Run bestaat al, wordt overgeslagen');
        return null;
      }
      console.error('Fout bij opslaan run:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database fout bij opslaan:', error);
    return null;
  }
}

/**
 * Haal alle runs van een gebruiker op, gesorteerd op datum
 */
export async function getUserRuns(userId: string): Promise<Run[]> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Fout bij ophalen runs:', error);
    return [];
  }

  return data || [];
}

/**
 * Bereken totale score van een gebruiker
 */
export async function getUserTotalScore(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('runs')
    .select('total_score')
    .eq('user_id', userId);

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, run) => sum + (run.total_score || 0), 0);
}

/**
 * Haal het volledige leaderboard op (alle gebruikers met hun totale scores)
 */
export async function getLeaderboard(): Promise<Array<{
  id: string;
  name: string;
  totalScore: number;
  runCount: number;
}>> {
  try {
    // Haal alle gebruikers op
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, strava_athlete_id');

    if (usersError || !users) {
      console.error('Fout bij ophalen gebruikers:', usersError);
      return [];
    }

    // Voor elke gebruiker, bereken de totale score
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        // Haal alle runs van deze gebruiker
        const { data: runs, error: runsError } = await supabase
          .from('runs')
          .select('total_score')
          .eq('user_id', user.id);

        if (runsError || !runs) {
          return {
            id: user.id,
            name: user.name || `Atleet ${user.strava_athlete_id}`,
            totalScore: 0,
            runCount: 0
          };
        }

        // Bereken totale score
        const totalScore = runs.reduce((sum, run) => sum + (run.total_score || 0), 0);

        return {
          id: user.id,
          name: user.name || `Atleet ${user.strava_athlete_id}`,
          totalScore: Math.round(totalScore * 100) / 100,
          runCount: runs.length
        };
      })
    );

    // Sorteer van hoog naar laag
    return leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

  } catch (error) {
    console.error('Fout bij ophalen leaderboard:', error);
    return [];
  }
}