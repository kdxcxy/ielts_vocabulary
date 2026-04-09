// JWT 工具 - Web Crypto API（兼容 Cloudflare Workers）

const SECRET = process.env.JWT_SECRET || 'ielts-vocab-secret-2026'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password + 'ielts-salt'))
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function signJWT(payload: object): Promise<string> {
  const encoder = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }))
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${header}.${body}.${sig}`
}

export async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.')
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    )
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${header}.${body}`))
    if (!valid) return null
    return JSON.parse(atob(body))
  } catch {
    return null
  }
}
