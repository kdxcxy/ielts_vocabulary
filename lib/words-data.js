import fs from 'node:fs/promises'
import path from 'node:path'

const WORDS_FILE_PATH = path.join(process.cwd(), 'data', 'words.json')

export async function readWordsData(filePath = WORDS_FILE_PATH) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}
