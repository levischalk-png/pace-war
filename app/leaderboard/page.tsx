// app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  id: string;
  name: string;
  totalScore: number;
  runCount: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📊 Haal leaderboard op...');
      const response = await fetch('/api/leaderboard');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${data.length} entries ontvangen`);
        setLeaderboard(data);
      } else {
        setError('Kon leaderboard niet ophalen');
      }
    } catch (err) {
      console.error('❌ Fout:', err);
      setError('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  // Functie om medal emoji te krijgen
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  // Functie om border kleur te krijgen voor top 3
  const getBorderClass = (rank: number) => {
    if (rank === 1) return 'border-esport-blue border-l-4';
    if (rank === 2) return 'border-esport-blue-light border-l-4';
    if (rank === 3) return 'border-esport-blue-dark border-l-4';
    return '';
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header met Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-esport-blue hover:text-black transition-all duration-300 mb-6 rounded-2xl px-4 py-2 hover:bg-gray-50 border border-black"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar Dashboard
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black text-black mb-4 tracking-tight">
              🏆 LEADERBOARD
            </h1>
            <p className="text-gray-600 text-lg md:text-xl">
              De Rankings van Pace War
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-black text-black px-6 py-4 rounded-2xl mb-6">
            <p className="font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-black py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-esport-blue mb-4"></div>
            <p className="text-xl">Laden van rankings...</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-lg transition-all duration-300">
            
            {/* Table Header */}
            <div className="bg-esport-blue px-6 py-4 border-b-2 border-black">
              <div className="grid grid-cols-12 gap-4 font-bold text-white text-sm md:text-base">
                <div className="col-span-2 text-center">RANG</div>
                <div className="col-span-5 md:col-span-6">LOPER</div>
                <div className="col-span-3 md:col-span-2 text-center">RUNS</div>
                <div className="col-span-2 text-right">PUNTEN</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-black">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const medal = getMedal(rank);
                const isTop3 = rank <= 3;
                
                return (
                  <div
                    key={entry.id}
                    className={`
                      px-6 py-4 transition-all duration-300 hover:bg-gray-50
                      ${isTop3 ? `${getBorderClass(rank)}` : ''}
                    `}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      
                      {/* Rank */}
                      <div className="col-span-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {medal && (
                            <span className="text-3xl md:text-4xl">{medal}</span>
                          )}
                          <span className={`
                            font-black text-xl md:text-2xl
                            ${rank === 1 ? 'text-esport-blue' : ''}
                            ${rank === 2 ? 'text-esport-blue-light' : ''}
                            ${rank === 3 ? 'text-esport-blue-dark' : ''}
                            ${rank > 3 ? 'text-gray-600' : ''}
                          `}>
                            #{rank}
                          </span>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="col-span-5 md:col-span-6">
                        <p className={`
                          font-bold text-base md:text-lg
                          ${isTop3 ? 'text-black' : 'text-gray-700'}
                        `}>
                          {entry.name}
                        </p>
                      </div>

                      {/* Run Count */}
                      <div className="col-span-3 md:col-span-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-xl border border-black">
                          <span className="text-esport-blue text-xs md:text-sm">🏃‍♂️</span>
                          <span className="text-black font-semibold text-sm md:text-base">
                            {entry.runCount}
                          </span>
                        </div>
                      </div>

                      {/* Total Score */}
                      <div className="col-span-2 text-right">
                        <p className={`
                          font-black text-lg md:text-2xl
                          ${rank === 1 ? 'text-esport-blue' : ''}
                          ${rank === 2 ? 'text-esport-blue-light' : ''}
                          ${rank === 3 ? 'text-esport-blue-dark' : ''}
                          ${rank > 3 ? 'text-black' : ''}
                        `}>
                          {entry.totalScore.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                        </p>
                      </div>

                    </div>

                    {/* Top 3 Extra Info */}
                    {isTop3 && (
                      <div className="mt-2 text-center">
                        <span className="inline-block bg-esport-blue/10 px-3 py-1 rounded-xl text-xs font-semibold text-esport-blue border border-black">
                          {rank === 1 && '👑 KAMPIOEN'}
                          {rank === 2 && '⭐ RUNNER-UP'}
                          {rank === 3 && '🔥 TOP PERFORMER'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-black">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-600 text-lg mb-2">
              Nog geen deelnemers op het leaderboard
            </p>
            <p className="text-gray-600 text-sm">
              Wees de eerste om te scoren!
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="bg-esport-blue hover:bg-esport-blue-dark disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg border-2 border-black disabled:border-gray-500"
          >
            {loading ? 'Laden...' : '🔄 Ververs Rankings'}
          </button>
        </div>

      </div>
    </div>
  );
}