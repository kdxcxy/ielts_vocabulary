import { getCloudflareContext } from '@opennextjs/cloudflare'

export function getD1() {
  try {
    return (getCloudflareContext().env as { DB?: any }).DB || null
  } catch {
    return null
  }
}
