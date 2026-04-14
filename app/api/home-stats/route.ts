import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { buildHomeStats } from '@/lib/home-stats.js'
import { getTotalVocabularyCount } from '@/lib/total-vocabulary.js'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')
  const totalVocabulary = await getTotalVocabularyCount()

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
