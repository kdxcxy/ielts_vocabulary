import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')

  const index = mockDb.bookmarks.findIndex(b => b.id === +id && b.userId === user.id)
  if (index > -1) mockDb.bookmarks.splice(index, 1)

  return ok({ success: true })
}
