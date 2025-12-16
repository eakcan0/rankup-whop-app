import { createSdk } from '@whop/iframe';

// Initialize the Whop iframe SDK
// The appId can be set from environment variable if needed
export const iframeSdk = createSdk({
  appId: import.meta.env.VITE_WHOP_APP_ID || undefined,
});

// Helper to get context from the SDK
export const getWhopContext = async () => {
  try {
    const context = await iframeSdk.getContext();
    return context;
  } catch (error) {
    console.warn('Failed to get Whop context:', error);
    return null;
  }
};

export default iframeSdk;
