import { NextRequest } from 'next/server'
import { err, getAuthUser, ok } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { getD1 } from '@/lib/db/d1'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req)
  if (!user || user.username !== 'kongdx') return err(403, '无权限')

  const { id } = await params
  const codeId = Number(id)
  if (Number.isNaN(codeId)) return err(400, '参数错误')

  const db = getD1()
  if (db) {
    const code = await db
      .prepare('SELECT id, user_id FROM activation_codes WHERE id = ? AND is_deleted = 0 LIMIT 1')
      .bind(codeId)
      .first()

    if (!code) return err(404, '激活码不存在')

    let invalidatedUser: { id: number; username: string } | null = null
    if (code.user_id) {
      const linkedUser = await db
        .prepare('SELECT id, username FROM users WHERE id = ? LIMIT 1')
        .bind(code.user_id)
        .first()

      if (linkedUser && linkedUser.username !== 'kongdx') {
        await db.prepare('UPDATE users SET status = 0 WHERE id = ?').bind(linkedUser.id).run()
        invalidatedUser = { id: Number(linkedUser.id), username: String(linkedUser.username) }
      }
    }

    const now = new Date().toISOString()
    await db
      .prepare(
        `UPDATE activation_codes
         SET deleted_at = ?, invalidated_at = ?, invalidated_by = ?, is_deleted = 1, is_used = 1, expires_at = ?, activated_expires_at = ?
         WHERE id = ?`
      )
      .bind(now, now, user.id, now, now, codeId)
      .run()

    return ok({
      deleted: true,
      invalidatedUser,
    })
  }

  const code = mockDb.activationCodes.find((item) => item.id === codeId && !item.is_deleted)
  if (!code) return err(404, '激活码不存在')

  let invalidatedUser: { id: number; username: string } | null = null
  if (code.user_id) {
    const linkedUser = mockDb.users.find((item) => item.id === code.user_id)
    if (linkedUser && linkedUser.username !== 'kongdx') {
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
