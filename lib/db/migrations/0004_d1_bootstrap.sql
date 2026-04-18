-- D1 bootstrap for current Cloudflare deployment
-- Covers the dynamic data that should leave mockDb first:
-- users, activation_codes, bookmarks, learning_progress, activity_log

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status INTEGER NOT NULL DEFAULT 1,
  activation_code_id INTEGER,
  expires_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS activation_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  duration_type TEXT NOT NULL,
  is_used INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER,
  activated_at TEXT,
  activated_username TEXT,
  activated_password TEXT,
  activated_expires_at TEXT,
  expires_at TEXT,
  invalidated_at TEXT,
  invalidated_by INTEGER,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (invalidated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_user_id ON activation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_deleted ON activation_codes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_used ON activation_codes(is_used);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  story_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_story_id ON bookmarks(story_id);

CREATE TABLE IF NOT EXISTS learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  viewed_words TEXT NOT NULL DEFAULT '[]',
  completed INTEGER NOT NULL DEFAULT 0,
  last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_story_id ON learning_progress(story_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

-- Seed current admin account from mockDb
INSERT INTO users (
  id,
  username,
  password_hash,
  role,
  status,
  expires_at,
  created_at
)
VALUES (
  1,
  'kongdx',
  'ff4596a662ca50e14981830df8f1a89b5eb8f5d8ea03fe1895cb2b699b5b1d7a',
  'admin',
  1,
  NULL,
  CURRENT_TIMESTAMP
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = excluded.role,
  status = excluded.status,
  expires_at = excluded.expires_at;
