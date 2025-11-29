import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Crown, RefreshCw, Settings2, CheckCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

const AdminView = ({ companyId }) => {
  const [form, setForm] = useState({ points_per_msg: '', points_per_join: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/settings`, {
        params: { company_id: companyId }
      });
      setForm({
        points_per_msg: data?.data?.points_per_msg ?? '',
        points_per_join: data?.data?.points_per_join ?? ''
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load settings', err);
      setError('Unable to load settings');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      await axios.post(
        `${API_BASE_URL}/api/settings`,
        {
          points_per_msg: Number(form.points_per_msg),
          points_per_join: Number(form.points_per_join)
        },
        { params: { company_id: companyId } }
      );

      setStatus('Settings Saved');
    } catch (err) {
      console.error('Failed to save settings', err);
      setError('Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-[30px]">
          <div className="mb-8 flex flex-col gap-2 text-center">
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full border border-cyan-400/20 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">
              <Settings2 className="h-4 w-4 text-cyan-300" />
              Control Room
            </div>
            <h1 className="text-4xl font-semibold text-white">
              Whop Rank<span className="text-cyan-300">UP</span> Admin
            </h1>
            <p className="text-sm text-slate-400">
              Tune per-company scoring rules to fit your community&apos;s engagement rituals.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
              <p className="mt-4 text-xs uppercase tracking-[0.4em]">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    Points per Message
                  </span>
                  <input
                    type="number"
                    min="0"
                    name="points_per_msg"
                    value={form.points_per_msg}
                    onChange={handleChange}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-lg text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900"
                    placeholder="10"
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    Points per Join
                  </span>
                  <input
                    type="number"
                    min="0"
                    name="points_per_join"
                    value={form.points_per_join}
                    onChange={handleChange}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-lg text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900"
                    placeholder="50"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-lg font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-cyan-200" />
                    Save Settings
                  </>
                )}
              </button>

              {status && (
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center text-emerald-200">
                  {status}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-rose-200">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardView = ({ companyId }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/leaderboard`, {
        params: { company_id: companyId }
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

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
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              TENANT: {companyId}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-glow animate-pulse" />
               System Status: <span className="text-emerald-400 font-bold tracking-wide">LIVE & SYNCED</span>
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
                    key={`${companyId}-${player.whop_user_id || rank}`}
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
                      {rank === 1 ? <Crown className="h-5 w-5 text-yellow-300" /> : `#${rank}`}
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
                No data yet. Trigger `/api/webhook/activity` to start filling the board.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const clientContext = useMemo(() => {
    if (typeof window === 'undefined') {
      return { path: '/', companyId: 'demo-company' };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company_id') || 'demo-company';
    const path = window.location.pathname || '/';

    return { path, companyId };
  }, []);

  const isAdmin = clientContext.path.startsWith('/dashboard');

  if (isAdmin) {
    return <AdminView companyId={clientContext.companyId} />;
  }

  return <LeaderboardView companyId={clientContext.companyId} />;
};

export default App;