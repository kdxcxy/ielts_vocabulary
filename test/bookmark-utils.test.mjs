import test from 'node:test'
import assert from 'node:assert/strict'

import {
  findBookmarkByWord,
  normalizeBookmarkWord,
  sortBookmarksByNewest,
  upsertBookmark,
} from '../lib/bookmark-utils.js'

test('normalizeBookmarkWord trims and lowercases bookmark words', () => {
  assert.equal(normalizeBookmarkWord('  Gloomy  '), 'gloomy')
})

test('upsertBookmark deduplicates by user and normalized word', () => {
  const bookmarks = [
    { id: 1, userId: 1, word: 'gloomy', translation: '阴暗的', storyId: 2, createdAt: '2026-04-14T10:00:00.000Z' },
  ]

  const duplicated = upsertBookmark(bookmarks, {
    userId: 1,
    word: '  GLOOMY ',
    translation: '郁闷的',
    storyId: 7,
  })

  assert.equal(duplicated.created, false)
  assert.equal(duplicated.bookmark.id, 1)
  assert.equal(bookmarks.length, 1)
})

test('upsertBookmark creates a new bookmark for a different word', () => {
  const bookmarks = []

  const created = upsertBookmark(bookmarks, {
    userId: 1,
    word: 'sorrowful',
    translation: '悲伤的',
    storyId: 5,
    createdAt: '2026-04-14T10:05:00.000Z',
  })

  assert.equal(created.created, true)
  assert.equal(created.bookmark.word, 'sorrowful')
  assert.equal(bookmarks.length, 1)
})

test('findBookmarkByWord returns matching bookmark by normalized word', () => {
  const bookmark = findBookmarkByWord(
    [{ id: 2, userId: 1, word: 'gloomy', translation: '阴暗的', storyId: 2 }],
    1,
    ' GLOOMY '
  )

  assert.equal(bookmark?.id, 2)
})

test('sortBookmarksByNewest sorts descending by created time', () => {
  const sorted = sortBookmarksByNewest([
    { id: 1, createdAt: '2026-04-14T08:00:00.000Z' },
    { id: 2, createdAt: '2026-04-14T12:00:00.000Z' },
  ])

  assert.deepEqual(
    sorted.map((item) => item.id),
    [2, 1]
  )
})
