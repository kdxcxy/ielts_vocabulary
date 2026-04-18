import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { buildHomeStats } from '@/lib/home-stats.js'
import { getTotalVocabularyCount } from '@/lib/total-vocabulary.js'
import { getD1 } from '@/lib/db/d1'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')
  const totalVocabulary = await getTotalVocabularyCount()

  const db = getD1()
  if (db) {
    const [bookmarkRows, progressRows, activityRows] = await Promise.all([
      db.prepare('SELECT user_id, word FROM bookmarks WHERE user_id = ?').bind(user.id).all(),
      db
        .prepare('SELECT user_id, story_id, viewed_words, completed FROM learning_progress WHERE user_id = ?')
        .bind(user.id)
        .all(),
      db.prepare('SELECT user_id, date FROM activity_log WHERE user_id = ?').bind(user.id).all(),
    ])

    const bookmarks = (bookmarkRows.results || []).map((item: any) => ({
      userId: Number(item.user_id),
      word: String(item.word),
    }))
    const learningProgress = (progressRows.results || []).map((item: any) => ({
      userId: Number(item.user_id),
      storyId: Number(item.story_id),
      viewedWords: JSON.parse(String(item.viewed_words || '[]')),
      completed: Boolean(item.completed),
    }))
    const activityLog = (activityRows.results || []).map((item: any) => ({
      userId: Number(item.user_id),
      date: String(item.date),
    }))

    return ok(
      buildHomeStats({
        totalVocabulary,
        bookmarks,
        learningProgress,
        activityLog,
        userId: user.id,
        today: new Date(),
      })
    )
  }

  const bookmarks = mockDb.bookmarks as Array<{ userId: number; word: string }>
  const learningProgress = mockDb.learningProgress as Array<{
    userId: number
    storyId: number
    viewedWords: string[]
    completed: boolean
  }>
  const activityLog = mockDb.activityLog as Array<{ userId: number; date: string }>

  return ok(
    buildHomeStats({
      totalVocabulary,
      bookmarks,
      learningProgress,
      activityLog,
      userId: user.id,
      today: new Date(),
    })
  )
}
