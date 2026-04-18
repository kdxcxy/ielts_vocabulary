import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { findBookmarkByWord, sortBookmarksByNewest, upsertBookmark } from '@/lib/bookmark-utils'
import { decorateBookmark, decorateBookmarks } from '@/lib/bookmark-view-model.js'
import { readWordsData } from '@/lib/words-data'
import { getD1 } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const word = req.nextUrl.searchParams.get('word')
  const words = await readWordsData()

  const db = getD1()
  if (db) {
    const bookmarkRows = await db
      .prepare(
        `SELECT id, user_id, word, translation, story_id, created_at
         FROM bookmarks
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC, id DESC`
      )
      .bind(user.id)
      .all()

    const userBookmarks = (bookmarkRows.results || []).map((bookmark: any) => ({
      id: Number(bookmark.id),
      userId: Number(bookmark.user_id),
      word: String(bookmark.word),
      translation: String(bookmark.translation),
      storyId: bookmark.story_id === null ? null : Number(bookmark.story_id),
      createdAt: String(bookmark.created_at),
    }))

    if (word) {
      const bookmark = findBookmarkByWord(userBookmarks, user.id, word)
      return ok(bookmark ? decorateBookmark(bookmark, mockDb.stories, words) : null)
    }

    return ok(decorateBookmarks(userBookmarks, mockDb.stories, words))
  }

  const userBookmarks = sortBookmarksByNewest(mockDb.bookmarks.filter((b) => b.userId === user.id))

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

  const db = getD1()
  if (db) {
    const existing = await db
      .prepare(
        'SELECT id, user_id, word, translation, story_id, created_at FROM bookmarks WHERE user_id = ? AND lower(word) = lower(?) LIMIT 1'
      )
      .bind(user.id, word)
      .first()

    if (existing) {
      return ok({
        success: true,
        created: false,
        bookmark: {
          id: Number(existing.id),
          userId: Number(existing.user_id),
          word: String(existing.word),
          translation: String(existing.translation),
          storyId: existing.story_id === null ? null : Number(existing.story_id),
          createdAt: String(existing.created_at),
        },
      })
    }

    const createdAt = new Date().toISOString()
    const insertResult = await db
      .prepare(
        'INSERT INTO bookmarks (user_id, word, translation, story_id, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(user.id, String(word).trim(), String(translation).trim(), storyId || null, createdAt)
      .run()

    return ok({
      success: true,
      created: true,
      bookmark: {
        id: Number(insertResult.meta?.last_row_id),
        userId: user.id,
        word: String(word).trim(),
        translation: String(translation).trim(),
        storyId: storyId || null,
        createdAt,
      },
    })
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
