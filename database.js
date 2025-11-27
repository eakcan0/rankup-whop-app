const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'leaderboard.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      whop_user_id TEXT PRIMARY KEY,
      username TEXT,
      avatar_url TEXT,
      points INTEGER DEFAULT 0
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

const updateUserPoints = async (userId, username, avatarUrl, pointsToAdd = 0) => {
  if (!userId) {
    throw new Error('userId is required');
  }

  await runAsync(
    `
      INSERT INTO users (whop_user_id, username, avatar_url, points)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(whop_user_id) DO UPDATE SET
        username = excluded.username,
        avatar_url = excluded.avatar_url,
        points = users.points + excluded.points
    `,
    [userId, username, avatarUrl, pointsToAdd]
  );

  return getAsync(`SELECT * FROM users WHERE whop_user_id = ?`, [userId]);
};

const getTopUsers = (limit = 50) => {
  return allAsync(
    `
      SELECT whop_user_id, username, avatar_url, points
      FROM users
      ORDER BY points DESC
      LIMIT ?
    `,
    [limit]
  );
};

const countUsers = () => getAsync(`SELECT COUNT(*) as total FROM users`);

const seedTestUsersIfEmpty = async () => {
  const { total } = (await countUsers()) || { total: 0 };
  if (total > 0) {
    return false;
  }

  const sampleNames = [
    'PlayerOne',
    'WhopKing',
    'AlphaRacer',
    'RankQueen',
    'SpeedRunner',
    'BuilderX',
    'MintMaster',
    'GrindLord',
    'LoopGuru',
    'ZenithZero'
  ];

  const sampleCount = Math.floor(Math.random() * 6) + 5; // 5-10 users
  const selections = sampleNames
    .sort(() => 0.5 - Math.random())
    .slice(0, sampleCount)
    .map((name, index) => ({
      id: `seed-${name.toLowerCase()}`,
      username: name,
      avatar: `https://avatar.vercel.sh/${name.toLowerCase()}`,
      points: 250 + index * 75 + Math.floor(Math.random() * 200)
    }));

  await Promise.all(
    selections.map((user) =>
      updateUserPoints(user.id, user.username, user.avatar, user.points)
    )
  );

  return true;
};

module.exports = {
  updateUserPoints,
  getTopUsers,
  seedTestUsersIfEmpty
};

