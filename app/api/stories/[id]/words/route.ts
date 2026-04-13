import { NextRequest } from 'next/server'
import { ok } from '@/lib/api'
import { readWordsData } from '@/lib/words-data'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const words = await readWordsData()
  const storyWords = words.filter((w: any) => w.story_id === parseInt(id))
  return ok(storyWords)
}
