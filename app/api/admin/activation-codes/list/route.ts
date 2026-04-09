import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

function formatTime(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return err(403, '无权限')

  const result = mockDb.activationCodes.map(ac => ({
    id: ac.id,
    code: ac.code,
    durationType: ac.duration_type,
    activatedAt: ac.activated_at ? formatTime(ac.activated_at) : null,
    username: ac.activated_username || null,
    password: ac.activated_password || null,
    // 失效时间：已使用的从激活时间算，永久类型显示永久有效，未使用显示-
    expiresAt: ac.is_used
      ? (ac.duration_type === 'forever' ? '永久有效' : formatTime(ac.activated_expires_at))
      : '-',
    status: ac.is_used ? 'used' : 'unused',
    createdAt: formatTime(ac.created_at)
  }))

  return ok(result)
}
