import test from 'node:test'
import assert from 'node:assert/strict'
import { overrideStoryContent } from '../lib/story-content-overrides.js'

const STORY_35_REQUIRED_WORDS = [
  'hereto',
  'tantalize',
  'neutralize',
  'conceptive',
  'associative',
]

test('story 35 content contains all required inline vocabulary words', () => {
  const content = overrideStoryContent({
    id: 35,
    content:
      'wooden [木制的] 桌上那张离婚协议书压过的印痕，我后来看见过一次，在搬家收拾旧物时。\n\n我没有 surrender [投降]，也没有颤抖，只是平静地叠起来，放进了装废纸的盒子。\n\n那段婚姻是一个失败的实验，但它也是我 imagination [想象力] 和勇气的一部分，让我后来更清晰地知道自己需要什么。\n\n——\n\n我现在过得很好。',
  })

  for (const word of STORY_35_REQUIRED_WORDS) {
    assert.ok(content.includes(`${word} [`), `story 35 should include ${word}`)
  }
})

test('story 35 content should not keep extra separators around the patched ending block', () => {
  const content = overrideStoryContent({
    id: 35,
    content:
      '前文\n\n——\n\nwooden [木制的] 桌上那张离婚协议书压过的印痕。\n\n我没有 surrender [投降]。\n\n那段婚姻是一个失败的实验，但它也是我 imagination [想象力] 和勇气的一部分，让我后来更清晰地知道自己需要什么。\n\n——\n\n我现在过得很好。',
  })

  assert.equal(content.includes('\n\n——\n\nwooden ['), false)
  assert.equal(content.includes('\n\n——\n\n我现在过得很好。'), false)
})
