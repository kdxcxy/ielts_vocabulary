import { NextRequest } from 'next/server'
import { err, getAuthUser, ok } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return err(403, '无权限')

  const { id } = await params
  const codeId = Number(id)
  if (Number.isNaN(codeId)) return err(400, '参数错误')

  const code = mockDb.activationCodes.find((item) => item.id === codeId && !item.is_deleted)
  if (!code) return err(404, '激活码不存在')

  let invalidatedUser: { id: number; username: string } | null = null
  if (code.user_id) {
    const linkedUser = mockDb.users.find((item) => item.id === code.user_id)
    if (linkedUser && linkedUser.role !== 'admin') {
      linkedUser.status = 0
      invalidatedUser = { id: linkedUser.id, username: linkedUser.username }
    }
  }

  const now = new Date().toISOString()
  code.deleted_at = now
  code.invalidated_at = now
  code.invalidated_by = user.id
  code.is_deleted = 1
  code.is_used = 1
  code.expires_at = now
  code.activated_expires_at = now

  return ok({
    deleted: true,
    invalidatedUser,
  })
}
