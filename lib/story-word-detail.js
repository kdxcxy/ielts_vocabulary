export function normalizeWordKey(word) {
  return word.trim().toLowerCase()
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function formatPhoneticForDisplay(phonetic) {
  if (!hasValue(phonetic)) return ''

  const trimmed = phonetic.trim()
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    return trimmed
  }

  return `/${trimmed}/`
}

export function hasAnyPronunciation(detail) {
  if (!detail) return false

  return (
    hasValue(detail.phoneticUk) ||
    hasValue(detail.phoneticUs) ||
    hasValue(detail.audioUk) ||
    hasValue(detail.audioUs)
  )
}

export function needsDictionaryHydration(detail) {
  if (!detail) return true

  return !(
    hasValue(detail.phoneticUk) &&
    hasValue(detail.phoneticUs) &&
    hasValue(detail.audioUk) &&
    hasValue(detail.audioUs)
  )
}
