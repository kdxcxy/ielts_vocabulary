-- 创建故事表
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  word_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建词汇表
CREATE TABLE IF NOT EXISTS vocabularies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  phonetic_us TEXT,
  phonetic_uk TEXT,
  translation TEXT NOT NULL
);

-- 创建故事-词汇关联表
CREATE TABLE IF NOT EXISTS story_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  position INTEGER DEFAULT 0
);
