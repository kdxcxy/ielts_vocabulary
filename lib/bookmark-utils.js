export function normalizeBookmarkWord(word) {
  return String(word || '').trim().toLowerCase()
}

export function findBookmarkByWord(bookmarks, userId, word) {
  const normalizedWord = normalizeBookmarkWord(word)
  return (
    bookmarks.find(
      (bookmark) =>
        bookmark.userId === userId &&
        normalizeBookmarkWord(bookmark.word) === normalizedWord
    ) || null
  )
}

export function upsertBookmark(bookmarks, input) {
  const existing = findBookmarkByWord(bookmarks, input.userId, input.word)
  if (existing) {
    return { bookmark: existing, created: false }
  }

  const nextBookmark = {
    id: bookmarks.reduce((maxId, bookmark) => Math.max(maxId, bookmark.id || 0), 0) + 1,
    userId: input.userId,
    word: String(input.word || '').trim(),
    translation: String(input.translation || '').trim(),
    storyId: input.storyId ?? null,
    createdAt: input.createdAt || new Date().toISOString(),
  }

  bookmarks.push(nextBookmark)
  return { bookmark: nextBookmark, created: true }
}

export function sortBookmarksByNewest(bookmarks) {
  return [...bookmarks].sort((left, right) => {
    const rightTime = new Date(right.createdAt || 0).getTime()
    const leftTime = new Date(left.createdAt || 0).getTime()
    return rightTime - leftTime
  })
}
