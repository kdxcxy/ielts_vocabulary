import { normalizeBookmarkWord } from './bookmark-utils.js'

const MIN_COMPLETION_VIEWED_WORDS = 4

/**
 * @typedef {{ userId: number, word: string }} BookmarkStatItem
 * @typedef {{ userId: number, storyId: number, viewedWords: string[], completed: boolean, lastReadAt?: string }} LearningProgressItem
 * @typedef {{ userId: number, date: string }} ActivityLogItem
 */

function normalizeDateInput(date) {
  if (!date) return new Date()
  return date instanceof Date ? date : new Date(date)
}

function formatDateKey(date) {
  return normalizeDateInput(date).toISOString().slice(0, 10)
}

export function mergeViewedWords(existingWords = [], nextWord) {
  if (!nextWord) return [...existingWords]

  const normalizedNext = normalizeBookmarkWord(nextWord)
  const hasWord = existingWords.some((word) => normalizeBookmarkWord(word) === normalizedNext)
  if (hasWord) return [...existingWords]

  return [...existingWords, String(nextWord).trim()]
}

export function hasStoryBeenCompleted(entry) {
  if (!entry) return false
  if (entry.completed) return true

  return (entry.viewedWords || []).length >= MIN_COMPLETION_VIEWED_WORDS
}

/**
 * @param {{
 * learningProgress: LearningProgressItem[],
 * activityLog: ActivityLogItem[],
 * userId: number,
 * storyId: number,
 * viewedWord?: string,
 * markStoryCompleted?: boolean,
 * date?: string | Date
 * }} input
 */
export function recordLearningActivity({
  learningProgress,
  activityLog,
  userId,
  storyId,
  viewedWord,
  markStoryCompleted = false,
  date,
}) {
  const dateKey = formatDateKey(date)
  const timestamp = normalizeDateInput(date).toISOString()

  let entry = learningProgress.find((item) => item.userId === userId && item.storyId === storyId)

  if (!entry) {
    entry = {
      id: learningProgress.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1,
      userId,
      storyId,
      viewedWords: [],
      completed: false,
      lastReadAt: timestamp,
    }
    learningProgress.push(entry)
  }

  entry.viewedWords = mergeViewedWords(entry.viewedWords || [], viewedWord)
  entry.completed = markStoryCompleted || hasStoryBeenCompleted(entry)
  entry.lastReadAt = timestamp

  const alreadyLogged = activityLog.some((item) => item.userId === userId && item.date === dateKey)
  if (!alreadyLogged) {
    activityLog.push({ userId, date: dateKey })
  }

  return entry
}

function calculateStreakDays(activityLog, userId, today) {
  const userDates = new Set(
    activityLog.filter((item) => item.userId === userId).map((item) => item.date)
  )

  let streak = 0
  const cursor = normalizeDateInput(today)

  while (true) {
    const key = formatDateKey(cursor)
    if (!userDates.has(key)) break

    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

/**
 * @param {{
 * totalVocabulary?: number,
 * bookmarks?: BookmarkStatItem[],
 * learningProgress?: LearningProgressItem[],
 * activityLog?: ActivityLogItem[],
 * userId: number,
 * today?: string | Date
 * }} input
 */
export function buildHomeStats({
  totalVocabulary = 0,
  bookmarks = [],
  learningProgress = [],
  activityLog = [],
  userId,
  today,
}) {
  const userBookmarks = bookmarks.filter((item) => item.userId === userId)
  const userProgress = learningProgress.filter((item) => item.userId === userId)

  const learnedWordMap = new Map()

  for (const item of userProgress) {
    for (const word of item.viewedWords || []) {
      learnedWordMap.set(normalizeBookmarkWord(word), true)
    }
  }

  const learnedWords = learnedWordMap.size
  const progressPercent =
    totalVocabulary > 0 ? Math.min(100, (learnedWords / totalVocabulary) * 100) : 0

  return {
    learnedWords,
    totalVocabulary,
    progressPercent,
    streakDays: calculateStreakDays(activityLog, userId, today),
    completedStories: userProgress.filter((item) => item.completed).length,
    reviewCount: userBookmarks.length,
  }
}

/**
 * @param {{
 * learningProgress: LearningProgressItem[],
 * activityLog: ActivityLogItem[],
 * userId: number
 * }} input
 */
export function resetLearningStats({ learningProgress, activityLog, userId }) {
  for (let index = learningProgress.length - 1; index >= 0; index -= 1) {
    if (learningProgress[index].userId === userId) {
      learningProgress.splice(index, 1)
    }
  }

  for (let index = activityLog.length - 1; index >= 0; index -= 1) {
    if (activityLog[index].userId === userId) {
      activityLog.splice(index, 1)
    }
  }
}
