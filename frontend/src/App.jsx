import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Crown, RefreshCw, Settings2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PLACEHOLDER_AVATAR = (seed = 'player') =>
  `https://avatar.vercel.sh/${encodeURIComponent(seed)}?size=64`;
const DEV_FALLBACK_COMPANY_ID =
  import.meta.env.VITE_DEFAULT_COMPANY_ID || import.meta.env.VITE_COMPANY_ID || null;

const readWhopCompanyId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const whop = window.whop;
  return (
    whop?.session?.company_id ||
    whop?.session?.organization?.company_id ||
    whop?.company?.id ||
    whop?.context?.company_id ||
    whop?.organization?.company_id ||
    null
  );
};

const extractCompanyIdFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload.companyId ||
    payload.company_id ||
    payload?.payload?.companyId ||
    payload?.payload?.company_id ||
    payload?.context?.companyId ||
    payload?.context?.company_id ||
    payload?.session?.company_id ||
    null
  );
};

const isConfigView = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'dashboard' || normalized === 'admin';
  }

  return false;
};

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
    if (!companyId) {
      return;
    }

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
    if (!companyId) {
      return;
    }

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

  const fetchLeaderboard = useCallback(async () => {
    if (!companyId) {
      return;
    }

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
  }, [companyId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
  const [clientContext, setClientContext] = useState({
    companyId: null,
    isConfigMode: false,
    ready: false,
    source: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      setClientContext((prev) => ({ ...prev, ready: true }));
      return;
    }

    let cancelled = false;
    let pollHandle = null;

    const mergeContext = (updates) => {
      if (cancelled) {
        return;
      }

      setClientContext((prev) => ({ ...prev, ...updates }));
    };

    const urlParams = new URLSearchParams(window.location.search);
    const urlCompanyId = urlParams.get('company_id') || urlParams.get('companyId');
    const urlIsConfigMode =
      isConfigView(urlParams.get('view')) || isConfigView(urlParams.get('mode'));

    const whopCompanyId = readWhopCompanyId();

    let resolvedImmediately = false;
    if (whopCompanyId) {
      resolvedImmediately = true;
      mergeContext({
        companyId: whopCompanyId,
        isConfigMode: urlIsConfigMode,
        ready: true,
        source: 'whop'
      });
    } else if (urlCompanyId) {
      resolvedImmediately = true;
      mergeContext({
        companyId: urlCompanyId,
        isConfigMode: urlIsConfigMode,
        ready: true,
        source: 'url'
      });
    } else if (import.meta.env.DEV && DEV_FALLBACK_COMPANY_ID) {
      resolvedImmediately = true;
      mergeContext({
        companyId: DEV_FALLBACK_COMPANY_ID,
        isConfigMode: urlIsConfigMode,
        ready: true,
        source: 'dev-fallback'
      });
    } else {
      mergeContext({
        isConfigMode: urlIsConfigMode,
        source: null
      });
    }

    const stopPolling = () => {
      if (pollHandle) {
        window.clearInterval(pollHandle);
        pollHandle = null;
      }
    };

    const handleMessage = (event) => {
      const nextCompanyId = extractCompanyIdFromPayload(event?.data);
      if (!nextCompanyId) {
        return;
      }

      const messageMode =
        isConfigView(event?.data?.view) || isConfigView(event?.data?.mode) || urlIsConfigMode;

      mergeContext({
        companyId: nextCompanyId,
        isConfigMode: messageMode,
        ready: true,
        source: 'message'
      });

      stopPolling();
    };

    window.addEventListener('message', handleMessage);

    if (!resolvedImmediately) {
      pollHandle = window.setInterval(() => {
        const polledCompanyId = readWhopCompanyId();
        if (polledCompanyId) {
          mergeContext({
            companyId: polledCompanyId,
            isConfigMode: urlIsConfigMode,
            ready: true,
            source: 'whop-poll'
          });
          stopPolling();
        }
      }, 500);
    }

    const readyTimeout = window.setTimeout(() => {
      mergeContext({ ready: true });
    }, 3000);

    return () => {
      cancelled = true;
      window.removeEventListener('message', handleMessage);
      stopPolling();
      window.clearTimeout(readyTimeout);
    };
  }, []);

  if (!clientContext.ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-200">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-10 py-12 text-center shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          <div>
            <p className="text-lg font-semibold text-white">Bootstrapping RankUp</p>
            <p className="text-sm text-slate-400">
              Waiting for Whop to share the active session&hellip;
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientContext.companyId) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center shadow-2xl shadow-rose-900/30 backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10">
            <AlertCircle className="h-8 w-8 text-rose-300" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Company context missing</h2>
          <p className="mt-3 text-sm text-slate-300">
            Launch RankUp from inside Whop or ensure the iFrame passes a valid <code>companyId</code>{' '}
            before resubmitting to the App Store.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-xs text-slate-400">
            <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">Checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Whop session exposes <code>window.whop.session.company_id</code></li>
              <li>Optional: pass <code>company_id</code> via query string for local dev</li>
              <li>Reload after ensuring context is available</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (clientContext.isConfigMode) {
    return <AdminView companyId={clientContext.companyId} />;
  }

  return <LeaderboardView companyId={clientContext.companyId} />;
};

export default App;