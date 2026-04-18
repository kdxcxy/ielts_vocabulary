import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { resetLearningStats } from '@/lib/home-stats.js'
import { getD1 } from '@/lib/db/d1'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const db = getD1()
  if (db) {
    await db.prepare('DELETE FROM learning_progress WHERE user_id = ?').bind(user.id).run()
    await db.prepare('DELETE FROM activity_log WHERE user_id = ?').bind(user.id).run()
    return ok({ success: true })
  }

  resetLearningStats({
    learningProgress: mockDb.learningProgress as any[],
    activityLog: mockDb.activityLog as Array<{ userId: number; date: string }>,
    userId: user.id,
  })

  return ok({ success: true })
}
