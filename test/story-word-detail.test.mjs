import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatPhoneticForDisplay,
  hasAnyPronunciation,
  needsDictionaryHydration,
  normalizeWordKey,
} from '../lib/story-word-detail.js'

test('normalizeWordKey trims and lowercases words', () => {
  assert.equal(normalizeWordKey('  TeleFax  '), 'telefax')
})

test('needsDictionaryHydration returns true when pronunciation is missing', () => {
  assert.equal(
    needsDictionaryHydration({
      phoneticUk: '/tel/',
      phoneticUs: '',
      audioUk: 'uk.mp3',
      audioUs: 'us.mp3',
    }),
    true
  )
})

test('needsDictionaryHydration returns false when pronunciation is complete', () => {
  assert.equal(
    needsDictionaryHydration({
      phoneticUk: '/tel/',
      phoneticUs: '/tel/',
      audioUk: 'uk.mp3',
      audioUs: 'us.mp3',
    }),
    false
  )
})

test('hasAnyPronunciation detects partial cached pronunciation', () => {
  assert.equal(
    hasAnyPronunciation({
      phoneticUk: '',
      phoneticUs: '',
      audioUk: '',
      audioUs: 'us.mp3',
    }),
    true
  )
})

test('formatPhoneticForDisplay keeps wrapped phonetics unchanged', () => {
  assert.equal(formatPhoneticForDisplay('/dɪsˈɡʌstfəl/'), '/dɪsˈɡʌstfəl/')
})

test('formatPhoneticForDisplay wraps bare phonetics with slashes', () => {
  assert.equal(formatPhoneticForDisplay('dɪsˈɡʌstfəl'), '/dɪsˈɡʌstfəl/')
})
