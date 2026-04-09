import { NextRequest } from 'next/server'
import { verifyJWT } from './jwt'

export async function getAuthUser(req: NextRequest): Promise<{ id: number; username: string; role: string } | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.cookies.get('token')?.value
  if (!token) return null
  const payload = await verifyJWT(token)
  if (!payload) return null
  return payload as { id: number; username: string; role: string }
}

export function ok(data: unknown) {
  return Response.json({ code: 200, message: 'success', data })
}

export function err(code: number, message: string) {
  return Response.json({ code, message, data: null }, { status: code < 1000 ? code : 400 })
}
