import test from 'node:test'
import assert from 'node:assert/strict'

import { parseAnthropicPhonetics, resolveDictionaryDetail } from '../lib/dictionary.js'

test('parseAnthropicPhonetics extracts UK and US IPA from model output', () => {
  const parsed = parseAnthropicPhonetics(
    '{"phoneticUk":"ˌbæm.buː ˈʃuːt","phoneticUs":"ˌbæm.buː ˈʃuːt"}'
  )

  assert.deepEqual(parsed, {
    phoneticUk: 'ˌbæm.buː ˈʃuːt',
    phoneticUs: 'ˌbæm.buː ˈʃuːt',
  })
})

test('resolveDictionaryDetail falls back to AI phonetics when dictionaries miss', async () => {
  const detail = await resolveDictionaryDetail('flux-capacitor', {
    fetchOxford: async () => null,
    fetchCambridge: async () => null,
    generateAiPhonetics: async () => ({
      phoneticUk: 'flʌks kəˈpæsɪtə',
      phoneticUs: 'flʌks kəˈpæsɪtɚ',
    }),
  })

  assert.equal(detail?.word, 'flux-capacitor')
  assert.equal(detail?.phoneticUk, 'flʌks kəˈpæsɪtə')
  assert.equal(detail?.phoneticUs, 'flʌks kəˈpæsɪtɚ')
  assert.equal(detail?.audioUk, '')
  assert.equal(detail?.audioUs, '')
})
