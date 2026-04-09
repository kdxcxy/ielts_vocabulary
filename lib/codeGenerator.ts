const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomSegment(): string {
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

export function generateActivationCode(): string {
  return `SV-${randomSegment()}-${randomSegment()}-${randomSegment()}-${randomSegment()}`
}

export function calculateExpiresAt(durationType: string, activatedAt: Date): Date | null {
  if (durationType === 'forever') return null
  const expires = new Date(activatedAt)
  if (durationType === '1min') expires.setMinutes(expires.getMinutes() + 1)
  else if (durationType === '24h') expires.setHours(expires.getHours() + 24)
  else if (durationType === '1year') expires.setFullYear(expires.getFullYear() + 1)
  return expires
}
