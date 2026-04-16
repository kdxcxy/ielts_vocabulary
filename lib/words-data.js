import fs from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const bundledWordsData = require('../data/words.json')

export async function readWordsData(filePath) {
  if (filePath) {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  }

  return bundledWordsData
}
