import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { recordLearningActivity } from '@/lib/home-stats.js'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const { storyId, viewedWord, markStoryCompleted } = await req.json()

  if (!storyId) {
    return err(400, '故事编号必填')
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
