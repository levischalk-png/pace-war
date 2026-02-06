// app/api/strava/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRuns } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Haal runs op uit database ===');
    
    // Haal user_id uit cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    console.log('User ID:', userId);

    if (!userId) {
      console.log('❌ Niet ingelogd');
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    // Haal runs op uit database (met alle scores!)
    const runs = await getUserRuns(userId);
    
    console.log(`✅ ${runs.length} runs gevonden in database`);

    return NextResponse.json(runs);
    
  } catch (error) {
    console.error('❌ Fout bij ophalen activiteiten:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}