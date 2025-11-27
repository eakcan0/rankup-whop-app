require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { updateUserPoints, getTopUsers, seedTestUsersIfEmpty } = require('./database');

const app = express();

// --- 1. KAPI ZİLİ (LOGGER) ---
app.use((req, res, next) => {
  console.log(`🔔 KAPI ÇALDI! [${req.method}] ${req.url}`);
  // Gelen verinin içeriğini de görelim (Debug için)
  if (req.method === 'POST') {
     console.log('📦 Gelen Paket:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(cors());
// Whop webhooks bazen raw body gerektirir ama şimdilik JSON ile devam edelim
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

// --- AUTH ROUTE'LARI (DOKUNMA) ---
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const tokenResponse = await axios.post(OAUTH_TOKEN_URL, {
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        redirect_uri: process.env.WHOP_REDIRECT_URI,
        grant_type: 'authorization_code',
        code
      });
    res.json({ state, ...tokenResponse.data });
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// --- API ROUTE'LARI ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await getTopUsers(50);
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Leaderboard error' });
  }
});

// --- WEBHOOK MANTIĞI (TEK VE DOĞRU OLAN) ---

const normalizeUserPayload = (user = {}) => ({
  id: user.id || user.whop_user_id || user.user_id,
  username: user.username || user.display_name || user.email || 'Whop User',
  avatar: user.profile_picture || user.avatar_url || null
});

app.post('/api/webhook/activity', async (req, res) => {
  // Whop bazen datayı 'data' içinde, bazen direkt body'de gönderir.
  // Whop'un güncel yapısına göre hareket edelim.
  const eventType = req.body?.action || req.body?.event_type; 
  const payload = req.body?.data || req.body?.payload || req.body;

  console.log('🎯 Webhook İşleniyor. Event:', eventType);

  if (!eventType) {
    console.log('⚠️ Event Type bulunamadı.');
    return res.status(400).json({ error: 'Unknown event structure' });
  }

  // Sadece ilgilendiğimiz olaylar
  const validEvents = ['membership.went_valid', 'membership.went_invalid', 'payment.succeeded'];
  if (!validEvents.includes(eventType)) {
    console.log('ℹ️ İlgilenmediğimiz olay:', eventType);
    return res.status(200).json({ ignored: true });
  }

  // Kullanıcı bilgisini bulmaya çalış
  let userData = payload.user || payload.membership?.user || payload;
  const user = normalizeUserPayload(userData);

  if (!user.id) {
    console.log('❌ Kullanıcı ID bulunamadı. Payload:', payload);
    return res.status(400).json({ error: 'No user ID found' });
  }

  try {
    if (eventType === 'membership.went_valid' || eventType === 'payment.succeeded') {
      // Yeni üye veya ödeme yapan üye -> Listeye ekle (0 puanla veya mevcut puanla)
      await updateUserPoints(user.id, user.username, user.avatar, 0);
      console.log(`✅ Kullanıcı Eklendi/Güncellendi: ${user.username}`);
      return res.json({ success: true, user });
    }

    if (eventType === 'membership.went_invalid') {
      // Ayrılan üye -> Puanını -1 yap (Listeden düşür)
      const existing = await updateUserPoints(user.id, user.username, user.avatar, 0);
      const currentPoints = existing?.points ?? 0;
      const delta = -1 - currentPoints;
      if (delta !== 0) {
        await updateUserPoints(user.id, user.username, user.avatar, delta);
      }
      console.log(`🔻 Kullanıcı Ayrıldı: ${user.username}`);
      return res.json({ success: true, status: 'demoted' });
    }

    return res.status(200).json({ ignored: true });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: 'Internal Error' });
  }
});

// --- SUNUCUYU BAŞLAT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await seedTestUsersIfEmpty();
  console.log(`🚀 Whop Backend hazır: Port ${PORT}`);
});