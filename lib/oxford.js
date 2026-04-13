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
}

function stripTags(input = '') {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, '')).trim()
}

export function normalizeOxfordWord(input) {
  return input.trim().toLowerCase()
}

export function parseOxfordHtml(html, word) {
  const ukMatch = html.match(
    /<div class="phons_br"[\s\S]*?data-src-mp3="([^"]+)"[\s\S]*?<span class="phon">([\s\S]*?)<\/span>/
  )
  const usMatch = html.match(
    /<div class="phons_n_am"[\s\S]*?data-src-mp3="([^"]+)"[\s\S]*?<span class="phon">([\s\S]*?)<\/span>/
  )

  if (!ukMatch || !usMatch) return null

  return {
    word,
    phoneticUk: stripTags(ukMatch[2]),
    phoneticUs: stripTags(usMatch[2]),
    audioUk: decodeHtmlEntities(ukMatch[1]),
    audioUs: decodeHtmlEntities(usMatch[1]),
  }
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

export async function fetchOxfordDetail(rawWord) {
  const word = normalizeOxfordWord(rawWord)
  if (!word) return null

  const searchUrl = `https://www.oxfordlearnersdictionaries.com/search/english/direct/?q=${encodeURIComponent(
    word
  )}`

  const response = await fetchWithRetry(searchUrl, 4)
  const html = await response.text()
  const parsed = parseOxfordHtml(html, word)

  if (!parsed) return null

  return {
    ...parsed,
    source: 'oxford',
    entryUrl: response.url,
  }
}
