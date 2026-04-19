import { normalizeBookmarkWord } from './bookmark-utils.js'
import { proxifyAudioUrl } from './audio-url.js'

function findStoryTitle(stories, storyId) {
  if (!storyId) return ''

  const story = stories.find((item) => item.id === storyId)
  return story?.title || ''
}

function findWordDetail(words, bookmark) {
  const normalizedWord = normalizeBookmarkWord(bookmark.word)

  const sameStoryWord = words.find(
    (item) =>
      item.story_id === bookmark.storyId &&
      normalizeBookmarkWord(item.word) === normalizedWord
  )

  if (sameStoryWord) return sameStoryWord

  return (
    words.find((item) => normalizeBookmarkWord(item.word) === normalizedWord) || null
  )
}

export function decorateBookmark(bookmark, stories, words) {
  const wordDetail = findWordDetail(words, bookmark)

  return {
    ...bookmark,
    storyTitle: findStoryTitle(stories, bookmark.storyId),
    meaningCn: wordDetail?.meaning_cn || bookmark.translation,
    phoneticUk: wordDetail?.phonetic_uk || '',
    phoneticUs: wordDetail?.phonetic_us || '',
    audioUk: proxifyAudioUrl(wordDetail?.audio_uk),
    audioUs: proxifyAudioUrl(wordDetail?.audio_us),
  }
}

export function decorateBookmarks(bookmarks, stories, words) {
  return bookmarks.map((bookmark) => decorateBookmark(bookmark, stories, words))
}
