import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatRecordingDuration,
  getPlaybackCountdownSeconds,
  getRemainingRecordingSeconds,
} from '../lib/story-recorder.js'

test('formatRecordingDuration formats seconds as mm:ss', () => {
  assert.equal(formatRecordingDuration(0), '00:00')
  assert.equal(formatRecordingDuration(9), '00:09')
  assert.equal(formatRecordingDuration(65), '01:05')
})

test('formatRecordingDuration clamps invalid values to zero', () => {
  assert.equal(formatRecordingDuration(-3), '00:00')
  assert.equal(formatRecordingDuration(Number.NaN), '00:00')
})

test('getRemainingRecordingSeconds returns countdown-friendly remaining time', () => {
  assert.equal(getRemainingRecordingSeconds(3, 0), 3)
  assert.equal(getRemainingRecordingSeconds(3, 1.2), 2)
  assert.equal(getRemainingRecordingSeconds(3, 2.6), 1)
  assert.equal(getRemainingRecordingSeconds(3, 3.5), 0)
})

test('getPlaybackCountdownSeconds prefers real audio duration when available', () => {
  assert.equal(getPlaybackCountdownSeconds(2.4, 10, 0.2), 3)
  assert.equal(getPlaybackCountdownSeconds(2.4, 10, 1.6), 1)
  assert.equal(getPlaybackCountdownSeconds(Number.NaN, 4, 1.2), 3)
})
