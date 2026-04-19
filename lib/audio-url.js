const OXFORD_AUDIO_HOST = 'www.oxfordlearnersdictionaries.com'
const OXFORD_AUDIO_PATH_PREFIX = '/media/english/'

export function isOxfordAudioUrl(value) {
  if (typeof value !== 'string' || !value) return false

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === OXFORD_AUDIO_HOST &&
      url.pathname.startsWith(OXFORD_AUDIO_PATH_PREFIX) &&
      url.pathname.endsWith('.mp3')
    )
  } catch {
    return false
  }
}

export function proxifyAudioUrl(value) {
  if (!isOxfordAudioUrl(value)) return value || ''
  return `/api/audio/oxford?url=${encodeURIComponent(value)}`
}

export function proxifyAudioFields(item) {
  if (!item) return item

  return {
    ...item,
    audio_uk: proxifyAudioUrl(item.audio_uk),
    audio_us: proxifyAudioUrl(item.audio_us),
    audioUk: proxifyAudioUrl(item.audioUk),
    audioUs: proxifyAudioUrl(item.audioUs),
  }
}

