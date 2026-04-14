import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const index = mockDb.bookmarks.findIndex(
    (bookmark) => bookmark.id === +id && bookmark.userId === user.id
  )

  if (index === -1) {
    return err(404, '收藏不存在')
  }

  mockDb.bookmarks.splice(index, 1)
  return ok({ success: true })
}
