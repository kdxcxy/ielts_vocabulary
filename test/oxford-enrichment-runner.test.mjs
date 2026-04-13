import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createPendingEntries,
  runEnrichment,
} from '../scripts/lib/oxford-enrichment-runner.mjs'

test('createPendingEntries skips words that already have complete oxford pronunciation data', () => {
  const rows = [
    { word: 'alpha', phonetic_uk: '/a/', phonetic_us: '/a/', audio_uk: 'uk-a', audio_us: 'us-a' },
    { word: 'beta' },
    { word: 'beta' },
    { word: 'gamma', phonetic_uk: '/g/' },
  ]

  const pending = createPendingEntries(rows, { onlyMissing: true })

  assert.deepEqual(
    pending.map((entry) => entry.normalized),
    ['beta', 'gamma']
  )
})

test('runEnrichment persists successful batches before a later failure and resumes from saved progress', async () => {
  const rows = [
    { id: 1, word: 'alpha' },
    { id: 2, word: 'beta' },
    { id: 3, word: 'gamma' },
  ]

  const writes = []
  const state = {
    wordsByFile: new Map([
      ['public/data/words.json', structuredClone(rows)],
      ['data/words.json', structuredClone(rows)],
    ]),
    progress: null,
    report: null,
  }

  const io = {
    loadWords(filePath) {
      return structuredClone(state.wordsByFile.get(filePath))
    },
    saveWords(filePath, data) {
      state.wordsByFile.set(filePath, structuredClone(data))
      writes.push({ type: 'words', filePath, data: structuredClone(data) })
    },
    loadProgress() {
      return state.progress ? structuredClone(state.progress) : null
    },
    saveProgress(data) {
      state.progress = structuredClone(data)
      writes.push({ type: 'progress', data: structuredClone(data) })
    },
    saveReport(data) {
      state.report = structuredClone(data)
      writes.push({ type: 'report', data: structuredClone(data) })
    },
    log() {},
  }

  let fetchCalls = 0
  await assert.rejects(
    runEnrichment({
      primaryWords: rows,
      wordFiles: ['public/data/words.json', 'data/words.json'],
      checkpointEvery: 1,
      io,
      fetchDetail: async (word) => {
        fetchCalls += 1
        if (word === 'beta') {
          throw new Error('network_down')
        }

        return {
          phoneticUk: `/${word}-uk/`,
          phoneticUs: `/${word}-us/`,
          audioUk: `${word}-uk.mp3`,
          audioUs: `${word}-us.mp3`,
        }
      },
      sleep: async () => {},
      delayMs: 0,
      stopOnError: true,
    }),
    /network_down/
  )

  assert.equal(fetchCalls, 2)
  assert.equal(state.progress.processedCount, 1)
  assert.equal(state.progress.successCount, 1)
  assert.deepEqual(state.progress.completedWords, ['alpha'])
  assert.equal(
    state.wordsByFile.get('public/data/words.json')[0].pronunciation_source,
    'oxford'
  )
  assert.equal(
    state.wordsByFile.get('public/data/words.json')[1].pronunciation_source,
    undefined
  )

  fetchCalls = 0
  await runEnrichment({
    primaryWords: state.wordsByFile.get('public/data/words.json'),
    wordFiles: ['public/data/words.json', 'data/words.json'],
    checkpointEvery: 1,
    io,
    fetchDetail: async (word) => {
      fetchCalls += 1
      return {
        phoneticUk: `/${word}-uk/`,
        phoneticUs: `/${word}-us/`,
        audioUk: `${word}-uk.mp3`,
        audioUs: `${word}-us.mp3`,
      }
    },
    sleep: async () => {},
    delayMs: 0,
  })

  assert.equal(fetchCalls, 2)
  assert.equal(state.report.successCount, 3)
  assert.equal(state.report.failureCount, 0)
  assert.equal(state.report.remainingCount, 0)
  assert.equal(
    state.wordsByFile.get('data/words.json')[2].pronunciation_source,
    'oxford'
  )
})

test('createPendingEntries skips words recorded as failed in progress', () => {
  const rows = [
    { word: 'alpha' },
    { word: 'beta' },
    { word: 'gamma' },
  ]

  const pending = createPendingEntries(rows, {
    failedWords: ['beta'],
  })

  assert.deepEqual(
    pending.map((entry) => entry.normalized),
    ['alpha', 'gamma']
  )
})

test('createPendingEntries includes failed words again when retryFailed is enabled', () => {
  const rows = [
    { word: 'alpha' },
    { word: 'beta' },
    { word: 'gamma' },
  ]

  const pending = createPendingEntries(rows, {
    failedWords: ['beta'],
    retryFailed: true,
  })

  assert.deepEqual(
    pending.map((entry) => entry.normalized),
    ['alpha', 'beta', 'gamma']
  )
})

test('runEnrichment removes a failed word from failure records after a successful retry', async () => {
  const rows = [{ id: 1, word: 'fortuity' }]
  const state = {
    wordsByFile: new Map([
      ['public/data/words.json', structuredClone(rows)],
      ['data/words.json', structuredClone(rows)],
    ]),
    progress: {
      totalCandidates: 1,
      processedCount: 0,
      successCount: 0,
      failureCount: 1,
      completedWords: [],
      failures: [{ word: 'fortuity', reason: 'not_found' }],
      lastCheckpointReason: 'final',
      updatedAt: new Date().toISOString(),
    },
    report: null,
  }

  const io = {
    loadWords(filePath) {
      return structuredClone(state.wordsByFile.get(filePath))
    },
    saveWords(filePath, data) {
      state.wordsByFile.set(filePath, structuredClone(data))
    },
    loadProgress() {
      return structuredClone(state.progress)
    },
    saveProgress(data) {
      state.progress = structuredClone(data)
    },
    saveReport(data) {
      state.report = structuredClone(data)
    },
    log() {},
  }

  await runEnrichment({
    primaryWords: rows,
    wordFiles: ['public/data/words.json', 'data/words.json'],
    checkpointEvery: 1,
    io,
    retryFailed: true,
    fetchDetail: async () => ({
      phoneticUk: 'uk-ipa',
      phoneticUs: 'us-ipa',
      audioUk: 'uk.mp3',
      audioUs: 'us.mp3',
      source: 'cambridge',
    }),
    sleep: async () => {},
    delayMs: 0,
  })

  assert.equal(state.report.failureCount, 0)
  assert.deepEqual(state.report.failures, [])
  assert.equal(state.wordsByFile.get('public/data/words.json')[0].pronunciation_source, 'cambridge')
})
