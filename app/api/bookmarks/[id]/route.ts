import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { getD1 } from '@/lib/db/d1'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const bookmarkId = Number(id)
  if (Number.isNaN(bookmarkId)) return err(400, '参数错误')

  const db = getD1()
  if (db) {
    const bookmark = await db
      .prepare('SELECT id FROM bookmarks WHERE id = ? AND user_id = ? LIMIT 1')
      .bind(bookmarkId, user.id)
      .first()

    if (!bookmark) {
      return err(404, '收藏不存在')
    }

    await db.prepare('DELETE FROM bookmarks WHERE id = ?').bind(bookmarkId).run()
    return ok({ success: true })
  }

  const index = mockDb.bookmarks.findIndex(
    (bookmark) => bookmark.id === bookmarkId && bookmark.userId === user.id
  )

  if (index === -1) {
    return err(404, '收藏不存在')
  }

  mockDb.bookmarks.splice(index, 1)
  return ok({ success: true })
}
