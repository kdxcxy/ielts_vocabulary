import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildHomeStats,
  hasStoryBeenCompleted,
  mergeViewedWords,
  resetLearningStats,
  recordLearningActivity,
} from '../lib/home-stats.js'

test('mergeViewedWords deduplicates normalized words', () => {
  const merged = mergeViewedWords(['Gloomy', 'sorrowful'], ' gloomy ')
  assert.deepEqual(merged, ['Gloomy', 'sorrowful'])
})

test('hasStoryBeenCompleted requires enough viewed words or existing completion flag', () => {
  assert.equal(hasStoryBeenCompleted({ completed: false, viewedWords: ['a', 'b', 'c'] }), false)
  assert.equal(hasStoryBeenCompleted({ completed: false, viewedWords: ['a', 'b', 'c', 'd'] }), true)
  assert.equal(hasStoryBeenCompleted({ completed: true, viewedWords: [] }), true)
})

test('recordLearningActivity creates and updates per-story learning entries', () => {
  const progress = []
  const activities = []

  recordLearningActivity({
    learningProgress: progress,
    activityLog: activities,
    userId: 1,
    storyId: 8,
    viewedWord: 'Various',
    date: '2026-04-14T10:00:00.000Z',
  })

  recordLearningActivity({
    learningProgress: progress,
    activityLog: activities,
    userId: 1,
    storyId: 8,
    viewedWord: 'various',
    markStoryCompleted: true,
    date: '2026-04-14T10:05:00.000Z',
  })

  assert.equal(progress.length, 1)
  assert.equal(progress[0].storyId, 8)
  assert.equal(progress[0].completed, true)
  assert.deepEqual(progress[0].viewedWords, ['Various'])
  assert.equal(activities.length, 1)
  assert.equal(activities[0].date, '2026-04-14')
})

test('buildHomeStats returns progress, streak, completed stories and review counts', () => {
  const stats = buildHomeStats({
    totalVocabulary: 9400,
    bookmarks: [
      { userId: 1, word: 'gloomy' },
      { userId: 1, word: 'sorrowful' },
      { userId: 2, word: 'alien' },
    ],
    learningProgress: [
      { userId: 1, storyId: 2, viewedWords: ['Gloomy', 'bleak'], completed: true },
      { userId: 1, storyId: 3, viewedWords: ['sorrowful'], completed: false },
    ],
    activityLog: [
      { userId: 1, date: '2026-04-14' },
      { userId: 1, date: '2026-04-13' },
      { userId: 1, date: '2026-04-12' },
      { userId: 2, date: '2026-04-14' },
    ],
    userId: 1,
    today: '2026-04-14',
  })

  assert.equal(stats.learnedWords, 3)
  assert.equal(stats.totalVocabulary, 9400)
  assert.equal(stats.reviewCount, 2)
  assert.equal(stats.completedStories, 1)
  assert.equal(stats.streakDays, 3)
})

test('resetLearningStats clears current user progress and activity only', () => {
  const learningProgress = [
    { userId: 1, storyId: 2, viewedWords: ['gloomy'], completed: true },
    { userId: 2, storyId: 3, viewedWords: ['alien'], completed: true },
  ]
  const activityLog = [
    { userId: 1, date: '2026-04-14' },
    { userId: 2, date: '2026-04-14' },
  ]

  resetLearningStats({ learningProgress, activityLog, userId: 1 })

  assert.deepEqual(learningProgress, [
    { userId: 2, storyId: 3, viewedWords: ['alien'], completed: true },
  ])
  assert.deepEqual(activityLog, [{ userId: 2, date: '2026-04-14' }])
})
