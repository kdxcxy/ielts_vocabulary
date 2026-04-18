'use client'

import { useEffect, useRef, useState } from 'react'
import type { JSX, PointerEvent as ReactPointerEvent, UIEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Mic,
  Pen,
  Play,
  RotateCcw,
  Square,
  Star,
  Volume2,
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'
import {
  formatPhoneticForDisplay,
  hasAnyPronunciation,
  needsDictionaryHydration,
  normalizeWordKey,
} from '@/lib/story-word-detail'
import { splitRenderableParagraphs } from '@/lib/story-render'
import {
  formatRecordingDuration,
  getPlaybackCountdownSeconds,
  getRemainingRecordingSeconds,
} from '@/lib/story-recorder'

type Mode = 'read' | 'recall' | 'apply'
type Accent = 'uk' | 'us'

type Story = {
  id: number
  title: string
  content: string
}

type StorySummary = {
  id: number
  title: string
}

type WordDetail = {
  word: string
  contextualTranslation: string
  meaningCn: string
  bookmarkId?: number
  phoneticUs?: string
  phoneticUk?: string
  audioUs?: string
  audioUk?: string
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing'

const STORY_NAV_STORAGE_KEY = 'story-nav-pill-position'

function parseDictionaryPhonetics(data: any) {
  return {
    phoneticUs: data?.phoneticUs || '',
    phoneticUk: data?.phoneticUk || '',
    audioUs: data?.audioUs || '',
    audioUk: data?.audioUk || '',
  }
}

function getDefaultNavPosition(width: number, height: number, safeOffset: number) {
  return {
    x: Math.max(12, window.innerWidth - width - 16),
    y: Math.max(120, window.innerHeight - height - safeOffset),
  }
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

async function postLearningEvent(payload: {
  storyId: number
  viewedWord?: string
  markStoryCompleted?: boolean
}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null

  if (!token) return

  try {
    await fetch('/api/learning-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  } catch {}
}

export default function StoryReadClient({ storyId }: { storyId: string }) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [stories, setStories] = useState<StorySummary[]>([])
  const [mode, setMode] = useState<Mode>('read')
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [wordDetails, setWordDetails] = useState<Record<string, WordDetail>>({})
  const [loadingStory, setLoadingStory] = useState(true)
  const [storyLoadError, setStoryLoadError] = useState('')
  const [loadingWordDetail, setLoadingWordDetail] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [speakingAccent, setSpeakingAccent] = useState<string | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingError, setRecordingError] = useState('')
  const [isNavDimmed, setIsNavDimmed] = useState(false)
  const [isNavDragging, setIsNavDragging] = useState(false)
  const [navDockSide, setNavDockSide] = useState<'left' | 'right' | null>(null)
  const [navPosition, setNavPosition] = useState({ x: 0, y: 0 })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const practiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingUrlRef = useRef<string | null>(null)
  const recordedDurationRef = useRef(0)
  const recordingElapsedRef = useRef(0)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const playbackTimerRef = useRef<number | null>(null)
  const navFadeTimerRef = useRef<number | null>(null)
  const navPressTimerRef = useRef<number | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    moved: boolean
    started: boolean
  } | null>(null)
  const navWidth = 82
  const navHeight = 42
  const bottomNavSafeOffset = 104

  const getViewportBounds = () => {
    if (typeof window === 'undefined') {
      return { maxX: 0, maxY: 0 }
    }

    return {
      maxX: Math.max(12, window.innerWidth - navWidth - 12),
      maxY: Math.max(12, window.innerHeight - navHeight - bottomNavSafeOffset),
    }
  }

  const clampNavPosition = (x: number, y: number) => {
    const { maxX, maxY } = getViewportBounds()
    return {
      x: Math.min(Math.max(12, x), maxX),
      y: Math.min(Math.max(12, y), maxY),
    }
  }

  const getDockedX = (side: 'left' | 'right' | null, fallbackX: number) => {
    if (typeof window === 'undefined') return fallbackX
    const peekWidth = 18
    if (side === 'left') return peekWidth - navWidth
    if (side === 'right') return window.innerWidth - peekWidth
    return fallbackX
  }

  const persistNavPosition = (position: { x: number; y: number }, dockSide: 'left' | 'right' | null) => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        STORY_NAV_STORAGE_KEY,
        JSON.stringify({
          x: position.x,
          y: position.y,
          dockSide,
          hasCustomPosition: true,
        })
      )
    } catch {}
  }

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const defaultPosition = getDefaultNavPosition(navWidth, navHeight, bottomNavSafeOffset)

    try {
      const saved = window.localStorage.getItem(STORY_NAV_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          x?: number
          y?: number
          dockSide?: 'left' | 'right' | null
          hasCustomPosition?: boolean
        }

        const hasCustomPosition = Boolean(parsed.hasCustomPosition)
        const savedDockSide = parsed.dockSide === 'left' || parsed.dockSide === 'right' ? parsed.dockSide : null

        if (!hasCustomPosition || typeof parsed.y !== 'number' || parsed.y < 140) {
          setNavDockSide(null)
          setNavPosition(defaultPosition)
          return
        }

        const clamped = clampNavPosition(
          typeof parsed.x === 'number' ? parsed.x : defaultPosition.x,
          parsed.y
        )
        setNavDockSide(savedDockSide)
        setNavPosition({
          x: savedDockSide ? getDockedX(savedDockSide, clamped.x) : clamped.x,
          y: clamped.y,
        })
      } else {
        setNavDockSide(null)
        setNavPosition(defaultPosition)
      }
    } catch {
      setNavDockSide(null)
      setNavPosition(defaultPosition)
    }

    const handleResize = () => {
      setNavPosition((current) => {
        const clamped = clampNavPosition(
          navDockSide ? getDockedX(navDockSide, current.x) : current.x,
          current.y
        )
        return {
          x: navDockSide ? getDockedX(navDockSide, clamped.x) : clamped.x,
          y: clamped.y,
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [navDockSide])

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
    recordingElapsedRef.current = 0
    recordedDurationRef.current = 0
    setRecordingDuration(0)
    setRecordingError('')
    setRecordingState('idle')
  }

  const closeWordDetail = () => {
    resetPracticeState()
    setSelectedWord(null)
  }

  useEffect(() => {
    if (!storyId) {
      setLoadingStory(false)
      setStoryLoadError('\u9875\u9762\u53c2\u6570\u4e22\u5931')
      return
    }

    let cancelled = false

    const loadStory = async () => {
      setLoadingStory(true)
      setStoryLoadError('')

      try {
        const [storyRes, wordsRes, storiesRes] = await Promise.all([
          fetch(`/api/stories/${storyId}`, { cache: 'no-store' }),
          fetch(`/api/stories/${storyId}/words`, { cache: 'no-store' }),
          fetch('/api/stories', { cache: 'no-store' }),
        ])

        if (!storyRes.ok) {
          throw new Error('\u6545\u4e8b\u52a0\u8f7d\u5931\u8d25')
        }

        if (!wordsRes.ok) {
          throw new Error('\u8bcd\u8868\u52a0\u8f7d\u5931\u8d25')
        }

        if (!storiesRes.ok) {
          throw new Error('\u6545\u4e8b\u5217\u8868\u52a0\u8f7d\u5931\u8d25')
        }

        const storyData = await storyRes.json()
        const wordsData = await wordsRes.json()
        const storiesData = await storiesRes.json()

        if (cancelled) return

        if (!storyData.data) {
          throw new Error('\u6545\u4e8b\u4e0d\u5b58\u5728')
        }

        const nextDetails: Record<string, WordDetail> = {}
        ;(wordsData.data || []).forEach((item: any) => {
          const key = normalizeWordKey(item.word)
          nextDetails[key] = {
            word: item.word,
            contextualTranslation: '',
            meaningCn: item.meaning_cn,
            phoneticUk: item.phonetic_uk || '',
            phoneticUs: item.phonetic_us || '',
            audioUk: item.audio_uk || '',
            audioUs: item.audio_us || '',
          }
        })

        setStory(storyData.data)
        setStories(Array.isArray(storiesData.data) ? storiesData.data : [])
        setWordDetails(nextDetails)
        void postLearningEvent({ storyId: Number(storyId) })
      } catch (error) {
        if (cancelled) return
        setStory(null)
        setStoryLoadError(
          error instanceof Error ? error.message : '\u9875\u9762\u52a0\u8f7d\u5931\u8d25'
        )
      } finally {
        if (!cancelled) {
          setLoadingStory(false)
        }
      }
    }

    loadStory()

    return () => {
      cancelled = true
    }
  }, [storyId])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      practiceAudioRef.current?.pause()
      window.speechSynthesis?.cancel()
      stopRecordingTimer()
      releaseRecordingStream()
      revokeRecordingUrl()
      if (navFadeTimerRef.current !== null) {
        window.clearTimeout(navFadeTimerRef.current)
      }
      if (navPressTimerRef.current !== null) {
        window.clearTimeout(navPressTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) return

    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    resetPracticeState()
  }, [selectedWord?.word])

  const openWordDetail = async (word: string, translation: string) => {
    const key = normalizeWordKey(word)
    const existing = wordDetails[key]
    const nextWordDetail: WordDetail = {
      word,
      contextualTranslation: translation,
      meaningCn: existing?.meaningCn || translation,
      bookmarkId: existing?.bookmarkId,
      phoneticUs: existing?.phoneticUs,
      phoneticUk: existing?.phoneticUk,
      audioUs: existing?.audioUs,
      audioUk: existing?.audioUk,
    }

    setSelectedWord(nextWordDetail)
    setBookmarked(Boolean(existing?.bookmarkId))
    void postLearningEvent({ storyId: Number(storyId), viewedWord: word })

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      try {
        const bookmarkResponse = await fetch(`/api/bookmarks?word=${encodeURIComponent(word)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json()
          const bookmark = bookmarkData.data

          setBookmarked(Boolean(bookmark?.id))
          setSelectedWord((prev) =>
            prev && normalizeWordKey(prev.word) === key
              ? { ...prev, bookmarkId: bookmark?.id }
              : prev
          )
          setWordDetails((current) => ({
            ...current,
            [key]: {
              ...(current[key] || nextWordDetail),
              bookmarkId: bookmark?.id,
            },
          }))
        }
      } catch {}
    }

    if (!needsDictionaryHydration(existing)) {
      return
    }

    setLoadingWordDetail(true)

    try {
      const response = await fetch(`/api/dictionary/${encodeURIComponent(word.toLowerCase())}`, {
        cache: 'no-store',
      })

      if (!response.ok) return

      const data = await response.json()
      const parsed = parseDictionaryPhonetics(data.data)

      setSelectedWord((prev) =>
        prev && normalizeWordKey(prev.word) === key ? { ...prev, ...parsed } : prev
      )

      setWordDetails((current) => ({
        ...current,
        [key]: {
          ...(current[key] || nextWordDetail),
          ...parsed,
        },
      }))
    } catch {
      return
    } finally {
      setLoadingWordDetail(false)
    }
  }

  const speakWord = async (detail: WordDetail, accent: Accent) => {
    const speakingKey = `${detail.word}:${accent}`

    audioRef.current?.pause()
    stopPracticePlayback()
    window.speechSynthesis?.cancel()

    const audioUrl =
      accent === 'uk' ? detail.audioUk || detail.audioUs : detail.audioUs || detail.audioUk

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

    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = pickFemaleVoice(voices, accent)
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setSpeakingAccent(speakingKey)
    utterance.onend = () => setSpeakingAccent(null)
    utterance.onerror = () => setSpeakingAccent(null)

    window.speechSynthesis.speak(utterance)
  }

  const startWordRecording = async () => {
    if (!selectedWord) return

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
      recordingElapsedRef.current = 0
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

        const audioBlob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        recordingUrlRef.current = URL.createObjectURL(audioBlob)
        recordedDurationRef.current = recordingElapsedRef.current
        setRecordingDuration(recordingElapsedRef.current)
        setRecordingState('recorded')
      }

      recorder.start()
      setRecordingState('recording')
      recordingTimerRef.current = window.setInterval(() => {
        recordingElapsedRef.current += 1
        setRecordingDuration(recordingElapsedRef.current)
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

    const fallbackDuration = Math.max(recordedDurationRef.current, 0)
    const audio = new Audio(recordingUrlRef.current)
    practiceAudioRef.current = audio
    setRecordingDuration(fallbackDuration)
    const syncPlaybackCountdown = () => {
      setRecordingDuration(
        getPlaybackCountdownSeconds(
          audio.duration,
          fallbackDuration,
          audio.currentTime
        )
      )
    }

    audio.onloadedmetadata = syncPlaybackCountdown
    audio.oncanplay = syncPlaybackCountdown
    audio.ontimeupdate = syncPlaybackCountdown
    audio.onended = () => {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(fallbackDuration)
      setRecordingState('recorded')
    }
    audio.onerror = () => {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(fallbackDuration)
      setRecordingState('recorded')
      setRecordingError('录音播放失败，请重新录音')
    }

    try {
      setRecordingError('')
      setRecordingState('playing')
      audio.load()
      syncPlaybackCountdown()
      playbackTimerRef.current = window.setInterval(syncPlaybackCountdown, 120)
      await audio.play()
    } catch {
      stopPlaybackTimer()
      practiceAudioRef.current = null
      setRecordingDuration(fallbackDuration)
      setRecordingState('recorded')
      setRecordingError('录音播放失败，请重新录音')
    }
  }

  const stopWordRecordingPlayback = () => {
    stopPracticePlayback()
    setRecordingState('recorded')
  }

  const renderRecordingCard = () => {
    if (!selectedWord) return null

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
      <div className="mb-4 rounded-[2rem] bg-gradient-to-br from-[#fff4f8] to-[#fff0f6] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-on-surface">跟读练习</p>
            <p className="mt-1 text-sm leading-6 text-on-surface/60">
              {recordingState === 'recording'
                ? `请读出：${selectedWord.word}`
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
              <span
                className={`recorder-bar h-2 w-1 rounded-full ${
                  isPlaying ? 'bg-tertiary/70' : 'bg-primary/45'
                }`}
              />
              <span
                className={`recorder-bar recorder-bar-delay-1 h-3 w-1 rounded-full ${
                  isPlaying ? 'bg-tertiary/85' : 'bg-primary/60'
                }`}
              />
              <span
                className={`recorder-bar recorder-bar-delay-2 h-5 w-1 rounded-full ${
                  isPlaying ? 'bg-tertiary' : 'bg-primary'
                }`}
              />
              <span
                className={`recorder-bar recorder-bar-delay-3 h-3 w-1 rounded-full ${
                  isPlaying ? 'bg-tertiary/85' : 'bg-primary/60'
                }`}
              />
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

          <div className="hidden">
            {recordingState === 'recorded' || recordingState === 'playing'
              ? '只保留当前弹框内的本地录音'
              : '录音不会上传或保存'}
          </div>
        </div>
      </div>
    )
  }

  const handleBookmark = () => {
    if (!selectedWord || bookmarkLoading) return

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return

    const wordKey = normalizeWordKey(selectedWord.word)

    setBookmarkLoading(true)

    const request = bookmarked && selectedWord.bookmarkId
      ? fetch(`/api/bookmarks/${selectedWord.bookmarkId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      : fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            word: selectedWord.word,
            translation: selectedWord.meaningCn,
            storyId: +storyId,
          }),
        })

    request
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || data.code !== 200) {
          throw new Error('收藏操作失败')
        }

        const nextBookmarkId = bookmarked ? undefined : data.data?.bookmark?.id

        setBookmarked(!bookmarked)
        setToastMessage(bookmarked ? '已取消收藏' : '收藏成功')
        setSelectedWord((prev) =>
          prev ? { ...prev, bookmarkId: nextBookmarkId } : prev
        )
        setWordDetails((current) => ({
          ...current,
          [wordKey]: {
            ...(current[wordKey] || selectedWord),
            bookmarkId: nextBookmarkId,
          },
        }))
      })
      .catch(() => {
        setToastMessage('收藏操作失败')
      })
      .finally(() => {
        setBookmarkLoading(false)
      })
  }

  const renderAccentRow = (
    detail: WordDetail,
    accent: Accent,
    label: string,
    phonetic: string | undefined
  ) => {
    const speakingKey = `${detail.word}:${accent}`
    const isSpeaking = speakingAccent === speakingKey

    return (
      <button
        type="button"
        onClick={() => speakWord(detail, accent)}
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
              (loadingWordDetail ? '\u6b63\u5728\u52a0\u8f7d...' : `${label}\u5f0f\u97f3\u6807\u5f85\u8865\u5145`)}
          </span>
        </span>
        <Volume2
          className={`h-4 w-4 shrink-0 ${isSpeaking ? 'text-primary' : 'text-on-surface/45'}`}
        />
      </button>
    )
  }

  const parseContent = (content: string) => {
    const paragraphs = splitRenderableParagraphs(content)

    return paragraphs.map((paragraph: string, paragraphIndex: number) => {
      const regex = /([A-Za-z][A-Za-z.\/-]*(?:\s+[A-Za-z][A-Za-z.\/-]*)*)\s+\[([^\]]+)\]/g
      const parts: JSX.Element[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(paragraph)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${paragraphIndex}-${lastIndex}`}>
              {paragraph.slice(lastIndex, match.index)}
            </span>
          )
        }

        const word = match[1]
        const translation = match[2]

        if (mode === 'read') {
          parts.push(
            <span key={`word-${paragraphIndex}-${match.index}`}>
              <span
                onClick={() => openWordDetail(word, translation)}
                className="mx-1 cursor-pointer font-medium text-primary hover:text-primary-container"
              >
                {word}
              </span>
              <span className="mx-1 text-sm text-on-surface/60">[{translation}]</span>
            </span>
          )
        } else if (mode === 'recall') {
          parts.push(
            <span key={`word-${paragraphIndex}-${match.index}`}>
              <span
                onClick={() => openWordDetail(word, translation)}
                className="mx-1 cursor-pointer font-medium text-primary hover:text-primary-container"
              >
                {word}
              </span>
              <span className="mx-1 text-sm text-on-surface/30">[    ]</span>
            </span>
          )
        } else {
          parts.push(
            <span key={`word-${paragraphIndex}-${match.index}`}>
              <span
                onClick={() => openWordDetail(word, translation)}
                className="mx-1 cursor-pointer font-medium text-primary/30 hover:text-primary-container"
              >
                ______
              </span>
              <span className="mx-1 text-sm text-on-surface/60">[{translation}]</span>
            </span>
          )
        }

        lastIndex = regex.lastIndex
      }

      if (lastIndex < paragraph.length) {
        parts.push(
          <span key={`text-${paragraphIndex}-${lastIndex}`}>{paragraph.slice(lastIndex)}</span>
        )
      }

      return (
        <p key={`para-${paragraphIndex}`} className="mb-6 last:mb-0">
          {parts}
        </p>
      )
    })
  }

  const currentStoryIndex = stories.findIndex((item) => item.id === Number(storyId))
  const previousStory = currentStoryIndex > 0 ? stories[currentStoryIndex - 1] : null
  const nextStory =
    currentStoryIndex >= 0 && currentStoryIndex < stories.length - 1
      ? stories[currentStoryIndex + 1]
      : null

  const navigateStory = (targetStoryId: number | undefined) => {
    if (!targetStoryId) return
    closeWordDetail()
    router.push(`/stories/${targetStoryId}`)
  }

  const triggerNavDimmed = () => {
    setIsNavDimmed(true)
    if (navFadeTimerRef.current !== null) {
      window.clearTimeout(navFadeTimerRef.current)
    }
    navFadeTimerRef.current = window.setTimeout(() => {
      setIsNavDimmed(false)
    }, 900)
  }

  const handleStoryScroll = (_event: UIEvent<HTMLDivElement>) => {
    triggerNavDimmed()
  }

  const handleNavPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return

    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - navPosition.x,
      offsetY: event.clientY - navPosition.y,
      moved: false,
      started: false,
    }

    if (navPressTimerRef.current !== null) {
      window.clearTimeout(navPressTimerRef.current)
    }

    navPressTimerRef.current = window.setTimeout(() => {
      const dragState = dragStateRef.current
      if (!dragState || dragState.pointerId !== event.pointerId) return
      dragState.started = true
      setIsNavDragging(true)
      setNavDockSide(null)
      event.currentTarget.setPointerCapture(event.pointerId)
    }, 220)
  }

  const handleNavPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId || !dragState.started) return

    const next = clampNavPosition(
      event.clientX - dragState.offsetX,
      event.clientY - dragState.offsetY
    )
    dragState.moved = true
    setNavPosition(next)
  }

  const handleNavPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    if (navPressTimerRef.current !== null) {
      window.clearTimeout(navPressTimerRef.current)
      navPressTimerRef.current = null
    }

    if (!dragState.started) {
      dragStateRef.current = null
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragStateRef.current = null
    setIsNavDragging(false)

    const midpoint = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
    const nextDockSide = navPosition.x + navWidth / 2 < midpoint ? 'left' : 'right'
    const dockedX = getDockedX(nextDockSide, navPosition.x)
    const clamped = clampNavPosition(
      nextDockSide === 'left' ? 12 : dockedX - 36,
      navPosition.y
    )

    setNavDockSide(nextDockSide)
    const nextPosition = {
      x: getDockedX(nextDockSide, clamped.x),
      y: clamped.y,
    }
    setNavPosition(nextPosition)
    persistNavPosition(nextPosition, nextDockSide)
  }

  if (loadingStory) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-on-surface/60">{'\u52a0\u8f7d\u4e2d...'}</p>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
        <p className="text-base font-semibold text-on-surface">{'\u9875\u9762\u52a0\u8f7d\u5931\u8d25'}</p>
        <p className="text-sm text-on-surface/60">
          {storyLoadError || '\u8bf7\u7a0d\u540e\u91cd\u8bd5'}
        </p>
        <Link
          href="/stories"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          {'\u8fd4\u56de\u6545\u4e8b\u5217\u8868'}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-br from-primary to-primary-container px-4 pt-14 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center">
              <Link
                href="/stories"
                className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <h1 className="break-words whitespace-normal text-base font-bold leading-snug text-white">
                {story.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="-mt-3 mb-2 px-4">
          <div className="flex rounded-2xl bg-surface-container-lowest p-2 shadow-lg">
            {[
              { icon: BookOpen, label: '\u8bed\u5883\u8bc6\u8bcd', value: 'read' as Mode },
              { icon: Brain, label: '\u5fc6\u5883\u4f1a\u8bcd', value: 'recall' as Mode },
              { icon: Pen, label: '\u5316\u5883\u7528\u8bcd', value: 'apply' as Mode },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setMode(item.value)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-colors ${
                  mode === item.value ? 'bg-primary text-white' : 'text-on-surface/50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-20" onScroll={handleStoryScroll}>
        <div className="rounded-2xl bg-surface-container-lowest p-6 text-base leading-loose text-on-surface shadow-sm">
          {parseContent(story.content)}
        </div>
      </div>

      {selectedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeWordDetail}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-bold text-on-surface">{selectedWord.word}</h3>
              </div>
              <button
                onClick={handleBookmark}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container"
                disabled={bookmarkLoading}
              >
                <Star
                  className={`h-5 w-5 ${
                    bookmarked ? 'fill-primary text-primary' : 'text-primary'
                  } ${bookmarkLoading ? 'opacity-50' : ''}`}
                />
              </button>
            </div>

            <div className="mb-4 space-y-2">
              {renderAccentRow(selectedWord, 'uk', '\u82f1', selectedWord.phoneticUk)}
              {renderAccentRow(selectedWord, 'us', '\u7f8e', selectedWord.phoneticUs)}
            </div>

            {renderRecordingCard()}

            <div className="mb-6 rounded-xl bg-surface-container p-4">
              <p className="whitespace-pre-line text-base text-on-surface">
                {loadingWordDetail && !hasAnyPronunciation(selectedWord)
                  ? '\u6b63\u5728\u52a0\u8f7d\u97f3\u6807\u548c\u53d1\u97f3\u4fe1\u606f...'
                  : selectedWord.meaningCn}
              </p>
            </div>

            <button
              onClick={closeWordDetail}
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-base font-bold text-white"
            >
              {'\u6211\u8bb0\u4f4f\u4e86'}
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-on-surface/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          {toastMessage}
        </div>
      )}

      <div
        className={`fixed z-40 rounded-full bg-white/62 p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] ring-1 ring-white/80 backdrop-blur-lg transition-[opacity,transform,left] duration-300 ${
          isNavDimmed && !isNavDragging ? 'scale-95 opacity-45' : 'opacity-100'
        } ${isNavDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        style={{
          left: `${navPosition.x}px`,
          top: `${navPosition.y}px`,
        }}
        onPointerDown={handleNavPointerDown}
        onPointerMove={handleNavPointerMove}
        onPointerUp={handleNavPointerUp}
        onPointerCancel={handleNavPointerUp}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigateStory(previousStory?.id)}
            disabled={!previousStory}
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:text-on-surface/25 disabled:hover:bg-transparent"
            aria-label="上一篇"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-black/8" />
          <button
            type="button"
            onClick={() => navigateStory(nextStory?.id)}
            disabled={!nextStory}
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:text-on-surface/25 disabled:hover:bg-transparent"
            aria-label="下一篇"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
