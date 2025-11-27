import { useEffect, useState } from 'react';
import apiClient, { leaderboardFallback } from '../lib/apiClient';

const initialState = {
  loading: true,
  error: null,
  entries: []
};

const useLeaderboardData = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const entries = await apiClient.getMembershipLeaderboard();
        if (active) {
          setState({ loading: false, entries, error: null });
        }
      } catch (error) {
        console.warn('Falling back to sample leaderboard data', error);
        if (active) {
          setState({
            loading: false,
            entries: leaderboardFallback,
            error: 'Showing sample data until the Whop API is wired up.'
          });
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
};

export default useLeaderboardData;

