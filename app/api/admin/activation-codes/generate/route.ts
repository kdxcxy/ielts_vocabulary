import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { generateActivationCode } from '@/lib/codeGenerator'
import { mockDb } from '@/lib/db/mock'

function getExpiresAt(durationType: string): string | null {
  // 生成时不设置失效时间，等激活时再计算
  return null
}

function getActivatedExpiresAt(durationType: string): string | null {
  const now = new Date()
  switch (durationType) {
    case '1min':
      now.setMinutes(now.getMinutes() + 1)
      return now.toISOString()
    case '24h':
      now.setHours(now.getHours() + 24)
      return now.toISOString()
    case '1year':
      now.setFullYear(now.getFullYear() + 1)
      return now.toISOString()
    case 'forever':
      return null
    default:
      return null
  }
}

function formatExpiresAt(expiresAt: string | null): string {
  if (!expiresAt) return '永久有效'
  const d = new Date(expiresAt)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.username !== 'kongdx') return err(403, '无权限')

  const { count, durationType } = await req.json()
  if (!count || !durationType) return err(400, '参数错误')

  const codes: string[] = []
  const expiresAt = getExpiresAt(durationType)

  for (let i = 0; i < count; i++) {
    const code = generateActivationCode()
    codes.push(code)
    mockDb.activationCodes.push({
      id: mockDb.activationCodes.length + 1,
      code,
      duration_type: durationType,
      is_used: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    })
  }

  return ok({
    codes,
    generatedCount: codes.length,
    durationType,
    expiresAt: formatExpiresAt(expiresAt)
  })
}

