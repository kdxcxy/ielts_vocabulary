import { NextRequest } from 'next/server'
import { err, getAuthUser, ok } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return err(401, '该账号已失效，请重新登录')

  const currentUser = mockDb.users.find((item) => item.id === user.id)
  if (!currentUser) return err(401, '该账号已失效，请重新登录')
  if (currentUser.status === 0) return err(401, '该账号已失效，请重新登录')
  if (currentUser.status === 2) return err(401, '该账号已过期，请重新登录')

  return ok({ username: user.username, role: user.role })
}
