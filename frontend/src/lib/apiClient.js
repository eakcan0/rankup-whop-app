const FALLBACK_AVATARS = [
  'https://avatar.vercel.sh/alpha',
  'https://avatar.vercel.sh/bravo',
  'https://avatar.vercel.sh/charlie',
  'https://avatar.vercel.sh/delta',
  'https://avatar.vercel.sh/echo'
];

const resolveAuthToken = () =>
  window.Whop?.sdk?.accessToken ||
  window.__WHOP_ACCESS_TOKEN__ ||
  localStorage.getItem('whopAccessToken');

const adaptMembershipsToLeaderboard = (payload) => {
  const memberships = payload?.data || payload?.memberships || [];

  return memberships.slice(0, 5).map((membership, index) => {
    const member = membership.user || membership.member || {};
    return {
      id: membership.id || `member-${index}`,
      name: member.username || member.display_name || 'Member',
      membership: membership.product?.name || 'Active Membership',
      score: membership.stats?.message_count || membership.score || index * 37 + 120,
      metric: 'messages',
      avatar: member.avatar_url || FALLBACK_AVATARS[index % FALLBACK_AVATARS.length],
      rank: index + 1
    };
  });
};

const apiClient = {
  async getMembershipLeaderboard() {
    const token = resolveAuthToken();
    const response = await fetch('/api/memberships', {
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : undefined
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const payload = await response.json();
    return adaptMembershipsToLeaderboard(payload);
  }
};

export const leaderboardFallback = [
  {
    id: 'demo-1',
    name: 'Nova Quinn',
    membership: 'Founders Club',
    score: 1280,
    metric: 'messages',
    avatar: FALLBACK_AVATARS[0],
    rank: 1
  },
  {
    id: 'demo-2',
    name: 'Malik Zhao',
    membership: 'Alpha Builders',
    score: 1187,
    metric: 'messages',
    avatar: FALLBACK_AVATARS[1],
    rank: 2
  },
  {
    id: 'demo-3',
    name: 'Sasha Reed',
    membership: 'Growth Ops',
    score: 1024,
    metric: 'messages',
    avatar: FALLBACK_AVATARS[2],
    rank: 3
  },
  {
    id: 'demo-4',
    name: 'Eli Torres',
    membership: 'Community Core',
    score: 965,
    metric: 'messages',
    avatar: FALLBACK_AVATARS[3],
    rank: 4
  },
  {
    id: 'demo-5',
    name: 'Marin Wilde',
    membership: 'Community Core',
    score: 905,
    metric: 'messages',
    avatar: FALLBACK_AVATARS[4],
    rank: 5
  }
];

export default apiClient;

