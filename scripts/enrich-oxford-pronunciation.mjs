import fs from 'node:fs'
import path from 'node:path'
import { resolveDictionaryDetail } from '../lib/dictionary.js'
import { normalizeOxfordWord } from '../lib/oxford.js'
import { runEnrichment } from './lib/oxford-enrichment-runner.mjs'

const cwd = process.cwd()
const wordFiles = [
  path.join(cwd, 'public', 'data', 'words.json'),
  path.join(cwd, 'data', 'words.json'),
]
const reportPath = path.join(cwd, 'data', 'oxford-enrichment-report.json')
const progressPath = path.join(cwd, 'data', 'oxford-enrichment-progress.json')

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  })
)

const limit = Number(args.get('limit') || '0')
const offset = Number(args.get('offset') || '0')
const delayMs = Number(args.get('delay-ms') || '500')
const checkpointEvery = Number(args.get('checkpoint-every') || '25')
const onlyMissing = args.get('only-missing') !== 'false'
const retryFailed = args.get('retry-failed') === 'true'
const targetWord = args.get('word') || ''

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadWords(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function saveWords(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const primaryWords = loadWords(wordFiles[0])

const report = await runEnrichment({
  primaryWords,
  wordFiles,
  fetchDetail: resolveDictionaryDetail,
  checkpointEvery,
  delayMs,
  onlyMissing,
  retryFailed,
  targetWord,
  offset,
  limit,
  sleep,
  normalizeWord: normalizeOxfordWord,
  io: {
    loadWords,
    saveWords,
    loadProgress() {
      return loadJson(progressPath)
    },
    saveProgress(data) {
      fs.writeFileSync(progressPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    },
    saveReport(data) {
      fs.writeFileSync(reportPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    },
    log(message) {
      console.log(message)
    },
  },
})

console.log(
  JSON.stringify(
    {
      ...report,
      reportPath,
      progressPath,
    },
    null,
    2
  )
)
