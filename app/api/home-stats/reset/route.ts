import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { resetLearningStats } from '@/lib/home-stats.js'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  resetLearningStats({
    learningProgress: mockDb.learningProgress as any[],
    activityLog: mockDb.activityLog as Array<{ userId: number; date: string }>,
    userId: user.id,
  })

  return ok({ success: true })
}
