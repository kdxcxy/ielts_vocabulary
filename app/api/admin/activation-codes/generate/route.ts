import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'
import { generateActivationCode } from '@/lib/codeGenerator'
import { mockDb } from '@/lib/db/mock'
import { getD1 } from '@/lib/db/d1'

function getExpiresAt(_durationType: string): string | null {
  return null
}

function formatExpiresAt(expiresAt: string | null): string {
  if (!expiresAt) return '永久有效'
  const d = new Date(expiresAt)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.username !== 'kongdx') return err(403, '无权限')

  const { count, durationType } = await req.json()
  if (!count || !durationType) return err(400, '参数错误')

  const codes: string[] = []
  const expiresAt = getExpiresAt(durationType)

  const db = getD1()
  if (db) {
    for (let i = 0; i < count; i++) {
      const code = generateActivationCode()
      codes.push(code)
      await db
        .prepare(
          'INSERT INTO activation_codes (code, duration_type, is_used, expires_at, created_at) VALUES (?, ?, 0, ?, ?)'
        )
        .bind(code, durationType, expiresAt, new Date().toISOString())
        .run()
    }

    return ok({
      codes,
      generatedCount: codes.length,
      durationType,
      expiresAt: formatExpiresAt(expiresAt),
    })
  }

  for (let i = 0; i < count; i++) {
    const code = generateActivationCode()
    codes.push(code)
    mockDb.activationCodes.push({
      id: mockDb.activationCodes.length + 1,
      code,
      duration_type: durationType,
      is_used: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    })
  }

  return ok({
    codes,
    generatedCount: codes.length,
    durationType,
    expiresAt: formatExpiresAt(expiresAt),
  })
}
