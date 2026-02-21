// app/api/strava/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateUser } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl =
    request.nextUrl.origin ||
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

    // Sla tokens op in cookies – path=/ zodat ze bij elke pagina-request worden meegestuurd
    const cookieStore = await cookies();
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    cookieStore.set('strava_access_token', tokenData.access_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 6, // 6 uur (Strava vernieuwt we via refresh)
    });

    cookieStore.set('strava_refresh_token', tokenData.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 90, // 90 dagen – blijf ingelogd
    });

    cookieStore.set('strava_expires_at', tokenData.expires_at.toString(), {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 90,
    });

    cookieStore.set('strava_athlete_id', tokenData.athlete.id.toString(), {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 90,
    });

    cookieStore.set('user_id', user.id, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 90, // 90 dagen sessie
    });

    console.log('✅ Cookies opgeslagen');
    console.log('=== Callback Compleet ===');

    return NextResponse.redirect(`${baseUrl}/?strava=connected`);
    
  } catch (error) {
    console.error('❌ Strava OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
  }
}