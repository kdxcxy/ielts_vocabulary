import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { hashPassword, signJWT } from '@/lib/jwt'
import { mockDb } from '@/lib/db/mock'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return err(400, '用户名和密码不能为空')

  const user = mockDb.users.find(u => u.username === username)
  if (!user) return err(40001, '用户名或密码错误')

  const hash = await hashPassword(password)
  if (hash !== user.password_hash) return err(40001, '用户名或密码错误')

  if (user.status === 0) return err(40002, '账号已被禁用')
  if (user.status === 2) return err(40003, '您的账号已过期')

  const token = await signJWT({ id: user.id, username: user.username, role: user.role })
  return ok({ token, user: { id: user.id, username: user.username, role: user.role } })
}
