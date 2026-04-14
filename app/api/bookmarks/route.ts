import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { findBookmarkByWord, sortBookmarksByNewest, upsertBookmark } from '@/lib/bookmark-utils'
import { decorateBookmark, decorateBookmarks } from '@/lib/bookmark-view-model.js'
import { readWordsData } from '@/lib/words-data'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const word = req.nextUrl.searchParams.get('word')
  const userBookmarks = sortBookmarksByNewest(mockDb.bookmarks.filter((b) => b.userId === user.id))
  const words = await readWordsData()

  if (word) {
    const bookmark = findBookmarkByWord(userBookmarks, user.id, word)
    return ok(bookmark ? decorateBookmark(bookmark, mockDb.stories, words) : null)
  }

  return ok(decorateBookmarks(userBookmarks, mockDb.stories, words))
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const { word, translation, storyId } = await req.json()

  if (!word || !translation) {
    return err(400, '单词和释义必填')
  }

  const result = upsertBookmark(mockDb.bookmarks, {
    userId: user.id,
    word,
    translation,
    storyId: storyId || null,
  })

  return ok({
    success: true,
    created: result.created,
    bookmark: result.bookmark,
  })
}
