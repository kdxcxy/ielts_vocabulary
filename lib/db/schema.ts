import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('user'),
  activationCodeId: integer('activation_code_id'),
  status: integer('status').default(1),
  expiresAt: text('expires_at'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const activationCodes = sqliteTable('activation_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  durationType: text('duration_type').notNull(),
  isUsed: integer('is_used').default(0),
  userId: integer('user_id'),
  activatedAt: text('activated_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
})

export const stories = sqliteTable('stories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  coverUrl: text('cover_url'),
  wordCount: integer('word_count').default(0),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const vocabularies = sqliteTable('vocabularies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').notNull().unique(),
  phoneticUs: text('phonetic_us'),
  phoneticUk: text('phonetic_uk'),
  translation: text('translation').notNull(),
})

export const storyWords = sqliteTable('story_words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storyId: integer('story_id').notNull(),
  wordId: integer('word_id').notNull(),
  position: integer('position').default(0),
})

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  wordId: integer('word_id').notNull(),
  storyId: integer('story_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})

export const learningProgress = sqliteTable('learning_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  storyId: integer('story_id').notNull(),
  mode: text('mode').notNull(),
  completedWords: text('completed_words').default('[]'),
  correctCount: integer('correct_count').default(0),
  wrongCount: integer('wrong_count').default(0),
  lastReadAt: text('last_read_at').default(sql`CURRENT_TIMESTAMP`),
})
