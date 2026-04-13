const CAMBRIDGE_BASE_URL = 'https://dictionary.cambridge.org'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function decodeHtmlEntities(input = '') {
  return input
    .replace(/&#10;/g, '\n')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
  .trim()
}

function stripTags(input = '') {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' '))
}

function toAbsoluteUrl(path = '') {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${CAMBRIDGE_BASE_URL}${path}`
}

async function fetchWithRetry(url, retries = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        redirect: 'follow',
      })

      if (!response.ok) {
        throw new Error(`fetch failed: ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error
      const waitMs = attempt * 800
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  throw lastError || new Error('fetch failed')
}

export function parseCambridgeHtml(html, word, entryUrl = '') {
  const usMatch = html.match(
    /<span class="us dpron-i[\s\S]*?<source type="audio\/mpeg" src="([^"]+)"\/>[\s\S]*?<span class="pron dpron">\/<span class="ipa dipa [^"]*">([\s\S]*?)<\/span>\/<\/span>/
  )
  const ukMatch = html.match(
    /<span class="uk dpron-i[\s\S]*?<source type="audio\/mpeg" src="([^"]+)"\/>[\s\S]*?<span class="pron dpron">\/<span class="ipa dipa [^"]*">([\s\S]*?)<\/span>\/<\/span>/
  )

  if (!ukMatch || !usMatch) return null

  return {
    word,
    phoneticUk: stripTags(ukMatch[2]),
    phoneticUs: stripTags(usMatch[2]),
    audioUk: toAbsoluteUrl(decodeHtmlEntities(ukMatch[1])),
    audioUs: toAbsoluteUrl(decodeHtmlEntities(usMatch[1])),
    source: 'cambridge',
    entryUrl,
  }
}

export async function fetchCambridgeDetail(rawWord) {
  const word = rawWord.trim().toLowerCase()
  if (!word) return null

  const url = `${CAMBRIDGE_BASE_URL}/dictionary/english/${encodeURIComponent(word)}`
  const response = await fetchWithRetry(url, 4)
  const html = await response.text()

  return parseCambridgeHtml(html, word, response.url)
}
