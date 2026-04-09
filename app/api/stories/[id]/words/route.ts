import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'

const words = require('@/data/words.json')

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const storyWords = words.filter((w: any) => w.story_id === parseInt(id))
  return ok(storyWords)
}
