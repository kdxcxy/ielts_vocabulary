'use client'

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Bookmark, Brain, Pen, Volume2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'
import {
  formatPhoneticForDisplay,
  hasAnyPronunciation,
  needsDictionaryHydration,
  normalizeWordKey,
} from '@/lib/story-word-detail'
import { splitRenderableParagraphs } from '@/lib/story-render'

type Mode = 'read' | 'recall' | 'apply'
type Accent = 'uk' | 'us'

type Story = {
  id: number
  title: string
  content: string
}

type WordDetail = {
  word: string
  contextualTranslation: string
  meaningCn: string
  phoneticUs?: string
  phoneticUk?: string
  audioUs?: string
  audioUk?: string
}

function parseDictionaryPhonetics(data: any) {
  return {
    phoneticUs: data?.phoneticUs || '',
    phoneticUk: data?.phoneticUk || '',
    audioUs: data?.audioUs || '',
    audioUk: data?.audioUk || '',
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

export default function StoryReadClient({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<Story | null>(null)
  const [mode, setMode] = useState<Mode>('read')
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [wordDetails, setWordDetails] = useState<Record<string, WordDetail>>({})
  const [loadingStory, setLoadingStory] = useState(true)
  const [storyLoadError, setStoryLoadError] = useState('')
  const [loadingWordDetail, setLoadingWordDetail] = useState(false)
  const [speakingAccent, setSpeakingAccent] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
        const [storyRes, wordsRes] = await Promise.all([
          fetch(`/api/stories/${storyId}`, { cache: 'no-store' }),
          fetch(`/api/stories/${storyId}/words`, { cache: 'no-store' }),
        ])

        if (!storyRes.ok) {
          throw new Error('\u6545\u4e8b\u52a0\u8f7d\u5931\u8d25')
        }

        if (!wordsRes.ok) {
          throw new Error('\u8bcd\u8868\u52a0\u8f7d\u5931\u8d25')
        }

        const storyData = await storyRes.json()
        const wordsData = await wordsRes.json()

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
        setWordDetails(nextDetails)
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
      window.speechSynthesis?.cancel()
    }
  }, [])

  const openWordDetail = async (word: string, translation: string) => {
    const key = normalizeWordKey(word)
    const existing = wordDetails[key]
    const nextWordDetail: WordDetail = {
      word,
      contextualTranslation: translation,
      meaningCn: existing?.meaningCn || translation,
      phoneticUs: existing?.phoneticUs,
      phoneticUk: existing?.phoneticUk,
      audioUs: existing?.audioUs,
      audioUk: existing?.audioUk,
    }

    setSelectedWord(nextWordDetail)

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

  const handleBookmark = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (bookmarked) {
      fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wordId: 0, storyId: +storyId }),
      })
    }
    setBookmarked(!bookmarked)
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

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-20">
        <div className="rounded-2xl bg-surface-container-lowest p-6 text-base leading-loose text-on-surface shadow-sm">
          {parseContent(story.content)}
        </div>
      </div>

      {selectedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedWord(null)}
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
              >
                <Bookmark
                  className={`h-5 w-5 ${bookmarked ? 'fill-primary text-primary' : 'text-primary'}`}
                />
              </button>
            </div>

            <div className="mb-4 space-y-2">
              {renderAccentRow(selectedWord, 'uk', '\u82f1', selectedWord.phoneticUk)}
              {renderAccentRow(selectedWord, 'us', '\u7f8e', selectedWord.phoneticUs)}
            </div>

            <div className="mb-6 rounded-xl bg-surface-container p-4">
              <p className="whitespace-pre-line text-base text-on-surface">
                {loadingWordDetail && !hasAnyPronunciation(selectedWord)
                  ? '\u6b63\u5728\u52a0\u8f7d\u97f3\u6807\u548c\u53d1\u97f3\u4fe1\u606f...'
                  : selectedWord.meaningCn}
              </p>
            </div>

            <button
              onClick={() => setSelectedWord(null)}
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-base font-bold text-white"
            >
              {'\u6211\u8bb0\u4f4f\u4e86'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
