// app/api/strava/sync-scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { 
  getOrCreateUser, 
  runExists, 
  countRunsThisWeek, 
  saveRun,
  getUserTotalScore 
} from '@/lib/database';
import { calculateRunScore } from '@/lib/scoreCalculator';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Start Score Sync ===');
    
    // Haal cookies op
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const stravaAthleteId = cookieStore.get('strava_athlete_id')?.value;
    const userId = cookieStore.get('user_id')?.value;

    console.log('Access token:', !!accessToken);
    console.log('Athlete ID:', stravaAthleteId);
    console.log('User ID:', userId);

    if (!accessToken || !stravaAthleteId || !userId) {
      console.log('❌ Niet ingelogd');
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    // Haal gebruiker op uit database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Gebruiker niet gevonden:', userError);
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden in database' },
        { status: 404 }
      );
    }

    console.log('✅ Gebruiker gevonden:', user.name);
    console.log('📅 Joined at:', user.joined_at);

    // Haal activiteiten op van Strava
    console.log('📡 Haal activiteiten op van Strava...');
    const stravaResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!stravaResponse.ok) {
      console.error('❌ Strava API fout:', stravaResponse.status);
      throw new Error('Kon activiteiten niet ophalen van Strava');
    }

    const activities = await stravaResponse.json();
    console.log(`📊 ${activities.length} activiteiten gevonden op Strava`);

    // Filter alleen runs die NA joined_at zijn
    const joinedAtDate = new Date(user.joined_at);
    const validRuns = activities.filter((activity: any) => {
      const activityDate = new Date(activity.start_date);
      return (
        activity.type === 'Run' && 
        activityDate > joinedAtDate
      );
    });

    console.log(`✅ ${validRuns.length} geldige runs (na ${joinedAtDate.toLocaleDateString('nl-NL')})`);

    let newRunsCount = 0;
    let skippedRunsCount = 0;

    // Verwerk elke run
    for (const activity of validRuns) {
      // Check of run al bestaat in database
      const exists = await runExists(activity.id.toString());
      
      if (exists) {
        skippedRunsCount++;
        continue; // Sla deze run over
      }

      // Tel hoeveel runs deze week al zijn gedaan
      const activityDate = new Date(activity.start_date);
      const runsThisWeek = await countRunsThisWeek(userId, activityDate);

      console.log(`📝 Verwerk run: ${activity.name}`);
      console.log(`   Afstand: ${(activity.distance / 1000).toFixed(2)} km`);
      console.log(`   Runs deze week (voor deze): ${runsThisWeek}`);

      // Bereken score
      const scoreBreakdown = calculateRunScore(
        activity.distance,
        activity.moving_time,
        activity.average_heartrate || null,
        user.max_heart_rate,
        runsThisWeek
      );

      console.log(`   💯 Score breakdown:`);
      console.log(`      Afstand: ${scoreBreakdown.distanceScore}`);
      console.log(`      Hartslag: ${scoreBreakdown.heartrateScore}`);
      console.log(`      Bonus: ${scoreBreakdown.consistencyBonus}`);
      console.log(`      Totaal: ${scoreBreakdown.totalScore}`);

      // Sla run op in database
      const savedRun = await saveRun({
        userId: userId,
        stravaActivityId: activity.id.toString(),
        name: activity.name,
        startDate: activity.start_date,
        distanceMeters: activity.distance,
        movingTimeSeconds: activity.moving_time,
        averageHeartrate: activity.average_heartrate || null,
        distanceScore: scoreBreakdown.distanceScore,
        heartrateScore: scoreBreakdown.heartrateScore,
        consistencyBonus: scoreBreakdown.consistencyBonus,
        totalScore: scoreBreakdown.totalScore
      });

      if (savedRun) {
        newRunsCount++;
        console.log(`✅ Run opgeslagen!`);
      } else {
        console.log(`⚠️  Run niet opgeslagen (mogelijk duplicate)`);
      }
    }

    // Bereken totale score
    const totalScore = await getUserTotalScore(userId);

    console.log('=== Sync Compleet ===');
    console.log(`📊 Nieuwe runs: ${newRunsCount}`);
    console.log(`⏭️  Overgeslagen: ${skippedRunsCount}`);
    console.log(`🏆 Totale score: ${totalScore}`);

    return NextResponse.json({
      success: true,
      newRuns: newRunsCount,
      skippedRuns: skippedRunsCount,
      totalScore: totalScore
    });

  } catch (error) {
    console.error('❌ Sync fout:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het synchroniseren' },
      { status: 500 }
    );
  }
}