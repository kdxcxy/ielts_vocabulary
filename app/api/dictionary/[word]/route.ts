import { ok, err } from '@/lib/api'
import { resolveDictionaryDetail } from '@/lib/dictionary'
import { normalizeOxfordWord } from '@/lib/oxford'
import { proxifyAudioFields } from '@/lib/audio-url'

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
    return ok(proxifyAudioFields(cached))
  }

  const resolved = await resolveDictionaryDetail(normalized)
  if (!resolved) {
    return err(404, 'dictionary detail not found')
  }

  const proxied = proxifyAudioFields(resolved)
  detailCache.set(normalized, proxied)
  return ok(proxied)
}
