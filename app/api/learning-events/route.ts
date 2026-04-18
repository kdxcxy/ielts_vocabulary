import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { recordLearningActivity } from '@/lib/home-stats.js'
import { getD1 } from '@/lib/db/d1'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const { storyId, viewedWord, markStoryCompleted } = await req.json()

  if (!storyId) {
    return err(400, '故事编号必填')
  }

  const db = getD1()
  if (db) {
    const timestamp = new Date().toISOString()
    const dateKey = timestamp.slice(0, 10)

    const existing = await db
      .prepare(
        'SELECT id, user_id, story_id, viewed_words, completed, last_read_at FROM learning_progress WHERE user_id = ? AND story_id = ? LIMIT 1'
      )
      .bind(user.id, Number(storyId))
      .first()

    let viewedWords: string[] = []
    let completed = false
    let progressId: number | null = null

    if (existing) {
      progressId = Number(existing.id)
      viewedWords = JSON.parse(String(existing.viewed_words || '[]'))
      completed = Boolean(existing.completed)
    }

    const normalizedWord = String(viewedWord || '').trim()
    if (normalizedWord && !viewedWords.includes(normalizedWord)) {
      viewedWords.push(normalizedWord)
    }

    completed = Boolean(markStoryCompleted) || completed || viewedWords.length >= 4

    if (progressId) {
      await db
        .prepare(
          'UPDATE learning_progress SET viewed_words = ?, completed = ?, last_read_at = ? WHERE id = ?'
        )
        .bind(JSON.stringify(viewedWords), completed ? 1 : 0, timestamp, progressId)
        .run()
    } else {
      const insertResult = await db
        .prepare(
          'INSERT INTO learning_progress (user_id, story_id, viewed_words, completed, last_read_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(user.id, Number(storyId), JSON.stringify(viewedWords), completed ? 1 : 0, timestamp)
        .run()
      progressId = Number(insertResult.meta?.last_row_id)
    }

    await db
      .prepare(
        'INSERT INTO activity_log (user_id, date, created_at) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO NOTHING'
      )
      .bind(user.id, dateKey, timestamp)
      .run()

    return ok({
      id: progressId,
      userId: user.id,
      storyId: Number(storyId),
      viewedWords,
      completed,
      lastReadAt: timestamp,
    })
  }

  const learningProgress = mockDb.learningProgress as any[]
  const activityLog = mockDb.activityLog as Array<{ userId: number; date: string }>

  const entry = recordLearningActivity({
    learningProgress,
    activityLog,
    userId: user.id,
    storyId: Number(storyId),
    viewedWord: viewedWord || '',
    markStoryCompleted: Boolean(markStoryCompleted),
    date: new Date(),
  })

  return ok(entry)
}
