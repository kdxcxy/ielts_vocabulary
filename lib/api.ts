import { NextRequest } from 'next/server'
import { verifyJWT } from './jwt'
import { mockDb } from './db/mock'

export async function getAuthUser(req: NextRequest): Promise<{ id: number; username: string; role: string } | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.cookies.get('token')?.value
  if (!token) return null
  const payload = await verifyJWT(token)
  if (!payload) return null

  const user = payload as { id: number; username: string; role: string }
  const currentUser = mockDb.users.find((item) => item.id === user.id)
  if (!currentUser) return null
  if (currentUser.status !== 1) return null

  if (currentUser.expires_at) {
    const expiresAt = new Date(currentUser.expires_at)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      currentUser.status = 2
      return null
    }
  }

  return user
}

export function ok(data: unknown) {
  return Response.json({ code: 200, message: 'success', data })
}

export function err(code: number, message: string) {
  return Response.json({ code, message, data: null }, { status: code < 1000 ? code : 400 })
}
