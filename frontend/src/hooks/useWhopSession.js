import { useEffect, useState } from 'react';

const defaultSession = {
  ready: false,
  user: null,
  company: null
};

const useWhopSession = () => {
  const [session, setSession] = useState(defaultSession);

  useEffect(() => {
    const sdk = window.Whop?.sdk;

    if (!sdk) {
      return undefined;
    }

    let unsub = null;
    const handleReady = async () => {
      try {
        const context = (await sdk.getContext?.()) || {};
        setSession({
          ready: true,
          user: context.user,
          company: context.company
        });
      } catch (error) {
        console.error('Failed to hydrate Whop session', error);
        setSession((prev) => ({ ...prev, ready: true }));
      }
    };

    if (sdk.on) {
      sdk.on('ready', handleReady);
      unsub = () => sdk.off?.('ready', handleReady);
    } else {
      handleReady();
    }

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, []);

  return session;
};

export default useWhopSession;

