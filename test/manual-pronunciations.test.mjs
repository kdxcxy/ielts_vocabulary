import test from 'node:test'
import assert from 'node:assert/strict'

import { getManualPronunciation } from '../lib/manual-pronunciations.js'

const POST_2504_MANUAL_WORDS = [
  'dissatisfy',
  'ultimo',
  'transship',
  'arrear',
  'layday',
  'conceptive',
  'reexport',
  'impost',
  'guesthouse',
  'labor',
  'ball-pointpen',
  'multifunction',
  'proforma',
  'referent',
  'inapt',
  'b/l',
  'back-call',
  'short-weight',
  'delcredere',
  'ferryboat',
  'Langkap',
  'upcreep',
  'America',
  'unaccommodating',
  'protract',
  'unemloyment',
  'bacterium',
  'auspice',
  'terminable',
  'salution',
  'destine',
  'expedience',
  'incoterms',
  'alga',
  'No.',
  'obligate',
  'papercut',
  'overjoy',
  'outturn',
  'hysteric',
  'enroute',
  'antonymous',
  'distributorship',
  'counter-offer',
  'salability',
  'off-grade',
  'note-taking',
  'outland',
  'o.k.',
  'tetrad',
  'demurrage',
  'photostatic',
  'characteristical',
  'c/o',
  'l/c',
  'regionalize',
  'assassinator',
]

test('getManualPronunciation returns bamboo-shoot fallback pronunciation', () => {
  const detail = getManualPronunciation('bamboo-shoot')

  assert.equal(detail?.phoneticUk, 'bæmˈbuː ʃuːt')
  assert.equal(detail?.phoneticUs, 'bæmˈbuː ʃuːt')
  assert.equal(detail?.audioUk, '/audio/manual/uk/bamboo-shoot.mp3')
  assert.equal(detail?.audioUs, '/audio/manual/us/bamboo-shoot.mp3')
})

test('manual pronunciations no longer depend on google translate tts', () => {
  const detail = getManualPronunciation('telefax')

  assert.ok(detail)
  assert.equal(detail?.audioUk?.startsWith('https://translate.google.com'), false)
  assert.equal(detail?.audioUs?.startsWith('https://translate.google.com'), false)
})

test('post-2504 Oxford misses all have local manual fallback entries', () => {
  for (const word of POST_2504_MANUAL_WORDS) {
    const detail = getManualPronunciation(word)

    assert.ok(detail, `${word} should have manual detail`)
    assert.ok(detail.phoneticUk, `${word} should have UK phonetic`)
    assert.ok(detail.phoneticUs, `${word} should have US phonetic`)
    assert.equal(detail.audioUk, `/audio/manual/uk/${word.toLowerCase()}.mp3`)
    assert.equal(detail.audioUs, `/audio/manual/us/${word.toLowerCase()}.mp3`)
  }
})
