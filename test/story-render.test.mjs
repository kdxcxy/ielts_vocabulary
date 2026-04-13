import test from 'node:test'
import assert from 'node:assert/strict'
import { splitRenderableParagraphs } from '../lib/story-render.js'

test('splitRenderableParagraphs removes standalone separator paragraphs', () => {
  const paragraphs = splitRenderableParagraphs('第一段\n\n——\n\n第二段\n\n  ——  \n\n第三段')

  assert.deepEqual(paragraphs, ['第一段', '第二段', '第三段'])
})

test('splitRenderableParagraphs keeps normal paragraphs intact', () => {
  const paragraphs = splitRenderableParagraphs('wooden [木制的] 桌上那张协议书。\n\n我现在过得很好。')

  assert.deepEqual(paragraphs, ['wooden [木制的] 桌上那张协议书。', '我现在过得很好。'])
})
