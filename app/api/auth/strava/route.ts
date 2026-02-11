// app/api/auth/strava/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Haal je Client ID op uit de omgevingsvariabelen
  const clientId = process.env.STRAVA_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Check of de Client ID er is
  if (!clientId) {
    return NextResponse.json(
      { error: 'Strava Client ID niet geconfigureerd' },
      { status: 500 }
    );
  }

  // De URL waar Strava naartoe moet terugsturen na login
  const redirectUri = `${baseUrl}/api/strava/callback`;

  // Bouw de Strava login URL
  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
  stravaAuthUrl.searchParams.append('client_id', clientId);
  stravaAuthUrl.searchParams.append('redirect_uri', redirectUri);
  stravaAuthUrl.searchParams.append('response_type', 'code');
  stravaAuthUrl.searchParams.append('scope', 'activity:read_all,profile:read_all');

  // Stuur de gebruiker door naar Strava om in te loggen
  return NextResponse.redirect(stravaAuthUrl.toString());
}