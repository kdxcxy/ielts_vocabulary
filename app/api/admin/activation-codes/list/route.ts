import { NextRequest } from 'next/server'
import { err, getAuthUser, ok } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'
import { getD1 } from '@/lib/db/d1'

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.username !== 'kongdx') return err(403, '无权限')

  const db = getD1()
  if (db) {
    const rows = await db
      .prepare(
        `SELECT id, code, duration_type, activated_at, activated_username, activated_password,
                activated_expires_at, is_used, created_at
         FROM activation_codes
         WHERE is_deleted = 0
         ORDER BY id DESC`
      )
      .all()

    const result = (rows.results || []).map((code: any) => ({
      id: code.id,
      code: code.code,
      durationType: code.duration_type,
      activatedAt: code.activated_at ? formatTime(code.activated_at) : null,
      username: code.activated_username || null,
      password: code.activated_password || null,
      expiresAt: code.is_used
        ? code.duration_type === 'forever'
          ? '永久有效'
          : formatTime(code.activated_expires_at)
        : '-',
      status:
        code.is_used
          ? code.activated_expires_at && new Date(code.activated_expires_at) < new Date()
            ? 'expired'
            : 'active'
          : 'unused',
      createdAt: formatTime(code.created_at),
    }))

    return ok(result)
  }

  const result = mockDb.activationCodes
    .filter((code) => !code.is_deleted)
    .map((code) => ({
      id: code.id,
      code: code.code,
      durationType: code.duration_type,
      activatedAt: code.activated_at ? formatTime(code.activated_at) : null,
      username: code.activated_username || null,
      password: code.activated_password || null,
      expiresAt: code.is_used
        ? code.duration_type === 'forever'
          ? '永久有效'
          : formatTime(code.activated_expires_at)
        : '-',
      status:
        code.is_used
          ? code.activated_expires_at && new Date(code.activated_expires_at) < new Date()
            ? 'expired'
            : 'active'
          : 'unused',
      createdAt: formatTime(code.created_at),
    }))

  return ok(result)
}
