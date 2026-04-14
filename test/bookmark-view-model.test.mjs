import test from 'node:test'
import assert from 'node:assert/strict'

import { decorateBookmark, decorateBookmarks } from '../lib/bookmark-view-model.js'

test('decorateBookmark adds story title and word pronunciation details', () => {
  const bookmark = {
    id: 1,
    userId: 7,
    word: 'sorrowful',
    translation: '悲伤的',
    storyId: 2,
  }

  const stories = [{ id: 2, title: '故事2：雨夜重逢' }]
  const words = [
    {
      story_id: 2,
      word: 'sorrowful',
      meaning_cn: 'adj.悲伤的；哀伤的',
      phonetic_uk: 'ˈsɒrəfəl',
      phonetic_us: 'ˈsɑːroʊfəl',
      audio_uk: '/audio/sorrowful-uk.mp3',
      audio_us: '/audio/sorrowful-us.mp3',
    },
  ]

  const decorated = decorateBookmark(bookmark, stories, words)

  assert.equal(decorated.storyTitle, '故事2：雨夜重逢')
  assert.equal(decorated.meaningCn, 'adj.悲伤的；哀伤的')
  assert.equal(decorated.phoneticUk, 'ˈsɒrəfəl')
  assert.equal(decorated.audioUs, '/audio/sorrowful-us.mp3')
})

test('decorateBookmarks falls back to bookmark translation when word detail is absent', () => {
  const decorated = decorateBookmarks(
    [{ id: 2, userId: 1, word: 'unknown', translation: '未知词义', storyId: null }],
    [],
    []
  )

  assert.equal(decorated[0].meaningCn, '未知词义')
  assert.equal(decorated[0].storyTitle, '')
})
