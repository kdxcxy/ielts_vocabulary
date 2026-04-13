import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { readWordsData } from '../lib/words-data.js'

test('readWordsData reads the latest file contents on each call', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'words-data-'))
  const file = path.join(dir, 'words.json')

  await fs.writeFile(file, JSON.stringify([{ word: 'subsequence', meaning_cn: 'old' }]), 'utf8')
  const first = await readWordsData(file)

  await fs.writeFile(file, JSON.stringify([{ word: 'subsequence', meaning_cn: 'new' }]), 'utf8')
  const second = await readWordsData(file)

  assert.equal(first[0].meaning_cn, 'old')
  assert.equal(second[0].meaning_cn, 'new')
})
