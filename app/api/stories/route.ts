import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get('categoryId')
  
  let filtered = mockDb.stories
  if (categoryId) {
    filtered = mockDb.stories.filter(s => s.categoryId === +categoryId)
  }

  return ok(filtered)
}
