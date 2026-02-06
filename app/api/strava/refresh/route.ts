// app/api/strava/refresh/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Haal de refresh token op
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('strava_refresh_token')?.value;

  // Check of er een refresh token is
  if (!refreshToken) {
    console.log('Geen refresh token gevonden');
    return NextResponse.json(
      { error: 'Geen refresh token gevonden' },
      { status: 401 }
    );
  }

  try {
    console.log('Vernieuw access token...');
    
    // Vraag een nieuwe access token aan bij Strava
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    // Check of het gelukt is
    if (!response.ok) {
      console.error('Token vernieuwen mislukt');
      throw new Error('Token vernieuwen mislukt');
    }

    // Haal de nieuwe tokens op
    const tokenData = await response.json();
    console.log('Nieuwe tokens ontvangen');

    // Update de cookies met de nieuwe tokens
    cookieStore.set('strava_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 6, // 6 uur
    });

    cookieStore.set('strava_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dagen
    });

    cookieStore.set('strava_expires_at', tokenData.expires_at.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dagen
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Token refresh fout:', error);
    return NextResponse.json(
      { error: 'Kon token niet vernieuwen' },
      { status: 500 }
    );
  }
}
