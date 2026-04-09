import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const userBookmarks = mockDb.bookmarks.filter(b => b.userId === user.id)
  return ok(userBookmarks)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const { word, translation, storyId } = await req.json()
  
  mockDb.bookmarks.push({
    id: mockDb.bookmarks.length + 1,
    userId: user.id,
    word,
    translation,
    storyId: storyId || null
  })

  return ok({ success: true })
}
