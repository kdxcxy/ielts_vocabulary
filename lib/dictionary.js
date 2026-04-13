import { getManualPronunciation } from './manual-pronunciations.js'
import { fetchOxfordDetail, normalizeOxfordWord } from './oxford.js'

const CANONICAL_WORD_MAP = new Map([
  ['zipcode', 'zip code'],
  ['commonsense', 'common sense'],
  ['motorcar', 'motor car'],
])

function buildCandidateWords(word) {
  const candidates = [word]
  const push = (value) => {
    const normalized = normalizeOxfordWord(value)
    if (!normalized || candidates.includes(normalized)) return
    candidates.push(normalized)
  }

  push(CANONICAL_WORD_MAP.get(word) || '')

  if (word.includes('-')) {
    push(word.replace(/-/g, ' '))
    push(word.replace(/-/g, ''))
  }

  if (word.includes(' ')) {
    push(word.replace(/\s+/g, '-'))
    push(word.replace(/\s+/g, ''))
  }

  return candidates
}

export async function resolveDictionaryDetail(
  rawWord,
  {
    fetchOxford = fetchOxfordDetail,
  } = {}
) {
  const word = normalizeOxfordWord(rawWord)
  if (!word) return null

  const candidates = buildCandidateWords(word)

  for (const candidate of candidates) {
    const oxfordDetail = await fetchOxford(candidate)
    if (oxfordDetail) {
      return {
        ...oxfordDetail,
        word,
      }
    }
  }

  const manualDetail = getManualPronunciation(word)
  if (manualDetail) {
    return manualDetail
  }

  return null
}
