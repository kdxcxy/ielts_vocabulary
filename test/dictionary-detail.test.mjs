import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveDictionaryDetail } from '../lib/dictionary.js'

test('resolveDictionaryDetail falls back to local manual detail when Oxford misses', async () => {
  const detail = await resolveDictionaryDetail('telefax', {
    fetchOxford: async () => null,
    fetchCambridge: async () => {
      throw new Error('cambridge should not be called')
    },
    generateAiPhonetics: async () => {
      throw new Error('ai should not be called')
    },
  })

  assert.equal(detail?.source, 'manual')
  assert.equal(detail?.phoneticUk, 'ˈtelifæks')
  assert.equal(detail?.audioUk, '/audio/manual/uk/telefax.mp3')
})

test('resolveDictionaryDetail prefers Oxford when Oxford hits', async () => {
  const detail = await resolveDictionaryDetail('prism', {
    fetchOxford: async () => ({
      word: 'prism',
      phoneticUk: '/ˈprɪzəm/',
      phoneticUs: '/ˈprɪzəm/',
      audioUk: 'oxford-uk.mp3',
      audioUs: 'oxford-us.mp3',
      source: 'oxford',
      entryUrl: 'https://www.oxfordlearnersdictionaries.com/definition/english/prism',
    }),
    fetchCambridge: async () => {
      throw new Error('cambridge should not be called')
    },
  })

  assert.equal(detail?.source, 'oxford')
  assert.equal(detail?.audioUk, 'oxford-uk.mp3')
})

test('resolveDictionaryDetail retries canonical variants before returning null', async () => {
  const seenWords = []

  const detail = await resolveDictionaryDetail('zipcode', {
    fetchOxford: async (word) => {
      seenWords.push(`oxford:${word}`)
      return null
    },
    fetchCambridge: async () => {
      throw new Error('cambridge should not be called')
    },
    generateAiPhonetics: async () => {
      throw new Error('ai should not be called')
    },
  })

  assert.equal(detail, null)
  assert.ok(seenWords.includes('oxford:zip code'))
})
