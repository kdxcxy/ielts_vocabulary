const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

export function parseAnthropicPhonetics(text) {
  const cleaned = String(text || '').trim()
  if (!cleaned) return null

  try {
    const parsed = JSON.parse(cleaned)
    if (!parsed?.phoneticUk || !parsed?.phoneticUs) return null

    return {
      phoneticUk: String(parsed.phoneticUk).trim(),
      phoneticUs: String(parsed.phoneticUs).trim(),
    }
  } catch {
    return null
  }
}

export async function generateAiPhonetics(rawWord) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const word = String(rawWord || '').trim()

  if (!apiKey || !word) return null

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 120,
      temperature: 0,
      system:
        'You are an English pronunciation assistant. Return only valid JSON with keys phoneticUk and phoneticUs. Use IPA without surrounding slashes.',
      messages: [
        {
          role: 'user',
          content: `Provide British and American IPA for the English word or phrase "${word}". Return JSON only, like {"phoneticUk":"...","phoneticUs":"..."}.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`anthropic phonetics failed: ${response.status}`)
  }

  const data = await response.json()
  const text = data?.content?.find?.((item) => item.type === 'text')?.text || ''

  return parseAnthropicPhonetics(text)
}
