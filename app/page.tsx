// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Run {
  id: string;
  name: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  average_heartrate: number | null;
  distance_score: number;
  heartrate_score: number;
  consistency_bonus: number;
  total_score: number;
}

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [syncStats, setSyncStats] = useState<{newRuns: number, skippedRuns: number} | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('strava') === 'connected') {
      setIsConnected(true);
      setError('');
      window.history.replaceState({}, '', '/');
      // Auto-sync na login
      handleSync();
    }
    
    if (params.get('error')) {
      const errorType = params.get('error');
      if (errorType === 'access_denied') {
        setError('Je hebt de toegang geweigerd');
      } else if (errorType === 'no_code') {
        setError('Er ging iets mis bij het inloggen');
      } else if (errorType === 'token_exchange_failed') {
        setError('Er ging iets mis bij het ophalen van je gegevens');
      } else if (errorType === 'database_error') {
        setError('Database fout - check je Supabase configuratie');
      }
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleStravaLogin = () => {
    window.location.href = '/api/auth/strava';
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSyncStats(null);
    
    try {
      console.log('🔄 Start synchronisatie...');
      
      const response = await fetch('/api/strava/sync-scores', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sync resultaat:', data);
        
        setSyncStats({
          newRuns: data.newRuns,
          skippedRuns: data.skippedRuns
        });
        setTotalScore(data.totalScore);
        setIsConnected(true);
        
        // Laad runs opnieuw
        await fetchRuns();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Synchronisatie mislukt');
      }
    } catch (err) {
      console.error('❌ Sync fout:', err);
      setError('Er ging iets mis bij synchroniseren');
    } finally {
      setSyncing(false);
    }
  };

  const fetchRuns = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Haal runs op...');
      const response = await fetch('/api/strava/activities');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${data.length} runs ontvangen`);
        setRuns(data);
        
        // Bereken totale score
        const total = data.reduce((sum: number, run: Run) => sum + run.total_score, 0);
        setTotalScore(Math.round(total * 100) / 100);
        
        setIsConnected(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Kon activiteiten niet ophalen');
        setIsConnected(false);
      }
    } catch (err) {
      console.error('❌ Fetch fout:', err);
      setError('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
       {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 tracking-tight">
            ⚡ Pace War
          </h1>
          <p className="text-gray-600 text-lg md:text-xl mb-6">
            Compete. Track. Dominate.
          </p>
          
          {/* Leaderboard Button */}
          <Link 
            href="/leaderboard"
            className="inline-flex items-center gap-2 bg-esport-blue hover:bg-esport-blue-dark text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg border border-black"
          >
            <span>🏆</span>
            <span>Bekijk Leaderboard</span>
          </Link>
        </div>


        {/* Total Score Card - Alleen tonen als verbonden */}
        {isConnected && totalScore > 0 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 mb-8 shadow-lg transform hover:scale-[1.02] transition-all duration-300 border-2 border-black">
            <div className="text-center">
              <p className="text-black text-lg md:text-xl font-semibold mb-2">
                🏆 Je Totale Score
              </p>
              <p className="text-black text-5xl md:text-7xl font-black">
                {totalScore.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
              </p>
              <p className="text-gray-600 text-sm md:text-base mt-2">punten</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-black text-black px-6 py-4 rounded-2xl mb-6">
            <p className="font-semibold">❌ Fout</p>
            <p className="text-sm mt-1 text-gray-600">{error}</p>
          </div>
        )}

        {/* Sync Stats - Succesbericht */}
        {syncStats && (
          <div className="bg-green-50 border-2 border-black text-black px-6 py-4 rounded-2xl mb-6">
            <p className="font-semibold">✅ Synchronisatie compleet!</p>
            <p className="text-sm mt-1 text-gray-600">
              {syncStats.newRuns} nieuwe run{syncStats.newRuns !== 1 ? 's' : ''} toegevoegd
              {syncStats.skippedRuns > 0 && ` • ${syncStats.skippedRuns} al bekend`}
            </p>
          </div>
        )}

        {/* Login Card - Alleen tonen als NIET verbonden */}
        {!isConnected && (
          <div className="bg-white rounded-2xl p-8 mb-8 border-2 border-black shadow-lg transition-all duration-300">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
              🚀 Start je Journey
            </h2>
            <p className="text-gray-600 mb-6">
              Verbind met Strava om je runs te tracken en punten te verdienen
            </p>
            <button
              onClick={handleStravaLogin}
              className="bg-strava-orange hover:bg-strava-orange-dark text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-3 mx-auto transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-black"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
              </svg>
              Verbind met Strava
            </button>
          </div>
        )}

        {/* Sync Button - Alleen tonen als verbonden */}
        {isConnected && (
          <div className="bg-white rounded-2xl p-6 mb-8 border-2 border-black transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-black mb-1">
                  🔄 Synchroniseer je Runs
                </h3>
                <p className="text-gray-600 text-sm">
                  Haal nieuwe activiteiten op en bereken scores
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-esport-blue hover:bg-esport-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-2xl transform transition-all duration-300 hover:scale-105 disabled:hover:scale-100 shadow-lg min-w-[140px] border-2 border-black"
              >
                {syncing ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bezig...
                  </span>
                ) : (
                  '🔄 Sync Nu'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Runs List */}
        {runs.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-6 flex items-center gap-3">
              <span>🏃‍♂️ Je Runs</span>
              <span className="text-esport-blue text-xl">({runs.length})</span>
            </h2>
            <div className="space-y-4">
              {runs.map((run) => (
                <div 
                  key={run.id} 
                  className="bg-white p-6 rounded-2xl border-2 border-black hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    
                    {/* Run Info - Linker kant */}
                    <div className="flex-1 w-full">
                      <h3 className="text-xl md:text-2xl font-bold text-black mb-3">
                        {run.name}
                      </h3>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-xl p-3 border border-black">
                          <p className="text-gray-600 text-xs mb-1">Afstand</p>
                          <p className="text-black font-bold text-lg">
                            {(run.distance_meters / 1000).toFixed(2)} km
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-black">
                          <p className="text-gray-600 text-xs mb-1">Tijd</p>
                          <p className="text-black font-bold text-lg">
                            {Math.floor(run.moving_time_seconds / 60)} min
                          </p>
                        </div>
                        {run.average_heartrate && (
                          <div className="bg-gray-50 rounded-xl p-3 border border-black">
                            <p className="text-gray-600 text-xs mb-1">💓 Hartslag</p>
                            <p className="text-black font-bold text-lg">
                              {Math.round(run.average_heartrate)} bpm
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Datum */}
                      <p className="text-gray-600 text-sm">
                        📅 {new Date(run.start_date).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Score Breakdown - Rechter kant */}
                    <div className="bg-gray-50 rounded-2xl p-5 border-2 border-black min-w-[250px] w-full lg:w-auto">
                      <p className="text-gray-600 text-sm font-semibold mb-3 text-center">
                        📊 Score Breakdown
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">📏 Afstand:</span>
                          <span className="text-black font-semibold">
                            +{run.distance_score.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">💓 Hartslag:</span>
                          <span className="text-black font-semibold">
                            +{run.heartrate_score.toFixed(1)}
                          </span>
                        </div>
                        {run.consistency_bonus > 0 && (
                          <div className="flex justify-between items-center bg-esport-blue/10 -mx-2 px-2 py-1 rounded-xl border border-black">
                            <span className="text-esport-blue text-sm font-bold">🔥 Bonus:</span>
                            <span className="text-esport-blue font-bold">
                              +{run.consistency_bonus}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-black pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-black font-bold">Totaal:</span>
                            <span className="text-esport-blue font-bold text-xl">
                              {run.total_score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-black py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-esport-blue mb-4"></div>
            <p className="text-xl">Laden...</p>
          </div>
        )}

        {/* Empty State - Alleen tonen als verbonden maar geen runs */}
        {isConnected && runs.length === 0 && !loading && !syncing && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-black">
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <p className="text-gray-600 text-lg mb-2">
              Nog geen runs gevonden
            </p>
            <p className="text-gray-600 text-sm">
              Klik op "🔄 Sync Nu" om je Strava activiteiten op te halen
            </p>
          </div>
        )}

      </div>
    </div>
  );
}