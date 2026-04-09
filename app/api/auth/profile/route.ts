import { NextRequest } from 'next/server'
import { ok, err, getAuthUser } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '未登录')
  return ok({ username: user.username, role: user.role })
}
