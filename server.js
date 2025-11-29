require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const {
  ensureCompanySettings,
  getCompanySettings,
  updateCompanySettings,
  updateUserPoints,
  setUserPoints,
  getTopUsers,
  seedDemoCompany
} = require('./database');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log('🔔 İSTEK GELDİ:', req.method, req.url);
  next();
});

const WHOP_API_BASE_URL = process.env.WHOP_API_BASE_URL || 'https://api.whop.com/api/v2';
const OAUTH_TOKEN_URL = `${WHOP_API_BASE_URL.replace(/\/$/, '')}/oauth/token`;

const buildWhopClient = (token) =>
  axios.create({
    baseURL: WHOP_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: 10_000
  });

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const normalizeUserPayload = (user = {}) => ({
  id: user.id || user.whop_user_id || user.user_id,
  username: user.username || user.display_name || user.email || 'Whop User',
  avatar: user.profile_picture || user.avatar_url || null
});

const resolveCompanyId = (req, payload = {}) =>
  req.query.company_id ||
  payload.company_id ||
  payload.company?.id ||
  payload.membership?.company?.id ||
  payload.membership?.company_id ||
  payload.workspace?.id;

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    const tokenResponse = await axios.post(
      OAUTH_TOKEN_URL,
      {
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        redirect_uri: process.env.WHOP_REDIRECT_URI,
        grant_type: 'authorization_code',
        code
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json({ state, ...tokenResponse.data });
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.status(500).json({ error: 'Auth failed' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  const companyId = req.query.company_id;
  if (!companyId) {
    return res.status(400).json({ error: 'company_id query param is required' });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    await ensureCompanySettings(companyId);
    const users = await getTopUsers(companyId, limit);
    res.json({ data: users });
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ error: 'Unable to fetch leaderboard' });
  }
});

app.get('/api/settings', async (req, res) => {
  const companyId = req.query.company_id;
  if (!companyId) {
    return res.status(400).json({ error: 'company_id query param is required' });
  }

  try {
    const settings = await ensureCompanySettings(companyId);
    res.json({ data: settings });
  } catch (error) {
    console.error('Settings fetch error:', error.message);
    res.status(500).json({ error: 'Unable to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  const companyId = req.query.company_id || req.body?.company_id;
  if (!companyId) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  const updates = {
    points_per_msg:
      req.body?.points_per_msg !== undefined ? Number(req.body.points_per_msg) : undefined,
    points_per_join:
      req.body?.points_per_join !== undefined ? Number(req.body.points_per_join) : undefined
  };

  try {
    const next = await updateCompanySettings(companyId, updates);
    res.json({ data: next });
  } catch (error) {
    console.error('Settings update error:', error.message);
    res.status(500).json({ error: 'Unable to update settings' });
  }
});

app.post('/api/webhook/activity', async (req, res) => {
  console.log('✅ WEBHOOK BAŞARILI:', JSON.stringify(req.body, null, 2));
  const eventType = req.body?.action || req.body?.event_type;
  const payload = req.body?.data || req.body?.payload || req.body;

  if (!eventType || !payload) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const validEvents = ['membership.went_valid', 'membership.went_invalid', 'payment.succeeded'];
  if (!validEvents.includes(eventType)) {
    return res.status(200).json({ ignored: true });
  }

  const companyId = resolveCompanyId(req, payload);
  if (!companyId) {
    return res.status(400).json({ error: 'company_id missing in payload' });
  }

  const user = normalizeUserPayload(payload.user || payload.membership?.user || payload);
  if (!user.id) {
    return res.status(400).json({ error: 'user id missing in payload' });
  }

  try {
    const settings = await ensureCompanySettings(companyId);

    if (eventType === 'membership.went_valid') {
      await updateUserPoints(companyId, user.id, user.username, user.avatar, settings.points_per_join);
      return res.json({ success: true, action: 'membership.went_valid' });
    }

    if (eventType === 'payment.succeeded') {
      await updateUserPoints(companyId, user.id, user.username, user.avatar, settings.points_per_msg);
      return res.json({ success: true, action: 'payment.succeeded' });
    }

    if (eventType === 'membership.went_invalid') {
      await setUserPoints(companyId, user.id, user.username, user.avatar, -1);
      return res.json({ success: true, action: 'membership.went_invalid' });
    }

    return res.status(200).json({ ignored: true });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

const PORT = process.env.PORT || 3000;
const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID || 'demo-company';

const start = async () => {
  try {
    await seedDemoCompany(DEMO_COMPANY_ID);
    app.listen(PORT, () => {
      console.log(`🚀 Whop backend ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap backend:', error.message);
    process.exit(1);
  }
};

start();