import { readWordsData } from './words-data.js'

export async function getTotalVocabularyCount() {
  const words = await readWordsData()
  return Array.isArray(words) ? words.length : 0
}
