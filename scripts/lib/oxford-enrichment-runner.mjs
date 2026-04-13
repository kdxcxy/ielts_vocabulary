import { normalizeOxfordWord } from '../../lib/oxford.js'

function hasCompletePronunciation(row) {
  return Boolean(row.phonetic_uk && row.phonetic_us && row.audio_uk && row.audio_us)
}

function clone(value) {
  return structuredClone(value)
}

function applyDetails(rows, detailMap, normalizeWord = normalizeOxfordWord) {
  return rows.map((row) => {
    const detail = detailMap.get(normalizeWord(row.word))
    if (!detail) return row

    return {
      ...row,
      phonetic_uk: detail.phoneticUk,
      phonetic_us: detail.phoneticUs,
      audio_uk: detail.audioUk,
      audio_us: detail.audioUs,
      pronunciation_source: detail.source || 'oxford',
    }
  })
}

export function createPendingEntries(
  rows,
  {
    onlyMissing = true,
    targetWord = '',
    offset = 0,
    limit = 0,
    normalizeWord = normalizeOxfordWord,
    completedWords = [],
    failedWords = [],
    retryFailed = false,
  } = {}
) {
  const groups = new Map()
  const targetNormalized = targetWord ? normalizeWord(targetWord) : ''
  const completed = new Set(completedWords.map((word) => normalizeWord(word)))
  const failed = new Set(failedWords.map((word) => normalizeWord(word)))

  for (const row of rows) {
    const normalized = normalizeWord(row.word)
    if (!normalized) continue
    if (targetNormalized && normalized !== targetNormalized) continue
    if (completed.has(normalized)) continue
    if (!retryFailed && failed.has(normalized)) continue

    const bucket = groups.get(normalized) || { normalized, word: row.word, items: [] }
    bucket.items.push(row)
    groups.set(normalized, bucket)
  }

  let entries = [...groups.values()]

  if (onlyMissing) {
    entries = entries.filter((bucket) => bucket.items.some((item) => !hasCompletePronunciation(item)))
  }

  if (offset > 0) {
    entries = entries.slice(offset)
  }

  if (limit > 0) {
    entries = entries.slice(0, limit)
  }

  return entries
}

export async function runEnrichment({
  primaryWords,
  wordFiles,
  fetchDetail,
  io,
  checkpointEvery = 25,
  delayMs = 500,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onlyMissing = true,
  targetWord = '',
  offset = 0,
  limit = 0,
  normalizeWord = normalizeOxfordWord,
  stopOnError = false,
  retryFailed = false,
}) {
  const progress = io.loadProgress?.() || null
  const completedWords = progress?.completedWords || []
  const failureMap = new Map(
    (progress?.failures || []).map((item) => [normalizeWord(item.word), clone(item)])
  )
  const entries = createPendingEntries(primaryWords, {
    onlyMissing,
    targetWord,
    offset,
    limit,
    normalizeWord,
    completedWords,
    failedWords: [...failureMap.keys()],
    retryFailed,
  })

  const persistedMap = new Map()
  const pendingMap = new Map()
  const completedSet = new Set(completedWords.map((word) => normalizeWord(word)))
  const totalCandidates = completedSet.size + entries.length

  const flush = (reason) => {
    if (pendingMap.size === 0 && reason !== 'final') {
      return
    }

    for (const [normalized, detail] of pendingMap.entries()) {
      persistedMap.set(normalized, detail)
    }

    pendingMap.clear()

    for (const filePath of wordFiles) {
      const rows = io.loadWords(filePath)
      const nextRows = applyDetails(rows, persistedMap, normalizeWord)
      io.saveWords(filePath, nextRows)
    }

    const nextProgress = {
      totalCandidates,
      processedCount: completedSet.size,
      successCount: completedSet.size,
      failureCount: failureMap.size,
      completedWords: [...completedSet],
      failures: [...failureMap.values()].map((item) => clone(item)),
      lastCheckpointReason: reason,
      updatedAt: new Date().toISOString(),
    }

    io.saveProgress?.(nextProgress)
  }

  let processed = 0

  for (const entry of entries) {
    try {
      const detail = await fetchDetail(entry.word)
      if (!detail) {
        failureMap.set(entry.normalized, { word: entry.word, reason: 'not_found' })
      } else {
        failureMap.delete(entry.normalized)
        pendingMap.set(entry.normalized, detail)
        completedSet.add(entry.normalized)
      }
    } catch (error) {
      failureMap.set(entry.normalized, {
        word: entry.word,
        reason: error instanceof Error ? error.message : 'unknown_error',
      })

      flush('error')

      const report = {
        totalCandidates,
        successCount: completedSet.size,
        failureCount: failureMap.size,
        remainingCount: Math.max(entries.length - processed - 1, 0),
        failures: [...failureMap.values()].map((item) => clone(item)),
      }

      io.saveReport?.(report)

      if (stopOnError) {
        throw error
      }
    }

    processed += 1

    if (pendingMap.size > 0 && processed % checkpointEvery === 0) {
      flush('checkpoint')
    }

    io.log?.(`processed ${processed}/${entries.length}`)

    if (delayMs > 0) {
      await sleep(delayMs)
    }
  }

  flush('final')

  const report = {
    totalCandidates,
    successCount: completedSet.size,
    failureCount: failureMap.size,
    remainingCount: 0,
    failures: [...failureMap.values()].map((item) => clone(item)),
  }

  io.saveReport?.(report)
  io.saveProgress?.({
    totalCandidates,
    processedCount: completedSet.size,
    successCount: completedSet.size,
    failureCount: failureMap.size,
    completedWords: [...completedSet],
    failures: [...failureMap.values()].map((item) => clone(item)),
    lastCheckpointReason: 'final',
    updatedAt: new Date().toISOString(),
  })

  return report
}
