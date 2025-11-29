const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, process.env.DB_FILE || 'leaderboard.db');
const db = new sqlite3.Database(DB_PATH);

const DEFAULT_MSG_POINTS = Number(process.env.DEFAULT_POINTS_PER_MSG || 10);
const DEFAULT_JOIN_POINTS = Number(process.env.DEFAULT_POINTS_PER_JOIN || 50);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS settings');
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      company_id TEXT PRIMARY KEY,
      points_per_msg INTEGER DEFAULT ${DEFAULT_MSG_POINTS},
      points_per_join INTEGER DEFAULT ${DEFAULT_JOIN_POINTS}
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      company_id TEXT NOT NULL,
      whop_user_id TEXT NOT NULL,
      username TEXT,
      avatar_url TEXT,
      points INTEGER DEFAULT 0,
      PRIMARY KEY (company_id, whop_user_id),
      FOREIGN KEY (company_id) REFERENCES settings(company_id) ON DELETE CASCADE
    )
  `);
});

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function handleRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

const ensureCompanySettings = async (companyId) => {
  if (!companyId) {
    throw new Error('companyId is required');
  }

  await runAsync(
    `
      INSERT INTO settings (company_id, points_per_msg, points_per_join)
      VALUES (?, ?, ?)
      ON CONFLICT(company_id) DO NOTHING
    `,
    [companyId, DEFAULT_MSG_POINTS, DEFAULT_JOIN_POINTS]
  );

  return getCompanySettings(companyId);
};

const getCompanySettings = (companyId) =>
  getAsync(
    `
      SELECT company_id, points_per_msg, points_per_join
      FROM settings
      WHERE company_id = ?
    `,
    [companyId]
  );

const updateCompanySettings = async (companyId, updates = {}) => {
  const current = (await ensureCompanySettings(companyId)) || {};
  const next = {
    points_per_msg:
      updates.points_per_msg !== undefined
        ? Number(updates.points_per_msg)
        : current.points_per_msg ?? DEFAULT_MSG_POINTS,
    points_per_join:
      updates.points_per_join !== undefined
        ? Number(updates.points_per_join)
        : current.points_per_join ?? DEFAULT_JOIN_POINTS
  };

  await runAsync(
    `UPDATE settings SET points_per_msg = ?, points_per_join = ? WHERE company_id = ?`,
    [next.points_per_msg, next.points_per_join, companyId]
  );

  return getCompanySettings(companyId);
};

const updateUserPoints = async (
  companyId,
  userId,
  username,
  avatarUrl,
  pointsToAdd = 0
) => {
  if (!companyId || !userId) {
    throw new Error('companyId and userId are required');
  }

  await ensureCompanySettings(companyId);

  await runAsync(
    `
      INSERT INTO users (company_id, whop_user_id, username, avatar_url, points)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(company_id, whop_user_id) DO UPDATE SET
        username = excluded.username,
        avatar_url = excluded.avatar_url,
        points = users.points + excluded.points
    `,
    [companyId, userId, username, avatarUrl, pointsToAdd]
  );

  return getAsync(
    `SELECT * FROM users WHERE company_id = ? AND whop_user_id = ?`,
    [companyId, userId]
  );
};

const setUserPoints = async (companyId, userId, username, avatarUrl, targetPoints) => {
  const existing = (await updateUserPoints(companyId, userId, username, avatarUrl, 0)) || {
    points: 0
  };
  const delta = targetPoints - (existing.points ?? 0);
  if (delta !== 0) {
    return updateUserPoints(companyId, userId, username, avatarUrl, delta);
  }
  return existing;
};

const getTopUsers = (companyId, limit = 50) =>
  allAsync(
    `
      SELECT whop_user_id, username, avatar_url, points
      FROM users
      WHERE company_id = ?
      ORDER BY points DESC
      LIMIT ?
    `,
    [companyId, limit]
  );

const seedDemoCompany = async (companyId = 'demo-company') => {
  await ensureCompanySettings(companyId);
  const existing = await getTopUsers(companyId, 1);
  if (existing.length > 0) {
    return false;
  }

  const sampleUsers = [
    'PlayerOne',
    'CyberNova',
    'WhopKing',
    'RankQueen',
    'LoopGuru'
  ];

  await Promise.all(
    sampleUsers.map((name, index) =>
      updateUserPoints(
        companyId,
        `seed-${name.toLowerCase()}`,
        name,
        `https://avatar.vercel.sh/${name}`,
        250 + index * 50
      )
    )
  );
  return true;
};

module.exports = {
  ensureCompanySettings,
  getCompanySettings,
  updateCompanySettings,
  updateUserPoints,
  setUserPoints,
  getTopUsers,
  seedDemoCompany,
  DEFAULT_MSG_POINTS,
  DEFAULT_JOIN_POINTS
};

