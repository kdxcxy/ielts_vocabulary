export function formatRecordingDuration(seconds) {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function getRemainingRecordingSeconds(totalSeconds, currentSeconds) {
  const safeTotal = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0
  const safeCurrent = Number.isFinite(currentSeconds) && currentSeconds > 0 ? currentSeconds : 0

  return Math.max(0, Math.ceil(safeTotal - safeCurrent))
}

export function getPlaybackCountdownSeconds(audioDuration, fallbackDuration, currentSeconds) {
  const preferredDuration =
    Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : fallbackDuration

  return getRemainingRecordingSeconds(preferredDuration, currentSeconds)
}
