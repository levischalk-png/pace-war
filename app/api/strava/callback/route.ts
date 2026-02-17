// app/api/strava/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateUser } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=access_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  try {
    console.log('=== Strava OAuth Callback ===');
    
    // Wissel code in voor token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token inwisselen mislukt');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token ontvangen voor atleet:', tokenData.athlete.id);
    
    // Maak of haal gebruiker op in database
    const user = await getOrCreateUser(
      tokenData.athlete.id.toString(),
      `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
      tokenData.athlete.email
    );

    if (!user) {
      console.error('❌ Kon gebruiker niet aanmaken in database');
      return NextResponse.redirect(`${baseUrl}/?error=database_error`);
    }

    console.log('✅ Gebruiker in database:', user.name);
    console.log('📅 Joined at:', user.joined_at);

    // Sla tokens op in cookies
    const cookieStore = await cookies();
    
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
      maxAge: 60 * 60 * 24 * 30,
    });

    cookieStore.set('strava_athlete_id', tokenData.athlete.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Sla ook user_id op voor makkelijke toegang later
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    console.log('✅ Cookies opgeslagen');
    console.log('=== Callback Compleet ===');

    return NextResponse.redirect(`${baseUrl}/?strava=connected`);
    
  } catch (error) {
    console.error('❌ Strava OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
  }
}