// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/database';

export async function GET() {
  try {
    console.log('=== Haal Leaderboard op ===');
    
    const leaderboard = await getLeaderboard();
    
    console.log(`✅ ${leaderboard.length} gebruikers op het leaderboard`);
    
    return NextResponse.json(leaderboard);
    
  } catch (error) {
    console.error('❌ Fout bij ophalen leaderboard:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van het leaderboard' },
      { status: 500 }
    );
  }
}