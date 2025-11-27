import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Crown, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;
const PLACEHOLDER_AVATAR = (seed = 'player') =>
  `https://avatar.vercel.sh/${encodeURIComponent(seed)}?size=64`;

const rankStyles = {
  1: 'border-yellow-400/70 shadow-[0_0_35px_rgba(250,204,21,0.45)] bg-gradient-to-r from-yellow-500/10 to-yellow-200/5',
  2: 'border-slate-200/50 shadow-[0_0_25px_rgba(226,232,240,0.35)] bg-gradient-to-r from-slate-400/10 to-slate-200/5',
  3: 'border-amber-600/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-r from-amber-500/10 to-amber-200/5'
};

const rowVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: index * 0.09,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const App = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`${API_URL}/api/leaderboard`);
      setPlayers(data?.data || []);
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen w-full bg-transparent px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <div className="relative w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-[30px]">
          <div className="mb-8 flex flex-col gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm uppercase tracking-[0.35em] text-cyan-300/80">
              <span className="inline-block h-1 w-1 rounded-full bg-cyan-300" />
              Live Ops Leaderboard
              <span className="inline-block h-1 w-1 rounded-full bg-cyan-300" />
            </div>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              Rank<span className="text-cyan-300">UP</span> Protocol
            </h1>
            <p className="text-base text-slate-300">
              Tracking the most engaged Whop citizens in real time. Stay active, keep the streak alive,
              and climb the neon wall of fame.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-glow" />
              Synced with http://localhost:3000
            </div>
            <button
              type="button"
              onClick={fetchLeaderboard}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/70 hover:bg-cyan-500/10"
              disabled={loading}
            >
              <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.span
                  className="h-12 w-12 rounded-full border-2 border-cyan-300/30 border-t-cyan-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="mt-4 text-sm uppercase tracking-[0.4em] text-cyan-200">
                  Loading leaderboard...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-100">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              players.map((player, index) => {
                const rank = index + 1;
                const avatar =
                  player.avatar_url || PLACEHOLDER_AVATAR(player.username || `player-${rank}`);
                const highlightClass = rankStyles[rank] || 'border-white/5 bg-slate-900/40';

                return (
                  <motion.div
                    key={player.whop_user_id || `player-${rank}`}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    className={clsx(
                      'flex items-center gap-4 rounded-2xl border px-4 py-3 transition',
                      'bg-gradient-to-r from-slate-900/40 to-slate-900/10 hover:border-cyan-300/60 hover:bg-cyan-300/5',
                      highlightClass
                    )}
                  >
                    <div
                      className={clsx(
                        'flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-lg font-semibold',
                        rank <= 3 ? 'text-white' : 'text-slate-300'
                      )}
                    >
                      {rank === 1 && <Crown className="h-5 w-5 text-yellow-300" />}
                      {rank !== 1 && `#${rank}`}
                    </div>

                    <img
                      src={avatar}
                      alt={player.username}
                      className="h-12 w-12 rounded-full border-2 border-white/10 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_AVATAR(rank);
                      }}
                    />

                    <div className="flex flex-1 flex-col">
                      <p className="text-lg font-semibold text-white">{player.username || 'Anon'}</p>
                      <p className="text-sm text-slate-400">
                        {player.whop_user_id?.replace('seed-', '#') || 'Live activity feed'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-200">{player.points ?? 0}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">points</p>
                    </div>
                  </motion.div>
                );
              })}

            {!loading && !error && players.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center text-slate-400">
                No data yet. Trigger `/api/activity` to start filling the board.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
