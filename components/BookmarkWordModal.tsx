'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Play, RotateCcw, Square, Star, Volume2 } from 'lucide-react'
import { formatPhoneticForDisplay, hasAnyPronunciation } from '@/lib/story-word-detail'
import {
  formatRecordingDuration,
  getPlaybackCountdownSeconds,
} from '@/lib/story-recorder'

type Accent = 'uk' | 'us'
type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing'

export type BookmarkWordDetail = {
  id: number
  word: string
  translation: string
  storyId: number | null
  storyTitle?: string
  meaningCn: string
  phoneticUk?: string
  phoneticUs?: string
  audioUk?: string
  audioUs?: string
}

function pickFemaleVoice(voices: SpeechSynthesisVoice[], accent: Accent) {
  const targetLang = accent === 'uk' ? 'en-GB' : 'en-US'
  const femaleHints = [
    'female',
    'woman',
    'samantha',
    'karen',
    'moira',
    'zira',
    'aria',
    'jenny',
    'libby',
    'sonia',
    'hazel',
    'susan',
    'catherine',
    'serena',
    'natasha',
  ]

  const exactFemale = voices.find((voice) => {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return voice.lang === targetLang && femaleHints.some((hint) => name.includes(hint))
  })
  if (exactFemale) return exactFemale

  const exactAccent = voices.find((voice) => voice.lang === targetLang)
  if (exactAccent) return exactAccent

  const englishFemale = voices.find((voice) => {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return voice.lang.startsWith('en') && femaleHints.some((hint) => name.includes(hint))
  })
  if (englishFemale) return englishFemale

  return voices.find((voice) => voice.lang.startsWith('en')) || null
}

export default function BookmarkWordModal({
  detail,
  loadingWordDetail,
  bookmarkLoading,
  onClose,
  onToggleBookmark,
}: {
  detail: BookmarkWordDetail
  loadingWordDetail: boolean
  bookmarkLoading: boolean
  onClose: () => void
  onToggleBookmark: () => void
}) {
  const [speakingAccent, setSpeakingAccent] = useState<string | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingError, setRecordingError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const practiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingUrlRef = useRef<string | null>(null)
  const recordedDurationRef = useRef(0)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const playbackTimerRef = useRef<number | null>(null)

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const stopPlaybackTimer = () => {
    if (playbackTimerRef.current !== null) {
      window.clearInterval(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
  }

  const releaseRecordingStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  const revokeRecordingUrl = () => {
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current)
      recordingUrlRef.current = null
    }
  }

  const stopPracticePlayback = () => {
    stopPlaybackTimer()
    if (practiceAudioRef.current) {
      practiceAudioRef.current.pause()
      practiceAudioRef.current.currentTime = 0
      practiceAudioRef.current = null
    }
    if (recordedDurationRef.current > 0) {
      setRecordingDuration(recordedDurationRef.current)
    }
  }

  const resetPracticeState = () => {
    stopRecordingTimer()
    stopPracticePlayback()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    releaseRecordingStream()
    revokeRecordingUrl()
    recordingChunksRef.current = []
    recordedDurationRef.current = 0
    setRecordingDuration(0)
    setRecordingError('')
    setRecordingState('idle')
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      practiceAudioRef.current?.pause()
      window.speechSynthesis?.cancel()
      stopRecordingTimer()
      stopPracticePlayback()
      releaseRecordingStream()
      revokeRecordingUrl()
    }
  }, [])

  const speakWord = async (accent: Accent) => {
    const speakingKey = `${detail.word}:${accent}`

    audioRef.current?.pause()
    stopPracticePlayback()
    window.speechSynthesis?.cancel()

    const audioUrl = accent === 'uk' ? detail.audioUk || detail.audioUs : detail.audioUs || detail.audioUk

    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onplay = () => setSpeakingAccent(speakingKey)
      audio.onended = () => setSpeakingAccent(null)
      audio.onerror = () => setSpeakingAccent(null)
      try {
        await audio.play()
        return
      } catch {
        setSpeakingAccent(null)
      }
    }

    if (!('speechSynthesis' in window)) return

    const utterance = new SpeechSynthesisUtterance(detail.word)
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    utterance.rate = 0.85
    utterance.pitch = 1.15

    const preferredVoice = pickFemaleVoice(window.speechSynthesis.getVoices(), accent)
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setSpeakingAccent(speakingKey)
    utterance.onend = () => setSpeakingAccent(null)
    utterance.onerror = () => setSpeakingAccent(null)
    window.speechSynthesis.speak(utterance)
  }

  const startWordRecording = async () => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setRecordingError('当前设备暂不支持录音')
      return
    }

    try {
      setRecordingError('')
      setRecordingDuration(0)
      revokeRecordingUrl()
      stopPracticePlayback()
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recordingChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stopRecordingTimer()
        releaseRecordingStream()

        if (recordingChunksRef.current.length === 0) {
          setRecordingState('idle')
          setRecordingError('没有录到声音，请重试')
          return
        }

        const audioBlob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        recordingUrlRef.current = URL.createObjectURL(audioBlob)
        recordedDurationRef.current = recordingDuration
        setRecordingState('recorded')
      }

      recorder.start()
      setRecordingState('recording')
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((current) => current + 1)
      }, 1000)
    } catch {
      releaseRecordingStream()
      setRecordingState('idle')
      setRecordingError('请开启麦克风权限后重试')
    }
  }

  const stopWordRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const playWordRecording = async () => {
    if (!recordingUrlRef.current) return

    stopPracticePlayback()
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()

    const audio = new Audio(recordingUrlRef.current)
    practiceAudioRef.current = audio
    setRecordingDuration(recordedDurationRef.current)

    const syncPlaybackCountdown = () => {
      setRecordingDuration(
        getPlaybackCountdownSeconds(audio.duration, recordedDurationRef.current, audio.currentTime)
      )
    }

    audio.onloadedmetadata = syncPlaybackCountdown
    audio.ontimeupdate = syncPlaybackCountdown
    audio.onended = () => {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(recordedDurationRef.current)
      setRecordingState('recorded')
    }
    audio.onerror = () => {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(recordedDurationRef.current)
      setRecordingState('recorded')
      setRecordingError('录音播放失败，请重新录音')
    }

    try {
      setRecordingError('')
      setRecordingState('playing')
      playbackTimerRef.current = window.setInterval(syncPlaybackCountdown, 120)
      await audio.play()
    } catch {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(recordedDurationRef.current)
      setRecordingState('recorded')
      setRecordingError('录音播放失败，请重新录音')
    }
  }

  const stopWordRecordingPlayback = () => {
    stopPracticePlayback()
    setRecordingState('recorded')
  }

  const renderAccentRow = (accent: Accent, label: string, phonetic?: string) => {
    const speakingKey = `${detail.word}:${accent}`
    const isSpeaking = speakingAccent === speakingKey

    return (
      <button
        type="button"
        onClick={() => speakWord(accent)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
          isSpeaking
            ? 'border-primary bg-primary/8 text-primary'
            : 'border-surface-container bg-surface-container-lowest text-on-surface/70'
        }`}
      >
        <span className="flex items-center gap-2 text-sm">
          <span className="shrink-0 font-medium">{label}</span>
          <span className="break-all">
            {formatPhoneticForDisplay(phonetic) ||
              (loadingWordDetail ? '正在加载...' : `${label}式音标待补充`)}
          </span>
        </span>
        <Volume2
          className={`h-4 w-4 shrink-0 ${isSpeaking ? 'text-primary' : 'text-on-surface/45'}`}
        />
      </button>
    )
  }

  const primaryButton =
    recordingState === 'recording'
      ? {
          label: '停止录音',
          icon: Square,
          onClick: stopWordRecording,
          className: 'from-[#d6336c] to-[#ff6b9d]',
        }
      : recordingState === 'playing'
        ? {
            label: '停止播放',
            icon: Square,
            onClick: stopWordRecordingPlayback,
            className: 'from-tertiary to-[#6f63d9]',
          }
        : recordingState === 'recorded'
          ? {
              label: '播放录音',
              icon: Play,
              onClick: playWordRecording,
              className: 'from-tertiary to-[#6f63d9]',
            }
          : {
              label: '开始录音',
              icon: Mic,
              onClick: startWordRecording,
              className: 'from-primary to-primary-container',
            }

  const PrimaryIcon = primaryButton.icon
  const isRecording = recordingState === 'recording'
  const isPlaying = recordingState === 'playing'
  const isBusy = isRecording || isPlaying

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => {
        resetPracticeState()
        onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-on-surface">{detail.word}</h3>
          </div>
          <button
            type="button"
            onClick={onToggleBookmark}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container"
            disabled={bookmarkLoading}
          >
            <Star className={`h-5 w-5 fill-primary text-primary ${bookmarkLoading ? 'opacity-50' : ''}`} />
          </button>
        </div>

        <div className="mb-4 space-y-2">
          {renderAccentRow('uk', '英', detail.phoneticUk)}
          {renderAccentRow('us', '美', detail.phoneticUs)}
        </div>

        <div className="mb-4 rounded-[2rem] bg-gradient-to-br from-[#fff4f8] to-[#fff0f6] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-on-surface">跟读练习</p>
              <p className="mt-1 text-sm leading-6 text-on-surface/60">
                {recordingState === 'recording'
                  ? `请读出：${detail.word}`
                  : recordingState === 'recorded'
                    ? '已录制完成，可以回放自己的发音'
                    : recordingState === 'playing'
                      ? '正在播放你刚才的录音'
                      : '点按钮读一遍这个单词'}
              </p>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
              {formatRecordingDuration(recordingDuration)}
            </div>
          </div>

          <div
            className={`mt-4 flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 transition-all ${
              isRecording ? 'scale-[1.01] shadow-lg shadow-primary/10' : ''
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full ${
                recordingState === 'recording'
                  ? 'recorder-dot-rec bg-[#ff4d6d]'
                  : recordingState === 'playing'
                    ? 'recorder-dot-play bg-tertiary'
                    : recordingState === 'recorded'
                      ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.18)]'
                      : 'bg-on-surface/20'
              }`}
            />
            <span className="text-sm font-medium text-on-surface/70">
              {recordingState === 'recording'
                ? '录音中...'
                : recordingState === 'playing'
                  ? '播放中...'
                  : recordingState === 'recorded'
                    ? '录音已就绪'
                    : '尚未开始录音'}
            </span>
            {isBusy && (
              <div className="ml-auto flex items-end gap-1">
                <span className={`recorder-bar h-2 w-1 rounded-full ${isPlaying ? 'bg-tertiary/70' : 'bg-primary/45'}`} />
                <span className={`recorder-bar recorder-bar-delay-1 h-3 w-1 rounded-full ${isPlaying ? 'bg-tertiary/85' : 'bg-primary/60'}`} />
                <span className={`recorder-bar recorder-bar-delay-2 h-5 w-1 rounded-full ${isPlaying ? 'bg-tertiary' : 'bg-primary'}`} />
                <span className={`recorder-bar recorder-bar-delay-3 h-3 w-1 rounded-full ${isPlaying ? 'bg-tertiary/85' : 'bg-primary/60'}`} />
              </div>
            )}
          </div>

          {recordingError && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-500">
              {recordingError}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={primaryButton.onClick}
              className={`flex flex-[1.35] items-center justify-center gap-2 rounded-full bg-gradient-to-r ${primaryButton.className} py-3.5 text-sm font-bold text-white shadow-lg transition-all ${
                isRecording
                  ? 'recorder-button-rec scale-[1.02] shadow-xl shadow-primary/25'
                  : isPlaying
                    ? 'recorder-button-play scale-[1.02] shadow-xl shadow-tertiary/25'
                    : 'hover:shadow-xl'
              }`}
            >
              <PrimaryIcon className="h-4 w-4" />
              <span>{primaryButton.label}</span>
            </button>

            <button
              type="button"
              onClick={resetPracticeState}
              disabled={recordingState === 'idle' || recordingState === 'recording'}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-surface-container bg-white py-3 text-sm font-medium text-on-surface/70 transition-colors disabled:cursor-not-allowed disabled:text-on-surface/30"
            >
              <RotateCcw className="h-4 w-4" />
              <span>重新录音</span>
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-surface-container p-4">
          <p className="whitespace-pre-line text-base text-on-surface">
            {loadingWordDetail && !hasAnyPronunciation(detail)
              ? '正在加载音标和发音信息...'
              : detail.meaningCn}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetPracticeState()
            onClose()
          }}
          className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-base font-bold text-white"
        >
          我记住了
        </button>
      </div>
    </div>
  )
}
