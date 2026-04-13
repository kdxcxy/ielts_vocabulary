import { ok, err } from '@/lib/api'
import { resolveDictionaryDetail } from '@/lib/dictionary'
import { normalizeOxfordWord } from '@/lib/oxford'

const detailCache = new Map<string, Awaited<ReturnType<typeof resolveDictionaryDetail>>>()

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ word: string }> }
) {
  const { word } = await params
  const normalized = normalizeOxfordWord(word)
  if (!normalized) return err(400, 'word is required')

  const cached = detailCache.get(normalized)
  if (cached) {
    return ok(cached)
  }

  const resolved = await resolveDictionaryDetail(normalized)
  if (!resolved) {
    return err(404, 'dictionary detail not found')
  }

  detailCache.set(normalized, resolved)
  return ok(resolved)
}
