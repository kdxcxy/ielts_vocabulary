import { ok, err } from '@/lib/api'
import { mockDb } from '@/lib/db/mock'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = mockDb.stories.find((s) => s.id === +id)
  if (!story) return err(404, '故事不存在')
  return ok(story)
}
