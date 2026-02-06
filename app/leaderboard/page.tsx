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
    if (rank === 1) return 'border-yellow-400 shadow-yellow-400/50';
    if (rank === 2) return 'border-gray-300 shadow-gray-300/50';
    if (rank === 3) return 'border-orange-600 shadow-orange-600/50';
    return 'border-white/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header met Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar Dashboard
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              🏆 LEADERBOARD
            </h1>
            <p className="text-blue-200 text-lg md:text-xl">
              De Rankings van Pace War
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white px-6 py-4 rounded-xl mb-6">
            <p className="font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mb-4"></div>
            <p className="text-xl">Laden van rankings...</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 font-bold text-white text-sm md:text-base">
                <div className="col-span-2 text-center">RANG</div>
                <div className="col-span-5 md:col-span-6">LOPER</div>
                <div className="col-span-3 md:col-span-2 text-center">RUNS</div>
                <div className="col-span-2 text-right">PUNTEN</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/10">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const medal = getMedal(rank);
                const isTop3 = rank <= 3;
                
                return (
                  <div
                    key={entry.id}
                    className={`
                      px-6 py-4 transition-all hover:bg-white/10
                      ${isTop3 ? `border-l-4 ${getBorderClass(rank)} shadow-lg` : ''}
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
                            ${rank === 1 ? 'text-yellow-400' : ''}
                            ${rank === 2 ? 'text-gray-300' : ''}
                            ${rank === 3 ? 'text-orange-600' : ''}
                            ${rank > 3 ? 'text-blue-300' : ''}
                          `}>
                            #{rank}
                          </span>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="col-span-5 md:col-span-6">
                        <p className={`
                          font-bold text-base md:text-lg
                          ${isTop3 ? 'text-white' : 'text-blue-100'}
                        `}>
                          {entry.name}
                        </p>
                      </div>

                      {/* Run Count */}
                      <div className="col-span-3 md:col-span-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                          <span className="text-blue-300 text-xs md:text-sm">🏃‍♂️</span>
                          <span className="text-white font-semibold text-sm md:text-base">
                            {entry.runCount}
                          </span>
                        </div>
                      </div>

                      {/* Total Score */}
                      <div className="col-span-2 text-right">
                        <p className={`
                          font-black text-lg md:text-2xl
                          ${rank === 1 ? 'text-yellow-400' : ''}
                          ${rank === 2 ? 'text-gray-300' : ''}
                          ${rank === 3 ? 'text-orange-600' : ''}
                          ${rank > 3 ? 'text-blue-200' : ''}
                        `}>
                          {entry.totalScore.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                        </p>
                      </div>

                    </div>

                    {/* Top 3 Extra Info */}
                    {isTop3 && (
                      <div className="mt-2 text-center">
                        <span className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-blue-200 text-lg mb-2">
              Nog geen deelnemers op het leaderboard
            </p>
            <p className="text-blue-300 text-sm">
              Wees de eerste om te scoren!
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? 'Laden...' : '🔄 Ververs Rankings'}
          </button>
        </div>

      </div>
    </div>
  );
}