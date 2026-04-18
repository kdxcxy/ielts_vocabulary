import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { hashPassword, signJWT } from '@/lib/jwt'
import { mockDb } from '@/lib/db/mock'
import { calculateExpiresAt } from '@/lib/codeGenerator'
import { getD1 } from '@/lib/db/d1'

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

export async function POST(req: NextRequest) {
  const { username, password, activationCode } = await req.json()
  if (!username || !password || !activationCode) return err(400, '所有字段不能为空')

  const db = getD1()
  if (db) {
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE username = ? LIMIT 1')
      .bind(username)
      .first()
    if (existingUser) return err(40010, '用户名已被使用')

    const code = await db
      .prepare('SELECT * FROM activation_codes WHERE code = ? AND is_deleted = 0 LIMIT 1')
      .bind(activationCode)
      .first()

    if (!code) return err(40011, '激活码无效')
    if (code.is_used) return err(40012, '该激活码已被使用')

    const now = new Date()
    const expiresAt = calculateExpiresAt(code.duration_type, now)
    const passwordHash = await hashPassword(password)

    const createUserResult = await db
      .prepare(
        'INSERT INTO users (username, password_hash, role, status, expires_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(username, passwordHash, 'user', 1, expiresAt?.toISOString() ?? null)
      .run()

    const userId = Number(createUserResult.meta?.last_row_id)

    await db
      .prepare(
        'UPDATE activation_codes SET is_used = 1, user_id = ?, activated_at = ?, activated_username = ?, activated_password = ?, activated_expires_at = ? WHERE id = ?'
      )
      .bind(
        userId,
        now.toISOString(),
        username,
        password,
        getActivatedExpiresAt(code.duration_type),
        code.id
      )
      .run()

    const token = await signJWT({ id: userId, username, role: 'user' })
    return ok({ token, user: { id: userId, username, role: 'user' } })
  }

  if (mockDb.users.find((u) => u.username === username)) return err(40010, '用户名已被使用')

  const code = mockDb.activationCodes.find((c) => c.code === activationCode)
  if (!code) return err(40011, '激活码无效')
  if (code.is_used) return err(40012, '该激活码已被使用')

  const now = new Date()
  const expiresAt = calculateExpiresAt(code.duration_type, now)
  const passwordHash = await hashPassword(password)

  const userId = mockDb.users.length + 1
  mockDb.users.push({
    id: userId,
    username,
    password_hash: passwordHash,
    role: 'user',
    status: 1,
    expires_at: expiresAt?.toISOString() ?? null,
  })

  code.is_used = 1
  code.user_id = userId
  code.activated_at = now.toISOString()
  code.activated_username = username
  code.activated_password = password
  code.activated_expires_at = getActivatedExpiresAt(code.duration_type)

  const token = await signJWT({ id: userId, username, role: 'user' })
  return ok({ token, user: { id: userId, username, role: 'user' } })
}
