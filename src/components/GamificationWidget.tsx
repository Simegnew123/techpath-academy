"use client";

import { useState, useEffect, useCallback } from "react";

type Streak = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
};

type UserBadge = {
  badgeType: string;
  awardedAt: string;
  badge?: { name: string; description: string; icon: string; color: string };
};

type LeaderboardEntry = {
  userId: string;
  name: string;
  points: number;
  coursesCompleted: number;
  streak: number;
  badges: number;
};

export default function GamificationWidget({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGamification = useCallback(async () => {
    const res = await fetch("/api/gamification");
    if (res.ok) {
      const data = await res.json();
      setStreak(data.streak);
      setBadges(data.badges || []);
      setAllBadges(data.allBadges || []);
    }
    setLoading(false);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const res = await fetch("/api/gamification?leaderboard=1");
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    }
  }, []);

  useEffect(() => { fetchGamification(); }, [fetchGamification]);
  useEffect(() => { if (showLeaderboard) fetchLeaderboard(); }, [showLeaderboard, fetchLeaderboard]);

  if (loading) return <div className="animate-pulse h-32 rounded-xl bg-slate-100" />;

  const earnedBadgeTypes = new Set(badges.map((b) => b.badgeType));

  return (
    <div className="space-y-4" role="region" aria-label="Gamification and achievements">
      {/* Streak card */}
      {streak && (
        <div className="rounded-xl bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Learning Streak</p>
              <p className="text-3xl font-bold">{streak.currentStreak} 🔥</p>
              <p className="text-xs opacity-80">days in a row</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Best: {streak.longestStreak} days</p>
              <p className="text-xs opacity-80">Total: {streak.totalActiveDays} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
          <span aria-hidden="true">🏅</span> Achievements ({badges.length}/{allBadges.length})
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {allBadges.map((badge) => {
            const earned = earnedBadgeTypes.has(badge.type);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center rounded-lg p-2 text-center transition ${earned ? badge.color : "bg-slate-50 opacity-40 grayscale"}`}
                title={badge.description}
              >
                <span className="text-2xl" aria-hidden="true">{badge.icon}</span>
                <span className="mt-1 text-xs font-medium">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="flex w-full items-center justify-between"
          aria-expanded={showLeaderboard}
        >
          <h3 className="flex items-center gap-2 font-bold text-slate-800">
            <span aria-hidden="true">🏆</span> Leaderboard
          </h3>
          <span className="text-xs text-indigo-600">{showLeaderboard ? "Hide" : "Show"}</span>
        </button>
        {showLeaderboard && (
          <div className="mt-3 space-y-1">
            {leaderboard.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4">No data yet</p>
            ) : (
              leaderboard.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${entry.userId === userId ? "bg-indigo-50 border border-indigo-200" : i < 3 ? "bg-amber-50" : "bg-slate-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold w-6 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                    {entry.userId === userId && <span className="text-xs text-indigo-600">(You)</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{entry.points} pts</span>
                    <span>🔥{entry.streak}</span>
                    <span>🎓{entry.coursesCompleted}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
